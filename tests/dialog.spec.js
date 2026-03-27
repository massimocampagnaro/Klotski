const { test, expect } = require('@playwright/test');

const BASE_URL     = 'http://localhost:8888/Klotski/';
const CANVAS_WAIT  = 90_000; // CheerpJ runtime loads from CDN
const JAVA_INIT_MS = 3_000;  // extra buffer after canvas appears
const INFO_X       = 20;
const INFO_DY      = 20;     // px below display top where "Info" menu item lives

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function windowCount(page) {
    return page.evaluate(() =>
        document.querySelectorAll('#cheerpjDisplay .window.bordered').length);
}

async function openInfoDialog(page) {
    const displayTop = await page.evaluate(() =>
        document.getElementById('cheerpjDisplay').getBoundingClientRect().top);

    for (let attempt = 0; attempt < 3; attempt++) {
        await page.mouse.click(INFO_X, displayTop + INFO_DY);
        await page.waitForTimeout(900);
        if (await windowCount(page) >= 2) return;
    }
    throw new Error('Info dialog did not open after 3 attempts');
}

// ─── Setup ────────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('#game-container canvas', { timeout: CANVAS_WAIT });
    // Let Java finish initializing before interacting
    await page.waitForTimeout(JAVA_INIT_MS);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('CheerpJ dialog buttons', () => {

    test('Info dialog opens and close button responds to touch tap', async ({ page }) => {
        await openInfoDialog(page);

        const before = await windowCount(page);
        expect(before, 'Dialog should be open').toBeGreaterThanOrEqual(2);

        // Touch tap — this is the mobile-specific path fixed in app.js
        await page.tap('#cheerpjDisplay .window.bordered:not(:first-of-type) .controls');
        await page.waitForTimeout(1000);

        const after = await windowCount(page);
        expect(after, 'Dialog should close after touch tap').toBe(1);
    });

    test('Info dialog close button responds to mouse click', async ({ page }) => {
        await openInfoDialog(page);

        const closeBtn = page.locator('#cheerpjDisplay .window.bordered:not(:first-of-type) .controls');
        await closeBtn.click();
        await page.waitForTimeout(1000);

        expect(await windowCount(page)).toBe(1);
    });

});
