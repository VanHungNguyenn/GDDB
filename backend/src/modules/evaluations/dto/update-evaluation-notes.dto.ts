import { IsOptional, IsString } from 'class-validator';

export class UpdateEvaluationNotesDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
