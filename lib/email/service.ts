
import { Resend } from 'resend';

// Initialize lazily or check first
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : { emails: { send: async () => { console.warn('Mock send: No Key'); return {}; } } } as unknown as Resend;

export async function sendEmail(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is missing, skipping email send');
        return;
    }

    try {
        const data = await resend.emails.send({
            from: 'Starter Story Insights <insights@yourdomain.com>', // User needs to configure domain
            to: [to],
            subject: subject,
            html: html,
        });

        return data;
    } catch (error) {
        console.error('Failed to send email to', to, error);
        throw error;
    }
}
