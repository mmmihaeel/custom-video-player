import { PlayIcon, ReplayIcon } from './icons';
import {
  useVideoPlayerControls,
  useVideoPlayerState
} from '../context/VideoPlayerContext';
import styles from './VideoPlayer.module.css';

export function VideoPlayerCenterOverlay() {
  const { togglePlayback } = useVideoPlayerControls();
  const {
    error,
    hasStartedPlayback,
    isEnded,
    isPlaying,
    isWaiting,
    labels,
    replay
  } = useVideoPlayerState();

  if (error || isWaiting || !hasStartedPlayback) {
    return null;
  }

  if (isEnded) {
    return (
      <div className={styles.centerActionLayer}>
        <button
          type="button"
          className={styles.centerActionButton}
          onClick={replay}
          aria-label={labels.replay}
        >
          <ReplayIcon className={styles.centerActionIcon} />
        </button>
      </div>
    );
  }

  if (isPlaying) {
    return null;
  }

  return (
    <div className={styles.centerActionLayer}>
      <button
        type="button"
        className={styles.centerActionButton}
        onClick={togglePlayback}
        aria-label={labels.play}
      >
        <PlayIcon className={styles.centerActionIcon} />
      </button>
    </div>
  );
}
