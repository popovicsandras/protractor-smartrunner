import { AppPage } from '../../pages/app.po';
import { browser, logging } from 'protractor';
import { test } from '../../utils/utils';

describe('Suite 2 super long name rorem ipsum dolor sit amet', () => {
    let page: AppPage;

    beforeEach(() => {
        page = new AppPage();
    });

    describe('level 1a super long name rorem ipsum dolor sit amet', () => {
        const passForNthAttempt = [ 1, 1, 1, 1, 1, 2, 1, 1, 3, 1 ];
        for (let i = 0; i < 10; i++) {
            it(`should test scenario ${i}`, () => {
                test(page, passForNthAttempt[i]);
            });
        }
    });

    describe('level 1b super long name rorem ipsum dolor sit amet', () => {
        describe('level 2 super long name rorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', () => {
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
