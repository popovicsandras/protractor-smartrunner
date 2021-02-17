export interface TestResult {
    retries: number;
    passed: boolean;
    duration: number;
}

export interface TestResults {
    [testName: string]: TestResult;
}

export interface SuiteResults {
    [suiteName: string]: TestResults;
}
