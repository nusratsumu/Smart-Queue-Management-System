import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { QueuesModule } from './queues/queues.module';
import { TicketsModule } from './tickets/tickets.module';
import { CountersModule } from './counters/counters.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [AuthModule, UsersModule, ServicesModule, QueuesModule, TicketsModule, CountersModule, NotificationsModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
