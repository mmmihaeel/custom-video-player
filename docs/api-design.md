# API Design

The package keeps the public surface deliberately small. It focuses on normalized media input, sensible playback defaults, and explicit callback hooks rather than shipping data fetching, analytics, or host-specific state management.

## Design Rules

- Accept normalized props only.
- Keep transport concerns out of the package.
- Expose callbacks for host analytics and orchestration.
- Keep styling self-contained through CSS Modules.
- Prefer additive UI features over prop-heavy configuration flags.

## Public Surface

| Area               | Surface                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Media input        | `source`, `poster`, `durationHint`, `preload`                                                                                                                                   |
| Timeline model     | `chapters`, `seekStep`                                                                                                                                                          |
| Playback defaults  | `autoPlay`, `muted`, `loop`, `defaultVolume`, `defaultQuality`, `defaultPlaybackRate`, `playbackRates`                                                                          |
| Presentation hooks | `className`, `style`, `theme`, `labels`                                                                                                                                         |
| Lifecycle hooks    | play, pause, end, seek, time, metadata, buffering, state, waiting, settings, quality, playback rate, volume, mute, chapter, fullscreen, picture-in-picture, and error callbacks |

## Why The Package Does Not Fetch Data

Keeping fetching and upstream mapping outside the package avoids three common problems:

1. Tight coupling to a single backend payload shape.
2. Security-sensitive host concerns leaking into UI code.
3. A larger API surface that is harder to maintain and test.

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

## Accessibility Notes

- The timeline is exposed as a slider-like control with value metadata.
- Focus-visible outlines are applied to all interactive controls.
- Keyboard shortcuts mirror the visible controls rather than introducing separate hidden actions.
