import { SmartRunnerResults } from './smartrunner-results';
import { SmartRunnerReporter } from './smartrunner-reporter';

export interface SmartRunnerOptions {
    id: number | string;
    resultsDir: string;
}

const DEFAULT_OPTIONS: SmartRunnerOptions = {
    id: 1,
    resultsDir: './.protractor-smartrunner'
};

export class SmartRunner {
    private results!: SmartRunnerResults;

    static apply(options: SmartRunnerOptions = { ...DEFAULT_OPTIONS  }): SmartRunner {
        return new SmartRunner(options);
    }

    private constructor(private options: SmartRunnerOptions) {
        this.results = new SmartRunnerResults(this.options.id, this.options.resultsDir);
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
