import { resolve } from 'path';
import { Logger } from 'protractor/built/logger';
const fs = require('fs-extra');
const filenamify = require('filenamify');

export interface TestResult {
    retries: number;
    passed: boolean;
    duration: number;
}

export interface TestResults {
    [ testName: string ]: TestResult;
}

export interface SuiteResults {
    [ suiteName: string ]: TestResults;
}

export interface SuiteUpdateFlags {
    [ suiteName: string ]: boolean;
}

export class SmartRunnerResults {

    private smartRunDir: string;
    private results!: SuiteResults;
    private affectedSuites: SuiteUpdateFlags;

    constructor(outputDirectory: string, repoHash: string, private logger: Logger) {
        this.affectedSuites = {};

        if (!repoHash?.length) {
            this.logger.error('🛑 ERROR: repoHash is not defined, terminating...');
            process.exit(1);
        }

        this.smartRunDir = resolve(outputDirectory, repoHash);
        fs.ensureDirSync(this.smartRunDir);
    }

    load() {
        this.results = fs.readdirSync(this.smartRunDir)
            .map((jsonFile: string) => fs.readJsonSync(resolve(this.smartRunDir, `./${jsonFile}`)))
            .reduce((accumulator: SuiteResults, currentValue: SuiteResults) => ({ ...accumulator, ...currentValue }), {});
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
