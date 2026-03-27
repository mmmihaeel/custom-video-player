import { useEffect, useEffectEvent, useState, type RefObject } from 'react';

export function useFullscreen(
  targetRef: RefObject<HTMLElement | null>,
  onChange?: (isFullscreen: boolean) => void
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenChange = useEffectEvent(() => {
    const nextValue = document.fullscreenElement === targetRef.current;
    setIsFullscreen(nextValue);
    onChange?.(nextValue);
  });

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useEffectEvent(async () => {
    const target = targetRef.current;

    if (!target || !target.requestFullscreen) {
      return;
    }

    try {
      if (document.fullscreenElement === target) {
        await document.exitFullscreen?.();
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      }

      await target.requestFullscreen();
    } catch {
      // Ignore rejected fullscreen requests caused by browser policy.
    }
  });

  return {
    isFullscreen,
    toggleFullscreen
  };
}
