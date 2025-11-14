import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

/**
 * Mock Prisma Client for unit tests
 *
 * Usage in tests:
 *
 * import { prismaMock } from '../../../test/prisma-mock.helper';
 *
 * beforeEach(() => {
 *   mockReset(prismaMock);
 * });
 *
 * it('should find lead', async () => {
 *   prismaMock.lead.findUnique.mockResolvedValue(mockLead);
 *   const result = await service.findLead('123');
 *   expect(result).toEqual(mockLead);
 * });
 */

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const prismaMock = mockDeep<PrismaClient>() as MockPrismaClient;

/**
 * Reset all mocks before each test
 */
export const resetPrismaMock = () => {
  mockReset(prismaMock);
};
