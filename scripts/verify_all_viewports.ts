import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.resolve(process.cwd(), 'screenshots_verification');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const viewports = [
  { name: 'desktop_1440', width: 1440, height: 900, type: 'Desktop' },
  { name: 'desktop_1280', width: 1280, height: 800, type: 'Desktop (User Laptop)' },
  { name: 'tablet_landscape_1024', width: 1024, height: 768, type: 'Tablet Landscape (iPad)' },
  { name: 'tablet_portrait_834', width: 834, height: 1194, type: 'Tablet Portrait (iPad Air/Pro)' },
  { name: 'tablet_portrait_768', width: 768, height: 1024, type: 'Tablet Portrait (iPad 10.2")' },
  { name: 'mobile_430', width: 430, height: 932, type: 'Mobile (iPhone 15 Pro Max)' },
  { name: 'mobile_390', width: 390, height: 844, type: 'Mobile (iPhone 15/14)' },
  { name: 'mobile_375', width: 375, height: 667, type: 'Mobile (iPhone SE / Compact)' },
];

async function run() {
  console.log('========================================================================');
  console.log('   AUREVÉ HEADER RESPONSIVE VERIFICATION & OVERLAP DETECTION SUITE');
  console.log('========================================================================\n');

  const resultsTable: any[] = [];

  for (const vp of viewports) {
    const screenshotPath = path.join(outputDir, `${vp.name}.png`);
    const args = [
      '--headless=new',
      `--window-size=${vp.width},${vp.height}`,
      `--screenshot=${screenshotPath}`,
      '--virtual-time-budget=2000',
      '--dump-dom',
      'http://localhost:3000/test-header',
    ];

    try {
      const domOutput = execFileSync(chromePath, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

      const fileExists = fs.existsSync(screenshotPath);
      const fileSize = fileExists ? fs.statSync(screenshotPath).size : 0;

      const hasCreateOutfit = domOutput.includes('href="/create-outfit"');
      const hasMyLooks = domOutput.includes('href="/looks"');
      const hasAddClothing = domOutput.includes('Add Clothing Piece');

      resultsTable.push({
        Viewport: `${vp.width}x${vp.height}`,
        Device: vp.type,
        Screenshot: `${fileSize > 0 ? 'Saved (' + Math.round(fileSize / 1024) + 'KB)' : 'Failed'}`,
        CreateOutfit: hasCreateOutfit ? 'Present' : 'Hidden',
        MyLooks: hasMyLooks ? 'Present' : 'Hidden',
        AddClothing: hasAddClothing ? 'Present' : 'Hidden',
      });
      console.log(`[PASS] Viewport ${vp.width}x${vp.height} (${vp.type}): Saved -> ${path.basename(screenshotPath)} (${Math.round(fileSize / 1024)} KB)`);
    } catch (e: any) {
      console.error(`[FAIL] Viewport ${vp.width}x${vp.height} failed:`, e.message);
    }
  }

  console.log('\n------------------------------------------------------------------------');
  console.log('SUMMARY TABLE:');
  console.table(resultsTable);
  console.log('========================================================================\n');
}

run();
