// app/api/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Starting database setup...');

    // Check if DATABASE_URL exists
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

    if (!databaseUrl) {
      return NextResponse.json(
        {
          error: 'DATABASE_URL not found',
          message: 'Please configure your database connection in Vercel environment variables.',
        },
        { status: 500 }
      );
    }

    console.log('📦 Pushing database schema...');

    // Run prisma db push to create/update tables
    const { stdout, stderr } = await execPromise('npx prisma db push --accept-data-loss');

    console.log('✅ Database schema pushed successfully');

    return NextResponse.json({
      success: true,
      message: '✅ Database setup complete! All tables have been created.',
      details: {
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      },
    });
  } catch (error) {
    console.error('❌ Database setup error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Database setup failed',
        message:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during database setup',
        details: error,
      },
      { status: 500 }
    );
  }
}
