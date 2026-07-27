import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  private async safeSend(options: { to: string; subject: string; text: string }): Promise<void> {
    const TIMEOUT_MS = 8000;
    try {
      await Promise.race([
        this.mailerService.sendMail(options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Mail send timed out')), TIMEOUT_MS),
        ),
      ]);
    } catch (err) {
      this.logger.warn(`Failed to send email to ${options.to}: ${(err as Error).message}`);
    }
  }

  async sendWelcomeEmail(to: string, fullName: string) {
    await this.safeSend({
      to,
      subject: 'Welcome to QMS – Account Created',
      text: `Welcome, ${fullName}! Your account has been created.`,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    await this.safeSend({
      to,
      subject: 'Password Reset Request',
      text: `Use this token to reset your password (expires in 15 min): ${resetToken}`,
    });
  }

  async sendTicketReadyEmail(to: string, ticketNumber: string, queueName: string) {
    await this.safeSend({
      to,
      subject: `Your Ticket is Ready – #${ticketNumber}`,
      text: `Your ticket ${ticketNumber} in queue ${queueName} is ready.`,
    });
  }
}
