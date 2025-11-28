import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPdfUrl } from '@/lib/s3';
import { sendEmail, emailEnabled } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { invoiceId, message } = body;

        if (!invoiceId) {
            return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (!emailEnabled()) {
            return NextResponse.json({ error: 'Email provider not configured' }, { status: 500 });
        }

        let pdfUrl = invoice.pdfUrl;
        if (!pdfUrl && invoice.pdfKey) {
            pdfUrl = await getPdfUrl(invoice.pdfKey);
        }

        const html = `
            <p>Hello ${invoice.clientName},</p>
            <p>${message || 'Please find your invoice below.'}</p>
            <p><a href="${pdfUrl}">View Invoice PDF</a></p>
            <p>Payment link: <a href="${invoice.paymentLinkUrl}">${invoice.paymentLinkUrl}</a></p>
            <p>Thank you,<br/>ZCollabz</p>
        `;

        await sendEmail({
            to: invoice.clientEmail,
            subject: `Invoice ${invoice.invoiceNumber} from ZCollabz`,
            html,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending invoice email:', error);
        return NextResponse.json({ error: 'Failed to send invoice email' }, { status: 500 });
    }
}
