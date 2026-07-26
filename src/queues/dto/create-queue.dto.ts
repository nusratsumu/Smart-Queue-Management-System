import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateQueueDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  location: string;

  @IsInt()
  @IsPositive()
  serviceId: number;
}
