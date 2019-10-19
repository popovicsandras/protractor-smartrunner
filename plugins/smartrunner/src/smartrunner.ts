import { SmartRunnerResults } from './smartrunner-results';
import { SmartRunnerReporter } from './smartrunner-reporter';

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

    private constructor(private options: Required<SmartRunnerOptions>) {
        this.results = new SmartRunnerResults(this.options.outputDirectory, this.options.repoHash);
        this.results.load();
        this.setupJasmine();
    }

    private setupJasmine() {
        jasmine.getEnv().addReporter(new SmartRunnerReporter(this.results));
        jasmine.getEnv().specFilter = (spec) => {
            const testName = spec.getResult().description;
            const suiteName = spec.getFullName().replace(testName, '').trim();

            const testPassedInPreviousRun = this.results.get(suiteName, testName);
            return !testPassedInPreviousRun;
        };
    }
}
