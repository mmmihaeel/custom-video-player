import { useId, useMemo, useRef, type CSSProperties } from 'react';
import type {
  VideoPlayerLabels,
  VideoPlayerProps,
  VideoPlayerTheme,
  VideoQualityValue
} from '../types/player';
import { VideoPlayerProvider } from '../context/VideoPlayerContext';
import { useHls } from '../hooks/useHls';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { normalizeChapters } from '../utils/chapters';
import { VideoPlayerLayout } from './VideoPlayerLayout';
import styles from './VideoPlayer.module.css';

type RootStyle = CSSProperties & Partial<Record<`--cvp-${string}`, string>>;

const DEFAULT_LABELS: VideoPlayerLabels = {
  autoQuality: 'Auto',
  back: 'Back',
  exitFullscreen: 'Exit fullscreen',
  exitPictureInPicture: 'Exit picture in picture',
  fullscreen: 'Enter fullscreen',
  loading: 'Loading stream',
  mute: 'Mute audio',
  pause: 'Pause',
  pictureInPicture: 'Picture in picture',
  play: 'Play',
  playbackSpeed: 'Playback speed',
  quality: 'Quality',
  replay: 'Replay',
  retry: 'Retry',
  settings: 'Playback settings',
  streamError: 'We could not load this stream.',
  timeline: 'Timeline',
  unmute: 'Unmute audio',
  volume: 'Volume'
};

function formatPlaybackRate(rate: number) {
  return `${rate}x`;
}

function resolveQualityLabel(
  selectedQuality: VideoQualityValue,
  autoLabel: string
) {
  if (selectedQuality === 'auto') {
    return autoLabel;
  }

  return `${selectedQuality}p`;
}

function buildThemeStyle(
  theme: Partial<VideoPlayerTheme> | undefined
): RootStyle | undefined {
  if (!theme) {
    return undefined;
  }

  const themeStyle: RootStyle = {};

  if (theme.controlColor) {
    themeStyle['--cvp-control'] = theme.controlColor;
  }

  if (theme.menuBackground) {
    themeStyle['--cvp-menu'] = theme.menuBackground;
  }

  if (theme.menuBorderColor) {
    themeStyle['--cvp-menu-border'] = theme.menuBorderColor;
  }

  if (theme.railColor) {
    themeStyle['--cvp-rail'] = theme.railColor;
  }

  if (theme.bufferedColor) {
    themeStyle['--cvp-buffered'] = theme.bufferedColor;
  }

  if (theme.chapterMarkerColor) {
    themeStyle['--cvp-segment'] = theme.chapterMarkerColor;
  }

  if (theme.shadowColor) {
    themeStyle['--cvp-shadow'] = theme.shadowColor;
  }

  if (theme.surfaceBackground) {
    themeStyle['--cvp-surface'] = theme.surfaceBackground;
  }

  return themeStyle;
}

export function VideoPlayer({
  autoPlay = false,
  chapters = [],
  className,
  defaultPlaybackRate = 1,
  defaultQuality = 'auto',
  defaultVolume = 1,
  durationHint,
  labels,
  loop = false,
  muted = false,
  onAnalyticsEvent,
  onBufferedChange,
  onChapterChange,
  onError,
  onFullscreenChange,
  onMuteChange,
  onPause,
  onPictureInPictureChange,
  onPlay,
  onReady,
  onEnded,
  onLoadedMetadata,
  onPlaybackRateChange,
  onQualityChange,
  onStateChange,
  onSettingsChange,
  onSettingsOpenChange,
  onSeek,
  onTimeUpdate,
  onVolumeChange,
  onWaitingChange,
  playbackRates,
  poster,
  preload = 'metadata',
  seekStep = 5,
  source,
  theme,
  style
}: VideoPlayerProps) {
  const normalizedChapters = useMemo(
    () => normalizeChapters(chapters, durationHint),
    [chapters, durationHint]
  );
  const resolvedLabels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels]
  );
  const rootRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const settingsMenuId = useId();

  const {
    error: sourceError,
    qualities,
    retry: retryStream,
    selectedQuality,
    setQuality
  } = useHls({
    defaultQuality,
    onError,
    source,
    videoRef
  });

  const player = useVideoPlayer({
    autoPlay,
    chapters: normalizedChapters,
    defaultPlaybackRate,
    defaultVolume,
    durationHint,
    labels: resolvedLabels,
    loop,
    muted,
    onAnalyticsEvent,
    onBufferedChange,
    onChapterChange,
    onError,
    onFullscreenChange,
    onMuteChange,
    onPause,
    onPictureInPictureChange,
    onPlay,
    onReady,
    onEnded,
    onLoadedMetadata,
    onPlaybackRateChange,
    onQualityChange,
    onStateChange,
    onSettingsChange,
    onSettingsOpenChange,
    onSeek,
    onTimeUpdate,
    onVolumeChange,
    onWaitingChange,
    playbackRates,
    poster,
    preload,
    qualities,
    retryStream,
    rootRef,
    seekStep,
    selectedQuality,
    setQuality,
    sourceError,
    videoRef
  });

  const rootClassName = [styles.root, className].filter(Boolean).join(' ');
  const rootStyle = useMemo<RootStyle>(
    () => ({
      ...buildThemeStyle(theme),
      ...style
    }),
    [style, theme]
  );
  const contextValue = useMemo(
    () => ({
      currentPlaybackRateLabel: formatPlaybackRate(player.playbackRate),
      includeHours: player.resolvedDuration >= 3600,
      labels: resolvedLabels,
      runtime: player,
      selectedQualityLabel: resolveQualityLabel(
        player.selectedQuality,
        resolvedLabels.autoQuality
      ),
      settingsMenuId
    }),
    [player, resolvedLabels, settingsMenuId]
  );

  return (
    <VideoPlayerProvider value={contextValue}>
      <VideoPlayerLayout
        rootClassName={rootClassName}
        rootRef={rootRef}
        rootStyle={rootStyle}
        videoRef={videoRef}
      />
    </VideoPlayerProvider>
  );
}
