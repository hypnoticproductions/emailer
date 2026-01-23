import { NextRequest, NextResponse } from 'next/server';
import { db, checkDatabaseHealth } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Testing Database Connection ===');

    console.log('Environment variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? `SET (${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...)` : 'MISSING');

    console.log('\n=== Running health check ===');
    const health = await checkDatabaseHealth();
    console.log('Health check result:', health);

    console.log('\n=== Testing countContacts ===');
    const contactCount = await db.countContacts();
    console.log('Contact count:', contactCount);

    console.log('\n=== Testing getContactsBySector ===');
    const contactsBySector = await db.getContactsBySector();
    console.log('Contacts by sector:', contactsBySector);

    console.log('\n=== Testing getEmailStats ===');
    const emailStats = await db.getEmailStats();
    console.log('Email stats:', emailStats);

    console.log('\n=== Testing getRecentNewsletters ===');
    const newsletters = await db.getRecentNewsletters(5);
    console.log('Recent newsletters:', newsletters);

    return NextResponse.json({
      success: true,
      health,
      contactCount,
      contactsBySector,
      emailStats,
      newsletters,
    });
  } catch (error) {
    console.error('=== Debug endpoint error ===');
    console.error('Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
