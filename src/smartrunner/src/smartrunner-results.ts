import { resolve } from 'path';
import { Logger } from 'protractor/built/logger';
import { SuiteResults, TestResult } from './common.interfaces';
import { loadResults, getResultsOutputPath } from './helpers';
const fs = require('fs-extra');
const filenamify = require('filenamify');

export interface SuiteUpdateFlags {
    [suiteName: string]: boolean;
}

export class SmartRunnerResults {

    private smartRunDir: string;
    private results!: SuiteResults;
    private affectedSuites: SuiteUpdateFlags;

    constructor(outputDirectory: string, repoHash: string, private logger: Logger) {
        try {
            this.affectedSuites = {};
            this.smartRunDir = getResultsOutputPath(outputDirectory, repoHash);
            fs.ensureDirSync(this.smartRunDir);
        } catch (error) {
            this.logger.error(error.message);
            process.exit(1);
        }
    }

    load() {
        this.results = loadResults(this.smartRunDir);
    }

    set(suiteName: string, testName: string, passed: boolean, duration: number) {
        if (!this.results[suiteName]) {
            this.results[suiteName] = {};
        }
        this.results[suiteName][testName] = {
            retries: this.results?.[suiteName]?.[testName]?.retries + 1 || 0,
            passed,
            duration
        };
        this.affectedSuites[suiteName] = true;
    }

    get(suiteName: string, testName: string): TestResult {
        return this.results[suiteName] && this.results[suiteName][testName] || {};
    }

    save() {
        const updatedSuiteNames = Object.keys(this.affectedSuites);
        const suites = Object.keys(this.results);
        for (const suite of suites) {
            if (updatedSuiteNames.indexOf(suite) !== -1) {
                this.logger.info(`ℹ️  Suite (${suite}) was affected by this thread, writing to filesystem.`);
                const fileName = resolve(this.smartRunDir, filenamify(`./${suite}.json`));
                fs.outputJsonSync(fileName, { [suite]: this.results[suite] }, { spaces: 4 });
            }
        }
    }
}
