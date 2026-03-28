# @mmmihaeel/custom-video-player

`@mmmihaeel/custom-video-player` is a reusable React component for HLS playback with custom controls, chapter-aware timeline behavior, quality switching, fullscreen, Picture-in-Picture, and callback-driven host integration.

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
      defaultPlaybackRate={1}
      defaultVolume={0.72}
      playbackRates={[0.75, 1, 1.25, 1.5, 2]}
      theme={{
        controlColor: '#f8f6f1',
        railColor: 'rgba(248, 246, 241, 0.28)',
        menuBackground: 'rgba(17, 20, 27, 0.96)'
      }}
    />
  );
}
```

## Styling And Theming

Import the bundled stylesheet once in the host application:

```tsx
import '@mmmihaeel/custom-video-player/styles.css';
```

Use `theme` for quick token-level overrides and `className` / `style` when the host app needs deeper layout or visual composition control.

```tsx
<VideoPlayer
  source={source}
  theme={{
    controlColor: '#f5f1e8',
    surfaceBackground: '#0d1016',
    menuBackground: 'rgba(13, 16, 22, 0.96)',
    menuBorderColor: 'rgba(245, 241, 232, 0.12)',
    railColor: 'rgba(245, 241, 232, 0.24)',
    bufferedColor: 'rgba(245, 241, 232, 0.18)',
    chapterMarkerColor: 'rgba(198, 209, 236, 0.55)',
    shadowColor: '0 26px 52px rgba(6, 7, 10, 0.42)'
  }}
