type FormatTimeOptions = {
  includeHours?: boolean;
};

export function formatTime(
  totalSeconds: number,
  options: FormatTimeOptions = {}
): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return options.includeHours ? '0:00:00' : '0:00';
  }

  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds / 60) % 60).toString();
  const hours = Math.floor(totalSeconds / 3600);

  if (hours > 0 || options.includeHours) {
    return `${hours}:${minutes.padStart(2, '0')}:${seconds}`;
  }

  return `${minutes}:${seconds}`;
}
