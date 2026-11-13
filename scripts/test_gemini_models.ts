import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=(.+)/);
if (!keyMatch) {
  console.log('No GEMINI_API_KEY found');
  process.exit(0);
}
const key = keyMatch[1].trim();

async function testModel(name: string) {
  const t0 = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Return strictly JSON: {"status": "ok"}' }] }],
        generationConfig: { responseMimeType: 'application/json' }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const d = await res.json();
    console.log(`${name.padEnd(25)}: status ${res.status} | ${Date.now() - t0}ms | ${res.ok ? 'SUCCESS' : d.error?.message?.slice(0, 80)}`);
    return res.ok;
  } catch (e: any) {
    clearTimeout(timeoutId);
    console.log(`${name.padEnd(25)}: ${Date.now() - t0}ms | ERROR: ${e.name === 'AbortError' ? 'TIMEOUT (5s)' : e.message}`);
    return false;
  }
}

async function run() {
  const candidates = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ];
  for (const m of candidates) {
    await testModel(m);
  }
}

run();
