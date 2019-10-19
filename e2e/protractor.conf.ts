// @ts-check
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const retry = require('protractor-retry').retry;
const SmartRunner = require('../plugins/smartrunner');

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

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000,
        print: () => {}
    },

    onPrepare() {
        SmartRunner.apply({
            repoHash: process.env.GIT_HASH
        });
        require('ts-node').register({
            project: require('path').join(__dirname, './tsconfig.json')
        });
        jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
        retry.onPrepare();
    },

    onCleanUp(results, files) {
        retry.onCleanUp(results);
    },

    afterLaunch() {
        return retry.afterLaunch(3);
    }
};
