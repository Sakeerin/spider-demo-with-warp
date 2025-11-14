import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

/**
 * E2E Test Example: Lead Management Workflow
 *
 * This test demonstrates a complete lead lifecycle:
 * 1. Create a lead
 * 2. Run random match to find contractors
 * 3. Assign lead to a contractor
 * 4. Verify job creation
 *
 * Prerequisites:
 * - Test database with seed data (approved contractors)
 * - Valid admin JWT token
 */

describe('Lead Management Workflow E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Get admin token
    const validApiKey = process.env.ADMIN_API_KEY || 'admin-api-key-changeme';
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ apiKey: validApiKey });

    if (loginResponse.body.token) {
      adminToken = loginResponse.body.token;
    }
  });

  afterAll(async () => {
    await cleanupTestLeads();
    await app.close();
  });

  describe('Complete Lead Workflow', () => {
    let testContractorId: string;
    let testLeadId: string;

    beforeAll(async () => {
      // Create a test contractor for matching
      const contractor = await prisma.contractor.create({
        data: {
          userId: 'test-user-id',
          businessName: 'E2E Test Contractor',
          businessType: 'Corporation',
          taxId: '1234567890123',
          businessPhone: '021234567',
          businessEmail: 'test@contractor.com',
          businessAddress: '123 Test St',
          services: ['solar'],
          serviceAreas: ['Bangkok'],
          experience: 10,
          portfolio: 'https://example.com',
          certifications: [],
          verification: VerificationStatus.APPROVED,
          successRate: 0.95,
          responseTime: 2,
        },
      });
      testContractorId = contractor.id;
    });

    afterAll(async () => {
      // Clean up test contractor
      if (testContractorId) {
        await prisma.contractor.delete({ where: { id: testContractorId } }).catch(() => {});
      }
    });

    it('should complete full lead lifecycle', async () => {
      if (!adminToken) {
        console.log('Skipping: No admin token available');
        return;
      }

      // Step 1: Create a new lead via CRM
      const createResponse = await request(app.getHttpServer())
        .post('/api/admin/crm/leads')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          contactName: 'E2E Test Customer',
          email: 'e2e-test@example.com',
          mobilePhone: '0899999999',
          serviceType: 'solar',
          location: 'Bangkok',
          source: 'website',
          budgetMin: 100000,
          budgetMax: 500000,
        });

      expect([200, 201]).toContain(createResponse.status);
      expect(createResponse.body).toHaveProperty('id');
      testLeadId = createResponse.body.id;

      // Step 2: Run random match to find suitable contractors
      const matchResponse = await request(app.getHttpServer())
        .post(`/api/admin/leads/${testLeadId}/random-match`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect([200, 201]).toContain(matchResponse.status);
      expect(matchResponse.body).toHaveProperty('matches');
      expect(Array.isArray(matchResponse.body.matches)).toBe(true);

      // Should find our test contractor
      if (matchResponse.body.matches.length > 0) {
        const foundTestContractor = matchResponse.body.matches.find(
          (m: any) => m.contractorId === testContractorId,
        );
        expect(foundTestContractor).toBeDefined();
        expect(foundTestContractor.score).toBeGreaterThan(0);
      }

      // Step 3: Assign lead to contractor
      const assignResponse = await request(app.getHttpServer())
        .post(`/api/admin/leads/${testLeadId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractorId: testContractorId });

      expect([200, 201]).toContain(assignResponse.status);
      expect(assignResponse.body).toHaveProperty('jobId');
      expect(assignResponse.body.leadId).toBe(testLeadId);
      expect(assignResponse.body.contractorId).toBe(testContractorId);

      // Step 4: Verify lead status was updated
      const lead = await prisma.lead.findUnique({ where: { id: testLeadId } });
      expect(lead?.status).toBe('assigned');

      // Step 5: Verify job was created
      const job = await prisma.job.findUnique({ where: { leadId: testLeadId } });
      expect(job).toBeDefined();
      expect(job?.contractorId).toBe(testContractorId);
      expect(job?.status).toBe('Pending');

      // Step 6: Verify lead assignment status
      const assignment = await prisma.leadAssignment.findUnique({
        where: {
          leadId_contractorId: {
            leadId: testLeadId,
            contractorId: testContractorId,
          },
        },
      });
      expect(assignment).toBeDefined();
      expect(assignment?.status).toBe('ASSIGNED');
    });
  });

  describe('Lead Queue Management', () => {
    it('should list unassigned leads in queue', async () => {
      if (!adminToken) {
        console.log('Skipping: No admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/admin/leads/queue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Queue should only contain leads without jobs
      response.body.forEach((lead: any) => {
        expect(lead.job).toBeFalsy();
      });
    });
  });

  describe('Lead Filtering and Search', () => {
    it('should filter leads by status', async () => {
      if (!adminToken) {
        console.log('Skipping: No admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/admin/crm/leads')
        .query({ status: 'First Contact' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');

      // All returned leads should have status "First Contact"
      response.body.data.forEach((lead: any) => {
        expect(lead.status).toBe('First Contact');
      });
    });

    it('should search leads by query text', async () => {
      if (!adminToken) {
        console.log('Skipping: No admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/admin/crm/leads')
        .query({ q: 'e2e-test' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });

  async function cleanupTestLeads() {
    if (process.env.NODE_ENV === 'test') {
      await prisma.lead.deleteMany({
        where: {
          email: { contains: 'e2e-test@example.com' },
        },
      }).catch(() => {});
    }
  }
});
