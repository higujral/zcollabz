# Payment App - Quick Setup Guide

## ✅ Database Setup Complete!

Your Neon database is connected and the Transaction table has been created.

**Connection**: Neon PostgreSQL (Free Tier)
**Database**: neondb
**Status**: ✅ Connected and migrated

---

## 🔑 Next Step: Get Stripe API Keys

### 1. Go to Stripe Dashboard
Visit: https://dashboard.stripe.com/test/apikeys

### 2. Get Your API Keys

You need **3 keys**:

#### a) Secret Key (Backend)
- Click "Reveal test key" next to "Secret key"
- Copy the key starting with `sk_test_...`

#### b) Publishable Key (Frontend)
- Copy the key starting with `pk_test_...`

#### c) Webhook Secret (for production)
- Go to: https://dashboard.stripe.com/test/webhooks
- Click "Add endpoint"
- Endpoint URL: `http://localhost:3000/api/webhooks/stripe` (for testing)
- Select event: `checkout.session.completed`
- Click "Add endpoint"
- Click "Reveal" next to "Signing secret"
- Copy the key starting with `whsec_...`

### 3. Update Your .env File

Replace the placeholder values in `/Users/hiteshgujral/Projects/zcollabz/.env`:

```env
# Database (Neon) - Already configured ✅
DATABASE_URL="postgresql://neondb_owner:npg_VZU6ONlytEm1@ep-spring-hill-ahwc2djr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Stripe - Replace these with your actual keys
STRIPE_SECRET_KEY="sk_test_YOUR_ACTUAL_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_ACTUAL_SECRET_HERE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY_HERE"
```

### 4. Restart the Dev Server

After updating the .env file:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## 🧪 Testing Locally with Stripe CLI (Optional but Recommended)

To test webhooks locally:

### Install Stripe CLI
```bash
brew install stripe/stripe-cli/stripe
```

### Login to Stripe
```bash
stripe login
```

### Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret starting with `whsec_...` - use this in your `.env` file.

---

## 🚀 Using the App

1. **Open**: http://localhost:3000
2. **Fill the form**:
   - Client Name: "Test Client"
   - Service Name: "Consulting"
   - Amount: 100.00
3. **Click**: "Generate Payment Link"
4. **Copy the link** and open it in a new tab
5. **Use Stripe test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
6. **Complete payment**
7. **Check your dashboard** - status should update to "Paid"

---

## 📊 Database Access

To view your data in Neon:
1. Go to: https://console.neon.tech
2. Select your project
3. Click "SQL Editor"
4. Run: `SELECT * FROM "Transaction";`

---

## 🐛 Troubleshooting

### "Stripe is not defined" error
- Make sure you've added your Stripe keys to `.env`
- Restart the dev server

### Webhook not working
- Use Stripe CLI for local testing
- Make sure webhook secret is correct

### Database connection error
- Check that DATABASE_URL in `.env` is correct
- Neon free tier scales to zero - first query may take 1-3 seconds

---

## 📦 Deployment Checklist

When ready to deploy to DigitalOcean:

- [ ] Push code to GitHub
- [ ] Create DigitalOcean App
- [ ] Add environment variables (all 4 from .env)
- [ ] Deploy
- [ ] Update Stripe webhook URL to production URL
- [ ] Test with real payment

---

**Current Status**: Database ✅ | Stripe ⏳ | Deployment ⏳
