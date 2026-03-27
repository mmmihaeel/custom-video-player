import type { VideoChapter } from '../types/player';
import { clamp } from './clamp';

export type ChapterSegment = {
  chapter: VideoChapter;
  left: number;
  width: number;
};

export function normalizeChapters(
  chapters: readonly VideoChapter[],
  durationHint?: number
): VideoChapter[] {
  if (chapters.length === 0) {
    return [];
  }

  const durationLimit =
    Number.isFinite(durationHint) && durationHint && durationHint > 0
      ? durationHint
      : Number.POSITIVE_INFINITY;

  return [...chapters]
    .filter(
      (chapter) =>
        Number.isFinite(chapter.start) &&
        Number.isFinite(chapter.end) &&
        chapter.end > chapter.start &&
        chapter.title.trim().length > 0
    )
    .sort((left, right) => left.start - right.start)
    .map((chapter) => ({
      ...chapter,
      title: chapter.title.trim(),
      start: clamp(chapter.start, 0, durationLimit),
      end: clamp(chapter.end, 0, durationLimit)
    }))
    .filter((chapter) => chapter.end > chapter.start);
}

export function getChapterForTime(
  chapters: readonly VideoChapter[],
  time: number
): VideoChapter | null {
  if (!Number.isFinite(time)) {
    return null;
  }

  return (
    chapters.find((chapter) => time >= chapter.start && time < chapter.end) ??
    null
  );
}

export function getChapterSegments(
  chapters: readonly VideoChapter[],
  duration: number
): ChapterSegment[] {
  if (!Number.isFinite(duration) || duration <= 0) {
    return [];
  }

  return chapters.map((chapter) => ({
    chapter,
    left: clamp((chapter.start / duration) * 100, 0, 100),
    width: clamp(((chapter.end - chapter.start) / duration) * 100, 0, 100)
  }));
}
