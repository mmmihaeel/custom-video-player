# Custom Video Player

`@mmmihaeel/custom-video-player` is a reusable React video player package for HLS playback with custom controls, chapter-aware timeline behavior, quality switching, typed analytics events, keyboard shortcuts, Picture-in-Picture, fullscreen, and host-facing callbacks.

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
import {
  VideoPlayer,
  type AnalyticsEvent
} from '@mmmihaeel/custom-video-player';

const source = {
  type: 'hls' as const,
  src: 'https://example.com/playlist.m3u8'
};

const chapters = [
  { title: 'Introduction', start: 0, end: 14 },
  { title: 'Deep dive', start: 15, end: 57 }
];

export function Example() {
  function onAnalyticsEvent(event: AnalyticsEvent) {
    console.log('[player analytics]', event.type, event);
  }

  return (
    <VideoPlayer
      source={source}
      durationHint={348}
      chapters={chapters}
      poster="/poster.png"
      defaultQuality="auto"
      defaultVolume={0.72}
      playbackRates={[0.75, 1, 1.25, 1.5, 2]}
      onAnalyticsEvent={onAnalyticsEvent}
    />
  );
}
```

## Package Highlights

| Area          | Included                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Playback      | Play/pause, replay overlay, mute, adaptive audio controls, fullscreen, and Picture-in-Picture                     |
| Streaming     | Lazy `hls.js` transport first for consistent quality switching, with native HLS fallback when required            |
| Timeline      | Chapters, hover tooltip, click-to-seek, and keyboard seeking                                                      |
| Extensibility | Metadata, buffering, settings, playback, audio, viewport callbacks, and typed analytics events                    |
| Architecture  | Single-source runtime orchestrator with internal context slices for controls, timeline, settings, and root wiring |
| Delivery      | TypeScript, tests, GitHub Actions, and a live demo                                                                |

## Using The Package

- Package usage and API: [packages/custom-video-player/README.md](packages/custom-video-player/README.md)
- Public API notes: [docs/api-design.md](docs/api-design.md)

## Repository Docs

- Package internals: [docs/architecture.md](docs/architecture.md)
- Testing strategy: [docs/testing-strategy.md](docs/testing-strategy.md)
- Demo deployment: [docs/demo-deployment.md](docs/demo-deployment.md)

## Local Development

```bash
pnpm install
pnpm validate
pnpm test:e2e
```

## License

MIT
