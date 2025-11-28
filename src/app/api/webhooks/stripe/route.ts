import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { generateReceiptPdf } from '@/lib/pdf';
import { uploadPdf, getPdfUrl } from '@/lib/s3';
import { sendEmail, emailEnabled } from '@/lib/email';
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

                // Update invoices first
                const invoice = await prisma.invoice.findFirst({
                    where: { paymentLinkUrl: paymentLink.url },
                });

                // Retrieve payment method details for receipt
                let paymentMethod: string | null = null;
                let stripeReceiptUrl: string | null = null;

                if (session.payment_intent) {
                    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
                        expand: ['latest_charge'],
                    });
                    const charge = (paymentIntent.latest_charge as Stripe.Charge) || null;
                    if (charge && charge.payment_method_details) {
                        const card = charge.payment_method_details.card;
                        if (card) {
                            paymentMethod = `${card.brand?.toUpperCase() || 'CARD'} •••• ${card.last4}`;
                        }
                        stripeReceiptUrl = charge.receipt_url || null;
                    }
                }

                if (invoice) {
                    // Update invoice status
                    await prisma.invoice.update({
                        where: { id: invoice.id },
                        data: {
                            status: 'PAID',
                            paidAt: new Date(),
                            stripeSessionId: session.id,
                        },
                    });

                    // Generate and upload receipt PDF
                    try {
                        const receiptBuffer = await generateReceiptPdf({
                            invoiceNumber: invoice.invoiceNumber,
                            clientName: invoice.clientName,
                            clientEmail: invoice.clientEmail,
                            serviceName: invoice.serviceName,
                            amount: invoice.amount,
                            paidAt: new Date(),
                            paymentMethod,
                            stripeReceiptUrl,
                        });
                        const receiptKey = `receipts/${invoice.id}.pdf`;
                        await uploadPdf(receiptKey, receiptBuffer);
                        const receiptUrl = await getPdfUrl(receiptKey);

                        await prisma.invoice.update({
                            where: { id: invoice.id },
                            data: {
                                receiptPdfUrl: receiptUrl,
                                receiptPdfKey: receiptKey,
                                stripeReceiptUrl,
                            },
                        });

                        if (emailEnabled()) {
                            const html = `
                                <p>Hello ${invoice.clientName},</p>
                                <p>Thank you for your payment. Your receipt is available here: <a href="${receiptUrl}">Download Receipt</a></p>
                                <p>Payment link: <a href="${invoice.paymentLinkUrl}">${invoice.paymentLinkUrl}</a></p>
                                <p>Thank you,<br/>ZCollabz</p>
                            `;
                            await sendEmail({
                                to: invoice.clientEmail,
                                subject: `Receipt for Invoice ${invoice.invoiceNumber}`,
                                html,
                            });
                        }
                    } catch (receiptErr) {
                        console.error('Error generating receipt:', receiptErr);
                    }
                }

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
