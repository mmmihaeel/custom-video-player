import type Hls from 'hls.js';
import type { ErrorData, Level } from 'hls.js';
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type RefObject
} from 'react';
import type {
  VideoQualityOption,
  VideoQualityValue,
  VideoSource
} from '../types/player';
import {
  buildQualityOptions,
  getLevelValue,
  resolveLevelIndex
} from '../utils/quality';

type UseHlsOptions = {
  defaultQuality: VideoQualityValue;
  onError?: ((error: Error) => void) | undefined;
  source: VideoSource;
  videoRef: RefObject<HTMLVideoElement | null>;
};

type UseHlsResult = {
  error: Error | null;
  qualities: VideoQualityOption[];
  retry: () => void;
  selectedQuality: VideoQualityValue;
  setQuality: (quality: VideoQualityValue) => void;
};

const MAX_MEDIA_RECOVERIES = 2;
const MAX_NETWORK_RECOVERIES = 2;

function createStreamError(data?: ErrorData) {
  const reason = data?.details ?? data?.type ?? 'unknown error';
  return new Error(`Unable to load the HLS stream: ${reason}.`);
}

export function useHls({
  defaultQuality,
  onError,
  source,
  videoRef
}: UseHlsOptions): UseHlsResult {
  const hlsRef = useRef<Hls | null>(null);
  const levelsRef = useRef<Level[]>([]);
  const mediaRecoveriesRef = useRef(0);
  const networkRecoveriesRef = useRef(0);
  const preferredQualityRef = useRef<VideoQualityValue>(defaultQuality);

  const [error, setError] = useState<Error | null>(null);
  const [qualities, setQualities] = useState<VideoQualityOption[]>([]);
  const [selectedQuality, setSelectedQuality] =
    useState<VideoQualityValue>(defaultQuality);

  const emitError = useEffectEvent((nextError: Error) => {
    setError(nextError);
    onError?.(nextError);
  });

  const applyQuality = useEffectEvent((quality: VideoQualityValue) => {
    preferredQualityRef.current = quality;

    const hls = hlsRef.current;

    if (!hls) {
      setSelectedQuality('auto');
      return;
    }

    const nextLevelIndex = resolveLevelIndex(quality, levelsRef.current);

    if (quality === 'auto' || nextLevelIndex < 0) {
      hls.nextLevel = -1;
      hls.currentLevel = -1;
      setSelectedQuality('auto');
      return;
    }

    hls.nextLevel = nextLevelIndex;
    hls.currentLevel = nextLevelIndex;
    setSelectedQuality(quality);
  });

  const resetState = useEffectEvent(() => {
    mediaRecoveriesRef.current = 0;
    networkRecoveriesRef.current = 0;
    levelsRef.current = [];
    setError(null);
    setQualities([]);
  });

  const destroyInstance = useEffectEvent(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  });

  const retry = useEffectEvent(() => {
    setError(null);

    const hls = hlsRef.current;

    if (hls) {
      mediaRecoveriesRef.current = 0;
      networkRecoveriesRef.current = 0;
      hls.startLoad(-1);
      applyQuality(preferredQualityRef.current);
      return;
    }

    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.load();
  });

  useEffect(() => {
    preferredQualityRef.current = defaultQuality;
    setSelectedQuality(defaultQuality);
  }, [defaultQuality]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    resetState();
    setSelectedQuality(defaultQuality);
    let cancelled = false;

    const cleanup = () => {
      destroyInstance();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source.src;
      video.load();
      return cleanup;
    }

    void import('hls.js')
      .then(({ default: HlsRuntime }) => {
        if (cancelled) {
          return;
        }

        if (!HlsRuntime.isSupported()) {
          emitError(new Error('This browser does not support HLS playback.'));
          return;
        }

        const hls = new HlsRuntime({
          backBufferLength: 60,
          enableWorker: true
        });

        hlsRef.current = hls;

        hls.on(HlsRuntime.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(source.src);
        });

        hls.on(HlsRuntime.Events.MANIFEST_PARSED, () => {
          levelsRef.current = [...hls.levels];
          setQualities(buildQualityOptions(hls.levels));
          setError(null);
          applyQuality(preferredQualityRef.current);
        });

        hls.on(HlsRuntime.Events.LEVEL_SWITCHED, (_, data) => {
          if (preferredQualityRef.current === 'auto') {
            setSelectedQuality('auto');
            return;
          }

          const nextLevel = hls.levels[data.level];

          if (!nextLevel) {
            setSelectedQuality('auto');
            return;
          }

          setSelectedQuality(getLevelValue(nextLevel));
        });

        hls.on(HlsRuntime.Events.ERROR, (_, data) => {
          if (!data.fatal) {
            return;
          }

          if (
            data.type === HlsRuntime.ErrorTypes.NETWORK_ERROR &&
            networkRecoveriesRef.current < MAX_NETWORK_RECOVERIES
          ) {
            networkRecoveriesRef.current += 1;
            hls.startLoad();
            return;
          }

          if (
            data.type === HlsRuntime.ErrorTypes.MEDIA_ERROR &&
            mediaRecoveriesRef.current < MAX_MEDIA_RECOVERIES
          ) {
            mediaRecoveriesRef.current += 1;
            hls.recoverMediaError();
            return;
          }

          emitError(createStreamError(data));
        });

        hls.attachMedia(video);
      })
      .catch(() => {
        if (!cancelled) {
          emitError(new Error('This browser does not support HLS playback.'));
        }
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [defaultQuality, source.src, videoRef]);

  return {
    error,
    qualities,
    retry,
    selectedQuality,
    setQuality: applyQuality
  };
}
