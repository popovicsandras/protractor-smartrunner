const fs = require('fs-extra');
import { resolve } from 'path';
import { SuiteResults } from './common.interfaces';

export function isCliGrepped() {
    return process.argv.some(
        (argument) => /^-g=/.test(argument) || /^--grep=/.test(argument)
    );
}

export function getExclusionGrep(filePath: string | null) {
    const exclusions = filePath?.length ? Object.keys(require(filePath)) : [''];
    return exclusions.join('|');
}

export function loadResults(resultsPath: string) {
    return fs.readdirSync(resultsPath)
        .map((jsonFile: string) =>
            fs.readJsonSync(resolve(resultsPath, `./${jsonFile}`))
        )
        .reduce(
            (accumulator: SuiteResults, currentValue: SuiteResults) => ({
                ...accumulator,
                ...currentValue,
            }), {});
}

export function getResultsOutputPath(outputDirectory: string, repoHash: string) {
    if (!outputDirectory?.length) {
        throw new Error('🛑 ERROR: outputDirectory is not defined!');
    }

    if (!repoHash?.length) {
        throw new Error('🛑 ERROR: repoHash is not defined!');
    }

    return resolve(outputDirectory, repoHash);
}
