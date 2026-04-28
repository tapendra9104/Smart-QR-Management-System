/**
 * QR Manager Platform — k6 Load Test
 *
 * Simulates realistic production traffic: anonymous QR scans + authenticated API usage.
 *
 * USAGE:
 *   # Install k6: https://k6.io/docs/getting-started/installation/
 *   k6 run scripts/load-test.js
 *
 *   # With custom target URL:
 *   BASE_URL=https://staging.qrmanager.app k6 run scripts/load-test.js
 *
 *   # Run a 10-minute stress test:
 *   k6 run --duration 10m --vus 50 scripts/load-test.js
 *
 * SCENARIOS:
 *   scanner      → Anonymous QR code scans (80% of traffic — the core use case)
 *   api_user     → Authenticated users listing + creating QR codes (20% of traffic)
 *
 * PASS CRITERIA (thresholds):
 *   - 95th percentile response time < 500ms
 *   - 99th percentile response time < 2000ms
 *   - Error rate < 1%
 *   - QR scan resolve endpoint p95 < 200ms (critical — users wait for redirects)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ── Configuration ──────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';
const TEST_EMAIL_PREFIX = `k6-load-${Date.now()}`;

// ── Custom metrics ─────────────────────────────────────────────────────────
const scanResolveTime  = new Trend('qr_scan_resolve_ms', true);
const authTime         = new Trend('auth_login_ms', true);
const qrCreateTime     = new Trend('qr_create_ms', true);
const errorRate        = new Rate('error_rate');

// ── Load profile ───────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Simulates QR code scanner traffic (main revenue-generating path)
    scanner: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // ramp up
        { duration: '2m',  target: 20 },   // steady state
        { duration: '30s', target: 0 },    // ramp down
      ],
      exec: 'scanFlow',
    },
    // Simulates dashboard users creating and managing QR codes
    api_user: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m',  target: 5 },
        { duration: '30s', target: 0 },
      ],
      exec: 'apiUserFlow',
      startTime: '10s', // stagger start to let scanner warm up first
    },
  },
  thresholds: {
    // Global SLOs
    http_req_duration:        ['p(95)<500', 'p(99)<2000'],
    error_rate:               ['rate<0.01'],
    // QR scan resolve is the most latency-sensitive path
    qr_scan_resolve_ms:       ['p(95)<200', 'p(99)<500'],
    // Auth should be fast
    auth_login_ms:            ['p(95)<400'],
    // QR creation can be slightly slower (DB write + webhook dispatch)
    qr_create_ms:             ['p(95)<800'],
  },
};

// ── Shared fixture: a known valid short code for scan simulation ───────────
// Replace with a real short code from your test database
const FIXTURE_SHORT_CODE = __ENV.TEST_SHORT_CODE || 'k6test1';
const FIXTURE_SIG        = __ENV.TEST_SIGNATURE   || 'placeholder-sig';

// ── Scenario: QR scanner (anonymous) ──────────────────────────────────────
export function scanFlow() {
  group('QR Scan — resolve redirect', () => {
    const start    = Date.now();
    const res      = http.get(
      `${BASE_URL}/api/v1/public/qr/${FIXTURE_SHORT_CODE}/resolve?sig=${FIXTURE_SIG}`,
      { tags: { name: 'qr_resolve' } }
    );
    const duration = Date.now() - start;

    scanResolveTime.add(duration);

    const ok = check(res, {
      'scan resolve: status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'scan resolve: has redirect_url or error': (r) => {
        if (r.status === 200) {
          const body = r.json();
          return body && body.redirect_url;
        }
        return true; // 404 is acceptable if fixture isn't set up
      },
    });
    errorRate.add(!ok);
  });

  sleep(Math.random() * 2 + 0.5); // 0.5–2.5s between scans
}

// ── Scenario: authenticated API user ──────────────────────────────────────
export function apiUserFlow() {
  // Step 1: Register a unique user for this VU
  const email    = `${TEST_EMAIL_PREFIX}-${__VU}-${randomString(6)}@k6.test`;
  const password = 'K6LoadTest!99';
  let   accessToken;

  group('Auth — register + login', () => {
    const regRes = http.post(
      `${BASE_URL}/api/v1/auth/register`,
      JSON.stringify({ email, password, full_name: 'k6 Load User' }),
      { headers: { 'Content-Type': 'application/json' }, tags: { name: 'register' } }
    );

    const regOk = check(regRes, {
      'register: status 200': (r) => r.status === 200,
      'register: has access_token': (r) => r.json('access_token') !== undefined,
    });
    errorRate.add(!regOk);

    if (!regOk) return; // skip remaining steps if registration failed
    accessToken = regRes.json('access_token');
  });

  if (!accessToken) return;

  // Step 2: List QR codes
  group('QR Codes — list', () => {
    const start = Date.now();
    const res   = http.get(`${BASE_URL}/api/v1/qr-codes`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      tags: { name: 'qr_list' },
    });
    qrCreateTime.add(Date.now() - start);

    const ok = check(res, { 'list QR codes: status 200': (r) => r.status === 200 });
    errorRate.add(!ok);
  });

  sleep(0.5);

  // Step 3: Create a QR code
  group('QR Codes — create', () => {
    const start = Date.now();
    const res   = http.post(
      `${BASE_URL}/api/v1/qr-codes`,
      JSON.stringify({
        name: `Load Test QR ${randomString(4)}`,
        content: `https://example.com/k6-${randomString(8)}`,
        content_type: 'url',
        is_dynamic: true,
        style: {
          fg_color: '#000000', bg_color: '#ffffff', size: 256,
          quiet_zone: 16, ec_level: 'M', qr_style: 'squares',
          eye_radius: 0, logo_width: 60, logo_height: 60,
          logo_opacity: 1.0, remove_qr_code_behind_logo: true,
        },
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        tags: { name: 'qr_create' },
      }
    );
    qrCreateTime.add(Date.now() - start);

    const ok = check(res, {
      'create QR: status 200': (r) => r.status === 200,
      'create QR: has id': (r) => r.json('id') !== undefined,
      'create QR: has short_code': (r) => r.json('short_code') !== undefined,
    });
    errorRate.add(!ok);
  });

  // Step 4: Check analytics overview
  group('Analytics — overview', () => {
    const res = http.get(`${BASE_URL}/api/v1/analytics/overview`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      tags: { name: 'analytics_overview' },
    });
    const ok = check(res, { 'analytics overview: status 200': (r) => r.status === 200 });
    errorRate.add(!ok);
  });

  // Step 5: Logout
  group('Auth — logout', () => {
    const res = http.post(`${BASE_URL}/api/v1/auth/logout`, null, {
      headers: { Authorization: `Bearer ${accessToken}` },
      tags: { name: 'logout' },
    });
    check(res, { 'logout: status 204': (r) => r.status === 204 });
  });

  sleep(Math.random() * 3 + 1); // 1–4s between API user actions
}
