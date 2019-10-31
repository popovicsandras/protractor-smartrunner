import { AppPage } from '../pages/app.po';
import { browser } from 'protractor';

export function test(page: AppPage, passForNthAttempt) {
    page.navigateTo();
    // browser.sleep(4000);
    expect(passForNthAttempt - browser.params.attemptCount).toBeLessThanOrEqual(0);
}
