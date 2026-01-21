// app/api/fetch-signal/route.ts - Fetch newsletter or proposal content
import { NextRequest, NextResponse } from 'next/server';
import { githubClient } from '@/lib/github';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') as 'newsletter' | 'proposal') || 'newsletter';
    const filename = searchParams.get('filename');

    let content: any;

    if (filename) {
      // Fetch specific file
      content = await githubClient.getContentByName(filename, type);
    } else {
      // Fetch latest content
      content = await githubClient.getLatestContent(type);
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found in repository' },
        { status: 404 }
      );
    }

    // Store in database for reference
    const stored = await db.createNewsletter(
      content.subject || content.title,
      content.rawContent,
      {
        ...content,
        contentType: type,
        fileName: content.fileName,
      }
    );

    // Get commit history
    const commits = await githubClient.getRecentCommits(content.filePath, 1);

    return NextResponse.json({
      content,
      stored: true,
      newsletterId: stored.id,
      lastUpdated: commits[0]?.date,
      source: `GitHub - ${type === 'newsletter' ? 'Newsletters' : 'Proposals'} Folder`,
    });
  } catch (error) {
    console.error('Fetch content error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch content from GitHub',
      },
      { status: 500 }
    );
  }
}
