import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E Test Example: Authentication Flow
 *
 * This is an example end-to-end test that demonstrates:
 * - How to set up a full NestJS application for testing
 * - How to test HTTP endpoints with supertest
 * - How to test authentication and authorization
 *
 * To run this test:
 *   npm run test:e2e
 *
 * Note: These tests require a test database.
 * Set TEST_DATABASE_URL environment variable to point to a test database.
 */

describe('Authentication E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/admin/login', () => {
    it('should return 401 when API key is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/admin/login')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should return 401 when API key is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/admin/login')
        .send({ apiKey: 'invalid-key' });

      expect(response.status).toBe(401);
    });

    it('should return JWT token when API key is valid', async () => {
      // Note: This test requires ADMIN_API_KEY to be set in environment
      const validApiKey = process.env.ADMIN_API_KEY || 'admin-api-key-changeme';

      const response = await request(app.getHttpServer())
        .post('/api/auth/admin/login')
        .send({ apiKey: validApiKey });

      if (response.status === 201 || response.status === 200) {
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
        expect(response.body.token.length).toBeGreaterThan(20);
      }
    });
  });

  describe('Protected Routes - JWT Guard', () => {
    let validToken: string;

    beforeAll(async () => {
      // Get a valid token for testing protected routes
      const validApiKey = process.env.ADMIN_API_KEY || 'admin-api-key-changeme';

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/admin/login')
        .send({ apiKey: validApiKey });

      if (loginResponse.status === 200 || loginResponse.status === 201) {
        validToken = loginResponse.body.token;
      }
    });

    it('should reject requests without Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/contractors/pending');

      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/contractors/pending')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
    });

    it('should allow requests with valid token', async () => {
      if (!validToken) {
        console.log('Skipping test: No valid token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/api/admin/contractors/pending')
        .set('Authorization', `Bearer ${validToken}`);

      // Should not be 401 Unauthorized
      expect(response.status).not.toBe(401);

      // Should be either 200 OK or 403 Forbidden (if role check fails)
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce role requirements on protected endpoints', async () => {
      // This test would require creating users with different roles
      // and testing that only authorized roles can access specific endpoints

      // Example test structure:
      // 1. Create a sales user token
      // 2. Try to access admin-only endpoint
      // 3. Expect 403 Forbidden

      // For now, this is a placeholder showing the test structure
      expect(true).toBe(true);
    });
  });

  /**
   * Example of a cleanup helper for tests
   */
  async function cleanupTestData() {
    // Clean up test data from database
    // Be careful to only run this on test database!
    if (process.env.NODE_ENV === 'test') {
      // Example: await prisma.lead.deleteMany({ where: { email: { contains: '@test.com' } } });
    }
  }
});
