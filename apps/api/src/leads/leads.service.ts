import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async list(pagination: { page: number; pageSize: number }) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.lead.count(),
      this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
    ]);
    return {
      data: items,
      meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
    };
  }

  async get(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  create(data: {
    customerId: string;
    serviceType: string;
    description: string;
    location: string;
    budgetMin: number;
    budgetMax: number;
    urgency: string;
    status: string;
  }) {
    return this.prisma.lead.create({ data });
  }

  async update(id: string, data: Partial<{ 
    serviceType: string;
    description: string;
    location: string;
    budgetMin: number;
    budgetMax: number;
    urgency: string;
    status: string;
  }>) {
    await this.get(id);
    return this.prisma.lead.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.get(id);
    return this.prisma.lead.delete({ where: { id } });
  }
}
