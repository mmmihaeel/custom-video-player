import { describe, expect, it } from 'vitest';
import {
  getChapterForTime,
  getChapterSegments,
  normalizeChapters
} from '../src/utils/chapters';

const sourceChapters = [
  { title: '  Intro  ', start: 0, end: 12 },
  { title: 'Deep dive', start: 12, end: 42 },
  { title: 'Invalid', start: 55, end: 40 }
] as const;

describe('chapter utilities', () => {
  it('normalizes, trims and filters invalid chapters', () => {
    expect(normalizeChapters(sourceChapters, 40)).toEqual([
      { title: 'Intro', start: 0, end: 12 },
      { title: 'Deep dive', start: 12, end: 40 }
    ]);
  });

  it('finds the active chapter for a given time', () => {
    const chapters = normalizeChapters(sourceChapters, 40);
    expect(getChapterForTime(chapters, 20)?.title).toBe('Deep dive');
    expect(getChapterForTime(chapters, 100)).toBeNull();
  });

  it('builds timeline segments in percent', () => {
    const chapters = normalizeChapters(sourceChapters, 40);
    expect(getChapterSegments(chapters, 40)).toEqual([
      {
        chapter: { title: 'Intro', start: 0, end: 12 },
        left: 0,
        width: 30
      },
      {
        chapter: { title: 'Deep dive', start: 12, end: 40 },
        left: 30,
        width: 70
      }
    ]);
  });
});
