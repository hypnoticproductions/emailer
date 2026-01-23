// app/api/newsletters/list/route.ts - List newsletters
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-operations';

export async function GET(request: NextRequest) {
  try {
    const newsletters = database.getRecentNewsletters(10);

    return NextResponse.json({
      success: true,
      newsletters: newsletters || [],
    });
  } catch (error) {
    console.error('List newsletters error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to list newsletters',
      },
      { status: 500 }
    );
  }
}
