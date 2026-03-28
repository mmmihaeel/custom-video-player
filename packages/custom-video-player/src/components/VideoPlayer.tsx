import { useId, useMemo, useRef, type CSSProperties } from 'react';
import type {
  VideoPlayerLabels,
  VideoPlayerProps,
  VideoPlayerTheme,
  VideoQualityValue
} from '../types/player';
import { useHls } from '../hooks/useHls';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { normalizeChapters } from '../utils/chapters';
import { formatTime } from '../utils/formatTime';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExitFullscreenIcon,
  FullscreenIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  ReplayIcon,
  SettingsIcon,
  VolumeIcon,
  VolumeMutedIcon
} from './icons';
import styles from './VideoPlayer.module.css';

type RootStyle = CSSProperties & Partial<Record<`--cvp-${string}`, string>>;

const DEFAULT_LABELS: VideoPlayerLabels = {
  autoQuality: 'Auto',
  back: 'Back',
  exitFullscreen: 'Exit fullscreen',
  exitPictureInPicture: 'Exit picture in picture',
  fullscreen: 'Enter fullscreen',
  loading: 'Loading stream',
  mute: 'Mute audio',
  pause: 'Pause',
  pictureInPicture: 'Picture in picture',
  play: 'Play',
  playbackSpeed: 'Playback speed',
  quality: 'Quality',
  replay: 'Replay',
  retry: 'Retry',
  settings: 'Playback settings',
  streamError: 'We could not load this stream.',
  timeline: 'Timeline',
  unmute: 'Unmute audio',
  volume: 'Volume'
};

function formatPlaybackRate(rate: number) {
  return `${rate}x`;
}

function resolveQualityLabel(
  selectedQuality: VideoQualityValue,
  autoLabel: string
) {
  if (selectedQuality === 'auto') {
    return autoLabel;
  }

  return `${selectedQuality}p`;
}

function buildThemeStyle(
  theme: Partial<VideoPlayerTheme> | undefined
): RootStyle | undefined {
  if (!theme) {
    return undefined;
  }

  const themeStyle: RootStyle = {};

  if (theme.controlColor) {
    themeStyle['--cvp-control'] = theme.controlColor;
  }

  if (theme.menuBackground) {
    themeStyle['--cvp-menu'] = theme.menuBackground;
  }

  if (theme.menuBorderColor) {
    themeStyle['--cvp-menu-border'] = theme.menuBorderColor;
  }

  if (theme.railColor) {
    themeStyle['--cvp-rail'] = theme.railColor;
  }

  if (theme.bufferedColor) {
    themeStyle['--cvp-buffered'] = theme.bufferedColor;
  }

  if (theme.chapterMarkerColor) {
    themeStyle['--cvp-segment'] = theme.chapterMarkerColor;
  }

  if (theme.shadowColor) {
    themeStyle['--cvp-shadow'] = theme.shadowColor;
  }

  if (theme.surfaceBackground) {
    themeStyle['--cvp-surface'] = theme.surfaceBackground;
  }

  return themeStyle;
}

