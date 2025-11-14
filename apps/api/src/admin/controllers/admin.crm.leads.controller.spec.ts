import { Test, TestingModule } from '@nestjs/testing';
import { AdminCrmLeadsController } from './admin.crm.leads.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { SlaService } from '../../sla/sla.service';
import { prismaMock, resetPrismaMock } from '../../../test/prisma-mock.helper';
import { TestDataFactory } from '../../../test/test-data.factory';

describe('AdminCrmLeadsController - Duplicate Detection', () => {
  let controller: AdminCrmLeadsController;
  let slaService: SlaService;

  beforeEach(async () => {
    resetPrismaMock();

    // Mock SlaService
    const mockSlaService = {
      scheduleFirstTouch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCrmLeadsController],
      providers: [
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: SlaService,
          useValue: mockSlaService,
        },
      ],
    }).compile();

    controller = module.get<AdminCrmLeadsController>(AdminCrmLeadsController);
    slaService = module.get<SlaService>(SlaService);
  });

  describe('create - Duplicate Detection', () => {
    const validLeadBody = {
      contactName: 'John Doe',
      email: 'john@example.com',
      mobilePhone: '0812345678',
      companyName: 'Acme Corp',
      companyEmail: 'info@acme.com',
      companyPhone: '021234567',
      serviceType: 'solar',
      location: 'Bangkok',
      source: 'website',
    };

    it('should detect duplicate lead by email (case-insensitive)', async () => {
      const existingLead = TestDataFactory.createLead({
        email: 'john@example.com',
      });

      const mockCompany = TestDataFactory.createCompany();
      const newLead = TestDataFactory.createLead();

      prismaMock.company.upsert.mockResolvedValue(mockCompany);
      prismaMock.lead.findFirst.mockResolvedValue(existingLead);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create({ ...validLeadBody, email: 'JOHN@EXAMPLE.COM' });

      // Verify duplicate detection query was called with case-insensitive check
      expect(prismaMock.lead.findFirst).toHaveBeenCalledWith({
        where: {
          OR: expect.arrayContaining([
            { email: { equals: 'JOHN@EXAMPLE.COM', mode: 'insensitive' } },
          ]),
        },
      });
    });

    it('should detect duplicate lead by mobile phone', async () => {
      const existingLead = TestDataFactory.createLead({
        mobilePhone: '0812345678',
      });

      const mockCompany = TestDataFactory.createCompany();
      const newLead = TestDataFactory.createLead();

      prismaMock.company.upsert.mockResolvedValue(mockCompany);
      prismaMock.lead.findFirst.mockResolvedValue(existingLead);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(validLeadBody);

      expect(prismaMock.lead.findFirst).toHaveBeenCalledWith({
        where: {
          OR: expect.arrayContaining([
            { mobilePhone: { equals: '0812345678' } },
          ]),
        },
      });
    });

    it('should detect duplicate lead by company ID', async () => {
      const mockCompany = TestDataFactory.createCompany({ id: 'company-1' });
      const existingLead = TestDataFactory.createLead({
        companyId: 'company-1',
      });
      const newLead = TestDataFactory.createLead();

      prismaMock.company.upsert.mockResolvedValue(mockCompany);
      prismaMock.lead.findFirst.mockResolvedValue(existingLead);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(validLeadBody);

      expect(prismaMock.lead.findFirst).toHaveBeenCalledWith({
        where: {
          OR: expect.arrayContaining([{ companyId: 'company-1' }]),
        },
      });
    });

    it('should not include undefined values in OR clause when fields are missing', async () => {
      const bodyWithoutOptionalFields = {
        contactName: 'Jane Doe',
        serviceType: 'ev',
        location: 'Chiang Mai',
      };

      const newLead = TestDataFactory.createLead();

      prismaMock.lead.findFirst.mockResolvedValue(null);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(bodyWithoutOptionalFields);

      // Should call findFirst with empty OR array (filtered out undefined values)
      expect(prismaMock.lead.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [],
        },
      });
    });

    it('should create company if companyName is provided', async () => {
      const mockCompany = TestDataFactory.createCompany({
        name: 'Acme Corp',
        email: 'info@acme.com',
        phone: '021234567',
      });
      const newLead = TestDataFactory.createLead();

      prismaMock.company.upsert.mockResolvedValue(mockCompany);
      prismaMock.lead.findFirst.mockResolvedValue(null);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(validLeadBody);

      expect(prismaMock.company.upsert).toHaveBeenCalledWith({
        where: { name: 'Acme Corp' },
        update: {},
        create: {
          name: 'Acme Corp',
          email: 'info@acme.com',
          phone: '021234567',
        },
      });
    });

    it('should not create company if companyName is not provided', async () => {
      const bodyWithoutCompany = { ...validLeadBody };
      delete bodyWithoutCompany.companyName;

      const newLead = TestDataFactory.createLead();

      prismaMock.lead.findFirst.mockResolvedValue(null);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(bodyWithoutCompany);

      expect(prismaMock.company.upsert).not.toHaveBeenCalled();
    });

    it('should create lead with correct default values', async () => {
      const minimalBody = {
        contactName: 'John Doe',
      };

      const newLead = TestDataFactory.createLead();

      prismaMock.lead.findFirst.mockResolvedValue(null);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(minimalBody);

      expect(prismaMock.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'manual',
          serviceType: 'general',
          location: 'N/A',
          budgetMin: 0,
          budgetMax: 0,
          urgency: 'medium',
          status: 'First Contact',
          description: '',
        }),
        include: { company: true, sales: true },
      });
    });

    it('should create lead activity after lead creation', async () => {
      const newLead = TestDataFactory.createLead({ id: 'lead-123' });

      prismaMock.lead.findFirst.mockResolvedValue(null);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(validLeadBody);

      expect(prismaMock.leadActivity.create).toHaveBeenCalledWith({
        data: {
          leadId: 'lead-123',
          type: 'create',
          message: 'Manual new lead',
          meta: validLeadBody,
        },
      });
    });

    it('should handle contactAt date conversion', async () => {
      const bodyWithDate = {
        ...validLeadBody,
        contactAt: '2024-01-15T10:00:00Z',
      };

      const newLead = TestDataFactory.createLead();

      prismaMock.lead.findFirst.mockResolvedValue(null);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(bodyWithDate);

      expect(prismaMock.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contactAt: new Date('2024-01-15T10:00:00Z'),
        }),
        include: { company: true, sales: true },
      });
    });

    it('should handle followUpAt date conversion', async () => {
      const bodyWithDate = {
        ...validLeadBody,
        followUpAt: '2024-01-20T14:00:00Z',
      };

      const newLead = TestDataFactory.createLead();

      prismaMock.lead.findFirst.mockResolvedValue(null);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(bodyWithDate);

      expect(prismaMock.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          followUpAt: new Date('2024-01-20T14:00:00Z'),
        }),
        include: { company: true, sales: true },
      });
    });

    it('should use body.detail for description when body.description is not provided', async () => {
      const bodyWithDetail = {
        contactName: 'John Doe',
        detail: 'Looking for solar installation',
      };

      const newLead = TestDataFactory.createLead();

      prismaMock.lead.findFirst.mockResolvedValue(null);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      await controller.create(bodyWithDetail);

      expect(prismaMock.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Looking for solar installation',
          detail: 'Looking for solar installation',
        }),
        include: { company: true, sales: true },
      });
    });

    it('should return created lead with company and sales included', async () => {
      const mockCompany = TestDataFactory.createCompany();
      const newLead = TestDataFactory.createLead({
        company: mockCompany,
        sales: null,
      });

      prismaMock.company.upsert.mockResolvedValue(mockCompany);
      prismaMock.lead.findFirst.mockResolvedValue(null);
      prismaMock.lead.create.mockResolvedValue(newLead as any);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      const result = await controller.create(validLeadBody);

      expect(result).toEqual(newLead);
      expect(result.company).toBeDefined();
    });

    it('should still create lead even when duplicate is found', async () => {
      // Current implementation finds duplicate but doesn't prevent creation
      const existingLead = TestDataFactory.createLead({
        email: 'john@example.com',
      });
      const newLead = TestDataFactory.createLead();

      prismaMock.lead.findFirst.mockResolvedValue(existingLead);
      prismaMock.lead.create.mockResolvedValue(newLead);
      prismaMock.leadActivity.create.mockResolvedValue({} as any);

      const result = await controller.create(validLeadBody);

      // Lead is still created despite duplicate being found
      expect(prismaMock.lead.create).toHaveBeenCalled();
      expect(result).toEqual(newLead);
    });
  });

  describe('list - Filtering and Pagination', () => {
    it('should filter leads by search query across multiple fields', async () => {
      prismaMock.$transaction.mockResolvedValue([
        5,
        [TestDataFactory.createLead()],
      ] as any);

      await controller.list('john', undefined, '1', '20');

      expect(prismaMock.$transaction).toHaveBeenCalled();
      const calls = prismaMock.$transaction.mock.calls[0][0];

      // Check the where clause in count query
      expect(calls[0]).toMatchObject({
        where: {
          active: true,
          AND: [
            {
              OR: [
                { contactName: { contains: 'john', mode: 'insensitive' } },
                { email: { contains: 'john', mode: 'insensitive' } },
                { mobilePhone: { contains: 'john' } },
                { company: { name: { contains: 'john', mode: 'insensitive' } } },
              ],
            },
            {},
          ],
        },
      });
    });

    it('should filter leads by status', async () => {
      prismaMock.$transaction.mockResolvedValue([
        3,
        [TestDataFactory.createLead()],
      ] as any);

      await controller.list(undefined, 'Qualified', '1', '20');

      const calls = prismaMock.$transaction.mock.calls[0][0];
      expect(calls[0]).toMatchObject({
        where: {
          active: true,
          AND: [
            {},
            { status: 'Qualified' },
          ],
        },
      });
    });

    it('should apply pagination correctly', async () => {
      prismaMock.$transaction.mockResolvedValue([
        100,
        Array.from({ length: 10 }, () => TestDataFactory.createLead()),
      ] as any);

      const result = await controller.list(undefined, undefined, '3', '10');

      const calls = prismaMock.$transaction.mock.calls[0][0];
      expect(calls[1]).toMatchObject({
        skip: 20, // (page 3 - 1) * 10
        take: 10,
      });

      expect(result.meta).toEqual({
        total: 100,
        page: 3,
        pageSize: 10,
        pageCount: 10,
      });
    });

    it('should enforce maximum page size of 100', async () => {
      prismaMock.$transaction.mockResolvedValue([50, []] as any);

      await controller.list(undefined, undefined, '1', '500');

      const calls = prismaMock.$transaction.mock.calls[0][0];
      expect(calls[1]).toMatchObject({
        take: 100, // Capped at 100
      });
    });

    it('should enforce minimum page size of 1', async () => {
      prismaMock.$transaction.mockResolvedValue([50, []] as any);

      await controller.list(undefined, undefined, '1', '0');

      const calls = prismaMock.$transaction.mock.calls[0][0];
      expect(calls[1]).toMatchObject({
        take: 1, // Minimum 1
      });
    });

    it('should only return active leads', async () => {
      prismaMock.$transaction.mockResolvedValue([10, []] as any);

      await controller.list();

      const calls = prismaMock.$transaction.mock.calls[0][0];
      expect(calls[0]).toMatchObject({
        where: {
          active: true,
        },
      });
    });
  });
});
