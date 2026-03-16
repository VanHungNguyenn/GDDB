import { IsString, MinLength, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @IsUUID()
  classId: string;
}
