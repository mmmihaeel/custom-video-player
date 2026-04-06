# API Design

The package keeps the public surface deliberately small. It focuses on normalized media input, sensible playback defaults, explicit callback hooks, and a typed analytics layer rather than shipping data fetching, analytics vendors, or host-specific state management.

## Design Rules

- Accept normalized props only.
- Keep transport concerns out of the package.
- Expose callbacks and typed analytics for host orchestration.
- Keep styling self-contained through CSS Modules and theme tokens.
- Prefer additive UI features over prop-heavy configuration flags.
- Keep internal scaling concerns behind the public component boundary.

## Public Surface

| Area               | Surface                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Media input        | `source`, `poster`, `durationHint`, `preload`                                                                                                                                              |
| Timeline model     | `chapters`, `seekStep`                                                                                                                                                                     |
| Playback defaults  | `autoPlay`, `muted`, `loop`, `defaultVolume`, `defaultQuality`, `defaultPlaybackRate`, `playbackRates`                                                                                     |
| Presentation hooks | `className`, `style`, `theme`, `labels`                                                                                                                                                    |
| Lifecycle hooks    | play, pause, end, seek, time, metadata, buffering, state, waiting, settings, quality, playback rate, volume, mute, chapter, fullscreen, picture-in-picture, analytics, and error callbacks |

## Typed Analytics Contract

`onAnalyticsEvent` exposes a discriminated `AnalyticsEvent` union instead of a loose `{ name, payload }` shape. This makes both emitters and consumers type-safe:

- consumers switch on `event.type`
- each branch gets event-specific payload fields
- no analytics vendor SDK is coupled into the package

Shared fields for every analytics event:

- `currentTime`
- `duration`
- `timestamp`

Event-specific fields:

| Event              | Additional fields                                      |
| ------------------ | ------------------------------------------------------ |
| `play`             | `isMuted`, `playbackRate`, `selectedQuality`, `volume` |
| `pause`            | `isMuted`, `playbackRate`, `selectedQuality`, `volume` |
| `seek`             | `fromTime`, `toTime`                                   |
| `qualityChange`    | `fromQuality`, `toQuality`                             |
| `speedChange`      | `fromRate`, `toRate`                                   |
| `fullscreenToggle` | `isFullscreen`                                         |
| `volumeChange`     | `fromMuted`, `fromVolume`, `toMuted`, `toVolume`       |
| `chapterChange`    | `fromChapter`, `toChapter`                             |
| `ended`            | `isMuted`, `playbackRate`, `selectedQuality`, `volume` |

This contract is intentionally host-agnostic. The player emits normalized facts about user interaction; the host decides whether to log them to the console, push them into a data layer, or forward them to an analytics provider.

`onQualityChange` remains a user-facing preference callback. Hosts that need fuller quality telemetry should treat `onAnalyticsEvent` plus `onStateChange` as the canonical integration surface instead of assuming adaptive level movement in `auto` mode is represented by that callback alone.

## Why The Package Does Not Fetch Data

Keeping fetching and upstream mapping outside the package avoids three common problems:

1. Tight coupling to a single backend payload shape.
2. Security-sensitive host concerns leaking into UI code.
3. A larger API surface that is harder to maintain and test.

The same rule applies to analytics: the package emits typed events, but ingestion and transport stay in the host app.

## Quality Selection Model

- `defaultQuality="auto"` preserves adaptive HLS behavior.
- Numeric quality values are interpreted as video heights.
- If the requested height is not present in the manifest, the player falls back to adaptive mode.
- The player prefers `hls.js` when level metadata is available so manual quality selection stays consistent across modern browsers.
- Browsers that cannot run `hls.js` still fall back to native HLS playback.

## Settings Menu Model

The settings UI follows a compact, layered model:

- Root menu exposes quality and playback speed.
- Nested views keep option lists focused and readable.
- The selected item is echoed back in the root menu to reduce guesswork.
- Picture-in-picture is exposed as a viewport action on larger layouts and moves into the settings sheet on compact layouts to keep the primary control row focused.

## Internal Runtime Scaling

The internal runtime remains centered on `useVideoPlayer` as the single source of truth. A `VideoPlayerContext` layer distributes focused slices to the render tree:

- state slice
- controls slice
- timeline slice
- settings slice
- root callback slice

This reduces prop drilling without turning the context layer into a second state machine. The public API remains a single `VideoPlayer` component.

## Accessibility Notes

- The timeline is exposed as a slider-like control with value metadata.
- Focus-visible outlines are applied to all interactive controls.
- Keyboard shortcuts mirror the visible controls rather than introducing separate hidden actions.
