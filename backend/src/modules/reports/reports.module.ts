import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DocxGeneratorService } from './docx-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, DocxGeneratorService, PdfGeneratorService],
  exports: [ReportsService],
})
export class ReportsModule {}
