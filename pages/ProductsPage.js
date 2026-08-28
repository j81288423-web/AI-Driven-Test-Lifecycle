const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config/app.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const locators = require('../locators/ProductsPageLocators');

class ProductsPage {
  constructor(page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(config.baseUrl || 'https://www.automationexercise.com/');
    await this.page.waitForLoadState('load');
  }

  async clickProductsLink() {
    const productsLink = locators.productsLink(this.page).first();
    await expect(productsLink).toBeVisible({ timeout: 30000 });
    await productsLink.click({ force: true });
    await this.page.waitForLoadState('load');
  }

  async fillSearchInput(keyword) {
    const searchInput = locators.searchInput(this.page).first();
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    await searchInput.fill(keyword);
    await this.page.waitForTimeout(3000);
  }

  async clickSearchSubmitButton() {
    const searchButton = locators.searchButton(this.page).first();
    await expect(searchButton).toBeVisible({ timeout: 30000 });
    await searchButton.click({ force: true });
    await this.page.waitForLoadState('load');
  }

  async validateSearchResultsDisplayed() {
    const searchedProductsHeading = locators.searchedProductsHeading(this.page).first();
    const matchingProducts = locators.matchingProducts(this.page);
    await expect(searchedProductsHeading).toBeVisible({ timeout: 30000 });
    await expect(matchingProducts.first()).toBeVisible({ timeout: 30000 });
    await expect(matchingProducts).toHaveCount(1);
  }

  async validateSuccessConfirmationMessageVisible() {
    const searchedProductsHeading = locators.searchedProductsHeading(this.page).first();
    const searchInput = locators.searchInput(this.page).first();
    await expect(searchedProductsHeading).toBeVisible({ timeout: 30000 });
    await expect(searchInput).toHaveValue('T shirt');
  }

  async validateSearchStatePersisted() {
    const searchInput = locators.searchInput(this.page).first();
    const matchingProducts = locators.matchingProducts(this.page);
    await expect(this.page).toHaveURL(/search=T%20shirt/i);
    await expect(searchInput).toHaveValue('T shirt');
    await expect(matchingProducts.first()).toBeVisible({ timeout: 30000 });
  }
}

module.exports = ProductsPage;
