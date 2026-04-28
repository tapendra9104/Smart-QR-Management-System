import { describe, it, expect } from 'vitest';
import { ApiClientError, getBackendBaseUrl, parseApiResponse } from '@/lib/api/http';

describe('API HTTP Utilities', () => {
  describe('getBackendBaseUrl', () => {
    it('should return the default URL when env is not set', () => {
      const originalEnv = process.env.BACKEND_API_URL;
      delete process.env.BACKEND_API_URL;
      const url = getBackendBaseUrl();
      expect(url).toBe('http://localhost:8081');
      if (originalEnv) process.env.BACKEND_API_URL = originalEnv;
    });

    it('should strip trailing slashes', () => {
      const originalEnv = process.env.BACKEND_API_URL;
      process.env.BACKEND_API_URL = 'http://example.com///';
      const url = getBackendBaseUrl();
      expect(url).toBe('http://example.com');
      if (originalEnv) {
        process.env.BACKEND_API_URL = originalEnv;
      } else {
        delete process.env.BACKEND_API_URL;
      }
    });
  });

  describe('ApiClientError', () => {
    it('should have correct name and status', () => {
      const error = new ApiClientError('Not found', 404);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ApiClientError');
      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
    });

    it('should be catchable as an Error', () => {
      const error = new ApiClientError('Unauthorized', 401);
      expect(() => { throw error; }).toThrow('Unauthorized');
    });
  });

  describe('parseApiResponse', () => {
    it('should return undefined for 204 responses', async () => {
      const response = new Response(null, { status: 204 });
      const result = await parseApiResponse(response);
      expect(result).toBeUndefined();
    });

    it('should parse JSON responses', async () => {
      const data = { message: 'hello' };
      const response = new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await parseApiResponse(response);
      expect(result).toEqual(data);
    });

    it('should parse text responses', async () => {
      const response = new Response('plain text', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
      const result = await parseApiResponse(response);
      expect(result).toBe('plain text');
    });

    it('should throw ApiClientError for error JSON responses', async () => {
      const response = new Response(JSON.stringify({ message: 'Bad request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
      await expect(parseApiResponse(response)).rejects.toThrow(ApiClientError);
      try {
        const retryResponse = new Response(JSON.stringify({ message: 'Bad request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
        await parseApiResponse(retryResponse);
      } catch (e) {
        expect(e.status).toBe(400);
        expect(e.message).toBe('Bad request');
      }
    });

    it('should throw ApiClientError for error text responses', async () => {
      const response = new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
      await expect(parseApiResponse(response)).rejects.toThrow(ApiClientError);
    });
  });
});
