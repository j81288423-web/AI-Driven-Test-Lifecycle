module.exports = {
  productsLink: (page) => page.getByRole('link', { name: 'Products' }),
  searchInput: (page) => page.locator('#search_product'),
  searchButton: (page) => page.locator('#submit_search'),
  searchedProductsHeading: (page) => page.getByText('Searched Products', { exact: false }),
  matchingProducts: (page) => page.locator('.productinfo p').filter({ hasText: /T SHIRT/i })
};
