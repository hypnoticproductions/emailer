// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get total contacts by sector
    const contactsBySector = await db.contact.groupBy({
      by: ['sector'],
      _count: {
        sector: true,
      },
    });

    // Get total emails sent
    const totalEmailsSent = await db.emailSent.count();

    // Get email stats by status
    const emailsByStatus = await db.emailSent.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Get recent newsletters
    const recentNewsletters = await db.newsletter.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        _count: {
          select: {
            emailsSent: true,
          },
        },
      },
    });

    // Get engagement stats
    const engagementStats = {
      totalSent: await db.emailSent.count({
        where: { status: { in: ['sent', 'delivered'] } },
      }),
      totalOpened: await db.emailSent.count({
        where: { openedAt: { not: null } },
      }),
      totalClicked: await db.emailSent.count({
        where: { clickedAt: { not: null } },
      }),
      totalReplied: await db.emailSent.count({
        where: { repliedAt: { not: null } },
      }),
    };

    // Calculate rates
    const openRate =
      engagementStats.totalSent > 0
        ? ((engagementStats.totalOpened / engagementStats.totalSent) * 100).toFixed(1)
        : '0.0';

    const clickRate =
      engagementStats.totalSent > 0
        ? ((engagementStats.totalClicked / engagementStats.totalSent) * 100).toFixed(1)
        : '0.0';

    // Get emails by sector
    const emailsBySector = await db.emailSent.groupBy({
      by: ['sector'],
      _count: {
        sector: true,
      },
    });

    return NextResponse.json({
      contacts: {
        total: await db.contact.count(),
        bySector: contactsBySector,
      },
      emails: {
        total: totalEmailsSent,
        byStatus: emailsByStatus,
        bySector: emailsBySector,
      },
      engagement: {
        ...engagementStats,
        openRate: parseFloat(openRate),
        clickRate: parseFloat(clickRate),
      },
      recentNewsletters,
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
