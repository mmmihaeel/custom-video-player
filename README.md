# Custom Video Player

`@mmmihaeel/custom-video-player` is a reusable React video player package for HLS playback with custom controls, chapter-aware timeline behavior, quality switching, keyboard shortcuts, Picture-in-Picture, fullscreen, and host-facing callbacks.

## Live Demo

- Demo: https://mmmihaeel.github.io/custom-video-player/

## Installation

```bash
pnpm add @mmmihaeel/custom-video-player
```

```bash
npm install @mmmihaeel/custom-video-player
```

```bash
yarn add @mmmihaeel/custom-video-player
```

Peer dependencies:

- `react`
- `react-dom`

## Quick Example

```tsx
import '@mmmihaeel/custom-video-player/styles.css';
import { VideoPlayer } from '@mmmihaeel/custom-video-player';

const source = {
  type: 'hls' as const,
  src: 'https://example.com/playlist.m3u8'
};

const chapters = [
  { title: 'Introduction', start: 0, end: 14 },
  { title: 'Deep dive', start: 15, end: 57 }
];

export function Example() {
  return (
    <VideoPlayer
      source={source}
      durationHint={348}
      chapters={chapters}
      poster="/poster.png"
      defaultQuality="auto"
      defaultVolume={0.72}
      playbackRates={[0.75, 1, 1.25, 1.5, 2]}
    />
  );
}
```

## Package Highlights

| Area          | Included                                                               |
| ------------- | ---------------------------------------------------------------------- |
| Playback      | Play/pause, mute, inline volume, fullscreen, and Picture-in-Picture    |
| Streaming     | Native HLS when available, lazy `hls.js` fallback otherwise            |
| Timeline      | Chapters, hover tooltip, click-to-seek, and keyboard seeking           |
| Extensibility | Metadata, buffering, settings, playback, audio, and viewport callbacks |
| Delivery      | TypeScript, tests, GitHub Actions, and a live demo                     |

## Using The Package

- Package usage and API: [packages/custom-video-player/README.md](packages/custom-video-player/README.md)
- Public API notes: [docs/api-design.md](docs/api-design.md)

## Maintainer Notes

- Package internals: [docs/architecture.md](docs/architecture.md)
- Testing strategy: [docs/testing-strategy.md](docs/testing-strategy.md)
- Demo deployment: [docs/demo-deployment.md](docs/demo-deployment.md)

```bash
pnpm install
pnpm validate
pnpm test:e2e
```

## License

MIT
