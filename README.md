# Klotski

Java-based Klotski sliding block puzzle embedded in a web page via [CheerpJ](https://cheerpj.com/).
The original Java project is at: https://github.com/nickramos94/Klotski

## Run locally

The server must be started from the **parent directory** of this folder so CheerpJ can resolve `/app/Klotski/klotski.jar`:

```bash
npm run serve        # serves parent dir at http://localhost:8888
                     # then open http://localhost:8888/Klotski/
```

Or manually: `npx serve -l 8888 ..` from inside this folder.

## Mobile

The viewport is fixed at 520 px (`<meta name="viewport" content="width=520">`) so the game scales correctly on small screens. A touch fix in `js/app.js` (`setupDialogTouchFix`) ensures CheerpJ dialog buttons respond to taps on mobile.

## Test

Runs a Playwright test in iPhone 12 emulation: opens the Info dialog and verifies the close button is clickable via touch, mouse, and JS.

```bash
npm install
npx playwright install chromium
npm test
```
