const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config/app.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const locators = require('../locators/ProductSearchPageLocators');

setDefaultTimeout(60000);

Given('the user opens the Automation Exercise application', async function () {
  await this.page.goto('https://www.automationexercise.com/');
  await this.page.waitForLoadState('load');
});

When('the user clicks the Products link', async function () {
  const productsLink = locators.productsLink(this.page).first();
  await expect(productsLink).toBeVisible({ timeout: 30000 });
  await productsLink.click({ force: true });
  await this.page.waitForLoadState('load');
});

When('the user fills the search input with {string}', async function (keyword) {
  const searchInput = locators.searchInput(this.page).first();
  await expect(searchInput).toBeVisible({ timeout: 30000 });
  await searchInput.fill(keyword);
  await this.page.waitForTimeout(3000);
});

When('the user clicks the submit search button', async function () {
  const submitSearchButton = locators.submitSearchButton(this.page).first();
  await expect(submitSearchButton).toBeVisible({ timeout: 30000 });
  await submitSearchButton.click({ force: true });
  await this.page.waitForLoadState('load');
});

Then('the searched products heading should be visible', async function () {
  const searchedProductsHeading = locators.searchedProductsHeading(this.page).first();
  await expect(searchedProductsHeading).toBeVisible({ timeout: 30000 });
});

Then('the search results should not contain any product wrappers or names', async function () {
  const searchResults = await this.page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll('h2, .title, .features_items h2')).find(el =>
      (el.textContent || '').trim().toUpperCase().includes('SEARCHED PRODUCTS')
    );
    const wrappers = Array.from(document.querySelectorAll('.features_items .col-sm-4, .product-image-wrapper, .single-products'));
    const productNames = Array.from(document.querySelectorAll('.productinfo p, .single-products .productinfo p'))
      .map(el => (el.textContent || '').trim())
      .filter(Boolean);
    return {
      headingFound: !!heading,
      productWrapperCount: wrappers.length,
      productNames
    };
  });

  expect(searchResults.headingFound).toBeTruthy();
  expect(searchResults.productWrapperCount).toBe(0);
  expect(searchResults.productNames).toEqual([]);
});
