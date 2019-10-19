import { AppPage } from './pages/app.po';
import { browser, logging } from 'protractor';

describe('Suite 1:/ with special characters in it ~\';:"|!@£$%^&*()¡€#¢∞§¶•ªº', () => {
    let page: AppPage;

    beforeEach(() => {
        page = new AppPage();
    });

    const expectations = [ false, true, true, true, true, true, true, true, true, true ];

    for (let i = 0; i < 10; i++) {
        it(`should test scenario ${i}`, () => {
            page.navigateTo();
            browser.sleep(4000);
            expect(expectations[i]).toEqual(true);
        });
    }

    afterEach(async () => {
        // Assert that there are no errors emitted from the browser
        const logs = await browser.manage().logs().get(logging.Type.BROWSER);
        expect(logs).not.toContain(jasmine.objectContaining({
            level: logging.Level.SEVERE,
        } as logging.Entry));
    });
});
