export interface TestResult {
    failures: number;
    runs: number;
    passed: boolean;
    duration: number;
}

export interface TestResults {
    [testName: string]: TestResult;
}

export interface SuiteResults {
    [suiteName: string]: TestResults;
}

export enum ERROR_CODES {
    NON_EXISTENT_EXCLUSION_FILE = 564,
    RESULTS_INIT_ERROR = 565
}
