import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
const apiKey = process.env.SENDGRID_API_KEY || '';

if (apiKey) {
  mailService.setApiKey(apiKey);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!apiKey) {
    console.warn('SENDGRID_API_KEY not configured - email not sent');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateDowntimeEmail(websiteName: string, websiteUrl: string, error?: string): { subject: string; html: string; text: string } {
  const subject = `🔴 ${websiteName} is Down`;
  const text = `Your website ${websiteName} (${websiteUrl}) is currently down.\n\n${error ? `Error: ${error}` : 'Please check your website immediately.'}\n\nTime: ${new Date().toLocaleString()}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h2 style="color: #dc2626; margin: 0;">🔴 Website Down Alert</h2>
      </div>
      <p>Your website <strong>${websiteName}</strong> is currently down.</p>
      <p><strong>URL:</strong> ${websiteUrl}</p>
      ${error ? `<p><strong>Error:</strong> ${error}</p>` : ''}
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p>Please check your website immediately.</p>
    </div>
  `;
  
  return { subject, html, text };
}

export function generateUptimeRestoredEmail(websiteName: string, websiteUrl: string): { subject: string; html: string; text: string } {
  const subject = `✅ ${websiteName} is Back Online`;
  const text = `Good news! Your website ${websiteName} (${websiteUrl}) is back online.\n\nTime: ${new Date().toLocaleString()}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h2 style="color: #16a34a; margin: 0;">✅ Website Restored</h2>
      </div>
      <p>Good news! Your website <strong>${websiteName}</strong> is back online.</p>
      <p><strong>URL:</strong> ${websiteUrl}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
  `;
  
  return { subject, html, text };
}
