import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EvaluationIndicator } from '@prisma/client';

export class EvaluationSectionItemDto {
  @IsUUID()
  domainId: string;

  @IsOptional()
  @IsEnum(EvaluationIndicator)
  indicator?: EvaluationIndicator;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateEvaluationSectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationSectionItemDto)
  sections: EvaluationSectionItemDto[];
}
