const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/YYC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = 'http://127.0.0.1:5173/';
const artifactDir = path.resolve('artifacts/reboot08');
fs.mkdirSync(artifactDir, { recursive: true });

const failedCycle = {
  cycleId: 'cycle-07-visual-test',
  rebootNumber: 7,
  failedAt: 1700000100000,
  fatalEndingTriggered: true,
  failedInteractionId: 'CH03-0144',
  failureCause: 'bulkhead_failure',
  previousCycleMaxNodeId: 'CH03-0144',
  completedNodeIds: ['PRO-0001', 'PRO-0002', 'PRO-0003', 'PRO-0004', 'PRO-0005', 'PRO-0006', 'PRO-0007', 'PRO-0008', 'PRO-0009', 'PRO-0010', 'PRO-0011'],
  choiceHistory: [
    { nodeId: 'PRO-0012', choiceId: 'PRO-0012__0', choiceIndex: 0, nextId: 'PRO-0013', committedAt: 1 },
    { nodeId: 'PRO-0024', choiceId: 'PRO-0024__0', choiceIndex: 0, nextId: 'PRO-0025', committedAt: 2 },
    { nodeId: 'PRO-0042', choiceId: 'PRO-0042__0', choiceIndex: 0, nextId: 'PRO-0043', committedAt: 3 },
    { nodeId: 'PRO-0061', choiceId: 'PRO-0061__0', choiceIndex: 0, nextId: 'PRO-0062', committedAt: 4 },
    { nodeId: 'PRO-0075', choiceId: 'PRO-0075__0', choiceIndex: 0, nextId: 'PRO-0076', committedAt: 5 },
    { nodeId: 'PRO-0100', choiceId: 'PRO-0100__0', choiceIndex: 0, nextId: 'PRO-0101', committedAt: 6 },
    { nodeId: 'PRO-0128', choiceId: 'PRO-0128__0', choiceIndex: 0, nextId: 'PRO-0129', committedAt: 7 },
    { nodeId: 'PRO-0152', choiceId: 'PRO-0152__0', choiceIndex: 0, nextId: 'PRO-0153', committedAt: 8 },
  ],
  interactionResults: [],
  timedResults: [],
  freeInputs: [],
};

const progress = {
  version: 6,
  unlockedArchives: ['anchor_first_message', 'ending_bad'],
  endingsUnlocked: ['ending_bad'],
  commemorativeArchiveSaved: false,
  readNodeIds: [...failedCycle.completedNodeIds],
  currentRebootNumber: 8,
  fatalRebootCount: 1,
  fatalEndingTriggered: true,
  reboot08TitleUnlocked: true,
  failedCycles: [failedCycle],
};

async function seed(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(value => {
    localStorage.clear();
    localStorage.setItem('seventh_reboot_persistent_progress', JSON.stringify(value));
  }, progress);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.menu-screen').waitFor({ state: 'visible' });
}

async function verifyMenu(page, suffix) {
  const title = page.locator('h1.menu-title');
  await title.waitFor({ state: 'visible' });
  const titleLabel = await title.getAttribute('aria-label');
  if (titleLabel !== '第八次重启') throw new Error(`Unexpected official title: ${titleLabel}`);
  const commandLabels = await page.locator('.menu-command-list button').allTextContents();
  const normalized = commandLabels.map(text => text.trim()).filter(Boolean);
  if (normalized.join('|') !== '重新建立连接|读取记录|设置') {
    throw new Error(`Unexpected reboot menu: ${normalized.join('|')}`);
  }
  const withdrawnLayers = await page.locator('.menu-title-eight-lockup, .menu-title-eight-en').count();
  if (withdrawnLayers !== 0) throw new Error(`Withdrawn Reboot 08 title layers remain: ${withdrawnLayers}`);
  const officialImage = await title.locator('.menu-title-art').evaluate(node => getComputedStyle(node).backgroundImage);
  if (!officialImage.includes('eighth_reboot_title_wordmark_zh.png')) throw new Error(`Official Chinese image is not active: ${officialImage}`);
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  if (overflow.width > overflow.client + 1) throw new Error(`Horizontal overflow: ${overflow.width}/${overflow.client}`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(artifactDir, `menu-${suffix}.png`), fullPage: true });
  return { titleLabel, normalized, withdrawnLayers, officialImage, overflow };
}

