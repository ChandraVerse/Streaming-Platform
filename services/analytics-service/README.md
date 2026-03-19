# Analytics Service

Collects events, powers recommendations, experiments, activity feed, and dashboards.

## Run

```bash
npm install
npm run dev
```

## Environment

- PORT
- MONGODB_URI
- CORS_ORIGIN
- AUTH_SERVICE_URL
- INTERNAL_API_SECRET

## Key Routes

- POST /analytics/events
- GET /analytics/summary
- GET /analytics/trending
- GET /analytics/continue-watching
- GET /analytics/history
- GET /analytics/recommendations/personalized
- GET /analytics/recommendations/related
- GET /analytics/activity-feed
- GET /analytics/notifications
- GET /analytics/experiments
- POST /analytics/experiments
- POST /analytics/experiments/assign
