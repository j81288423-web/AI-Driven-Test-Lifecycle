const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/app.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const locators = require('../locators/AutomationExercisePageLocators');

class AutomationExercisePage {
  constructor(page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('https://www.automationexercise.com/');
    await this.page.waitForLoadState('load');
  }

  async clickLink(linkText) {
    const link = locators.linkByName(this.page, linkText).first();
    await expect(link).toBeVisible({ timeout: 30000 });
    await link.click({ force: true });
    await this.page.waitForTimeout(3000);
    await this.page.waitForLoadState('load');
  }

  async enterSearchKeyword(keyword) {
    const searchInput = locators.searchInput(this.page).first();
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    await searchInput.fill(keyword);
    await this.page.waitForTimeout(3000);
  }

  async clickSearchSubmitButton() {
    const searchButton = locators.searchButton(this.page).first();
    await expect(searchButton).toBeVisible({ timeout: 30000 });
    await searchButton.click({ force: true });
    await this.page.waitForTimeout(3000);
    await this.page.waitForLoadState('load');
  }

  async validateSearchedProductsHeading() {
    const searchedProductsHeading = locators.searchedProductsHeading(this.page).first();
    await expect(searchedProductsHeading).toBeVisible({ timeout: 30000 });
  }

  async validateSearchResultsContainKeyword(keyword) {
    const searchInput = locators.searchInput(this.page).first();
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    await expect(searchInput).toHaveValue(keyword);

    const matchCount = await this.page.evaluate((k) => {
      const names = Array.from(document.querySelectorAll('.productinfo p'))
        .map(el => (el.textContent || '').trim())
        .filter(Boolean);
      const re = new RegExp(k, 'i');
      return names.filter(name => re.test(name)).length;
    }, keyword);

    expect(matchCount).toBeGreaterThan(0);
  }

  async validateSuccessConfirmationMessage() {
    const successMessageFound = await this.page.evaluate(() => {
      const successSelectors = ['.alert-success', '.alert.alert-success', '.notification', '.message', '.toast', '.success'];
      const found = [];
      for (const sel of successSelectors) {
        document.querySelectorAll(sel).forEach(el => {
          const text = (el.textContent || '').trim();
          if (text) {
            found.push({ text, visible: el.offsetParent !== null });
          }
        });
      }
      return found.length > 0;
    });
    expect(successMessageFound).toBeTruthy();
  }
}

module.exports = AutomationExercisePage;
