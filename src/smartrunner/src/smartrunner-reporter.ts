import { SmartRunnerResults } from './smartrunner-results';

export class SmartRunnerReporter {

    private startTime: Date;

    constructor(private results: SmartRunnerResults) {
        this.startTime = new Date();
    }

    jasmineStarted(suiteInfo: any) {
        this.startTime = new Date();
    }

    suiteStarted(result: any) {
    }

    specStarted(result: any) {
        this.startTime = new Date();
    }

    specDone(result: any) {
        const duration = new Date().getTime() - this.startTime.getTime();
        const specName = result.description;
        const suiteName = result.fullName.replace(specName, '').trim();
        if (result.status !== 'disabled' && result.status !== 'pending') {
            this.results.set(suiteName, specName, result.status === 'passed', duration);
        }
    }

    suiteDone(result: any) {
    }

    jasmineDone() {
        this.results.save();
    }
}
