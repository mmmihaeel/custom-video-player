import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoPlayer } from '../src/components/VideoPlayer';

const chapters = [
  { title: 'Introduction', start: 0, end: 14 },
  { title: 'Deep dive', start: 15, end: 57 }
] as const;

function renderPlayer(props: Partial<ComponentProps<typeof VideoPlayer>> = {}) {
  return render(
    <VideoPlayer
      source={{ type: 'hls', src: 'https://example.com/playlist.m3u8' }}
      durationHint={348}
      chapters={chapters}
      playbackRates={[0.75, 1, 1.25, 1.5, 2]}
      {...props}
    />
  );
}

beforeEach(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'canPlayType', {
    configurable: true,
    value: vi.fn(() => 'maybe')
  });
});

describe('VideoPlayer', () => {
  it('renders player controls and opens the settings menu', async () => {
    const user = userEvent.setup();

    renderPlayer();

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Playback settings' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Playback settings' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Quality/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Playback speed/i })
    ).toBeInTheDocument();
  });

  it('changes playback rate from the settings menu', async () => {
    const user = userEvent.setup();
    const onPlaybackRateChange = vi.fn();

    renderPlayer({ onPlaybackRateChange });

    await user.click(screen.getByRole('button', { name: 'Playback settings' }));
    await user.click(screen.getByRole('button', { name: /Playback speed/i }));
    await user.click(screen.getByRole('button', { name: /^1.5x/ }));

    expect(onPlaybackRateChange).toHaveBeenCalledWith(1.5);
  });

  it('toggles playback from the main control', async () => {
    const user = userEvent.setup();

    renderPlayer();

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('emits a normalized state snapshot for host integrations', async () => {
    const onStateChange = vi.fn();

    renderPlayer({ onStateChange });

    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalled();
    });

    expect(onStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        bufferedPercent: expect.any(Number),
        currentTime: 0,
        isMuted: false,
        isPlaying: false,
        selectedQuality: 'auto',
        volume: 1
      })
    );
  });

  it('keeps the poster clean before playback and shows replay after ending', async () => {
    const { container } = renderPlayer();
    const video = container.querySelector('video');

    if (!video) {
      throw new Error('Video element was not rendered.');
    }

    expect(
      container.querySelector('button[class*="centerActionButton"]')
    ).toBeNull();

    fireEvent.play(video);
    fireEvent.pause(video);

    expect(
      container.querySelector('button[class*="centerActionButton"]')
    ).toBeInTheDocument();
    expect(
      container
        .querySelector('button[class*="centerActionButton"]')
        ?.getAttribute('aria-label')
    ).toBe('Play');

    fireEvent.play(video);
    fireEvent.ended(video);

    expect(screen.getByRole('button', { name: 'Replay' })).toBeInTheDocument();
  });
});
