// app/api/content/list/route.ts - List available newsletters and proposals
import { NextRequest, NextResponse } from 'next/server';
import { githubClient } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'newsletter' | 'proposal' | 'all';

    let newsletters: any[] = [];
    let proposals: any[] = [];

    if (type === 'newsletter' || type === 'all' || !type) {
      newsletters = await githubClient.listNewsletters();
    }

    if (type === 'proposal' || type === 'all' || !type) {
      proposals = await githubClient.listProposals();
    }

    return NextResponse.json({
      newsletters,
      proposals,
      total: newsletters.length + proposals.length,
    });
  } catch (error) {
    console.error('Failed to list content:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to list content',
      },
      { status: 500 }
    );
  }
}
