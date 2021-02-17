const SmartRunnerFactory = require('protractor-smartrunner').SmartRunnerFactory;

function getSmartRunnerFactory(outputDirectory, exclusionPath) {
    return new SmartRunnerFactory({
        outputDirectory,
        repoHash: process.env.GIT_HASH,
        exclusionPath
    });
}

module.exports = getSmartRunnerFactory;
