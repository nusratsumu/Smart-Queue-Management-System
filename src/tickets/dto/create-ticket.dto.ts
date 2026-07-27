import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsInt()
  @IsPositive()
  serviceId: number;

  @IsInt()
  @IsPositive()
  queueId: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  priority?: string; // e.g. 'normal' | 'urgent' — defaults to 'normal' in the entity
}