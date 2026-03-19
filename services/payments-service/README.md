# Payments Service

Creates checkout sessions and handles webhook-driven subscription activation.

## Run

```bash
npm install
npm run dev
```

## Environment

- PORT
- CORS_ORIGIN
- AUTH_SERVICE_URL
- PAYMENTS_WEBHOOK_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

## Key Routes

- POST /payments/stripe/checkout-session
- POST /payments/razorpay/order
- POST /payments/upi/intent
- POST /payments/tvod/intent
- POST /payments/stripe/webhook
- POST /payments/razorpay/webhook
