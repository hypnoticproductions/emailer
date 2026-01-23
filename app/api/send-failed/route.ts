// app/api/send-failed/route.ts - Resend emails to failed recipients
import { NextRequest, NextResponse } from 'next/server';
import { getSQLiteClient } from '@/lib/sqlite-client';
import { database } from '@/lib/database-operations';
import { claudeClient } from '@/lib/claude';
import { emailClient } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsletterId, sectors } = body;

    if (!newsletterId) {
      return NextResponse.json(
        { error: 'Newsletter ID is required' },
        { status: 400 }
      );
    }

    const db = getSQLiteClient();

    const newsletter = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(newsletterId) as any;

    if (!newsletter) {
      throw new Error('Newsletter not found');
    }

    if (newsletter.signal && typeof newsletter.signal === 'string') {
      try {
        newsletter.signal = JSON.parse(newsletter.signal);
      } catch {}
    }
    if (newsletter.metadata && typeof newsletter.metadata === 'string') {
      try {
        newsletter.metadata = JSON.parse(newsletter.metadata);
      } catch {}
    }

    const metadata = newsletter.metadata || newsletter.signal || {};
    const subject = metadata?.subject || newsletter.title;
    const content = metadata?.rawContent || newsletter.content || '';

    if (!content) {
      return NextResponse.json(
        { error: 'Newsletter content is missing' },
        { status: 400 }
      );
    }

    const allContacts = database.getContacts(sectors);

    if (!allContacts || allContacts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No contacts found',
        sent: 0,
        failed: 0,
      });
    }

    const sentEmails = db.prepare(
      'SELECT contact_id, status FROM emails_sent WHERE newsletter_id = ?'
    ).all(newsletterId) as Array<{ contact_id: string; status: string }>;

    const emailStatusMap = new Map<string, string>();
    sentEmails.forEach((email) => {
      emailStatusMap.set(email.contact_id, email.status);
    });

    const failedContacts = allContacts.filter((contact: any) => {
      const status = emailStatusMap.get(contact.id);
      return !status || status === 'failed' || status === 'pending';
    });

    if (failedContacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No failed recipients to resend to',
        sent: 0,
        failed: 0,
        totalContacts: allContacts.length,
      });
    }

    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];

    for (const contact of failedContacts) {
      try {
        const emailMetadata = {
          ...metadata,
          rawContent: content,
          subject: subject,
          title: newsletter.title,
        };

        const { html, text } = await claudeClient.generatePersonalizedMarkdownEmail(
          contact,
          emailMetadata,
          newsletter.title
        );

        const result = await emailClient.sendEmail({
          to: contact.email,
          subject: subject,
          html: html,
          text: text,
        });

        database.createEmailSent({
          contactId: contact.id,
          newsletterId: newsletterId,
          subject: subject,
          htmlContent: html,
          textContent: text,
          resendId: result?.id || null,
          status: 'sent',
          sector: contact.sector,
        });

        successCount++;
        results.push({
          email: contact.email,
          success: true,
          resendId: result?.id,
          dbInserted: true,
        });

        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (error) {
        failCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to send to ${contact.email}:`, errorMessage);

        try {
          database.createEmailSent({
            contactId: contact.id,
            newsletterId: newsletterId,
            subject: subject,
            htmlContent: '',
            textContent: '',
            resendId: null,
            status: 'failed',
            sector: contact.sector,
          });
        } catch (dbError) {
          console.error('Failed to store error in database:', dbError);
        }

        results.push({
          email: contact.email,
          success: false,
          error: errorMessage,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Resume send completed: ${successCount} sent, ${failCount} failed`,
      sent: successCount,
      failed: failCount,
      totalContacts: allContacts.length,
      failedRecipients: failedContacts.length,
      results,
    });
  } catch (error) {
    console.error('Resume send error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to resume send',
      },
      { status: 500 }
    );
  }
}
