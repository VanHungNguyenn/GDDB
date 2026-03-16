import { Controller, Get, Param, Query, ParseIntPipe, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('student/:studentId')
  getStudentMonthlyReport(
    @Param('studentId') studentId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.reportsService.getStudentMonthlyReport(
      studentId,
      year,
      month,
      userId,
    );
  }

  @Get('student/:studentId/docx')
  async downloadDocx(
    @Param('studentId') studentId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.reportsService.generateDocx(
      studentId,
      year,
      month,
      userId,
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get('student/:studentId/pdf')
  async downloadPdf(
    @Param('studentId') studentId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.reportsService.generatePdf(
      studentId,
      year,
      month,
      userId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
