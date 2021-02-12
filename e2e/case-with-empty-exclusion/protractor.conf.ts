// @ts-check
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const SmartRunner = require('../../src/smartrunner');
const resolve = require('path').resolve;

const smartRunnerDir = resolve(__dirname, '../..', '.protractor-smartrunner-case-with-empty-exclusion');

const specReporter = new SpecReporter({ spec: { displayStacktrace: 'none' } });
exports.config = {
    allScriptsTimeout: 11000,
    specs: ['./src/**/*.spec.ts'],
    capabilities: {
        browserName: 'chrome',
        chromeOptions: {
            binary: require('puppeteer').executablePath(),
            args: [
                '--headless',
                '--disable-gpu',
                '--window-size=800x600',
                '--disable-web-security',
                '--incognito'
            ]
        }
    },
    directConnect: true,
    baseUrl: 'http://localhost:4200/',
    framework: 'jasmine',

    params: {
        attemptCount: 1
    },

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000,
        print: () => {},
        ...SmartRunner.withOptionalExclusions(resolve(__dirname, 'protractor.excludes.json'))
    },

    onPrepare() {
        SmartRunner.apply({
            outputDirectory: smartRunnerDir,
            repoHash: process.env.GIT_HASH
        });
        require('ts-node').register({
            project: require('path').join(__dirname, './tsconfig.json')
        });
        jasmine.getEnv().addReporter(specReporter);
    },

    afterLaunch() {
        if (specReporter.metrics.totalSpecsDefined !== specReporter.metrics.executedSpecs + specReporter.metrics.skippedSpecs) {
            console.log(`Expected ${specReporter.metrics.totalSpecsDefined} specs to be run,
             but only ${specReporter.metrics.executedSpecs} have been run.`);
            process.exit(1);
        }
    }
};
