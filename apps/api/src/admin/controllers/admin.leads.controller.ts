import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin Leads')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('admin/leads')
export class AdminLeadsController {
  constructor(private readonly admin: AdminService) {}

  @Get('queue')
  @Roles('admin', 'coordinator')
  queue(@Query('limit') limit = '50') {
    return this.admin.listLeadQueue(parseInt(limit, 10) || 50);
  }

  @Post(':id/match')
  @Roles('admin', 'coordinator')
  match(@Param('id') id: string) {
    return this.admin.runRandomMatch(id);
  }

  @Get(':id/assignments')
  @Roles('admin', 'coordinator')
  assignments(@Param('id') id: string) {
    return this.admin.listAssignments(id);
  }

  @Post(':id/assign')
  @Roles('admin', 'coordinator')
  assign(@Param('id') id: string, @Body() body: { contractorId: string; actorUserId?: string }) {
    return this.admin.assignLead(id, body.contractorId, body?.actorUserId);
  }
}
