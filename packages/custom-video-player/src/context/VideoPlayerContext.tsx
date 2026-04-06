import { createContext, useContext, type PropsWithChildren } from 'react';
import type { VideoPlayerLabels } from '../types/player';
import type { VideoPlayerRuntime } from '../hooks/useVideoPlayer';

type VideoPlayerContextValue = {
  currentPlaybackRateLabel: string;
  includeHours: boolean;
  labels: VideoPlayerLabels;
  runtime: VideoPlayerRuntime;
  selectedQualityLabel: string;
  settingsMenuId: string;
};

const VideoPlayerContext = createContext<VideoPlayerContextValue | null>(null);

function useVideoPlayerContext() {
  const context = useContext(VideoPlayerContext);

  if (!context) {
    throw new Error(
      'VideoPlayer context is unavailable outside the player provider.'
    );
  }

  return context;
}

export function VideoPlayerProvider({
  children,
  value
}: PropsWithChildren<{ value: VideoPlayerContextValue }>) {
  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayerState() {
  const { includeHours, labels, runtime } = useVideoPlayerContext();

  return {
    bufferedPercent: runtime.bufferedPercent,
    currentChapter: runtime.currentChapter,
    currentTime: runtime.currentTime,
    error: runtime.error,
    hasStartedPlayback: runtime.hasStartedPlayback,
    includeHours,
    isCompactLayout: runtime.isCompactLayout,
    isEnded: runtime.isEnded,
    isFullscreen: runtime.isFullscreen,
    isMuted: runtime.isMuted,
    isPictureInPicture: runtime.isPictureInPicture,
    isPictureInPictureSupported: runtime.isPictureInPictureSupported,
    isPlaying: runtime.isPlaying,
    isWaiting: runtime.isWaiting,
    labels,
    mediaProps: runtime.mediaProps,
    playbackRate: runtime.playbackRate,
    replay: runtime.replay,
    resolvedDuration: runtime.resolvedDuration,
    retry: runtime.retry,
    selectedQuality: runtime.selectedQuality,
    volume: runtime.volume
  };
}

export function useVideoPlayerControls() {
  const { includeHours, labels, runtime, settingsMenuId } =
    useVideoPlayerContext();

  return {
    currentTime: runtime.currentTime,
    handleVolumeKeyDown: runtime.handleVolumeKeyDown,
    handleVolumePointerDown: runtime.handleVolumePointerDown,
    handleVolumePointerMove: runtime.handleVolumePointerMove,
    handleVolumePointerUp: runtime.handleVolumePointerUp,
    includeHours,
    isCompactLayout: runtime.isCompactLayout,
    isFullscreen: runtime.isFullscreen,
    isMenuOpen: runtime.isMenuOpen,
    isMuted: runtime.isMuted,
    isPictureInPicture: runtime.isPictureInPicture,
    isPictureInPictureSupported: runtime.isPictureInPictureSupported,
    isPlaying: runtime.isPlaying,
    labels,
    resolvedDuration: runtime.resolvedDuration,
    settingsButtonRef: runtime.settingsButtonRef,
    settingsMenuId,
    toggleFullscreen: runtime.toggleFullscreen,
    toggleMute: runtime.toggleMute,
    togglePictureInPicture: runtime.togglePictureInPicture,
    togglePlayback: runtime.togglePlayback,
    toggleSettingsMenu: runtime.toggleSettingsMenu,
    volume: runtime.volume,
    volumeRef: runtime.volumeRef
  };
}

export function useVideoPlayerTimeline() {
  const { includeHours, labels, runtime } = useVideoPlayerContext();

  return {
    bufferedPercent: runtime.bufferedPercent,
    chapterSegments: runtime.chapterSegments,
    clearPreview: runtime.clearPreview,
    currentTime: runtime.currentTime,
    handleTimelineKeyDown: runtime.handleTimelineKeyDown,
    handleTimelinePointerDown: runtime.handleTimelinePointerDown,
    handleTimelinePointerMove: runtime.handleTimelinePointerMove,
    handleTimelinePointerUp: runtime.handleTimelinePointerUp,
    includeHours,
    labels,
    progressPercent: runtime.progressPercent,
    resolvedDuration: runtime.resolvedDuration,
    timelinePreview: runtime.timelinePreview,
    timelineRef: runtime.timelineRef,
    tooltipRef: runtime.tooltipRef
  };
}

export function useVideoPlayerSettings() {
  const {
    currentPlaybackRateLabel,
    labels,
    runtime,
    selectedQualityLabel,
    settingsMenuId
  } = useVideoPlayerContext();

  return {
    currentPlaybackRateLabel,
    isCompactLayout: runtime.isCompactLayout,
    isMenuOpen: runtime.isMenuOpen,
    isPictureInPicture: runtime.isPictureInPicture,
    isPictureInPictureSupported: runtime.isPictureInPictureSupported,
    labels,
    menuRef: runtime.menuRef,
    menuView: runtime.menuView,
    playbackRate: runtime.playbackRate,
    playbackRateOptions: runtime.playbackRateOptions,
    qualityOptions: runtime.qualityOptions,
    selectedQuality: runtime.selectedQuality,
    selectedQualityLabel,
    setIsMenuOpen: runtime.setIsMenuOpen,
    setMenuView: runtime.setMenuView,
    setPlaybackRate: runtime.setPlaybackRate,
    setQuality: runtime.setQuality,
    settingsMenuId,
    togglePictureInPicture: runtime.togglePictureInPicture
  };
}

export function useVideoPlayerCallbacks() {
  const { runtime } = useVideoPlayerContext();

  return {
    handleRootKeyDown: runtime.handleRootKeyDown,
    handleVideoClick: runtime.handleVideoClick,
    handleVideoDoubleClick: runtime.handleVideoDoubleClick,
    mediaProps: runtime.mediaProps
  };
}
