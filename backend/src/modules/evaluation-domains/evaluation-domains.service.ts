import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';

@Injectable()
export class EvaluationDomainsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.evaluationDomain.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const domain = await this.prisma.evaluationDomain.findUnique({
      where: { id },
    });
    if (!domain) {
      throw new NotFoundException('Evaluation domain not found');
    }
    return domain;
  }

  async create(dto: CreateDomainDto) {
    return this.prisma.evaluationDomain.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateDomainDto) {
    await this.findOne(id);
    return this.prisma.evaluationDomain.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.evaluationDomain.delete({ where: { id } });
  }
}
