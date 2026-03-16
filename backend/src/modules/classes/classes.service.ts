import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(teacherId: string, dto: CreateClassDto) {
    return this.prisma.class.create({
      data: {
        name: dto.name,
        teacherId,
      },
      include: { _count: { select: { students: true } } },
    });
  }

  async findAll(userId: string, role: string) {
    const where = role === 'ADMIN' ? {} : { teacherId: userId };

    return this.prisma.class.findMany({
      where,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        students: { orderBy: { lastName: 'asc' } },
        _count: { select: { students: true } },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }
    if (role !== 'ADMIN' && classEntity.teacherId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return classEntity;
  }

  async update(id: string, userId: string, role: string, dto: UpdateClassDto) {
    await this.findOne(id, userId, role);

    return this.prisma.class.update({
      where: { id },
      data: dto,
      include: { _count: { select: { students: true } } },
    });
  }

  async remove(id: string, userId: string, role: string) {
    await this.findOne(id, userId, role);

    return this.prisma.class.delete({ where: { id } });
  }
}
