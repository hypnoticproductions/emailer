import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-operations';

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

    const contact = database.addContact({
      email: email.toLowerCase(),
      company: company || null,
      sector: sector,
      firstName: firstName || null,
      lastName: lastName || null,
      title: title || null,
      linkedin: linkedin || null,
      notes: notes || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Contact added successfully',
      contact,
    });
  } catch (error) {
    console.error('[contacts] Add contact error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add contact',
      },
      { status: 500 }
    );
  }
}
