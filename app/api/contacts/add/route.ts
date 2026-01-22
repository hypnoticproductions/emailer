// app/api/contacts/add/route.ts - Manually add individual contacts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, company, sector, firstName, lastName, title, linkedin, notes } = body;

    if (!email || !sector) {
      return NextResponse.json(
        { error: 'Email and sector are required' },
        { status: 400 }
      );
    }

    // Create contact ID
    const contactId = `contact_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Use Supabase client to insert
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('contacts')
      .upsert({
        id: contactId,
        email: email.toLowerCase(),
        company: company || null,
        sector: sector,
        first_name: firstName || null,
        last_name: lastName || null,
        title: title || null,
        linkedin: linkedin || null,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error adding contact:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact added successfully',
      contact: { id: contactId, email, company, sector },
    });
  } catch (error) {
    console.error('Add contact error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add contact',
      },
      { status: 500 }
    );
  }
}
