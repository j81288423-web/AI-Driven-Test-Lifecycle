/**
 * Signup Step Definitions (TC_002)
 */

const { When, Then } = require('@cucumber/cucumber');
const SignupPage = require('../pages/signup.page');
const { buildRegistrationData, buildInvalidCredentials } = require('../utils/testDataGenerator');

/** @type {InstanceType<typeof SignupPage>} */
let signupPage;

function getSignupPage(worldPage) {
    if (!signupPage || signupPage.page !== worldPage) {
        signupPage = new SignupPage(worldPage);
    }
    return signupPage;
}

When('the user navigates to the signup\\/login page', { timeout: 60000 }, async function () {
    await getSignupPage(this.page).goToSignupLoginPage();
});

When('the user registers a new account with random details', { timeout: 60000 }, async function () {
    this.registrationData = buildRegistrationData();
    await getSignupPage(this.page).submitInitialSignup(this.registrationData.name, this.registrationData.email);
    await getSignupPage(this.page).completeAccountInformation(this.registrationData);
});

Then('the account created confirmation should be visible', { timeout: 60000 }, async function () {
    await getSignupPage(this.page).verifyAccountCreated();
});

Then('the user continues past the account created confirmation', { timeout: 60000 }, async function () {
    await getSignupPage(this.page).clickContinue();
});

Then('the user should be logged in as the registered user', { timeout: 60000 }, async function () {
    await getSignupPage(this.page).verifyLoggedInAs(this.registrationData.name);
});

Then('the delete account link should be visible in the navigation', { timeout: 60000 }, async function () {
    await getSignupPage(this.page).verifyDeleteAccountLinkVisible();
});

When('the user logs out', { timeout: 60000 }, async function () {
    await getSignupPage(this.page).logout();
});

When('the user logs in with the registered account credentials', { timeout: 60000 }, async function () {
    await getSignupPage(this.page).loginWithCredentials(this.registrationData.email, this.registrationData.password);
});

When('the user logs in with incorrect credentials', { timeout: 60000 }, async function () {
    const invalidCredentials = buildInvalidCredentials();
    await getSignupPage(this.page).loginWithCredentials(invalidCredentials.email, invalidCredentials.password);
});

Then('the invalid login error message should be visible', { timeout: 60000 }, async function () {
    await getSignupPage(this.page).verifyInvalidLoginErrorVisible();
});
