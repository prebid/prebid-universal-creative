import {test, expect} from '../fixtures/test.js';

test.describe('Native', () => {
    const PIXEL_TRACKER = 'https://www.tracker.com/pixel';
    const JS_TRACKER = 'https://www.tracker.com/js';

    const ASSETS = [
        {
            class: 'image',
            value: 'https://prebid.org/wp-content/uploads/2021/02/Prebid-Logo-RGB-Full-Color-Medium.svg',
            expect(e) {
                return e.toHaveAttribute('src', this.value)
            }
        },
        {
            class: 'title',
            value: 'Ad title',
            expect(e) {
                return e.toHaveText(this.value)
            }
        },
        {
            class: 'body',
            value: 'Ad body',
            expect(e) {
                return e.toHaveText(this.value)
            }
        },
        {
            class: 'clickUrl',
            value: 'https://some-link.com',
            expect(e) {
                return e.toHaveAttribute('href', this.value)
            }
        }
    ];

    let pixelTrackerFired, jsTrackerFired;

    test.beforeEach(async ({page}) => {
        pixelTrackerFired = false;
        jsTrackerFired = false;
        await page.route((u) => u.href.startsWith(PIXEL_TRACKER), async (route) => {
            pixelTrackerFired = true;
            await route.fulfill({})
        });
        await page.route((u) => u.href.startsWith(JS_TRACKER), async (route) => {
            jsTrackerFired = true;
            await route.fulfill({});
        });
    });

    [
        {
            t: 'legacy template through adTemplate',
            creative: 'native-no-template',
            bidResponse: {
                ad: null,
                adId: 'mock-ad',
                native: {
                    adTemplate: `
                        <div id="the-ad">
                        <a class="clickUrl" href="##hb_native_linkurl##">
                          <img class="image" width="400" src="##hb_native_image##" />
                          <div class="title">##hb_native_title##</div>
                          <div class="body">##hb_native_body##</div>
                        </a>
                        </div>
                    `,
                    ...Object.fromEntries(ASSETS.map((a) => [a.class, a.value])),
                    javascriptTrackers: [`<script src="${JS_TRACKER}"></script>`],
                    impressionTrackers: [PIXEL_TRACKER]
                }
            }
        }
    ].forEach(({t, creative, bidResponse}) => {
        test.describe(t, () => {
            test.beforeEach(async ({page}) => {
                await page.goto(`native.html?creative=${creative}&bidResponse=${encodeURIComponent(JSON.stringify(bidResponse))}`);
            });

            test('should display ad', async ({crossLocator}) => {
                await expect(await crossLocator('#the-ad')).toBeVisible();
            });

            test('should fill in assets', async ({crossLocator}) => {
                await Promise.all(ASSETS.map(async (a) => await a.expect(expect(await crossLocator(`#the-ad .${a.class}`)))))
            });

            ['bidWon'].forEach(ev => {
                test(`should emit '${ev}'`, async ({expectEvent}) => {
                    await expectEvent(event => event.eventType === ev && event.args.adId === 'mock-ad')
                })
            });

            Object.entries({
                'impression': () => pixelTrackerFired,
                'javascript': () => jsTrackerFired
            }).forEach(([t, hasFired]) => {
                test(`should fire ${t} trackers`, async () => {
                    await expect.poll(hasFired).toBeTruthy();
                })
            })
        })
    })
});
