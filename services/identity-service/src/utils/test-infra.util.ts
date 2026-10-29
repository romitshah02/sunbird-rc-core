// Test-only helper: use the real Postgres/Vault dev instances when they're
// reachable (so specs exercise real Prisma/Vault behavior), fall back to a
// minimal in-memory fake when they're not (so `npm test` still runs without
// docker up). Production code never imports this.
import { PrismaService } from './prisma.service';
import { VaultService } from './vault.service';

function createInMemoryPrismaMock(): any {
  const store = new Map<string, any>();
  const issuerStore = new Map<string, any>();
  return {
    identity: {
      create: jest.fn(async ({ data }: any) => {
        const record = { ...data };
        store.set(data.id, record);
        return record;
      }),
      findUnique: jest.fn(async ({ where }: any) => store.get(where.id) ?? null),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = store.get(where.id);
        if (!existing) throw new Error('Record to update not found.');
        const record = { ...existing, ...data };
        store.set(where.id, record);
        return record;
      }),
    },
    issuer: {
      findUnique: jest.fn(async ({ where }: any) => issuerStore.get(where.instituteOsid) ?? null),
      upsert: jest.fn(async ({ where, update, create }: any) => {
        const existing = issuerStore.get(where.instituteOsid);
        const row = existing ? { ...existing, ...update } : { ...create };
        issuerStore.set(where.instituteOsid, row);
        return row;
      }),
    },
    $disconnect: jest.fn(async () => undefined),
  };
}

function createInMemoryVaultMock(): any {
  const store = new Map<string, any>();
  return {
    writePvtKey: jest.fn(async (secret: object, name: string) => {
      store.set(name, secret);
      return secret;
    }),
    readPvtKey: jest.fn(async (name: string) => store.get(name) ?? null),
    mergePvtKey: jest.fn(async (secret: object, name: string) => {
      const merged = { ...(store.get(name) || {}), ...secret };
      store.set(name, merged);
      return merged;
    }),
    deletePvtKey: jest.fn(async (name: string) => {
      const existed = store.delete(name);
      return { data: { deleted: existed } };
    }),
  };
}

export async function createPrismaServiceOrMock(): Promise<PrismaService> {
  try {
    const prisma = new PrismaService();
    await prisma.$queryRaw`SELECT 1`;
    return prisma;
  } catch {
    return createInMemoryPrismaMock();
  }
}

export async function createVaultServiceOrMock(): Promise<VaultService> {
  const vault = new VaultService();
  try {
    await vault.readPvtKey('__connectivity_probe__');
    return vault;
  } catch (err: any) {
    // A genuine 404 (tagged isVaultError by hashi-vault-js) means Vault IS
    // reachable, the probe key just doesn't exist — use the real client.
    // Any other error (connection refused, timeout, auth failure) means
    // Vault isn't usable right now — fall back to the in-memory fake.
    if (err?.isVaultError && err?.response?.status === 404) return vault;
    return createInMemoryVaultMock();
  }
}
