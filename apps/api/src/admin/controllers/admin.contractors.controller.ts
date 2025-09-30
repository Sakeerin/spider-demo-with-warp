import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtGuard } from '../../auth/jwt.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin Contractors')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('admin/contractors')
export class AdminContractorsController {
  constructor(private readonly admin: AdminService) {}

  @Get('pending')
  @Roles('admin')
  listPending() {
    return this.admin.listPendingContractors();
  }

  @Post(':id/approve')
  @Roles('admin')
  approve(@Param('id') id: string, @Body() body: { note?: string; actorUserId?: string }) {
    return this.admin.approveContractor(id, body?.note, body?.actorUserId);
  }

  @Post(':id/reject')
  @Roles('admin')
  reject(@Param('id') id: string, @Body() body: { reason: string; actorUserId?: string }) {
    return this.admin.rejectContractor(id, body?.reason, body?.actorUserId);
  }
}
