import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassesModule } from './modules/classes/classes.module';
import { StudentsModule } from './modules/students/students.module';
import { EvaluationDomainsModule } from './modules/evaluation-domains/evaluation-domains.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ClassesModule,
    StudentsModule,
    EvaluationDomainsModule,
    EvaluationsModule,
    ReportsModule,
    UsersModule,
  ],
})
export class AppModule {}
