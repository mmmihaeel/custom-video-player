import {
  VideoPlayer,
  type VideoChapter,
  type VideoPlayerMetadata,
  type VideoPlayerState,
  type VideoPlayerSettingsState,
  type VideoQualityValue
} from '@mmmihaeel/custom-video-player';
import {
  useMemo,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction
} from 'react';
import { demoVideo } from '../mock/demoData';
import styles from './App.module.css';

type DraftConfig = {
  autoPlay: boolean;
  chaptersJson: string;
  defaultQuality: string;
  defaultVolume: string;
  durationHint: string;
  loop: boolean;
  muted: boolean;
  playbackRates: string;
  posterUrl: string;
  seekStep: string;
  sourceUrl: string;
};

type AppliedConfig = {
  autoPlay: boolean;
  chapters: VideoChapter[];
  defaultQuality: VideoQualityValue;
  defaultVolume: number;
  durationHint: number;
  loop: boolean;
  muted: boolean;
  playbackRates: number[];
  posterUrl: string;
  seekStep: number;
  sourceUrl: string;
};

type InstallClient = 'npm' | 'pnpm' | 'yarn';

const PACKAGE_NAME = '@mmmihaeel/custom-video-player';
const INSTALL_COMMANDS: Record<InstallClient, string> = {
  npm: `npm install ${PACKAGE_NAME}`,
  pnpm: `pnpm add ${PACKAGE_NAME}`,
  yarn: `yarn add ${PACKAGE_NAME}`
};

const FEATURE_ROWS = [
  [
    'HLS and quality switching',
    'Adaptive playback with manual resolution selection.'
  ],
  [
    'Chapter-aware timeline',
    'Hover metadata, chapter markers, and click-to-seek behavior.'
  ],
  [
    'Host callbacks',
    'Playback, buffering, settings, viewport, and state events.'
  ],
  [
    'Keyboard and touch support',
    'Seek, volume, fullscreen, PiP, and touch-first timeline input.'
  ]
] as const;

const INTEGRATION_ROWS = [
  'Provide normalized media and chapter data from the host app.',
  'Keep fetching, auth, persistence, and analytics orchestration outside the package.',
  'Use callbacks when you need telemetry, custom UI reactions, or synchronized state.',
  'Override labels or root styling without replacing the player runtime.'
] as const;

const PROP_ROWS = [
  ['source', 'VideoSource', 'Required HLS source descriptor.'],
  ['chapters', 'VideoChapter[]', 'Normalized timeline chapter markers.'],
  ['durationHint', 'number', 'Fallback duration before metadata resolves.'],
  ['defaultQuality', `'auto' | number`, 'Initial quality preference.'],
  ['defaultVolume', 'number', 'Initial volume in the `0..1` range.'],
  ['playbackRates', 'number[]', 'Visible speed options in the settings menu.'],
  ['seekStep', 'number', 'Keyboard seek increment in seconds.'],
  [
    'theme',
    'Partial<VideoPlayerTheme>',
    'Quick color-token overrides for the packaged UI.'
  ],
  [
    'labels',
    'Partial<VideoPlayerLabels>',
    'Visible copy and ARIA label overrides.'
  ]
] as const;

const CALLBACK_ROWS = [
  ['onReady', 'Receives the media element, duration, and quality metadata.'],
  ['onSeek', 'Emits manual timeline and keyboard seeking.'],
  ['onBufferedChange', 'Reports buffered progress for host analytics or UI.'],
  ['onStateChange', 'Publishes a normalized runtime snapshot for host logic.'],
  ['onWaitingChange', 'Signals loading and stall transitions.'],
  ['onSettingsChange', 'Reports settings menu open state and active panel.'],
  ['onPictureInPictureChange', 'Reports PiP transitions when supported.']
] as const;

const SHORTCUT_ROWS = [
  ['Space / K', 'Toggle playback'],
  ['Left / Right', 'Seek backward or forward by `seekStep` seconds'],
  ['Up / Down', 'Raise or lower volume'],
  ['M', 'Mute or restore audio'],
  ['F', 'Toggle fullscreen'],
  ['I', 'Toggle Picture-in-Picture']
] as const;

