import { SmartRunnerResults } from './smartrunner-results';
import { SmartRunnerReporter } from './smartrunner-reporter';
import { Logger } from 'protractor/built/logger';
import { isCliGrepped } from './helpers';

export interface SmartRunnerOptions {
    outputDirectory?: string;
    passedMessagePrefix?: string;
    repoHash: string;
    exclusionPath?: string | null;
}

export class SmartRunner {
    private results!: SmartRunnerResults;

    public constructor(private options: Required<SmartRunnerOptions>, private logger: Logger) {}

    onPrepare() {
        this.results = new SmartRunnerResults(this.options.outputDirectory, this.options.repoHash, this.logger);
        this.results.load();
        this.setupJasmine();
    }

    private setupJasmine() {
        const cliGrepped = isCliGrepped();
        jasmine.getEnv().addReporter(new SmartRunnerReporter(this.results));

        if (!cliGrepped) {
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
        } else {
            this.logger.warn(`Grep value has been passed as cli parameter, ignoring previous protractor smartrunner results (if exists).`);
        }
    }
}
