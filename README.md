# 🎬 OTT Streaming Platform

> Netflix / Prime / Hotstar–style OTT platform built as a multi-service Node.js + Next.js system.  
> Includes authentication, profiles, content catalog, live TV / sports, subscriptions, analytics, social features, ratings, and admin tools. 🚀

---

## � Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-layout)
- [Getting Started](#-getting-started)
  - [Prerequisites](#-prerequisites)
  - [Environment Variables](#-environment-variables)
  - [Run with Docker](#-run-with-docker-)
  - [Run Services Manually](#-run-services-manually)
- [Testing & Quality](#-linting-typechecking--tests)
- [Status & Roadmap](#-status--gaps)

---

## 🌍 Overview

Unified OTT is a demonstration-grade, production-inspired streaming platform that shows how you might architect a modern OTT stack:

- Multi-tenant profiles with kids mode.
- Live TV and sports support.
- Subscriptions with Stripe/Razorpay hooks.
- Search, recommendations, and social signals.
- Admin interface for content management.

It is designed as a realistic blueprint and playground rather than a ready-to-deploy commercial product.

---

## �🧩 Architecture Overview

- **Frontend**: Next.js app (apps/frontend)
  - App Router with pages for signup, signin, dashboard, browse, search, trending, continue watching, live, title detail, subscribe, and admin analytics/content.
  - Tailwind-based styling (globals only, no CSS-in-JS).
- **API Gateway**: Express reverse proxy (services/api-gateway)
  - Proxies `/api/*` to the underlying microservices.
- **Auth Service**: (services/auth-service)
  - Email/password login, email OTP flow, and simple OAuth-style demo endpoints.
  - Multi-profile support (up to 5 profiles, kids flag).
  - Subscription records + referral tracking.
- **Content Service**: (services/content-service)
  - Content model with movies, series, and live content.
  - Search indexing with Elasticsearch.
  - Mux VOD integration and rating/review storage.
- **Payments Service**: (services/payments-service)
  - Stripe + Razorpay integration for subscriptions.
- **Analytics Service**: (services/analytics-service)
  - Event ingestion for playback and lifecycle events.
  - Aggregations for trending, history, and continue watching.

Everything is wired together via [`docker-compose.yml`](file:///d:/Projects/Streaming%20Platform/docker-compose.yml) so you can run the full stack easily. 🐳

---

## ⚙️ Tech Stack

- **Language & Runtime**
  - TypeScript
  - Node.js 22+
- **Frontend**
  - Next.js App Router
  - React 19
  - Tailwind CSS (utility classes in `globals.css`)
- **Backend**
  - Express 5
  - MongoDB (via Mongoose)
  - Elasticsearch (content search)
  - Mux (video streaming assets)
  - Stripe + Razorpay (payments)
- **Infrastructure & Tooling**
  - Docker + Docker Compose
  - Node `test` runner + supertest
  - Cypress for E2E

---

## ✨ Key Features

### Accounts, Profiles & Auth

- Email/password signup and signin.
- Email OTP login flow for passwordless access.
- Demo OAuth login paths (Google/Facebook-style).
- Multiple profiles per account, including kids-safe profiles.

### Content Catalog & Search

- Create and manage content (movies, series, live).
- Text search over titles and descriptions via Elasticsearch.
- Browse and search pages in the frontend:
  - `/browse` – generic catalog.
  - `/search` – query via content service search endpoint.

### Live TV & Live Sports 🏟️

- Content model supports:
  - `kind: "live"`
  - `isLive: boolean`
  - `liveStartTime: Date`
- Backend filters:
  - `GET /content?live=true` → all live content.
  - `GET /content?liveNow=true` → currently live (`isLive` and `liveStartTime <= now`).
- Frontend:
  - `/live` page with:
    - **Live Now** row.
    - **Live Sports** row (genre-detected sports titles).
    - **All Live Channels** grid.
  - Live badge on title detail page (`Live now` / `Live starting soon`).
  - Dashboard “Live Now” row.

### Playback & Analytics 📊

- Video playback via Mux (HLS stream URL).
- `AnalyticsVideoPlayer` client component:
  - Posts `play`, `pause`, and `complete` events to analytics service.
  - Stores and resumes from last played position per title.
- Analytics service:
  - `POST /analytics/events` – ingest events.
  - `GET /analytics/trending` – popular titles in a time window.
  - `GET /analytics/continue-watching` – last partial plays.
  - `GET /analytics/history` – completed content history.
- Frontend:
  - `/trending` page.
  - `/continue-watching` page and “Continue Watching” row on dashboard.

### Ratings & Reviews ⭐

- Backend:
  - `RatingModel` in content service.
  - `POST /ratings/:contentId` – create rating (1–5) with optional review text.
  - `GET /ratings/:contentId` – fetch latest ratings.
- Frontend:
  - `RatingsSection` on the title detail page:
    - 1–5 star rating control.
    - Optional short text review.
    - Displays average rating and recent reviews.
  - Recommendations now consider rating data to prefer highly rated content.

### Recommendations & Top 10 🧠

- Backend:
  - `GET /content/:id/recommendations`:
    - Starts from similar content (matching genres and kids flag).
    - Ranks by average rating, rating count, then recency.
- Frontend:
  - On the title page: “Because you watched this” row.
  - Dashboard:
    - “Top 10 Overall” row:
      - Uses analytics trending counts over a long window (e.g., 30 days).
      - Shows rank badge `#1`–`#10`.

### Social & “Friends Are Watching” 🤝

- Backend (auth-service):
  - Follow model and routes:
    - Follow/unfollow endpoints.
    - Lists of following and followers.
- Frontend:
  - Dashboard “Following” section.
  - “From People You Follow” row:
    - For each followee, uses analytics history to find completed titles.
    - Ranks titles by how many followees completed them and recency.

### Admin Tools 🛠️

- Admin Analytics:
  - `/admin/analytics` – summary page for event counts.
- Admin Content Management:
  - `/admin/content` – simple CMS-like UI:
    - List all titles.
    - Create new titles or edit existing ones.
    - Edit metadata: genres, languages, cast, crew, age rating, images, kind, kids flag, live flags.
    - Attach Mux assets via backend `/mux/attach-asset`.
    - Triggers search re-index on create/update.

### Subscriptions & Monetization 💳

- Subscription plans defined in auth-service.
- Backend:
  - `GET /subscriptions/plans` – fetch available plans.
  - `POST /subscriptions/activate` – activate subscription for a user (+ referral).
  - Stripe checkout session and Razorpay order creation (payments-service).
- Frontend:
  - `/subscribe` page:
    - Plan selection.
    - Referral code support.
    - Direct activation call + optional Stripe / Razorpay flows.

### Feature Flags & Experiments 🎛️

- Flags:
  - `topTenRow`
  - `friendsRow`
  - `liveNowRow`
- Implementation:
  - `apps/frontend/lib/feature-flags.ts` computes flags per client:
    - Uses `NEXT_PUBLIC_FEATURE_FLAGS` (JSON) for global overrides.
    - Persists randomized per-user assignment in `localStorage.featureFlags`.
  - Dashboard:
    - “Experiments” panel with checkboxes to toggle each row on/off.
    - Rows respect flags:
      - Top 10, Friends row, Live Now row.

### Testing & QA ✅

- **Backend services**:
  - Auth, Content, Analytics:
    - Use Node’s built-in `node:test` + `supertest`.
    - Each has a basic health endpoint test:
      - `tests/health.test.ts` calls `/health` and asserts the service name.
- **Frontend**:
  - Cypress E2E configured in `apps/frontend`:
    - `cypress.config.ts` with `baseUrl: http://localhost:3000`.
    - Spec: `cypress/e2e/signup-subscribe-play.cy.js`:
      - Full flow: signup → signin → subscribe → dashboard → browse → open title.

---
---

## 🏗️ Project Layout

```text
.
├─ apps/
│  └─ frontend/            # Next.js frontend
│     ├─ app/              # App Router pages (dashboard, live, etc.)
│     ├─ components/       # Reusable UI (player, grids, ratings)
│     ├─ lib/              # Types, API helpers, feature flags
│     └─ cypress/          # E2E tests
├─ services/
│  ├─ api-gateway/         # HTTP proxy for backend services
│  ├─ auth-service/        # Auth, profiles, subscriptions, social
│  ├─ content-service/     # Catalog, search, mux, ratings
│  ├─ payments-service/    # Stripe & Razorpay integration
│  └─ analytics-service/   # Events, trending, history
├─ docker-compose.yml      # Full stack orchestration
├─ package.json            # Workspace root scripts
└─ README.md               # You are here 🙂
```

---

## 🚀 Getting Started

### 🧰 Prerequisites

- Node.js 22+
- Docker (for full stack with MongoDB + Elasticsearch + all services)

### 🔐 Environment Variables

Minimal important variables (many have sensible defaults):

- **Frontend (apps/frontend)**:
  - `NEXT_PUBLIC_API_BASE_URL` – base URL for the API gateway (e.g. `http://localhost:4000`).
  - `API_BASE_URL` – same as above for server components.
  - Optional:
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
    - `NEXT_PUBLIC_FEATURE_FLAGS` – JSON for global feature flags.
- **Auth Service**:
  - `MONGODB_URI`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `CORS_ORIGIN` (default `http://localhost:3000`).
- **Content Service**:
  - `MONGODB_URI`
  - `ELASTICSEARCH_URL`
  - `CORS_ORIGIN`
- **Analytics Service**:
  - `MONGODB_URI`
  - `CORS_ORIGIN`
- **Payments Service**:
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

Check each service’s `src/config/env.ts` for the full schema. 🔍

### 🐳 Run with Docker

From the repo root:

```bash
docker-compose up --build
```

This will start:

- MongoDB
- Elasticsearch
- Auth, Content, Payments, Analytics services
- API Gateway
- Frontend (Next.js) on `http://localhost:3000`

### 🧑‍💻 Run Services Manually

From the root:

```bash
# Frontend only
npm run dev:frontend

# Gateway only (needs services running)
npm run dev:api

# Auth service only
npm run dev:auth
```

Or in each service/app directory:

```bash
cd services/auth-service
npm run dev
```

---

## 🧪 Linting, Typechecking & Tests

From the root:

```bash
# Lint all workspaces
npm run lint

# Typecheck all workspaces
npm run typecheck

# Run tests for workspaces that define them
npm test
```

Per service:

```bash
cd services/auth-service
npm test   # node:test + supertest health checks

cd services/content-service
npm test

cd services/analytics-service
npm test
```

Frontend E2E with Cypress:

```bash
cd apps/frontend
npm run dev          # in one terminal
npm run cypress:open # or: npm test
```

---

## 🚦 Status & Gaps

### ✅ Completed

- Multi-service architecture wired with API gateway and Docker Compose.
- Frontend routes for core journeys: browse, search, trending, title detail, live, dashboard, signup/signin, subscribe, and admin pages.
- Auth, content, analytics, payments, and social service scaffolding with Express + TypeScript.
- Feature flags and experiments for dashboard rows.
- Analytics-driven rows (trending, continue watching, top 10, friends).
- Ratings & review flow with backend + frontend integration.
- Landing page styled with an OTT-inspired hero and CTA layout.
- Baseline test coverage (health checks + a Cypress happy-path flow).

### 🧭 Remaining / Roadmap

- Full ad-insertion and ad decisioning pipeline.
- Production-grade auth hardening (device fingerprinting, advanced abuse controls).
- Admin tooling for bulk content upload, CSV import, and editorial workflows.
- Expanded test coverage across services, UI, and critical workflows.
- Observability stack (structured logs, traces, metrics dashboards, alerting).
- Content delivery optimizations (image CDN, adaptive artwork, caching strategy).
