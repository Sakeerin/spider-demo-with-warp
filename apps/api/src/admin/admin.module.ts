import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminContractorsController } from './controllers/admin.contractors.controller';
import { AdminLeadsController } from './controllers/admin.leads.controller';
import { AdminContentController } from './controllers/admin.content.controller';
import { AdminService } from './services/admin.service';
import { AdminCrmLeadsController } from './controllers/admin.crm.leads.controller';
import { SlaModule } from '../sla/sla.module';

@Module({
  imports: [SlaModule],
  controllers: [
    AdminContractorsController,
    AdminLeadsController,
    AdminContentController,
    AdminCrmLeadsController,
  ],
  providers: [PrismaService, AdminService],
})
export class AdminModule {}
