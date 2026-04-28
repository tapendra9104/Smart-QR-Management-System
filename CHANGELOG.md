# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- `springdoc-openapi-starter-webmvc-ui` — Swagger UI at `/swagger-ui.html`, raw spec at `/v3/api-docs`
- `OpenApiConfig` — OpenAPI definition with JWT + API key security schemes
- Prometheus + Grafana services in `docker-compose.yml` for local observability
- `monitoring/prometheus.yml` — Prometheus scrape configuration for the backend's `/actuator/prometheus`
- `monitoring/grafana/datasources/prometheus.yml` — Auto-provisioned Grafana datasource
- CI/CD pipeline now pushes Docker images to GitHub Container Registry (`ghcr.io`) on merges to `main`
- `cd.yml` — Production deployment workflow via SSH (activate by setting `DEPLOY_ENABLED=true` repo variable + SSH secrets)
- Backend unit tests: `JwtServiceTests`, `AuthServiceTests`, `QrCodeServiceTests` (Mockito, no DB required)
- Frontend tests: `__tests__/lib/api.test.js`, `__tests__/types/qr-validation.test.js`
- Swagger UI endpoints added to `SecurityConfig` public permit list
- `prometheus-data` and `grafana-data` named volumes in `docker-compose.yml`

### Changed
- `package.json` name corrected from `seq-lams-frontend` to `qr-manager`

---

## [0.1.0] — 2026-04-23

### Added
- Full-stack QR management platform with Next.js 16 frontend and Spring Boot 3 backend
- Authentication: JWT access tokens + refresh tokens + API keys
- Account security: failed login tracking, 15-minute lockout after 10 failures, GDPR account deletion
- QR code CRUD: static and dynamic QR codes, 8 content types, bulk creation
- Dynamic QR redirect with HMAC-signed URLs via `RedirectUrlSigner`
- Scheduled lifecycle: `startsAt` / `expiresAt` per QR code, `QrLifecycleService` for automated expiry
- Scan analytics: real-time PostgreSQL store + optional OLAP via ClickHouse
- Async processing via RabbitMQ: scan events and audit log writes are decoupled from the HTTP thread
- Redis caching (`qrByShortCode`) + Redis-backed rate limiting
- Per-user usage limits via `UsageLimitService`
- Webhook integrations: `qr.created`, `qr.updated`, `qr.deleted`, `qr.scanned` event types
- Email notifications: SMTP service + console fallback, HMAC-signed reset links
- Data retention: configurable TTL for scan events, audit logs, and refresh tokens via scheduled jobs
- Audit logging for all state-changing operations, exportable as JSON/CSV
- Cross-browser frontend: safe-area CSS, reduced-motion support, 44px minimum touch targets
- PWA manifest, robots.txt, sitemap.xml for SEO
- Docker Compose stack: PostgreSQL 16, Redis 7.4, RabbitMQ 3.13, ClickHouse 24.8, backend, gateway, frontend
- Kubernetes manifests: base + AWS overlays
- GitHub Actions CI: lint → unit tests → build → docker image builds
- Spring Boot Actuator with `/actuator/health/readiness` and `/actuator/health/liveness` probes
- Micrometer + Prometheus metrics registry

[Unreleased]: https://github.com/your-org/qr-manager/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/qr-manager/releases/tag/v0.1.0
