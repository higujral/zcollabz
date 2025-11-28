import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { clientName, serviceName, amount } = body;

        // Validation
        if (!clientName || !serviceName || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        // Create Stripe Price
        const price = await stripe.prices.create({
            currency: 'usd',
            unit_amount: Math.round(amount * 100), // Convert to cents
            product_data: {
                name: serviceName,
            },
        });

        // Create Stripe Payment Link
        const paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            after_completion: {
                type: 'hosted_confirmation',
                hosted_confirmation: {
                    custom_message: 'Thank you for your payment!',
                },
            },
            metadata: {
                clientName,
                serviceName,
            },
        });

        // Save to database
        const transaction = await prisma.transaction.create({
            data: {
                clientName,
                serviceName,
                amount,
                paymentLinkUrl: paymentLink.url,
                status: 'PENDING',
            },
        });

        return NextResponse.json({
            success: true,
            paymentLink: paymentLink.url,
            transaction,
        });
    } catch (error) {
        console.error('Error creating payment link:', error);
        return NextResponse.json(
            { error: 'Failed to create payment link' },
            { status: 500 }
        );
    }
}
