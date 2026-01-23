import { NextRequest, NextResponse } from 'next/server';
import { db, checkDatabaseHealth } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('[dashboard] Starting dashboard data fetch...');

    const health = await checkDatabaseHealth();
    if (!health.healthy) {
      console.error('[dashboard] Database health check failed:', health);
      return NextResponse.json(
        {
          error: 'Database connection is not healthy',
          details: health.error || health.message,
          suggestion: 'Check your database configuration.',
        },
        { status: 503 }
      );
    }

    console.log('[dashboard] Database health check passed');

    let totalContacts = 0;
    let contactsBySector: Array<{ sector: string; count: number }> = [];
    let emailStats: {
      total: number;
      byStatus: Array<{ status: string; count: number }>;
      bySector: Array<{ sector: string; count: number }>;
      opened: number;
      clicked: number;
    } = {
      total: 0,
      byStatus: [],
      bySector: [],
      opened: 0,
      clicked: 0,
    };
    let recentNewsletters: any[] = [];

    try {
      totalContacts = db.countContacts();
    } catch (err) {
      console.error('[dashboard] Count contacts failed:', err);
    }

    try {
      contactsBySector = db.getContactsBySector();
    } catch (err) {
      console.error('[dashboard] Get contacts by sector failed:', err);
    }

    try {
      emailStats = db.getEmailStats();
    } catch (err) {
      console.error('[dashboard] Get email stats failed:', err);
    }

    try {
      recentNewsletters = db.getRecentNewsletters(5);
    } catch (err) {
      console.error('[dashboard] Get recent newsletters failed:', err);
    }

    const openRate =
      emailStats.total > 0
        ? ((emailStats.opened / emailStats.total) * 100).toFixed(1)
        : '0.0';

    const clickRate =
      emailStats.total > 0
        ? ((emailStats.clicked / emailStats.total) * 100).toFixed(1)
        : '0.0';

    const response = {
      contacts: {
        total: totalContacts,
        bySector: contactsBySector.map(row => ({
          sector: row.sector,
          _count: { sector: row.count },
        })),
      },
      emails: {
        total: emailStats.total,
        byStatus: emailStats.byStatus.map(row => ({
          status: row.status,
          _count: { status: row.count },
        })),
        bySector: emailStats.bySector.map(row => ({
          sector: row.sector,
          _count: { sector: row.count },
        })),
      },
      engagement: {
        totalSent: emailStats.total,
        totalOpened: emailStats.opened,
        totalClicked: emailStats.clicked,
        totalReplied: 0,
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate),
      },
      recentNewsletters: recentNewsletters.map(row => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        sentAt: row.sent_at,
        _count: {
          emailsSent: 0,
        },
      })),
    };

    console.log('[dashboard] Successfully prepared response');
    return NextResponse.json(response);
  } catch (error) {
    console.error('[dashboard] Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        message: errorMessage,
        suggestion: 'Check server logs for more details',
      },
      { status: 500 }
    );
  }
}
