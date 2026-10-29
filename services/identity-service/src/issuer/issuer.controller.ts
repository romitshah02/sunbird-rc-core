import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiNotFoundResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { IssuerService } from './issuer.service';
import { SetIssuerDidDTO } from './dtos/Issuer.dto';

@ApiTags('Issuer')
@Controller('issuer')
export class IssuerController {
  constructor(private readonly issuerService: IssuerService) {}

  @ApiOkResponse({ description: 'Current signing DID for the institute' })
  @ApiNotFoundResponse({ description: 'No DID assigned to this institute' })
  @ApiParam({ name: 'instituteOsid' })
  @Get(':instituteOsid')
  async getIssuer(@Param('instituteOsid') instituteOsid: string): Promise<{ did: string }> {
    const did = await this.issuerService.getCurrentDid(instituteOsid);
    return { did };
  }

  @ApiOkResponse({ description: 'Issuer DID assigned' })
  @ApiBody({ type: SetIssuerDidDTO })
  @ApiParam({ name: 'instituteOsid' })
  @Put(':instituteOsid')
  async setIssuer(
    @Param('instituteOsid') instituteOsid: string,
    @Body() body: SetIssuerDidDTO,
  ): Promise<{ instituteOsid: string; did: string }> {
    const row = await this.issuerService.setCurrentDid(instituteOsid, body.did);
    return { instituteOsid: row.instituteOsid, did: row.currentDid };
  }
}
