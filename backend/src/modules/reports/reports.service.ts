import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocxGeneratorService, ReportData } from './docx-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private docxGenerator: DocxGeneratorService,
    private pdfGenerator: PdfGeneratorService,
  ) {}

  async getStudentMonthlyReport(
    studentId: string,
    year: number,
    month: number,
    teacherId: string,
  ): Promise<ReportData> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          include: {
            teacher: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.class.teacherId !== teacherId) {
      throw new ForbiddenException('Access denied');
    }

    const evaluation = await this.prisma.evaluation.findUnique({
      where: {
        studentId_year_month: { studentId, year, month },
      },
      include: {
        sections: {
          include: { domain: true },
          orderBy: { domain: { order: 'asc' } },
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundException(
        `No evaluation found for ${month}/${year}`,
      );
    }

    const teacher = student.class.teacher;

    return {
      student: {
        id: student.id,
        name: `${student.lastName} ${student.firstName}`,
        dateOfBirth: student.dateOfBirth,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        className: student.class.name,
      },
      evaluation: {
        id: evaluation.id,
        month: evaluation.month,
        year: evaluation.year,
        status: evaluation.status,
        notes: evaluation.notes,
        teacherName: `${teacher.lastName} ${teacher.firstName}`,
        finalizedAt: evaluation.finalizedAt,
      },
      sections: evaluation.sections.map((section) => ({
        domain: section.domain.name,
        note: section.note,
        indicator: section.indicator,
      })),
    };
  }

  async generateDocx(
    studentId: string,
    year: number,
    month: number,
    teacherId: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const reportData = await this.getStudentMonthlyReport(
      studentId,
      year,
      month,
      teacherId,
    );

    const buffer = await this.docxGenerator.generateEvaluationDocx(reportData);

    const safeName = reportData.student.name.replace(/\s+/g, '_');
    const fileName = `KHGDCN_${safeName}_T${month}_${year}.docx`;

    return { buffer, fileName };
  }

  async generatePdf(
    studentId: string,
    year: number,
    month: number,
    teacherId: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const reportData = await this.getStudentMonthlyReport(
      studentId,
      year,
      month,
      teacherId,
    );

    const buffer = await this.pdfGenerator.generateEvaluationPdf(reportData);

    const safeName = reportData.student.name.replace(/\s+/g, '_');
    const fileName = `KHGDCN_${safeName}_T${month}_${year}.pdf`;

    return { buffer, fileName };
  }
}
