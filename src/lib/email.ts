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
        from: process.env.SMTP_FROM
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

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Avatar Atelier" <noreply@avataratelier.com>',
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
