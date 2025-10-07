import { Injectable, NotFoundException } from '@nestjs/common';
import { AssignmentStatus, Prisma, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Contractors approval
  listPendingContractors() {
    return this.prisma.contractor.findMany({
      where: { verification: VerificationStatus.PENDING },
      orderBy: { businessName: 'asc' },
      include: { user: true },
    });
  }

  async approveContractor(id: string, note?: string, actorUserId?: string) {
    const updated = await this.prisma.contractor.update({
      where: { id },
      data: { verification: VerificationStatus.APPROVED, verificationNote: note },
    });
    await this.audit('APPROVE_CONTRACTOR', 'Contractor', id, `Approved${note ? ': ' + note : ''}`, actorUserId);
    return updated;
  }

  async rejectContractor(id: string, reason: string, actorUserId?: string) {
    const updated = await this.prisma.contractor.update({
      where: { id },
      data: { verification: VerificationStatus.REJECTED, verificationNote: reason },
    });
    await this.audit('REJECT_CONTRACTOR', 'Contractor', id, reason, actorUserId);
    return updated;
  }

  // Leads queue
  listLeadQueue(limit = 50) {
    return this.prisma.lead.findMany({
      where: { job: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async runRandomMatch(leadId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    // Filter contractors by basic compatibility (service & area)
    const contractors = await this.prisma.contractor.findMany({
      where: {
        verification: VerificationStatus.APPROVED,
        AND: [
          { OR: [ { services: { has: lead.serviceType } }, { services: { isEmpty: true } } ] },
          { OR: [ { serviceAreas: { has: lead.location } }, { serviceAreas: { isEmpty: true } } ] },
        ],
      },
    });

    // Simple scoring based on successRate, experience, responseTime
    const results = contractors
      .map((c) => {
        const score = (c.successRate * 0.6) + (Math.min(c.experience, 20) / 20) * 0.3 + (1 - Math.min(c.responseTime, 24) / 24) * 0.1;
        const reasons = [
          `successRate:${c.successRate.toFixed(2)}`,
          `exp:${c.experience}`,
          `respH:${c.responseTime}`,
        ];
        return { contractor: c, score, reasons };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Persist logs and create OFFERED assignments
    for (const r of results) {
      await this.prisma.matchLog.create({
        data: {
          leadId: lead.id,
          contractorId: r.contractor.id,
          score: r.score,
          reasons: r.reasons,
        },
      });
      await this.prisma.leadAssignment.upsert({
        where: {
          leadId_contractorId: {
            leadId: lead.id,
            contractorId: r.contractor.id,
          },
        },
        create: {
          leadId: lead.id,
          contractorId: r.contractor.id,
          status: AssignmentStatus.OFFERED,
        },
        update: { status: AssignmentStatus.OFFERED },
      });
    }

    return {
      lead,
      matches: results.map((r) => ({
        contractorId: r.contractor.id,
        businessName: r.contractor.businessName,
        score: Number(r.score.toFixed(3)),
        reasons: r.reasons,
      })),
    };
  }

  listAssignments(leadId: string) {
    return this.prisma.leadAssignment.findMany({
      where: { leadId },
      include: { contractor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignLead(leadId: string, contractorId: string, actorUserId?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const contractor = await this.prisma.contractor.findUnique({ where: { id: contractorId } });
    if (!contractor) throw new NotFoundException('Contractor not found');

    // Create Job if not exists
    const job = await this.prisma.job.upsert({
      where: { leadId: lead.id },
      update: { contractorId, customerId: lead.customerId, status: 'Pending' },
      create: { leadId: lead.id, contractorId, customerId: lead.customerId, status: 'Pending' },
    });

    // Update assignments statuses
    await this.prisma.leadAssignment.updateMany({
      where: { leadId },
      data: { status: AssignmentStatus.EXPIRED },
    });
    await this.prisma.leadAssignment.upsert({
      where: {
        leadId_contractorId: { leadId, contractorId },
      },
      update: { status: AssignmentStatus.ASSIGNED },
      create: { leadId, contractorId, status: AssignmentStatus.ASSIGNED },
    });

    // Update lead status
    await this.prisma.lead.update({ where: { id: lead.id }, data: { status: 'assigned' } });

    await this.audit('ASSIGN_LEAD', 'Lead', leadId, `Assigned to contractor ${contractorId}`, actorUserId);
    return { jobId: job.id, leadId, contractorId };
  }

  // Promotions CRUD
  listPromotions(q?: string, category?: string) {
    const where: Prisma.PromotionWhereInput = {
      AND: [
        category ? { category: { contains: category, mode: 'insensitive' } } : {},
        q ? { OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ] } : {},
      ],
    };
    return this.prisma.promotion.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  getPromotion(id: string) {
    return this.prisma.promotion.findUnique({ where: { id } });
  }
  createPromotion(body: any) {
    return this.prisma.promotion.create({ data: body });
  }
  updatePromotion(id: string, body: any) {
    return this.prisma.promotion.update({ where: { id }, data: body });
  }
  deletePromotion(id: string) {
    return this.prisma.promotion.delete({ where: { id } });
  }

  // News CRUD
  listNews(q?: string, category?: string) {
    const where: Prisma.NewsWhereInput = {
      AND: [
        category ? { category: { contains: category, mode: 'insensitive' } } : {},
        q ? { OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ] } : {},
      ],
    };
    return this.prisma.news.findMany({ where, orderBy: { publishedAt: 'desc' } });
  }
  getNews(id: string) {
    return this.prisma.news.findUnique({ where: { id } });
  }
  createNews(body: any) {
    return this.prisma.news.create({ data: body });
  }
  updateNews(id: string, body: any) {
    return this.prisma.news.update({ where: { id }, data: body });
  }
  deleteNews(id: string) {
    return this.prisma.news.delete({ where: { id } });
  }

  private async audit(action: string, entityType: string, entityId: string, message?: string, actorUserId?: string) {
    await this.prisma.auditLog.create({
      data: { action, entityType, entityId, message, actorUserId },
    });
  }
}
