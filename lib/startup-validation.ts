import { validateSupabaseConnection } from './supabase-client';
import { checkDatabaseHealth } from './db';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  envVars: Record<string, boolean>;
}

export async function validateStartup(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };

  const optionalEnvVars = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    APOLLO_API_KEY: process.env.APOLLO_API_KEY,
  };

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (serviceRoleKey && !serviceRoleKey.startsWith('eyJ')) {
    errors.push(
      'SUPABASE_SERVICE_ROLE_KEY appears invalid. It should be a JWT token starting with "eyJ". ' +
      'Get it from: Supabase Dashboard → Settings → API → service_role key'
    );
  }

  if (serviceRoleKey && serviceRoleKey.length < 100) {
    errors.push(
      'SUPABASE_SERVICE_ROLE_KEY appears incomplete. It should be 200+ characters long.'
    );
  }

  for (const [key, value] of Object.entries(optionalEnvVars)) {
    if (!value) {
      if (key.startsWith('GITHUB_')) {
        warnings.push(`${key} not set. MANUS signal fetching from GitHub will not work.`);
      } else if (key === 'APOLLO_API_KEY') {
        warnings.push(`${key} not set. Contact enrichment will not be available.`);
      }
    }
  }

  if (errors.length === 0) {
    try {
      const connectionResult = await validateSupabaseConnection();
      if (!connectionResult.valid) {
        errors.push(`Database connection failed: ${connectionResult.error}`);
      } else {
        const healthCheck = await checkDatabaseHealth();
        if (!healthCheck.healthy) {
          errors.push(`Database health check failed: ${healthCheck.error || healthCheck.message}`);
        }
      }
    } catch (error) {
      errors.push(
        `Startup validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    envVars: {
      ...Object.fromEntries(Object.keys(requiredEnvVars).map(k => [k, !!requiredEnvVars[k as keyof typeof requiredEnvVars]])),
      ...Object.fromEntries(Object.keys(optionalEnvVars).map(k => [k, !!optionalEnvVars[k as keyof typeof optionalEnvVars]])),
    },
  };
}

export function logValidationResults(result: ValidationResult): void {
  console.log('\n=================================');
  console.log('🔍 WUKR WIRE STARTUP VALIDATION');
  console.log('=================================\n');

  if (result.valid) {
    console.log('✅ All checks passed!\n');
  } else {
    console.error('❌ Validation failed:\n');
    result.errors.forEach(error => {
      console.error(`  • ${error}`);
    });
    console.error('');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    result.warnings.forEach(warning => {
      console.warn(`  • ${warning}`);
    });
    console.warn('');
  }

  console.log('Environment Variables:');
  Object.entries(result.envVars).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`  ${icon} ${key}`);
  });

  console.log('\n=================================\n');

  if (!result.valid) {
    console.error('⚠️  Please fix the errors above before using the application.\n');
    console.error('📖 See SUPABASE_SETUP.md for detailed setup instructions.\n');
  }
}
