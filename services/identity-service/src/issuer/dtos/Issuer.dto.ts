import { ApiProperty } from '@nestjs/swagger';

export class SetIssuerDidDTO {
  @ApiProperty({ description: "The DID to assign as this institute's current signing DID." })
  did: string;
}
