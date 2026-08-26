const fs = require('fs');
const path = require('path');
require('dotenv').config();

const appConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/app.config.json'), 'utf8'));
const environmentsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/environments.config.json'), 'utf8'));

function getActiveEnvName() {
    return process.env.TEST_ENV || environmentsConfig.defaultEnv;
}

function getActiveEnv() {
    const name = getActiveEnvName();
    const env = environmentsConfig.environments[name];
    if (!env) {
        throw new Error(`Unknown TEST_ENV "${name}". Valid values: ${Object.keys(environmentsConfig.environments).join(', ')}`);
    }
    return env;
}

/** Resolves the target base URL from the environment; never from committed config. */
function getBaseUrl() {
    const env = getActiveEnv();
    const raw = process.env[env.baseUrlEnvVar] || process.env.BASE_URL;
    if (!raw) {
        throw new Error(`Missing base URL. Set ${env.baseUrlEnvVar} (or BASE_URL) in .env - see .env.example.`);
    }

    // SECURITY_NOTE: reject non-HTTPS targets so traffic and any credentials stay TLS protected.
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:') {
        throw new Error(`Base URL must use https:// - received "${url.protocol}//".`);
    }
    return url.toString();
}

function getTimeouts() {
    return { ...appConfig.timeouts, ...(getActiveEnv().timeouts || {}) };
}

module.exports = { getActiveEnvName, getBaseUrl, getTimeouts, appConfig };
