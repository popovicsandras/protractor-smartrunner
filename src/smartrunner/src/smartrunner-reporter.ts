import { SmartRunnerResults } from './smartrunner-results';

export class SmartRunnerReporter {

    constructor(private results: SmartRunnerResults) {}

    jasmineStarted(suiteInfo: any) {
    }

    suiteStarted(result: any) {
    }

    specDone(result: any) {
        const specName = result.description;
        const suiteName = result.fullName.replace(specName, '').trim();
        if (result.status !== 'disabled') {
            this.results.set(suiteName, specName, result.status === 'passed' || result.status === 'pending');
        }
    }

    suiteDone(result: any) {
    }

    jasmineDone() {
        this.results.save();
    }
}
