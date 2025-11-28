# zcollabz - Payment Link Generator

A Next.js application for generating Stripe payment links and tracking payments.

## Features

- 🔗 Generate secure Stripe payment links
- 💳 Track payment status (Pending/Paid)
- 🎨 Modern glassmorphism UI design
- 📊 Real-time transaction dashboard
- 🔔 Automatic webhook integration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **Hosting**: DigitalOcean App Platform

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Neon)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. Set Up Database

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Stripe Webhook Setup

### Local Development

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret and add it to your `.env` file

### Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret and add it to your environment variables

## Deployment to DigitalOcean

### Prerequisites

- DigitalOcean account
- Neon database (free tier)
- Stripe account

### Steps

1. **Create Neon Database**
   - Sign up at https://neon.tech
   - Create a new project
   - Copy the connection string

2. **Deploy to DigitalOcean App Platform**
   - Connect your GitHub repository
   - Select "Web Service"
   - Set environment variables:
     - `DATABASE_URL`
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`
     - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Deploy!

3. **Run Database Migration**
   - After deployment, run:
     ```bash
     npx prisma migrate deploy
     ```

4. **Configure Stripe Webhook**
   - Add your production URL to Stripe webhooks
   - Update `STRIPE_WEBHOOK_SECRET` with production secret

## Usage

1. Open the admin dashboard
2. Fill in the form:
   - Client Name
   - Service Name
   - Amount (USD)
3. Click "Generate Payment Link"
4. Copy the link and send it to your client
5. Client pays via Stripe
6. Transaction status automatically updates to "Paid"

## Project Structure

```
zcollabz/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── create-payment-link/
│   │   │   ├── transactions/
│   │   │   └── webhooks/stripe/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── prisma.ts
│       └── stripe.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

## License

MIT
