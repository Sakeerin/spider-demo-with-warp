import { faker } from '@faker-js/faker';
import { VerificationStatus, AssignmentStatus } from '@prisma/client';

/**
 * Test data factories for creating mock entities
 * Using faker for realistic test data
 */

export const TestDataFactory = {
  /**
   * Create a mock Lead
   */
  createLead: (overrides = {}) => ({
    id: faker.string.uuid(),
    customerId: faker.string.uuid(),
    companyId: faker.string.uuid(),
    contactName: faker.person.fullName(),
    contactPhone: faker.phone.number(),
    mobilePhone: faker.phone.number(),
    email: faker.internet.email(),
    contactAt: faker.date.recent(),
    source: 'website',
    salesId: null,
    serviceType: 'solar',
    description: faker.lorem.sentence(),
    location: faker.location.city(),
    budgetMin: 10000,
    budgetMax: 50000,
    urgency: 'medium',
    status: 'First Contact',
    followUpAt: null,
    detail: faker.lorem.paragraph(),
    productType: null,
    adType: null,
    remark: null,
    active: true,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  /**
   * Create a mock Contractor
   */
  createContractor: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    businessName: faker.company.name(),
    businessType: 'Corporation',
    taxId: faker.string.numeric(13),
    businessPhone: faker.phone.number(),
    businessEmail: faker.internet.email(),
    businessAddress: faker.location.streetAddress(),
    services: ['solar', 'ev'],
    serviceAreas: ['Bangkok', 'Chiang Mai'],
    experience: faker.number.int({ min: 1, max: 20 }),
    portfolio: faker.internet.url(),
    certifications: ['ISO9001', 'Solar Certification'],
    verification: VerificationStatus.APPROVED,
    verificationNote: null,
    successRate: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 }),
    responseTime: faker.number.int({ min: 1, max: 24 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  /**
   * Create a mock User
   */
  createUser: (overrides = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    hashedPassword: faker.string.alphanumeric(60),
    role: 'admin',
    fullName: faker.person.fullName(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  /**
   * Create a mock Job
   */
  createJob: (overrides = {}) => ({
    id: faker.string.uuid(),
    leadId: faker.string.uuid(),
    contractorId: faker.string.uuid(),
    customerId: faker.string.uuid(),
    status: 'Pending',
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  /**
   * Create a mock LeadAssignment
   */
  createLeadAssignment: (overrides = {}) => ({
    id: faker.string.uuid(),
    leadId: faker.string.uuid(),
    contractorId: faker.string.uuid(),
    status: AssignmentStatus.OFFERED,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  /**
   * Create a mock MatchLog
   */
  createMatchLog: (overrides = {}) => ({
    id: faker.string.uuid(),
    leadId: faker.string.uuid(),
    contractorId: faker.string.uuid(),
    score: faker.number.float({ min: 0, max: 1, fractionDigits: 3 }),
    reasons: ['successRate:0.85', 'exp:10', 'respH:2'],
    createdAt: faker.date.recent(),
    ...overrides,
  }),

  /**
   * Create a mock Company
   */
  createCompany: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  /**
   * Create a mock AuditLog
   */
  createAuditLog: (overrides = {}) => ({
    id: faker.string.uuid(),
    action: 'APPROVE_CONTRACTOR',
    entityType: 'Contractor',
    entityId: faker.string.uuid(),
    message: 'Approved contractor',
    actorUserId: faker.string.uuid(),
    createdAt: faker.date.recent(),
    ...overrides,
  }),

  /**
   * Create a mock LeadActivity
   */
  createLeadActivity: (overrides = {}) => ({
    id: faker.string.uuid(),
    leadId: faker.string.uuid(),
    type: 'status_change',
    message: 'Status changed to Qualified',
    createdAt: faker.date.recent(),
    ...overrides,
  }),
};
