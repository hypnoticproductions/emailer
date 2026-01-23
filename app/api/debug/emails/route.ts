// app/api/debug/emails/route.ts - Diagnostic endpoint to check database state
import { NextRequest, NextResponse } from 'next/server';
import { getSQLiteClient } from '@/lib/sqlite-client';

export async function GET(request: NextRequest) {
  try {
    const db = getSQLiteClient();

    const totalResult = db.prepare('SELECT COUNT(*) as count FROM emails_sent').get() as { count: number };
    const totalCount = totalResult.count;

    const recentEmails = db.prepare(`
      SELECT id, contact_id, newsletter_id, status, resend_id, sent_at, sector
      FROM emails_sent
      ORDER BY sent_at DESC
      LIMIT 20
    `).all();

    const allStatuses = db.prepare('SELECT status FROM emails_sent').all() as Array<{ status: string }>;
    const statusCounts = allStatuses.reduce((acc: any, email: any) => {
      acc[email.status] = (acc[email.status] || 0) + 1;
      return acc;
    }, {});

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const todayEmails = db.prepare(`
      SELECT * FROM emails_sent
      WHERE sent_at >= ?
    `).all(todayISO);

    return NextResponse.json({
      success: true,
      totalInDatabase: totalCount,
      statusBreakdown: statusCounts,
      recentEmails: recentEmails || [],
      todayCount: todayEmails?.length || 0,
      todayEmails: todayEmails || [],
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch debug data',
      },
      { status: 500 }
    );
  }
}
