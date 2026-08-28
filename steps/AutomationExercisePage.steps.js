const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/app.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const locators = require('../locators/AutomationExercisePageLocators');

setDefaultTimeout(60000);

Given('the user opens the application URL', async function () {
  await this.page.goto('https://www.automationexercise.com/');
  await this.page.waitForLoadState('load');
});

When('the user clicks {string} link', async function (linkText) {
  const link = locators.linkByName(this.page, linkText).first();
  await expect(link).toBeVisible({ timeout: 30000 });
  await link.click({ force: true });
  await this.page.waitForTimeout(3000);
  await this.page.waitForLoadState('load');
});

When('the user enters search keyword {string}', async function (keyword) {
  const searchInput = locators.searchInput(this.page).first();
  await expect(searchInput).toBeVisible({ timeout: 30000 });
  await searchInput.fill(keyword);
  await this.page.waitForTimeout(3000);
});

When('the user clicks search submit button', async function () {
  const searchButton = locators.searchButton(this.page).first();
  await expect(searchButton).toBeVisible({ timeout: 30000 });
  await searchButton.click({ force: true });
  await this.page.waitForTimeout(3000);
  await this.page.waitForLoadState('load');
});

Then('the user should see searched products heading', async function () {
  const searchedProductsHeading = locators.searchedProductsHeading(this.page).first();
  await expect(searchedProductsHeading).toBeVisible({ timeout: 30000 });
});

Then('the search results should contain the keyword {string}', async function (keyword) {
  const searchInput = locators.searchInput(this.page).first();
  await expect(searchInput).toBeVisible({ timeout: 30000 });
  await expect(searchInput).toHaveValue(keyword);

  const shirtMatchCount = await this.page.evaluate((k) => {
    const names = Array.from(document.querySelectorAll('.productinfo p'))
      .map(el => (el.textContent || '').trim())
      .filter(Boolean);
    const re = new RegExp(k, 'i');
    return names.filter(name => re.test(name)).length;
  }, keyword);
  expect(shirtMatchCount).toBeGreaterThan(0);
});

Then('the success confirmation message should be detected', async function () {
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
});
