import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Pin to a GA Stripe API version; avoid prerelease versions that can reject valid params
    apiVersion: '2024-06-20',
});
