import {test, expect} from'../fixtures/test.js';

test.describe('video render', () => {
    Object.entries({
        // safeframe should not render video ads, and emit AD_RENDER_FAILED
        // this does not work currently; mediaType is not in the message payload
        // 'safeframe': 'banner-safeframe',
        'non safeframe': 'banner-noframe'
    }).forEach(([t, creative]) => {
        test.describe(t, () => {
            test.beforeEach(async ({page}) => {
                await page.goto(`banner.html?creative=${creative}&mediaType=video`);
            });
            test('should emit AD_RENDER_FAILED', async ({page}) => {
                await expect.poll(async () =>
                    await page.evaluate(() =>
                        window.pbjs?.getEvents &&
                        window.pbjs.getEvents().filter(ev => ev.eventType === 'adRenderFailed').length > 0
                    )
                ).toBeTruthy();
            })
        })
    })
})
