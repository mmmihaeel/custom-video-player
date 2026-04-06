import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useVideoPlayerSettings } from '../context/VideoPlayerContext';
import styles from './VideoPlayer.module.css';

function formatPlaybackRate(rate: number) {
  return `${rate}x`;
}

export function VideoPlayerSettingsMenu() {
  const {
    currentPlaybackRateLabel,
    isCompactLayout,
    isMenuOpen,
    isPictureInPicture,
    isPictureInPictureSupported,
    labels,
    menuRef,
    menuView,
    playbackRate,
    playbackRateOptions,
    qualityOptions,
    selectedQuality,
    selectedQualityLabel,
    setIsMenuOpen,
    setMenuView,
    setPlaybackRate,
    setQuality,
    settingsMenuId,
    togglePictureInPicture
  } = useVideoPlayerSettings();

  if (!isMenuOpen) {
    return null;
  }

  return (
    <>
      {isCompactLayout ? (
        <div
          className={styles.menuBackdrop}
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div
        ref={menuRef}
        id={settingsMenuId}
        className={styles.menu}
        role="dialog"
        aria-label={labels.settings}
      >
        {menuView === 'root' ? (
          <div className={styles.menuSection}>
            <button
              type="button"
              className={styles.settingsRow}
              onClick={() => setMenuView('quality')}
            >
              <span className={styles.settingsRowLabel}>{labels.quality}</span>
              <span className={styles.settingsRowValue}>
                {selectedQualityLabel}
              </span>
              <ChevronRightIcon className={styles.settingsRowArrow} />
            </button>

            <button
              type="button"
              className={styles.settingsRow}
              onClick={() => setMenuView('speed')}
            >
              <span className={styles.settingsRowLabel}>
                {labels.playbackSpeed}
              </span>
              <span className={styles.settingsRowValue}>
                {currentPlaybackRateLabel}
              </span>
              <ChevronRightIcon className={styles.settingsRowArrow} />
            </button>

            <div className={styles.compactMenuActions}>
              {isPictureInPictureSupported ? (
                <button
                  type="button"
                  className={styles.menuOption}
                  data-active={isPictureInPicture ? '' : undefined}
                  onClick={() => {
                    void Promise.resolve(togglePictureInPicture()).catch(
                      () => undefined
                    );
                    setIsMenuOpen(false);
                  }}
                >
                  <span>{labels.pictureInPicture}</span>
                  {isPictureInPicture ? (
                    <span className={styles.optionMeta}>Active</span>
                  ) : null}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {menuView === 'quality' ? (
          <div className={styles.menuSection}>
            <div className={styles.menuHeader}>
              <button
                type="button"
                className={styles.menuBackButton}
                onClick={() => setMenuView('root')}
                aria-label={labels.back}
              >
                <ChevronLeftIcon />
              </button>
              <p className={styles.menuTitle}>{labels.quality}</p>
            </div>

            <div className={styles.optionList}>
              {qualityOptions.map((qualityOption) => (
                <button
                  key={qualityOption.value}
                  type="button"
                  className={styles.menuOption}
                  data-active={
                    selectedQuality === qualityOption.value ? '' : undefined
                  }
                  onClick={() => {
                    setQuality(qualityOption.value);
                    setIsMenuOpen(false);
                  }}
                >
                  <span>{qualityOption.label}</span>
                  {selectedQuality === qualityOption.value ? (
                    <span className={styles.optionMeta}>Current</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {menuView === 'speed' ? (
          <div className={styles.menuSection}>
            <div className={styles.menuHeader}>
              <button
                type="button"
                className={styles.menuBackButton}
                onClick={() => setMenuView('root')}
                aria-label={labels.back}
              >
                <ChevronLeftIcon />
              </button>
              <p className={styles.menuTitle}>{labels.playbackSpeed}</p>
            </div>

            <div className={styles.optionList}>
              {playbackRateOptions.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={styles.menuOption}
                  data-active={playbackRate === rate ? '' : undefined}
                  onClick={() => {
                    setPlaybackRate(rate);
                    setIsMenuOpen(false);
                  }}
                >
                  <span>{formatPlaybackRate(rate)}</span>
                  {playbackRate === rate ? (
                    <span className={styles.optionMeta}>Current</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
