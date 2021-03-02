import { resolve } from 'path';

export function isCliGrepped() {
    return process.argv.some(
        (argument) => /^-g=/.test(argument) || /^--grep=/.test(argument)
    );
}

export function getExclusions(filePath: string | null) {
    return filePath?.length ? Object.keys(require(filePath)) : [''];
}

export function getExclusionGrep(filePath: string | null) {
    return getExclusions(filePath).join('|');
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
