import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationStatus, AssignmentStatus } from '@prisma/client';
import { prismaMock, resetPrismaMock } from '../../../test/prisma-mock.helper';
import { TestDataFactory } from '../../../test/test-data.factory';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    resetPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  describe('runRandomMatch', () => {
    it('should throw NotFoundException when lead does not exist', async () => {
      prismaMock.lead.findUnique.mockResolvedValue(null);

      await expect(service.runRandomMatch('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.runRandomMatch('non-existent-id')).rejects.toThrow(
        'Lead not found',
      );
    });

    it('should calculate scores correctly based on weighted formula', async () => {
      const mockLead = TestDataFactory.createLead({
        serviceType: 'solar',
        location: 'Bangkok',
      });

      const contractor1 = TestDataFactory.createContractor({
        id: 'c1',
        businessName: 'Top Contractor',
        successRate: 1.0, // Perfect success rate
        experience: 20, // Maximum experience
        responseTime: 0, // Instant response
        services: ['solar'],
        serviceAreas: ['Bangkok'],
        verification: VerificationStatus.APPROVED,
      });

      const contractor2 = TestDataFactory.createContractor({
        id: 'c2',
        businessName: 'Medium Contractor',
        successRate: 0.75,
        experience: 10,
        responseTime: 12,
        services: ['solar'],
        serviceAreas: ['Bangkok'],
        verification: VerificationStatus.APPROVED,
      });

      const contractor3 = TestDataFactory.createContractor({
        id: 'c3',
        businessName: 'Low Contractor',
        successRate: 0.5,
        experience: 5,
        responseTime: 24,
        services: ['solar'],
        serviceAreas: ['Bangkok'],
        verification: VerificationStatus.APPROVED,
      });

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue([
        contractor1,
        contractor2,
        contractor3,
      ]);
      prismaMock.matchLog.create.mockResolvedValue({} as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);

      const result = await service.runRandomMatch(mockLead.id);

      // Verify calculations
      // contractor1: (1.0 * 0.6) + (20/20 * 0.3) + (1 - 0/24 * 0.1) = 0.6 + 0.3 + 0.1 = 1.0
      // contractor2: (0.75 * 0.6) + (10/20 * 0.3) + (1 - 12/24 * 0.1) = 0.45 + 0.15 + 0.05 = 0.65
      // contractor3: (0.5 * 0.6) + (5/20 * 0.3) + (1 - 24/24 * 0.1) = 0.3 + 0.075 + 0 = 0.375

      expect(result.matches).toHaveLength(3);
      expect(result.matches[0].contractorId).toBe('c1');
      expect(result.matches[0].score).toBeCloseTo(1.0, 2);
      expect(result.matches[1].contractorId).toBe('c2');
      expect(result.matches[1].score).toBeCloseTo(0.65, 2);
      expect(result.matches[2].contractorId).toBe('c3');
      expect(result.matches[2].score).toBeCloseTo(0.375, 2);
    });

    it('should return only top 3 matches even when more contractors are available', async () => {
      const mockLead = TestDataFactory.createLead({
        serviceType: 'solar',
        location: 'Bangkok',
      });

      const contractors = Array.from({ length: 10 }, (_, i) =>
        TestDataFactory.createContractor({
          id: `c${i}`,
          successRate: 0.8,
          experience: 10,
          responseTime: 5,
          services: ['solar'],
          serviceAreas: ['Bangkok'],
          verification: VerificationStatus.APPROVED,
        }),
      );

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue(contractors);
      prismaMock.matchLog.create.mockResolvedValue({} as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);

      const result = await service.runRandomMatch(mockLead.id);

      expect(result.matches).toHaveLength(3);
    });

    it('should filter contractors by service type', async () => {
      const mockLead = TestDataFactory.createLead({
        serviceType: 'solar',
        location: 'Bangkok',
      });

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue([]);

      await service.runRandomMatch(mockLead.id);

      expect(prismaMock.contractor.findMany).toHaveBeenCalledWith({
        where: {
          verification: VerificationStatus.APPROVED,
          AND: [
            {
              OR: [
                { services: { has: 'solar' } },
                { services: { isEmpty: true } },
              ],
            },
            {
              OR: [
                { serviceAreas: { has: 'Bangkok' } },
                { serviceAreas: { isEmpty: true } },
              ],
            },
          ],
        },
      });
    });

    it('should include contractors with empty service arrays (match all)', async () => {
      const mockLead = TestDataFactory.createLead({
        serviceType: 'solar',
        location: 'Bangkok',
      });

      const matchAllContractor = TestDataFactory.createContractor({
        services: [],
        serviceAreas: [],
        verification: VerificationStatus.APPROVED,
      });

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue([matchAllContractor]);
      prismaMock.matchLog.create.mockResolvedValue({} as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);

      const result = await service.runRandomMatch(mockLead.id);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].contractorId).toBe(matchAllContractor.id);
    });

    it('should create MatchLog entries for all top 3 matches', async () => {
      const mockLead = TestDataFactory.createLead();
      const contractors = Array.from({ length: 3 }, (_, i) =>
        TestDataFactory.createContractor({
          id: `c${i}`,
          verification: VerificationStatus.APPROVED,
        }),
      );

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue(contractors);
      prismaMock.matchLog.create.mockResolvedValue({} as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);

      await service.runRandomMatch(mockLead.id);

      expect(prismaMock.matchLog.create).toHaveBeenCalledTimes(3);
      contractors.forEach((contractor) => {
        expect(prismaMock.matchLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              leadId: mockLead.id,
              contractorId: contractor.id,
              score: expect.any(Number),
              reasons: expect.any(Array),
            }),
          }),
        );
      });
    });

    it('should create LeadAssignment with OFFERED status for all matches', async () => {
      const mockLead = TestDataFactory.createLead();
      const contractors = Array.from({ length: 3 }, (_, i) =>
        TestDataFactory.createContractor({
          id: `c${i}`,
          verification: VerificationStatus.APPROVED,
        }),
      );

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue(contractors);
      prismaMock.matchLog.create.mockResolvedValue({} as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);

      await service.runRandomMatch(mockLead.id);

      expect(prismaMock.leadAssignment.upsert).toHaveBeenCalledTimes(3);
      contractors.forEach((contractor) => {
        expect(prismaMock.leadAssignment.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              leadId_contractorId: {
                leadId: mockLead.id,
                contractorId: contractor.id,
              },
            },
            create: {
              leadId: mockLead.id,
              contractorId: contractor.id,
              status: AssignmentStatus.OFFERED,
            },
            update: { status: AssignmentStatus.OFFERED },
          }),
        );
      });
    });

    it('should return fewer than 3 matches when fewer contractors available', async () => {
      const mockLead = TestDataFactory.createLead();
      const contractors = Array.from({ length: 2 }, (_, i) =>
        TestDataFactory.createContractor({
          id: `c${i}`,
          verification: VerificationStatus.APPROVED,
        }),
      );

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue(contractors);
      prismaMock.matchLog.create.mockResolvedValue({} as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);

      const result = await service.runRandomMatch(mockLead.id);

      expect(result.matches).toHaveLength(2);
    });

    it('should return empty matches array when no contractors match', async () => {
      const mockLead = TestDataFactory.createLead();

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue([]);

      const result = await service.runRandomMatch(mockLead.id);

      expect(result.matches).toHaveLength(0);
      expect(prismaMock.matchLog.create).not.toHaveBeenCalled();
      expect(prismaMock.leadAssignment.upsert).not.toHaveBeenCalled();
    });

    it('should include scoring reasons in match results', async () => {
      const mockLead = TestDataFactory.createLead();
      const contractor = TestDataFactory.createContractor({
        successRate: 0.85,
        experience: 10,
        responseTime: 5,
        verification: VerificationStatus.APPROVED,
      });

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue([contractor]);
      prismaMock.matchLog.create.mockResolvedValue({} as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);

      const result = await service.runRandomMatch(mockLead.id);

      expect(result.matches[0].reasons).toEqual([
        'successRate:0.85',
        'exp:10',
        'respH:5',
      ]);
    });

    it('should only match APPROVED contractors', async () => {
      const mockLead = TestDataFactory.createLead();

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findMany.mockResolvedValue([]);

      await service.runRandomMatch(mockLead.id);

      expect(prismaMock.contractor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verification: VerificationStatus.APPROVED,
          }),
        }),
      );
    });
  });

  describe('assignLead', () => {
    it('should throw NotFoundException when lead does not exist', async () => {
      prismaMock.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.assignLead('lead-id', 'contractor-id', 'user-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignLead('lead-id', 'contractor-id', 'user-id'),
      ).rejects.toThrow('Lead not found');
    });

    it('should throw NotFoundException when contractor does not exist', async () => {
      const mockLead = TestDataFactory.createLead();
      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findUnique.mockResolvedValue(null);

      await expect(
        service.assignLead(mockLead.id, 'contractor-id', 'user-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignLead(mockLead.id, 'contractor-id', 'user-id'),
      ).rejects.toThrow('Contractor not found');
    });

    it('should create a new job when one does not exist', async () => {
      const mockLead = TestDataFactory.createLead({ id: 'lead-1' });
      const mockContractor = TestDataFactory.createContractor({ id: 'contractor-1' });
      const mockJob = TestDataFactory.createJob({
        id: 'job-1',
        leadId: 'lead-1',
        contractorId: 'contractor-1',
      });

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findUnique.mockResolvedValue(mockContractor);
      prismaMock.job.upsert.mockResolvedValue(mockJob);
      prismaMock.leadAssignment.updateMany.mockResolvedValue({ count: 2 } as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);
      prismaMock.lead.update.mockResolvedValue(mockLead);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await service.assignLead('lead-1', 'contractor-1', 'user-1');

      expect(prismaMock.job.upsert).toHaveBeenCalledWith({
        where: { leadId: 'lead-1' },
        update: {
          contractorId: 'contractor-1',
          customerId: mockLead.customerId,
          status: 'Pending',
        },
        create: {
          leadId: 'lead-1',
          contractorId: 'contractor-1',
          customerId: mockLead.customerId,
          status: 'Pending',
        },
      });

      expect(result).toEqual({
        jobId: 'job-1',
        leadId: 'lead-1',
        contractorId: 'contractor-1',
      });
    });

    it('should update all other assignments to EXPIRED', async () => {
      const mockLead = TestDataFactory.createLead({ id: 'lead-1' });
      const mockContractor = TestDataFactory.createContractor({ id: 'contractor-1' });
      const mockJob = TestDataFactory.createJob();

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findUnique.mockResolvedValue(mockContractor);
      prismaMock.job.upsert.mockResolvedValue(mockJob);
      prismaMock.leadAssignment.updateMany.mockResolvedValue({ count: 2 } as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);
      prismaMock.lead.update.mockResolvedValue(mockLead);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await service.assignLead('lead-1', 'contractor-1', 'user-1');

      expect(prismaMock.leadAssignment.updateMany).toHaveBeenCalledWith({
        where: { leadId: 'lead-1' },
        data: { status: AssignmentStatus.EXPIRED },
      });
    });

    it('should set the assigned contractor assignment to ASSIGNED status', async () => {
      const mockLead = TestDataFactory.createLead({ id: 'lead-1' });
      const mockContractor = TestDataFactory.createContractor({ id: 'contractor-1' });
      const mockJob = TestDataFactory.createJob();

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findUnique.mockResolvedValue(mockContractor);
      prismaMock.job.upsert.mockResolvedValue(mockJob);
      prismaMock.leadAssignment.updateMany.mockResolvedValue({ count: 2 } as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);
      prismaMock.lead.update.mockResolvedValue(mockLead);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await service.assignLead('lead-1', 'contractor-1', 'user-1');

      expect(prismaMock.leadAssignment.upsert).toHaveBeenCalledWith({
        where: {
          leadId_contractorId: {
            leadId: 'lead-1',
            contractorId: 'contractor-1',
          },
        },
        update: { status: AssignmentStatus.ASSIGNED },
        create: {
          leadId: 'lead-1',
          contractorId: 'contractor-1',
          status: AssignmentStatus.ASSIGNED,
        },
      });
    });

    it('should update lead status to assigned', async () => {
      const mockLead = TestDataFactory.createLead({ id: 'lead-1' });
      const mockContractor = TestDataFactory.createContractor({ id: 'contractor-1' });
      const mockJob = TestDataFactory.createJob();

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findUnique.mockResolvedValue(mockContractor);
      prismaMock.job.upsert.mockResolvedValue(mockJob);
      prismaMock.leadAssignment.updateMany.mockResolvedValue({ count: 2 } as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);
      prismaMock.lead.update.mockResolvedValue(mockLead);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await service.assignLead('lead-1', 'contractor-1', 'user-1');

      expect(prismaMock.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { status: 'assigned' },
      });
    });

    it('should create audit log entry', async () => {
      const mockLead = TestDataFactory.createLead({ id: 'lead-1' });
      const mockContractor = TestDataFactory.createContractor({ id: 'contractor-1' });
      const mockJob = TestDataFactory.createJob();

      prismaMock.lead.findUnique.mockResolvedValue(mockLead);
      prismaMock.contractor.findUnique.mockResolvedValue(mockContractor);
      prismaMock.job.upsert.mockResolvedValue(mockJob);
      prismaMock.leadAssignment.updateMany.mockResolvedValue({ count: 2 } as any);
      prismaMock.leadAssignment.upsert.mockResolvedValue({} as any);
      prismaMock.lead.update.mockResolvedValue(mockLead);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await service.assignLead('lead-1', 'contractor-1', 'user-1');

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'ASSIGN_LEAD',
          entityType: 'Lead',
          entityId: 'lead-1',
          message: 'Assigned to contractor contractor-1',
          actorUserId: 'user-1',
        },
      });
    });
  });

  describe('approveContractor', () => {
    it('should update contractor verification to APPROVED', async () => {
      const mockContractor = TestDataFactory.createContractor({
        id: 'contractor-1',
        verification: VerificationStatus.PENDING,
      });

      prismaMock.contractor.update.mockResolvedValue({
        ...mockContractor,
        verification: VerificationStatus.APPROVED,
      });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await service.approveContractor(
        'contractor-1',
        'Looks good',
        'admin-1',
      );

      expect(prismaMock.contractor.update).toHaveBeenCalledWith({
        where: { id: 'contractor-1' },
        data: {
          verification: VerificationStatus.APPROVED,
          verificationNote: 'Looks good',
        },
      });

      expect(result.verification).toBe(VerificationStatus.APPROVED);
    });

    it('should create audit log for approval', async () => {
      const mockContractor = TestDataFactory.createContractor();
      prismaMock.contractor.update.mockResolvedValue(mockContractor);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await service.approveContractor('contractor-1', 'Approved', 'admin-1');

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'APPROVE_CONTRACTOR',
          entityType: 'Contractor',
          entityId: 'contractor-1',
          message: 'Approved: Approved',
          actorUserId: 'admin-1',
        },
      });
    });
  });

  describe('rejectContractor', () => {
    it('should update contractor verification to REJECTED', async () => {
      const mockContractor = TestDataFactory.createContractor({
        id: 'contractor-1',
        verification: VerificationStatus.PENDING,
      });

      prismaMock.contractor.update.mockResolvedValue({
        ...mockContractor,
        verification: VerificationStatus.REJECTED,
      });
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      const result = await service.rejectContractor(
        'contractor-1',
        'Incomplete documents',
        'admin-1',
      );

      expect(prismaMock.contractor.update).toHaveBeenCalledWith({
        where: { id: 'contractor-1' },
        data: {
          verification: VerificationStatus.REJECTED,
          verificationNote: 'Incomplete documents',
        },
      });

      expect(result.verification).toBe(VerificationStatus.REJECTED);
    });

    it('should create audit log for rejection', async () => {
      const mockContractor = TestDataFactory.createContractor();
      prismaMock.contractor.update.mockResolvedValue(mockContractor);
      prismaMock.auditLog.create.mockResolvedValue({} as any);

      await service.rejectContractor('contractor-1', 'Bad docs', 'admin-1');

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'REJECT_CONTRACTOR',
          entityType: 'Contractor',
          entityId: 'contractor-1',
          message: 'Bad docs',
          actorUserId: 'admin-1',
        },
      });
    });
  });
});
