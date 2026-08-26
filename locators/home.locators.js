module.exports = {
    logo: (page) => page.getByRole('img', { name: /Website for automation practice/i }).first(),
    mainHeading: (page) => page.getByRole('heading', { level: 1 }).first(),
    homeNavLink: (page) => page.locator('a[href="/"]', { hasText: 'Home' }),
    featuresItemsHeading: (page) => page.getByRole('heading', { name: 'Features Items' }),
};
