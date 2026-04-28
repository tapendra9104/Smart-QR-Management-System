import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ApiClientError,
  parseApiResponse,
  getBackendBaseUrl,
} from '@/lib/api/http';

// ─── parseApiResponse ────────────────────────────────────────────────────────

describe('parseApiResponse', () => {
  const makeResponse = (status, body, contentType = 'application/json') => ({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (h) => (h === 'content-type' ? contentType : null) },
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    text: async () => String(body),
  });

  it('returns undefined for 204 No Content', async () => {
    const res = makeResponse(204, '');
    expect(await parseApiResponse(res)).toBeUndefined();
  });

  it('returns parsed JSON for a 200 JSON response', async () => {
    const res = makeResponse(200, { id: '123', name: 'Test QR' });
    expect(await parseApiResponse(res)).toEqual({ id: '123', name: 'Test QR' });
  });

  it('returns raw text for a 200 non-JSON response', async () => {
    const res = makeResponse(200, 'plain text body', 'text/plain');
    expect(await parseApiResponse(res)).toBe('plain text body');
  });

  it('throws ApiClientError with message from JSON body on 400', async () => {
    const res = makeResponse(400, { message: 'Email already exists' });
    await expect(parseApiResponse(res)).rejects.toThrow(ApiClientError);
    await expect(parseApiResponse(res)).rejects.toMatchObject({
      status: 400,
      message: 'Email already exists',
    });
  });

  it('throws ApiClientError with message from text body on 500', async () => {
    const res = makeResponse(500, 'Internal Server Error', 'text/plain');
    await expect(parseApiResponse(res)).rejects.toThrow(ApiClientError);
    await expect(parseApiResponse(res)).rejects.toMatchObject({ status: 500 });
  });

  it('throws ApiClientError with fallback message when JSON has no message field', async () => {
    const res = makeResponse(422, { errors: ['field required'] });
    await expect(parseApiResponse(res)).rejects.toMatchObject({
      message: 'Request failed',
      status: 422,
    });
  });

  it('throws ApiClientError on 401 Unauthorized', async () => {
    const res = makeResponse(401, { message: 'Unauthorized' });
    await expect(parseApiResponse(res)).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized',
    });
  });

  it('throws ApiClientError on 404 Not Found', async () => {
    const res = makeResponse(404, { message: 'QR code not found' });
    await expect(parseApiResponse(res)).rejects.toMatchObject({
      status: 404,
      message: 'QR code not found',
    });
  });
});

// ─── ApiClientError ───────────────────────────────────────────────────────────

describe('ApiClientError', () => {
  it('is an instance of Error', () => {
    const err = new ApiClientError('something failed', 503);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiClientError);
  });

  it('stores status correctly', () => {
    const err = new ApiClientError('rate limited', 429);
    expect(err.status).toBe(429);
    expect(err.message).toBe('rate limited');
  });

  it('has correct name', () => {
    const err = new ApiClientError('test', 400);
    expect(err.name).toBe('ApiClientError');
  });

  it('can be caught as ApiClientError with instanceof check', async () => {
    const res = {
      status: 403,
      ok: false,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Forbidden' }),
    };

    try {
      await parseApiResponse(res);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err instanceof ApiClientError).toBe(true);
      expect(err.status).toBe(403);
    }
  });
});

// ─── getBackendBaseUrl ────────────────────────────────────────────────────────

describe('getBackendBaseUrl', () => {
  it('returns the default URL when env var is not set', () => {
    const original = process.env.BACKEND_API_URL;
    delete process.env.BACKEND_API_URL;
    expect(getBackendBaseUrl()).toBe('http://localhost:8081');
    if (original !== undefined) process.env.BACKEND_API_URL = original;
  });

  it('returns the env var URL without trailing slash', () => {
    process.env.BACKEND_API_URL = 'https://api.myapp.com/';
    expect(getBackendBaseUrl()).toBe('https://api.myapp.com');
    delete process.env.BACKEND_API_URL;
  });

  it('handles multiple trailing slashes', () => {
    process.env.BACKEND_API_URL = 'https://api.myapp.com///';
    expect(getBackendBaseUrl()).toBe('https://api.myapp.com');
    delete process.env.BACKEND_API_URL;
  });
});
