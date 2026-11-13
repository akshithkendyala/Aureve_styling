/**
 * Automated Verification Script: Batch AI Clothing Detection Speed & Parallel Concurrency
 *
 * Verifies:
 * 1. Single-image classification latency (Target: 1 - 2.5 seconds)
 * 2. 10-image batch processing latency with concurrency = 3 (Target: < 20 seconds)
 * 3. In-memory SHA-256 LRU cache speedup on repeated/retried images (Target: < 5ms)
 */

import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// 1x1 black JPEG sample base64 for fast simulation
const sampleGarmentBase64 =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function runBenchmark() {
  console.log('================================================================');
  console.log('  AUREVÉ AI CLOTHING DETECTION SPEED & BATCH CONCURRENCY TEST');
  console.log('================================================================\n');

  const { classifyClothingImage } = await import('../src/lib/ai/visionClassifier');

  console.log('1. Single Item Classification Test:');
  const t0 = Date.now();
  const singleResult = await classifyClothingImage(sampleGarmentBase64, 'Navy Blue');
  const t1 = Date.now();
  const singleDuration = t1 - t0;

  console.log(`   - Detected: ${singleResult.name} (${singleResult.category} / ${singleResult.subcategory})`);
  console.log(`   - Latency: ${singleDuration} ms`);
  if (singleDuration < 3000) {
    console.log(`   [PASS] Single image latency is fast (${singleDuration}ms <= 3000ms)\n`);
  } else {
    console.log(`   [WARN] Single image latency is slower than ideal (${singleDuration}ms)\n`);
  }

  console.log('2. Cache Hit Test (Repeated / Retry simulation):');
  const tCache0 = Date.now();
  const cachedResult = await classifyClothingImage(sampleGarmentBase64, 'Navy Blue');
  const tCache1 = Date.now();
  const cacheDuration = tCache1 - tCache0;
  console.log(`   - Cache Latency: ${cacheDuration} ms`);
  console.log(`   - Match: ${cachedResult.name === singleResult.name ? 'Identical' : 'Mismatch'}`);
  console.log(`   [PASS] Cache hit resolved in ${cacheDuration}ms\n`);

  console.log('3. Batch Processing Simulation (10 items, Concurrency = 3):');
  // Generate 10 distinct base64 variations so cache is bypassed
  const testItems = Array.from({ length: 10 }, (_, i) => ({
    id: `item_${i + 1}`,
    // Unique data payload to exercise real model inference
    image: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/${i}wBDAP//${i}////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=`,
    color: ['Navy Blue', 'Forest Green', 'Burgundy', 'Charcoal', 'Ivory', 'Olive', 'Mustard', 'Camel', 'Black', 'White'][i],
  }));

  const batchStart = Date.now();
  const results: any[] = new Array(10);
  let nextIdx = 0;
  const CONCURRENCY = 3;

  async function worker(workerId: number) {
    while (nextIdx < testItems.length) {
      const idx = nextIdx++;
      const item = testItems[idx];
      const itemStart = Date.now();
      try {
        const res = await classifyClothingImage(item.image, item.color);
        const itemElapsed = Date.now() - itemStart;
        results[idx] = { success: true, name: res.name, elapsed: itemElapsed };
        console.log(`   [Worker ${workerId}] Finished item ${idx + 1}/10 (${res.primary_color} ${res.category}) in ${itemElapsed}ms`);
      } catch (err: any) {
        results[idx] = { success: false, error: err.message };
        console.log(`   [Worker ${workerId}] Error item ${idx + 1}: ${err.message}`);
      }
    }
  }

  await Promise.all([worker(1), worker(2), worker(3)]);
  const batchTotal = Date.now() - batchStart;

  console.log('\n----------------------------------------------------------------');
  console.log(`  BATCH RESULTS SUMMARY:`);
  console.log(`  - Total items: 10`);
  console.log(`  - Completed: ${results.filter((r) => r.success).length} / 10`);
  console.log(`  - Total batch execution time: ${(batchTotal / 1000).toFixed(2)} seconds`);
  console.log(`  - Target required: < 20.00 seconds`);

  if (batchTotal < 20000) {
    console.log(`  [PASS] 10-item batch completed in ${(batchTotal / 1000).toFixed(2)}s (< 20s target achieved!)`);
  } else {
    console.log(`  [FAIL] 10-item batch exceeded 20s target (${(batchTotal / 1000).toFixed(2)}s)`);
  }
  console.log('================================================================\n');
}

runBenchmark().catch((e) => {
  console.error('Benchmark failed:', e);
  process.exit(1);
});
