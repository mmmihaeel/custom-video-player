import {
  type Dispatch,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  type SetStateAction
} from 'react';
import type {
  AnalyticsEvent,
  VideoChapter,
  VideoPlayerLabels,
  VideoPlayerMenuView,
  VideoPlayerMetadata,
  VideoPlayerState,
  VideoPlayerSettingsState,
  VideoQualityOption,
  VideoQualityValue
} from '../types/player';
import { useFullscreen } from './useFullscreen';
import { usePictureInPicture } from './usePictureInPicture';
import { getChapterForTime, getChapterSegments } from '../utils/chapters';
import { clamp } from '../utils/clamp';

type TimelinePreview = {
  chapter: VideoChapter | null;
  left: number;
  progress: number;
  time: number;
};

export type VideoPlayerMediaProps = {
  autoPlay: boolean;
  loop: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  playsInline: true;
  poster: string | undefined;
  preload: 'none' | 'metadata' | 'auto';
};

export type VideoPlayerRuntime = {
  bufferedPercent: number;
  chapterSegments: ReturnType<typeof getChapterSegments>;
  clearPreview: () => void;
  currentChapter: VideoChapter | null;
  currentTime: number;
  error: Error | null;
  handleRootKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  handleTimelineKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  handleTimelinePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handleTimelinePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handleTimelinePointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  handleVideoClick: () => void;
  handleVideoDoubleClick: () => void;
  handleVolumeKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  handleVolumePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handleVolumePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handleVolumePointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  hasStartedPlayback: boolean;
  isCompactLayout: boolean;
  isEnded: boolean;
  isFullscreen: boolean;
  isMenuOpen: boolean;
  isMuted: boolean;
  isPictureInPicture: boolean;
  isPictureInPictureSupported: boolean;
  isPlaying: boolean;
  isScrubbing: boolean;
  isWaiting: boolean;
  mediaProps: VideoPlayerMediaProps;
  menuRef: RefObject<HTMLDivElement | null>;
  menuView: VideoPlayerMenuView;
  playbackRate: number;
  playbackRateOptions: readonly number[];
  progressPercent: number;
  qualityOptions: readonly VideoQualityOption[];
  replay: () => void;
  resolvedDuration: number;
  retry: () => void;
  selectedQuality: VideoQualityValue;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
  setMenuView: Dispatch<SetStateAction<VideoPlayerMenuView>>;
  setPlaybackRate: (nextRate: number) => void;
  setQuality: (quality: VideoQualityValue) => void;
  setVolume: (nextVolume: number) => void;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
  timelinePreview: TimelinePreview | null;
  timelineRef: RefObject<HTMLDivElement | null>;
  toggleFullscreen: () => Promise<void> | void;
  toggleMute: () => void;
  togglePictureInPicture: () => Promise<void> | void;
  togglePlayback: () => void;
  toggleSettingsMenu: () => void;
  tooltipRef: RefObject<HTMLDivElement | null>;
  volume: number;
  volumeRef: RefObject<HTMLDivElement | null>;
};

