import { SmartRunnerResults } from './smartrunner-results';
import { SmartRunnerReporter } from './smartrunner-reporter';
import { Logger } from 'protractor/built/logger';
const fs = require('fs-extra');

export interface SmartRunnerOptions {
    outputDirectory?: string;
    passedMessagePrefix?: string;
    repoHash: string;
}

const LOGGER_ID = 'smartrunner';
const DEFAULT_OPTIONS = {
    outputDirectory: './.protractor-smartrunner',
    passedMessagePrefix: '🟢 previously passed:'
};

export class SmartRunner {
    private results!: SmartRunnerResults;
    private logger: Logger;

    static apply(options: SmartRunnerOptions): SmartRunner {
        return new SmartRunner({ ...DEFAULT_OPTIONS, ...options });
    }

    static withOptionalExclusions(filePath: string) {
        const logger = new Logger(LOGGER_ID);
        const cliGrepped = process.argv.some((argument) => /^-g=/.test(argument) || /^--grep=/.test(argument));
        if (!cliGrepped && fs.existsSync(filePath)) {
            const exclusions = Object.keys(require(filePath));

            if (exclusions.length) {
                logger.info('🚫 Exclusion patterns: ', exclusions.join(', '));
                return {
                    grep: exclusions.join('|'),
                    invertGrep: true
                };
            }
        }

        return {};
    }

    private constructor(private options: Required<SmartRunnerOptions>) {
        this.logger = new Logger(LOGGER_ID);
        this.results = new SmartRunnerResults(this.options.outputDirectory, this.options.repoHash, this.logger);
        this.results.load();
        this.setupJasmine();
    }

    private setupJasmine() {
        jasmine.getEnv().addReporter(new SmartRunnerReporter(this.results));
        const oldSpecFilter = jasmine.getEnv().specFilter;

        jasmine.getEnv().specFilter = (spec) => {
            const testName = spec.getResult().description;
            const suiteName = spec.getFullName().replace(testName, '').trim();

            const testPassedInPreviousRun = this.results.get(suiteName, testName);
            if (testPassedInPreviousRun.passed) {
                this.logger.info(`${this.options.passedMessagePrefix} ${suiteName} ${testName}`);
            }

            return !testPassedInPreviousRun.passed && oldSpecFilter(spec);
        };
    }
}
