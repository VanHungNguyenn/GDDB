import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  private async verifyClassAccess(classId: string, userId: string, role: string) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }
    if (role !== 'ADMIN' && classEntity.teacherId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return classEntity;
  }

  async create(userId: string, role: string, dto: CreateStudentDto) {
    await this.verifyClassAccess(dto.classId, userId, role);

    return this.prisma.student.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        parentName: dto.parentName,
        parentPhone: dto.parentPhone,
        classId: dto.classId,
      },
    });
  }

  async findAllByClass(
    classId: string,
    userId: string,
    role: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Student>> {
    await this.verifyClassAccess(classId, userId, role);

    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where: { classId },
        orderBy: { lastName: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.student.count({ where: { classId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, role: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        evaluations: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12,
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (role !== 'ADMIN' && student.class.teacherId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return student;
  }

  async update(id: string, userId: string, role: string, dto: UpdateStudentDto) {
    const student = await this.findOne(id, userId, role);

    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : student.dateOfBirth,
      },
    });
  }

  async remove(id: string, userId: string, role: string) {
    await this.findOne(id, userId, role);

    return this.prisma.student.delete({ where: { id } });
  }
}
