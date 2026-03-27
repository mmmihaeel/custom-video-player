import { describe, expect, it } from 'vitest';
import {
  buildQualityOptions,
  formatQualityLabel,
  resolveLevelIndex
} from '../src/utils/quality';

const levels = [
  { height: 720, bitrate: 2_500_000 },
  { height: 1080, bitrate: 4_200_000 },
  { height: 720, bitrate: 2_900_000 }
] as const;

describe('quality utilities', () => {
  it('formats quality labels', () => {
    expect(formatQualityLabel({ height: 720 })).toBe('720p');
    expect(formatQualityLabel({ bitrate: 320000 })).toBe('320 kbps');
  });

  it('deduplicates levels and sorts them descending', () => {
    expect(buildQualityOptions(levels)).toEqual([
      { label: '1080p', value: 1080, height: 1080, bitrate: 4_200_000 },
      { label: '720p', value: 720, height: 720, bitrate: 2_900_000 }
    ]);
  });

  it('resolves levels by selected quality', () => {
    expect(resolveLevelIndex('auto', levels)).toBe(-1);
    expect(resolveLevelIndex(720, levels)).toBe(0);
  });
});
