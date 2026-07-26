import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsInt()
  @IsPositive()
  serviceId: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  priority?: string; // e.g. 'normal' | 'urgent' — defaults to 'normal' in the entity
}