import { IsUUID, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateEvaluationDto {
  @IsUUID()
  studentId: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
