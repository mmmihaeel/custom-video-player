# Custom Video Player

Custom Video Player is a pnpm workspace with a reusable React package and a demo application for a custom HLS player with chapters, quality switching, keyboard shortcuts, and host-friendly callback hooks.

## Workspace

| Path                           | Purpose                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `packages/custom-video-player` | Publish-ready package distributed as `@mmmihaeel/custom-video-player` |
| `apps/demo`                    | Interactive playground and GitHub Pages demo                          |
| `docs`                         | Architecture, API, testing, and deployment notes                      |
| `.github/workflows`            | CI validation and demo deployment                                     |

## Quick Start

```bash
pnpm install
pnpm dev
```

## Validation

| Command             | Purpose                         |
| ------------------- | ------------------------------- |
| `pnpm format:check` | Verify formatting consistency   |
| `pnpm lint`         | Run ESLint across the workspace |
| `pnpm typecheck`    | Run strict TypeScript checks    |
| `pnpm test`         | Run unit and component tests    |
| `pnpm test:e2e`     | Run the browser smoke test      |
| `pnpm build`        | Build the package and demo app  |
| `pnpm validate`     | Run the core validation chain   |

## Package Example

```tsx
import { VideoPlayer } from '@mmmihaeel/custom-video-player';

<VideoPlayer
  source={{ type: 'hls', src: playlistUrl }}
  durationHint={348}
  chapters={chapters}
  poster={posterUrl}
  defaultQuality="auto"
  defaultVolume={0.72}
  playbackRates={[0.75, 1, 1.25, 1.5, 2]}
  seekStep={5}
/>;
```

## Package Highlights

| Capability    | Included                                                              |
| ------------- | --------------------------------------------------------------------- |
| Playback UI   | Custom controls, play/pause, mute, inline volume, fullscreen, and PiP |
| Streaming     | Native HLS when available, lazy `hls.js` fallback otherwise           |
| Timeline      | Chapter markers, hover tooltip, click-to-seek, and keyboard seeking   |
| Extensibility | Playback, metadata, buffering, settings, and viewport callbacks       |
| Delivery      | Strict TypeScript, Vitest, Playwright, CI, and GitHub Pages           |

Detailed package docs live in [packages/custom-video-player/README.md](packages/custom-video-player/README.md).

## Documentation Map

| Document                                               | Focus                                      |
| ------------------------------------------------------ | ------------------------------------------ |
| [`docs/architecture.md`](docs/architecture.md)         | Workspace boundaries and runtime structure |
| [`docs/api-design.md`](docs/api-design.md)             | Public API and host-facing design rules    |
| [`docs/testing-strategy.md`](docs/testing-strategy.md) | Test layers and browser verification       |
| [`docs/demo-deployment.md`](docs/demo-deployment.md)   | GitHub Pages deployment flow               |

## Deployment

The demo is configured for GitHub Pages through `.github/workflows/deploy-demo.yml`. The production build uses the repository-aware Vite base path, so it can be published without extra rewrites.

## License

MIT
