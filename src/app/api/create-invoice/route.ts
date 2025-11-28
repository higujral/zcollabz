import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { generateInvoicePdf } from '@/lib/pdf';
import { uploadPdf, getPdfUrl } from '@/lib/s3';

function generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const sequence = Math.floor(Math.random() * 9000) + 1000; // simple random sequence
    return `ZC-${year}-${sequence}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { clientName, clientEmail, serviceName, amount, notes } = body;

        if (!clientName || !clientEmail || !serviceName || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const invoiceId = randomUUID();
        const invoiceNumber = generateInvoiceNumber();

        const price = await stripe.prices.create({
            currency: 'usd',
            unit_amount: Math.round(amount * 100),
            product_data: {
                name: serviceName,
            },
        });

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
                invoiceId,
                invoiceNumber,
                clientName,
                clientEmail,
            },
        });

        const invoice = await prisma.invoice.create({
            data: {
                id: invoiceId,
                invoiceNumber,
                clientName,
                clientEmail,
                serviceName,
                amount,
                notes,
                paymentLinkUrl: paymentLink.url,
                status: 'PENDING',
            },
        });

        await prisma.transaction.create({
            data: {
                clientName,
                serviceName,
                amount,
                paymentLinkUrl: paymentLink.url,
                status: 'PENDING',
                invoiceId: invoice.id,
            },
        });

        // Generate and upload invoice PDF
        const pdfBuffer = await generateInvoicePdf({
            invoiceNumber: invoice.invoiceNumber,
            clientName,
            clientEmail,
            serviceName,
            amount,
            paymentLinkUrl: paymentLink.url,
            notes,
        });

        const key = `invoices/${invoice.id}.pdf`;
        await uploadPdf(key, pdfBuffer);
        const pdfUrl = await getPdfUrl(key);

        const updatedInvoice = await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                pdfUrl,
                pdfKey: key,
            },
        });

        return NextResponse.json({
            success: true,
            paymentLink: paymentLink.url,
            invoice: {
                id: updatedInvoice.id,
                invoiceNumber: updatedInvoice.invoiceNumber,
                pdfUrl: updatedInvoice.pdfUrl,
                status: updatedInvoice.status,
            },
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}
