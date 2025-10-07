import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class SlaService {
  constructor(@InjectQueue('sla') private queue: Queue) {}

  async scheduleFirstTouch(leadId: string) {
    const minutes = Number(process.env.LEAD_SLA_FIRST_TOUCH_MIN || 60);
    await this.queue.add('first-touch', { leadId }, { delay: minutes * 60 * 1000, removeOnComplete: true, removeOnFail: true });
  }
}
