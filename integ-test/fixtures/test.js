import {test as baseTest} from '@playwright/test';
import path from 'path';

export {expect} from '@playwright/test';
export const BASE_URL = 'https://www.prebid.org/puc-test/';
export const PUC_URL = 'https://cdn.jsdelivr.net/npm/prebid-universal-creative@latest/dist/';

const REDIRECTS = {
    [BASE_URL]: '../pages',
    [PUC_URL]: '../../dist'
};

export const test = baseTest.extend({
    /**
     * Replace requests for "https://www.prebid.org" with the contents of files under "pages",
     * and requests for the PUC CDN with contents of files under "dist".
     */
    async context({context}, use) {
        await Promise.all(
            Object.entries(REDIRECTS).map(([url, localDir]) => {
                context.route((u) => u.href.startsWith(url), (route, request) => {
                    const fpath = request.url().substring(url.length).split('?')[0];
                    route.fulfill({
                        path: path.resolve(__dirname, localDir, fpath)
                    });
                });
            })
        );
        await use(context);
    },
    /**
     * await crossLocator(selector): returns a locator for the first element matching 'selector' that appears on the
     * page, across all frames.
     */
    async crossLocator({page}, use) {
        use(function (selector) {
            let n = 0;
            return new Promise((resolve, reject) => {
                async function frameLocator(frame) {
                    if (!frame.isDetached()) {
                        n++;
                        try {
                            await frame.waitForSelector(selector);
                            resolve(frame.locator(selector));
                        } catch (e) {
                            n--;
                            if (n === 0) {
                                reject(e);
                            }
                        }
                    }
                }
                page.on('frameattached', frameLocator);
                function walkFrames(frame) {
                    frameLocator(frame);
                    frame.childFrames().forEach(walkFrames)
                }
                walkFrames(page.mainFrame());
            })
        })
    },
});
