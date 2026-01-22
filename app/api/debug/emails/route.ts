// app/api/debug/emails/route.ts - Diagnostic endpoint to check database state
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get total count
    const { count: totalCount } = await supabase
      .from('emails_sent')
      .select('*', { count: 'exact', head: true });

    // Get recent 20 emails with full details
    const { data: recentEmails, error: recentError } = await supabase
      .from('emails_sent')
      .select('id, contact_id, newsletter_id, status, resend_id, sent_at, sector')
      .order('sent_at', { ascending: false })
      .limit(20);

    if (recentError) {
      throw new Error(recentError.message);
    }

    // Get counts by status
    const { data: allEmails } = await supabase
      .from('emails_sent')
      .select('status');

    const statusCounts = (allEmails || []).reduce((acc: any, email: any) => {
      acc[email.status] = (acc[email.status] || 0) + 1;
      return acc;
    }, {});

    // Get emails from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayEmails, error: todayError } = await supabase
      .from('emails_sent')
      .select('*')
      .gte('sent_at', today.toISOString());

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
