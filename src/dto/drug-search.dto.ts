import { IsString, MaxLength } from 'class-validator';

export class DrugSearchDto {
  @IsString()
  @MaxLength(100)
  name: string;
}