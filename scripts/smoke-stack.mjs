import { setTimeout as delay } from "node:timers/promises";

const FRONTEND_URL = normalizeBaseUrl(process.env.FRONTEND_URL || "http://localhost:3000");
const GATEWAY_URL = normalizeBaseUrl(process.env.GATEWAY_URL || "http://localhost:8081");
const BACKEND_URL = normalizeBaseUrl(process.env.BACKEND_URL || "http://localhost:8080");

const DEFAULT_STYLE = {
  fg_color: "#000000",
  bg_color: "#ffffff",
  size: 256,
  quiet_zone: 16,
  ec_level: "M",
  qr_style: "squares",
  eye_radius: 0,
  logo_width: 60,
  logo_height: 60,
  logo_opacity: 1,
  remove_qr_code_behind_logo: true,
};

async function main() {
  await assertStatus(`${BACKEND_URL}/actuator/health`, 200, "backend health");
  await assertStatus(`${GATEWAY_URL}/actuator/health`, 200, "gateway health");
  await assertStatus(FRONTEND_URL, 200, "frontend homepage");

  const email = `smoke-${Date.now()}@example.com`;
  const registration = await jsonRequest(`${GATEWAY_URL}/api/v1/auth/register`, {
    method: "POST",
    body: {
      email,
      password: "Password123!",
      full_name: "Smoke User",
    },
  });

  const accessToken = registration.access_token;
  assert(accessToken, "registration did not return access_token");

  const qr = await jsonRequest(`${GATEWAY_URL}/api/v1/qr-codes`, {
    method: "POST",
    bearerToken: accessToken,
    body: {
      name: "Smoke Static QR",
      content: "https://example.com/smoke-static",
      content_type: "url",
      destination_url: null,
      is_dynamic: false,
      style: DEFAULT_STYLE,
    },
  });

  assert(qr.qr_payload?.includes("/r/"), "static QR did not receive tracked redirect payload");
  assert(qr.content === "https://example.com/smoke-static", "static QR content changed unexpectedly");

  const headResponse = await fetch(qr.qr_payload, {
    method: "HEAD",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmokeHead/1.0",
    },
    redirect: "manual",
  });
  assertRedirect(headResponse, "HEAD public redirect");

  await waitForScanCount(accessToken, qr.id, 0);

  const missingQrResponse = await fetch(`${FRONTEND_URL}/r/does-not-exist`, {
    method: "GET",
    redirect: "manual",
  });
  assert(missingQrResponse.status === 404, `missing QR should return 404, received ${missingQrResponse.status}`);

  const getResponse = await fetch(qr.qr_payload, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    },
    redirect: "manual",
  });
  assertRedirect(getResponse, "GET public redirect");
  assert(getResponse.headers.get("location") === "https://example.com/smoke-static", "redirect target was incorrect");

  const qrAnalytics = await waitForScanCount(accessToken, qr.id, 1);

  const apiKeyCreation = await jsonRequest(`${GATEWAY_URL}/api/v1/integrations/api-keys`, {
    method: "POST",
    bearerToken: accessToken,
    body: {
      name: "Smoke API Key",
    },
  });
  const plaintextApiKey = apiKeyCreation.plaintext_key;
  assert(plaintextApiKey?.startsWith("seq_"), "API key was not returned");

  const apiKeyMe = await jsonRequest(`${GATEWAY_URL}/api/v1/auth/me`, {
    method: "GET",
    apiKey: plaintextApiKey,
  });
  assert(apiKeyMe.email === email, "API key auth did not resolve the created user");

  const webhookEvents = await jsonRequest(`${GATEWAY_URL}/api/v1/integrations/webhooks/events`, {
    method: "GET",
    bearerToken: accessToken,
  });
  assert(Array.isArray(webhookEvents) && webhookEvents.includes("qr.scanned"), "webhook events list is incomplete");

  const webhook = await jsonRequest(`${GATEWAY_URL}/api/v1/integrations/webhooks`, {
    method: "POST",
    bearerToken: accessToken,
    body: {
      name: "Smoke Webhook",
      target_url: "https://example.com/webhook",
      subscribed_events: ["qr.created", "qr.scanned"],
    },
  });
  assert(webhook.webhook?.id, "webhook was not created");
  assert(webhook.signing_secret, "webhook signing secret was not returned");

  const exportResponse = await fetch(`${GATEWAY_URL}/api/v1/exports/audit-logs?format=json`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  assert(exportResponse.ok, `audit export failed with status ${exportResponse.status}`);
  assert((exportResponse.headers.get("content-disposition") || "").includes("audit-logs.json"), "export filename was incorrect");

  console.log(JSON.stringify({
    backend: BACKEND_URL,
    gateway: GATEWAY_URL,
    frontend: FRONTEND_URL,
    user: email,
    qr_id: qr.id,
    short_code: qr.short_code,
    qr_payload: qr.qr_payload,
    missing_qr_status: missingQrResponse.status,
    scans_after_head_and_get: qrAnalytics.total_scans,
    api_key_prefix: apiKeyCreation.api_key?.key_prefix,
    webhook_id: webhook.webhook?.id,
    export_content_type: exportResponse.headers.get("content-type"),
  }, null, 2));
}

async function waitForScanCount(accessToken, qrId, expectedCount) {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const analytics = await jsonRequest(`${GATEWAY_URL}/api/v1/analytics/qr-codes/${qrId}`, {
      method: "GET",
      bearerToken: accessToken,
    });
    if (analytics.total_scans === expectedCount) {
      return analytics;
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for total_scans=${expectedCount}`);
}

async function assertStatus(url, expected, label) {
  const response = await fetch(url, { redirect: "manual" });
  if (response.status !== expected) {
    throw new Error(`${label} returned ${response.status}, expected ${expected}`);
  }
}

async function jsonRequest(url, { method = "GET", bearerToken, apiKey, body } = {}) {
  const headers = new Headers({
    Accept: "application/json",
  });
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }
  if (apiKey) {
    headers.set("Authorization", `ApiKey ${apiKey}`);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
  }

  return payload;
}

function assertRedirect(response, label) {
  assert([301, 302, 303, 307, 308].includes(response.status), `${label} did not return a redirect status`);
  assert(Boolean(response.headers.get("location")), `${label} did not include a location header`);
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
