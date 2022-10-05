import {test as baseTest} from '@playwright/test';
import path from 'path';
import {expect} from '@playwright/test';
export {expect} from '@playwright/test';
import process from 'process'
export const BASE_URL = 'https://www.prebid.org/puc-test/';
export const PUC_URL = 'https://cdn.jsdelivr.net/npm/prebid-universal-creative@latest/dist/';
export const PBJS_URL = 'https://cdn.jsdelivr.net/npm/prebid.js@latest/dist/not-for-prod/prebid.js'

const LOCAL_PBJS_URL = 'http://localhost:9999/build/dev/prebid.js';

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
        if (process.env.LOCAL_PBJS) {
            const localUrl = process.env.LOCAL_PBJS.startsWith('http') ? process.env.LOCAL_PBJS : LOCAL_PBJS_URL;
            await context.route((u) => u.href.startsWith(PBJS_URL), (route) => route.fulfill({status: 302, headers: {Location: localUrl}}))
        }
        await use(context);
    },
    /**
     * await crossLocator(selector): returns a locator for the first element matching 'selector' that appears on the
     * page, across all frames.
     */
    async crossLocator({page}, use) {
        await use(function (selector) {
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
    async expectEvent({page}, use) {
        await use(async function (predicate, numMatches = 1) {
            await expect.poll(async () =>
                ((await page.evaluate(() => window.pbjs?.getEvents && window.pbjs.getEvents())) || [])
                    .filter(predicate)
                    .length === numMatches
            ).toBeTruthy();
        });
    }
});
