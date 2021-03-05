import { Logger } from 'protractor/built/logger';
import { isCliGrepped, getExclusionGrep, getExclusions, getResultsOutputPath } from './helpers';
import { SmartRunnerOptions, SmartRunner } from './smartrunner';
import { ERROR_CODES } from './common.interfaces';
const fs = require('fs-extra');

const LOGGER_ID = 'smartrunner';
const DEFAULT_OPTIONS = {
    outputDirectory: './.protractor-smartrunner',
    passedMessagePrefix: '🟢 previously passed:',
    excludedMessagePrefix: '🟠 excluded:',
    exclusionPath: null
};

export class SmartRunnerFactory {
    private logger: Logger;
    constructor(private providedOptions: SmartRunnerOptions) {
        this.logger = new Logger(LOGGER_ID);
    }

    public getInstance() {
        return new SmartRunner(this.options, this.logger);
    }

    public applyExclusionFilter() {
        const cliGrepped = isCliGrepped();

        if (!cliGrepped && this.options.exclusionPath) {
            const exclusionFileExists = fs.existsSync(this.options.exclusionPath);
            if (!exclusionFileExists) {
                this.logger.error(`🔴 Exclusion file doesn't exist: ${this.options.exclusionPath}`);
                process.exit(ERROR_CODES.NON_EXISTENT_EXCLUSION_FILE);
            }

            const exclusions = getExclusions(this.options.exclusionPath);
            const grep = getExclusionGrep(this.options.exclusionPath);

            if (exclusions.length) {
                this.logger.info('🚫 Exclusion patterns: ', exclusions.join(', '));
                return { grep, invertGrep: true };
            }
        } else if (cliGrepped) {
            this.logger.warn(`🟠 Grep value has been passed as cli parameter, ignoring exclusion file`);
        }

        return {};
    }

    public getResultsOutputPath(): string {
        return getResultsOutputPath(this.options.outputDirectory, this.options.repoHash);
    }

    public get options() {
        return { ...DEFAULT_OPTIONS, ...this.providedOptions };
    }
}
