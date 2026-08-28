const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/app.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const locators = require('../locators/ProductSearchPageLocators');

class ProductSearchPage {
  constructor(page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('https://www.automationexercise.com/');
    await this.page.waitForLoadState('load');
  }

  async clickProductsLink() {
    const productsLink = locators.productsLink(this.page).first();
    await expect(productsLink).toBeVisible({ timeout: 30000 });
    await productsLink.click({ force: true });
    await this.page.waitForLoadState('load');
  }

  async fillSearchInput(searchText) {
    const searchInput = locators.searchInput(this.page).first();
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(3000);
  }

  async clickSearchButton() {
    const searchButton = locators.searchButton(this.page).first();
    await expect(searchButton).toBeVisible({ timeout: 30000 });
    await searchButton.click({ force: true });
    await this.page.waitForLoadState('load');
  }

  async validateSearchedProductsHeading() {
    const searchedProductsHeading = locators.searchedProductsHeading(this.page).first();
    await expect(searchedProductsHeading).toBeVisible({ timeout: 30000 });
  }

  async validateMatchingSearchResults() {
    const matchingResults = await this.page.locator('.productinfo p').evaluateAll((elements) => {
      return elements
        .map((el) => (el.textContent || '').trim())
        .filter(Boolean)
        .filter((text) => /t-shirt/i.test(text));
    });
    expect(matchingResults.length).toBeGreaterThan(0);
  }

  async validateSearchInputRetainsValue(searchText) {
    const searchInput = locators.searchInput(this.page).first();
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    await expect(searchInput).toHaveValue(searchText);
  }

  async validateUrlContains(urlFragment) {
    await expect(this.page).toHaveURL(new RegExp(urlFragment));
  }

  async clickFirstViewProductLink() {
    const firstViewProductLink = locators.firstViewProductLink(this.page).first();
    await expect(firstViewProductLink).toBeVisible({ timeout: 30000 });
    await firstViewProductLink.click({ force: true });
    await this.page.waitForLoadState('load');
  }

  async validateProductDetailsPage() {
    await expect(this.page).toHaveURL(/\/product_details\//);
  }

  async validateProductTitle(productTitle) {
    const productTitleElement = locators.productTitle(this.page, productTitle).first();
    await expect(productTitleElement).toBeVisible({ timeout: 30000 });
  }

  async validateQuantityInput() {
    const quantityInput = locators.quantityInput(this.page).first();
    await expect(quantityInput).toBeVisible({ timeout: 30000 });
  }

  async validateAddToCartButton() {
    const addToCartButton = locators.addToCartButton(this.page).first();
    await expect(addToCartButton).toBeVisible({ timeout: 30000 });
  }
}

module.exports = ProductSearchPage;
