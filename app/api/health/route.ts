// app/api/health/route.ts - System health check endpoint
import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';

export async function GET() {
  try {
    // Check database
    const dbHealth = await checkDatabaseHealth();

    // Check environment variables
    const envChecks = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      anthropic_api_key: !!process.env.ANTHROPIC_API_KEY,
      github_token: !!process.env.GITHUB_TOKEN,
      github_owner: !!process.env.GITHUB_OWNER,
      github_repo: !!process.env.GITHUB_REPO,
      resend_api_key: !!process.env.RESEND_API_KEY,
      apollo_api_key: !!process.env.APOLLO_API_KEY,
    };

    const missingEnvVars = Object.entries(envChecks)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    const allEnvVarsSet = missingEnvVars.length === 0;

    // Overall health status
    const isHealthy = dbHealth.healthy && allEnvVarsSet;

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      environment: {
        configured: envChecks,
        missing: missingEnvVars,
        all_set: allEnvVarsSet,
      },
      services: {
        supabase: envChecks.supabase_url && envChecks.supabase_service_role,
        claude_ai: envChecks.anthropic_api_key,
        github_manus: envChecks.github_token && envChecks.github_owner && envChecks.github_repo,
        resend_email: envChecks.resend_api_key,
        apollo_enrichment: envChecks.apollo_api_key,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
