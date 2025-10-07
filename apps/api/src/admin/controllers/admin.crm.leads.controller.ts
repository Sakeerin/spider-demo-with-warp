import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtGuard } from '../../auth/jwt.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SlaService } from '../../sla/sla.service';

@ApiTags('Admin CRM Leads')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('admin/crm/leads')
export class AdminCrmLeadsController {
  private s3?: S3Client;
  private bucket?: string;
  constructor(private prisma: PrismaService, private sla: SlaService) {
    if (process.env.AWS_S3_BUCKET && process.env.AWS_S3_REGION) {
      this.bucket = process.env.AWS_S3_BUCKET;
      this.s3 = new S3Client({ region: process.env.AWS_S3_REGION });
    }
  }

  // List with filters
  @Get()
  @Roles('admin','coordinator','sales')
  list(@Query('q') q?: string, @Query('status') status?: string, @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const take = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const where: Prisma.LeadWhereInput = {
      active: true,
      AND: [
        q ? { OR: [
          { contactName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { mobilePhone: { contains: q } },
          { company: { name: { contains: q, mode: 'insensitive' } } },
        ] } : {},
        status ? { status } : {},
      ],
    };
    return this.prisma.$transaction([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (p-1)*take, take, include: { company: true, sales: true } }),
    ]).then(([total, data]) => ({ data, meta: { total, page: p, pageSize: take, pageCount: Math.ceil(total/take) } }));
  }

  // Create manual lead
  @Post()
  @Roles('admin','coordinator','sales')
  async create(@Body() body: any) {
    const company = body.companyName ? await this.prisma.company.upsert({
      where: { name: body.companyName },
      update: {},
      create: { name: body.companyName, email: body.companyEmail, phone: body.companyPhone },
    }) : null;

    // duplicate detection by email/mobile/company
    const dup = await this.prisma.lead.findFirst({
      where: {
        OR: [
          body.email ? { email: { equals: body.email, mode: 'insensitive' } } : undefined,
          body.mobilePhone ? { mobilePhone: { equals: body.mobilePhone } } : undefined,
          company ? { companyId: company.id } : undefined,
        ].filter(Boolean) as any,
      },
    });

    const lead = await this.prisma.lead.create({
      data: {
        customerId: body.customerId || 'manual',
        companyId: company?.id,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        mobilePhone: body.mobilePhone,
        email: body.email,
        contactAt: body.contactAt ? new Date(body.contactAt) : null,
        source: body.source,
        salesId: body.salesId || null,
        serviceType: body.serviceType || 'general',
        description: body.description || body.detail || '',
        location: body.location || 'N/A',
        budgetMin: body.budgetMin || 0,
        budgetMax: body.budgetMax || 0,
        urgency: body.urgency || 'medium',
        status: body.status || 'First Contact',
        followUpAt: body.followUpAt ? new Date(body.followUpAt) : null,
        detail: body.detail,
        productType: body.productType,
        adType: body.adType,
        remark: body.remark,
      },
      include: { company: true, sales: true },
    });

    await this.prisma.leadActivity.create({
      data: { leadId: lead.id, type: 'create', message: 'Manual new lead', meta: body },
    });

    // Schedule first-touch SLA timer
    await this.sla.scheduleFirstTouch(lead.id);

    return { lead, duplicate: dup ? { id: dup.id, accountNumber: dup.accountNumber } : null };
  }

  // Get lead
  @Get(':id')
  @Roles('admin','coordinator','sales')
  get(@Param('id') id: string) {
    return this.prisma.lead.findUnique({ where: { id }, include: { company: true, sales: true, attachments: true, tasks: true, activities: true, labels: { include: { label: true } } } });
  }

  // Update
  @Patch(':id')
  @Roles('admin','coordinator','sales')
  async update(@Param('id') id: string, @Body() body: any) {
    const lead = await this.prisma.lead.update({ where: { id }, data: body });
    await this.prisma.leadActivity.create({ data: { leadId: id, type: 'update', message: 'Lead updated', meta: body } });
    return lead;
  }

  // Archive (soft delete)
  @Post(':id/archive')
  @Roles('admin','coordinator')
  async archive(@Param('id') id: string) {
    const lead = await this.prisma.lead.update({ where: { id }, data: { active: false, archivedAt: new Date() } });
    await this.prisma.leadActivity.create({ data: { leadId: id, type: 'archive', message: 'Lead archived' } });
    return { ok: true, id: lead.id };
  }

  // Assign to sales
  @Post(':id/assign-sales')
  @Roles('admin','coordinator')
  async assignSales(@Param('id') id: string, @Body() body: { salesId: string; reason?: string }) {
    const lead = await this.prisma.lead.update({ where: { id }, data: { salesId: body.salesId } });
    await this.prisma.leadActivity.create({ data: { leadId: id, type: 'assign', message: `Assigned to sales ${body.salesId}`, meta: { reason: body.reason } } });
    // reschedule SLA from assignment time
    await this.sla.scheduleFirstTouch(id);
    return lead;
  }

  // List sales users for assignment dropdown
  @Get('sales-users')
  @Roles('admin','coordinator','sales')
  async listSalesUsers() {
    const users = await this.prisma.user.findMany({ where: { role: 'sales' }, select: { id: true, email: true } });
    return { data: users };
  }

  // Create task
  @Post(':id/tasks')
  @Roles('admin','coordinator','sales')
  async createTask(@Param('id') id: string, @Body() body: { title: string; dueAt?: string; ownerId?: string; reminderAt?: string }) {
    const task = await this.prisma.leadTask.create({ data: { leadId: id, title: body.title, dueAt: body.dueAt ? new Date(body.dueAt) : null, ownerId: body.ownerId || null, reminderAt: body.reminderAt ? new Date(body.reminderAt) : null } });
    await this.prisma.leadActivity.create({ data: { leadId: id, type: 'task', message: `Task created: ${body.title}` } });
    return task;
  }

  @Get(':id/tasks')
  @Roles('admin','coordinator','sales')
  listTasks(@Param('id') id: string) {
    return this.prisma.leadTask.findMany({ where: { leadId: id }, orderBy: { dueAt: 'asc' } });
  }

  // Bulk actions
  @Post('bulk')
  @Roles('admin','coordinator')
  async bulk(@Body() body: { ids: string[]; action: string; value?: any }) {
    const ids = body.ids || [];
    if (body.action === 'assignSales' && body.value?.salesId) {
      await this.prisma.lead.updateMany({ where: { id: { in: ids } }, data: { salesId: body.value.salesId } });
    } else if (body.action === 'status' && body.value?.status) {
      await this.prisma.lead.updateMany({ where: { id: { in: ids } }, data: { status: body.value.status } });
    } else if (body.action === 'label' && body.value?.labelName) {
      const label = await this.prisma.label.upsert({ where: { name: body.value.labelName }, update: {}, create: { name: body.value.labelName } });
      for (const id of ids) {
        await this.prisma.leadLabel.upsert({ where: { leadId_labelId: { leadId: id, labelId: label.id } }, update: {}, create: { leadId: id, labelId: label.id } });
      }
    }
    await this.prisma.leadActivity.createMany({ data: ids.map((id) => ({ leadId: id, type: 'bulk', message: `Bulk ${body.action}`, meta: body })) });
    return { ok: true };
  }

  // Upload attachment (local storage)
  @Post(':id/attachments')
  @Roles('admin','coordinator','sales')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadAttachment(@Param('id') id: string, @UploadedFile() file: any) {
    let url: string;
    if (this.s3 && this.bucket) {
      const key = `leads/${id}/${Date.now()}_${file.originalname}`;
      await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
      url = `https://${this.bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
    } else {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      const dest = path.join(uploadDir, `${Date.now()}_${file.originalname}`);
      fs.writeFileSync(dest, file.buffer);
      url = `/uploads/${path.basename(dest)}`;
    }
    const att = await this.prisma.leadAttachment.create({ data: { leadId: id, fileName: file.originalname, url, contentType: file.mimetype, size: file.size } });
    await this.prisma.leadActivity.create({ data: { leadId: id, type: 'attachment', message: `Attached ${file.originalname}` } });
    return att;
  }

  // Import preview (CSV/XLSX)
  @Post('import/preview')
  @Roles('admin','coordinator')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async importPreview(@UploadedFile() file: any) {
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
    // Basic validation and duplicate flags
    const preview = await Promise.all(rows.map(async (r) => {
      const dup = await this.prisma.lead.findFirst({ where: { OR: [ r.email ? { email: { equals: r.email, mode: 'insensitive' } } : undefined, r.mobilePhone ? { mobilePhone: r.mobilePhone } : undefined ].filter(Boolean) as any } });
      return { ...r, _duplicate: dup ? { id: dup.id, accountNumber: dup.accountNumber } : null };
    }));
    return { preview, count: preview.length };
  }

  // Import commit
  @Post('import/commit')
  @Roles('admin','coordinator')
  async importCommit(@Body() body: { rows: any[] }) {
    const createdIds: string[] = [];
    for (const r of body.rows || []) {
      const company = r.companyName ? await this.prisma.company.upsert({ where: { name: r.companyName }, update: {}, create: { name: r.companyName } }) : null;
      const lead = await this.prisma.lead.create({ data: {
        customerId: 'import', companyId: company?.id, contactName: r.contactName, contactPhone: r.contactPhone, mobilePhone: r.mobilePhone, email: r.email, source: r.source || 'import', serviceType: r.serviceType || 'general', description: r.description || '', location: r.location || 'N/A', budgetMin: Number(r.budgetMin || 0), budgetMax: Number(r.budgetMax || 0), urgency: r.urgency || 'medium', status: r.status || 'First Contact'
      }});
      createdIds.push(lead.id);
    }
    return { ok: true, created: createdIds.length, ids: createdIds };
  }

  // Scoring
  @Post(':id/score')
  @Roles('admin','coordinator','sales')
  async score(@Param('id') id: string, @Body() body: { weights?: any }) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: { company: true } });
    if (!lead) return { ok: false };
    const w = Object.assign({ profile: 0.4, behavior: 0.3, recency: 0.3, sourceBoost: { Ads: -5, Referral: 10 } }, body.weights || {});
    const profile = (lead.company?.name ? 1 : 0.5) * 100; // placeholder
    const behavior = 50; // TODO: integrate events
    const days = Math.max(1, (Date.now() - new Date(lead.createdAt).getTime()) / 86400000);
    const recency = Math.max(0, 100 - days * 10);
    const sourceAdj = (w.sourceBoost[lead.source || ''] || 0);
    const score = Math.round(profile * w.profile + behavior * w.behavior + recency * w.recency) + sourceAdj;
    const band = score >= 180 ? 'High' : score >= 120 ? 'Medium' : 'Low';
    await this.prisma.lead.update({ where: { id }, data: { score, scoreBand: band } });
    await this.prisma.leadActivity.create({ data: { leadId: id, type: 'score', message: `Scored ${score} (${band})` } });
    return { score, band };
  }

  // Routing - load-balanced assignment to least-loaded sales
  @Post('route/load-balance')
  @Roles('admin','coordinator')
  async routeLoadBalance(@Body() body: { leadIds: string[] }) {
    const sales = await this.prisma.user.findMany({ where: { role: 'sales' } });
    if (sales.length === 0) return { ok: false, error: 'NO_SALES' };
    // Count open leads per sales
    const counts: Record<string, number> = {};
    for (const s of sales) {
      counts[s.id] = await this.prisma.lead.count({ where: { salesId: s.id, active: true } });
    }
    const assigned: { leadId: string; salesId: string }[] = [];
    for (const lid of body.leadIds || []) {
      const pick = sales.sort((a,b)=>counts[a.id]-counts[b.id])[0];
      await this.prisma.lead.update({ where: { id: lid }, data: { salesId: pick.id } });
      counts[pick.id]++;
      assigned.push({ leadId: lid, salesId: pick.id });
      await this.prisma.leadActivity.create({ data: { leadId: lid, type: 'assign', message: `Auto-assign to ${pick.id}` } });
    }
    return { ok: true, assigned };
  }

  // Merge leads
  @Post('merge')
  @Roles('admin','coordinator')
  async merge(@Body() body: { targetId: string; sourceIds: string[]; prefer?: any }) {
    const target = await this.prisma.lead.findUnique({ where: { id: body.targetId }, include: { attachments: true, tasks: true, labels: true } });
    if (!target) return { ok: false };
    for (const sid of body.sourceIds || []) {
      if (sid === body.targetId) continue;
      const src = await this.prisma.lead.findUnique({ where: { id: sid }, include: { attachments: true, tasks: true, labels: true } });
      if (!src) continue;
      // Field-level merge (prefer target unless prefer specifies)
      const patch: any = {};
      for (const k of ['contactName','mobilePhone','email','companyId','description']) {
        if ((!target as any) && (src as any)[k]) patch[k] = (src as any)[k];
        if (body.prefer && body.prefer[k] === 'source' && (src as any)[k]) patch[k] = (src as any)[k];
      }
      if (Object.keys(patch).length) await this.prisma.lead.update({ where: { id: target.id }, data: patch });
      // Move child relations
      for (const att of src.attachments) await this.prisma.leadAttachment.update({ where: { id: att.id }, data: { leadId: target.id } });
      for (const t of src.tasks) await this.prisma.leadTask.update({ where: { id: t.id }, data: { leadId: target.id } });
      for (const ll of src.labels) await this.prisma.leadLabel.upsert({ where: { leadId_labelId: { leadId: target.id, labelId: ll.labelId } }, update: {}, create: { leadId: target.id, labelId: ll.labelId } });
      // Archive source
      await this.prisma.lead.update({ where: { id: src.id }, data: { active: false, archivedAt: new Date() } });
      await this.prisma.leadActivity.create({ data: { leadId: target.id, type: 'merge', message: `Merged ${src.id} into target` } });
    }
    return { ok: true, targetId: target.id };
  }
}
