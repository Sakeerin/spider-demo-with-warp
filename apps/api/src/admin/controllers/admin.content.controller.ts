import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UploadedFile, UseInterceptors, Query, NotFoundException } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import * as multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Admin Content')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('admin')
export class AdminContentController {
  private s3?: S3Client;
  private bucket?: string;
  constructor(private readonly admin: AdminService, private prisma: PrismaService) {
    if (process.env.AWS_S3_BUCKET && process.env.AWS_S3_REGION) {
      this.bucket = process.env.AWS_S3_BUCKET;
      this.s3 = new S3Client({ region: process.env.AWS_S3_REGION });
    }
  }

  // Promotions
  @Get('promotions')
  @Roles('admin')
  getPromotions(@Query('q') q?: string, @Query('category') category?: string) {
    return this.admin.listPromotions(q, category);
  }

  @Post('promotions')
  @Roles('admin')
  createPromotion(@Body() body: any) {
    return this.admin.createPromotion(body);
  }

  @Get('promotions/:id')
  @Roles('admin')
  getPromotion(@Param('id') id: string) {
    return this.admin.getPromotion(id);
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

  // Upload promotion image -> push URL into images[]
  @Post('promotions/:id/images')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadPromotionImage(@Param('id') id: string, @UploadedFile() file: any) {
    let url: string;
    if (this.s3 && this.bucket) {
      const key = `content/promotions/${id}/${Date.now()}_${file.originalname}`;
      await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
      url = `https://${this.bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
    } else {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      const dest = path.join(uploadDir, `${Date.now()}_${file.originalname}`);
      fs.writeFileSync(dest, file.buffer);
      url = `/uploads/${path.basename(dest)}`;
    }
    const updated = await this.prisma.promotion.update({ where: { id }, data: { images: { push: url } } });
    return { url, promotion: updated };
  }

  // Remove promotion image by url or index
  @Delete('promotions/:id/images')
  @Roles('admin')
  async deletePromotionImage(@Param('id') id: string, @Query('url') url?: string, @Query('index') index?: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    let images = Array.isArray(promo.images) ? [...promo.images] : [];
    if (url) {
      images = images.filter((u) => u !== url);
    } else if (typeof index === 'string') {
      const i = parseInt(index, 10);
      if (!isNaN(i) && i >= 0 && i < images.length) images.splice(i, 1);
    }
    const updated = await this.prisma.promotion.update({ where: { id }, data: { images: { set: images } } });
    return { ok: true, images: updated.images };
  }

  // News
  @Get('news')
  @Roles('admin')
  getNews(@Query('q') q?: string, @Query('category') category?: string) {
    return this.admin.listNews(q, category);
  }

  @Post('news')
  @Roles('admin')
  createNews(@Body() body: any) {
    return this.admin.createNews(body);
  }

  @Get('news/:id')
  @Roles('admin')
  getNewsById(@Param('id') id: string) {
    return this.admin.getNews(id);
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

  // Upload news image -> push URL into images[]
  @Post('news/:id/images')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadNewsImage(@Param('id') id: string, @UploadedFile() file: any) {
    let url: string;
    if (this.s3 && this.bucket) {
      const key = `content/news/${id}/${Date.now()}_${file.originalname}`;
      await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
      url = `https://${this.bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
    } else {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      const dest = path.join(uploadDir, `${Date.now()}_${file.originalname}`);
      fs.writeFileSync(dest, file.buffer);
      url = `/uploads/${path.basename(dest)}`;
    }
    const updated = await this.prisma.news.update({ where: { id }, data: { images: { push: url } } });
    return { url, news: updated };
  }

  // Remove news image by url or index
  @Delete('news/:id/images')
  @Roles('admin')
  async deleteNewsImage(@Param('id') id: string, @Query('url') url?: string, @Query('index') index?: string) {
    const item = await this.prisma.news.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('News not found');
    let images = Array.isArray(item.images) ? [...item.images] : [];
    if (url) {
      images = images.filter((u) => u !== url);
    } else if (typeof index === 'string') {
      const i = parseInt(index, 10);
      if (!isNaN(i) && i >= 0 && i < images.length) images.splice(i, 1);
    }
    const updated = await this.prisma.news.update({ where: { id }, data: { images: { set: images } } });
    return { ok: true, images: updated.images };
  }
}
