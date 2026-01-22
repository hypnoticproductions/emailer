// app/api/send-failed/route.ts - Resend emails to failed recipients
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single();

    if (newsletterError || !newsletter) {
      throw new Error('Newsletter not found');
    }

    // Parse newsletter metadata - handle missing metadata column gracefully
    const metadata = newsletter.metadata || newsletter.signal || {};
    const subject = metadata?.subject || newsletter.title;
    const content = metadata?.rawContent || newsletter.content || '';

    if (!content) {
      return NextResponse.json(
        { error: 'Newsletter content is missing' },
        { status: 400 }
      );
    }

    // Get all contacts (filtered by sector if provided)
    let contactsQuery = supabase.from('contacts').select('*');

    if (sectors && sectors.length > 0) {
      contactsQuery = contactsQuery.in('sector', sectors);
    }

    const { data: allContacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      throw new Error(contactsError.message);
    }

    if (!allContacts || allContacts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No contacts found',
        sent: 0,
        failed: 0,
      });
    }

    // Get emails that were already sent successfully for this newsletter
    const { data: sentEmails, error: sentEmailsError } = await supabase
      .from('emails_sent')
      .select('contact_id, status')
      .eq('newsletter_id', newsletterId);

    if (sentEmailsError) {
      console.error('Error fetching sent emails:', sentEmailsError);
    }

    // Build a map of contact_id -> status
    const emailStatusMap = new Map<string, string>();
    if (sentEmails) {
      sentEmails.forEach((email: any) => {
        emailStatusMap.set(email.contact_id, email.status);
      });
    }

    // Filter to only contacts that failed or never received the email
    const failedContacts = allContacts.filter((contact: any) => {
      const status = emailStatusMap.get(contact.id);
      // Include if: no email record, failed status, or pending status
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

    // Send emails to failed contacts
    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];

    for (const contact of failedContacts) {
      try {
        // Ensure metadata has required content field
        const emailMetadata = {
          ...metadata,
          rawContent: content,
          subject: subject,
          title: newsletter.title,
        };

        // Generate personalized email using Claude
        const { html, text } = await claudeClient.generatePersonalizedMarkdownEmail(
          contact,
          emailMetadata,
          newsletter.title
        );

        // Send via Resend
        const result = await emailClient.sendEmail({
          to: contact.email,
          subject: subject,
          html: html,
          text: text,
        });

        // Store in database
        const { error: insertError } = await supabase.from('emails_sent').upsert(
          {
            id: `email_${contact.id}_${newsletterId}`,
            contact_id: contact.id,
            newsletter_id: newsletterId,
            subject: subject,
            html_content: html,
            text_content: text,
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_id: result?.id || null,
            sector: contact.sector,
          },
          { onConflict: 'id', ignoreDuplicates: false }
        );

        if (insertError) {
          console.error('Insert error for', contact.email, ':', insertError);
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        successCount++;
        results.push({
          email: contact.email,
          success: true,
          resendId: result?.id,
          dbInserted: true,
        });

        // Rate limiting - wait 600ms between emails (Resend limit: 2/second)
        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (error) {
        failCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to send to ${contact.email}:`, errorMessage);
        console.error('Full error:', error);

        // Try to store failure in database
        try {
          await supabase.from('emails_sent').upsert(
            {
              id: `email_${contact.id}_${newsletterId}`,
              contact_id: contact.id,
              newsletter_id: newsletterId,
              subject: subject,
              html_content: '',
              text_content: '',
              status: 'failed',
              sent_at: new Date().toISOString(),
              sector: contact.sector,
            },
            { onConflict: 'id', ignoreDuplicates: false }
          );
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
