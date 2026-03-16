import { IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
