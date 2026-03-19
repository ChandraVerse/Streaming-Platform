# Auth Service

Handles authentication, profiles, subscriptions, social graph, rentals, and partner entitlements.

## Run

```bash
npm install
npm run dev
```

## Environment

- PORT
- MONGODB_URI
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- ANALYTICS_SERVICE_URL
- ADMIN_API_SECRET
- INTERNAL_API_SECRET
- PAYMENTS_WEBHOOK_SECRET

## Key Routes

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/request-otp
- POST /auth/verify-otp
- POST /auth/device/code
- POST /auth/device/verify
- POST /auth/device/token
- GET /users/me
- PUT /users/activity-visibility
- GET /users/search
- POST /users/reset-access
- GET /social/following
- POST /social/follow
- POST /rentals/purchase
- GET /rentals
