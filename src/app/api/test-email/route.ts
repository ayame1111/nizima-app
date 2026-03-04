import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get('to');

    if (!to) {
      return NextResponse.json({ error: 'Missing "to" query parameter' }, { status: 400 });
    }

    const info = await sendEmail({
      to,
      subject: 'Test Email from Avatar Atelier',
      html: '<h1>Success!</h1><p>Your email configuration is working correctly.</p>',
    });

    if (!info) {
        return NextResponse.json({ 
            error: 'Email function returned no info. Check server logs for details.',
            env: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER ? 'Set (Hidden)' : 'Not Set',
                pass: process.env.SMTP_PASS ? 'Set (Hidden)' : 'Not Set',
                secure: process.env.SMTP_SECURE,
            }
        }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    return NextResponse.json({ 
        error: error.message,
        stack: error.stack 
    }, { status: 500 });
  }
}
