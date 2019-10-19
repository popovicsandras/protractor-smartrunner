#!/usr/bin/env bash

npm run build
npm run build:plugin
./node_modules/lite-server/bin/lite-server --baseDir='./dist/testapp' -c ./lite-server.config.json >/dev/null & ./node_modules/protractor/bin/protractor ./e2e/protractor.conf.ts || exit 1
