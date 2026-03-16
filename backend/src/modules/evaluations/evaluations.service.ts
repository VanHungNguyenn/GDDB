import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EvaluationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationSectionsDto } from './dto/update-evaluation-results.dto';
import { UpdateEvaluationNotesDto } from './dto/update-evaluation-notes.dto';

// Shared include for consistent evaluation responses
const EVALUATION_INCLUDE = {
  student: true,
  sections: {
    include: { domain: true },
    orderBy: { domain: { order: 'asc' as const } },
  },
  finalizedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
};

@Injectable()
export class EvaluationsService {
  constructor(private prisma: PrismaService) {}

  private async verifyStudentOwnership(studentId: string, teacherId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.class.teacherId !== teacherId) {
      throw new ForbiddenException('Access denied');
    }
    return student;
  }

  private async findEvaluationWithAccess(id: string, teacherId: string) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id },
      include: {
        student: { include: { class: true } },
        sections: {
          include: { domain: true },
          orderBy: { domain: { order: 'asc' } },
        },
        finalizedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }
    if (evaluation.student.class.teacherId !== teacherId) {
      throw new ForbiddenException('Access denied');
    }
    return evaluation;
  }

  async create(teacherId: string, dto: CreateEvaluationDto) {
    await this.verifyStudentOwnership(dto.studentId, teacherId);

    // Check for duplicate month/year
    const existing = await this.prisma.evaluation.findUnique({
      where: {
        studentId_year_month: {
          studentId: dto.studentId,
          year: dto.year,
          month: dto.month,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Evaluation for ${dto.month}/${dto.year} already exists for this student`,
      );
    }

    // Get all evaluation domains to auto-create sections
    const allDomains = await this.prisma.evaluationDomain.findMany({
      orderBy: { order: 'asc' },
    });

    return this.prisma.evaluation.create({
      data: {
        studentId: dto.studentId,
        teacherId,
        year: dto.year,
        month: dto.month,
        notes: dto.notes,
        sections: {
          create: allDomains.map((domain) => ({
            domainId: domain.id,
          })),
        },
      },
      include: EVALUATION_INCLUDE,
    });
  }

  async findByStudentAndMonth(
    studentId: string,
    year: number,
    month: number,
    teacherId: string,
  ) {
    await this.verifyStudentOwnership(studentId, teacherId);

    const evaluation = await this.prisma.evaluation.findUnique({
      where: {
        studentId_year_month: { studentId, year, month },
      },
      include: EVALUATION_INCLUDE,
    });

    if (!evaluation) {
      throw new NotFoundException(
        `No evaluation found for ${month}/${year}`,
      );
    }

    return evaluation;
  }

  async findByClass(classId: string, year: number, month: number, teacherId: string) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }
    if (classEntity.teacherId !== teacherId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.evaluation.findMany({
      where: {
        year,
        month,
        student: { classId },
      },
      include: EVALUATION_INCLUDE,
      orderBy: { student: { lastName: 'asc' } },
    });
  }

  async findOne(id: string, teacherId: string) {
    return this.findEvaluationWithAccess(id, teacherId);
  }

  async updateSections(
    id: string,
    teacherId: string,
    dto: UpdateEvaluationSectionsDto,
  ) {
    const evaluation = await this.findEvaluationWithAccess(id, teacherId);

    if (evaluation.status === EvaluationStatus.FINALIZED) {
      throw new BadRequestException('Cannot modify a finalized evaluation');
    }

    // Upsert each section
    await Promise.all(
      dto.sections.map((item) =>
        this.prisma.evaluationSection.upsert({
          where: {
            evaluationId_domainId: {
              evaluationId: id,
              domainId: item.domainId,
            },
          },
          update: {
            indicator: item.indicator ?? null,
            note: item.note ?? null,
          },
          create: {
            evaluationId: id,
            domainId: item.domainId,
            indicator: item.indicator ?? null,
            note: item.note ?? null,
          },
        }),
      ),
    );

    return this.findEvaluationWithAccess(id, teacherId);
  }

  async updateNotes(id: string, teacherId: string, dto: UpdateEvaluationNotesDto) {
    const evaluation = await this.findEvaluationWithAccess(id, teacherId);

    if (evaluation.status === EvaluationStatus.FINALIZED) {
      throw new BadRequestException('Cannot modify a finalized evaluation');
    }

    return this.prisma.evaluation.update({
      where: { id },
      data: { notes: dto.notes },
      include: EVALUATION_INCLUDE,
    });
  }

  async finalize(id: string, teacherId: string) {
    const evaluation = await this.findEvaluationWithAccess(id, teacherId);

    if (evaluation.status === EvaluationStatus.FINALIZED) {
      throw new BadRequestException('Evaluation is already finalized');
    }

    return this.prisma.evaluation.update({
      where: { id },
      data: {
        status: EvaluationStatus.FINALIZED,
        finalizedAt: new Date(),
        finalizedById: teacherId,
      },
      include: EVALUATION_INCLUDE,
    });
  }
}
