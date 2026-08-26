function hasCliFeaturePath(argv) {
    return (Array.isArray(argv) ? argv : []).some((arg) => /\.feature$/i.test(String(arg || '')));
}

const cliHasFeaturePath = hasCliFeaturePath(process.argv);

const defaultConfig = {
    requireModule: ['@babel/register'],
    require: ['support/**/*.js', 'steps/**/*.js'],
    format: ['progress'],
    formatOptions: { snippetInterface: 'async-await' }
};

// Only default the feature glob when the CLI did not pass an explicit .feature path.
if (!cliHasFeaturePath) {
    defaultConfig.paths = ['Features/*.feature'];
}

module.exports = { default: defaultConfig };
