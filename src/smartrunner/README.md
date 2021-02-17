# Protractor Smartrunner

Protractor utility features for having more configuration over spec filtering, like:
1. [Keeping track of passed/failed tests between runs](#1-record-status-of-test-runs)
(works together with [protractor-retry](https://www.npmjs.com/package/protractor-retry) and [protractor-retry-angular-cli](https://www.npmjs.com/package/protractor-retry-angular-cli)).
2. [Having an exclusion file containing the name of temporary disabled specs.](#2-spec-exclusions)

## Warning

> ___
> This library only works for protractor configurations using the [jasmine framework](#usage)!!!
Mocha framework support is NOT planned at the moment. If it is needed by someone, then Pull Requests are more than welcome. :P 
> ___


## Installation

```
npm install --save-dev protractor-smartrunner
```

## Features 

### 1. Record status of test runs

This feature records the status of every test run, and stores it in the filesystem (in s directory specified in its configuration).

Every `passed` or `failed` test **(no pending or disabled!)** has the following status object stored in json files:
```json
{
    "suite-name": {
        "test-name": {
            // Number of test retries before is has passed, if passed at all
            "retries": 0,
            // Whether it has passed or not
            "passed": true,
            // In case if it is passed, what was the duration of the last (successful) execution
            "duration": 399 
        },
        ...
    },
    ...
}
```
After the first run, during every subsequent protractor execution, this feature only lets the failed tests to run, every previously passed tests will be skipped (and displayed with the `🟢 previously passed:` prefix, which is configurable, see the [options](#options)). 

This can be particularly handy and performant in CI environments, if you happen to have flaky tests, or you know that some of your tests might have failed, not because of your changeset, but e.g.: shortage of BE service or bug in the related BE service. This way, fixing the BE, you can rerun only those tests which failed.

Obviously, if you change something in your code (new changeset), it makes sense to rerun all of the tests, not just the previously failed ones. That is why, the **protractor-smartrunner** is bound to your codebase snapshot identifier (`repoHash`), which in case of git, make sense to be the hash of your current `HEAD`.

#### Prerequisites

The feature has one mandatory parameter: `repoHash`. This is the identifier of the codebase snapshot, e.g.: in case of git, it can be the HEAD's hash.
Before starting protractor, in case of Unix, you can export this variable to be accessible in the `protractor.conf.js` file.

```bash
export GIT_HASH=`git rev-parse HEAD`
```

#### Usage

Add the following snippets to your `protractor.conf.js` configuration file:

```js
const SmartRunnerFactory = require('protractor-smartrunner').SmartRunnerFactory;

const smartRunnerFactory = new SmartRunnerFactory({
    outputDirectory: '/absolute/path/to/where/you/want/to/store/the/results',
    repoHash: process.env.GIT_HASH
});

exports.config = {
    ...
    
    // Only works with jasmine
    framework: 'jasmine',
    
    onPrepare() {
        smartRunnerFactory.getInstance().onPrepare();
    }

    ...
};
```

##### Options

SmartRunnerFactory accepts the following configuration options:

```ts
interface SmartRunnerOptions {
    outputDirectory?: string;  // default: './.protractor-smartrunner'
    passedMessagePrefix?: string; // default: '🟢 previously passed:'
    excludedMessagePrefix?: string; // default: '🟠 excluded:'
    exclusionPath?: string | null; // default: null
    repoHash: string;
}
```

#### Usage with protractor-retry

```js
const retry = require('protractor-retry').retry;
const SmartRunnerFactory = require('protractor-smartrunner').SmartRunnerFactory;

const smartRunnerFactory = new SmartRunnerFactory({
    outputDirectory: '/absolute/path/to/where/you/want/to/store/the/results',
    repoHash: process.env.GIT_HASH
});

exports.config = {
    
    ...

    // Only works with jasmine
    framework: 'jasmine',
    
    onPrepare() {
        retry.onPrepare();
        smartRunnerFactory.getInstance().onPrepare();
    },

    onCleanUp(results, files) {
        retry.onCleanUp(results);
    },

    afterLaunch() {
        return retry.afterLaunch(3);
    }

    ...
};
```

#### CI integration

The test results are stored in the following directory by default: `./.protractor-smartrunner` (can be configured, see [options](#options)). To be able to store the results between test runs, you may need to cache this directory in your CI pipeline.

##### Travis
With Tavis, you can do this with Travis Workspace features. See the [.travis.yml]('https://github.com/popovicsandras/protractor-smartrunner/blob/master/.travis.yml') file for the details.

### 2. Spec exclusions

With this feature, one is able to list specs by their name in a separate file to exclude them. When there is a spec failure unrelated to the current changeset, it can be excluded this way, keeping track of the skipped tests in an isolated way and having this information in one place (compared to the `xit`-ed specs scattered accross the whole e2e codebase).

> ___
> This feature uses protractor's `jasmineNodeOpts.grep` and `jasmineNodeOpts.invertGrep: true` in the background. However if you run protractor with the `-g`/`--grep` cli arguments, those cli arguments takes precedence over what you have in the exclusion file.
> ___

The spec exclusion file is a one level deep json object, where the keys are the **grep** pattern to exclude, like this:

#### Exclusion file

```json
// Content of protractor.excludes.json (filename can be anything)
{
    "C123456": "A reason or other bug tracking system issue number",
    "C789012": "Another reason or other bug tracking system issue number"
}
```

For the functionality, the only important thing is the keys in the object. The value can be anything, which might be helpful for QA engineers to understand the reason why the test was excluded.

#### Adding configuration to protractor

```js
const SmartRunnerFactory = require('protractor-smartrunner').SmartRunnerFactory;

const smartRunnerFactory = new SmartRunnerFactory({
    outputDirectory: '/absolute/path/to/where/you/want/to/store/the/results',
    repoHash: process.env.GIT_HASH,
    exclusionPath: resolve(__dirname, 'protractor.excludes.json')
});


exports.config = {
    ...
    
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000,
        print: () => {},
        ...smartRunnerFactory.applyExclusionFilter()
    },

    ...
};
