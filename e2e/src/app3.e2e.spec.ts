import { AppPage } from './pages/app.po';
import { browser, logging } from 'protractor';

describe('Suite 3 [skipped completly]', () => {
    let page: AppPage;

    beforeEach(() => {
        page = new AppPage();
    });

    xdescribe('level 1a', () => {
        const expectations = [ true, true, true, false, true, true, true, true, true, true ];
        for (let i = 0; i < 10; i++) {
            it(`should test scenario ${i}`, () => {
                page.navigateTo();
                browser.sleep(4000);
                expect(true).toEqual(expectations[i]);
            });
        }
    });

    describe('level 1b', () => {

        xit(`should test scenario [skipped in code]`, () => {
            page.navigateTo();
            browser.sleep(4000);
            expect(true).toEqual(false);
        });

        describe('level 2', () => {
            const expectations = [ true, true, true, true, true, true, true, true, true, true ];
            for (let i = 0; i < 10; i++) {
                xit(`should test scenario ${i}`, () => {
                    page.navigateTo();
                    browser.sleep(4000);
                    expect(true).toEqual(expectations[i]);
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
