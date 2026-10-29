import { Module } from '@nestjs/common';
import { IssuerController } from './issuer.controller';
import { IssuerService } from './issuer.service';
import { PrismaService } from '../utils/prisma.service';

@Module({
  controllers: [IssuerController],
  providers: [IssuerService, PrismaService],
})
export class IssuerModule {}
