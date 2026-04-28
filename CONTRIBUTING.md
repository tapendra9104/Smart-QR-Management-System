# Contributing to QR Manager

Thank you for your interest in contributing! This guide covers everything you need to get the project running locally and submit quality pull requests.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Project Structure](#project-structure)
4. [Running Tests](#running-tests)
5. [Branching Strategy](#branching-strategy)
6. [Pull Request Guidelines](#pull-request-guidelines)
7. [Code Style](#code-style)
8. [Environment Variables](#environment-variables)

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 22 |
| npm | 10 |
| Java (Temurin) | 25 |
| Maven | 3.9 |
| Docker + Docker Compose | Docker 25 / Compose v2 |

---

## Local Development Setup

### 1. Start the infrastructure

```bash
docker compose up -d postgres redis rabbitmq clickhouse
```

Wait for all services to be healthy:
```bash
docker compose ps
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in APP_JWT_SECRET (any random 32+ char base64 string)
```

### 3. Run the backend

```bash
# Standard mode (uses PostgreSQL, Redis, RabbitMQ from docker-compose)
npm run dev:backend

# Or with the 'local' Spring profile (H2 in-memory DB, no external dependencies)
npm run dev:backend:local
```

The backend starts on **http://localhost:8080**.
Swagger UI is available at **http://localhost:8080/swagger-ui.html**.

### 4. Run the API Gateway

```bash
npm run dev:gateway
```

The gateway starts on **http://localhost:8081** and proxies API calls to the backend.

### 5. Run the frontend

```bash
npm run dev:frontend
```

The frontend starts on **http://localhost:3000**.

### 6. (Optional) Start the observability stack

```bash
docker compose up -d prometheus grafana
```

| Service | URL |
|---------|-----|
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |

---

## Project Structure

```
.
├── app/                    # Next.js app router pages
│   ├── auth/               # Login, register, forgot/reset password
│   ├── dashboard/          # Main dashboard pages
│   └── r/                  # Public QR redirect handler
├── backend/                # Spring Boot backend (Maven)
│   └── src/
│       ├── main/java/…/    # Source code
│       └── test/java/…/    # Unit + integration tests
├── components/             # Shared React components
├── gateway/                # Spring Cloud Gateway (Maven)
├── k8s/                    # Kubernetes manifests
├── lib/                    # Frontend utilities and API client
├── monitoring/             # Prometheus + Grafana configs
├── scripts/                # Smoke test scripts
└── __tests__/              # Frontend test suite (Vitest)
```

---

## Running Tests

### Frontend

```bash
# Run all frontend tests once
npm test

# Watch mode
npm run test:watch

# Lint
npm run lint
```

### Backend

```bash
# All backend tests (unit + integration)
# Note: integration tests require a running PostgreSQL + Redis (docker compose up postgres redis)
npm run test:backend

# Or directly with Maven
mvn -f backend/pom.xml test
```

### Smoke tests (requires full stack running)

```bash
# API smoke test
npm run test:smoke:api

# Browser smoke test (requires Playwright)
npm run test:smoke:browser:install  # One-time setup
npm run test:smoke:browser
```

---

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Protected. Merges trigger Docker image push + optional CD. |
| `feature/<name>` | New features. Branch from `main`. |
| `fix/<name>` | Bug fixes. Branch from `main`. |
| `chore/<name>` | Dependency updates, refactoring, docs. |

---

## Pull Request Guidelines

1. **One concern per PR** — keep PRs small and focused.
2. **Tests are required** — new backend service methods need unit tests; new API endpoints need integration test coverage.
3. **All CI checks must pass** — lint, tests, build, and Docker build.
4. **Update `CHANGELOG.md`** — add your change under `[Unreleased]`.
5. **Write a clear PR description** — explain _why_, not just _what_.

### PR Title Format

```
type(scope): short description

Examples:
feat(qr): add QR code templates
fix(auth): handle expired refresh token on re-login
chore(deps): bump Spring Boot to 3.5.15
```

---

## Code Style

### Backend (Java)
- **Formatting**: Google Java Format (enforced via IDE plugin)
- **Naming**: standard Java conventions; record types for DTOs
- **No field injection** (`@Autowired` on fields) — constructor injection only (Lombok `@RequiredArgsConstructor`)
- **No `Optional.get()` without a check** — always use `.orElseThrow()`

### Frontend (JavaScript / JSX)
- **ESLint**: run `npm run lint` before committing
- **Components**: functional components only, React hooks
- **No inline styles** — use CSS classes or Tailwind utility classes
- **Imports**: absolute imports via `@/` alias (configured in `jsconfig.json`)

---

## Environment Variables

All required and optional variables are documented in [`.env.example`](.env.example).

> [!IMPORTANT]
> Never commit `.env` to the repository. It is listed in `.gitignore`.

Key variables for local development:

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_JWT_SECRET` | ✅ | Base64-encoded 256-bit secret for JWT signing |
| `SPRING_DATASOURCE_URL` | No | Defaults to `jdbc:postgresql://localhost:5432/seqlams` |
| `SPRING_DATA_REDIS_HOST` | No | Defaults to `localhost` |
| `APP_MESSAGING_ENABLED` | No | Set to `true` to enable RabbitMQ async processing |
| `APP_ANALYTICS_OLAP_ENABLED` | No | Set to `true` to enable ClickHouse analytics |
| `APP_MAIL_ENABLED` | No | Set to `true` + configure SMTP to send real emails |
