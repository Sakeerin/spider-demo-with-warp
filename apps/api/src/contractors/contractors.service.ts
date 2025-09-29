import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async list(pagination: { page: number; pageSize: number }) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.contractor.count(),
      this.prisma.contractor.findMany({ orderBy: { businessName: 'asc' }, skip, take: pageSize }),
    ]);
    return {
      data: items,
      meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
    };
  }

  async get(id: string) {
    const contractor = await this.prisma.contractor.findUnique({ where: { id } });
    if (!contractor) throw new NotFoundException('Contractor not found');
    return contractor;
  }

  create(data: {
    userId: string;
    businessName: string;
    experience?: number;
    successRate?: number;
    responseTime?: number;
  }) {
    return this.prisma.contractor.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        experience: data.experience ?? 0,
        successRate: data.successRate ?? 0,
        responseTime: data.responseTime ?? 0,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      businessName: string;
      experience: number;
      successRate: number;
      responseTime: number;
    }>,
  ) {
    await this.get(id);
    return this.prisma.contractor.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.get(id);
    return this.prisma.contractor.delete({ where: { id } });
  }
}
