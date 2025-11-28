import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                invoice: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        clientEmail: true,
                        pdfUrl: true,
                        receiptPdfUrl: true,
                        stripeReceiptUrl: true,
                        status: true,
                    },
                },
            },
        });

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}
