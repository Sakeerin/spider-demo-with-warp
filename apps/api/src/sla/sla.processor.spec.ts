import { Test, TestingModule } from '@nestjs/testing';
import { SlaProcessor } from './sla.processor';
import { PrismaService } from '../prisma/prisma.service';
import { prismaMock, resetPrismaMock } from '../../test/prisma-mock.helper';
import { TestDataFactory } from '../../test/test-data.factory';
import { Job } from 'bull';

describe('SlaProcessor', () => {
  let processor: SlaProcessor;

  beforeEach(async () => {
    resetPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaProcessor,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    processor = module.get<SlaProcessor>(SlaProcessor);
  });

  const createMockJob = (leadId: string): Job<{ leadId: string }> => {
    return {
      data: { leadId },
      id: '1',
      name: 'first-touch',
      queue: {} as any,
      opts: {},
      progress: jest.fn(),
      log: jest.fn(),
      getState: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      retry: jest.fn(),
      discard: jest.fn(),
      promote: jest.fn(),
      finished: jest.fn(),
      moveToCompleted: jest.fn(),
      moveToFailed: jest.fn(),
      timestamp: Date.now(),
      attemptsMade: 0,
      failedReason: undefined,
      stacktrace: null,
      returnvalue: null,
      finishedOn: null,
      processedOn: null,
    } as any;
  };

  describe('handleFirstTouch', () => {
    it('should do nothing when lead does not exist', async () => {
      const job = createMockJob('non-existent-id');
      prismaMock.lead.findUnique.mockResolvedValue(null);

      await processor.handleFirstTouch(job);

      expect(prismaMock.leadActivity.create).not.toHaveBeenCalled();
    });

    it('should create SLA breach activity when lead status is still "First Contact" and active', async () => {
      const mockLead = TestDataFactory.createLead({
        id: 'lead-1',
        status: 'First Contact',
        active: true,
      });

      const job = createMockJob('lead-1');
      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await processor.handleFirstTouch(job);

      expect(prismaMock.leadActivity.create).toHaveBeenCalledWith({
        data: {
          leadId: 'lead-1',
          type: 'sla_breach',
          message: 'First-touch SLA breached',
        },
      });
    });

    it('should not create SLA breach when lead status has changed from "First Contact"', async () => {
      const mockLead = TestDataFactory.createLead({
        id: 'lead-1',
        status: 'Qualified',
        active: true,
      });

      const job = createMockJob('lead-1');
      prismaMock.lead.findUnique.mockResolvedValue(mockLead);

      await processor.handleFirstTouch(job);

      expect(prismaMock.leadActivity.create).not.toHaveBeenCalled();
    });

    it('should not create SLA breach when lead is not active', async () => {
      const mockLead = TestDataFactory.createLead({
        id: 'lead-1',
        status: 'First Contact',
        active: false,
      });

      const job = createMockJob('lead-1');
      prismaMock.lead.findUnique.mockResolvedValue(mockLead);

      await processor.handleFirstTouch(job);

      expect(prismaMock.leadActivity.create).not.toHaveBeenCalled();
    });

    it('should not create SLA breach when lead is inactive and status changed', async () => {
      const mockLead = TestDataFactory.createLead({
        id: 'lead-1',
        status: 'Closed',
        active: false,
      });

      const job = createMockJob('lead-1');
      prismaMock.lead.findUnique.mockResolvedValue(mockLead);

      await processor.handleFirstTouch(job);

      expect(prismaMock.leadActivity.create).not.toHaveBeenCalled();
    });

    it('should handle case when lead status is "First Contact" but in different casing', async () => {
      // Test exact matching - should NOT trigger for different casing
      const mockLead = TestDataFactory.createLead({
        id: 'lead-1',
        status: 'first contact', // lowercase
        active: true,
      });

      const job = createMockJob('lead-1');
      prismaMock.lead.findUnique.mockResolvedValue(mockLead);

      await processor.handleFirstTouch(job);

      // Should NOT create breach because status doesn't match exactly
      expect(prismaMock.leadActivity.create).not.toHaveBeenCalled();
    });

    it('should log to console when SLA breach occurs', async () => {
      const mockLead = TestDataFactory.createLead({
        id: 'lead-1',
        status: 'First Contact',
        active: true,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const job = createMockJob('lead-1');
      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await processor.handleFirstTouch(job);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SLA] First-touch breached for lead',
        'lead-1',
      );

      consoleSpy.mockRestore();
    });

    it('should process job with correct lead ID from job data', async () => {
      const job = createMockJob('specific-lead-id');
      prismaMock.lead.findUnique.mockResolvedValue(null);

      await processor.handleFirstTouch(job);

      expect(prismaMock.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 'specific-lead-id' },
      });
    });

    it('should handle database errors gracefully', async () => {
      const job = createMockJob('lead-1');
      prismaMock.lead.findUnique.mockRejectedValue(new Error('Database error'));

      // Should not throw, allowing Bull to retry
      await expect(processor.handleFirstTouch(job)).rejects.toThrow('Database error');
    });

    it('should create activity with correct structure', async () => {
      const mockLead = TestDataFactory.createLead({
        id: 'lead-123',
        status: 'First Contact',
        active: true,
      });

      const job = createMockJob('lead-123');
      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.leadActivity.create.mockResolvedValue({
        id: 'activity-1',
        leadId: 'lead-123',
        type: 'sla_breach',
        message: 'First-touch SLA breached',
        createdAt: new Date(),
      } as any);

      await processor.handleFirstTouch(job);

      const createCall = prismaMock.leadActivity.create.mock.calls[0][0];
      expect(createCall.data).toEqual({
        leadId: 'lead-123',
        type: 'sla_breach',
        message: 'First-touch SLA breached',
      });
    });
  });
});
