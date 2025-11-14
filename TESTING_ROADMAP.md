# SPIDER Platform - Testing Roadmap

## Executive Summary

This document outlines a comprehensive testing strategy for the SPIDER contractor marketplace platform. The goal is to achieve 80% test coverage for critical business logic, 70% for API endpoints, and establish a sustainable testing culture.

**Current Status:** ✅ Testing infrastructure set up with example tests
**Target Timeline:** 8 weeks to complete all phases
**Priority Focus:** Business-critical features first (Random Match, Lead Assignment, Authentication)

---

## Table of Contents

1. [Testing Infrastructure](#testing-infrastructure-completed)
2. [Phase 1: Critical Business Logic](#phase-1-critical-business-logic-weeks-1-2)
3. [Phase 2: Integration Tests](#phase-2-integration-tests-weeks-3-4)
4. [Phase 3: Frontend Testing](#phase-3-frontend-testing-weeks-5-6)
5. [Phase 4: Edge Cases & Polish](#phase-4-edge-cases--polish-weeks-7-8)
6. [Test Execution Guide](#test-execution-guide)
7. [Coverage Goals](#coverage-goals)
8. [Continuous Integration](#continuous-integration)

---

## Testing Infrastructure (✅ COMPLETED)

### What's Been Done

- ✅ Jest installed and configured for NestJS backend
- ✅ Test helper utilities created (Prisma mock, test data factories)
- ✅ E2E test configuration set up
- ✅ Package.json scripts added for running tests
- ✅ Example tests written for critical areas

### Files Created

```
apps/api/
├── jest.config.js                    # Unit test configuration
├── jest-e2e.config.js               # E2E test configuration
├── test/
│   ├── setup.ts                     # Global test setup
│   ├── prisma-mock.helper.ts        # Prisma mock utilities
│   ├── test-data.factory.ts         # Test data generators
│   ├── auth.e2e-spec.ts             # E2E auth tests
│   └── leads.e2e-spec.ts            # E2E lead workflow tests
└── src/
    ├── auth/
    │   ├── jwt.guard.spec.ts        # ✅ JWT authentication tests
    │   └── roles.guard.spec.ts      # ✅ RBAC tests
    ├── admin/services/
    │   └── admin.service.spec.ts    # ✅ Random Match & Assignment tests
    ├── admin/controllers/
    │   └── admin.crm.leads.controller.spec.ts  # ✅ Duplicate detection tests
    └── sla/
        └── sla.processor.spec.ts    # ✅ SLA breach tests
```

### Test Scripts Available

```bash
# Run all unit tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run only E2E tests
npm run test:e2e

# Run only unit tests (exclude E2E)
npm run test:unit

# Debug tests
npm run test:debug

# CI-optimized test run
npm run test:ci
```

---

## Phase 1: Critical Business Logic (Weeks 1-2)

### 🎯 Goal: 80% coverage on business-critical services

### Priority 1A: Complete Admin Service Tests

**File:** `apps/api/src/admin/services/admin.service.spec.ts`

Status: ✅ Started (Random Match & Lead Assignment complete)

**Remaining Tests to Add:**

- [ ] `listPendingContractors()` - Test filtering and ordering
- [ ] `listLeadQueue()` - Test limit parameter and ordering
- [ ] `listAssignments()` - Test contractor relationship inclusion
- [ ] Promotions CRUD (5 tests)
  - [ ] `listPromotions()` with search query
  - [ ] `listPromotions()` with category filter
  - [ ] `getPromotion()` - happy path & not found
  - [ ] `createPromotion()` - validate data structure
  - [ ] `updatePromotion()` - validate data structure
  - [ ] `deletePromotion()` - verify deletion
- [ ] News CRUD (5 tests)
  - [ ] `listNews()` with search query
  - [ ] `listNews()` with category filter
  - [ ] `getNews()` - happy path & not found
  - [ ] `createNews()` - validate data structure
  - [ ] `updateNews()` - validate data structure
  - [ ] `deleteNews()` - verify deletion

**Estimated Time:** 4-6 hours

---

### Priority 1B: Leads Service Tests

**File:** `apps/api/src/leads/leads.service.spec.ts` (CREATE THIS)

Status: ❌ Not started

**Tests to Write:**

- [ ] `findAll()` - Test pagination
- [ ] `findOne()` - Happy path
- [ ] `findOne()` - Lead not found throws NotFoundException
- [ ] `create()` - Creates lead with valid data
- [ ] `create()` - Handles company creation/lookup
- [ ] `update()` - Updates lead successfully
- [ ] `update()` - Lead not found throws NotFoundException
- [ ] `remove()` - Soft delete (sets active=false)
- [ ] `remove()` - Lead not found throws NotFoundException

**Estimated Time:** 3-4 hours

---

### Priority 1C: Contractors Service Tests

**File:** `apps/api/src/contractors/contractors.service.spec.ts` (CREATE THIS)

Status: ❌ Not started

**Tests to Write:**

- [ ] `findAll()` - Test pagination and ordering
- [ ] `findAll()` - Test search query filtering
- [ ] `findOne()` - Happy path with user relationship
- [ ] `findOne()` - Not found throws NotFoundException
- [ ] `create()` - Creates contractor with valid data
- [ ] `create()` - Sets initial verification status to PENDING
- [ ] `update()` - Updates contractor successfully
- [ ] `update()` - Not found throws NotFoundException
- [ ] `remove()` - Deletes contractor
- [ ] Verification status filtering tests

**Estimated Time:** 3-4 hours

---

### Priority 1D: SLA Service Tests

**File:** `apps/api/src/sla/sla.service.spec.ts` (CREATE THIS)

Status: ❌ Not started (Processor done ✅)

**Tests to Write:**

- [ ] `scheduleFirstTouch()` - Creates job in Bull queue
- [ ] `scheduleFirstTouch()` - Uses correct delay time
- [ ] `scheduleFirstTouch()` - Handles queue errors gracefully
- [ ] Integration with SlaProcessor

**Estimated Time:** 2 hours

---

## Phase 2: Integration Tests (Weeks 3-4)

### 🎯 Goal: 70% coverage on API endpoints with real database integration

### Priority 2A: Authentication & Authorization E2E

**File:** `apps/api/test/auth.e2e-spec.ts`

Status: ✅ Started (basic structure)

**Tests to Complete:**

- [x] POST /api/auth/admin/login - Invalid API key
- [x] POST /api/auth/admin/login - Valid API key returns JWT
- [x] Protected routes reject missing token
- [x] Protected routes reject invalid token
- [ ] Protected routes accept valid token
- [ ] Role-based access control enforcement
  - [ ] Admin role can access admin-only endpoints
  - [ ] Coordinator role can access coordinator endpoints
  - [ ] Sales role has limited access
  - [ ] User without role is rejected
- [ ] Token expiration handling
- [ ] Token refresh flow (if implemented)

**Estimated Time:** 4 hours

---

### Priority 2B: Lead Management Full Workflow E2E

**File:** `apps/api/test/leads.e2e-spec.ts`

Status: ✅ Started (complete workflow example)

**Tests to Complete:**

- [x] Create lead → Random Match → Assignment → Job creation
- [ ] Lead status transitions
  - [ ] First Contact → Qualified
  - [ ] Qualified → Proposal Sent
  - [ ] Proposal Sent → Won
  - [ ] Any status → Lost
- [ ] Lead filtering and search
  - [x] Filter by status
  - [x] Search by query
  - [ ] Filter by sales representative
  - [ ] Filter by date range
  - [ ] Combined filters
- [ ] Pagination edge cases
  - [ ] Page 1 of results
  - [ ] Last page of results
  - [ ] Page beyond total pages (should return empty)
  - [ ] Large page size limits

**Estimated Time:** 6 hours

---

### Priority 2C: Contractor Approval Workflow E2E

**File:** `apps/api/test/contractors.e2e-spec.ts` (CREATE THIS)

Status: ❌ Not started

**Tests to Write:**

- [ ] List pending contractors (requires admin role)
- [ ] Approve contractor
  - [ ] Status changes to APPROVED
  - [ ] Audit log created
  - [ ] Verification note saved
- [ ] Reject contractor
  - [ ] Status changes to REJECTED
  - [ ] Audit log created
  - [ ] Reason saved in verification note
- [ ] Only approved contractors appear in random match
- [ ] Contractor search and filtering
- [ ] Contractor profile updates

**Estimated Time:** 4 hours

---

### Priority 2D: Advanced Lead CRM Features E2E

**File:** `apps/api/test/crm-leads.e2e-spec.ts` (CREATE THIS)

Status: ❌ Not started

**High-Value Tests:**

- [ ] Manual lead creation with duplicate detection
- [ ] Sales assignment (manual and auto load-balanced)
- [ ] Bulk operations
  - [ ] Bulk status change
  - [ ] Bulk label assignment
  - [ ] Bulk sales assignment
- [ ] Lead scoring calculation
- [ ] Lead merging workflow
  - [ ] Merge two leads
  - [ ] Verify all data transferred
  - [ ] Verify source lead deleted
- [ ] Lead import from Excel
- [ ] Lead export to Excel
- [ ] Task management
  - [ ] Create task for lead
  - [ ] Update task status
  - [ ] Delete task
- [ ] File attachments
  - [ ] Upload file (local)
  - [ ] Upload file (S3 - if configured)
  - [ ] Download file
  - [ ] Delete attachment

**Estimated Time:** 10-12 hours

---

## Phase 3: Frontend Testing (Weeks 5-6)

### 🎯 Goal: 60% coverage on React components

### Setup Frontend Testing Infrastructure

**Tools to Install:**

```bash
cd apps/web
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @vitejs/plugin-react jsdom
```

**Configuration Files to Create:**

- `apps/web/vitest.config.ts` - Vitest configuration
- `apps/web/test/setup.ts` - Test utilities and mocks

**Estimated Time:** 2 hours

---

### Priority 3A: Critical Components

**AdminGuard Component**

File: `apps/web/app/components/AdminGuard.test.tsx` (CREATE THIS)

- [ ] Renders children when valid token exists
- [ ] Redirects to login when no token
- [ ] Redirects to login when token expired
- [ ] Shows loading state during verification
- [ ] Handles token decode errors

**Estimated Time:** 2 hours

---

**Pagination Component**

File: `apps/web/app/components/Pagination.test.tsx` (CREATE THIS)

- [ ] Renders page numbers correctly
- [ ] Disables previous on first page
- [ ] Disables next on last page
- [ ] Calls onPageChange with correct page number
- [ ] Shows ellipsis for large page counts

**Estimated Time:** 2 hours

---

### Priority 3B: Admin Pages

**Admin Login Page**

File: `apps/web/app/admin/login/page.test.tsx` (CREATE THIS)

- [ ] Renders login form
- [ ] Validates API key input
- [ ] Submits credentials to API
- [ ] Stores JWT token on success
- [ ] Shows error on invalid credentials
- [ ] Redirects to dashboard on success

**Estimated Time:** 3 hours

---

**Lead Management Dashboard**

File: `apps/web/app/admin/crm/leads/page.test.tsx` (CREATE THIS)

- [ ] Renders lead list
- [ ] Filters by status
- [ ] Search functionality
- [ ] Pagination controls work
- [ ] Create new lead button navigates correctly
- [ ] Shows loading state during data fetch
- [ ] Handles API errors gracefully

**Estimated Time:** 4 hours

---

### Priority 3C: Forms

**Lead Creation Form**

File: `apps/web/app/admin/crm/leads/new/page.test.tsx` (CREATE THIS)

- [ ] Renders all form fields
- [ ] Validates required fields
- [ ] Validates email format
- [ ] Validates phone number format
- [ ] Submits form data to API
- [ ] Shows duplicate warning if detected
- [ ] Redirects on successful creation
- [ ] Shows error messages on failure

**Estimated Time:** 4 hours

---

## Phase 4: Edge Cases & Polish (Weeks 7-8)

### 🎯 Goal: Achieve 80%+ total coverage, handle all edge cases

### Priority 4A: Error Handling & Edge Cases

**Tests to Add Across All Files:**

- [ ] Database connection errors
- [ ] Transaction rollback scenarios
- [ ] Concurrent update conflicts
- [ ] Invalid input sanitization
- [ ] SQL injection attempts (should be blocked)
- [ ] XSS attempts (should be escaped)
- [ ] File upload size limits
- [ ] File upload type validation
- [ ] Rate limiting (if implemented)
- [ ] Memory leak tests for long-running processes

**Estimated Time:** 8 hours

---

### Priority 4B: Performance Tests

**File:** `apps/api/test/performance.spec.ts` (CREATE THIS)

- [ ] Random Match algorithm performance with 1000 contractors
- [ ] Pagination performance with 10,000 leads
- [ ] Search query performance
- [ ] Bulk operations performance
- [ ] Database query optimization verification

**Estimated Time:** 6 hours

---

### Priority 4C: Security Tests

**File:** `apps/api/test/security.spec.ts` (CREATE THIS)

- [ ] JWT token tampering detection
- [ ] Role escalation prevention
- [ ] API key brute force protection
- [ ] Sensitive data not exposed in logs
- [ ] CORS configuration validation
- [ ] File upload security (no executable uploads)

**Estimated Time:** 6 hours

---

### Priority 4D: Test Database Automation

**Create Test Database Scripts:**

File: `apps/api/test/test-db.ts` (CREATE THIS)

- [ ] Automated test database creation
- [ ] Run migrations on test DB
- [ ] Seed test data
- [ ] Cleanup after tests
- [ ] Parallel test isolation (different DB per worker)

**Estimated Time:** 4 hours

---

## Test Execution Guide

### Running Tests Locally

```bash
# Backend tests
cd apps/api

# Run all tests once
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:cov

# Only unit tests (fast)
npm run test:unit

# Only E2E tests (slower, requires test DB)
npm run test:e2e

# Debug specific test file
npm run test:debug -- admin.service.spec.ts
```

### Frontend Tests (Once Set Up)

```bash
cd apps/web

# Run all frontend tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

---

## Coverage Goals

### Backend Coverage Targets

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| Auth Guards | 95% ✅ | 95% | Critical |
| Admin Service | 75% ✅ | 85% | Critical |
| Random Match | 90% ✅ | 95% | Critical |
| Lead Assignment | 85% ✅ | 90% | Critical |
| SLA Processor | 80% ✅ | 85% | High |
| CRM Controllers | 60% ✅ | 80% | High |
| Leads Service | 0% | 80% | High |
| Contractors Service | 0% | 75% | Medium |
| Promotions/News | 0% | 70% | Medium |
| E2E Workflows | 20% | 70% | High |

### Overall Target: 80% Backend Coverage by End of Phase 4

---

## Continuous Integration

### GitHub Actions Workflow

Create: `.github/workflows/test.yml`

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: spider_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd apps/api
          npm ci

      - name: Run migrations
        run: |
          cd apps/api
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/spider_test

      - name: Run tests with coverage
        run: |
          cd apps/api
          npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/spider_test
          ADMIN_JWT_SECRET: test-secret
          NODE_ENV: test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./apps/api/coverage
```

---

## Test Maintenance Best Practices

### 1. Keep Tests Fast
- Use mocks for unit tests (Prisma mock)
- Reserve database for integration tests only
- Parallel test execution where possible

### 2. Keep Tests Isolated
- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order

### 3. Keep Tests Readable
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Use test data factories for consistency

### 4. Keep Tests Maintained
- Update tests when features change
- Remove obsolete tests
- Refactor duplicated test code

---

## Quick Reference: What Tests Exist

### ✅ Completed Tests

1. **JWT Guard** (`jwt.guard.spec.ts`) - 10 tests
   - Token validation, missing token, invalid token, expired token

2. **Roles Guard** (`roles.guard.spec.ts`) - 11 tests
   - Role matching, no role required, case sensitivity

3. **Admin Service** (`admin.service.spec.ts`) - 20+ tests
   - Random Match algorithm with scoring
   - Lead assignment workflow
   - Contractor approval/rejection

4. **SLA Processor** (`sla.processor.spec.ts`) - 10 tests
   - SLA breach detection
   - Status checking, activity creation

5. **CRM Leads Controller** (`admin.crm.leads.controller.spec.ts`) - 15+ tests
   - Duplicate detection by email/phone/company
   - Lead creation with defaults
   - Filtering and pagination

6. **Auth E2E** (`auth.e2e-spec.ts`) - Basic structure
7. **Leads E2E** (`leads.e2e-spec.ts`) - Complete workflow example

### ❌ Tests Needed (Priority Order)

1. Leads Service (CRUD operations)
2. Contractors Service (CRUD operations)
3. SLA Service (queue scheduling)
4. Complete Admin Service (Promotions/News CRUD)
5. E2E: Contractor approval workflow
6. E2E: Advanced CRM features
7. Frontend: AdminGuard component
8. Frontend: Login page
9. Frontend: Lead management pages

---

## Success Metrics

### Week 2 Checkpoint
- ✅ 80% coverage on Admin Service
- ✅ All critical business logic tested
- ✅ Leads Service fully tested
- ✅ Contractors Service fully tested

### Week 4 Checkpoint
- ✅ 70% E2E coverage
- ✅ All major workflows tested
- ✅ CI/CD pipeline running tests

### Week 6 Checkpoint
- ✅ 60% frontend coverage
- ✅ All critical components tested
- ✅ Form validation tested

### Week 8 Checkpoint
- ✅ 80% overall backend coverage
- ✅ 60% overall frontend coverage
- ✅ All edge cases handled
- ✅ Performance tests passing
- ✅ Security tests passing

---

## Getting Help

### Resources
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

### Common Issues

**Issue:** Prisma mock not working
**Solution:** Make sure to import from `test/prisma-mock.helper` and call `resetPrismaMock()` in `beforeEach`

**Issue:** E2E tests failing with database errors
**Solution:** Check `TEST_DATABASE_URL` environment variable is set correctly

**Issue:** Tests timing out
**Solution:** Increase timeout in test setup or optimize slow queries

---

## Appendix: Test Data Examples

See `apps/api/test/test-data.factory.ts` for full examples of test data generators.

Quick examples:

```typescript
// Create a mock lead
const lead = TestDataFactory.createLead({
  serviceType: 'solar',
  location: 'Bangkok',
});

// Create a mock contractor
const contractor = TestDataFactory.createContractor({
  verification: VerificationStatus.APPROVED,
  successRate: 0.95,
});

// Create a mock user
const user = TestDataFactory.createUser({
  role: 'admin',
});
```

---

**Last Updated:** 2025-01-14
**Version:** 1.0
**Owner:** Development Team
