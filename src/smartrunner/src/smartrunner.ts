import { SmartRunnerResults } from './smartrunner-results';
import { SmartRunnerReporter } from './smartrunner-reporter';
const fs = require('fs-extra');

export interface SmartRunnerOptions {
    outputDirectory?: string;
    repoHash: string;
}

const DEFAULT_OPTIONS = {
    outputDirectory: './.protractor-smartrunner',
};

export class SmartRunner {
    private results!: SmartRunnerResults;

    static apply(options: SmartRunnerOptions): SmartRunner {
        return new SmartRunner({ ...DEFAULT_OPTIONS, ...options });
    }

    static withOptionalExclusions(filePath: string) {
        const cliGrepped = process.argv.some((argument) => /^-g=/.test(argument) || /^--grep=/.test(argument));
        if (!cliGrepped && fs.existsSync(filePath)) {
            const exclusions = Object.keys(require(filePath));

            if (exclusions.length) {
                return {
                    grep: exclusions.join('|'),
                    invertGrep: true
                };
            }
        }

        return {};
    }

    private constructor(private options: Required<SmartRunnerOptions>) {
        this.results = new SmartRunnerResults(this.options.outputDirectory, this.options.repoHash);
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
            return !testPassedInPreviousRun && oldSpecFilter(spec);
        };
    }
}
