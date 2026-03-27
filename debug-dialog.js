/**
 * Dialog interaction test for Klotski (Playwright + mobile emulation).
 *
 * Verifies that CheerpJ dialog buttons are clickable on mobile (touch devices).
 * Tests the Info dialog close button using multiple interaction methods.
 *
 * Usage:
 *   npm test           — runs this script (starts/stops server automatically)
 *   node debug-dialog.js [url]
 *
 * The script starts a local HTTP server automatically. If you already have
 * one running, pass its URL as argument: node debug-dialog.js http://localhost:8888/Klotski/
 */

const { chromium, devices } = require('playwright');
const { spawn }              = require('child_process');
const path                   = require('path');

const DEFAULT_URL    = 'http://localhost:8888/Klotski/';
const BASE_URL       = process.argv[2] || DEFAULT_URL;
const LOAD_TIMEOUT   = 60_000;
const INFO_DY        = 20;   // px below display top where "Info" menu item lives
const INFO_X         = 20;

// ─── Server management ────────────────────────────────────────────────────────

let serverProc = null;

async function startServer() {
    if (process.argv[2]) return; // External URL provided — skip
    const parentDir = path.join(__dirname, '..');
    console.log('Starting local server from', parentDir, '...');
    serverProc = spawn('npx', ['serve', '-l', '8888', '--no-clipboard', parentDir], {
        shell: true, stdio: 'pipe',
    });
    serverProc.stderr.on('data', () => {}); // suppress stderr
    await sleep(2500);
    console.log('Server ready at', BASE_URL);
}

function stopServer() {
    if (serverProc) { serverProc.kill(); serverProc = null; }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function windowCount(page) {
    return page.evaluate(() =>
        document.querySelectorAll('#cheerpjDisplay .window.bordered').length);
}

async function openInfoDialog(page, displayTop) {
    for (let i = 0; i < 3; i++) {
        await page.mouse.click(INFO_X, displayTop + INFO_DY);
        await sleep(900);
        if (await windowCount(page) >= 2) return true;
    }
    return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
    await startServer();

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error') console.error('[PAGE]', msg.text());
    });

    try {
        // ── Load game ──────────────────────────────────────────────────────────
        console.log('\nOpening', BASE_URL);
        await page.goto(BASE_URL);
        process.stdout.write('Waiting for CheerpJ to initialize');
        await page.waitForSelector('#game-container canvas', { timeout: LOAD_TIMEOUT });
        await sleep(3000);
        console.log(' done.');

        const displayTop = await page.evaluate(() =>
            document.getElementById('cheerpjDisplay').getBoundingClientRect().top);

        // ── Open dialog ────────────────────────────────────────────────────────
        console.log('\nOpening Info dialog...');
        const opened = await openInfoDialog(page, displayTop);
        if (!opened) {
            console.error('Could not open Info dialog. Check that the game loaded correctly.');
            return;
        }
        console.log('Dialog opened.');

        const closeBtnCenter = await page.evaluate(() => {
            const b = document.querySelector('#cheerpjDisplay .window.bordered:not(:first-of-type) .controls');
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });

        if (!closeBtnCenter) {
            console.error('Close button (✖) not found in dialog.');
            return;
        }

        await page.screenshot({ path: '/tmp/klotski-dialog.png' });
        console.log('Screenshot saved to /tmp/klotski-dialog.png');

        // ── Test methods ───────────────────────────────────────────────────────
        const methods = [
            {
                label: 'touch tap (mobile)',
                fn: () => page.tap('#cheerpjDisplay .window.bordered:not(:first-of-type) .controls'),
            },
            {
                label: 'mouse click (desktop)',
                fn: () => page.mouse.click(closeBtnCenter.x, closeBtnCenter.y),
            },
            {
                label: 'element.click() via JS',
                fn: () => page.evaluate(() => {
                    const b = document.querySelector('#cheerpjDisplay .window.bordered:not(:first-of-type) .controls');
                    if (b) b.click();
                }),
            },
        ];

        console.log('\nTesting close button interactions:\n');
        const results = [];

        for (const { label, fn } of methods) {
            // Ensure dialog is open before each test
            if (await windowCount(page) < 2) {
                await openInfoDialog(page, displayTop);
                await sleep(400);
            }

            await fn().catch(() => {});
            await sleep(1000);

            const closed = (await windowCount(page)) < 2;
            const icon   = closed ? '✓' : '✗';
            console.log(`  ${icon}  ${label}`);
            results.push({ label, closed });
        }

        const allPassed = results.every(r => r.closed);
        console.log(allPassed
            ? '\nAll tests passed — dialog buttons work on mobile.'
            : '\nSome tests failed — see results above.');

    } finally {
        await browser.close();
        stopServer();
    }
})();
