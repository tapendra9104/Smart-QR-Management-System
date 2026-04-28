import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
const outputDir = path.resolve("output/playwright");

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const qrName = `Smoke Browser QR ${Date.now()}`;
  const email = `browser-${Date.now()}@example.com`;

  try {
    await page.goto(`${FRONTEND_URL}/auth/sign-up`, { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Password123!");
    await page.getByLabel("Confirm Password", { exact: true }).fill("Password123!");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/dashboard$/);
    await page.getByRole("heading", { name: /dashboard/i }).waitFor();

    await page.goto(`${FRONTEND_URL}/dashboard/create`, { waitUntil: "networkidle" });
    await page.getByLabel("QR Code Name").fill(qrName);
    await page.getByLabel("Website URL").fill("https://example.com/browser-smoke");
    await page.getByRole("button", { name: "Save QR Code" }).click();

    await page.waitForURL(/\/dashboard\/codes$/);
    await page.getByText(qrName).waitFor();

    await page.locator('a[href^="/dashboard/codes/"]').first().click();
    await page.waitForURL(/\/dashboard\/codes\/.+/);
    await page.getByRole("heading", { name: qrName }).waitFor();
    await page.getByText("https://example.com/browser-smoke").waitFor();
    await page.locator("canvas").first().waitFor();

    await page.getByRole("button", { name: /Download/ }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("menuitem", { name: /PNG.*200px/i }).click(),
    ]);
    assert(download.suggestedFilename().endsWith(".png"), "QR download did not produce a PNG filename");
    const downloadPath = path.join(outputDir, "browser-smoke-qr-download.png");
    await download.saveAs(downloadPath);
    const downloadStats = await stat(downloadPath);
    assert(downloadStats.size > 1000, "QR download file was unexpectedly small");

    await invalidateAccessCookie(context);
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /dashboard/i }).waitFor();

    await page.screenshot({ path: path.join(outputDir, "browser-smoke-success.png"), fullPage: true });
  } catch (error) {
    await page.screenshot({ path: path.join(outputDir, "browser-smoke-failure.png"), fullPage: true }).catch(() => undefined);
    throw error;
  } finally {
    await browser.close();
  }
}

async function invalidateAccessCookie(context) {
  const cookies = await context.cookies(FRONTEND_URL);
  const accessCookie = cookies.find((cookie) => cookie.name === "seq_access_token");
  const refreshCookie = cookies.find((cookie) => cookie.name === "seq_refresh_token");
  if (!accessCookie || !refreshCookie) {
    throw new Error("Expected auth cookies after sign-up");
  }

  const { name, expires, httpOnly, secure, sameSite } = accessCookie;
  await context.addCookies([{
    name,
    expires,
    httpOnly,
    secure,
    sameSite,
    url: FRONTEND_URL,
    value: "broken.access.token",
  }]);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
