module.exports = {
  linkByName: (page, name) => page.getByRole('link', { name }),
  searchInput: (page) => page.locator('#search_product'),
  searchButton: (page) => page.locator('#submit_search'),
  searchedProductsHeading: (page) => page.getByText('Searched Products', { exact: false })
};