/>
```

Supported theme keys:

| Key                  | Maps To             | Purpose                                           |
| -------------------- | ------------------- | ------------------------------------------------- |
| `controlColor`       | `--cvp-control`     | Icon, text, progress, and thumb color             |
| `surfaceBackground`  | `--cvp-surface`     | Video surface background behind the media element |
| `menuBackground`     | `--cvp-menu`        | Settings menu background                          |
| `menuBorderColor`    | `--cvp-menu-border` | Settings menu border                              |
| `railColor`          | `--cvp-rail`        | Timeline and volume rail color                    |
| `bufferedColor`      | `--cvp-buffered`    | Buffered timeline fill                            |
| `chapterMarkerColor` | `--cvp-segment`     | Chapter segment color                             |
| `shadowColor`        | `--cvp-shadow`      | Player surface shadow                             |

`style` is applied after `theme`, so direct CSS variable overrides in `style` win when both are provided.

## Feature Summary

| Area          | Included                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Playback UI   | Play/pause, replay overlay, desktop volume rail, compact mobile mute-first control, fullscreen, and PiP |
| Streaming     | `hls.js`-driven manual quality selection with native fallback when required                             |
| Timeline      | Chapter markers, hover tooltip, click-to-seek, keyboard seeking                                         |
| Settings      | Manual quality selection and playback-rate menu                                                         |
| Extensibility | Metadata, buffering, settings, playback, audio, and viewport callbacks                                  |

## Props

| Prop                  | Type                             | Default                   | Notes                                           |
| --------------------- | -------------------------------- | ------------------------- | ----------------------------------------------- |
| `source`              | `VideoSource`                    | required                  | HLS stream descriptor                           |
| `chapters`            | `readonly VideoChapter[]`        | `[]`                      | Chapter map rendered on the timeline            |
| `durationHint`        | `number`                         | `undefined`               | Fallback duration before metadata resolves      |
| `poster`              | `string`                         | `undefined`               | Poster frame shown before playback              |
| `autoPlay`            | `boolean`                        | `false`                   | Start playback automatically when policy allows |
| `muted`               | `boolean`                        | `false`                   | Force muted startup state                       |
| `loop`                | `boolean`                        | `false`                   | Loop playback                                   |
| `preload`             | `'none' \| 'metadata' \| 'auto'` | `'metadata'`              | Native preload strategy                         |
| `defaultVolume`       | `number`                         | `1`                       | Initial volume between `0` and `1`              |
| `defaultQuality`      | `'auto' \| number`               | `'auto'`                  | Initial quality selection                       |
| `defaultPlaybackRate` | `number`                         | `1`                       | Initial playback speed                          |
| `playbackRates`       | `readonly number[]`              | `[0.75, 1, 1.25, 1.5, 2]` | Speed options shown in settings                 |
| `seekStep`            | `number`                         | `5`                       | Keyboard seek interval in seconds               |
| `className`           | `string`                         | `undefined`               | Custom root class name                          |
| `style`               | `CSSProperties`                  | `undefined`               | Inline root styles                              |
| `theme`               | `Partial<VideoPlayerTheme>`      | `undefined`               | Quick token-level color and surface overrides   |
| `labels`              | `Partial<VideoPlayerLabels>`     | `undefined`               | UI copy and ARIA label overrides                |

## Callback Events

| Callback                   | Signature                                       | Notes                                                             |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `onPlay`                   | `() => void`                                    | Playback started                                                  |
| `onPause`                  | `() => void`                                    | Playback paused                                                   |
| `onEnded`                  | `() => void`                                    | Playback ended                                                    |
| `onSeek`                   | `(time: number) => void`                        | User or keyboard seek applied                                     |
| `onTimeUpdate`             | `(time: number) => void`                        | Current playback time changed                                     |
| `onLoadedMetadata`         | `(metadata: VideoPlayerMetadata) => void`       | Duration, selected quality, qualities, and media element resolved |
| `onReady`                  | `(metadata: VideoPlayerMetadata) => void`       | Alias for a ready-to-integrate metadata callback                  |
| `onBufferedChange`         | `(payload: VideoPlayerBufferedPayload) => void` | Buffering state changed                                           |
| `onStateChange`            | `(state: VideoPlayerState) => void`             | Normalized runtime snapshot for host orchestration                |
| `onWaitingChange`          | `(isWaiting: boolean) => void`                  | Buffering state toggled                                           |
| `onQualityChange`          | `(quality: VideoQualityValue) => void`          | Quality selection changed                                         |
| `onPlaybackRateChange`     | `(rate: number) => void`                        | Playback speed changed                                            |
| `onVolumeChange`           | `(volume: number) => void`                      | Volume changed                                                    |
| `onMuteChange`             | `(muted: boolean) => void`                      | Mute state changed                                                |
| `onChapterChange`          | `(chapter: VideoChapter \| null) => void`       | Active chapter changed                                            |
| `onSettingsOpenChange`     | `(isOpen: boolean) => void`                     | Settings menu opened or closed                                    |
| `onSettingsChange`         | `(payload: VideoPlayerSettingsState) => void`   | Settings menu open state or view changed                          |
| `onFullscreenChange`       | `(isFullscreen: boolean) => void`               | Fullscreen state changed                                          |
| `onPictureInPictureChange` | `(isPictureInPicture: boolean) => void`         | PiP state changed                                                 |
| `onError`                  | `(error: Error) => void`                        | Stream or media error surfaced                                    |

## Labels

`labels` can override the following keys:

| Group               | Keys                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| Playback            | `play`, `pause`, `replay`, `mute`, `unmute`, `volume`                      |
| Settings            | `settings`, `quality`, `playbackSpeed`, `autoQuality`, `back`              |
| Viewport            | `fullscreen`, `exitFullscreen`, `pictureInPicture`, `exitPictureInPicture` |
| Timeline and status | `timeline`, `loading`, `retry`, `streamError`                              |

## Keyboard Support

| Key             | Action                                         |
| --------------- | ---------------------------------------------- |
| `Space`, `K`    | Play or pause                                  |
| `Left`, `Right` | Seek backward or forward by `seekStep` seconds |
| `Home`, `End`   | Jump to the start or end of the timeline       |
| `M`             | Mute or unmute                                 |
| `F`             | Toggle fullscreen                              |
| `I`             | Toggle Picture-in-Picture when supported       |
| `Up`, `Down`    | Adjust volume by `0.05`                        |

## Integration Notes

- The package accepts normalized data only. Fetching and transformation stay in the host app.
- The timeline is implemented with semantic `div`-based controls instead of a native range input.
- `hls.js` is lazy-loaded so consumers do not pay for the runtime until it is required.
- Pointer events drive seeking behavior on desktop and touch devices alike.
- Compact mobile layouts keep the visible control row focused on playback-first actions, while secondary viewport actions move into the settings sheet.
