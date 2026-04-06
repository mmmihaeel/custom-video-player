import type { CSSProperties, RefObject } from 'react';
import {
  useVideoPlayerCallbacks,
  useVideoPlayerState
} from '../context/VideoPlayerContext';
import styles from './VideoPlayer.module.css';
import { VideoPlayerCenterOverlay } from './VideoPlayerCenterOverlay';
import { VideoPlayerControls } from './VideoPlayerControls';
import { VideoPlayerTimeline } from './VideoPlayerTimeline';

type VideoPlayerLayoutProps = {
  rootClassName: string;
  rootRef: RefObject<HTMLElement | null>;
  rootStyle: CSSProperties;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function VideoPlayerLayout({
  rootClassName,
  rootRef,
  rootStyle,
  videoRef
}: VideoPlayerLayoutProps) {
  const { handleRootKeyDown, mediaProps } = useVideoPlayerCallbacks();
  const { error, isFullscreen, isWaiting, labels, retry } =
    useVideoPlayerState();

  return (
    <section
      ref={rootRef}
      className={rootClassName}
      data-fullscreen={isFullscreen ? '' : undefined}
      style={rootStyle}
      tabIndex={0}
      onKeyDown={handleRootKeyDown}
      aria-label="Video player"
    >
      <div
        className={styles.surface}
        data-fullscreen={isFullscreen ? '' : undefined}
      >
        <video ref={videoRef} className={styles.video} {...mediaProps} />

        <div className={styles.scrim} aria-hidden="true" />

        {isWaiting && !error ? (
          <div className={styles.loadingState} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            <span>{labels.loading}</span>
          </div>
        ) : null}

        {error ? (
          <div className={styles.errorState} role="alert">
            <p className={styles.errorTitle}>{labels.streamError}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={retry}
            >
              {labels.retry}
            </button>
          </div>
        ) : null}

        <VideoPlayerCenterOverlay />

        <div className={styles.controls}>
          <VideoPlayerTimeline />
          <VideoPlayerControls />
        </div>
      </div>
    </section>
  );
}
