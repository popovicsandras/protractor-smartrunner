import { AppPage } from '../../pages/app.po';
import { browser, logging } from 'protractor';
import { test } from '../../utils/utils';

describe('Suite 1:/ with special characters in it ~\';:"|!@£$%^&*()¡€#¢∞§¶•ªº', () => {
    let page: AppPage;

    beforeEach(() => {
        page = new AppPage();
    });

    const passForNthAttempt = [ 1, 1, 1, 3, 1, 1, 2, 1, 1, 4 ];

    for (let i = 0; i < 10; i++) {
        it(`[C${i}] should test scenario ${i}`, () => {
            test(page, passForNthAttempt[i]);
        });
    }

    it('[C123456] never passes', () => {
        expect(false).toBe(true);
    });

    it('[C789012] never passes', () => {
        expect(false).toBe(true);
    });

    it('[C345678] always passes', () => {
        expect(true).toBe(true);
    });

    afterEach(async () => {
        // Assert that there are no errors emitted from the browser
        const logs = await browser.manage().logs().get(logging.Type.BROWSER);
        expect(logs).not.toContain(jasmine.objectContaining({
            level: logging.Level.SEVERE,
        } as logging.Entry));
    });
});