type UseVideoPlayerOptions = {
  autoPlay: boolean;
  chapters: readonly VideoChapter[];
  defaultPlaybackRate: number;
  defaultVolume: number;
  durationHint: number | undefined;
  labels: VideoPlayerLabels;
  loop: boolean;
  muted: boolean;
  onBufferedChange:
    | ((payload: {
        bufferedEnd: number;
        bufferedPercent: number;
        duration: number;
      }) => void)
    | undefined;
  onChapterChange: ((chapter: VideoChapter | null) => void) | undefined;
  onAnalyticsEvent: ((event: AnalyticsEvent) => void) | undefined;
  onError: ((error: Error) => void) | undefined;
  onFullscreenChange: ((isFullscreen: boolean) => void) | undefined;
  onMuteChange: ((muted: boolean) => void) | undefined;
  onPause: (() => void) | undefined;
  onPictureInPictureChange: ((isPictureInPicture: boolean) => void) | undefined;
  onPlay: (() => void) | undefined;
  onEnded: (() => void) | undefined;
  onReady: ((metadata: VideoPlayerMetadata) => void) | undefined;
  onLoadedMetadata: ((metadata: VideoPlayerMetadata) => void) | undefined;
  onPlaybackRateChange: ((rate: number) => void) | undefined;
  onQualityChange: ((quality: VideoQualityValue) => void) | undefined;
  onStateChange: ((state: VideoPlayerState) => void) | undefined;
  onSettingsChange: ((payload: VideoPlayerSettingsState) => void) | undefined;
  onSettingsOpenChange: ((isOpen: boolean) => void) | undefined;
  onSeek: ((time: number) => void) | undefined;
  onTimeUpdate: ((time: number) => void) | undefined;
  onVolumeChange: ((volume: number) => void) | undefined;
  onWaitingChange: ((isWaiting: boolean) => void) | undefined;
  playbackRates: readonly number[] | undefined;
  poster: string | undefined;
  preload: 'none' | 'metadata' | 'auto';
  qualities: readonly VideoQualityOption[];
  retryStream: () => void;
  rootRef: RefObject<HTMLElement | null>;
  seekStep: number;
  selectedQuality: VideoQualityValue;
  setQuality: (quality: VideoQualityValue) => void;
  sourceError: Error | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const DEFAULT_PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

function getBufferedEnd(video: HTMLVideoElement) {
  try {
    if (video.buffered.length === 0) {
      return 0;
    }

    return video.buffered.end(video.buffered.length - 1);
  } catch {
    return 0;
  }
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function useVideoPlayer({
  autoPlay = false,
  chapters = [],
  defaultPlaybackRate = 1,
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
  onEnded,
  onReady,
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
  playbackRates = DEFAULT_PLAYBACK_RATES,
  poster,
  preload = 'metadata',
  qualities,
  retryStream,
  rootRef,
  seekStep = 5,
  selectedQuality,
  setQuality,
  sourceError,
  videoRef
}: UseVideoPlayerOptions): VideoPlayerRuntime {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastAudibleVolumeRef = useRef(clamp(defaultVolume, 0, 1) || 1);
  const lastChapterKeyRef = useRef<string | null>(null);
  const lastChapterValueRef = useRef<VideoChapter | null>(null);
  const hasInitializedChapterRef = useRef(false);
  const hasInitializedFullscreenRef = useRef(false);
  const didNotifyPauseRef = useRef(false);
  const pendingPlaybackRateRef = useRef<{
    fromRate: number;
    toRate: number;
  } | null>(null);
  const pendingVolumeAnalyticsRef = useRef<{
    fromMuted: boolean;
    fromVolume: number;
  } | null>(null);

  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationHint ?? 0);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(autoPlay);
  const [isEnded, setIsEnded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [isMuted, setIsMuted] = useState(muted || defaultVolume <= 0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [menuView, setMenuView] = useState<VideoPlayerMenuView>('root');
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [mediaError, setMediaError] = useState<Error | null>(null);
  const [playbackRate, setPlaybackRateState] = useState(defaultPlaybackRate);
  const [timelinePreview, setTimelinePreview] =
    useState<TimelinePreview | null>(null);
  const [volume, setVolumeState] = useState(clamp(defaultVolume, 0, 1));
  const { isFullscreen, toggleFullscreen } = useFullscreen(
    rootRef,
    videoRef,
    onFullscreenChange
  );
  const {
    isPictureInPicture,
    isPictureInPictureSupported,
    togglePictureInPicture
  } = usePictureInPicture(videoRef, onPictureInPictureChange);

  const playbackRateOptions = useMemo(
    () =>
      [...new Set([...playbackRates, 1])]
        .filter((rate) => Number.isFinite(rate) && rate > 0)
        .sort((left, right) => left - right),
    [playbackRates]
  );

  const qualityOptions = useMemo(
    () => [{ label: labels.autoQuality, value: 'auto' as const }, ...qualities],
    [labels.autoQuality, qualities]
  );

  const resolvedDuration = useMemo(() => {
    if (duration > 0) {
      return duration;
    }

    if (durationHint && durationHint > 0) {
      return durationHint;
    }

    const lastChapter = chapters[chapters.length - 1];
    return lastChapter?.end ?? 0;
  }, [chapters, duration, durationHint]);

  const chapterSegments = useMemo(
    () => getChapterSegments(chapters, resolvedDuration),
    [chapters, resolvedDuration]
  );

  const currentChapter = useMemo(
    () => getChapterForTime(chapters, currentTime),
    [chapters, currentTime]
  );

  const bufferedPercent =
    resolvedDuration > 0
      ? clamp((bufferedEnd / resolvedDuration) * 100, 0, 100)
      : 0;
  const progressPercent =
    resolvedDuration > 0
      ? clamp((currentTime / resolvedDuration) * 100, 0, 100)
      : 0;
  const error = mediaError ?? sourceError;

  const getAnalyticsSnapshot = useEffectEvent(() => {
    const video = videoRef.current;
    const nextDuration =
      video && Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : resolvedDuration;

    return {
      currentTime: video?.currentTime ?? currentTime,
      duration: nextDuration,
      timestamp: Date.now()
    };
  });

  const emitAnalyticsEvent = useEffectEvent((event: AnalyticsEvent) => {
    onAnalyticsEvent?.(event);
  });

  const syncFromVideo = useEffectEvent(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextDuration =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : resolvedDuration;
    setDuration(nextDuration);
    setCurrentTime(video.currentTime || 0);
    setBufferedEnd(getBufferedEnd(video));
    setVolumeState(video.volume);
    setIsMuted(video.muted || video.volume <= 0);
    setPlaybackRateState(video.playbackRate);
  });

  const createTimelinePreview = useEffectEvent((clientX: number) => {
    const timeline = timelineRef.current;

    if (!timeline || resolvedDuration <= 0) {
      return null;
    }

    const rect = timeline.getBoundingClientRect();

    if (rect.width <= 0) {
      return null;
    }

    const rawOffset = clamp(clientX - rect.left, 0, rect.width);
    const progress = rawOffset / rect.width;
    const nextTime = progress * resolvedDuration;
    const tooltipWidth = tooltipRef.current?.offsetWidth ?? 168;
    const left = clamp(
      rawOffset - tooltipWidth / 2,
      12,
      Math.max(12, rect.width - tooltipWidth - 12)
    );

    return {
      chapter: getChapterForTime(chapters, nextTime),
      left,
      progress,
      time: nextTime
    };
  });

  const updateTimelinePreview = useEffectEvent((clientX: number) => {
    const nextPreview = createTimelinePreview(clientX);
    setTimelinePreview(nextPreview);
    return nextPreview;
  });

  const seekTo = useEffectEvent((time: number) => {
    const video = videoRef.current;

    if (!video || resolvedDuration <= 0) {
      return;
    }

    const fromTime = video.currentTime || currentTime;
    const nextTime = clamp(time, 0, resolvedDuration);

    if (Math.abs(nextTime - fromTime) < 0.01) {
      return;
    }

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    onSeek?.(nextTime);
    onTimeUpdate?.(nextTime);
    emitAnalyticsEvent({
      type: 'seek',
      ...getAnalyticsSnapshot(),
      fromTime,
      toTime: nextTime
    });
  });

  const togglePlayback = useEffectEvent(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setMediaError(null);

    if (video.paused || video.ended) {
      void video.play().catch(() => {
        const playbackError = new Error('Playback could not be started.');
        setMediaError(playbackError);
        onError?.(playbackError);
      });
      return;
    }

    video.pause();
  });

  const setVolume = useEffectEvent((nextVolume: number) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const clampedVolume = clamp(nextVolume, 0, 1);
    const fromMuted = video.muted || video.volume <= 0;
    const fromVolume = video.volume;

    if (
      Math.abs(clampedVolume - fromVolume) < 0.001 &&
      fromMuted === (clampedVolume === 0)
    ) {
      return;
    }

    pendingVolumeAnalyticsRef.current = {
      fromMuted,
      fromVolume
    };
    video.volume = clampedVolume;
    video.muted = clampedVolume === 0;

    if (clampedVolume > 0) {
      lastAudibleVolumeRef.current = clampedVolume;
    }

    syncFromVideo();
  });

  const setVolumeFromClientX = useEffectEvent((clientX: number) => {
    const slider = volumeRef.current;

    if (!slider) {
      return;
    }

    const rect = slider.getBoundingClientRect();

    if (rect.width <= 0) {
      return;
    }

    const progress = clamp((clientX - rect.left) / rect.width, 0, 1);
    setVolume(progress);
  });

  const toggleMute = useEffectEvent(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    pendingVolumeAnalyticsRef.current = {
      fromMuted: video.muted || video.volume <= 0,
      fromVolume: video.volume
    };

    if (video.muted || video.volume === 0) {
      video.muted = false;
      video.volume = clamp(lastAudibleVolumeRef.current, 0.1, 1);
      syncFromVideo();
      return;
    }

    if (video.volume > 0) {
      lastAudibleVolumeRef.current = video.volume;
    }

    video.muted = true;
    syncFromVideo();
  });

  const setPlaybackRate = useEffectEvent((nextRate: number) => {
    const video = videoRef.current;

    if (!video || !Number.isFinite(nextRate) || nextRate <= 0) {
      return;
    }

    const fromRate = video.playbackRate;

    if (Math.abs(fromRate - nextRate) < 0.001) {
      return;
    }

    pendingPlaybackRateRef.current = {
      fromRate,
      toRate: nextRate
    };
    video.playbackRate = nextRate;
    setPlaybackRateState(nextRate);
    video.dispatchEvent(new Event('ratechange'));
  });

  const selectQuality = useEffectEvent((quality: VideoQualityValue) => {
    if (selectedQuality === quality) {
      return;
    }

    const fromQuality = selectedQuality;
    setQuality(quality);
    onQualityChange?.(quality);
    emitAnalyticsEvent({
      type: 'qualityChange',
      ...getAnalyticsSnapshot(),
      fromQuality,
      toQuality: quality
    });
  });

  const clearPreview = useEffectEvent(() => {
    if (!isScrubbing) {
      setTimelinePreview(null);
    }
  });

  const emitSettingsChange = useEffectEvent(
    (nextOpen: boolean, nextView: VideoPlayerMenuView) => {
      onSettingsOpenChange?.(nextOpen);
      onSettingsChange?.({
        isOpen: nextOpen,
        view: nextView
      });
    }
  );

  const emitBufferedChange = useEffectEvent(
    (payload: {
      bufferedEnd: number;
      bufferedPercent: number;
      duration: number;
    }) => {
      onBufferedChange?.(payload);
    }
  );

  const emitStateChange = useEffectEvent((state: VideoPlayerState) => {
    onStateChange?.(state);
  });

  const toggleSettingsMenu = useEffectEvent(() => {
    setIsMenuOpen((currentValue) => {
      const nextValue = !currentValue;

      if (nextValue) {
        setMenuView('root');
      }

      return nextValue;
    });
  });

  const handleVideoClick = useEffectEvent(() => {
    rootRef.current?.focus();
    togglePlayback();
  });

  const handleVideoDoubleClick = useEffectEvent(() => {
    void toggleFullscreen().catch(() => undefined);
  });

  const retry = useEffectEvent(() => {
    setMediaError(null);
    setIsEnded(false);
    retryStream();
  });

  const replay = useEffectEvent(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setMediaError(null);
    setIsEnded(false);
    video.currentTime = 0;
    setCurrentTime(0);

    void video.play().catch(() => {
      const playbackError = new Error('Playback could not be started.');
      setMediaError(playbackError);
      onError?.(playbackError);
    });
  });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setIsCompactLayout(false);
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 480px)');
    const syncLayout = () => {
      setIsCompactLayout(mediaQuery.matches);
    };

    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);

    return () => {
      mediaQuery.removeEventListener('change', syncLayout);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextVolume = clamp(defaultVolume, 0, 1);
    video.volume = nextVolume;
    video.muted = muted || nextVolume <= 0;
    video.playbackRate = defaultPlaybackRate;
    video.loop = loop;
    lastAudibleVolumeRef.current =
      nextVolume > 0 ? nextVolume : lastAudibleVolumeRef.current;

    syncFromVideo();
  }, [defaultPlaybackRate, defaultVolume, loop, muted, videoRef]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const handlePlay = () => {
      didNotifyPauseRef.current = false;
      setHasStartedPlayback(true);
      setIsEnded(false);
      setIsPlaying(true);
      setIsWaiting(false);
      onPlay?.();
      emitAnalyticsEvent({
        type: 'play',
        ...getAnalyticsSnapshot(),
        isMuted: video.muted || video.volume <= 0,
        playbackRate: video.playbackRate,
        selectedQuality,
        volume: video.volume
      });
    };

    const handlePause = () => {
      setIsPlaying(false);

      if (didNotifyPauseRef.current) {
        return;
      }

      didNotifyPauseRef.current = true;

      if (video.ended) {
        onPause?.();
        return;
      }

      onPause?.();
      emitAnalyticsEvent({
        type: 'pause',
        ...getAnalyticsSnapshot(),
        isMuted: video.muted || video.volume <= 0,
        playbackRate: video.playbackRate,
        selectedQuality,
        volume: video.volume
      });
    };

    const handleEnded = () => {
      setHasStartedPlayback(true);
      setIsEnded(true);
      setIsPlaying(false);

      if (!didNotifyPauseRef.current) {
        didNotifyPauseRef.current = true;
        onPause?.();
      }

      onEnded?.();
      emitAnalyticsEvent({
        type: 'ended',
        ...getAnalyticsSnapshot(),
        isMuted: video.muted || video.volume <= 0,
        playbackRate: video.playbackRate,
        selectedQuality,
        volume: video.volume
      });
    };

    const handleWaiting = () => {
      setIsWaiting(true);
      onWaitingChange?.(true);
    };

    const handleReady = () => {
      setIsWaiting(false);
      onWaitingChange?.(false);
      syncFromVideo();
    };

    const handleLoadedMetadata = () => {
      syncFromVideo();
      const metadata = {
        duration:
          Number.isFinite(video.duration) && video.duration > 0
            ? video.duration
            : resolvedDuration,
        qualities,
        selectedQuality,
        video
      };

      onLoadedMetadata?.(metadata);
      onReady?.(metadata);
    };

    const handleVolumeChange = () => {
      syncFromVideo();
      onVolumeChange?.(video.volume);
      onMuteChange?.(video.muted || video.volume <= 0);

      if (!pendingVolumeAnalyticsRef.current) {
        return;
      }

      const pending = pendingVolumeAnalyticsRef.current;
      pendingVolumeAnalyticsRef.current = null;
      emitAnalyticsEvent({
        type: 'volumeChange',
        ...getAnalyticsSnapshot(),
        fromMuted: pending.fromMuted,
        fromVolume: pending.fromVolume,
        toMuted: video.muted || video.volume <= 0,
        toVolume: video.volume
      });
    };

    const handleRateChange = () => {
      syncFromVideo();

      if (!pendingPlaybackRateRef.current) {
        return;
      }

      const pending = pendingPlaybackRateRef.current;
      pendingPlaybackRateRef.current = null;
      onPlaybackRateChange?.(video.playbackRate);
      emitAnalyticsEvent({
        type: 'speedChange',
        ...getAnalyticsSnapshot(),
        fromRate: pending.fromRate,
        toRate: video.playbackRate
      });
    };

    const handleProgress = () => {
      syncFromVideo();
    };

    const handleTimeUpdate = () => {
      syncFromVideo();
      onTimeUpdate?.(video.currentTime || 0);
    };

    const handleMediaError = () => {
      if (!video.error) {
        return;
      }

      const playbackError = new Error(
        video.error.message || labels.streamError
      );
      setMediaError(playbackError);
      onError?.(playbackError);
    };

    const events: Array<[keyof HTMLMediaElementEventMap, EventListener]> = [
      ['canplay', handleReady],
      ['durationchange', syncFromVideo],
      ['ended', handleEnded],
      ['error', handleMediaError],
      ['loadedmetadata', handleLoadedMetadata],
      ['pause', handlePause],
      ['play', handlePlay],
      ['playing', handleReady],
      ['progress', handleProgress],
      ['ratechange', handleRateChange],
      ['seeked', handleReady],
      ['seeking', handleWaiting],
      ['timeupdate', handleTimeUpdate],
      ['volumechange', handleVolumeChange],
      ['waiting', handleWaiting]
    ];

    for (const [eventName, listener] of events) {
      video.addEventListener(eventName, listener);
    }

    syncFromVideo();

    return () => {
      for (const [eventName, listener] of events) {
        video.removeEventListener(eventName, listener);
      }
    };
  }, [
    labels.streamError,
    onError,
    onMuteChange,
    onEnded,
    onPause,
    onPlay,
    onPlaybackRateChange,
    onReady,
    onWaitingChange,
    onLoadedMetadata,
    onAnalyticsEvent,
    qualities,
    resolvedDuration,
    selectedQuality,
    onTimeUpdate,
    onVolumeChange,
    videoRef
  ]);

  useEffect(() => {
    if (!isPlaying && !isScrubbing) {
      return;
    }

    let frame = 0;

    const loopFrame = () => {
      syncFromVideo();

      if ((isPlaying && !videoRef.current?.paused) || isScrubbing) {
        frame = window.requestAnimationFrame(loopFrame);
      }
    };

    frame = window.requestAnimationFrame(loopFrame);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isPlaying, isScrubbing, videoRef]);

  useEffect(() => {
    const key = currentChapter
      ? `${currentChapter.id ?? currentChapter.title}:${currentChapter.start}:${currentChapter.end}`
      : null;

    if (key === lastChapterKeyRef.current) {
      return;
    }

    lastChapterKeyRef.current = key;
    onChapterChange?.(currentChapter);

    if (!hasInitializedChapterRef.current) {
      hasInitializedChapterRef.current = true;
      lastChapterValueRef.current = currentChapter;
      return;
    }

    emitAnalyticsEvent({
      type: 'chapterChange',
      ...getAnalyticsSnapshot(),
      fromChapter: lastChapterValueRef.current,
      toChapter: currentChapter
    });
    lastChapterValueRef.current = currentChapter;
  }, [currentChapter, onChapterChange]);

  useEffect(() => {
    if (!isMenuOpen) {
      setMenuView('root');
    }
  }, [isMenuOpen]);

  useEffect(() => {
    emitSettingsChange(isMenuOpen, menuView);
  }, [isMenuOpen, menuView]);

  useEffect(() => {
    emitBufferedChange({
      bufferedEnd,
      bufferedPercent,
      duration: resolvedDuration
    });
  }, [bufferedEnd, bufferedPercent, resolvedDuration]);

  useEffect(() => {
    emitStateChange({
      bufferedEnd,
      bufferedPercent,
      currentChapter,
      currentTime,
      duration: resolvedDuration,
      isFullscreen,
      isMuted,
      isPictureInPicture,
      isPlaying,
      isSettingsOpen: isMenuOpen,
      isWaiting,
      menuView,
      playbackRate,
      selectedQuality,
      volume
    });
  }, [
    bufferedEnd,
    bufferedPercent,
    currentChapter,
    currentTime,
    isFullscreen,
    isMenuOpen,
    isMuted,
    isPictureInPicture,
    isPlaying,
    isWaiting,
    menuView,
    playbackRate,
    resolvedDuration,
    selectedQuality,
    volume
  ]);

  useEffect(() => {
    if (!hasInitializedFullscreenRef.current) {
      hasInitializedFullscreenRef.current = true;
      return;
    }

    emitAnalyticsEvent({
      type: 'fullscreenToggle',
      ...getAnalyticsSnapshot(),
      isFullscreen
    });
  }, [isFullscreen]);

  useEffect(() => {
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const menu = menuRef.current;
      const button = settingsButtonRef.current;
      const target = event.target as Node;

      if (
        isMenuOpen &&
        (!menu || !menu.contains(target)) &&
        (!button || !button.contains(target))
      ) {
        setIsMenuOpen(false);
        setMenuView('root');
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (menuView !== 'root') {
          setMenuView('root');
          return;
        }

        setIsMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, menuView]);

  const handleTimelinePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    setIsScrubbing(true);
    const preview = updateTimelinePreview(event.clientX);

    if (preview) {
      seekTo(preview.time);
    } else if (resolvedDuration > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      seekTo(((event.clientX - rect.left) / rect.width) * resolvedDuration);
    }
  };

  const handleTimelinePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const preview = updateTimelinePreview(event.clientX);

    if (isScrubbing && preview) {
      seekTo(preview.time);
    }
  };

  const handleTimelinePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (timelinePreview) {
      seekTo(timelinePreview.time);
    }

    setIsScrubbing(false);
  };

  const handleTimelineKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (resolvedDuration <= 0) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      seekTo(currentTime - seekStep);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation();
      seekTo(currentTime + seekStep);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      event.stopPropagation();
      seekTo(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      event.stopPropagation();
      seekTo(resolvedDuration);
    }
  };

  const handleVolumePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    setVolumeFromClientX(event.clientX);
  };

  const handleVolumePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    setVolumeFromClientX(event.clientX);
  };

  const handleVolumePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setVolumeFromClientX(event.clientX);
  };

  const handleVolumeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      setVolume(volume - 0.05);
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      setVolume(volume + 0.05);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      event.stopPropagation();
      setVolume(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      event.stopPropagation();
      setVolume(1);
    }
  };

  const handleRootKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    if (
      event.target instanceof HTMLButtonElement &&
      (event.key === ' ' || event.key === 'Enter')
    ) {
      return;
    }

    if (event.key === ' ' || event.key.toLowerCase() === 'k') {
      event.preventDefault();
      togglePlayback();
      return;
    }

    if (event.key.toLowerCase() === 'm') {
      event.preventDefault();
      toggleMute();
      return;
    }

    if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      void toggleFullscreen().catch(() => undefined);
      return;
    }

    if (
      event.key.toLowerCase() === 'i' &&
      isPictureInPictureSupported &&
      !isFullscreen
    ) {
      event.preventDefault();
      void togglePictureInPicture().catch(() => undefined);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setVolume(volume + 0.05);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setVolume(volume - 0.05);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      seekTo(currentTime - seekStep);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      seekTo(currentTime + seekStep);
    }
  };

  return {
    bufferedPercent,
    chapterSegments,
    currentChapter,
    currentTime,
    error,
    handleRootKeyDown,
    handleTimelineKeyDown,
    handleTimelinePointerDown,
    handleTimelinePointerMove,
    handleTimelinePointerUp,
    hasStartedPlayback,
    isCompactLayout,
    isEnded,
    handleVolumeKeyDown,
    handleVolumePointerDown,
    handleVolumePointerMove,
    handleVolumePointerUp,
    handleVideoClick,
    handleVideoDoubleClick,
    isFullscreen,
    isMenuOpen,
    isMuted,
    isPlaying,
    isPictureInPicture,
    isPictureInPictureSupported,
    isScrubbing,
    isWaiting,
    menuView,
    mediaProps: {
      autoPlay,
      loop,
      onClick: handleVideoClick,
      onDoubleClick: handleVideoDoubleClick,
      playsInline: true,
      poster,
      preload
    },
    menuRef,
    playbackRate,
    playbackRateOptions,
    progressPercent,
    qualityOptions,
    resolvedDuration,
    replay,
    retry,
    selectedQuality,
    setIsMenuOpen,
    setMenuView,
    setPlaybackRate,
    setQuality: selectQuality,
    setVolume,
    settingsButtonRef,
    timelinePreview,
    timelineRef,
    togglePictureInPicture,
    toggleFullscreen,
    toggleMute,
    togglePlayback,
    toggleSettingsMenu,
    tooltipRef,
    volumeRef,
    volume,
    clearPreview
  };
}
