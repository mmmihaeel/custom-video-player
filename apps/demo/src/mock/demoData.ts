export const demoVideo = {
  chapters: [
    { title: 'Player overview', start: 0, end: 80 },
    {
      title: 'Control surface and transport actions',
      start: 81,
      end: 160
    },
    { title: 'Timeline and chapter behavior', start: 161, end: 250 },
    { title: 'Layered settings navigation', start: 251, end: 330 },
    { title: 'Keyboard and touch interaction', start: 331, end: 415 },
    { title: 'Host callbacks and telemetry hooks', start: 416, end: 510 },
    { title: 'Packaging and integration wrap-up', start: 511, end: 596 }
  ],
  hlsPlaylistUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  videoLength: 596
} as const;
