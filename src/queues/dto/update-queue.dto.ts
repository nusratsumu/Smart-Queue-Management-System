import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateQueueDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  location?: string;
}
