# QR Manager

[![Frontend](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-black?logo=vercel)](https://qr-generator-alpha-ivory.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Live%20on%20Render-46E3B7?logo=render)](https://qr-generator-backend-dadr.onrender.com/actuator/health)
[![Gateway](https://img.shields.io/badge/Gateway-Live%20on%20Render-46E3B7?logo=render)](https://qr-generator-gateway-dadr.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Enterprise-grade QR Code Lifecycle & Analytics Management Platform built for production-scale deployment.

## 🚀 Live Demo

| Service | URL |
|---|---|
| 🌐 **Frontend (Vercel)** | https://qr-generator-alpha-ivory.vercel.app |
| ⚙️ **Backend API (Render)** | https://qr-generator-backend-dadr.onrender.com |
| 🔀 **API Gateway (Render)** | https://qr-generator-gateway-dadr.onrender.com |
| ❤️ **Health Check** | https://qr-generator-backend-dadr.onrender.com/actuator/health |

> **Note:** Services run on Render's free tier and may take ~30–60 seconds to wake up after inactivity (cold start).

## Tech Stack

- Frontend: React.js with Next.js 15, preserving the existing UI
- Backend: Java 21 + Spring Boot 3
- Data: PostgreSQL (Neon) + Redis
- Messaging: RabbitMQ
- OLAP analytics: ClickHouse
- Edge/API entry: Spring Cloud Gateway
- Security: Spring Security + JWT
- Deployment: Vercel (frontend), Render (backend), Docker & Kubernetes manifests included

## Architecture

- `app/`, `components/`, `hooks/`, `lib/`: unchanged React UI and frontend logic
- `backend/`: Spring Boot API for auth, QR lifecycle, analytics, audit logging, and public QR resolution
- `gateway/`: separate Spring Cloud Gateway service for API ingress and routing
- `docker-compose.yml`: local full-stack orchestration for frontend, gateway, backend, PostgreSQL, Redis, RabbitMQ, and ClickHouse
- `k8s/base/`: Kubernetes base manifests
- `k8s/aws/`: AWS EKS overlay with ALB ingress annotations and ECR image mapping

## Core Capabilities

- Secure JWT login, registration, token refresh, and logout
- Dynamic QR generation and short-code redirection
- Bulk QR creation for enterprise workflows
- Dashboard analytics, scan tracking, and audit history
- Static URL QR tracking through signed backend redirect payloads
- Start/end lifecycle windows with automatic expiry enforcement
- API keys for server-to-server integrations
- Signed outbound webhooks for QR lifecycle and scan events
- Export endpoints for analytics and audit logs in CSV/JSON
- Per-workspace quotas for QR codes, API keys, and webhooks
- Redis-backed cache for QR resolution and high-traffic redirect lookups
- Flyway-managed PostgreSQL schema
- Separate API Gateway service for API ingress and backend routing
- RabbitMQ-backed async scan and audit processing
- ClickHouse-powered OLAP queries for analytics dashboards
- Signed QR redirect URLs to reduce payload tampering risk
- Redis-backed rate limiting for public redirect and auth endpoints
- Async, retry-backed scan and audit processing for lower redirect latency
- Privacy-friendly retention cleanup for scan, audit, and token data
- Prometheus-ready actuator metrics and CI workflow support

## Local Development

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Start PostgreSQL, Redis, RabbitMQ, and ClickHouse:

```bash
docker compose up -d postgres redis rabbitmq clickhouse
```

3. Start the backend:

```bash
mvn -f backend/pom.xml spring-boot:run
```

For a dependency-light local profile that uses the built-in H2 store and simple cache:

```bash
npm run dev:backend:local
```

4. Start the gateway:

```bash
mvn -f gateway/pom.xml spring-boot:run
```

5. Start the frontend:

```bash
npm install
npm run dev
```

6. Open `http://localhost:3000`

## Full Docker Stack

Run the entire platform with containers:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Gateway: `http://localhost:8081`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ UI: `http://localhost:15672`
- ClickHouse HTTP: `http://localhost:8123`

## Kubernetes

Base manifests are under `k8s/base` and include:

- namespace
- config and secrets
- PostgreSQL StatefulSet
- Redis Deployment
- RabbitMQ Deployment
- ClickHouse StatefulSet
- Spring Cloud Gateway Deployment + Service
- Spring Boot backend Deployment + Service
- React frontend Deployment + Service
- Ingress

Apply the base manifests:

```bash
kubectl apply -k k8s/base
```

## AWS / EKS

The AWS overlay under `k8s/aws` is designed for EKS with the AWS Load Balancer Controller.

Before applying:

1. Push the frontend and backend images to Amazon ECR.
2. Replace the placeholder ECR registry values in `k8s/aws/kustomization.yaml`.
3. Update the public hostname in `k8s/base/configmap.yaml`.
4. Replace the placeholder secrets in `k8s/base/secrets.yaml`.

Deploy to EKS:

```bash
kubectl apply -k k8s/aws
```

## Build and Test

```bash
npm run build
npm run test:gateway
npm run test:backend
```

Live smoke verification against a running local stack:

```bash
npm run test:smoke:api
npm run test:smoke:browser:install
npm run test:smoke:browser
```

## Enterprise Hardening Added

- The project remains a modular Spring Boot backend instead of forcing premature microservices.
- Redirect scans are protected with HMAC-signed resolve URLs generated by the backend.
- Public QR resolve and auth entry points are rate limited with Redis.
- Scan logging and audit writes run asynchronously with retry support to reduce redirect-path latency.
- Stored IP data is anonymized before persistence.
- Background retention cleanup removes stale scan events, audit logs, and expired refresh tokens.
- Background lifecycle automation deactivates expired QR codes and emits expiry events.
- Prometheus metrics are exposed through Spring Boot Actuator for observability.
- RabbitMQ decouples redirect-path requests from downstream scan and audit persistence.
- ClickHouse serves dashboard and QR drill-down analytics without overloading the transactional store.
- Spring Cloud Gateway provides a separate API ingress layer ready for future auth, routing, and rate-limit policies.
- A GitHub Actions pipeline validates frontend and backend builds on every push and pull request.
- Suspicious scan detection flags burst traffic patterns and can emit webhook notifications.
- API keys can authenticate against the same secured API surface as JWT clients.

## Notes

- The frontend still uses the same UI and route structure as the original project.
- Frontend auth is handled through secure cookie-backed Next route handlers.
- The frontend is expected to call the gateway on `BACKEND_API_URL`, which defaults to `http://localhost:8081`.
- Backend security is enforced with Spring Security and JWT tokens.
- Redis is used for fast QR short-code caching.
- PostgreSQL is the primary system of record for users, QR data, analytics, and audits.
- RabbitMQ is the async event backbone for scan and audit processing.
- ClickHouse is the dedicated OLAP store for analytics queries and reporting.
