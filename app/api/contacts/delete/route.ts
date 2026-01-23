import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database-operations';
import { getSQLiteClient } from '@/lib/sqlite-client';

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

    if (id) {
      database.deleteContact(id);
    } else if (email) {
      const db = getSQLiteClient();
      const contact = db.prepare('SELECT id FROM contacts WHERE email = ?').get(email.toLowerCase()) as { id: string } | undefined;
      if (contact) {
        database.deleteContact(contact.id);
      }
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