function buildDefaultDraft(baseUrl: string): DraftConfig {
  return {
    autoPlay: false,
    chaptersJson: JSON.stringify(demoVideo.chapters, null, 2),
    defaultQuality: 'auto',
    defaultVolume: '0.72',
    durationHint: String(demoVideo.videoLength),
    loop: false,
    muted: false,
    playbackRates: '0.75, 1, 1.25, 1.5, 2',
    posterUrl: `${baseUrl}poster.png`,
    seekStep: '5',
    sourceUrl: demoVideo.hlsPlaylistUrl
  };
}

function parsePlaybackRates(value: string) {
  return [
    ...new Set(
      value
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((part) => Number.isFinite(part) && part > 0)
    )
  ];
}

function parseDraftConfig(draft: DraftConfig): {
  config: AppliedConfig | null;
  error: string | null;
} {
  try {
    const chapters = JSON.parse(draft.chaptersJson) as VideoChapter[];
    const playbackRates = parsePlaybackRates(draft.playbackRates);
    const durationHint = Number(draft.durationHint);
    const defaultVolume = Number(draft.defaultVolume);
    const seekStep = Number(draft.seekStep);
    if (!draft.sourceUrl.trim())
      return { config: null, error: 'Source URL is required.' };
    if (!Array.isArray(chapters))
      return { config: null, error: 'Chapters must be a JSON array.' };
    if (
      chapters.some(
        (chapter) =>
          typeof chapter?.title !== 'string' ||
          typeof chapter?.start !== 'number' ||
          typeof chapter?.end !== 'number'
      )
    ) {
      return {
        config: null,
        error:
          'Each chapter must include a string title and numeric start/end values.'
      };
    }
    if (playbackRates.length === 0)
      return { config: null, error: 'Provide at least one playback rate.' };
    if (!Number.isFinite(durationHint) || durationHint <= 0)
      return {
        config: null,
        error: 'Duration hint must be a positive number.'
      };
    if (
      !Number.isFinite(defaultVolume) ||
      defaultVolume < 0 ||
      defaultVolume > 1
    )
      return {
        config: null,
        error: 'Default volume must stay between 0 and 1.'
      };
    if (!Number.isFinite(seekStep) || seekStep <= 0)
      return { config: null, error: 'Seek step must be a positive number.' };
    return {
      config: {
        autoPlay: draft.autoPlay,
        chapters,
        defaultQuality:
          draft.defaultQuality === 'auto'
            ? 'auto'
            : Number(draft.defaultQuality),
        defaultVolume,
        durationHint,
        loop: draft.loop,
        muted: draft.muted,
        playbackRates,
        posterUrl: draft.posterUrl.trim(),
        seekStep,
        sourceUrl: draft.sourceUrl.trim()
      },
      error: null
    };
  } catch {
    return { config: null, error: 'Chapters JSON is invalid.' };
  }
}

function appendEvent(
  setEvents: Dispatch<SetStateAction<string[]>>,
  nextMessage: string
) {
  setEvents((current) =>
    current[0] === nextMessage ? current : [nextMessage, ...current.slice(0, 7)]
  );
}

