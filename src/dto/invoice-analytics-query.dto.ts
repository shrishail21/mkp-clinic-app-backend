import { IsIn, IsMongoId, IsOptional } from 'class-validator';

export class InvoiceAnalyticsQueryDto {
  @IsMongoId()
  clinicId: string;

  @IsOptional()
  @IsIn(['today', 'month', 'year'])
  period?: 'today' | 'month' | 'year' = 'today';
}