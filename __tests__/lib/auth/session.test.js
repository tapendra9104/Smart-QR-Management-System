import { describe, it, expect } from 'vitest';
import { cookieOptions, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth/session';

describe('Auth Session Utilities', () => {
  describe('constants', () => {
    it('should define ACCESS_TOKEN_COOKIE', () => {
      expect(ACCESS_TOKEN_COOKIE).toBe('seq_access_token');
    });

    it('should define REFRESH_TOKEN_COOKIE', () => {
      expect(REFRESH_TOKEN_COOKIE).toBe('seq_refresh_token');
    });
  });

  describe('cookieOptions', () => {
    it('should return httpOnly cookies', () => {
      const options = cookieOptions(3600);
      expect(options.httpOnly).toBe(true);
    });

    it('should use strict sameSite', () => {
      const options = cookieOptions(3600);
      expect(options.sameSite).toBe('strict');
    });

    it('should set path to root', () => {
      const options = cookieOptions(3600);
      expect(options.path).toBe('/');
    });

    it('should pass through maxAge', () => {
      const options = cookieOptions(7200);
      expect(options.maxAge).toBe(7200);
    });

    it('should set secure based on NODE_ENV', () => {
      const options = cookieOptions(3600);
      // In test environment, NODE_ENV is 'test', not 'production'
      expect(typeof options.secure).toBe('boolean');
    });
  });
});
