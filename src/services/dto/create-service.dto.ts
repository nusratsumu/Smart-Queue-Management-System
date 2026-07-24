import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @IsPositive()
  estimatedTime: number; // in minutes

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  department: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
