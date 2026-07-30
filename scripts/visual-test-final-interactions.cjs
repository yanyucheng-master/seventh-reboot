const fs = require('node:fs');
const path = require('node:path');

const modulesRoot = process.env.CODEX_NODE_MODULES;
if (!modulesRoot) throw new Error('CODEX_NODE_MODULES is required');
const { chromium } = require(path.join(modulesRoot, 'playwright'));

const baseUrl = process.env.GAME_URL || 'http://127.0.0.1:5173/';
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outputRoot = path.join(__dirname, '..', 'artifacts', 'final-interaction-qa');
fs.mkdirSync(outputRoot, { recursive: true });

async function inspectLayout(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const overlay = document.querySelector('.special-interaction-overlay');
    const main = document.querySelector('.interaction-main');
    const interactive = [...document.querySelectorAll('button, input, output, h2, h3')];
    const horizontalLeaks = interactive
      .map(element => ({
        label: element.getAttribute('data-testid') || element.textContent?.trim().slice(0, 40) || element.tagName,
        rect: element.getBoundingClientRect(),
      }))
      .filter(item => item.rect.width > 0 && (item.rect.left < -1 || item.rect.right > window.innerWidth + 1))
      .map(item => item.label);
    return {
      viewport: [window.innerWidth, window.innerHeight],
      documentOverflowX: root.scrollWidth - root.clientWidth,
      mainOverflowX: main ? main.scrollWidth - main.clientWidth : null,
      overlayVisible: Boolean(overlay),
      horizontalLeaks,
    };
  });
}

async function openInteraction(page, nodeId, anchor) {
  const params = new URLSearchParams({ testNode: nodeId, testReducedMotion: '1' });
  if (anchor) params.set('testAnchor', anchor);
  await page.goto(`${baseUrl}?${params}`, { waitUntil: 'networkidle' });
  await page.locator('.special-interaction-overlay').waitFor({ state: 'visible' });
}

async function setRange(page, testId, value) {
  await page.getByTestId(testId).evaluate((input, next) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, String(next));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function runViewport(browser, name, viewport) {
  const context = await browser.newContext({ viewport, locale: 'zh-CN' });
  const page = await context.newPage();
  const reports = [];

  await openInteraction(page, 'CH03-0144');
  reports.push({ name: 'bulkhead-initial', ...(await inspectLayout(page)) });
  await page.screenshot({ path: path.join(outputRoot, `${name}-bulkhead-initial.png`) });
  await page.getByRole('button', { name: '封闭观测室侧隔离门' }).click();
  await page.getByRole('button', { name: '连接过渡舱与主走廊' }).click();
  await page.getByTestId('bulkhead-submit').click();
  await page.getByTestId('bulkhead-result-safe').waitFor();
  await page.screenshot({ path: path.join(outputRoot, `${name}-bulkhead-safe.png`) });

  await openInteraction(page, 'CH05A-0016');
  await page.getByTestId('critical-log-password').fill('07-01');
  await page.getByTestId('password-submit').click();
  await page.getByTestId('password-success').waitFor();
  reports.push({ name: 'joint-auth-success', ...(await inspectLayout(page)) });
  await page.screenshot({ path: path.join(outputRoot, `${name}-joint-auth.png`) });

  await openInteraction(page, 'CH05B-0017');
  await setRange(page, 'power-transit-lifeSupport', 55);
  await setRange(page, 'power-core_read-coreScan', 40);
  await page.getByTestId('power-submit').click();
  await page.getByTestId('power-result-success').waitFor();
  reports.push({ name: 'power-first-success', ...(await inspectLayout(page)) });
  await page.screenshot({ path: path.join(outputRoot, `${name}-power-success.png`) });

  await openInteraction(page, 'CH05B-0017');
  await page.getByTestId('power-submit').click();
  await page.getByTestId('power-result-fail').waitFor();
  const checkpoint = await page.evaluate(() => JSON.parse(localStorage.getItem('seventh_reboot_save') || 'null'));
  if (!checkpoint?.stats?.nova06PowerOverrideUsed || checkpoint.pendingNodeId !== 'CH05B-0021') {
    throw new Error(`First-failure checkpoint is invalid: ${JSON.stringify(checkpoint)}`);
  }
  await page.screenshot({ path: path.join(outputRoot, `${name}-power-first-fail.png`) });

  await openInteraction(page, 'CH05B-0029');
  reports.push({ name: 'power-final-attempt', ...(await inspectLayout(page)) });
  await page.screenshot({ path: path.join(outputRoot, `${name}-power-final.png`) });

  await openInteraction(page, 'CH05B-0193');
  reports.push({ name: 'memory-seal', ...(await inspectLayout(page)) });
  await page.screenshot({ path: path.join(outputRoot, `${name}-memory-seal.png`) });

  await openInteraction(page, 'FIN-0014', 'white_flower');
  await page.getByTestId('memory-restore-maintenance_board').click();
  await page.getByTestId('memory-restore-white_flower').click();
  reports.push({ name: 'memory-restore', ...(await inspectLayout(page)) });
  await page.screenshot({ path: path.join(outputRoot, `${name}-memory-restore.png`) });

  for (const report of reports) {
    if (!report.overlayVisible || report.documentOverflowX > 1 || (report.mainOverflowX ?? 0) > 1 || report.horizontalLeaks.length) {
      throw new Error(`${name}/${report.name} layout failure: ${JSON.stringify(report)}`);
    }
  }
  await context.close();
  return reports;
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  try {
    const desktop = await runViewport(browser, 'desktop', { width: 1440, height: 900 });
    const mobile = await runViewport(browser, 'mobile', { width: 390, height: 844 });
    const report = { desktop, mobile };
    fs.writeFileSync(path.join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
