// app/api/dashboard/route.ts - Using raw PostgreSQL
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get contacts stats
    const totalContacts = await db.countContacts();
    const contactsBySector = await db.getContactsBySector();

    // Get email stats
    const emailStats = await db.getEmailStats();

    // Get recent newsletters
    const recentNewsletters = await db.getRecentNewsletters(5);

    // Calculate engagement rates
    const openRate =
      emailStats.total > 0
        ? ((emailStats.opened / emailStats.total) * 100).toFixed(1)
        : '0.0';

    const clickRate =
      emailStats.total > 0
        ? ((emailStats.clicked / emailStats.total) * 100).toFixed(1)
        : '0.0';

    return NextResponse.json({
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
          emailsSent: 0, // TODO: Add count
        },
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
}
