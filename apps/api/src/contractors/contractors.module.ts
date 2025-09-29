import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractorsService } from './contractors.service';
import { ContractorsController } from './contractors.controller';

@Module({
  controllers: [ContractorsController],
  providers: [ContractorsService, PrismaService],
})
export class ContractorsModule {}
