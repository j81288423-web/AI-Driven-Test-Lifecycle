const fs = require('fs');
const path = require('path');
const { appConfig } = require('./configLoader');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'screenshots');

function toSafeFileName(value) {
    return String(value || 'scenario').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 80);
}

/** Returns the PNG buffer for report attachment, or null when capture is disabled/fails. */
async function captureFailureScreenshot(page, label) {
    if (!appConfig.featureToggles.captureFailureScreenshots || !page) return null;
    try {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        const filePath = path.join(SCREENSHOT_DIR, `${Date.now()}-${toSafeFileName(label)}.png`);
        return await page.screenshot({ path: filePath, fullPage: appConfig.featureToggles.fullPageScreenshots });
    } catch {
        // A capture problem must never mask the original test failure.
        return null;
    }
}

module.exports = { captureFailureScreenshot, toSafeFileName, SCREENSHOT_DIR };
