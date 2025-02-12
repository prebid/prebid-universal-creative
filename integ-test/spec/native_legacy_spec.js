import {test, expect} from '../fixtures/test.js';

test.describe('Legacy native', () => {

    const TRACKER_URL = 'https://www.tracker.com/';
    const TRACKERS = Object.fromEntries(
        ['imp', 'js', 'click'].map(ttype => [ttype, `${TRACKER_URL}${ttype}`])
    )

    const TEMPLATE = `
        <div id="the-ad">
          <a class="clickUrl" href="##hb_native_linkurl##">Click</a>
          <img class="image" width="100" src="##hb_native_image##" />
          <div class="title pb-click">##hb_native_title##</div>
          <div class="body">##hb_native_body##</div>
        </div>    
    `;

    const RENDERER_URL = 'https://www.custom-renderer.com/renderer.js';

    function customRenderer(data) {
        const assets = Object.fromEntries(data.map((d) => [d.key, d.value]))
        return `
         <div id="the-ad">
          <a class="clickUrl" href="${assets.clickUrl}">Click</a>
          <img class="image" width="100" src="${assets.image}" />
          <div class="title pb-click">${assets.title}</div>
          <div class="body">${assets.body}</div>            
         </div>
        `
    }


    const ASSETS = {
        image: {
            value: 'https://prebid.org/wp-content/uploads/2021/02/Prebid-Logo-RGB-Full-Color-Medium.svg',
            expect(e) {
                return e.toHaveAttribute('src', this.value)
            }
        },
        title: {
            value: 'Ad title',
            expect(e) {
                return e.toHaveText(this.value)
            }
        },
        body: {
            value: 'Ad body',
            expect(e) {
                return e.toHaveText(this.value)
            }
        },
        clickUrl: {
            value: 'https://some-link.com',
            expect(e) {
                return e.toHaveAttribute('href', this.value)
            }
        }
    }

    let trackersFired;

    test.beforeEach(async ({page}) => {
        trackersFired = {};
        await page.route((u) => u.href.startsWith(TRACKER_URL), async (route, req) => {
            const ttype = req.url().substring(TRACKER_URL.length);
            trackersFired[ttype] = true;
            await route.fulfill({});
        });
        await page.route((u) => u.href.startsWith(RENDERER_URL), async (route) => {
            await route.fulfill({
                contentType: 'application/javascript',
                body: `window.renderAd = ${customRenderer.toString()};`
            })
        })
    });


    function bidResponse(native) {
        return {
            ad: null,
            adId: 'mock-ad',
            native
        }
    }

    function getCreative(isBanner, isTemplateInCreative, isSafeFrame) {
        if (!isBanner) {
            return isTemplateInCreative ? 'native-legacy' : 'native-no-template'
        } else {
            return (isTemplateInCreative ? 'native-banner-legacy' : 'native-banner-no-template') + (isSafeFrame ? '' : '-no-frame');
        }
    }


    Object.entries({
        'legacy response': {
            ...Object.fromEntries(Object.entries(ASSETS).map(([name, asset]) => [name, asset.value])),
            javascriptTrackers: [`<script src="${TRACKERS.js}"></script>`],
            impressionTrackers: [TRACKERS.imp],
            clickTrackers: [TRACKERS.click],
        },
        'ortb response': {
            ortb: {
                ver: '1.2',
                link: {
                    url: ASSETS.clickUrl.value,
                    clicktrackers: [
                        TRACKERS.click
                    ],
                },
                jstracker: `<script src="${TRACKERS.js}"></script>`,
                eventtrackers: [
                    {
                        url: TRACKERS.imp,
                        event: 1,
                        method: 1
                    }
                ],
                assets: [
                    {
                        id: 0,
                        img: {
                            url: ASSETS.image.value,
                        }
                    },
                    {
                        id: 1,
                        title: {
                            text: ASSETS.title.value
                        }
                    },
                    {
                        id: 2,
                        data: {
                            value: ASSETS.body.value
                        }
                    }
                ]
            }
        }
    }).forEach(([t, native]) => {
        test.describe(t, () => {
            Object.entries({
                'native proper': false,
                'native in banner': true
            }).forEach(([t, isBanner]) => {
                test.describe(t, () => {
                    Object.entries({
                        'template in creative': {
                            isTemplateInCreative: true,
                        },
                        'adTemplate': {
                            adTemplate: TEMPLATE
                        },
                        'custom renderer': {
                            rendererUrl: RENDERER_URL
                        }
                    }).forEach(([t, {isTemplateInCreative, adTemplate, rendererUrl}]) => {
                        test.describe(t, () => {
                            Object.entries({
                                'safeframe': true,
                                'non safeframe': false,
                            }).forEach(([t, isSafeFrame]) => {
                                if (!isSafeFrame && !isBanner) return; // there's no option to run GAM native ads without safeframe

                                test.describe(t, () => {
                                    test.beforeEach(async ({page}) => {
                                        await page.goto(`native_legacy.html?creative=${getCreative(isBanner, isTemplateInCreative, isSafeFrame)}&banner=${isBanner}&bidResponse=${encodeURIComponent(JSON.stringify(bidResponse({...native, adTemplate, rendererUrl})))}`);
                                    });

                                    test('should display ad', async ({crossLocator}) => {
                                        await expect(await crossLocator('#the-ad')).toBeVisible();
                                    });

                                    test('should fill in assets', async ({crossLocator}) => {
                                        await Promise.all(Object.entries(ASSETS).map(async ([name, a]) => await a.expect(expect(await crossLocator(`#the-ad .${name}`)))))
                                    });

                                    // TODO: should this emit AD_RENDER_SUCCEEDED? see https://github.com/prebid/prebid-universal-creative/issues/182
                                    ['bidWon'].forEach(ev => {
                                        test(`should emit '${ev}'`, async ({expectEvent}) => {
                                            await expectEvent(event => event.eventType === ev && event.args.adId === 'mock-ad')
                                        })
                                    });

                                    ['js', 'imp'].forEach(ttype => {
                                        test(`should fire ${ttype} trackers`, async () => {
                                            await expect.poll(() => trackersFired[ttype]).toBeTruthy();
                                        })
                                    })

                                    test('should fire click trackers', async ({crossLocator, browserName}, testInfo) => {
                                        if (browserName === 'webkit' && testInfo.project.use.headless !== false) {
                                            // webkit does not like this test. It passes locally in headed mode:
                                            //  $ npx run playwright test --headed --workers 1 --project webkit -g "should fire click trackers"
                                            // but I am unable to get headed tests to work on the pipeline
                                            // (e.g. https://app.circleci.com/pipelines/github/prebid/prebid-universal-creative/309/workflows/b9bafe18-e2b3-4081-a2f0-e74b33575b56/jobs/573)
                                            return;
                                        }
                                        const el = await crossLocator('#the-ad .pb-click');
                                        await el.click();
                                        await expect.poll(() => trackersFired.click).toBeTruthy();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
