import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnalyticsEvent } from '../src/types/player';
import { VideoPlayer } from '../src/components/VideoPlayer';

const hlsRuntime = vi.hoisted(() => ({
  retry: vi.fn(),
  setQuality: vi.fn()
}));

vi.mock('../src/hooks/useHls', () => ({
  useHls: () => ({
    error: null,
    qualities: [
      { label: '720p', value: 720 },
      { label: '480p', value: 480 }
    ],
    retry: hlsRuntime.retry,
    selectedQuality: 'auto',
    setQuality: hlsRuntime.setQuality
  })
}));

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

function getEvent<TType extends AnalyticsEvent['type']>(
  spy: ReturnType<typeof vi.fn>,
  type: TType
) {
  return spy.mock.calls
    .map(([event]) => event as AnalyticsEvent)
    .find(
      (event): event is Extract<AnalyticsEvent, { type: TType }> =>
        event.type === type
    );
}

function getVideoElement(container: HTMLElement) {
  const video = container.querySelector('video');

  if (!video) {
    throw new Error('Video element was not rendered.');
  }

  return video;
}

beforeEach(() => {
  hlsRuntime.retry.mockReset();
  hlsRuntime.setQuality.mockReset();
  Object.defineProperty(HTMLMediaElement.prototype, 'canPlayType', {
    configurable: true,
    value: vi.fn(() => 'maybe')
  });
});

