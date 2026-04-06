import { formatTime } from '../utils/formatTime';
import { useVideoPlayerTimeline } from '../context/VideoPlayerContext';
import styles from './VideoPlayer.module.css';

export function VideoPlayerTimeline() {
  const {
    bufferedPercent,
    chapterSegments,
    clearPreview,
    currentTime,
    handleTimelineKeyDown,
    handleTimelinePointerDown,
    handleTimelinePointerMove,
    handleTimelinePointerUp,
    includeHours,
    labels,
    progressPercent,
    resolvedDuration,
    timelinePreview,
    timelineRef,
    tooltipRef
  } = useVideoPlayerTimeline();

  return (
    <div className={styles.timelineGroup}>
      {timelinePreview ? (
        <div
          ref={tooltipRef}
          className={styles.tooltip}
          style={{ left: `${timelinePreview.left}px` }}
        >
          <span className={styles.tooltipLabel}>
            {timelinePreview.chapter?.title ?? 'Preview'}
          </span>
          <strong className={styles.tooltipTime}>
            {formatTime(timelinePreview.time, { includeHours })}
          </strong>
        </div>
      ) : null}

      <div
        ref={timelineRef}
        className={styles.timeline}
        role="slider"
        tabIndex={0}
        aria-label={labels.timeline}
        aria-valuemin={0}
        aria-valuemax={Math.round(resolvedDuration)}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={`${formatTime(currentTime, {
          includeHours
        })} of ${formatTime(resolvedDuration, { includeHours })}`}
        onKeyDown={handleTimelineKeyDown}
        onPointerDown={handleTimelinePointerDown}
        onPointerMove={handleTimelinePointerMove}
        onPointerLeave={clearPreview}
        onPointerUp={handleTimelinePointerUp}
        onPointerCancel={handleTimelinePointerUp}
      >
        <div className={styles.timelineRail} aria-hidden="true" />
        <div
          className={styles.timelineBuffered}
          style={{ width: `${bufferedPercent}%` }}
          aria-hidden="true"
        />
        <div className={styles.chapterSegments} aria-hidden="true">
          {chapterSegments.map(({ chapter, left, width }) => (
            <div
              key={`${chapter.id ?? chapter.title}-${chapter.start}`}
              className={styles.chapterSegment}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          ))}
        </div>
        <div
          className={styles.timelineProgress}
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />
        <div
          className={styles.timelineThumb}
          style={{ left: `${progressPercent}%` }}
          aria-hidden="true"
        />
        {timelinePreview ? (
          <div
            className={styles.timelinePreview}
            style={{ left: `${timelinePreview.progress * 100}%` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}
