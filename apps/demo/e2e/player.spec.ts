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

function trackConsoleLogs(page: Page, prefix: string) {
  const consoleLogs: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'log' && message.text().includes(prefix)) {
      consoleLogs.push(message.text());
    }
  });

  return consoleLogs;
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
  await expect(page.getByRole('button', { name: /^720p/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^240p/ })).toBeVisible();
  await expect
    .poll(
      async () =>
        (await page.getByRole('button').allTextContents()).map((text) =>
          text.trim()
        ),
      { timeout: 10000 }
    )
    .toEqual(expect.arrayContaining(['720p', '480p', '360p', '240p']));

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
  const initialVolume = Number(await volume.getAttribute('aria-valuenow'));

  await player.focus();
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => Number(await timeline.getAttribute('aria-valuenow')))
    .toBeGreaterThan(initialTime);

  await page.keyboard.press('ArrowDown');
  await expect
    .poll(async () => Number(await volume.getAttribute('aria-valuenow')))
    .toBeLessThan(initialVolume);
});

test('volume slider reveals on hover and can reach true zero', async ({
  page
}) => {
  await page.goto('/');

  const muteButton = page.getByRole('button', { name: 'Mute audio' });
  const volume = page.getByRole('slider', { name: 'Volume', exact: true });

  const collapsedWidth = await volume.evaluate(
    (element) => element.getBoundingClientRect().width
  );
  expect(collapsedWidth).toBeLessThan(1);

  await muteButton.hover();

  await expect
    .poll(async () =>
      volume.evaluate((element) => element.getBoundingClientRect().width)
    )
    .toBeGreaterThan(70);

  await volume.focus();
  await page.keyboard.press('Home');

  await expect(volume).toHaveAttribute('aria-valuenow', '0');
});

test('fullscreen can be entered and exited from the player control', async ({
  page
}) => {
  await page.goto('/');

  const fullscreenButton = page.getByRole('button', {
    name: 'Enter fullscreen'
  });

  await fullscreenButton.click();
  await expect(
    page.getByRole('button', { name: 'Exit fullscreen' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Exit fullscreen' }).click();
  await expect(
    page.getByRole('button', { name: 'Enter fullscreen' })
  ).toBeVisible();
});

test('preset variants restyle the main player and remount API defaults', async ({
  page
}) => {
  await page.goto('/');

  const player = page.locator('section[aria-label="Video player"]');

  await page
    .getByRole('button', { name: 'Load Paper Editorial preset' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Begin playback' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Player options' })
  ).toBeVisible();
  await expect
    .poll(async () =>
      player.evaluate((element) =>
        element.style.getPropertyValue('--cvp-control').trim()
      )
    )
    .toBe('#f6efe2');

  await page
    .getByRole('button', { name: 'Load Signal Preview preset' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Start preview' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Unmute audio' })
  ).toBeVisible();
});

test('demo logs typed analytics events for desktop interactions', async ({
  page
}) => {
  const analyticsLogs = trackConsoleLogs(page, '[demo analytics]');

  await page.goto('/');

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Pause' }).click();

  await page.getByRole('button', { name: 'Playback settings' }).click();
  await page.getByRole('button', { name: /^Playback speed/i }).click();
  await page.getByRole('button', { name: /^1.5x/ }).click();

  await page.getByRole('button', { name: 'Playback settings' }).click();
  await page.getByRole('button', { name: /^Quality/i }).click();
  await page.getByRole('button', { name: /^720p/ }).click();

  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await page.getByRole('button', { name: 'Exit fullscreen' }).click();

  await expect
    .poll(() => analyticsLogs)
    .toEqual(
      expect.arrayContaining([
        expect.stringContaining('[demo analytics] play'),
        expect.stringContaining('[demo analytics] pause'),
        expect.stringContaining('[demo analytics] speedChange'),
        expect.stringContaining('[demo analytics] qualityChange'),
        expect.stringContaining('[demo analytics] fullscreenToggle')
      ])
    );
});

test.describe('mobile interactions', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 }
  });

  test('timeline seeking works on touch layouts', async ({ page }) => {
    const analyticsLogs = trackConsoleLogs(page, '[demo analytics]');

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
    ).toBeHidden();

    await expect(
      page.getByRole('button', { name: 'Mute audio' })
    ).toBeVisible();

    await expect
      .poll(() => analyticsLogs)
      .toEqual(
        expect.arrayContaining([
          expect.stringContaining('[demo analytics] seek')
        ])
      );
  });

  test('compact mobile layout keeps secondary actions reachable', async ({
    page
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: 'Playback settings' })
    ).toBeVisible();
    const muteButton = page.getByRole('button', { name: 'Mute audio' });
    await expect(muteButton).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Enter fullscreen' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Picture in picture' })
    ).toBeHidden();

    await muteButton.click();
    await expect(
      page.getByRole('button', { name: 'Unmute audio' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Playback settings' }).click();

    await expect(
      page.getByRole('button', { name: 'Picture in picture' })
    ).toBeVisible();
  });

  test('fullscreen fills the mobile viewport and exits cleanly', async ({
    page
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Enter fullscreen' }).click();

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const root = document.querySelector(
            'section[aria-label="Video player"]'
          );

          return document.fullscreenElement === root;
        })
      )
      .toBe(true);

    const fullscreenMetrics = await page.evaluate(() => {
      const root = document.querySelector(
        'section[aria-label="Video player"]'
      ) as HTMLElement | null;
      const surface = root?.querySelector(
        '[data-fullscreen]'
      ) as HTMLElement | null;
      const video = root?.querySelector('video');
      const exitButton = Array.from(
        root?.querySelectorAll('button') ?? []
      ).find(
        (button) => button.getAttribute('aria-label') === 'Exit fullscreen'
      ) as HTMLElement | undefined;

      return {
        rootHeight: root?.getBoundingClientRect().height ?? 0,
        rootWidth: root?.getBoundingClientRect().width ?? 0,
        surfaceHeight: surface?.getBoundingClientRect().height ?? 0,
        surfaceWidth: surface?.getBoundingClientRect().width ?? 0,
        exitRight: exitButton?.getBoundingClientRect().right ?? 0,
        surfaceRight: surface?.getBoundingClientRect().right ?? 0,
        videoObjectFit: video ? getComputedStyle(video).objectFit : null,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth
      };
    });

    expect(Math.round(fullscreenMetrics.rootWidth)).toBe(
      fullscreenMetrics.viewportWidth
    );
    expect(Math.round(fullscreenMetrics.surfaceWidth)).toBe(
      fullscreenMetrics.viewportWidth
    );
    expect(Math.round(fullscreenMetrics.rootHeight)).toBe(
      fullscreenMetrics.viewportHeight
    );
    expect(Math.round(fullscreenMetrics.surfaceHeight)).toBe(
      fullscreenMetrics.viewportHeight
    );
    expect(fullscreenMetrics.surfaceRight).toBeLessThanOrEqual(
      fullscreenMetrics.viewportWidth + 1
    );
    expect(fullscreenMetrics.exitRight).toBeLessThanOrEqual(
      fullscreenMetrics.viewportWidth + 1
    );
    expect(fullscreenMetrics.videoObjectFit).toBe('contain');

    await page.getByRole('button', { name: 'Exit fullscreen' }).click();

    await expect
      .poll(async () =>
        page.evaluate(() => document.fullscreenElement === null)
      )
      .toBe(true);
  });
});
