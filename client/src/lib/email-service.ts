/**
 * Email Service Integration
 * 
 * This module handles sending emails through various providers.
 * 
 * To configure, add these environment variables:
 * 
 * Option 1: SendGrid
 * - VITE_EMAIL_SERVICE=sendgrid
 * - VITE_SENDGRID_API_KEY=your_sendgrid_api_key
 * - VITE_EMAIL_FROM=your_email@yourdomain.com
 * 
 * Option 2: AWS SES (via API Gateway or Lambda)
 * - VITE_EMAIL_SERVICE=ses
 * - VITE_SES_API_URL=your_api_gateway_url
 * - VITE_EMAIL_FROM=your_email@yourdomain.com
 * 
 * Option 3: SMTP (via backend endpoint)
 * - VITE_EMAIL_SERVICE=smtp
 * - VITE_EMAIL_API_URL=your_backend_api_url
 * - VITE_EMAIL_FROM=your_email@yourdomain.com
 * 
 * Option 4: Resend (recommended for easy setup)
 * - VITE_EMAIL_SERVICE=resend
 * - VITE_RESEND_API_KEY=your_resend_api_key
 * - VITE_EMAIL_FROM=your_email@yourdomain.com
 */

interface EmailData {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Get email config from stored settings or environment variables
let storedEmailConfig: { service: string; apiKey?: string; apiUrl?: string; fromEmail: string } | null = null;

export function setEmailConfig(config: { service: string; apiKey?: string; apiUrl?: string; fromEmail: string } | null) {
  storedEmailConfig = config;
}

function getEmailService(): string {
  return storedEmailConfig?.service || import.meta.env.VITE_EMAIL_SERVICE || 'none';
}

function getEmailFrom(): string {
  return storedEmailConfig?.fromEmail || import.meta.env.VITE_EMAIL_FROM || 'noreply@grouptherapyeg.com';
}

function getApiKey(): string | undefined {
  return storedEmailConfig?.apiKey || import.meta.env.VITE_RESEND_API_KEY || import.meta.env.VITE_SENDGRID_API_KEY;
}

function getApiUrl(): string | undefined {
  return storedEmailConfig?.apiUrl || import.meta.env.VITE_SES_API_URL || import.meta.env.VITE_EMAIL_API_URL;
}

/**
 * Send email using configured service
 */
export async function sendEmail(data: EmailData): Promise<EmailResult> {
  const emailService = getEmailService();
  if (emailService === 'none' || !emailService) {
    console.warn('Email service not configured.');
    return {
      success: false,
      error: 'Email service not configured. Please configure it in the admin panel.',
    };
  }

  try {
    switch (emailService) {
      case 'sendgrid':
        return await sendViaSendGrid(data);
      case 'resend':
        return await sendViaResend(data);
      case 'ses':
        return await sendViaSES(data);
      case 'smtp':
        return await sendViaSMTP(data);
      default:
        return {
          success: false,
          error: `Unknown email service: ${emailService}`,
        };
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send via SendGrid API
 */
async function sendViaSendGrid(data: EmailData): Promise<EmailResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'SendGrid API key not configured. Please set VITE_SENDGRID_API_KEY.',
    };
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: data.to.map(email => ({ to: [{ email }] })),
      from: { email: data.from || getEmailFrom() },
      subject: data.subject,
      content: [{ type: 'text/html', value: data.html }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `SendGrid error: ${errorText}`,
    };
  }

  return { success: true, message: 'Email sent successfully via SendGrid' };
}

/**
 * Send via Resend API (recommended - easy setup)
 */
async function sendViaResend(data: EmailData): Promise<EmailResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'Resend API key not configured. Please set VITE_RESEND_API_KEY.',
    };
  }

  // Resend allows sending to multiple recipients
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: data.from || getEmailFrom(),
      to: data.to,
      subject: data.subject,
      html: data.html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    return {
      success: false,
      error: `Resend error: ${errorData.message || 'Failed to send email'}`,
    };
  }

  return { success: true, message: 'Email sent successfully via Resend' };
}

/**
 * Send via AWS SES (via API Gateway)
 */
async function sendViaSES(data: EmailData): Promise<EmailResult> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return {
      success: false,
      error: 'SES API URL not configured. Please set VITE_SES_API_URL.',
    };
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: data.to,
      subject: data.subject,
      html: data.html,
      from: data.from || getEmailFrom(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `SES error: ${errorText}`,
    };
  }

  return { success: true, message: 'Email sent successfully via SES' };
}

/**
 * Send via SMTP (via backend endpoint)
 */
async function sendViaSMTP(data: EmailData): Promise<EmailResult> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return {
      success: false,
      error: 'Email API URL not configured. Please set VITE_EMAIL_API_URL.',
    };
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: data.to,
      subject: data.subject,
      html: data.html,
      from: data.from || getEmailFrom(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `SMTP error: ${errorText}`,
    };
  }

  return { success: true, message: 'Email sent successfully via SMTP' };
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  const emailService = getEmailService();
  if (!emailService || emailService === 'none') return false;
  
  const hasFromEmail = !!getEmailFrom();
  
  switch (emailService) {
    case 'sendgrid':
      return !!getApiKey() && hasFromEmail;
    case 'resend':
      return !!getApiKey() && hasFromEmail;
    case 'ses':
      return !!getApiUrl() && hasFromEmail;
    case 'smtp':
      return !!getApiUrl() && hasFromEmail;
    default:
      return false;
  }
}

/**
 * Get configuration instructions for the user
 */
export function getEmailConfigInstructions(): string {
  const emailService = getEmailService();
  if (isEmailServiceConfigured()) {
    return `Email service is configured: ${emailService}`;
  }

  return `
Email service is not configured. Please choose one of the following options:

1. Resend (Recommended - Easiest):
   - Sign up at https://resend.com
   - Get your API key
   - Set VITE_EMAIL_SERVICE=resend
   - Set VITE_RESEND_API_KEY=your_api_key
   - Set VITE_EMAIL_FROM=your_verified_email@yourdomain.com

2. SendGrid:
   - Sign up at https://sendgrid.com
   - Get your API key
   - Set VITE_EMAIL_SERVICE=sendgrid
   - Set VITE_SENDGRID_API_KEY=your_api_key
   - Set VITE_EMAIL_FROM=your_verified_email@yourdomain.com

3. AWS SES:
   - Set up API Gateway endpoint
   - Set VITE_EMAIL_SERVICE=ses
   - Set VITE_SES_API_URL=your_api_gateway_url
   - Set VITE_EMAIL_FROM=your_verified_email@yourdomain.com

4. SMTP (via backend):
   - Set up backend endpoint
   - Set VITE_EMAIL_SERVICE=smtp
   - Set VITE_EMAIL_API_URL=your_backend_url
   - Set VITE_EMAIL_FROM=your_email@yourdomain.com
  `.trim();
}

