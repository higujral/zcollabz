import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            // Find the transaction by payment link URL or session ID
            // Since we're using Payment Links, we need to get the payment link from the session
            const paymentLinkId = session.payment_link;

            if (paymentLinkId) {
                const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId as string);

                // Update transaction status
                await prisma.transaction.updateMany({
                    where: {
                        paymentLinkUrl: paymentLink.url,
                        status: 'PENDING',
                    },
                    data: {
                        status: 'PAID',
                        stripeSessionId: session.id,
                    },
                });

                console.log(`Transaction updated to PAID for session ${session.id}`);
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            return NextResponse.json(
                { error: 'Failed to update transaction' },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ received: true });
}
