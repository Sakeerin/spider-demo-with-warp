import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({});
    guard = new JwtGuard(jwtService);
  });

  const createMockExecutionContext = (authHeader?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: authHeader,
          },
        }),
      }),
    } as any;
  };

  describe('canActivate', () => {
    it('should throw UnauthorizedException when Authorization header is missing', () => {
      const context = createMockExecutionContext();

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Missing token');
    });

    it('should throw UnauthorizedException when Authorization header does not start with "Bearer "', () => {
      const context = createMockExecutionContext('InvalidToken');

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Missing token');
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      const context = createMockExecutionContext('Bearer invalid.token.here');
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid token');
    });

    it('should throw UnauthorizedException when token is expired', () => {
      const context = createMockExecutionContext('Bearer expired.token.here');
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Token expired');
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Invalid token');
    });

    it('should return true and attach user to request when token is valid', () => {
      const mockPayload = { userId: '123', role: 'admin', email: 'admin@test.com' };
      const mockRequest = { headers: { authorization: 'Bearer valid.token.here' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRequest['user']).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith('valid.token.here', {
        secret: process.env.ADMIN_JWT_SECRET || 'devsecret',
      });
    });

    it('should use environment variable ADMIN_JWT_SECRET when available', () => {
      const originalSecret = process.env.ADMIN_JWT_SECRET;
      process.env.ADMIN_JWT_SECRET = 'custom-secret';

      const mockPayload = { userId: '123', role: 'admin' };
      const context = createMockExecutionContext('Bearer valid.token.here');
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);

      guard.canActivate(context);

      expect(jwtService.verify).toHaveBeenCalledWith('valid.token.here', {
        secret: 'custom-secret',
      });

      // Restore original
      process.env.ADMIN_JWT_SECRET = originalSecret;
    });

    it('should fall back to "devsecret" when ADMIN_JWT_SECRET is not set', () => {
      const originalSecret = process.env.ADMIN_JWT_SECRET;
      delete process.env.ADMIN_JWT_SECRET;

      const mockPayload = { userId: '123', role: 'admin' };
      const context = createMockExecutionContext('Bearer valid.token.here');
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);

      guard.canActivate(context);

      expect(jwtService.verify).toHaveBeenCalledWith('valid.token.here', {
        secret: 'devsecret',
      });

      // Restore original
      process.env.ADMIN_JWT_SECRET = originalSecret;
    });

    it('should handle Bearer token with extra spaces', () => {
      const mockRequest = { headers: { authorization: 'Bearer  token.with.spaces' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const mockPayload = { userId: '123', role: 'admin' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      // Note: The guard uses .slice('Bearer '.length) which would include the extra space
      expect(jwtService.verify).toHaveBeenCalledWith(' token.with.spaces', expect.any(Object));
    });
  });
});
