import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationSectionsDto } from './dto/update-evaluation-results.dto';
import { UpdateEvaluationNotesDto } from './dto/update-evaluation-notes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private evaluationsService: EvaluationsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateEvaluationDto) {
    return this.evaluationsService.create(userId, dto);
  }

  @Get()
  findByClass(
    @Query('classId') classId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.evaluationsService.findByClass(classId, year, month, userId);
  }

  @Get('by-student')
  findByStudentAndMonth(
    @Query('studentId') studentId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.evaluationsService.findByStudentAndMonth(
      studentId,
      year,
      month,
      userId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.evaluationsService.findOne(id, userId);
  }

  @Patch(':id/sections')
  updateSections(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEvaluationSectionsDto,
  ) {
    return this.evaluationsService.updateSections(id, userId, dto);
  }

  @Patch(':id/notes')
  updateNotes(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEvaluationNotesDto,
  ) {
    return this.evaluationsService.updateNotes(id, userId, dto);
  }

  @Post(':id/finalize')
  finalize(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.evaluationsService.finalize(id, userId);
  }
}
