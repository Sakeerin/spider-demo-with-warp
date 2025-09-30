import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminContractorsController } from './controllers/admin.contractors.controller';
import { AdminLeadsController } from './controllers/admin.leads.controller';
import { AdminContentController } from './controllers/admin.content.controller';
import { AdminService } from './services/admin.service';

@Module({
  controllers: [
    AdminContractorsController,
    AdminLeadsController,
    AdminContentController,
  ],
  providers: [PrismaService, AdminService],
})
export class AdminModule {}
