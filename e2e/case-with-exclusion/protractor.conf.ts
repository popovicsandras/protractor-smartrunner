// @ts-check
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const retry = require('protractor-retry').retry;
const fs = require('fs-extra');
const resolve = require('path').resolve;
const getSmartRunnerFactory = require('../config/get-smart-runner-config-factory.js');

const smartRunnerDir = resolve(__dirname, '../..', '.protractor-smartrunner-case-with-exclusion');
const exclusionPath = resolve(__dirname, 'protractor.excludes.json');
const attemptsFile = resolve(smartRunnerDir, `${process.env.GIT_HASH}.json`);
let attempts = { count: 1 };
if (fs.existsSync(attemptsFile)) {
    attempts = fs.readJsonSync(attemptsFile);
}

const smartRunnerFactory = getSmartRunnerFactory(smartRunnerDir, exclusionPath);

exports.config = {
    allScriptsTimeout: 11000,
    specs: ['./src/**/*.spec.ts'],
    capabilities: {
        maxInstances: 5,
        shardTestFiles: true,

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
    // resultJsonOutputFile: '123456.json',

    params: {
        attemptCount: attempts.count
    },

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000,
        print: () => {},
        ...smartRunnerFactory.applyExclusionFilter(),
    },

    onPrepare() {
        retry.onPrepare();
        smartRunnerFactory.getInstance().onPrepare();

        require('ts-node').register({
            project: require('path').join(__dirname, './tsconfig.json')
        });
        jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: 'none' } }));
    },

    onCleanUp(results, files) {
        retry.onCleanUp(results);
    },

    afterLaunch() {
        attempts.count++;
        fs.outputJsonSync(attemptsFile, attempts);

        return retry.afterLaunch(3);
    }
};
