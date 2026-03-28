import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type RefObject
} from 'react';

type FullscreenVideoElement = HTMLVideoElement & {
  webkitDisplayingFullscreen?: boolean;
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
};

type OrientationLockValue =
  | 'any'
  | 'landscape'
  | 'landscape-primary'
  | 'landscape-secondary'
  | 'natural'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary';

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: OrientationLockValue) => Promise<void>;
  unlock?: () => void;
};

export function useFullscreen(
  targetRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  onChange?: (isFullscreen: boolean) => void
) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const didLockOrientationRef = useRef(false);

  const unlockOrientation = useEffectEvent(() => {
    const orientation = window.screen.orientation as LockableScreenOrientation;

    if (!didLockOrientationRef.current) {
      return;
    }

    try {
      orientation.unlock?.();
    } catch {
      // Ignore orientation unlock rejections caused by browser policy.
    } finally {
      didLockOrientationRef.current = false;
    }
  });

  const lockOrientation = useEffectEvent(async () => {
    const orientation = window.screen.orientation as LockableScreenOrientation;

    if (
      !window.matchMedia?.('(pointer: coarse)').matches ||
      typeof orientation.lock !== 'function'
    ) {
      return;
    }

    try {
      await orientation.lock('landscape');
      didLockOrientationRef.current = true;
    } catch {
      // Ignore orientation lock rejections caused by browser policy.
    }
  });

  const handleFullscreenChange = useEffectEvent(() => {
    const nextValue = document.fullscreenElement === targetRef.current;
    setIsFullscreen(nextValue);

    if (!nextValue) {
      unlockOrientation();
    }

    onChange?.(nextValue);
  });

  const handleNativeFullscreenChange = useEffectEvent(() => {
    const video = videoRef.current as FullscreenVideoElement | null;
    const nextValue = Boolean(video?.webkitDisplayingFullscreen);
    setIsFullscreen(nextValue);

    if (!nextValue) {
      unlockOrientation();
    }

    onChange?.(nextValue);
  });

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current as FullscreenVideoElement | null;

    if (!video) {
      return;
    }

    video.addEventListener(
      'webkitbeginfullscreen',
      handleNativeFullscreenChange
    );
    video.addEventListener('webkitendfullscreen', handleNativeFullscreenChange);

    return () => {
      video.removeEventListener(
        'webkitbeginfullscreen',
        handleNativeFullscreenChange
      );
      video.removeEventListener(
        'webkitendfullscreen',
        handleNativeFullscreenChange
      );
    };
  }, [videoRef]);

  const toggleFullscreen = useEffectEvent(async () => {
    const target = targetRef.current;
    const video = videoRef.current as FullscreenVideoElement | null;

    if (!target) {
      return;
    }

    try {
      if (document.fullscreenElement === target) {
        await document.exitFullscreen?.();
        return;
      }

      if (video?.webkitDisplayingFullscreen && video.webkitExitFullscreen) {
        video.webkitExitFullscreen();
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      }

      if (typeof target.requestFullscreen === 'function') {
        await target.requestFullscreen({ navigationUI: 'hide' });
        await lockOrientation();
        return;
      }

      if (typeof video?.webkitEnterFullscreen === 'function') {
        video.webkitEnterFullscreen();
        return;
      }
    } catch {
      if (typeof video?.webkitEnterFullscreen === 'function') {
        try {
          video.webkitEnterFullscreen();
        } catch {
          // Ignore rejected fullscreen requests caused by browser policy.
        }
      }
    }
  });

  return {
    isFullscreen,
    toggleFullscreen
  };
}
