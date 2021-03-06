// @ts-check
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const retry = require('protractor-retry').retry;
const SmartRunner = require('../../src/smartrunner');
const fs = require('fs-extra');
const resolve = require('path').resolve;

const smartRunnerDir = resolve(__dirname, '../..', '.protractor-smartrunner-case-with-exclusion');
const attemptsFile = resolve(smartRunnerDir, `${process.env.GIT_HASH}.json`);
let attempts = { count: 1 };
if (fs.existsSync(attemptsFile)) {
    attempts = fs.readJsonSync(attemptsFile);
}

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
                '--incognito',
                '--no-sandbox'
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
        ...SmartRunner.withOptionalExclusions(resolve(__dirname, 'protractor.excludes.json'))
    },

    onPrepare() {
        retry.onPrepare();

        SmartRunner.apply({
            outputDirectory: smartRunnerDir,
            repoHash: process.env.GIT_HASH
        });
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
