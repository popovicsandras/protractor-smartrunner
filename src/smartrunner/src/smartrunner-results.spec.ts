const mock = require('mock-fs');
import fs from 'fs-extra';
import { SmartRunnerResults } from './smartrunner-results';
import { Logger } from 'protractor/built/logger';
import { SuiteResults, ERROR_CODES } from './common.interfaces';

describe('SmartRunnerResults', () => {

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

    describe('set and get', () => {
        let results;

        beforeEach(() => {
            results = new SmartRunnerResults('output-path', '123', new Logger('test-logger'));
        });

        test('get should return undefined in case of non existing suite', () => {
            expect(results.get('non-existent-suite', 'whatever-test')).toEqual(undefined);
        });

        test('get should return undefined in case of non existing test', () => {
            results.set('existing-suite', 'test1', true, 1);
            expect(results.get('existing-suite', 'non-existent-test')).toEqual(undefined);
        });

        test('get should return the correct result data for a test passed for the first time', () => {
            results.set('suite1', 'test1', true, 1);

            expect(results.get('suite1', 'test1')).toEqual({
                failures: 0,
                runs: 1,
                passed: true,
                duration: 1
            });
        });

        test('get should return the correct result data for a test passed for the second time as well', () => {
            results.set('suite1', 'test1', true, 1);
            results.set('suite1', 'test1', true, 3);

            expect(results.get('suite1', 'test1')).toEqual({
                failures: 0,
                runs: 2,
                passed: true,
                duration: 3
            });
        });

        test('get should return the correct result data for a test failed only for the third time', () => {
            results.set('suite1', 'test1', true, 1);
            results.set('suite1', 'test1', true, 3);
            results.set('suite1', 'test1', false, 2);

            expect(results.get('suite1', 'test1')).toEqual({
                failures: 1,
                runs: 3,
                passed: false,
                duration: 2
            });
        });

        test('get should return the correct result data for a test failed for the first time', () => {
            results.set('suite1', 'test1', false, 1);

            expect(results.get('suite1', 'test1')).toEqual({
                failures: 1,
                runs: 1,
                passed: false,
                duration: 1
            });
        });

        test('get should return the correct result data for a test failed for the second time as well', () => {
            results.set('suite1', 'test1', false, 1);
            results.set('suite1', 'test1', false, 3);

            expect(results.get('suite1', 'test1')).toEqual({
                failures: 2,
                runs: 2,
                passed: false,
                duration: 3
            });
        });

        test('get should return the correct result data for a test passed for the third time', () => {
            results.set('suite1', 'test1', false, 1);
            results.set('suite1', 'test1', false, 3);
            results.set('suite1', 'test1', true, 2);

            expect(results.get('suite1', 'test1')).toEqual({
                failures: 2,
                runs: 3,
                passed: true,
                duration: 2
            });
        });

        test('get should return the correct result data for tests even if there are multiple different tests in the same suite', () => {
            results.set('suite1', 'test1', true, 1);
            results.set('suite1', 'test2', true, 2);

            expect(results.get('suite1', 'test1')).toEqual({
                failures: 0,
                runs: 1,
                passed: true,
                duration: 1
            });

            expect(results.get('suite1', 'test2')).toEqual({
                failures: 0,
                runs: 1,
                passed: true,
                duration: 2
            });
        });

        test('get should return the correct result data for tests even if there are multiple different tests in different suites', () => {
            results.set('suite1', 'test1', true, 1);
            results.set('suite1', 'test2', true, 2);
            results.set('suite3', 'test3', false, 3);

            expect(results.get('suite1', 'test1')).toEqual({
                failures: 0,
                runs: 1,
                passed: true,
                duration: 1
            });

            expect(results.get('suite1', 'test2')).toEqual({
                failures: 0,
                runs: 1,
                passed: true,
                duration: 2
            });

            expect(results.get('suite3', 'test3')).toEqual({
                failures: 1,
                runs: 1,
                passed: false,
                duration: 3
            });
        });
    });

    describe('isSuitePristine', () => {
        let results;

        beforeEach(() => {
            results = new SmartRunnerResults('output-path', '123', new Logger('test-logger'));
        });

        test('should return true for untouched suites', () => {
            expect(results.isSuitePristine('suite1')).toBe(true);
            expect(results.isSuitePristine('suite2')).toBe(true);
        });

        test('should mark the set suites not pristine', () => {
            results.set('suite1', 'whatever-test1', true, 1);
            results.set('suite2', 'whatever-test2', false, 3);

            expect(results.isSuitePristine('suite1')).toBe(false);
            expect(results.isSuitePristine('suite2')).toBe(false);
        });
    });

    describe('load', () => {

        afterEach(() => {
            mock.restore();
        });

        test('should gracefully terminate the node process if the provided path can not be calculated', () => {
            const logger = new Logger('test-logger');
            const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
            const noop: () => never = () => { throw new Error('test-error'); };
            const processSpy = jest.spyOn(process, 'exit').mockImplementation(noop);

            try {
                const results = new SmartRunnerResults('output-path', undefined, logger);
            } catch (error) {
                expect(error.message).toBe('test-error');
            }

            expect(loggerSpy).toHaveBeenCalled();
            expect(processSpy).toHaveBeenCalledWith(ERROR_CODES.RESULTS_INIT_ERROR);
            processSpy.mockRestore();
        });

        test('should create the results directory if it hasn\'t exist yet', () => {
            const results = new SmartRunnerResults('./output-path', '123', new Logger('test-logger'));

            mock({'.': {}});
            results.load();

            expect(fs.lstatSync('./output-path/123').isDirectory()).toBe(true);
        });

        test('should load the results from the filesystem', () => {
            const results = new SmartRunnerResults('./.test-protractor-smartrunner', '123456', new Logger('test-logger'));

            mock({
                './.test-protractor-smartrunner/123456': {
                    'file1.json': JSON.stringify(suite1Results),
                    'file2.json': JSON.stringify(suite2Results)
                }
            });
            results.load();

            expect(results.get('suite1', 'test1')).toEqual(suite1Results.suite1.test1);
            expect(results.get('suite1', 'test2')).toEqual(suite1Results.suite1.test2);
            expect(results.get('suite1', 'test3')).toEqual(suite1Results.suite1.test3);
            expect(results.get('suite2', 'test1')).toEqual(suite2Results.suite2.test1);
            expect(results.get('suite2', 'test2')).toEqual(suite2Results.suite2.test2);
        });
    });

    describe('save', () => {

        let logger: Logger;
        let logSpy: any;

        beforeEach(() => {
            mock({ './.test-protractor-smartrunner/123456': {} });
            logger = new Logger('test-logger');
            logSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
        });

        afterEach(() => {
            mock.restore();
            logSpy.mockRestore();
        });

        test('should save the results to filesystem with the proper filenames', () => {
            const results = new SmartRunnerResults('./.test-protractor-smartrunner', '123456', logger);

            results.set('suite1', 'test1', true, 1);
            results.set('suite name with space', 'test1', true, 1);
            results.set('SuiTEMixeDcASe', 'test1', true, 1);
            results.set('S'.repeat(300), 'test1', true, 1);
            results.save();

            expect(fs.lstatSync('./.test-protractor-smartrunner/123456/suite1.json').isFile()).toBe(true);
            expect(fs.lstatSync('./.test-protractor-smartrunner/123456/suitenamewithspace.json').isFile()).toBe(true);
            expect(fs.lstatSync('./.test-protractor-smartrunner/123456/suitemixedcase.json').isFile()).toBe(true);
            expect(fs.lstatSync('./.test-protractor-smartrunner/123456/' + 's'.repeat(250) + '.json').isFile()).toBe(true);
        });

        test('should save the results to filesystem with the proper content', () => {
            const results = new SmartRunnerResults('./.test-protractor-smartrunner', '123456', logger);

            results.set('suite1', 'test1', true, 10);
            results.set('suite2', 'test2', false, 30);
            results.set('suite2', 'test2', true, 20);
            results.save();

            const storedResult = fs.readJSONSync('./.test-protractor-smartrunner/123456/suite1.json');
            expect(storedResult).toEqual({
                suite1: {
                    test1: {
                        failures: 0,
                        runs: 1,
                        passed: true,
                        duration: 10
                    }
                }
            });

            const storedResult2 = fs.readJSONSync('./.test-protractor-smartrunner/123456/suite2.json');
            expect(storedResult2).toEqual({
                suite2: {
                    test2: {
                        failures: 1,
                        runs: 2,
                        passed: true,
                        duration: 20
                    }
                }
            });
        });

        test('should save the results to filesystem only if it was affected', () => {
            const results = new SmartRunnerResults(
                './.test-protractor-smartrunner',
                '123456',
                logger,
                {},
                { ... suite1Results, ...suite2Results}
            );

            results.set('suite2', 'test2', true, 7);
            results.set('newly-added-suite', 'test3', true, 10);
            results.save();

            const storedResult = fs.readJSONSync('./.test-protractor-smartrunner/123456/suite2.json');
            expect(storedResult).toEqual({
                suite2: {
                    ...suite2Results.suite2,
                    test2: {
                        failures: 1,
                        runs: 2,
                        passed: true,
                        duration: 7
                    },
                }
            });

            const storedResult2 = fs.readJSONSync('./.test-protractor-smartrunner/123456/newly-added-suite.json');
            expect(storedResult2).toEqual({
                'newly-added-suite': {
                    test3: {
                        failures: 0,
                        runs: 1,
                        passed: true,
                        duration: 10
                    }
                }
            });

            expect(fs.existsSync('./.test-protractor-smartrunner/123456/suite1.json')).toBe(false);
        });
    });
});
