module.exports = {
    signupLoginNavLink: (page) => page.locator('a[href="/login"]', { hasText: 'Signup / Login' }),

    // Initial "New User Signup!" form on the login page
    newSignupNameInput: (page) => page.locator('[data-qa="signup-name"]'),
    newSignupEmailInput: (page) => page.locator('[data-qa="signup-email"]'),
    newSignupButton: (page) => page.locator('[data-qa="signup-button"]'),

    // "Enter Account Information" form
    accountInfoHeading: (page) => page.getByText('Enter Account Information'),
    titleMr: (page) => page.locator('#id_gender1'),
    nameInput: (page) => page.locator('#name'),
    passwordInput: (page) => page.locator('[data-qa="password"]'),
    daysSelect: (page) => page.locator('#days'),
    monthsSelect: (page) => page.locator('#months'),
    yearsSelect: (page) => page.locator('#years'),
    firstNameInput: (page) => page.locator('#first_name'),
    lastNameInput: (page) => page.locator('#last_name'),
    companyInput: (page) => page.locator('#company'),
    address1Input: (page) => page.locator('#address1'),
    address2Input: (page) => page.locator('#address2'),
    countrySelect: (page) => page.locator('#country'),
    stateInput: (page) => page.locator('#state'),
    cityInput: (page) => page.locator('#city'),
    zipcodeInput: (page) => page.locator('#zipcode'),
    mobileNumberInput: (page) => page.locator('#mobile_number'),
    createAccountButton: (page) => page.locator('[data-qa="create-account"]'),

    // Account created confirmation page
    accountCreatedHeading: (page) => page.locator('[data-qa="account-created"]'),
    continueButton: (page) => page.locator('[data-qa="continue-button"]'),

    // Post-login navigation state
    loggedInAsText: (page) => page.locator('a', { hasText: /Logged in as/i }),
    deleteAccountLink: (page) => page.locator('a[href="/delete_account"]'),
    logoutLink: (page) => page.locator('a[href="/logout"]'),

    // "Login to your account" form
    loginEmailInput: (page) => page.locator('[data-qa="login-email"]'),
    loginPasswordInput: (page) => page.locator('[data-qa="login-password"]'),
    loginButton: (page) => page.locator('[data-qa="login-button"]'),
    invalidLoginError: (page) => page.getByText('Your email or password is incorrect!'),
};
