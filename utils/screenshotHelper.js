const fs = require('fs');
const path = require('path');
const { appConfig } = require('./configLoader');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'screenshots');

function toSafeFileName(value) {
    return String(value || 'scenario').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 80);
}

/** Returns the saved PNG path, or null when capture is disabled/fails. */
async function captureFailureScreenshot(page, testName, stepName) {
    if (!appConfig.featureToggles.captureFailureScreenshots || !page || page.isClosed()) return null;
    try {
        const dir = path.join(SCREENSHOT_DIR, toSafeFileName(testName));
        fs.mkdirSync(dir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filePath = path.join(dir, `${timestamp}_FAILURE_${toSafeFileName(stepName).slice(0, 50)}.png`);

        await page.screenshot({ path: filePath, fullPage: appConfig.featureToggles.fullPageScreenshots });
        return filePath;
    } catch {
        // A capture problem must never mask the original test failure.
        return null;
    }
}

module.exports = { captureFailureScreenshot, toSafeFileName, SCREENSHOT_DIR };
