import { Module } from '@nestjs/common';
import { EvaluationDomainsController } from './evaluation-domains.controller';
import { EvaluationDomainsService } from './evaluation-domains.service';

@Module({
  controllers: [EvaluationDomainsController],
  providers: [EvaluationDomainsService],
  exports: [EvaluationDomainsService],
})
export class EvaluationDomainsModule {}
