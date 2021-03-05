import { resolve } from 'path';
import { Logger } from 'protractor/built/logger';
import { SuiteResults, TestResult, ERROR_CODES } from './common.interfaces';
import { loadResults } from './fs-helpers';
import { getResultsOutputPath } from './helpers';
const fs = require('fs-extra');
const filenamify = require('filenamify');

export interface SuiteUpdateFlags {
    [suiteName: string]: boolean;
}

export class SmartRunnerResults {

    private smartRunDir: string;
    private results!: SuiteResults;
    private affectedSuites: SuiteUpdateFlags;

    constructor(
        outputDirectory: string,
        repoHash: string,
        private logger: Logger,
        affectedSuites: { [key: string ]: boolean } = {},
        results: SuiteResults = {}
    ) {
        try {
            this.affectedSuites = affectedSuites;
            this.results = results;
            this.smartRunDir = getResultsOutputPath(outputDirectory, repoHash);
        } catch (error) {
            this.logger.error(error.message);
            process.exit(ERROR_CODES.RESULTS_INIT_ERROR);
        }
    }

    load() {
        fs.ensureDirSync(this.smartRunDir);
        this.results = loadResults(this.smartRunDir);
    }

    set(suiteName: string, testName: string, passed: boolean, duration: number) {
        const failuresIncreasement = passed ? 0 : 1;

        if (!this.results[suiteName]) {
            this.results[suiteName] = {};
        }
        this.results[suiteName][testName] = {
            failures: (this.results?.[suiteName]?.[testName]?.failures || 0) + failuresIncreasement,
            runs: this.results?.[suiteName]?.[testName]?.runs + 1 || 1,
            passed,
            duration
        };
        this.affectedSuites[suiteName] = true;
    }

    get(suiteName: string, testName: string): TestResult {
        return this.results[suiteName] && this.results[suiteName][testName];
    }

    isSuitePristine(suiteName: string) {
        const updatedSuiteNames = Object.keys(this.affectedSuites);
        return updatedSuiteNames.indexOf(suiteName) === -1;
    }

    save() {
        for (const suite of Object.keys(this.results)) {
            if (!this.isSuitePristine(suite)) {
                this.logger.info(`ℹ️  Suite (${suite}) was affected by this thread, writing to filesystem.`);
                const suiteFileName = filenamify(suite.replace(/\s/g, '').toLowerCase(), { maxLength: 250 }) + '.json';
                const fileName = resolve(this.smartRunDir, suiteFileName);
                fs.outputJsonSync(fileName, { [suite]: this.results[suite] }, { spaces: 4 });
            }
        }
    }
}
