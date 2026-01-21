// app/api/resend/webhook/route.ts - Track email events
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    console.log(`Received webhook: ${type} for email ${data.email_id}`);

    // Update email tracking based on event type
    const emailId = data.email_id;
    const updates: any = {};

    switch (type) {
      case 'email.delivered':
        updates.delivered_at = new Date().toISOString();
        updates.status = 'delivered';
        break;
      case 'email.opened':
        updates.opened_at = new Date().toISOString();
        break;
      case 'email.clicked':
        updates.clicked_at = new Date().toISOString();
        break;
      case 'email.bounced':
      case 'email.complained':
        updates.status = 'failed';
        break;
    }

    if (Object.keys(updates).length > 0) {
      await db.updateEmailStatus(emailId, updates);
      console.log(`Updated email ${emailId}:`, updates);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}
