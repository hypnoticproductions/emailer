// app/api/signal-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { githubClient } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const signalPath = 'wukr_wire_signals_jan21.md';

    const lastUpdate = await githubClient.getSignalLastUpdate(signalPath);

    const commits = await githubClient.getRecentCommits(signalPath, 5);

    return NextResponse.json({
      lastUpdate,
      commits,
      status: 'Signal is live and updating',
      repository: `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`,
      signalPath,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        status: 'Error checking signal status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
