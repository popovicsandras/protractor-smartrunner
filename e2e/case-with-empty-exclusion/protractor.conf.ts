// @ts-check
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const resolve = require('path').resolve;
const getSmartRunnerFactory = require('../config/get-smart-runner-config-factory.js');

const smartRunnerDir = resolve(__dirname, '../..', '.protractor-smartrunner-case-with-empty-exclusion');
const exclusionPath = resolve(__dirname, 'protractor.excludes.json');

const smartRunnerFactory = getSmartRunnerFactory(smartRunnerDir, exclusionPath);

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
                '--incognito',
                '--no-sandbox'
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
        ...smartRunnerFactory.applyExclusionFilter(),
    },

    onPrepare() {
        smartRunnerFactory.getInstance().onPrepare();
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
