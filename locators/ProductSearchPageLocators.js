module.exports = {
  productsLink: (page) => page.getByRole('link', { name: 'Products' }),
  searchInput: (page) => page.locator('#search_product'),
  searchButton: (page) => page.locator('#submit_search'),
  searchedProductsHeading: (page) => page.getByText('Searched Products', { exact: false }),
  firstViewProductLink: (page) => page.getByRole('link', { name: 'View Product' }),
  productTitle: (page, productTitle) => page.getByText(productTitle, { exact: false }),
  quantityInput: (page) => page.locator('#quantity'),
  addToCartButton: (page) => page.getByRole('button', { name: 'Add to cart' })
};
