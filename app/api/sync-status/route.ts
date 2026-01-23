// app/api/sync-status/route.ts - Sync email status from Resend API
import { NextRequest, NextResponse } from 'next/server';
import { getSQLiteClient } from '@/lib/sqlite-client';
import { database } from '@/lib/database-operations';
import { emailClient } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getSQLiteClient();

    const emails = db.prepare(`
      SELECT
        e.id,
        e.resend_id,
        e.status,
        e.opened_at,
        e.clicked_at,
        e.contact_id,
        c.email as contact_email
      FROM emails_sent e
      LEFT JOIN contacts c ON e.contact_id = c.id
      WHERE e.resend_id IS NOT NULL
      ORDER BY e.sent_at DESC
      LIMIT ?
    `).all(limit) as Array<{
      id: string;
      resend_id: string;
      status: string;
      opened_at: string | null;
      clicked_at: string | null;
      contact_id: string;
      contact_email: string;
    }>;

    if (!emails || emails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No emails to sync',
        synced: 0,
      });
    }

    const emailIds = emails.map((e) => e.resend_id);
    const statusResults = await emailClient.getEmailStatuses(emailIds);

    let syncedCount = 0;
    let errorCount = 0;
    const updates = [];

    for (const result of statusResults) {
      if (result.success && result.status) {
        const email = emails.find((e) => e.resend_id === result.emailId);

        if (email) {
          let dbStatus = 'sent';

          if (result.status.last_event) {
            const lastEvent = result.status.last_event.toLowerCase();

            if (lastEvent.includes('delivered')) {
              dbStatus = 'delivered';
            } else if (lastEvent.includes('bounce') || lastEvent.includes('failed')) {
              dbStatus = 'failed';
            } else if (lastEvent.includes('opened')) {
              dbStatus = 'delivered';
            } else if (lastEvent.includes('clicked')) {
              dbStatus = 'delivered';
            }
          }

          const updateData: any = {
            status: dbStatus,
          };

          if (result.status.last_event === 'opened') {
            updateData.opened_at = new Date().toISOString();
          }
          if (result.status.last_event === 'clicked') {
            updateData.clicked_at = new Date().toISOString();
          }

          database.updateEmailStatus(email.resend_id, updateData);

          syncedCount++;
          updates.push({
            email: email.contact_email || 'unknown',
            oldStatus: email.status,
            newStatus: dbStatus,
            lastEvent: result.status.last_event,
          });
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
