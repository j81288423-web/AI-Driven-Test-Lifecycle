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

When('the user clicks the Products link', async function () {
  const productsLink = locators.productsLink(this.page).first();
  await expect(productsLink).toBeVisible({ timeout: 30000 });
  await productsLink.click({ force: true });
  await this.page.waitForLoadState('load');
});

When('the user fills the search input with {string}', async function (searchText) {
  const searchInput = locators.searchInput(this.page).first();
  await expect(searchInput).toBeVisible({ timeout: 30000 });
  await searchInput.fill(searchText);
  await this.page.waitForTimeout(3000);
});

When('the user clicks the search button', async function () {
  const searchButton = locators.searchButton(this.page).first();
  await expect(searchButton).toBeVisible({ timeout: 30000 });
  await searchButton.click({ force: true });
  await this.page.waitForLoadState('load');
});

Then('the searched products heading should be visible', async function () {
  const searchedProductsHeading = locators.searchedProductsHeading(this.page).first();
  await expect(searchedProductsHeading).toBeVisible({ timeout: 30000 });
});

Then('matching search results should be returned', async function () {
  const matchingResults = await this.page.locator('.productinfo p').evaluateAll((elements) => {
    return elements
      .map((el) => (el.textContent || '').trim())
      .filter(Boolean)
      .filter((text) => /t-shirt/i.test(text));
  });
  expect(matchingResults.length).toBeGreaterThan(0);
});

Then('the search input should retain {string}', async function (searchText) {
  const searchInput = locators.searchInput(this.page).first();
  await expect(searchInput).toBeVisible({ timeout: 30000 });
  await expect(searchInput).toHaveValue(searchText);
});

Then('the URL should contain {string}', async function (urlFragment) {
  await expect(this.page).toHaveURL(new RegExp(urlFragment));
});

When('the user clicks the first View Product link', async function () {
  const firstViewProductLink = locators.firstViewProductLink(this.page).first();
  await expect(firstViewProductLink).toBeVisible({ timeout: 30000 });
  await firstViewProductLink.click({ force: true });
  await this.page.waitForLoadState('load');
});

Then('the product details page should be visible', async function () {
  await expect(this.page).toHaveURL(/\/product_details\//);
});

Then('the product title {string} should be visible', async function (productTitle) {
  const productTitleElement = locators.productTitle(this.page, productTitle).first();
  await expect(productTitleElement).toBeVisible({ timeout: 30000 });
});

Then('the quantity input should be visible', async function () {
  const quantityInput = locators.quantityInput(this.page).first();
  await expect(quantityInput).toBeVisible({ timeout: 30000 });
});

Then('the Add to cart button should be visible', async function () {
  const addToCartButton = locators.addToCartButton(this.page).first();
  await expect(addToCartButton).toBeVisible({ timeout: 30000 });
});
