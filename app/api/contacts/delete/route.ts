import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { error: 'Either email or id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    let query = supabase.from('contacts').delete();

    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('email', email.toLowerCase());
    }

    const { error } = await query;

    if (error) {
      console.error('[contacts] Error deleting contact:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    console.error('[contacts] Delete contact error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete contact',
      },
      { status: 500 }
    );
  }
}
