#!/usr/bin/env bash

npm run build
export GIT_HASH=`git rev-parse HEAD`
rm -rf "./.protractor-smartrunner-case-with-exclusion"
rm -rf "./.protractor-smartrunner-case-with-empty-exclusion"
lite-server --baseDir='./dist/testapp' -c ./lite-server.config.json >/dev/null & \
(npm run e2e:exclusion && npm run e2e:empty-exclusion) || exit 1
