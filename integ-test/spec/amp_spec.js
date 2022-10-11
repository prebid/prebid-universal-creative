import {test, expect} from '../fixtures/test.js';

test.describe('AMP', () => {
    const PBS_AMP_URL = 'https://prebid-server.rubiconproject.com/openrtb2/amp';
    const CACHE_HOST = 'cache-host.prebid-server.com';
    const CACHE_PATH = '/cache';
    const CACHE_ID = 'test-cache-id'
    const TRIGGERED_URL_BASE = 'https://url-triggers.com/';
    const URLS = Object.fromEntries(['burl', 'nurl', 'wurl'].map((t) => [t, `${TRIGGERED_URL_BASE}${t}`]))

    let creative, imp, nurlResponse, triggers;

    test.beforeEach(async ({page}) => {
        creative = null;
        imp = {};
        nurlResponse = null;
        triggers = {};
        await page.route((u) => u.href.startsWith(PBS_AMP_URL), (route) => {
            route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({
                    targeting: {
                        hb_cache_id: CACHE_ID,
                        hb_pb: "1.00",
                        hb_pb_rubicon: "1.00",
                        hb_cache_path: CACHE_PATH,
                        hb_size: "300x50",
                        hb_bidder: "rubicon",
                        hb_cache_host: CACHE_HOST,
                        creative
                    }
                })
            })
        });
        await page.route((u) => u.host.startsWith(CACHE_HOST) && u.pathname === CACHE_PATH, (route) => {
            route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify(imp)
            })
        })
        await page.route((u) => u.href.startsWith(TRIGGERED_URL_BASE), (route, req)=> {
            const trigger = req.url().substring(TRIGGERED_URL_BASE.length);
            triggers[trigger] = true;
            route.fulfill({
                contentType: 'text/html',
                body: trigger === 'nurl' && nurlResponse || ''
            })
        })
    });

    test.describe('Banner', () => {
        Object.entries({
            'safeframe': 'banner-safeframe',
            'non safeframe': 'banner-noframe',
        }).forEach(([t, cr]) => {
            test.describe(t, () => {
                const AD = `
                 <p id="the-ad">
                     This is the ad
                     <span id="ad-price">\${AUCTION_PRICE}</span>
                 </p>                
                `

                test.beforeEach(() => {
                    creative = cr;
                });

                Object.entries({
                    'imp.adm': {
                        adm: AD,
                        setup() {}
                    },
                    'imp.nurl': {
                        setup() {
                            nurlResponse = AD;
                        }
                    }
                }).forEach(([t, {adm, setup}]) => {
                    test.describe(t, () => {
                        test.beforeEach(async ({page}) => {
                            imp = {
                                price: 1.23,
                                adm,
                                ...URLS
                            };
                            setup();
                            await page.goto('amp.html');
                        });


                        test('should display ad', async ({crossLocator}) => {
                            await expect(await crossLocator('#the-ad')).toBeVisible();
                        })

                        if (adm != null) { // TODO: should AUCTION_PRICE work in the nurl case? see https://github.com/prebid/prebid-universal-creative/issues/183
                            test('should replace auction price', async ({crossLocator}) => {
                                await expect(await crossLocator('#the-ad #ad-price')).toHaveText('1.23');
                            })
                        }

                        Object.keys(URLS).forEach((trigger) => {
                            test(`should trigger ${trigger}`, () => {
                                expect.poll(() => triggers[trigger]).toBeTruthy();
                            });
                        });
                    });
                });
            });
        });
    });
});
