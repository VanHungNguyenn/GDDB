import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DocxGeneratorService } from './docx-generator.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, DocxGeneratorService],
  exports: [ReportsService],
})
export class ReportsModule {}
