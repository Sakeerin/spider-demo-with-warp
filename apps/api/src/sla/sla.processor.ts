import { OnQueueActive, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

@Processor('sla')
export class SlaProcessor {
  constructor(private prisma: PrismaService) {}

  @Process('first-touch')
  async handleFirstTouch(job: Job<{ leadId: string }>) {
    const { leadId } = job.data;
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return;
    // If still not touched (status remains First Contact), mark SLA breach
    if (lead.status === 'First Contact' && lead.active) {
      await this.prisma.leadActivity.create({ data: { leadId, type: 'sla_breach', message: 'First-touch SLA breached' } });
      // Notification stub
      // eslint-disable-next-line no-console
      console.log('[SLA] First-touch breached for lead', leadId);
    }
  }
}