export function VideoPlayer({
  autoPlay = false,
  chapters = [],
  className,
  defaultPlaybackRate = 1,
  defaultQuality = 'auto',
  defaultVolume = 1,
  durationHint,
  labels,
  loop = false,
  muted = false,
  onChapterChange,
  onError,
  onFullscreenChange,
  onMuteChange,
  onPause,
  onPictureInPictureChange,
  onPlay,
  onReady,
  onBufferedChange,
  onEnded,
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
  playbackRates,
  poster,
  preload = 'metadata',
  seekStep = 5,
  source,
  theme,
  style
}: VideoPlayerProps) {
  const normalizedChapters = useMemo(
    () => normalizeChapters(chapters, durationHint),
    [chapters, durationHint]
  );
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
  const rootRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const settingsMenuId = useId();

  const {
    error: sourceError,
    qualities,
    retry: retryStream,
    selectedQuality,
    setQuality
  } = useHls({
    defaultQuality,
    onError,
    source,
    videoRef
  });

  const player = useVideoPlayer({
    autoPlay,
    chapters: normalizedChapters,
    defaultPlaybackRate,
    defaultVolume,
    durationHint,
    labels: resolvedLabels,
    loop,
    muted,
    onChapterChange,
    onError,
    onFullscreenChange,
    onMuteChange,
    onPause,
    onPictureInPictureChange,
    onPlay,
    onReady,
    onBufferedChange,
    onEnded,
    onLoadedMetadata,
    onPlaybackRateChange,
    onStateChange,
    onSettingsChange,
    onSettingsOpenChange,
    onSeek,
    onTimeUpdate,
    onVolumeChange,
    onWaitingChange,
    playbackRates,
    poster,
    preload,
    qualities,
    retryStream,
    rootRef,
    seekStep,
    selectedQuality,
    setQuality: (quality) => {
      setQuality(quality);
      onQualityChange?.(quality);
    },
    sourceError,
    videoRef
  });

  const rootClassName = [styles.root, className].filter(Boolean).join(' ');
  const rootStyle = useMemo<RootStyle>(
    () => ({
      ...buildThemeStyle(theme),
      ...style
    }),
    [style, theme]
  );
  const includeHours = player.resolvedDuration >= 3600;
  const selectedQualityLabel = resolveQualityLabel(
    player.selectedQuality,
    resolvedLabels.autoQuality
  );
  const currentPlaybackRateLabel = formatPlaybackRate(player.playbackRate);

  return (
    <section
      ref={rootRef}
      className={rootClassName}
      data-fullscreen={player.isFullscreen ? '' : undefined}
      style={rootStyle}
      tabIndex={0}
      onKeyDown={player.handleRootKeyDown}
      aria-label="Video player"
    >
      <div
        className={styles.surface}
        data-fullscreen={player.isFullscreen ? '' : undefined}
      >
        <video ref={videoRef} className={styles.video} {...player.mediaProps} />

        <div className={styles.scrim} aria-hidden="true" />

        {player.isWaiting && !player.error ? (
          <div className={styles.loadingState} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            <span>{resolvedLabels.loading}</span>
          </div>
        ) : null}

        {player.error ? (
          <div className={styles.errorState} role="alert">
            <p className={styles.errorTitle}>{resolvedLabels.streamError}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={player.retry}
            >
              {resolvedLabels.retry}
            </button>
          </div>
        ) : null}

        {!player.error && !player.isWaiting && player.hasStartedPlayback ? (
          <div className={styles.centerActionLayer}>
            {player.isEnded ? (
              <button
                type="button"
                className={styles.centerActionButton}
                onClick={player.replay}
                aria-label={resolvedLabels.replay}
              >
                <ReplayIcon className={styles.centerActionIcon} />
              </button>
            ) : !player.isPlaying ? (
              <button
                type="button"
                className={styles.centerActionButton}
                onClick={player.togglePlayback}
                aria-label={resolvedLabels.play}
              >
                <PlayIcon className={styles.centerActionIcon} />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={styles.controls}>
          <div className={styles.timelineGroup}>
            {player.timelinePreview ? (
              <div
                ref={player.tooltipRef}
                className={styles.tooltip}
                style={{ left: `${player.timelinePreview.left}px` }}
              >
                <span className={styles.tooltipLabel}>
                  {player.timelinePreview.chapter?.title ?? 'Preview'}
                </span>
                <strong className={styles.tooltipTime}>
                  {formatTime(player.timelinePreview.time, { includeHours })}
                </strong>
              </div>
            ) : null}

            <div
              ref={player.timelineRef}
              className={styles.timeline}
              role="slider"
              tabIndex={0}
              aria-label={resolvedLabels.timeline}
              aria-valuemin={0}
              aria-valuemax={Math.round(player.resolvedDuration)}
              aria-valuenow={Math.round(player.currentTime)}
              aria-valuetext={`${formatTime(player.currentTime, {
                includeHours
              })} of ${formatTime(player.resolvedDuration, { includeHours })}`}
              onKeyDown={player.handleTimelineKeyDown}
              onPointerDown={player.handleTimelinePointerDown}
              onPointerMove={player.handleTimelinePointerMove}
              onPointerLeave={player.clearPreview}
              onPointerUp={player.handleTimelinePointerUp}
              onPointerCancel={player.handleTimelinePointerUp}
            >
              <div className={styles.timelineRail} aria-hidden="true" />
              <div
                className={styles.timelineBuffered}
                style={{ width: `${player.bufferedPercent}%` }}
                aria-hidden="true"
              />
              <div className={styles.chapterSegments} aria-hidden="true">
                {player.chapterSegments.map(({ chapter, left, width }) => (
                  <div
                    key={`${chapter.id ?? chapter.title}-${chapter.start}`}
                    className={styles.chapterSegment}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                ))}
              </div>
              <div
                className={styles.timelineProgress}
                style={{ width: `${player.progressPercent}%` }}
                aria-hidden="true"
              />
              <div
                className={styles.timelineThumb}
                style={{ left: `${player.progressPercent}%` }}
                aria-hidden="true"
              />
              {player.timelinePreview ? (
                <div
                  className={styles.timelinePreview}
                  style={{ left: `${player.timelinePreview.progress * 100}%` }}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          </div>

          <div className={styles.controlRow}>
            <div className={styles.primaryControls}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={player.togglePlayback}
                aria-pressed={player.isPlaying}
                aria-label={
                  player.isPlaying ? resolvedLabels.pause : resolvedLabels.play
                }
              >
                {player.isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              <div className={styles.volumeCluster}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={player.toggleMute}
                  aria-pressed={player.isMuted}
                  aria-label={
                    player.isMuted ? resolvedLabels.unmute : resolvedLabels.mute
                  }
                >
                  {player.isMuted ? <VolumeMutedIcon /> : <VolumeIcon />}
                </button>

                <div className={styles.volumeControl}>
                  <div
                    ref={player.volumeRef}
                    className={styles.volumeSlider}
                    role="slider"
                    tabIndex={0}
                    aria-label={resolvedLabels.volume}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(player.volume * 100)}
                    aria-valuetext={`${Math.round(player.volume * 100)}%`}
                    data-zero={player.volume === 0 ? '' : undefined}
                    style={
                      {
                        '--cvp-volume-percent': `${Math.round(player.volume * 100)}%`
                      } as CSSProperties
                    }
                    onKeyDown={player.handleVolumeKeyDown}
                    onPointerDown={player.handleVolumePointerDown}
                    onPointerMove={player.handleVolumePointerMove}
                    onPointerUp={player.handleVolumePointerUp}
                    onPointerCancel={player.handleVolumePointerUp}
                  >
                    <div className={styles.volumeRail} aria-hidden="true" />
                    <div
                      className={styles.volumeProgress}
                      style={{ width: `${player.volume * 100}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className={styles.volumeThumb}
                      style={{ left: `${player.volume * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.timecode} aria-live="off">
                <span>{formatTime(player.currentTime, { includeHours })}</span>
                <span className={styles.timeDivider}>/</span>
                <span>
                  {formatTime(player.resolvedDuration, { includeHours })}
                </span>
              </div>
            </div>

            <div className={styles.secondaryControls}>
              {player.isPictureInPictureSupported ? (
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.secondaryActionButton}`}
                  data-active={player.isPictureInPicture ? '' : undefined}
                  onClick={() =>
                    void player.togglePictureInPicture().catch(() => undefined)
                  }
                  aria-pressed={player.isPictureInPicture}
                  aria-label={
                    player.isPictureInPicture
                      ? resolvedLabels.exitPictureInPicture
                      : resolvedLabels.pictureInPicture
                  }
                >
                  <PictureInPictureIcon />
                </button>
              ) : null}

              <button
                ref={player.settingsButtonRef}
                type="button"
                className={`${styles.iconButton} ${styles.settingsButton}`}
                aria-label={resolvedLabels.settings}
                aria-haspopup="dialog"
                aria-controls={settingsMenuId}
                aria-expanded={player.isMenuOpen}
                onClick={player.toggleSettingsMenu}
              >
                <SettingsIcon />
              </button>

              <button
                type="button"
                className={styles.iconButton}
                onClick={() =>
                  void player.toggleFullscreen().catch(() => undefined)
                }
                aria-pressed={player.isFullscreen}
                aria-label={
                  player.isFullscreen
                    ? resolvedLabels.exitFullscreen
                    : resolvedLabels.fullscreen
                }
              >
                {player.isFullscreen ? (
                  <ExitFullscreenIcon className={styles.fullscreenIcon} />
                ) : (
                  <FullscreenIcon className={styles.fullscreenIcon} />
                )}
              </button>
            </div>
          </div>

          {player.isMenuOpen ? (
            <>
              {player.isCompactLayout ? (
                <div
                  className={styles.menuBackdrop}
                  onClick={() => player.setIsMenuOpen(false)}
                  aria-hidden="true"
                />
              ) : null}

              <div
                ref={player.menuRef}
                id={settingsMenuId}
                className={styles.menu}
                role="dialog"
                aria-label={resolvedLabels.settings}
              >
                {player.menuView === 'root' ? (
                  <div className={styles.menuSection}>
                    <button
                      type="button"
                      className={styles.settingsRow}
                      onClick={() => player.setMenuView('quality')}
                    >
                      <span className={styles.settingsRowLabel}>
                        {resolvedLabels.quality}
                      </span>
                      <span className={styles.settingsRowValue}>
                        {selectedQualityLabel}
                      </span>
                      <ChevronRightIcon className={styles.settingsRowArrow} />
                    </button>

                    <button
                      type="button"
                      className={styles.settingsRow}
                      onClick={() => player.setMenuView('speed')}
                    >
                      <span className={styles.settingsRowLabel}>
                        {resolvedLabels.playbackSpeed}
                      </span>
                      <span className={styles.settingsRowValue}>
                        {currentPlaybackRateLabel}
                      </span>
                      <ChevronRightIcon className={styles.settingsRowArrow} />
                    </button>

                    <div className={styles.compactMenuActions}>
                      {player.isPictureInPictureSupported ? (
                        <button
                          type="button"
                          className={styles.menuOption}
                          data-active={
                            player.isPictureInPicture ? '' : undefined
                          }
                          onClick={() => {
                            void player
                              .togglePictureInPicture()
                              .catch(() => undefined);
                            player.setIsMenuOpen(false);
                          }}
                        >
                          <span>{resolvedLabels.pictureInPicture}</span>
                          {player.isPictureInPicture ? (
                            <span className={styles.optionMeta}>Active</span>
                          ) : null}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {player.menuView === 'quality' ? (
                  <div className={styles.menuSection}>
                    <div className={styles.menuHeader}>
                      <button
                        type="button"
                        className={styles.menuBackButton}
                        onClick={() => player.setMenuView('root')}
                        aria-label={resolvedLabels.back}
                      >
                        <ChevronLeftIcon />
                      </button>
                      <p className={styles.menuTitle}>
                        {resolvedLabels.quality}
                      </p>
                    </div>

                    <div className={styles.optionList}>
                      {player.qualityOptions.map((qualityOption) => (
                        <button
                          key={qualityOption.value}
                          type="button"
                          className={styles.menuOption}
                          data-active={
                            player.selectedQuality === qualityOption.value
                              ? ''
                              : undefined
                          }
                          onClick={() => {
                            player.setQuality(qualityOption.value);
                            player.setIsMenuOpen(false);
                          }}
                        >
                          <span>{qualityOption.label}</span>
                          {player.selectedQuality === qualityOption.value ? (
                            <span className={styles.optionMeta}>Current</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {player.menuView === 'speed' ? (
                  <div className={styles.menuSection}>
                    <div className={styles.menuHeader}>
                      <button
                        type="button"
                        className={styles.menuBackButton}
                        onClick={() => player.setMenuView('root')}
                        aria-label={resolvedLabels.back}
                      >
                        <ChevronLeftIcon />
                      </button>
                      <p className={styles.menuTitle}>
                        {resolvedLabels.playbackSpeed}
                      </p>
                    </div>

                    <div className={styles.optionList}>
                      {player.playbackRateOptions.map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          className={styles.menuOption}
                          data-active={
                            player.playbackRate === rate ? '' : undefined
                          }
                          onClick={() => {
                            player.setPlaybackRate(rate);
                            player.setIsMenuOpen(false);
                          }}
                        >
                          <span>{formatPlaybackRate(rate)}</span>
                          {player.playbackRate === rate ? (
                            <span className={styles.optionMeta}>Current</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
