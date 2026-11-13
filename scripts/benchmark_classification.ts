import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

import { classifyClothingImage } from '../src/lib/ai/visionClassifier';

async function test() {
  const imageUrl = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80';
  // Fetch once to get base64 data URL as client would send
  const res = await fetch(imageUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  const base64DataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;

  console.log(`[TEST 1] First classification of pre-buffered base64 image...`);
  const t0 = Date.now();
  const r1 = await classifyClothingImage(base64DataUrl);
  const d1 = Date.now() - t0;
  console.log(`Result 1: ${r1.name} (${r1.category}/${r1.subcategory}) | Time: ${d1}ms`);

  console.log(`[TEST 2] Second classification (Same image / Cache hit)...`);
  const t1 = Date.now();
  const r2 = await classifyClothingImage(base64DataUrl);
  const d2 = Date.now() - t1;
  console.log(`Result 2: ${r2.name} | Time: ${d2}ms`);
}

test();
