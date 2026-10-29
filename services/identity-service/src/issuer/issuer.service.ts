import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../utils/prisma.service';
import { Issuer } from '@prisma/client';

// Thin, swappable pointer from an institute to its CURRENT signing DID.
// Deliberately does not generate keys or DIDs itself — `/did/generate` stays
// the sole way to mint a DID; this service only tracks the assignment.
@Injectable()
export class IssuerService {
  constructor(private prisma: PrismaService) {}

  async getCurrentDid(instituteOsid: string): Promise<string> {
    let row: Issuer;
    try {
      row = await this.prisma.issuer.findUnique({ where: { instituteOsid } });
    } catch (err) {
      Logger.error(`Error fetching issuer for institute ${instituteOsid}: ${err}`);
      throw new InternalServerErrorException(`Error fetching issuer for institute ${instituteOsid}`);
    }
    if (!row) throw new NotFoundException(`No issuer DID assigned for institute ${instituteOsid}`);
    return row.currentDid;
  }

  async setCurrentDid(instituteOsid: string, did: string): Promise<Issuer> {
    try {
      return await this.prisma.issuer.upsert({
        where: { instituteOsid },
        update: { currentDid: did },
        create: { instituteOsid, currentDid: did },
      });
    } catch (err) {
      Logger.error(`Error upserting issuer for institute ${instituteOsid}: ${err}`);
      throw new InternalServerErrorException(`Error upserting issuer for institute ${instituteOsid}`);
    }
  }
}
