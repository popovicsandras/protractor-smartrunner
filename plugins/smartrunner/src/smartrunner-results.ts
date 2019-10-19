import { resolve } from 'path';
const fs = require('fs-extra');
const filenamify = require('filenamify');

export interface TestResults {
    [ testName: string ]: boolean;
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

    constructor(outputDirectory: string, repoHash: string) {
        this.affectedSuites = {};
        this.smartRunDir = resolve(`${outputDirectory.replace(/\/*$/, '')}-${repoHash}`);
        fs.ensureDirSync(this.smartRunDir);
    }

    load() {
        this.results = fs.readdirSync(this.smartRunDir)
            .map((jsonFile: string) => fs.readJsonSync(resolve(this.smartRunDir, `./${jsonFile}`)))
            .reduce((accumulator: SuiteResults, currentValue: SuiteResults) => ({ ...accumulator, ...currentValue }), {});
    }

    set(suiteName: string, testName: string, passed: boolean) {
        if (!this.results[suiteName]) {
            this.results[suiteName] = {};
        }
        this.results[suiteName][testName] = passed;
        this.affectedSuites[suiteName] = true;
    }

    get(suiteName: string, testName: string): boolean {
        return this.results[suiteName] && this.results[suiteName][testName] || false;
    }

    save() {
        const updatedSuiteNames = Object.keys(this.affectedSuites);
        const suites = Object.keys(this.results);
        for (const suite of suites) {
            if (updatedSuiteNames.indexOf(suite) !== -1) {
                console.log(`Suite (${suite}) was affected by this thread, writing to filesystem.`);
                const fileName = resolve(this.smartRunDir, filenamify(`./${suite}.json`));
                fs.outputJsonSync(fileName, { [suite]: this.results[suite] });
            }
        }
    }
}
