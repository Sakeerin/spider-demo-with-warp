import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (user?: { role?: string }): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      const context = createMockExecutionContext({ role: 'admin' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when required roles array is empty', () => {
      const context = createMockExecutionContext({ role: 'admin' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when user is not present in request', () => {
      const context = createMockExecutionContext(undefined);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user has no role property', () => {
      const context = createMockExecutionContext({});
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return true when user role matches single required role', () => {
      const context = createMockExecutionContext({ role: 'admin' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user role matches one of multiple required roles', () => {
      const context = createMockExecutionContext({ role: 'coordinator' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'coordinator', 'sales']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when user role does not match any required role', () => {
      const context = createMockExecutionContext({ role: 'user' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'coordinator']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user role is undefined but roles are required', () => {
      const context = createMockExecutionContext({ role: undefined });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should call reflector.getAllAndOverride with correct parameters', () => {
      const context = createMockExecutionContext({ role: 'admin' });
      const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      guard.canActivate(context);

      expect(spy).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should handle case-sensitive role matching', () => {
      const context = createMockExecutionContext({ role: 'Admin' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const result = guard.canActivate(context);

      // Should return false because 'Admin' !== 'admin' (case-sensitive)
      expect(result).toBe(false);
    });

    it('should handle sales role correctly', () => {
      const context = createMockExecutionContext({ role: 'sales' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'coordinator', 'sales']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should reject empty string role when roles are required', () => {
      const context = createMockExecutionContext({ role: '' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
