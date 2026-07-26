import { IsEnum } from 'class-validator';
import { CounterStatus } from '../../common/enums/counter-status.enum';

export class UpdateCounterStatusDto {
  @IsEnum(CounterStatus)
  status!: CounterStatus;
}
