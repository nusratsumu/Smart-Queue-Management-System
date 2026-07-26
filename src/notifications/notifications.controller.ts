import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard';
import { CurrentUser } from '../common/current-user.decorator';
import { NotificationsService } from './notifications.service';

 @Controller('notifications')
 export class NotificationsController {
    
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @UseGuards(JwtGuard)

  getMyNotifications(@CurrentUser('id') userId: number) {
    return this.notificationsService.findMyNotifications(userId);

  }
}
