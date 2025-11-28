import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL;

let resend: Resend | null = null;
if (resendApiKey) {
    resend = new Resend(resendApiKey);
}

export function emailEnabled() {
    return Boolean(resend && fromEmail);
}

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail(payload: EmailPayload) {
    if (!resend || !fromEmail) {
        console.warn('Email not sent: RESEND_API_KEY or FROM_EMAIL missing');
        return;
    }

    const res = await resend.emails.send({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
    });

    if (res.error) {
        console.error('Error sending email via Resend:', res.error);
    }
}
