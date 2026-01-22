// app/api/newsletters/list/route.ts - List newsletters
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      newsletters: data || [],
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
