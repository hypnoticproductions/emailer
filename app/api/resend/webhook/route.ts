// app/api/resend/webhook/route.ts - Simplified for now (TODO: Add tracking updates)
import { NextRequest, NextResponse } from 'next/server';

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

    // Log the webhook event
    console.log(`Received webhook: ${type} for email ${data.email_id}`);

    // TODO: Implement email tracking updates
    // For now, just acknowledge receipt

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
