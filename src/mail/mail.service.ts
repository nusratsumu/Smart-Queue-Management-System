import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(to: string, fullName: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Welcome to QMS – Account Created',
      text: `Welcome, ${fullName}! Your account has been created.`,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Password Reset Request',
      text: `Use this token to reset your password (expires in 15 min): ${resetToken}`,
    });
  }

  async sendTicketReadyEmail(to: string, ticketNumber: string, queueName: string) {
    await this.mailerService.sendMail({
      to,
      subject: `Your Ticket is Ready – #${ticketNumber}`,
      text: `Your ticket ${ticketNumber} in queue ${queueName} is ready.`,
    });
  }
}