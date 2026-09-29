/**
 * AUREVÉ DATA MIGRATION SCRIPT: Synchronize Auth Email to public.users
 * 
 * Run with: node --dns-result-order=ipv4first scripts/migrate_users_email.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) envVars[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('================================================================');
  console.log('AUREVÉ USER EMAIL SYNCHRONIZATION');
  console.log('================================================================\n');

  // 1. Fetch all auth users
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Failed to list auth users:', authErr);
    process.exit(1);
  }

  const authMap = new Map();
  authData.users.forEach((u) => {
    if (u.email) {
      authMap.set(u.id, u.email);
    }
  });

  console.log(`Found ${authData.users.length} authenticated users in Supabase Auth.`);

  // 2. Fetch all public.users
  const { data: publicUsers, error: pubErr } = await supabase.from('users').select('*');
  if (pubErr) {
    console.error('Failed to fetch public.users:', pubErr);
    process.exit(1);
  }

  console.log(`Found ${publicUsers.length} records in public.users.\n`);

  // 3. For each public user, sync their email
  let updatedCount = 0;
  let skippedCount = 0;

  for (const user of publicUsers) {
    const authEmail = authMap.get(user.id);
    if (!authEmail) {
      console.warn(`[WARNING] No matching auth user found for public user ${user.id} (${user.name}). Leaving email unchanged.`);
      skippedCount++;
      continue;
    }

    if (user.email === authEmail) {
      console.log(`✓ User ${user.name} (${user.id}) already has verified email: ${authEmail}`);
      continue;
    }

    console.log(`-> Updating User ${user.name} (${user.id}): Setting email to ${authEmail}`);
    const { error: updateErr } = await supabase
      .from('users')
      .update({ email: authEmail, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateErr) {
      console.error(`  [ERROR] Failed to update user ${user.id}:`, updateErr.message);
    } else {
      console.log(`  ✓ Successfully updated email for ${user.name}`);
      updatedCount++;
    }
  }

  console.log('\n================================================================');
  console.log(`Migration Summary: ${updatedCount} updated, ${skippedCount} skipped/unmatched.`);
  console.log('================================================================\n');
}

runMigration().catch((err) => {
  console.error('Unhandled migration error:', err);
  process.exit(1);
});
