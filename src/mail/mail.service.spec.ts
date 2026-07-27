import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let mailerService: { sendMail: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: { sendMail: jest.fn() } },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sendWelcomeEmail calls mailerService.sendMail with the right content', async () => {
    mailerService.sendMail.mockResolvedValue(undefined);
    await service.sendWelcomeEmail('a@test.com', 'Test User');
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@test.com', subject: expect.stringContaining('Welcome') }),
    );
  });

  it('sendPasswordResetEmail calls mailerService.sendMail with the right content', async () => {
    mailerService.sendMail.mockResolvedValue(undefined);
    await service.sendPasswordResetEmail('a@test.com', 'reset-token-123');
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@test.com',
        text: expect.stringContaining('reset-token-123'),
      }),
    );
  });

  it('sendTicketReadyEmail calls mailerService.sendMail with the right content', async () => {
    mailerService.sendMail.mockResolvedValue(undefined);
    await service.sendTicketReadyEmail('a@test.com', 'Q7-005', 'Counter Q7');
    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@test.com', subject: expect.stringContaining('Q7-005') }),
    );
  });

  it('never throws when mailerService.sendMail rejects — logs and resolves instead', async () => {
    mailerService.sendMail.mockRejectedValue(new Error('SMTP connection refused'));
    await expect(service.sendWelcomeEmail('a@test.com', 'Test User')).resolves.toBeUndefined();
  });

  it('never throws when mailerService.sendMail hangs — times out and resolves instead', async () => {
    mailerService.sendMail.mockImplementation(() => new Promise(() => {})); // never resolves
    await expect(service.sendWelcomeEmail('a@test.com', 'Test User')).resolves.toBeUndefined();
  }, 15000);
});
