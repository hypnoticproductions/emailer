// app/api/signal-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { githubClient } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') as 'newsletter' | 'proposal') || 'newsletter';
    const filename = searchParams.get('filename') || 'wukr_wire_jan21_2026.md';

    const folder = type === 'newsletter' ? 'newsletters' : 'proposals';
    const contentPath = `${folder}/${filename}`;

    const lastUpdate = await githubClient.getContentLastUpdate(contentPath);

    const commits = await githubClient.getRecentCommits(contentPath, 5);

    return NextResponse.json({
      lastUpdate,
      commits,
      status: 'Content is live and updating',
      repository: `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`,
      contentPath,
      type,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        status: 'Error checking content status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
