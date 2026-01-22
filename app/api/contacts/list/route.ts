// app/api/contacts/list/route.ts - List contacts with filtering and pagination
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by sector if provided
    if (sector && sector !== 'all') {
      query = query.eq('sector', sector);
    }

    // Search across email, company, first_name, last_name
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,company.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contacts: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('List contacts error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to list contacts',
      },
      { status: 500 }
    );
  }
}
