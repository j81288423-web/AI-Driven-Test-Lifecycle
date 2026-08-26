/** Minimal step logger so test runs print a readable trail of actions on stdout. */
function logStep(message) {
    console.log(`[STEP] ${message}`);
}

module.exports = { logStep };
