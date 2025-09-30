import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin Content')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('admin')
export class AdminContentController {
  constructor(private readonly admin: AdminService) {}

  // Promotions
  @Get('promotions')
  @Roles('admin')
  getPromotions() {
    return this.admin.listPromotions();
  }

  @Post('promotions')
  @Roles('admin')
  createPromotion(@Body() body: any) {
    return this.admin.createPromotion(body);
  }

  @Patch('promotions/:id')
  @Roles('admin')
  updatePromotion(@Param('id') id: string, @Body() body: any) {
    return this.admin.updatePromotion(id, body);
  }

  @Delete('promotions/:id')
  @Roles('admin')
  deletePromotion(@Param('id') id: string) {
    return this.admin.deletePromotion(id);
  }

  // News
  @Get('news')
  @Roles('admin')
  getNews() {
    return this.admin.listNews();
  }

  @Post('news')
  @Roles('admin')
  createNews(@Body() body: any) {
    return this.admin.createNews(body);
  }

  @Patch('news/:id')
  @Roles('admin')
  updateNews(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateNews(id, body);
  }

  @Delete('news/:id')
  @Roles('admin')
  deleteNews(@Param('id') id: string) {
    return this.admin.deleteNews(id);
  }
}