describe('VideoPlayer analytics', () => {
  it('does not emit analytics events on initial mount', () => {
    const onAnalyticsEvent = vi.fn();

    renderPlayer({ onAnalyticsEvent });

    expect(onAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('emits play and pause analytics with runtime snapshot fields', async () => {
    const user = userEvent.setup();
    const onAnalyticsEvent = vi.fn();
    const onPlay = vi.fn();
    const onPause = vi.fn();

    renderPlayer({
      onAnalyticsEvent,
      onPause,
      onPlay
    });

    await user.click(screen.getByRole('button', { name: 'Play' }));

    await waitFor(() => {
      expect(getEvent(onAnalyticsEvent, 'play')).toBeDefined();
    });

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(getEvent(onAnalyticsEvent, 'play')).toEqual(
      expect.objectContaining({
        type: 'play',
        currentTime: 0,
        duration: 348,
        isMuted: false,
        playbackRate: 1,
        selectedQuality: 'auto',
        timestamp: expect.any(Number),
        volume: 1
      })
    );

    await user.click(screen.getByRole('button', { name: 'Pause' }));

    await waitFor(() => {
      expect(getEvent(onAnalyticsEvent, 'pause')).toBeDefined();
    });

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(getEvent(onAnalyticsEvent, 'pause')).toEqual(
      expect.objectContaining({
        type: 'pause',
        currentTime: 0,
        duration: 348,
        isMuted: false,
        playbackRate: 1,
        selectedQuality: 'auto',
        timestamp: expect.any(Number),
        volume: 1
      })
    );
  });

  it('emits seek analytics and keeps the seek callback intact', async () => {
    const onAnalyticsEvent = vi.fn();
    const onSeek = vi.fn();

    renderPlayer({
      onAnalyticsEvent,
      onSeek,
      seekStep: 7
    });

    fireEvent.keyDown(screen.getByRole('slider', { name: 'Timeline' }), {
      key: 'ArrowRight'
    });

    await waitFor(() => {
      expect(getEvent(onAnalyticsEvent, 'seek')).toBeDefined();
    });

    expect(onSeek).toHaveBeenCalledWith(7);
    expect(getEvent(onAnalyticsEvent, 'seek')).toEqual(
      expect.objectContaining({
        type: 'seek',
        currentTime: 7,
        duration: 348,
        fromTime: 0,
        timestamp: expect.any(Number),
        toTime: 7
      })
    );
  });

  it('emits qualityChange analytics from the settings menu', async () => {
    const user = userEvent.setup();
    const onAnalyticsEvent = vi.fn();
    const onQualityChange = vi.fn();

    renderPlayer({
      onAnalyticsEvent,
      onQualityChange
    });

    await user.click(screen.getByRole('button', { name: 'Playback settings' }));
    await user.click(screen.getByRole('button', { name: /^Quality/i }));
    await user.click(screen.getByRole('button', { name: /^720p/ }));

    expect(hlsRuntime.setQuality).toHaveBeenCalledWith(720);
    expect(onQualityChange).toHaveBeenCalledWith(720);
    expect(getEvent(onAnalyticsEvent, 'qualityChange')).toEqual(
      expect.objectContaining({
        type: 'qualityChange',
        currentTime: 0,
        duration: 348,
        fromQuality: 'auto',
        timestamp: expect.any(Number),
        toQuality: 720
      })
    );
  });

  it('emits speedChange analytics from the speed menu', async () => {
    const user = userEvent.setup();
    const onAnalyticsEvent = vi.fn();
    const onPlaybackRateChange = vi.fn();

    renderPlayer({
      onAnalyticsEvent,
      onPlaybackRateChange
    });

    await user.click(screen.getByRole('button', { name: 'Playback settings' }));
    await user.click(screen.getByRole('button', { name: /^Playback speed/i }));
    await user.click(screen.getByRole('button', { name: /^1.5x/ }));

    await waitFor(() => {
      expect(getEvent(onAnalyticsEvent, 'speedChange')).toBeDefined();
    });

    expect(onPlaybackRateChange).toHaveBeenCalledWith(1.5);
    expect(getEvent(onAnalyticsEvent, 'speedChange')).toEqual(
      expect.objectContaining({
        type: 'speedChange',
        currentTime: 0,
        duration: 348,
        fromRate: 1,
        timestamp: expect.any(Number),
        toRate: 1.5
      })
    );
  });

  it('emits volumeChange analytics for mute interactions', async () => {
    const user = userEvent.setup();
    const onAnalyticsEvent = vi.fn();
    const onMuteChange = vi.fn();
    const onVolumeChange = vi.fn();

    renderPlayer({
      onAnalyticsEvent,
      onMuteChange,
      onVolumeChange
    });

    await user.click(screen.getByRole('button', { name: 'Mute audio' }));

    await waitFor(() => {
      expect(getEvent(onAnalyticsEvent, 'volumeChange')).toBeDefined();
    });

    expect(onMuteChange).toHaveBeenLastCalledWith(true);
    expect(onVolumeChange).toHaveBeenCalled();
    expect(getEvent(onAnalyticsEvent, 'volumeChange')).toEqual(
      expect.objectContaining({
        type: 'volumeChange',
        currentTime: 0,
        duration: 348,
        fromMuted: false,
        fromVolume: 1,
        timestamp: expect.any(Number),
        toMuted: true,
        toVolume: 1
      })
    );
  });

  it('emits chapterChange analytics when playback crosses into a new chapter', async () => {
    const onAnalyticsEvent = vi.fn();
    const onChapterChange = vi.fn();
    const { container } = renderPlayer({
      onAnalyticsEvent,
      onChapterChange
    });

    const video = getVideoElement(container);
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      value: 20,
      writable: true
    });

    fireEvent.timeUpdate(video);

    await waitFor(() => {
      expect(getEvent(onAnalyticsEvent, 'chapterChange')).toBeDefined();
    });

    expect(onChapterChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'Deep dive' })
    );
    expect(getEvent(onAnalyticsEvent, 'chapterChange')).toEqual(
      expect.objectContaining({
        type: 'chapterChange',
        currentTime: 20,
        duration: 348,
        fromChapter: expect.objectContaining({ title: 'Introduction' }),
        timestamp: expect.any(Number),
        toChapter: expect.objectContaining({ title: 'Deep dive' })
      })
    );
  });

  it('emits fullscreenToggle analytics and preserves fullscreen callbacks', async () => {
    const user = userEvent.setup();
    const onAnalyticsEvent = vi.fn();
    const onFullscreenChange = vi.fn();

    renderPlayer({
      onAnalyticsEvent,
      onFullscreenChange
    });

    await user.click(screen.getByRole('button', { name: 'Enter fullscreen' }));

    await waitFor(() => {
      expect(getEvent(onAnalyticsEvent, 'fullscreenToggle')).toBeDefined();
    });

    expect(onFullscreenChange).toHaveBeenCalledWith(true);
    expect(getEvent(onAnalyticsEvent, 'fullscreenToggle')).toEqual(
      expect.objectContaining({
        type: 'fullscreenToggle',
        currentTime: 0,
        duration: 348,
        isFullscreen: true,
        timestamp: expect.any(Number)
      })
    );
  });

  it('emits ended analytics and keeps the ended callback intact', async () => {
    const onAnalyticsEvent = vi.fn();
    const onEnded = vi.fn();
    const { container } = renderPlayer({
      onAnalyticsEvent,
      onEnded
    });

    const video = getVideoElement(container);
    fireEvent.ended(video);

    await waitFor(() => {
      expect(getEvent(onAnalyticsEvent, 'ended')).toBeDefined();
    });

    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(getEvent(onAnalyticsEvent, 'ended')).toEqual(
      expect.objectContaining({
        type: 'ended',
        currentTime: 0,
        duration: 348,
        isMuted: false,
        playbackRate: 1,
        selectedQuality: 'auto',
        timestamp: expect.any(Number),
        volume: 1
      })
    );
  });
});
