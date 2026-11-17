import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateDrugDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  content: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  company: string;
}
