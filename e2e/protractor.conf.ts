// @ts-check
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const retry = require('protractor-retry').retry;
const lazyRun = require('../plugins/lazyrun');

// const lazyRunner = new LazyRunner();

/**
 * @type { import("protractor").Config }
 */
exports.config = {
    allScriptsTimeout: 11000,
    specs: ['./src/**/*.spec.ts'],
    capabilities: {
        maxInstances: 5,
        shardTestFiles: true,

        browserName: 'chrome',
        chromeOptions: {
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
        print: function () { }
    },

    plugins: [
        lazyRun()
    ],

    beforeLaunch() {
        // lazyRunner.init();
        /*tslint:disable-next-line*/
        console.log('global beforeLaunch');
    },

    onPrepare() {
        require('ts-node').register({
            project: require('path').join(__dirname, './tsconfig.json')
        });
        jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
        // retry.onPrepare();
        /*tslint:disable-next-line*/
        console.log('globalPrepare');
    },

    onCleanUp(results) {
        // lazyRunner.getPlugin()
        // retry.onCleanUp(results);
    },

    afterLaunch() {
        lazyRunner.tearDown();
        // return retry.afterLaunch(3);
    }
};
