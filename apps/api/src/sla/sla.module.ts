import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SlaProcessor } from './sla.processor';
import { SlaService } from './sla.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'sla' })],
  providers: [PrismaService, SlaProcessor, SlaService],
  exports: [SlaService],
})
export class SlaModule {}
