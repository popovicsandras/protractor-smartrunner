import { Logger } from 'protractor/built/logger';
import { isCliGrepped, getExclusionGrep } from './helpers';
import { SmartRunnerOptions, SmartRunner } from './smartrunner';
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
    constructor(private options: SmartRunnerOptions) {
        this.logger = new Logger(LOGGER_ID);
    }

    public getInstance() {
        return new SmartRunner({ ...DEFAULT_OPTIONS, ...this.options }, this.logger);
    }

    public applyExclusionFilter() {
        const cliGrepped = isCliGrepped();

        if (!cliGrepped && this.options.exclusionPath) {
            const exclusionFileExists = fs.existsSync(this.options.exclusionPath);
            if (!exclusionFileExists) {
                this.logger.error(`🔴 Exclusion file doesn't exist: ${this.options.exclusionPath}`);
                process.exit(564);
            }

            const exclusions = getExclusionGrep(this.options.exclusionPath);

            if (exclusions.length) {
                this.logger.info('🚫 Exclusion patterns: ', exclusions.replace('|', ', '));
                return {
                    grep: exclusions,
                    invertGrep: true
                };
            }
        } else if (cliGrepped) {
            this.logger.warn(`🟠 Grep value has been passed as cli parameter, ignoring exclusion file`);
        }

        return {};
    }
}
