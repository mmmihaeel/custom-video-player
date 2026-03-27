import { useEffect, useEffectEvent, useState, type RefObject } from 'react';

function supportsPictureInPicture(video: HTMLVideoElement | null) {
  return Boolean(
    video &&
    'pictureInPictureEnabled' in document &&
    document.pictureInPictureEnabled &&
    'requestPictureInPicture' in video &&
    !video.disablePictureInPicture
  );
}

export function usePictureInPicture(
  videoRef: RefObject<HTMLVideoElement | null>,
  onChange?: (isActive: boolean) => void
) {
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [isPictureInPictureSupported, setIsPictureInPictureSupported] =
    useState(false);

  const syncState = useEffectEvent(() => {
    const video = videoRef.current;
    const isSupported = supportsPictureInPicture(video);
    const isActive = document.pictureInPictureElement === video;

    setIsPictureInPictureSupported(isSupported);
    setIsPictureInPicture(isActive);
    onChange?.(isActive);
  });

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      setIsPictureInPicture(false);
      setIsPictureInPictureSupported(false);
      return;
    }

    const handleStateChange = () => {
      syncState();
    };

    video.addEventListener(
      'enterpictureinpicture',
      handleStateChange as EventListener
    );
    video.addEventListener(
      'leavepictureinpicture',
      handleStateChange as EventListener
    );

    syncState();

    return () => {
      video.removeEventListener(
        'enterpictureinpicture',
        handleStateChange as EventListener
      );
      video.removeEventListener(
        'leavepictureinpicture',
        handleStateChange as EventListener
      );
    };
  }, [videoRef]);

  const togglePictureInPicture = useEffectEvent(async () => {
    const video = videoRef.current;

    if (!video || !supportsPictureInPicture(video)) {
      return;
    }

    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture?.();
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      }

      await video.requestPictureInPicture();
    } catch {
      // Ignore rejected Picture-in-Picture requests caused by browser policy.
    }
  });

  return {
    isPictureInPicture,
    isPictureInPictureSupported,
    togglePictureInPicture
  };
}
