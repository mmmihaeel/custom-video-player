import type { VideoQualityOption, VideoQualityValue } from '../types/player';

type HlsLevelLike = {
  bitrate?: number;
  height?: number;
  name?: string;
};

export function formatQualityLabel(level: HlsLevelLike) {
  if (level.height && level.height > 0) {
    return `${level.height}p`;
  }

  if (level.name && level.name.trim().length > 0) {
    return level.name.trim();
  }

  if (level.bitrate && level.bitrate > 0) {
    return `${Math.round(level.bitrate / 1000)} kbps`;
  }

  return 'Source';
}

export function getLevelValue(level: HlsLevelLike): number {
  return level.height && level.height > 0 ? level.height : (level.bitrate ?? 0);
}

export function buildQualityOptions(
  levels: readonly HlsLevelLike[]
): VideoQualityOption[] {
  const byValue = new Map<number, VideoQualityOption>();

  for (const level of levels) {
    const value = getLevelValue(level);

    if (value <= 0) {
      continue;
    }

    const nextOption: VideoQualityOption = {
      label: formatQualityLabel(level),
      value,
      ...(level.bitrate ? { bitrate: level.bitrate } : {}),
      ...(level.height ? { height: level.height } : {})
    };

    const currentOption = byValue.get(value);

    if (!currentOption || (level.bitrate ?? 0) > (currentOption.bitrate ?? 0)) {
      byValue.set(value, nextOption);
    }
  }

  return [...byValue.values()].sort(
    (left, right) => Number(right.value) - Number(left.value)
  );
}

export function resolveLevelIndex(
  quality: VideoQualityValue,
  levels: readonly HlsLevelLike[]
): number {
  if (quality === 'auto') {
    return -1;
  }

  return levels.findIndex((level) => getLevelValue(level) === quality);
}
