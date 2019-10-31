import { AppPage } from '../../pages/app.po';
import { browser, logging } from 'protractor';
import { test } from '../../utils/utils';

describe('Suite 2', () => {
    let page: AppPage;

    beforeEach(() => {
        page = new AppPage();
    });

    describe('level 1a', () => {
        const passForNthAttempt = [ 1, 1, 1, 1, 1, 2, 1, 1, 3, 1 ];
        for (let i = 0; i < 10; i++) {
            it(`should test scenario ${i}`, () => {
                test(page, passForNthAttempt[i]);
            });
        }
    });

    describe('level 1b', () => {
        describe('level 2', () => {
            const passForNthAttempt = [ 1, 2, 1, 2, 1, 1, 1, 1, 1, 2 ];
            for (let i = 0; i < 10; i++) {
                it(`should test scenario ${i}`, () => {
                    test(page, passForNthAttempt[i]);
                });
            }
        });
    });

    afterEach(async () => {
        // Assert that there are no errors emitted from the browser
        const logs = await browser.manage().logs().get(logging.Type.BROWSER);
        expect(logs).not.toContain(jasmine.objectContaining({
            level: logging.Level.SEVERE,
        } as logging.Entry));
    });
});
