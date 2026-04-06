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

  it('enters and exits fullscreen from the viewport control', async () => {
    const user = userEvent.setup();
    const { container } = renderPlayer();
    const playerRoot = container.querySelector(
      'section[aria-label="Video player"]'
    );

    if (!playerRoot) {
      throw new Error('Player root was not rendered.');
    }

    await user.click(screen.getByRole('button', { name: 'Enter fullscreen' }));

    expect(playerRoot).toHaveAttribute('data-fullscreen');
    expect(
      screen.getByRole('button', { name: 'Exit fullscreen' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Exit fullscreen' }));

    expect(playerRoot).not.toHaveAttribute('data-fullscreen');
    expect(
      screen.getByRole('button', { name: 'Enter fullscreen' })
    ).toBeInTheDocument();
  });

  it('applies startup defaults and label overrides', async () => {
    const { container } = renderPlayer({
      defaultPlaybackRate: 1.25,
      defaultVolume: 0.35,
      labels: {
        play: 'Begin playback',
        settings: 'Player options'
      },
      loop: true,
      muted: true
    });

    const video = container.querySelector('video');

    if (!video) {
      throw new Error('Video element was not rendered.');
    }

    await waitFor(() => {
      expect(video.playbackRate).toBe(1.25);
      expect(video.volume).toBeCloseTo(0.35);
      expect(video.muted).toBe(true);
      expect(video.loop).toBe(true);
    });

    expect(
      screen.getByRole('button', { name: 'Begin playback' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Player options' })
    ).toBeInTheDocument();
  });

  it('emits settings and audio callbacks for host integrations', async () => {
    const user = userEvent.setup();
    const onMuteChange = vi.fn();
    const onSettingsChange = vi.fn();
    const onSettingsOpenChange = vi.fn();

    renderPlayer({
      onMuteChange,
      onSettingsChange,
      onSettingsOpenChange
    });

    await user.click(screen.getByRole('button', { name: 'Mute audio' }));
    await waitFor(() => {
      expect(onMuteChange).toHaveBeenLastCalledWith(true);
    });

    await user.click(screen.getByRole('button', { name: 'Playback settings' }));
    await waitFor(() => {
      expect(onSettingsOpenChange).toHaveBeenLastCalledWith(true);
      expect(onSettingsChange).toHaveBeenLastCalledWith({
        isOpen: true,
        view: 'root'
      });
    });

    await user.click(screen.getByRole('button', { name: /Quality/i }));
    await waitFor(() => {
      expect(onSettingsChange).toHaveBeenLastCalledWith({
        isOpen: true,
        view: 'quality'
      });
    });
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

  it('notifies pause only once when playback reaches the ended state', () => {
    const onPause = vi.fn();
    const onEnded = vi.fn();
    const { container } = renderPlayer({
      onEnded,
      onPause
    });
    const video = container.querySelector('video');

    if (!video) {
      throw new Error('Video element was not rendered.');
    }

    fireEvent.play(video);
    fireEvent.pause(video);
    fireEvent.ended(video);

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it('maps the theme prop to stable CSS variables on the root element', () => {
    const { container } = renderPlayer({
      theme: {
        controlColor: '#f5f1e8',
        railColor: 'rgba(245, 241, 232, 0.24)',
        surfaceBackground: '#0d1016'
      }
    });

    const root = container.querySelector('section[aria-label="Video player"]');

    expect(root).toHaveStyle({
      '--cvp-control': '#f5f1e8',
      '--cvp-rail': 'rgba(245, 241, 232, 0.24)',
      '--cvp-surface': '#0d1016'
    });
  });
});
