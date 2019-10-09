import { ProtractorPlugin } from 'protractor';
import { resolve } from 'path';
const fs = require('fs-extra');
const lazyRunDir = resolve(process.cwd(), './.protractor-lazy-run');

export interface TestResults {
    [ testName: string ]: boolean;
}

export interface SuiteResults {
    [ suiteName: string ]: TestResults;
}

function lazyRun(): { inline: ProtractorPlugin } {
    fs.ensureDirSync(lazyRunDir);
    const results: SuiteResults = fs.readdirSync(lazyRunDir)
        .map((jsonFile: string) => fs.readJsonSync(resolve(lazyRunDir, `./${jsonFile}`)))
        .reduce((accumulator: SuiteResults, currentValue: SuiteResults) => ({ ...accumulator, ...currentValue }), {});

    return {
        inline: {
            onPrepare() {
                /*tslint:disable-next-line*/
                console.log('onPrepare');
                jasmine.getEnv().specFilter = (spec) => {
                    const specName = spec.getResult().description;
                    const suiteName = spec.getFullName().replace(specName, '').trim();

                    const testPassedInPreviousRun = results[suiteName] && results[suiteName][specName] || false;
                    return !testPassedInPreviousRun;
                };
            },

            postTest(passed: boolean, testInfo: any) {
                if (!results[testInfo.category]) {
                    results[testInfo.category] = {};
                }
                results[testInfo.category][testInfo.name] = passed;
            },

            postResults() {
                const suites = Object.keys(results);
                for (const suite of suites) {
                    const fileName = resolve(lazyRunDir, `./${suite}.json`);
                    fs.outputJsonSync(fileName, results);
                }
            }
        }
    };
}

module.exports = lazyRun;

