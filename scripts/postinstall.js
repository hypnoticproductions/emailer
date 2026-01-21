#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Running postinstall setup...\n');

// Step 1: Always generate Prisma client (needed for TypeScript types)
try {
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client');
  process.exit(1);
}

// Step 2: Try to push database schema (only if DATABASE_URL is available)
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  console.log('⚠️  No DATABASE_URL found - skipping database schema push');
  console.log('   This is normal during build. Schema will be created at runtime.\n');
  process.exit(0);
}

try {
  console.log('🗄️  Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Database schema pushed successfully\n');
} catch (error) {
  console.warn('⚠️  Could not push database schema');
  console.warn('   This might happen during build. Schema will be created on first request.\n');
  // Don't fail the build if db push fails
}
