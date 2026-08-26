/**
 * Signup Page Object
 *
 * Covers: TC_002 - new user registration flow
 *
 * What it does:
 *   Navigates from the header "Signup / Login" link, submits the initial
 *   name/email signup form, fills the full account-information form with
 *   randomized data, and verifies the "Account Created!" confirmation.
 *
 * Locators: signup.locators.js
 * Step file: signup.step.js
 */

const { expect } = require('@playwright/test');
const locators = require('../locators/signup.locators');
const { getTimeouts } = require('../utils/configLoader');
const { logStep } = require('../utils/logger');

class SignupPage {
    constructor(page) {
        this.page = page;
        this.timeouts = getTimeouts();
    }

    /** Outcome: browser is on the /login page with the signup form visible. */
    async goToSignupLoginPage() {
        await locators.signupLoginNavLink(this.page).click();
        await expect(locators.newSignupNameInput(this.page)).toBeVisible({ timeout: this.timeouts.assertionMs });
        logStep('Navigated to the Signup/Login page.');
    }

    /** Outcome: submits the name/email signup form and lands on the account-information page. */
    async submitInitialSignup(name, email) {
        await locators.newSignupNameInput(this.page).fill(name);
        await locators.newSignupEmailInput(this.page).fill(email);
        await locators.newSignupButton(this.page).click();
        await expect(locators.accountInfoHeading(this.page)).toBeVisible({ timeout: this.timeouts.assertionMs });
        logStep(`Submitted initial signup for "${name}" and reached the account information form.`);
    }

    /** Outcome: fills and submits the account-information form; lands on the confirmation page. */
    async completeAccountInformation(data) {
        await locators.titleMr(this.page).check();
        await locators.nameInput(this.page).fill(data.name);
        await locators.passwordInput(this.page).fill(data.password);
        await locators.daysSelect(this.page).selectOption(data.day);
        await locators.monthsSelect(this.page).selectOption(data.month);
        await locators.yearsSelect(this.page).selectOption(data.year);

        await locators.firstNameInput(this.page).fill(data.firstName);
        await locators.lastNameInput(this.page).fill(data.lastName);
        await locators.address1Input(this.page).fill(data.address1);
        await locators.address2Input(this.page).fill(data.address2);
        await locators.countrySelect(this.page).selectOption(data.country);
        await locators.stateInput(this.page).fill(data.state);
        await locators.cityInput(this.page).fill(data.city);
        await locators.zipcodeInput(this.page).fill(data.zipcode);
        await locators.mobileNumberInput(this.page).fill(data.mobileNumber);

        await locators.createAccountButton(this.page).click();
        logStep('Filled the account information form and submitted account creation.');
    }

    /** Outcome: asserts the "Account Created!" confirmation is visible. */
    async verifyAccountCreated() {
        await expect(locators.accountCreatedHeading(this.page)).toBeVisible({ timeout: this.timeouts.assertionMs });
        await expect(locators.accountCreatedHeading(this.page)).toHaveText(/Account Created!/i);
        logStep('Verified the "Account Created!" confirmation is visible.');
    }

    /** Outcome: dismisses the confirmation and returns to the home page. */
    async clickContinue() {
        await locators.continueButton(this.page).click();
        logStep('Clicked Continue past the account created confirmation.');
    }

    /** Outcome: asserts the nav bar shows the user as logged in with the given name. */
    async verifyLoggedInAs(name) {
        const loggedInAs = locators.loggedInAsText(this.page);
        await expect(loggedInAs).toBeVisible({ timeout: this.timeouts.assertionMs });
        await expect(loggedInAs).toContainText(name);
        logStep(`Verified the nav bar shows "Logged in as ${name}".`);
    }

    /** Outcome: asserts the "Delete Account" nav link is visible. */
    async verifyDeleteAccountLinkVisible() {
        await expect(locators.deleteAccountLink(this.page)).toBeVisible({ timeout: this.timeouts.assertionMs });
        logStep('Verified the Delete Account nav link is visible.');
    }

    /** Outcome: logs the current user out and returns to a logged-out home page. */
    async logout() {
        await locators.logoutLink(this.page).click();
        await expect(locators.newSignupNameInput(this.page)).toBeVisible({ timeout: this.timeouts.assertionMs });
        logStep('Logged out and returned to the Signup/Login page.');
    }

    /** Outcome: submits the login form with the given credentials. */
    async loginWithCredentials(email, password) {
        await locators.loginEmailInput(this.page).fill(email);
        await locators.loginPasswordInput(this.page).fill(password);
        await locators.loginButton(this.page).click();
        // SECURITY_NOTE: never log the password, only the email used for the attempt.
        logStep(`Submitted login with email "${email}".`);
    }

    /** Outcome: asserts the "incorrect email or password" error is visible. */
    async verifyInvalidLoginErrorVisible() {
        await expect(locators.invalidLoginError(this.page)).toBeVisible({ timeout: this.timeouts.assertionMs });
        logStep('Verified the invalid login error message is visible.');
    }
}

module.exports = SignupPage;
