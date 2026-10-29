import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IssuerController } from './issuer.controller';
import { IssuerService } from './issuer.service';

describe('IssuerController', () => {
  let controller: IssuerController;
  let issuerService: { getCurrentDid: jest.Mock; setCurrentDid: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssuerController],
      providers: [
        {
          provide: IssuerService,
          useFactory: () => ({
            getCurrentDid: jest.fn(),
            setCurrentDid: jest.fn(),
          }),
        },
      ],
    }).compile();

    controller = module.get<IssuerController>(IssuerController);
    issuerService = module.get(IssuerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET returns { did } when the service resolves one', async () => {
    issuerService.getCurrentDid.mockResolvedValue('did:rcw:issuer-1');
    const result = await controller.getIssuer('INST-1');
    expect(result).toEqual({ did: 'did:rcw:issuer-1' });
    expect(issuerService.getCurrentDid).toHaveBeenCalledWith('INST-1');
  });

  it('GET propagates NotFoundException when the service throws it', async () => {
    issuerService.getCurrentDid.mockRejectedValue(new NotFoundException('not found'));
    await expect(controller.getIssuer('INST-missing')).rejects.toThrow(NotFoundException);
  });

  it('PUT calls issuerService.setCurrentDid(instituteOsid, did) and returns { instituteOsid, did }', async () => {
    issuerService.setCurrentDid.mockResolvedValue({
      instituteOsid: 'INST-1',
      currentDid: 'did:rcw:issuer-2',
    });
    const result = await controller.setIssuer('INST-1', { did: 'did:rcw:issuer-2' });
    expect(issuerService.setCurrentDid).toHaveBeenCalledWith('INST-1', 'did:rcw:issuer-2');
    expect(result).toEqual({ instituteOsid: 'INST-1', did: 'did:rcw:issuer-2' });
  });
});
