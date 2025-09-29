import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, PrismaService],
})
export class LeadsModule {}
