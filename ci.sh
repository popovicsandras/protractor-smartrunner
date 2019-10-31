#!/usr/bin/env bash

npm run build
npm run build:plugin
export GIT_HASH=`git rev-parse HEAD`
rm -rf "./.protractor-smartrunner-case-with-exclusion"
rm -rf "./.protractor-smartrunner-case-with-empty-exclusion"
lite-server --baseDir='./dist/testapp' -c ./lite-server.config.json >/dev/null & npm run e2e || exit 1
