const { setWorldConstructor, Before, After, setDefaultTimeout, Status } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');
const fs = require('fs');
require('dotenv').config();

const { getTimeouts, getActiveEnvName } = require('../utils/configLoader');
const { captureFailureScreenshot } = require('../utils/screenshotHelper');

setDefaultTimeout(getTimeouts().stepMs);

class CustomWorld {
    constructor({ attach, parameters }) {
        this.attach = attach;
        this.parameters = parameters;
        this.browser = null;
        this.context = null;
        this.page = null;
        this.testCaseId = null;
    }
}

setWorldConstructor(CustomWorld);

Before(async function (scenario) {
    this.scenarioName = scenario?.pickle?.name || 'scenario';
    this.testCaseId = (scenario?.pickle?.tags || [])
        .map((tag) => tag.name)
        .find((name) => /^@TC_\d{3}$/.test(name))?.replace('@', '') || 'TC_UNTAGGED';

    this.browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
    // SECURITY_NOTE: no ignoreHTTPSErrors - certificate validation stays enabled for every run.
    this.context = await this.browser.newContext({ viewport: { width: 1440, height: 900 } });
    this.page = await this.context.newPage();

    this.attach(`Environment: ${getActiveEnvName()} | Test case: ${this.testCaseId}`, 'text/plain');
});

After(async function (scenario) {
    if (scenario.result?.status === Status.FAILED) {
        const stepName = scenario.pickle?.steps?.at(-1)?.text || 'unknown-step';
        const screenshotPath = await captureFailureScreenshot(this.page, this.testCaseId, stepName);
        if (screenshotPath && fs.existsSync(screenshotPath)) {
            // base64:image/png is what embeds the PNG inline in cucumber-report.html.
            await this.attach(fs.readFileSync(screenshotPath).toString('base64'), 'base64:image/png');
        }
    }
    await this.context?.close().catch(() => {});
    await this.browser?.close().catch(() => {});
});
