import type { CSSProperties } from 'react';
import { useVideoPlayerControls } from '../context/VideoPlayerContext';
import { formatTime } from '../utils/formatTime';
import {
  ExitFullscreenIcon,
  FullscreenIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  SettingsIcon,
  VolumeIcon,
  VolumeMutedIcon
} from './icons';
import styles from './VideoPlayer.module.css';
import { VideoPlayerSettingsMenu } from './VideoPlayerSettingsMenu';

export function VideoPlayerControls() {
  const {
    currentTime,
    handleVolumeKeyDown,
    handleVolumePointerDown,
    handleVolumePointerMove,
    handleVolumePointerUp,
    includeHours,
    isCompactLayout,
    isFullscreen,
    isMenuOpen,
    isMuted,
    isPictureInPicture,
    isPictureInPictureSupported,
    isPlaying,
    labels,
    resolvedDuration,
    settingsMenuId,
    settingsButtonRef,
    toggleFullscreen,
    toggleMute,
    togglePictureInPicture,
    togglePlayback,
    toggleSettingsMenu,
    volume,
    volumeRef
  } = useVideoPlayerControls();

  return (
    <>
      <div className={styles.controlRow}>
        <div className={styles.primaryControls}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={togglePlayback}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? labels.pause : labels.play}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <div className={styles.volumeCluster}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={toggleMute}
              aria-pressed={isMuted}
              aria-label={isMuted ? labels.unmute : labels.mute}
            >
              {isMuted ? <VolumeMutedIcon /> : <VolumeIcon />}
            </button>

            {!isCompactLayout ? (
              <div className={styles.volumeControl}>
                <div
                  ref={volumeRef}
                  className={styles.volumeSlider}
                  role="slider"
                  tabIndex={0}
                  aria-label={labels.volume}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(volume * 100)}
                  aria-valuetext={`${Math.round(volume * 100)}%`}
                  data-zero={volume === 0 ? '' : undefined}
                  style={
                    {
                      '--cvp-volume-percent': `${Math.round(volume * 100)}%`
                    } as CSSProperties
                  }
                  onKeyDown={handleVolumeKeyDown}
                  onPointerDown={handleVolumePointerDown}
                  onPointerMove={handleVolumePointerMove}
                  onPointerUp={handleVolumePointerUp}
                  onPointerCancel={handleVolumePointerUp}
                >
                  <div className={styles.volumeRail} aria-hidden="true" />
                  <div
                    className={styles.volumeProgress}
                    style={{ width: `${volume * 100}%` }}
                    aria-hidden="true"
                  />
                  <div
                    className={styles.volumeThumb}
                    style={{ left: `${volume * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.timecode} aria-live="off">
            <span>{formatTime(currentTime, { includeHours })}</span>
            <span className={styles.timeDivider}>/</span>
            <span>{formatTime(resolvedDuration, { includeHours })}</span>
          </div>
        </div>

        <div className={styles.secondaryControls}>
          {isPictureInPictureSupported && !isCompactLayout ? (
            <button
              type="button"
              className={`${styles.iconButton} ${styles.secondaryActionButton}`}
              data-active={isPictureInPicture ? '' : undefined}
              onClick={() =>
                void Promise.resolve(togglePictureInPicture()).catch(
                  () => undefined
                )
              }
              aria-pressed={isPictureInPicture}
              aria-label={
                isPictureInPicture
                  ? labels.exitPictureInPicture
                  : labels.pictureInPicture
              }
            >
              <PictureInPictureIcon />
            </button>
          ) : null}

          <button
            ref={settingsButtonRef}
            type="button"
            className={`${styles.iconButton} ${styles.settingsButton}`}
            aria-label={labels.settings}
            aria-haspopup="dialog"
            aria-controls={settingsMenuId}
            aria-expanded={isMenuOpen}
            onClick={toggleSettingsMenu}
          >
            <SettingsIcon />
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={() =>
              void Promise.resolve(toggleFullscreen()).catch(() => undefined)
            }
            aria-pressed={isFullscreen}
            aria-label={
              isFullscreen ? labels.exitFullscreen : labels.fullscreen
            }
          >
            {isFullscreen ? (
              <ExitFullscreenIcon className={styles.fullscreenIcon} />
            ) : (
              <FullscreenIcon className={styles.fullscreenIcon} />
            )}
          </button>
        </div>
      </div>

      <VideoPlayerSettingsMenu />
    </>
  );
}
