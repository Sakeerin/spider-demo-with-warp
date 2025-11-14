# Testing Setup Guide for SPIDER API

## Quick Start

### 1. Initial Setup (One-time)

```bash
cd /home/user/spider-demo-with-warp/apps/api

# Install dependencies (already done if you've run npm install)
npm install

# Generate Prisma Client (IMPORTANT - must be done before running tests)
npm run prisma:generate

# Verify Jest is installed
npm test -- --version
```

### 2. Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run only unit tests (fast - excludes E2E)
npm run test:unit

# Run only E2E tests (slower - requires database)
npm run test:e2e

# Debug a specific test file
npm run test:debug -- jwt.guard.spec.ts
```

### 3. Test File Organization

```
apps/api/
├── src/
│   ├── auth/
│   │   ├── jwt.guard.ts
│   │   ├── jwt.guard.spec.ts          ✅ Unit tests for JWT guard
│   │   ├── roles.guard.ts
│   │   └── roles.guard.spec.ts        ✅ Unit tests for roles guard
│   ├── admin/
│   │   ├── services/
│   │   │   ├── admin.service.ts
│   │   │   └── admin.service.spec.ts  ✅ Tests for Random Match & Assignment
│   │   └── controllers/
│   │       └── admin.crm.leads.controller.spec.ts  ✅ Tests for duplicate detection
│   └── sla/
│       ├── sla.processor.ts
│       └── sla.processor.spec.ts      ✅ Tests for SLA breach handling
└── test/
    ├── setup.ts                        # Global test configuration
    ├── prisma-mock.helper.ts           # Prisma mocking utilities
    ├── test-data.factory.ts            # Test data generators
    ├── auth.e2e-spec.ts                ✅ E2E auth tests
    └── leads.e2e-spec.ts               ✅ E2E lead workflow tests
```

## Test Coverage Report

After running `npm run test:cov`, open the HTML coverage report:

```bash
# Coverage report is generated in:
apps/api/coverage/lcov-report/index.html

# View in browser or use a simple HTTP server
```

## Troubleshooting

### Error: Module '"@prisma/client"' has no exported member 'VerificationStatus'

**Solution:** Generate the Prisma Client first

```bash
npm run prisma:generate
# or
npx prisma generate
```

### Error: Cannot find module '@prisma/client'

**Solution:** Install dependencies and generate Prisma

```bash
npm install
npm run prisma:generate
```

### Tests are timing out

**Solution:** Increase timeout or check if test database is accessible

```typescript
// In individual test file:
jest.setTimeout(30000); // 30 seconds

// Or in test/setup.ts (already configured)
```

### E2E tests failing with database errors

**Solution:** Set up test database

```bash
# Set environment variable for test database
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spider_test"

# Run migrations on test database
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy

# Run E2E tests
npm run test:e2e
```

### Prisma mock is returning undefined

**Solution:** Make sure to reset the mock in beforeEach

```typescript
import { prismaMock, resetPrismaMock } from '../../../test/prisma-mock.helper';

beforeEach(() => {
  resetPrismaMock();
});
```

## Writing New Tests

### Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { PrismaService } from '../prisma/prisma.service';
import { prismaMock, resetPrismaMock } from '../../test/prisma-mock.helper';
import { TestDataFactory } from '../../test/test-data.factory';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    resetPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should do something', async () => {
    // Arrange
    const mockData = TestDataFactory.createLead();
    prismaMock.lead.findUnique.mockResolvedValue(mockData);

    // Act
    const result = await service.findLead('test-id');

    // Assert
    expect(result).toEqual(mockData);
    expect(prismaMock.lead.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-id' },
    });
  });
});
```

### E2E Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('YourFeature E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/your-endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/your-endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('expectedField');
  });
});
```

## Test Data Factories

Use the built-in test data factories to create realistic mock data:

```typescript
import { TestDataFactory } from '../../test/test-data.factory';

// Create a lead with defaults
const lead = TestDataFactory.createLead();

// Create a lead with overrides
const specificLead = TestDataFactory.createLead({
  serviceType: 'solar',
  location: 'Bangkok',
  status: 'First Contact',
});

// Create a contractor
const contractor = TestDataFactory.createContractor({
  verification: VerificationStatus.APPROVED,
  successRate: 0.95,
});

// Create a user
const user = TestDataFactory.createUser({
  role: 'admin',
});
```

## Current Test Status

### ✅ Completed (70+ tests)
- JWT Guard (10 tests)
- Roles Guard (11 tests)
- Admin Service - Random Match (15+ tests)
- Admin Service - Lead Assignment (8+ tests)
- Admin Service - Contractor Approval (4+ tests)
- SLA Processor (10+ tests)
- CRM Leads Controller (15+ tests)
- E2E Auth (basic)
- E2E Leads Workflow (basic)

### 📝 Next Steps (See TESTING_ROADMAP.md)
- Leads Service CRUD tests
- Contractors Service CRUD tests
- SLA Service tests
- Complete E2E test coverage
- Frontend component tests

## Best Practices

1. **Always reset mocks** - Use `resetPrismaMock()` in `beforeEach`
2. **Use test data factories** - Don't create raw objects manually
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Test edge cases** - Don't just test happy paths
5. **Keep tests isolated** - Each test should be independent
6. **Use descriptive names** - Test names should explain what they test
7. **Mock external dependencies** - Unit tests should not hit real databases

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://testingjavascript.com/)
- [Prisma Mocking](https://www.prisma.io/docs/guides/testing/unit-testing)

## Getting Help

If you encounter issues:
1. Check this document first
2. Review existing test files for examples
3. Check the TESTING_ROADMAP.md for the big picture
4. Consult Jest/NestJS documentation

---

**Last Updated:** 2025-01-14
**Maintainer:** Development Team
