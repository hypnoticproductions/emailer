// app/api/resend/webhook/route.ts
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

    // Find the email record by resendId
    const emailRecord = await db.emailSent.findUnique({
      where: {
        resendId: data.email_id,
      },
    });

    if (!emailRecord) {
      console.warn(`Email record not found for resendId: ${data.email_id}`);
      return NextResponse.json({ received: true });
    }

    // Update email status based on event type
    const updates: any = {};

    switch (type) {
      case 'email.sent':
        updates.status = 'sent';
        updates.sentAt = new Date(data.created_at);
        break;

      case 'email.delivered':
        updates.status = 'delivered';
        updates.deliveredAt = new Date(data.created_at);
        break;

      case 'email.opened':
        updates.openedAt = new Date(data.created_at);
        break;

      case 'email.clicked':
        updates.clickedAt = new Date(data.created_at);
        break;

      case 'email.bounced':
      case 'email.complained':
        updates.status = 'failed';
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    // Update the email record
    if (Object.keys(updates).length > 0) {
      await db.emailSent.update({
        where: {
          id: emailRecord.id,
        },
        data: updates,
      });
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
