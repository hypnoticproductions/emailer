// app/api/sync-status/route.ts - Sync email status from Resend API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailClient } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50'); // Limit to avoid rate limits

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch emails that have a resend_id (successfully sent to Resend)
    const { data: emails, error: fetchError } = await supabase
      .from('emails_sent')
      .select('id, resend_id, status, to_email')
      .not('resend_id', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!emails || emails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No emails to sync',
        synced: 0,
      });
    }

    // Get status for each email from Resend
    const emailIds = emails.map((e: any) => e.resend_id);
    const statusResults = await emailClient.getEmailStatuses(emailIds);

    // Update database with real status
    let syncedCount = 0;
    let errorCount = 0;
    const updates = [];

    for (const result of statusResults) {
      if (result.success && result.status) {
        const email = emails.find((e: any) => e.resend_id === result.emailId);

        if (email) {
          // Map Resend status to our database status
          let dbStatus = 'sent';

          if (result.status.last_event) {
            const lastEvent = result.status.last_event.toLowerCase();

            if (lastEvent.includes('delivered')) {
              dbStatus = 'delivered';
            } else if (lastEvent.includes('bounce') || lastEvent.includes('failed')) {
              dbStatus = 'failed';
            } else if (lastEvent.includes('opened')) {
              dbStatus = 'delivered'; // If opened, it was delivered
            } else if (lastEvent.includes('clicked')) {
              dbStatus = 'delivered';
            }
          }

          // Update the database
          const { error: updateError } = await supabase
            .from('emails_sent')
            .update({
              status: dbStatus,
              opened_at: result.status.last_event === 'email.opened' ? new Date().toISOString() : email.opened_at,
              clicked_at: result.status.last_event === 'email.clicked' ? new Date().toISOString() : email.clicked_at,
            })
            .eq('id', email.id);

          if (!updateError) {
            syncedCount++;
            updates.push({
              email: email.to_email,
              oldStatus: email.status,
              newStatus: dbStatus,
              lastEvent: result.status.last_event,
            });
          } else {
            console.error('Update error for email', email.id, updateError);
            errorCount++;
          }
        }
      } else {
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} email statuses from Resend`,
      synced: syncedCount,
      errors: errorCount,
      total: emails.length,
      updates,
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync status',
      },
      { status: 500 }
    );
  }
}
