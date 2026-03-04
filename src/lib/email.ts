import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Log configuration on startup (sanitized)
if (process.env.SMTP_HOST) {
    console.log('Email configuration loaded:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER ? '***' : 'missing',
        from: process.env.SMTP_FROM || process.env.SMTP_USER
    });
} else {
    console.warn('SMTP_HOST environment variable is missing. Emails will not be sent.');
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST not set. Email not sent:', { to, subject });
    return;
  }

  // Determine the 'from' address.
  // Priority: 1. SMTP_FROM env var, 2. SMTP_USER env var, 3. Default fallback
  // Namecheap and others often require the sender to match the authenticated user.
  let from = process.env.SMTP_FROM;
  if (!from) {
      if (process.env.SMTP_USER) {
          // If no specific FROM is set, use the authenticated user (safest)
          from = process.env.SMTP_USER;
      } else {
          from = '"Avatar Atelier" <noreply@avataratelier.com>';
      }
  }

  console.log(`Sending email to: ${to} from: ${from}`);

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Re-throw to allow caller to handle/log
    throw error;
  }
}
