import { IsEnum } from 'class-validator';
import { QueueStatus } from '../../common/enums/queue-status.enum';

export class UpdateQueueStatusDto {
  @IsEnum(QueueStatus)
  status: QueueStatus;
}
