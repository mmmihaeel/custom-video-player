import { expect, test, type Page } from '@playwright/test';

function trackConsoleErrors(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  return consoleErrors;
}

test('demo renders the player shell and layered settings menu', async ({
  page
}) => {
  const consoleErrors = trackConsoleErrors(page);

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Custom Video Player' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Play', exact: true })
  ).toBeVisible();

  await page.getByRole('button', { name: /Playback settings/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Quality/i })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^Playback speed/i })
  ).toBeVisible();

  await page.getByRole('button', { name: /^Quality/i }).click();
  await expect(page.getByRole('button', { name: /^Auto/ })).toBeVisible();

  const timeline = page.getByRole('slider', { name: 'Timeline' });
  await timeline.hover();
  await expect(page.locator('div[class*=tooltip]').first()).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('keyboard shortcuts update timeline position and volume', async ({
  page
}) => {
  await page.goto('/');

  const player = page.locator('section[aria-label="Video player"]');
  const timeline = page.getByRole('slider', { name: 'Timeline' });
  const volume = page.getByRole('slider', { name: 'Volume', exact: true });

  const initialTime = Number(await timeline.getAttribute('aria-valuenow'));
  const initialVolume = Number(await volume.inputValue());

  await player.focus();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => Number(await timeline.getAttribute('aria-valuenow')))
    .toBeGreaterThan(initialTime);

  await page.keyboard.press('ArrowDown');
  await expect
    .poll(async () => Number(await volume.inputValue()))
    .toBeLessThan(initialVolume);
});

test.describe('mobile interactions', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 }
  });

  test('timeline seeking works on touch layouts', async ({ page }) => {
    await page.goto('/');

    const timeline = page.getByRole('slider', { name: 'Timeline' });
    await timeline.scrollIntoViewIfNeeded();

    const before = Number(await timeline.getAttribute('aria-valuenow'));
    const box = await timeline.boundingBox();

    if (!box) {
      throw new Error('Timeline bounds were not available.');
    }

    await page.touchscreen.tap(
      box.x + box.width * 0.75,
      box.y + box.height / 2
    );

    await expect
      .poll(async () => Number(await timeline.getAttribute('aria-valuenow')))
      .toBeGreaterThan(before);

    await expect(
      page.getByRole('slider', { name: 'Volume', exact: true })
    ).toBeVisible();
  });
});
