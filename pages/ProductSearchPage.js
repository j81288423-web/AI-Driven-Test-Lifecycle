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

  async fillSearchKeyword(keyword) {
    const searchInput = locators.searchInput(this.page).first();
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    await searchInput.fill(keyword);
    await this.page.waitForTimeout(3000);
  }

  async clickSubmitSearchButton() {
    const submitSearchButton = locators.submitSearchButton(this.page).first();
    await expect(submitSearchButton).toBeVisible({ timeout: 30000 });
    await submitSearchButton.click({ force: true });
    await this.page.waitForLoadState('load');
  }

  async validateSearchedProductsHeadingVisible() {
    const searchedProductsHeading = locators.searchedProductsHeading(this.page).first();
    await expect(searchedProductsHeading).toBeVisible({ timeout: 30000 });
  }

  async validateSearchResultsContainMatchingProducts() {
    const pageText = await this.page.locator('body').textContent();
    expect(
      pageText.includes('T-Shirt') ||
      pageText.includes('T-shirt') ||
      pageText.includes('Premium Polo T-Shirts') ||
      pageText.includes('Pure Cotton V-Neck T-Shirt') ||
      pageText.includes('Green Side Placket Detail T-Shirt')
    ).toBeTruthy();
  }
}

module.exports = ProductSearchPage;
