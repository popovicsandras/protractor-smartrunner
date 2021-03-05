const fs = require('fs-extra');
const mock = require('mock-fs');
import { loadResults, backupResults, calculateDiff, BackupError } from './fs-helpers';
import { SuiteResults } from './common.interfaces';

describe('helpers', () => {
    const suite1Results: SuiteResults = {
        suite1: {
            test1: { failures: 0, runs: 1, passed: true, duration: 123 },
            test2: { failures: 1, runs: 2, passed: true, duration: 456 },
            test3: { failures: 2, runs: 2, passed: false, duration: 789 },
        }
    };

    const suite2Results: SuiteResults = {
        suite2: {
            test1: { failures: 0, runs: 1, passed: true, duration: 123 },
            test2: { failures: 1, runs: 1, passed: false, duration: 456 },
        }
    };

    const suite3ResultsInTextFile: SuiteResults = {
        suite3: {
            test1: { failures: 0, runs: 1, passed: true, duration: 123 },
        }
    };

    afterEach(() => {
        mock.restore();
    });

    describe('loadResults', () => {
        beforeEach(() => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify(suite1Results),
                    'file2.json': JSON.stringify(suite2Results),
                    'file3.txt': JSON.stringify(suite3ResultsInTextFile)
                },
                './file0.json': JSON.stringify({})
            });
        });

        test('should throw an error if the provided path does not exist', () => {
            expect(() => {
                loadResults('./.test-protractor-smartrunner/123456-does-not-exist');
            }).toThrow(`Folder does not exist: ./.test-protractor-smartrunner/123456-does-not-exist`);
        });

        test('should NOT throw an error if the provided path exists', () => {
            expect(() => {
                loadResults('./.test-protractor-smartrunner/123456');
            }).not.toThrow();
        });

        test('should load and merge every JSON file into the results object', () => {
            const results = loadResults('./.test-protractor-smartrunner/123456');
            expect(results).toEqual({...suite1Results, ...suite2Results});
        });
    });

    describe('backupResults', () => {

        beforeEach(() => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify(suite1Results),
                    'file2.json': JSON.stringify(suite2Results),
                    'file3.txt': JSON.stringify(suite3ResultsInTextFile)
                },
                './file0.json': JSON.stringify({})
            });
        });

        test('should throw the right type of error', () => {
            try {
                backupResults('./.test-protractor-smartrunner/123456-does-not-exist');
            } catch (error) {
                expect(error.type).toBe('backup-error');
                expect(error).toBeInstanceOf(BackupError);
                return;
            }
            expect(false).toBe(true);
        });

        test('should throw an error with the right message if the path does not exist', () => {
            expect(() => {
                backupResults('./.test-protractor-smartrunner/123456-does-not-exist');
            }).toThrow(new BackupError(`Folder does not exist: ./.test-protractor-smartrunner/123456-does-not-exist`));
        });

        test('should throw an error with the right message if the path is not a folder', () => {
            expect(() => {
                backupResults('./file0.json');
            }).toThrow(new BackupError(`Provided path is not a folder: ./file0.json`));
        });

        test('should NOT throw an error if the folder exists', () => {
            expect(() => {
                backupResults('./.test-protractor-smartrunner/123456');
            }).not.toThrow();
        });

        test('should create .bak.json file with the same name as the provided directory', () => {
            backupResults('./.test-protractor-smartrunner/123456');
            expect(() => fs.readJsonSync('./.test-protractor-smartrunner/123456.bak.json')).not.toThrow();
        });

        test('should create a merged json file of folder contents', () => {
            backupResults('./.test-protractor-smartrunner/123456');
            const results = fs.readJsonSync('./.test-protractor-smartrunner/123456.bak.json');
            expect(results).toEqual({...suite1Results, ...suite2Results});
        });
    });

    describe('calculateDiff', () => {

        test('should return the lastly added results if no backup has been created yet', () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify(suite1Results),
                    'file2.json': JSON.stringify(suite2Results),
                }
            });
            const results = calculateDiff('./.test-protractor-smartrunner/123456');
            expect(results).toEqual({...suite1Results, ...suite2Results});
            expect(consoleLogSpy).toHaveBeenCalledWith('ℹ️  No backup file (./.test-protractor-smartrunner/123456.bak.json) found, returning the latest result set without calculating difference.');

            consoleLogSpy.mockRestore();
        });

        test('should return empty object if no change has been done', () => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify({
                        suite1: {
                            test1: { failures: 0, runs: 1, passed: true, duration: 123 },
                            test2: { failures: 0, runs: 1, passed: true, duration: 123 }
                        }
                    } as SuiteResults),
                    'file2.json': JSON.stringify({
                        suite2: {
                            test1: { failures: 0, runs: 1, passed: true, duration: 123 }
                        }
                    } as SuiteResults)
                },
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { failures: 0, runs: 1, passed: true, duration: 123 },
                        test2: { failures: 0, runs: 1, passed: true, duration: 123 }
                    },
                    suite2: {
                        test1: { failures: 0, runs: 1, passed: true, duration: 123 }
                    }
                } as SuiteResults)
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({} as SuiteResults);
        });

        test('should return only the previously failed ones with the correct failures\' differences', () => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify({
                        suite1: {
                            test1: { failures: 5, runs: 6, passed: true, duration: 123 },
                            test2: { failures: 5, runs: 5, passed: false, duration: 123 }
                        }
                    } as SuiteResults),
                    'file2.json': JSON.stringify({
                        suite2: {
                            test1: { failures: 5, runs: 6, passed: true, duration: 123 },
                        }
                    } as SuiteResults),
                    'file3.json': JSON.stringify({
                        suite3: {
                            test1: { failures: 2, runs: 3, passed: true, duration: 123 },
                            test2: { failures: 3, runs: 4, passed: true, duration: 456 },
                            test3: { failures: 4, runs: 5, passed: true, duration: 123 },
                        }
                    } as SuiteResults)
                },
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { failures: 2, runs: 2, passed: false, duration: 123 },
                        test2: { failures: 1, runs: 1, passed: false, duration: 123 }
                    },
                    suite2: {
                        test1: { failures: 2, runs: 2, passed: false, duration: 123 },
                    },
                    suite3: {
                        test1: { failures: 2, runs: 3, passed: true, duration: 123 },
                        test2: { failures: 3, runs: 3, passed: false, duration: 123 },
                        test3: { failures: 3, runs: 3, passed: false, duration: 123 },
                    }
                } as SuiteResults)
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({
                suite1: {
                    test1: { failures: 3, runs: 4, passed: true, duration: 123 },
                    test2: { failures: 4, runs: 4, passed: false, duration: 123 }
                },
                suite2: {
                    test1: { failures: 3, runs: 4, passed: true, duration: 123 }
                },
                suite3: {
                    test2: { failures: 0, runs: 1, passed: true, duration: 456 },
                    test3: { failures: 1, runs: 2, passed: true, duration: 123 },
                }
            } as SuiteResults);
        });

        test('should return the previously failed ones if for the lastRun they became passed (with only runs increased)', () => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify({
                        suite1: {
                            test1: { failures: 2, runs: 3, passed: true, duration: 123 },
                            test2: { failures: 2, runs: 3, passed: true, duration: 123 }
                        }
                    } as SuiteResults),
                    'file2.json': JSON.stringify({
                        suite2: {
                            test1: { failures: 2, runs: 3, passed: true, duration: 123 }
                        }
                    } as SuiteResults)
                },
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { failures: 2, runs: 2, passed: false, duration: 123 },
                        test2: { failures: 2, runs: 2, passed: false, duration: 123 }
                    },
                    suite2: {
                        test1: { failures: 2, runs: 2, passed: false, duration: 123 }
                    }
                } as SuiteResults)
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({
                suite1: {
                    test1: { failures: 0, runs: 1, passed: true, duration: 123 },
                    test2: { failures: 0, runs: 1, passed: true, duration: 123 }
                },
                suite2: {
                    test1: { failures: 0, runs: 1, passed: true, duration: 123 }
                }
            } as SuiteResults);
        });

        test('should return empty object the lastRun doesn\'t contain valid SuiteResults information', () => {
            mock({
                './.test-protractor-smartrunner/123456': {} as SuiteResults,
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { failures: 2, runs: 2, passed: false, duration: 123 }
                    },
                    suite2: {
                        test1: { failures: 2, runs: 2, passed: false, duration: 123 }
                    }
                } as SuiteResults)
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({} as SuiteResults);
        });

        test('should return empty object the lastRun doesn\'t contain valid SuiteResults information (v2)', () => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file2.json': JSON.stringify({} as SuiteResults)
                },
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { failures: 2, runs: 2, passed: false, duration: 123 }
                    },
                    suite2: {
                        test1: { failures: 2, runs: 2, passed: false, duration: 123 }
                    }
                } as SuiteResults)
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({} as SuiteResults);
        });
    });
});
