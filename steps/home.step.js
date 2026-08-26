/**
 * Home Step Definitions (TC_001)
 */

const { Given, Then } = require('@cucumber/cucumber');
const HomePage = require('../pages/home.page');

/** @type {InstanceType<typeof HomePage>} */
let homePage;

function getHomePage(worldPage) {
    if (!homePage || homePage.page !== worldPage) {
        homePage = new HomePage(worldPage);
    }
    return homePage;
}

Given('the user navigates to the site', { timeout: 60000 }, async function () {
    await getHomePage(this.page).navigate();
});

Then('the home page logo should be visible', { timeout: 60000 }, async function () {
    await getHomePage(this.page).verifyLogoVisible();
});

Then('the home page main heading should be visible', { timeout: 60000 }, async function () {
    await getHomePage(this.page).verifyMainHeadingVisible();
});

Then('the home page navigation should show the Home link', { timeout: 60000 }, async function () {
    await getHomePage(this.page).verifyHomeNavLinkVisible();
});

Then('the features items section should be visible', { timeout: 60000 }, async function () {
    await getHomePage(this.page).verifyFeaturesItemsHeadingVisible();
});
