import {test, expect} from '../fixtures/test.js';

test.describe('Banner', () => {
    Object.entries({
        'safeframe': 'banner-safeframe',
        'non safeframe': 'banner-noframe'
    }).forEach(([t, creative]) => {
        test.describe(t, () => {
            test.beforeEach(async ({page}) => {
                await page.goto(`banner.html?creative=${creative}`)
            });
            test('should display ad', async ({crossLocator}) => {
                await expect(await crossLocator('#the-ad')).toBeVisible();
            });
            test('should emit AD_RENDER_SUCCEEDED', async ({page}) => {
                await expect.poll(async () =>
                    await page.evaluate(() =>
                        window.pbjs?.getEvents &&
                        window.pbjs.getEvents().filter((ev) => ev.eventType === 'adRenderSucceeded').length > 0
                    )
                ).toBeTruthy();
            });
        })
    })
});
