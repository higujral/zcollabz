import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPdfUrl } from '@/lib/s3';
import { sendEmail, emailEnabled } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { invoiceId } = body;

        if (!invoiceId) {
            return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.status !== 'PAID') {
            return NextResponse.json({ error: 'Invoice is not paid yet' }, { status: 400 });
        }

        if (!invoice.clientEmail) {
            return NextResponse.json({ error: 'Client email missing' }, { status: 400 });
        }

        if (!emailEnabled()) {
            return NextResponse.json({ error: 'Email provider not configured' }, { status: 500 });
        }

        let receiptUrl = invoice.receiptPdfUrl;
        if (!receiptUrl && invoice.receiptPdfKey) {
            receiptUrl = await getPdfUrl(invoice.receiptPdfKey);
        }

        if (!receiptUrl) {
            return NextResponse.json({ error: 'Receipt not available' }, { status: 400 });
        }

        const html = `
            <p>Hello ${invoice.clientName},</p>
            <p>Thank you for your payment. Your receipt is available here: <a href="${receiptUrl}">Download Receipt</a></p>
            <p>Invoice: ${invoice.invoiceNumber}</p>
            <p>Amount Paid: $${invoice.amount.toFixed(2)}</p>
            <p>Thank you,<br/>ZCollabz</p>
        `;

        await sendEmail({
            to: invoice.clientEmail,
            subject: `Receipt for Invoice ${invoice.invoiceNumber}`,
            html,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending receipt email:', error);
        return NextResponse.json({ error: 'Failed to send receipt email' }, { status: 500 });
    }
}
