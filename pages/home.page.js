/**
 * Home Page Object
 *
 * Covers: TC_001
 *
 * What it does:
 *   Navigates the browser to the configured base URL and verifies that the
 *   landing page rendered its branding and primary heading.
 *
 * Outcomes:
 *   - navigate(): browser lands on the resolved HTTPS base URL with the DOM loaded.
 *   - verifyLogoVisible(): asserts the site logo is visible.
 *   - verifyMainHeadingVisible(): asserts the level-1 heading is visible and not empty.
 *
 * Locators: home.locators.js
 * Step file: home.step.js
 */

const { expect } = require('@playwright/test');
require('dotenv').config();
const locators = require('../locators/home.locators');
const { getBaseUrl, getTimeouts } = require('../utils/configLoader');
const { logStep } = require('../utils/logger');

class HomePage {
    constructor(page) {
        this.page = page;
        this.timeouts = getTimeouts();
    }

    /**
     * Opens the application entry point.
     * Outcome: the browser is on the configured base URL.
     */
    async navigate() {
        await this.page.goto(getBaseUrl(), { waitUntil: 'domcontentloaded', timeout: this.timeouts.navigationMs });
        logStep('Navigated to the home page.');
    }

    /**
     * Checks the site branding rendered.
     * Outcome: the home page logo is confirmed visible.
     */
    async verifyLogoVisible() {
        await expect(locators.logo(this.page)).toBeVisible({ timeout: this.timeouts.assertionMs });
        logStep('Verified the home page logo is visible.');
    }

    /**
     * Checks the primary page heading rendered.
     * Outcome: the level-1 heading is confirmed visible with non-empty text.
     */
    async verifyMainHeadingVisible() {
        const heading = locators.mainHeading(this.page);
        await expect(heading).toBeVisible({ timeout: this.timeouts.assertionMs });
        await expect(heading).not.toHaveText('', { timeout: this.timeouts.assertionMs });
        logStep('Verified the home page main heading is visible.');
    }

    /**
     * Checks the top navigation rendered.
     * Outcome: the "Home" nav link is confirmed visible.
     */
    async verifyHomeNavLinkVisible() {
        await expect(locators.homeNavLink(this.page)).toBeVisible({ timeout: this.timeouts.assertionMs });
        logStep('Verified the Home nav link is visible.');
    }

    /**
     * Checks the product listing section rendered.
     * Outcome: the "Features Items" section heading is confirmed visible.
     */
    async verifyFeaturesItemsHeadingVisible() {
        await expect(locators.featuresItemsHeading(this.page)).toBeVisible({ timeout: this.timeouts.assertionMs });
        logStep('Verified the Features Items section is visible.');
    }
}

module.exports = HomePage;
