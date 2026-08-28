const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/app.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const locators = require('../locators/ProductSearchPageLocators');

setDefaultTimeout(60000);

Given('the user navigates to the application', async function () {
  await this.page.goto('https://www.automationexercise.com/');
  await this.page.waitForLoadState('load');
});

When('the user clicks Products link', async function () {
  const productsLink = locators.productsLink(this.page).first();
  await expect(productsLink).toBeVisible({ timeout: 30000 });
  await productsLink.click({ force: true });
  await this.page.waitForLoadState('load');
});

When('the user fills search keyword {string}', async function (keyword) {
  const searchInput = locators.searchInput(this.page).first();
  await expect(searchInput).toBeVisible({ timeout: 30000 });
  await searchInput.fill(keyword);
  await this.page.waitForTimeout(3000);
});

When('the user clicks Submit Search button', async function () {
  const submitSearchButton = locators.submitSearchButton(this.page).first();
  await expect(submitSearchButton).toBeVisible({ timeout: 30000 });
  await submitSearchButton.click({ force: true });
  await this.page.waitForLoadState('load');
});

Then('the searched products heading should be visible', async function () {
  const searchedProductsHeading = locators.searchedProductsHeading(this.page).first();
  await expect(searchedProductsHeading).toBeVisible({ timeout: 30000 });
});

Then('the search results should contain matching products', async function () {
  const pageText = await this.page.locator('body').textContent();
  expect(
    pageText.includes('T-Shirt') ||
    pageText.includes('T-shirt') ||
    pageText.includes('Premium Polo T-Shirts') ||
    pageText.includes('Pure Cotton V-Neck T-Shirt') ||
    pageText.includes('Green Side Placket Detail T-Shirt')
  ).toBeTruthy();
});
