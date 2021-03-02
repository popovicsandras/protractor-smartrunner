const fs = require('fs-extra');
const mock = require('mock-fs');
import { loadResults, backupResults, calculateDiff, BackupError } from './fs-helpers';

describe('helpers', () => {
    const suite1Results = {
        suite1: {
            test1: { retries: 0, passed: true, duration: 123 },
            test2: { retries: 1, passed: true, duration: 456 },
            test3: { retries: 2, passed: false, duration: 789 },
        }
    };

    const suite2Results = {
        suite2: {
            test1: { retries: 0, passed: true, duration: 123 },
            test2: { retries: 1, passed: false, duration: 456 },
        }
    };

    const suite3ResultsInTextFile = {
        suite3: {
            test1: { retries: 0, passed: true, duration: 123 },
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
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify(suite1Results),
                    'file2.json': JSON.stringify(suite2Results),
                }
            });

            const results = calculateDiff('./.test-protractor-smartrunner/123456');
            expect(results).toEqual({...suite1Results, ...suite2Results});
        });

        test('should return empty object if no change has been done', () => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify({
                        suite1: {
                            test1: { retries: 0, passed: true, duration: 123 },
                            test2: { retries: 0, passed: true, duration: 123 }
                        }
                    }),
                    'file2.json': JSON.stringify({
                        suite2: {
                            test1: { retries: 0, passed: true, duration: 123 }
                        }
                    })
                },
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { retries: 0, passed: true, duration: 123 },
                        test2: { retries: 0, passed: true, duration: 123 }
                    },
                    suite2: {
                        test1: { retries: 0, passed: true, duration: 123 }
                    }
                })
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({});
        });

        test('should return only the previously failed ones with the correct retries\' differences', () => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify({
                        suite1: {
                            test1: { retries: 5, passed: true, duration: 123 },
                            test2: { retries: 5, passed: false, duration: 123 }
                        }
                    }),
                    'file2.json': JSON.stringify({
                        suite2: {
                            test1: { retries: 5, passed: true, duration: 123 },
                        }
                    }),
                    'file3.json': JSON.stringify({
                        suite3: {
                            test1: { retries: 2, passed: true, duration: 123 },
                            test2: { retries: 3, passed: true, duration: 123 },
                            test3: { retries: 4, passed: true, duration: 123 },
                        }
                    })
                },
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { retries: 2, passed: false, duration: 123 },
                        test2: { retries: 1, passed: false, duration: 123 }
                    },
                    suite2: {
                        test1: { retries: 2, passed: false, duration: 123 },
                    },
                    suite3: {
                        test1: { retries: 2, passed: true, duration: 123 },
                        test2: { retries: 3, passed: false, duration: 123 },
                        test3: { retries: 3, passed: false, duration: 123 },
                    }
                })
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({
                suite1: {
                    test1: { retries: 3, passed: true, duration: 123 },
                    test2: { retries: 4, passed: false, duration: 123 }
                },
                suite2: {
                    test1: { retries: 3, passed: true, duration: 123 }
                },
                suite3: {
                    test3: { retries: 1, passed: true, duration: 123 },
                }
            });
        });

        test('should return empty object if for the lastRun everything became passed without any extra failure (e.g. without retries increase)', () => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify({
                        suite1: {
                            test1: { retries: 2, passed: true, duration: 123 },
                            test2: { retries: 2, passed: true, duration: 123 }
                        }
                    }),
                    'file2.json': JSON.stringify({
                        suite2: {
                            test1: { retries: 2, passed: true, duration: 123 }
                        }
                    })
                },
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { retries: 2, passed: false, duration: 123 },
                        test2: { retries: 2, passed: false, duration: 123 }
                    },
                    suite2: {
                        test1: { retries: 2, passed: false, duration: 123 }
                    }
                })
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({});
        });

        test('should return empty object the lastRun doesn\'t contain valid SuiteResults information', () => {
            mock({
                './.test-protractor-smartrunner/123456': {},
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { retries: 2, passed: false, duration: 123 }
                    },
                    suite2: {
                        test1: { retries: 2, passed: false, duration: 123 }
                    }
                })
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({});
        });

        test('should return empty object the lastRun doesn\'t contain valid SuiteResults information (v2)', () => {
            mock({
                './.test-protractor-smartrunner/123456': {
                    'file2.json': JSON.stringify({})
                },
                './.test-protractor-smartrunner/123456.bak.json': JSON.stringify({
                    suite1: {
                        test1: { retries: 2, passed: false, duration: 123 }
                    },
                    suite2: {
                        test1: { retries: 2, passed: false, duration: 123 }
                    }
                })
            });

            expect(calculateDiff('./.test-protractor-smartrunner/123456')).toEqual({});
        });
    });
});
