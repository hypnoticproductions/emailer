// app/api/setup/route.ts - Initialize database without Prisma!
import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Starting database setup...');

    // Check if DATABASE_URL exists
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json(
        {
          error: 'DATABASE_URL not found',
          message: 'Please configure your Supabase database connection in Vercel environment variables.',
        },
        { status: 500 }
      );
    }

    console.log('📦 Creating database tables...');

    // Initialize database (creates all tables)
    await initializeDatabase();

    console.log('✅ Database setup complete!');

    return NextResponse.json({
      success: true,
      message: '✅ Database setup complete! All tables have been created.',
      details: {
        tables: ['contacts', 'newsletters', 'emails_sent'],
        database: 'Supabase PostgreSQL (Direct connection - no Prisma)',
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
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}
