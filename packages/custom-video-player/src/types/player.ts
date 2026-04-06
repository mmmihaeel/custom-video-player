import type { CSSProperties } from 'react';

export type VideoQualityValue = 'auto' | number;

export interface VideoSource {
  type: 'hls';
  src: string;
}

export interface VideoChapter {
  id?: string;
  title: string;
  start: number;
  end: number;
}

export interface VideoQualityOption {
  label: string;
  value: VideoQualityValue;
  height?: number;
  bitrate?: number;
}

export interface VideoPlayerMetadata {
  duration: number;
  selectedQuality: VideoQualityValue;
  qualities: readonly VideoQualityOption[];
  video: HTMLVideoElement;
}

export type VideoPlayerReadyPayload = VideoPlayerMetadata;

export type VideoPlayerMenuView = 'root' | 'quality' | 'speed';

export interface VideoPlayerBufferedPayload {
  bufferedEnd: number;
  bufferedPercent: number;
  duration: number;
}

export interface VideoPlayerSettingsState {
  isOpen: boolean;
  view: VideoPlayerMenuView;
}

export interface VideoPlayerState {
  bufferedEnd: number;
  bufferedPercent: number;
  currentChapter: VideoChapter | null;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  isMuted: boolean;
  isPictureInPicture: boolean;
  isPlaying: boolean;
  isSettingsOpen: boolean;
  isWaiting: boolean;
  menuView: VideoPlayerMenuView;
  playbackRate: number;
  selectedQuality: VideoQualityValue;
  volume: number;
}

export interface VideoPlayerLabels {
  play: string;
  pause: string;
  replay: string;
  mute: string;
  unmute: string;
  back: string;
  pictureInPicture: string;
  exitPictureInPicture: string;
  settings: string;
  fullscreen: string;
  exitFullscreen: string;
  volume: string;
  playbackSpeed: string;
  quality: string;
  timeline: string;
  loading: string;
  retry: string;
  streamError: string;
  autoQuality: string;
}

export interface VideoPlayerTheme {
  bufferedColor: string;
  chapterMarkerColor: string;
  controlColor: string;
  menuBackground: string;
  menuBorderColor: string;
  railColor: string;
  shadowColor: string;
  surfaceBackground: string;
}

type AnalyticsEventBase = {
  currentTime: number;
  duration: number;
  timestamp: number;
};

export type AnalyticsEvent =
  | (AnalyticsEventBase & {
      type: 'play';
      isMuted: boolean;
      playbackRate: number;
      selectedQuality: VideoQualityValue;
      volume: number;
    })
  | (AnalyticsEventBase & {
      type: 'pause';
      isMuted: boolean;
      playbackRate: number;
      selectedQuality: VideoQualityValue;
      volume: number;
    })
  | (AnalyticsEventBase & {
      type: 'seek';
      fromTime: number;
      toTime: number;
    })
  | (AnalyticsEventBase & {
      type: 'qualityChange';
      fromQuality: VideoQualityValue;
      toQuality: VideoQualityValue;
    })
  | (AnalyticsEventBase & {
      type: 'speedChange';
      fromRate: number;
      toRate: number;
    })
  | (AnalyticsEventBase & {
      type: 'fullscreenToggle';
      isFullscreen: boolean;
    })
  | (AnalyticsEventBase & {
      type: 'volumeChange';
      fromMuted: boolean;
      fromVolume: number;
      toMuted: boolean;
      toVolume: number;
    })
  | (AnalyticsEventBase & {
      type: 'chapterChange';
      fromChapter: VideoChapter | null;
      toChapter: VideoChapter | null;
    })
  | (AnalyticsEventBase & {
      type: 'ended';
      isMuted: boolean;
      playbackRate: number;
      selectedQuality: VideoQualityValue;
      volume: number;
    });

export interface VideoPlayerProps {
  source: VideoSource;
  chapters?: readonly VideoChapter[];
  durationHint?: number;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  defaultVolume?: number;
  defaultQuality?: VideoQualityValue;
  defaultPlaybackRate?: number;
  playbackRates?: readonly number[];
  seekStep?: number;
  className?: string;
  style?: CSSProperties;
  theme?: Partial<VideoPlayerTheme>;
  labels?: Partial<VideoPlayerLabels>;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onReady?: (metadata: VideoPlayerMetadata) => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (metadata: VideoPlayerMetadata) => void;
  onBufferedChange?: (payload: VideoPlayerBufferedPayload) => void;
  onStateChange?: (state: VideoPlayerState) => void;
  onWaitingChange?: (isWaiting: boolean) => void;
  onSettingsOpenChange?: (isOpen: boolean) => void;
  onSettingsChange?: (payload: VideoPlayerSettingsState) => void;
  onQualityChange?: (quality: VideoQualityValue) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onVolumeChange?: (volume: number) => void;
  onMuteChange?: (muted: boolean) => void;
  onChapterChange?: (chapter: VideoChapter | null) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onPictureInPictureChange?: (isPictureInPicture: boolean) => void;
  onAnalyticsEvent?: (event: AnalyticsEvent) => void;
  onError?: (error: Error) => void;
}
