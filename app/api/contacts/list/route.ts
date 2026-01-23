import { NextRequest, NextResponse } from 'next/server';
import { getSQLiteClient } from '@/lib/sqlite-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = getSQLiteClient();

    let query = 'SELECT * FROM contacts WHERE 1=1';
    const params: any[] = [];

    if (sector && sector !== 'all') {
      query += ' AND sector = ?';
      params.push(sector);
    }

    if (search) {
      query += ' AND (email LIKE ? OR company LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const contacts = db.prepare(query).all(...params);

    const countQuery = 'SELECT COUNT(*) as count FROM contacts WHERE 1=1' +
      (sector && sector !== 'all' ? ' AND sector = ?' : '') +
      (search ? ' AND (email LIKE ? OR company LIKE ? OR first_name LIKE ? OR last_name LIKE ?)' : '');

    const countParams: any[] = [];
    if (sector && sector !== 'all') {
      countParams.push(sector);
    }
    if (search) {
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const countResult = db.prepare(countQuery).get(...countParams) as { count: number };

    return NextResponse.json({
      contacts: contacts || [],
      total: countResult.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[contacts] List contacts error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to list contacts',
      },
      { status: 500 }
    );
  }
}
