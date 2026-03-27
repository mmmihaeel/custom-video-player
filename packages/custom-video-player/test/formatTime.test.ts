import { describe, expect, it } from 'vitest';
import { formatTime } from '../src/utils/formatTime';

describe('formatTime', () => {
  it('formats mm:ss below one hour', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  it('formats hh:mm:ss when hours are present', () => {
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('forces hours when requested', () => {
    expect(formatTime(61, { includeHours: true })).toBe('0:01:01');
  });

  it('returns 0:00 for invalid values', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
  });
});
