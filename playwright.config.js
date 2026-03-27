const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',

    // CheerpJ loads Java runtime from CDN — give it plenty of time
    timeout: 120_000,
    expect: { timeout: 10_000 },

    // Retry once in CI to handle occasional CDN slowness
    retries: process.env.CI ? 1 : 0,
    workers: 1, // CheerpJ is heavy; run tests sequentially

    reporter: [['html'], ['list']],

    projects: [
        {
            name: 'Mobile Chrome (iPhone 12)',
            use: {
                // devices['iPhone 12'] defaults to WebKit — override to Chromium
                // so our touch-event fixes (which target Chromium behaviour) are tested.
                browserName: 'chromium',
                ...devices['iPhone 12'],
                viewport: { width: 390, height: 844 },
                launchOptions: { args: ['--disable-gpu'] },
            },
        },
    ],

    // Start a local HTTP server from the PARENT directory.
    // CheerpJ resolves the jar as /app/Klotski/klotski.jar, which maps to
    // <server-root>/Klotski/klotski.jar — hence serving one level up.
    webServer: {
        command: 'npx serve -l 8888 ..',
        url: 'http://localhost:8888/Klotski/',
        timeout: 20_000,
        reuseExistingServer: !process.env.CI,
    },
});
