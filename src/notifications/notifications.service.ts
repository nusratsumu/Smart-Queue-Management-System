import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notifications } from './notifications.entity';
import { NotificationType } from '../common/enums/notification-type.enum';
import { NotificationStatus } from '../common/enums/notification-status.enum';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notifications)
        private readonly notificationsRepository: Repository<Notifications>,
      ) {}

      async create(
        userId: number,
        type: NotificationType,
        message: string,
        status: NotificationStatus = NotificationStatus.SENT,
      ): Promise<Notifications> {
        const notification = this.notificationsRepository.create({
          user: { id: userId } as any,
          type,
          message,
          status,
        });
        return this.notificationsRepository.save(notification);
      }

      async findMyNotifications(userId: number): Promise<Notifications[]> {
        return this.notificationsRepository.find({
          where: { user: { id: userId } },
          order: { sentAt: 'DESC' },
          
        });
      }

}