let browser;

(async () => {
  browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  desktop.setDefaultTimeout(12_000);
  const errors = [];
  desktop.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()} ${JSON.stringify(message.location())}`);
  });
  desktop.on('requestfailed', request => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
      errors.push(`request failed: ${request.url()} / ${request.failure()?.errorText}`);
    }
  });
  desktop.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  desktop.on('response', response => {
    if (response.status() >= 400) errors.push(`response ${response.status()}: ${response.url()}`);
  });

  console.log('STEP desktop seed');
  await seed(desktop);
  console.log('STEP desktop menu');
  const desktopMenu = await verifyMenu(desktop, 'desktop');

  await desktop.getByRole('button', { name: '设置' }).click();
  await desktop.getByRole('button', { name: 'English' }).click();
  await desktop.getByRole('button', { name: 'Close' }).click();
  await desktop.waitForTimeout(350);
  if (await desktop.locator('h1.menu-title').getAttribute('aria-label') !== 'EIGHTH REBOOT') {
    throw new Error('English official title did not update');
  }
  const englishImage = await desktop.locator('h1.menu-title .menu-title-art').evaluate(node => getComputedStyle(node).backgroundImage);
  if (!englishImage.includes('eighth_reboot_title_wordmark_en.png')) throw new Error(`Official English image is not active: ${englishImage}`);
  await desktop.screenshot({ path: path.join(artifactDir, 'menu-english-desktop.png'), fullPage: true });
  await desktop.getByRole('button', { name: 'Settings' }).click();
  await desktop.getByRole('button', { name: '简体中文' }).click();
  await desktop.getByRole('button', { name: '关闭' }).click();

  console.log('STEP history');
  await desktop.getByRole('button', { name: '读取记录' }).click();
  await desktop.getByRole('button', { name: '历史循环' }).click();
  await desktop.locator('.archive-history-entry').waitFor({ state: 'visible' });
  await desktop.screenshot({ path: path.join(artifactDir, 'history-desktop.png'), fullPage: true });
  const historyText = await desktop.locator('.archive-history-entry').innerText();
  if (!historyText.includes('隔离舱均压失败') || !historyText.includes('只读')) {
    throw new Error('Failed-cycle history is not clearly read-only');
  }
  await desktop.getByRole('button', { name: '返回主菜单' }).click();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.setDefaultTimeout(12_000);
  mobile.on('console', message => {
    if (message.type() === 'error') errors.push(`mobile console: ${message.text()} ${JSON.stringify(message.location())}`);
  });
  mobile.on('requestfailed', request => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') {
      errors.push(`mobile request failed: ${request.url()} / ${request.failure()?.errorText}`);
    }
  });
  mobile.on('pageerror', error => errors.push(`mobile pageerror: ${error.message}`));
  mobile.on('response', response => {
    if (response.status() >= 400) errors.push(`mobile response ${response.status()}: ${response.url()}`);
  });
  console.log('STEP mobile seed');
  await seed(mobile);
  const mobileMenu = await verifyMenu(mobile, 'mobile');

  if (errors.length) {
    fs.writeFileSync(path.join(artifactDir, 'console-errors.txt'), errors.join('\n'));
    throw new Error(errors.join('\n'));
  }
  fs.writeFileSync(path.join(artifactDir, 'report.json'), JSON.stringify({ desktopMenu, mobileMenu }, null, 2));
  console.log(JSON.stringify({ desktopMenu, mobileMenu, screenshots: fs.readdirSync(artifactDir).sort() }, null, 2));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
});