function formatTime(value: number) {
  const total = Math.max(0, Math.floor(value));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function App() {
  const defaultDraft = useMemo(
    () => buildDefaultDraft(import.meta.env.BASE_URL),
    []
  );
  const initialConfig = useMemo(
    () => parseDraftConfig(defaultDraft).config!,
    [defaultDraft]
  );
  const [installClient, setInstallClient] = useState<InstallClient>('pnpm');
  const [draftConfig, setDraftConfig] = useState(defaultDraft);
  const [appliedConfig, setAppliedConfig] =
    useState<AppliedConfig>(initialConfig);
  const [configError, setConfigError] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<VideoPlayerState | null>(null);
  const [playerRevision, setPlayerRevision] = useState(0);
  const [eventLog, setEventLog] = useState<string[]>([
    'Ready for interaction.'
  ]);
  const [isPending, startTransition] = useTransition();
  const installSnippet = INSTALL_COMMANDS[installClient];
  const assignmentInputSnippet = useMemo(
    () =>
      JSON.stringify(
        {
          hlsPlaylistUrl: demoVideo.hlsPlaylistUrl,
          videoLength: demoVideo.videoLength,
          chapters: demoVideo.chapters
        },
        null,
        2
      ),
    []
  );
  const usageSnippet = useMemo(
    () =>
      `import '@mmmihaeel/custom-video-player/styles.css';\nimport { VideoPlayer } from '${PACKAGE_NAME}';\n\nconst source = {\n  type: 'hls' as const,\n  src: '${demoVideo.hlsPlaylistUrl}'\n};\n\nconst chapters = ${JSON.stringify(demoVideo.chapters.slice(0, 2), null, 2)};\n\nexport function Example() {\n  return (\n    <VideoPlayer\n      source={source}\n      durationHint={${demoVideo.videoLength}}\n      chapters={chapters}\n      poster="/poster.png"\n      defaultQuality="auto"\n      defaultVolume={0.72}\n      playbackRates={[0.75, 1, 1.25, 1.5, 2]}\n      theme={{\n        controlColor: '#f8f6f1',\n        railColor: 'rgba(248, 246, 241, 0.28)',\n        menuBackground: 'rgba(17, 20, 27, 0.96)'\n      }}\n    />\n  );\n}`,
    []
  );
  const playerKey = [
    playerRevision,
    appliedConfig.sourceUrl,
    appliedConfig.posterUrl,
    appliedConfig.defaultQuality,
    appliedConfig.defaultVolume,
    appliedConfig.durationHint,
    appliedConfig.seekStep,
    appliedConfig.playbackRates.join('-')
  ].join(':');
  const stateCards = [
    ['Playback', playerState?.isPlaying ? 'Playing' : 'Paused'],
    [
      'Quality',
      playerState
        ? playerState.selectedQuality === 'auto'
          ? 'Auto'
          : `${playerState.selectedQuality}p`
        : 'Auto'
    ],
    ['Speed', playerState ? `${playerState.playbackRate}x` : '1x'],
    ['Volume', playerState ? `${Math.round(playerState.volume * 100)}%` : '--'],
    [
      'Buffered',
      playerState ? `${Math.round(playerState.bufferedPercent)}%` : '--'
    ],
    [
      'Viewport',
      playerState?.isFullscreen
        ? 'Fullscreen'
        : playerState?.isPictureInPicture
          ? 'PiP'
          : 'Inline'
    ]
  ] as const;

  function updateDraft<K extends keyof DraftConfig>(
    key: K,
    value: DraftConfig[K]
  ) {
    setDraftConfig((current) => ({ ...current, [key]: value }));
  }

  function applyDraftConfig() {
    const parsed = parseDraftConfig(draftConfig);
    if (!parsed.config) {
      setConfigError(parsed.error);
      return;
    }
    setConfigError(null);
    startTransition(() => {
      setAppliedConfig(parsed.config!);
      setPlayerRevision((value) => value + 1);
    });
    appendEvent(
      setEventLog,
      'Configuration applied from the package playground.'
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Reusable React package</span>
          <h1 className={styles.title}>Custom Video Player</h1>
          <p className={styles.lead}>
            A reusable HLS video player package with custom controls, quality
            switching, chapter-aware timeline behavior, keyboard shortcuts,
            Picture-in-Picture, fullscreen, and callback-driven host
            integration.
          </p>
          <div className={styles.badgeRow}>
            <span>{PACKAGE_NAME}</span>
            <span>npm</span>
            <span>pnpm</span>
            <span>Yarn</span>
            <span>React 19</span>
            <span>HLS</span>
            <span>TypeScript</span>
          </div>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#usage">
              Install and usage
            </a>
            <a className={styles.secondaryAction} href="#playground">
              Open playground
            </a>
          </div>
          <article className={styles.installCard}>
            <div className={styles.cardHeader}>
              <span className={styles.sectionLabel}>Installation</span>
              <h2 className={styles.cardTitle}>
                Add the package to any React app
              </h2>
            </div>
            <div
              className={styles.installTabs}
              role="tablist"
              aria-label="Install with"
            >
              {(['pnpm', 'npm', 'yarn'] as InstallClient[]).map((client) => (
                <button
                  key={client}
                  type="button"
                  role="tab"
                  className={styles.installTab}
                  data-active={installClient === client ? '' : undefined}
                  aria-selected={installClient === client}
                  onClick={() => setInstallClient(client)}
                >
                  {client}
                </button>
              ))}
            </div>
            <pre className={styles.codeBlock}>
              <code>{installSnippet}</code>
            </pre>
            <p className={styles.helperNote}>
              Peer dependencies: <code>react</code> and <code>react-dom</code>.
              The package keeps styling and player logic self-contained, so host
              apps only provide normalized media and chapter data.
            </p>
          </article>
          <div className={styles.featureGrid}>
            {FEATURE_ROWS.map(([title, description]) => (
              <article key={title} className={styles.featureCard}>
                <strong>{title}</strong>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="preview" className={styles.section}>
          <div className={styles.cardHeader}>
            <span className={styles.sectionLabel}>Live preview</span>
            <h2 className={styles.cardTitle}>
              The package wired to the exact assignment input
            </h2>
          </div>
          <p className={styles.sectionIntro}>
            The player below uses the assignment stream, timeline chapters, and
            poster treatment while keeping the page itself focused on package
            adoption rather than fixture-specific commentary.
          </p>
          <article className={styles.playerCard}>
            <VideoPlayer
              key={playerKey}
              source={{ type: 'hls', src: appliedConfig.sourceUrl }}
              durationHint={appliedConfig.durationHint}
              chapters={appliedConfig.chapters}
              poster={appliedConfig.posterUrl}
              autoPlay={appliedConfig.autoPlay}
              muted={appliedConfig.muted}
              loop={appliedConfig.loop}
              defaultQuality={appliedConfig.defaultQuality}
              defaultVolume={appliedConfig.defaultVolume}
              playbackRates={appliedConfig.playbackRates}
              seekStep={appliedConfig.seekStep}
              onReady={(metadata: VideoPlayerMetadata) =>
                appendEvent(
                  setEventLog,
                  `onReady: duration ${formatTime(metadata.duration)}, ${metadata.qualities.length || 0} quality levels.`
                )
              }
              onPlay={() => appendEvent(setEventLog, 'onPlay')}
              onPause={() => appendEvent(setEventLog, 'onPause')}
              onEnded={() => appendEvent(setEventLog, 'onEnded')}
              onSeek={(time) =>
                appendEvent(setEventLog, `onSeek: ${formatTime(time)}`)
              }
              onTimeUpdate={(time) => {
                if (Math.floor(time) % 30 === 0 && time > 0)
                  appendEvent(
                    setEventLog,
                    `onTimeUpdate: checkpoint ${formatTime(time)}`
                  );
              }}
              onBufferedChange={(payload) =>
                appendEvent(
                  setEventLog,
                  `onBufferedChange: ${Math.round(payload.bufferedPercent)}% buffered`
                )
              }
              onWaitingChange={(isWaiting) =>
                appendEvent(
                  setEventLog,
                  isWaiting
                    ? 'onWaitingChange: buffering'
                    : 'onWaitingChange: ready'
                )
              }
              onSettingsChange={(state: VideoPlayerSettingsState) =>
                appendEvent(
                  setEventLog,
                  `onSettingsChange: ${state.isOpen ? `open (${state.view})` : 'closed'}`
                )
              }
              onStateChange={(state) => setPlayerState(state)}
              onQualityChange={(quality) =>
                appendEvent(
                  setEventLog,
                  `onQualityChange: ${quality === 'auto' ? 'Auto' : `${quality}p`}`
                )
              }
              onPlaybackRateChange={(rate) =>
                appendEvent(setEventLog, `onPlaybackRateChange: ${rate}x`)
              }
              onVolumeChange={(volume) =>
                appendEvent(
                  setEventLog,
                  `onVolumeChange: ${Math.round(volume * 100)}%`
                )
              }
              onMuteChange={(isMuted) =>
                appendEvent(
                  setEventLog,
                  `onMuteChange: ${isMuted ? 'muted' : 'unmuted'}`
                )
              }
              onFullscreenChange={(isFullscreen) =>
                appendEvent(
                  setEventLog,
                  `onFullscreenChange: ${isFullscreen ? 'entered' : 'exited'}`
                )
              }
              onPictureInPictureChange={(isPiP) =>
                appendEvent(
                  setEventLog,
                  `onPictureInPictureChange: ${isPiP ? 'entered' : 'exited'}`
                )
              }
              onError={(error) =>
                appendEvent(setEventLog, `onError: ${error.message}`)
              }
            />
          </article>
        </section>

        <section id="usage" className={styles.section}>
          <div className={styles.cardHeader}>
            <span className={styles.sectionLabel}>Package usage</span>
            <h2 className={styles.cardTitle}>
              Install and embed in another project
            </h2>
          </div>
          <article className={styles.panel}>
            <div
              className={styles.installTabs}
              role="tablist"
              aria-label="Install with"
            >
              {(['pnpm', 'npm', 'yarn'] as InstallClient[]).map((client) => (
                <button
                  key={client}
                  type="button"
                  role="tab"
                  className={styles.installTab}
                  data-active={installClient === client ? '' : undefined}
                  aria-selected={installClient === client}
                  onClick={() => setInstallClient(client)}
                >
                  {client}
                </button>
              ))}
            </div>
            <pre className={styles.codeBlock}>
              <code>{installSnippet}</code>
            </pre>
            <pre className={styles.codeBlock}>
              <code>{usageSnippet}</code>
            </pre>
            <p className={styles.helperNote}>
              Import <code>{PACKAGE_NAME}/styles.css</code> once in the host app
              to ship the bundled control styling, then layer project-specific
              layout or theming around the component as needed. Use the{' '}
              <code>theme</code> prop for token-level overrides and{' '}
              <code>className</code>/<code>style</code> when the host app needs
              deeper composition control.
            </p>
          </article>
          <article className={styles.panel}>
            <div className={styles.cardHeader}>
              <span className={styles.sectionLabel}>Host integration</span>
              <h3 className={styles.panelTitle}>
                What stays outside the package
              </h3>
            </div>
            <ul className={styles.infoList}>
              {INTEGRATION_ROWS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section id="playground" className={styles.section}>
          <div className={styles.cardHeader}>
            <span className={styles.sectionLabel}>Playground</span>
            <h2 className={styles.cardTitle}>Edit props and remount</h2>
          </div>
          <p className={styles.sectionIntro}>
            Use the playground to validate how the package behaves with your own
            inputs, startup defaults, and chapter data without leaving the page.
          </p>
          <article className={styles.playgroundCard}>
            <div className={styles.formSection}>
              <h3 className={styles.formTitle}>Media input</h3>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>HLS URL</span>
                  <input
                    type="url"
                    value={draftConfig.sourceUrl}
                    onChange={(event) =>
                      updateDraft('sourceUrl', event.currentTarget.value)
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Poster URL</span>
                  <input
                    type="url"
                    value={draftConfig.posterUrl}
                    onChange={(event) =>
                      updateDraft('posterUrl', event.currentTarget.value)
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Duration hint</span>
                  <input
                    type="number"
                    min="0"
                    value={draftConfig.durationHint}
                    onChange={(event) =>
                      updateDraft('durationHint', event.currentTarget.value)
                    }
                  />
                </label>
              </div>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formTitle}>Playback defaults</h3>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Default quality</span>
                  <select
                    value={draftConfig.defaultQuality}
                    onChange={(event) =>
                      updateDraft('defaultQuality', event.currentTarget.value)
                    }
                  >
                    <option value="auto">Auto</option>
                    <option value="720">720p</option>
                    <option value="1080">1080p</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span>
                    Default volume
                    <strong>
                      {Math.round(Number(draftConfig.defaultVolume) * 100)}%
                    </strong>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={draftConfig.defaultVolume}
                    onChange={(event) =>
                      updateDraft('defaultVolume', event.currentTarget.value)
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Playback rates</span>
                  <input
                    type="text"
                    value={draftConfig.playbackRates}
                    onChange={(event) =>
                      updateDraft('playbackRates', event.currentTarget.value)
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Seek step</span>
                  <input
                    type="number"
                    min="1"
                    value={draftConfig.seekStep}
                    onChange={(event) =>
                      updateDraft('seekStep', event.currentTarget.value)
                    }
                  />
                </label>
              </div>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formTitle}>Behavior toggles</h3>
              <div className={styles.toggleRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={draftConfig.autoPlay}
                    onChange={(event) =>
                      updateDraft('autoPlay', event.currentTarget.checked)
                    }
                  />
                  <span>Auto play</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draftConfig.muted}
                    onChange={(event) =>
                      updateDraft('muted', event.currentTarget.checked)
                    }
                  />
                  <span>Muted</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draftConfig.loop}
                    onChange={(event) =>
                      updateDraft('loop', event.currentTarget.checked)
                    }
                  />
                  <span>Loop</span>
                </label>
              </div>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formTitle}>Timeline data</h3>
              <label className={styles.field}>
                <span>Chapters JSON</span>
                <textarea
                  rows={11}
                  value={draftConfig.chaptersJson}
                  onChange={(event) =>
                    updateDraft('chaptersJson', event.currentTarget.value)
                  }
                />
              </label>
            </div>
            {configError ? (
              <p className={styles.errorNote}>{configError}</p>
            ) : (
              <p className={styles.helperNote}>
                Apply remounts the player with the current props so you can
                validate startup behavior, chapter rendering, settings state,
                and callbacks without refreshing the page.
              </p>
            )}
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={applyDraftConfig}
                disabled={isPending}
              >
                {isPending ? 'Applying...' : 'Apply config'}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setDraftConfig({ ...defaultDraft });
                  setConfigError(null);
                }}
              >
                Reset assignment input
              </button>
            </div>
            <details className={styles.disclosure}>
              <summary className={styles.disclosureSummary}>
                Inspect assignment payload and live callbacks
              </summary>
              <div className={styles.disclosureBody}>
                <article className={styles.panel}>
                  <div className={styles.cardHeader}>
                    <span className={styles.sectionLabel}>Reference input</span>
                    <h3 className={styles.panelTitle}>
                      Exact payload from the assignment
                    </h3>
                  </div>
                  <pre className={styles.codeBlock}>
                    <code>{assignmentInputSnippet}</code>
                  </pre>
                </article>
                <article className={styles.panel}>
                  <div className={styles.cardHeader}>
                    <span className={styles.sectionLabel}>Runtime surface</span>
                    <h3 className={styles.panelTitle}>
                      State and callback feedback
                    </h3>
                  </div>
                  <div className={styles.stateGrid}>
                    {stateCards.map(([label, value]) => (
                      <article key={label} className={styles.stateCard}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </article>
                    ))}
                  </div>
                  <ul className={styles.eventList}>
                    {eventLog.map((message, index) => (
                      <li key={`${message}-${index}`}>{message}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </details>
          </article>
        </section>

        <section id="api" className={styles.section}>
          <div className={styles.cardHeader}>
            <span className={styles.sectionLabel}>API</span>
            <h2 className={styles.cardTitle}>Core package surface</h2>
          </div>
          <article className={styles.panel}>
            <div className={styles.cardHeader}>
              <span className={styles.sectionLabel}>Props</span>
              <h3 className={styles.panelTitle}>Core inputs</h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {PROP_ROWS.map(([name, type, description]) => (
                    <tr key={name}>
                      <td>
                        <code>{name}</code>
                      </td>
                      <td>
                        <code>{type}</code>
                      </td>
                      <td>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
          <article className={styles.panel}>
            <div className={styles.cardHeader}>
              <span className={styles.sectionLabel}>Callbacks</span>
              <h3 className={styles.panelTitle}>Extensibility surface</h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Callback</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {CALLBACK_ROWS.map(([name, description]) => (
                    <tr key={name}>
                      <td>
                        <code>{name}</code>
                      </td>
                      <td>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
          <article className={styles.panel}>
            <div className={styles.cardHeader}>
              <span className={styles.sectionLabel}>Controls</span>
              <h3 className={styles.panelTitle}>Keyboard support</h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Shortcut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {SHORTCUT_ROWS.map(([key, description]) => (
                    <tr key={key}>
                      <td>
                        <code>{key}</code>
                      </td>
                      <td>{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
