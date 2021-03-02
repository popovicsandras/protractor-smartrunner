const fs = require('fs-extra');
import { resolve } from 'path';
import { SuiteResults, TestResults } from './common.interfaces';

export class BackupError extends Error {
    public type = 'backup-error';
}

export function backupResults(resultsPath: string) {
    if (!fs.existsSync(resultsPath)) {
        throw new BackupError(`Folder does not exist: ${resultsPath}`);
    }

    if (!fs.lstatSync(resultsPath).isDirectory() ) {
        throw new BackupError(`Provided path is not a folder: ${resultsPath}`);
    }

    const results = loadResults(resultsPath);
    fs.outputJsonSync(getBackupFileName(resultsPath), results, { spaces: 4 });
    return results;
}

export function loadResults(resultsPath: string): SuiteResults {
    if (!fs.existsSync(resultsPath)) {
        throw new Error(`Folder does not exist: ${resultsPath}`);
    }

    return fs.readdirSync(resultsPath)
        .filter((jsonFile: string) => /\.json$/.test(jsonFile))
        .map((jsonFile: string) => fs.readJsonSync(resolve(resultsPath, `./${jsonFile}`)) )
        .reduce(
            (accumulator: SuiteResults, currentValue: SuiteResults) => ({
                ...accumulator,
                ...currentValue,
            }), {});
}

export function calculateDiff(resultsPath: string) {

    const backupFile = getBackupFileName(resultsPath);
    const latestResults = loadResults(resultsPath);

    if (!fs.existsSync(backupFile)) {
        console.log(`ℹ️  No backup file (${backupFile}) found, returning the latest result set without calculating difference.`);
        return latestResults;
    }

    const previousResults: SuiteResults = fs.readJsonSync(backupFile);
    return calculateDiffForSuites(previousResults, latestResults);
}

function calculateDiffForSuites(previousRun: SuiteResults, lastRun: SuiteResults) {
    const suiteNames = Object.keys(previousRun);

    return suiteNames
        .map(suiteName => ({ suiteName, results: calculateDiffForTests(previousRun[suiteName], lastRun[suiteName]) }))
        .reduce((accumulator, current) => ({
            ...accumulator,
            ...(Object.keys(current.results).length ? { [current.suiteName]: current.results } : {})
        }), {});
}

function calculateDiffForTests(previousRun: TestResults, lastRun: TestResults) {
    return Object.keys(previousRun)
        .filter( testName => !previousRun[testName].passed && (lastRun?.[testName]?.retries - previousRun[testName].retries > 0) )
        .map(testName => ({
            testName,
            results: {
                retries: lastRun[testName].retries - previousRun[testName].retries,
                passed: lastRun[testName].passed,
                duration: lastRun[testName].duration
            }
        }))
        .reduce((accumulator, current) => ({ ...accumulator, [current.testName]: current.results }), {});
}

function getBackupFileName(resultsPath: string) {
    return `${resultsPath}.bak.json`;
}
