/**
 * Test data generator for the account-registration scenario.
 *
 * Uses crypto.randomInt (CSPRNG) instead of Math.random so generated
 * suffixes/passwords are not predictable across test runs.
 */
const crypto = require('crypto');

/** Returns a 4-digit numeric string (1000-9999) used to avoid duplicate-user collisions. */
function randomFourDigitSuffix() {
    return String(crypto.randomInt(1000, 10000));
}

/** Builds a fresh, unique registration payload for the signup + account-info forms. */
function buildRegistrationData() {
    const suffix = randomFourDigitSuffix();
    return {
        name: `TestUser${suffix}`,
        email: `testuser${suffix}${Date.now()}@example.com`,
        // SECURITY_NOTE: generated per-run via CSPRNG, never hardcoded or logged.
        password: `Pwd${randomFourDigitSuffix()}!aA`,
        firstName: `First${suffix}`,
        lastName: `Last${suffix}`,
        address1: `${suffix} Test Street`,
        address2: `Apt ${suffix}`,
        state: `TestState${suffix}`,
        city: `TestCity${suffix}`,
        zipcode: suffix,
        mobileNumber: `9${suffix}${randomFourDigitSuffix()}`,
        day: '10',
        month: '5',
        year: '1995',
        country: 'India',
    };
}

/** Builds random, never-registered credentials for negative login tests. */
function buildInvalidCredentials() {
    const suffix = randomFourDigitSuffix();
    return {
        email: `nouser${suffix}${Date.now()}@example.com`,
        // SECURITY_NOTE: generated per-run via CSPRNG, never hardcoded or logged.
        password: `Wrong${randomFourDigitSuffix()}!zZ`,
    };
}

module.exports = { randomFourDigitSuffix, buildRegistrationData, buildInvalidCredentials };
