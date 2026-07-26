import { IsInt, IsPositive } from 'class-validator';

export class AssignStaffDto {
  @IsInt()
  @IsPositive()
  staffId: number;
}
