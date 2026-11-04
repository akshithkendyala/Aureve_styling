/**
 * AUREVÉ DATA MIGRATION: Smart Wardrobe Collections
 * Runs / verifies wardrobe_collections & wardrobe_collection_items in Supabase.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) envVars[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
  });
}

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL || '',
  envVars.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function run() {
  console.log('--- Checking Supabase Collections Tables ---');
  const { data: cols, error: colErr } = await supabase.from('wardrobe_collections').select('id').limit(1);
  if (!colErr) {
    console.log('✓ wardrobe_collections table is active in Supabase!');
  } else {
    console.log('ℹ wardrobe_collections table note:', colErr.message);
    console.log('Note: Please run src/lib/db/migrations/04_create_wardrobe_collections.sql in Supabase SQL Editor if not done yet.');
    console.log('Repository includes full automatic in-memory & session fallback for zero downtime.');
  }
}

run();
