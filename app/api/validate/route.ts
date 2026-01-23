import { NextResponse } from 'next/server';
import { validateStartup } from '@/lib/startup-validation';

export async function GET() {
  try {
    const result = await validateStartup();

    return NextResponse.json(result, {
      status: result.valid ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
        envVars: {},
      },
      { status: 500 }
    );
  }
}
