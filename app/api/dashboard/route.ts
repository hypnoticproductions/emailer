// app/api/dashboard/route.ts - Using raw PostgreSQL
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('[dashboard] Fetching dashboard data...');

    // Get contacts stats
    console.log('[dashboard] Fetching contact count...');
    const totalContacts = await db.countContacts();
    console.log('[dashboard] Total contacts:', totalContacts);

    console.log('[dashboard] Fetching contacts by sector...');
    const contactsBySector = await db.getContactsBySector();
    console.log('[dashboard] Contacts by sector:', contactsBySector);

    // Get email stats
    console.log('[dashboard] Fetching email stats...');
    const emailStats = await db.getEmailStats();
    console.log('[dashboard] Email stats:', emailStats);

    // Get recent newsletters
    console.log('[dashboard] Fetching recent newsletters...');
    const recentNewsletters = await db.getRecentNewsletters(5);
    console.log('[dashboard] Recent newsletters:', recentNewsletters);

    // Calculate engagement rates
    const openRate =
      emailStats.total > 0
        ? ((emailStats.opened / emailStats.total) * 100).toFixed(1)
        : '0.0';

    const clickRate =
      emailStats.total > 0
        ? ((emailStats.clicked / emailStats.total) * 100).toFixed(1)
        : '0.0';

    console.log('[dashboard] Preparing response...');
    const response = {
      contacts: {
        total: totalContacts,
        bySector: contactsBySector.map((row: any) => ({
          sector: row.sector,
          _count: { sector: row.count },
        })),
      },
      emails: {
        total: emailStats.total,
        byStatus: emailStats.byStatus.map((row: any) => ({
          status: row.status,
          _count: { status: row.count },
        })),
        bySector: emailStats.bySector.map((row: any) => ({
          sector: row.sector,
          _count: { sector: row.count },
        })),
      },
      engagement: {
        totalSent: emailStats.total,
        totalOpened: emailStats.opened,
        totalClicked: emailStats.clicked,
        totalReplied: 0, // TODO: Add reply tracking
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate),
      },
      recentNewsletters: recentNewsletters.map((row: any) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        sentAt: row.sent_at,
        _count: {
          emailsSent: 0,
        },
      })),
    };

    console.log('[dashboard] Response ready:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error('[dashboard] ❌ Dashboard error:', error);
    console.error('[dashboard] Error type:', error?.constructor?.name);
    console.error('[dashboard] Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('[dashboard] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
}
