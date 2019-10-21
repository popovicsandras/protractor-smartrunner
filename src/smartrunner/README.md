# Protractor Smartrunner

Protractor utility for keeping track of passed/failed tests between runs. Works together with [protractor-retry](https://www.npmjs.com/package/protractor-retry).

This extension records the status (`passed` or `failed`) of every test run, and stores it in the filesystem.
After the first run, during every subsequent protractor execution, it only lets the failed tests to run, every previously passed tests will be skipped. 

This can be particularly handy and performant, if you happen to have flaky tests, or you know that some of your tests might have failed, not because of your changeset, but e.g.: lack, shortage or bug in the related BE services. This way, fixing the BE, you can rerun only those tests which failed.

Obviously, if you change something in your code (new changeset), it makes sense to rerun all of the tests, not just the previously failed ones. That is why, the **protractor-smartrunner** is bound to your codebase snapshot identifier (`repoHash`), which in case of git, make sense to be the hash of your current `HEAD`.

## Installation

```
npm install --save-dev protractor-smartrunner
```

## Prerequisites

The utility has one mandatory parameter: `repoHash`. This is the identifier of the codebase snapshot, e.g.: in case of git, it can be the HEAD's hash.
Before starting protractor, in case of Unix, you can export this variable to be accessible in the `protractor.conf.js` file.

```bash
export GIT_HASH=`git rev-parse HEAD`
```

## Usage

Add the following snippets to your protractor configuration file:

```js
const SmartRunner = require('protractor-smartrunner');

exports.config = {
    ...
    
    // Only works with jasmine
    framework: 'jasmine',
    
    onPrepare() {
        SmartRunner.apply({ repoHash: process.env.GIT_HASH });
    }

    ...
};
```

### Options

Smartrunner accepts the following configuration options:

```ts
interface SmartRunnerOptions {
    outputDirectory?: string;  // defaults to './.protractor-smartrunner'
    repoHash: string;
}
```

## Usage with protractor-retry

```js
const retry = require('protractor-retry').retry;
const SmartRunner = require('protractor-smartrunner');

exports.config = {
    
    ...

    // Only works with jasmine
    framework: 'jasmine',
    
    onPrepare() {
        retry.onPrepare();

        SmartRunner.apply({ repoHash: process.env.GIT_HASH });
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

## CI integration

The test results are stored in the following directory by default: `.protractor-smartrunner` (can be configured, see [options](#options)). To be able to store the results between test runs, you may need to cache this directory in your CI pipeline.

### Travis
With Tavis, you can do this with the cache option in your `.travis.yml` file:

```yml
cache:
  directories:
  - node_modules
  - .protractor-smartrunner
```
