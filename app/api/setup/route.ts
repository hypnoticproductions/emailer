// app/api/setup/route.ts - Database health and initialization check
import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Checking database health...');

    // Check if Supabase credentials exist
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error: 'Supabase credentials not configured',
          message: 'Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables.',
        },
        { status: 500 }
      );
    }

    console.log('📦 Checking database tables...');

    // Check database health
    const health = await checkDatabaseHealth();

    if (!health.healthy) {
      return NextResponse.json(
        {
          error: 'Database tables are missing',
          message: 'Please run the Supabase migrations to create the required tables',
          health,
        },
        { status: 500 }
      );
    }

    console.log('✅ Database is ready!');

    return NextResponse.json({
      success: true,
      message: '✅ Database is ready! All tables exist.',
      health,
    });
  } catch (error) {
    console.error('❌ Database check error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Database check failed',
        message:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during database check',
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}
