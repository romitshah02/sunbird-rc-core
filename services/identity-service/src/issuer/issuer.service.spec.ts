import { NotFoundException } from '@nestjs/common';
import { IssuerService } from './issuer.service';
import { PrismaService } from '../utils/prisma.service';
import { createPrismaServiceOrMock } from '../utils/test-infra.util';

describe('IssuerService', () => {
  let service: IssuerService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = await createPrismaServiceOrMock();
    service = new IssuerService(prisma);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns currentDid for an existing row', async () => {
    const instituteOsid = `INST-${Date.now()}`;
    await service.setCurrentDid(instituteOsid, 'did:rcw:issuer-1');

    const did = await service.getCurrentDid(instituteOsid);
    expect(did).toEqual('did:rcw:issuer-1');
  });

  it('throws NotFoundException when no row exists for the instituteOsid', async () => {
    await expect(service.getCurrentDid(`INST-missing-${Date.now()}`)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates a new row when none exists (upsert create branch)', async () => {
    const instituteOsid = `INST-create-${Date.now()}`;
    const row = await service.setCurrentDid(instituteOsid, 'did:rcw:first');
    expect(row.instituteOsid).toEqual(instituteOsid);
    expect(row.currentDid).toEqual('did:rcw:first');
  });

  it('updates currentDid in place when a row already exists (upsert update branch)', async () => {
    const instituteOsid = `INST-update-${Date.now()}`;
    await service.setCurrentDid(instituteOsid, 'did:rcw:first');
    await service.setCurrentDid(instituteOsid, 'did:rcw:second');

    const did = await service.getCurrentDid(instituteOsid);
    expect(did).toEqual('did:rcw:second');
  });
});
