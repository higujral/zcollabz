import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

interface InvoicePdfPayload {
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    serviceName: string;
    amount: number;
    paymentLinkUrl: string;
    notes?: string | null;
    companyName?: string;
}

interface ReceiptPdfPayload {
    invoiceNumber?: string | null;
    clientName: string;
    clientEmail: string;
    serviceName: string;
    amount: number;
    paidAt: Date;
    paymentMethod?: string | null;
    stripeReceiptUrl?: string | null;
    companyName?: string;
}

async function generateQrImageBytes(data: string) {
    const dataUrl = await QRCode.toDataURL(data);
    const base64 = dataUrl.split(',')[1];
    return Uint8Array.from(Buffer.from(base64, 'base64'));
}

export async function generateInvoicePdf(payload: InvoicePdfPayload) {
    const {
        invoiceNumber,
        clientName,
        clientEmail,
        serviceName,
        amount,
        paymentLinkUrl,
        notes,
        companyName = 'ZCollabz',
    } = payload;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    let y = 742;
    const lineHeight = 18;

    const drawText = (text: string, size = 12, color = rgb(0, 0, 0)) => {
        page.drawText(text, { x: margin, y, size, font, color });
        y -= lineHeight;
    };

    // Header
    page.drawText(companyName, { x: 400, y: 742, size: 16, font });
    drawText('Invoice', 22);
    drawText(`Invoice #: ${invoiceNumber}`);
    drawText(`Date: ${new Date().toLocaleDateString()}`);
    y -= 8;
    drawText('Bill To:');
    drawText(clientName);
    drawText(clientEmail);
    y -= 8;
    drawText(`Service: ${serviceName}`, 14);
    drawText(`Amount Due: $${amount.toFixed(2)}`, 12);
    if (notes) {
        y -= 8;
        drawText(`Notes: ${notes}`, 12);
    }

    y -= 12;
    const linkText = `Payment Link: ${paymentLinkUrl}`;
    page.drawText(linkText, { x: margin, y, size: 10, font, color: rgb(0.1, 0.2, 0.8) });
    y -= 20;

    // QR code
    try {
        const qrBytes = await generateQrImageBytes(paymentLinkUrl);
        const qrImage = await pdfDoc.embedPng(qrBytes);
        const qrSize = 120;
        page.drawImage(qrImage, { x: margin, y: y - qrSize + 20, width: qrSize, height: qrSize });
        drawText('Scan to pay', 10);
    } catch (err) {
        drawText('QR code unavailable', 10, rgb(0.6, 0, 0));
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

export async function generateReceiptPdf(payload: ReceiptPdfPayload) {
    const {
        invoiceNumber,
        clientName,
        clientEmail,
        serviceName,
        amount,
        paidAt,
        paymentMethod,
        stripeReceiptUrl,
        companyName = 'ZCollabz',
    } = payload;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    let y = 742;
    const lineHeight = 18;

    const drawText = (text: string, size = 12, color = rgb(0, 0, 0)) => {
        page.drawText(text, { x: margin, y, size, font, color });
        y -= lineHeight;
    };

    page.drawText(companyName, { x: 400, y: 742, size: 16, font });
    drawText('Payment Receipt', 22);
    if (invoiceNumber) drawText(`Invoice #: ${invoiceNumber}`);
    drawText(`Date Paid: ${paidAt.toLocaleString()}`);
    y -= 8;
    drawText('Paid By:');
    drawText(clientName);
    drawText(clientEmail);
    y -= 8;
    drawText(`Service: ${serviceName}`, 14);
    drawText(`Amount Paid: $${amount.toFixed(2)}`, 12);
    if (paymentMethod) drawText(`Payment Method: ${paymentMethod}`, 12);
    if (stripeReceiptUrl) {
        y -= 4;
        page.drawText(`Stripe Receipt: ${stripeReceiptUrl}`, {
            x: margin,
            y,
            size: 10,
            font,
            color: rgb(0.1, 0.2, 0.8),
        });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
