#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Running postinstall setup...\n');

// Generate Prisma client (needed for TypeScript types)
try {
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully\n');
  console.log('ℹ️  To set up the database, visit /api/setup after deployment\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client');
  process.exit(1);
}
