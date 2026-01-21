// app/api/fetch-signal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { githubClient } from '@/lib/github';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Fetch latest Morphic Trade Signal from GitHub
    const signal = await githubClient.getLatestSignal();

    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found in repository' },
        { status: 404 }
      );
    }

    // Store in database for reference (optional)
    const stored = await db.createNewsletter(
      `${signal.title} - ${new Date().toLocaleDateString()}`,
      signal.rawContent,
      signal
    );

    // Get commit history
    const commits = await githubClient.getRecentCommits(
      'wukr_wire_signals_jan21.md',
      1
    );

    return NextResponse.json({
      signal,
      stored: true,
      newsletterId: stored.id,
      lastUpdated: commits[0]?.date,
      source: 'GitHub - Quintapoo Memory Repository',
    });
  } catch (error) {
    console.error('Fetch signal error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch signal from GitHub',
      },
      { status: 500 }
    );
  }
}
