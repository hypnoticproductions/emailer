// lib/resend.ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export const emailClient = {
  /**
   * Send a single email via Resend
   */
  async sendEmail(options: EmailOptions) {
    try {
      const { data, error } = await resend.emails.send({
        from: options.from || 'WUKR Wire <signal@dopa.buzz>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error('Resend error:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  },

  /**
   * Send batch emails (with rate limiting)
   */
  async sendBatchEmails(emails: EmailOptions[], delayMs: number = 100) {
    const results = [];

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        results.push({ success: true, email: email.to, result });

        // Rate limiting delay
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        results.push({
          success: false,
          email: email.to,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  },

  /**
   * Get email status from Resend by email ID
   */
  async getEmailStatus(emailId: string) {
    try {
      const { data, error } = await resend.emails.get(emailId);

      if (error) {
        console.error('Resend get email error:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Failed to get email status:', error);
      throw error;
    }
  },

  /**
   * Get multiple email statuses (with rate limiting to avoid API limits)
   */
  async getEmailStatuses(emailIds: string[]) {
    const results = [];

    for (const emailId of emailIds) {
      try {
        const status = await this.getEmailStatus(emailId);
        results.push({ success: true, emailId, status });

        // Rate limiting - 2 req/sec limit
        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (error) {
        results.push({
          success: false,
          emailId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  },
};
