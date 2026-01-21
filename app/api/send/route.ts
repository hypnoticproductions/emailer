// app/api/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { claudeClient } from '@/lib/claude';
import { emailClient } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsletter, segments, signal } = body;

    if (!newsletter || !segments || !signal) {
      return NextResponse.json(
        { error: 'Missing required fields: newsletter, segments, signal' },
        { status: 400 }
      );
    }

    // Get contacts for selected segments
    const contacts = await db.contact.findMany({
      where: {
        sector: {
          in: segments,
        },
      },
    });

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found for selected segments' },
        { status: 404 }
      );
    }

    // Find or create newsletter record
    let newsletterRecord = await db.newsletter.findFirst({
      where: {
        title: newsletter.title,
      },
    });

    if (!newsletterRecord) {
      newsletterRecord = await db.newsletter.create({
        data: {
          title: newsletter.title,
          content: newsletter.content,
          signal: signal,
        },
      });
    }

    // Send personalized emails
    const emailResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const contact of contacts) {
      try {
        // Generate personalized email content
        const { html, text } = await claudeClient.generatePersonalizedEmail(
          contact,
          signal,
          newsletter.title
        );

        // Send email via Resend
        const emailData = await emailClient.sendEmail({
          to: contact.email,
          subject: newsletter.title,
          html,
          text,
        });

        // Record email sent in database
        await db.emailSent.create({
          data: {
            contactId: contact.id,
            newsletterId: newsletterRecord.id,
            subject: newsletter.title,
            htmlContent: html,
            textContent: text,
            resendId: emailData?.id,
            status: 'sent',
            sentAt: new Date(),
            sector: contact.sector,
          },
        });

        emailResults.push({
          email: contact.email,
          status: 'sent',
          resendId: emailData?.id,
        });

        successCount++;

        // Rate limiting - wait 100ms between emails
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send email to ${contact.email}:`, error);

        // Record failed email
        await db.emailSent.create({
          data: {
            contactId: contact.id,
            newsletterId: newsletterRecord.id,
            subject: newsletter.title,
            htmlContent: '',
            status: 'failed',
            sector: contact.sector,
          },
        });

        emailResults.push({
          email: contact.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        failureCount++;
      }
    }

    // Update newsletter sentAt timestamp
    await db.newsletter.update({
      where: { id: newsletterRecord.id },
      data: { sentAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} emails, ${failureCount} failed`,
      stats: {
        total: contacts.length,
        success: successCount,
        failed: failureCount,
      },
      results: emailResults,
    });
  } catch (error) {
    console.error('Send error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send emails',
      },
      { status: 500 }
    );
  }
}
