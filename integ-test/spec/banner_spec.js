import {test, expect} from '../fixtures/test.js';

test.describe('Banner', () => {
    Object.entries({
        'safeframe': 'banner-safeframe',
        'non safeframe': 'banner-noframe'
    }).forEach(([t, creative]) => {
        test.describe(t, () => {
            [
                {
                    t: 'bidResponse.ad',
                    bidResponse: {
                        adId: 'mock-ad',
                        cpm: 1.23,
                        ad: `
                         <p id="the-ad">
                             This is the ad
                             <span id="ad-price">\${AUCTION_PRICE}</span>
                         </p>'
                        `
                    },
                    setup: async () => null
                },
                (() => {
                    const mockAdUrl = 'https://mock-ad.com/'
                    return {
                        t: 'bidResponse.adUrl',
                        bidResponse: {
                            adId: 'mock-ad',
                            cpm: 1.23,
                            adUrl: mockAdUrl + '${AUCTION_PRICE}',
                            mediaType: 'banner',
                        },
                        setup: async (page) => {
                            await page.route((u) => u.href.startsWith(mockAdUrl), (route, request) => {
                                const price = request.url().substring(mockAdUrl.length);
                                route.fulfill({
                                    contentType: 'text/html',
                                    body: `
                                     <p id="the-ad">
                                         This is the ad
                                         <span id="ad-price">${price}</span>
                                     </p>'
                                    `
                                })
                            });
                        }
                    };

                })()
            ].forEach(({t, bidResponse, setup}) => {
                test.describe(t, () => {
                    test.beforeEach(async ({page}) => {
                        await setup(page);
                        await page.goto(`banner.html?creative=${creative}&bidResponse=${encodeURIComponent(JSON.stringify(bidResponse))}`)
                    });
                    test('should display ad', async ({crossLocator}) => {
                        await expect(await crossLocator('#the-ad')).toBeVisible();
                    });
                    ['adRenderSucceeded', 'bidWon'].forEach(ev => {
                        test(`should emit '${ev}'`, async ({expectEvent}) => {
                            await expectEvent((event) => event.eventType === ev && event.args.adId === 'mock-ad')
                        })
                    });
                    test('should replace AUCTION_PRICE macro', async ({crossLocator}) => {
                        await expect(await crossLocator('#the-ad #ad-price')).toHaveText('1.23');
                    });

                })
            });
            test.describe('Missing ad', () => {
                const bidResponse = {
                    adId: 'mock-ad',
                    ad: null,
                }
                test.beforeEach(async ({page}) => {
                    await page.goto(`banner.html?creative=${creative}&bidResponse=${encodeURIComponent(JSON.stringify(bidResponse))}`);
                });
                test('should emit \'adRenderFailed\'', async ({expectEvent}) => {
                    await expectEvent((ev) => ev.eventType === 'adRenderFailed')
                })
            });
        });
    })
});
