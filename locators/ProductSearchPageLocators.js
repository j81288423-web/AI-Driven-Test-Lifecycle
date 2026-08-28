module.exports = {
  productsLink: (page) => page.getByRole('link', { name: 'Products' }),
  searchInput: (page) => page.locator('#search_product'),
  submitSearchButton: (page) => page.locator('#submit_search'),
  searchedProductsHeading: (page) => page.getByText('Searched Products', { exact: false }),
};
