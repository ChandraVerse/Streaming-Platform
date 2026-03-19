# Content Service

Owns catalog, live channels, schedules, ads, downloads, ratings, and Mux integration.

## Run

```bash
npm install
npm run dev
```

## Environment

- PORT
- MONGODB_URI
- CORS_ORIGIN
- ELASTICSEARCH_URL
- MUX_TOKEN_ID
- MUX_TOKEN_SECRET
- ANALYTICS_SERVICE_URL
- DOWNLOAD_SIGNING_SECRET

## Key Routes

- GET /content
- POST /content
- PUT /content/:id
- GET /content/:id/recommendations
- GET /content/top-ten
- POST /content/bulk-import
- POST /content/bulk-update
- GET /live/channels
- POST /live/channels
- GET /live/channels/:id/schedule
- POST /live/channels/:id/schedule
- GET /live/events
- POST /live/events
- POST /mux/create-asset
- POST /mux/create-live
- POST /downloads/request
- GET /downloads/list
- GET /downloads/stream
