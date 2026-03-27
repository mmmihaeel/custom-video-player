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

type DraftPreset = {
  description: string;
  draft: DraftConfig;
  id: string;
  label: string;
};

const PACKAGE_NAME = '@mmmihaeel/custom-video-player';

const PROP_ROWS = [
  ['source', 'VideoSource', 'Required HLS source descriptor.'],
  ['chapters', 'VideoChapter[]', 'Normalized timeline markers.'],
  ['durationHint', 'number', 'Fallback duration before metadata resolves.'],
  ['defaultQuality', `'auto' | number`, 'Initial quality preference.'],
  ['defaultVolume', 'number', 'Initial volume in the `0..1` range.'],
  ['playbackRates', 'number[]', 'Visible speed options in the settings menu.'],
  ['seekStep', 'number', 'Keyboard seek increment in seconds.'],
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

function buildDraftPresets(baseUrl: string): DraftPreset[] {
  const showcase = buildDefaultDraft(baseUrl);

  return [
    {
      id: 'showcase',
      label: 'Showcase',
      description: 'Balanced defaults for the main package presentation.',
      draft: showcase
    },
    {
      id: 'muted-qa',
      label: 'Muted QA',
      description: 'Autoplay-safe muted startup for silent regression checks.',
      draft: {
        ...showcase,
        autoPlay: true,
        defaultQuality: '720',
        defaultVolume: '0',
        muted: true
      }
    },
    {
      id: 'lean-embed',
      label: 'Lean embed',
      description: 'Smaller configuration surface for a tighter host shell.',
      draft: {
        ...showcase,
        chaptersJson: JSON.stringify(demoVideo.chapters.slice(0, 2), null, 2),
        durationHint: '180',
        playbackRates: '1, 1.25, 1.5',
        seekStep: '10'
      }
    }
  ];
}

function parsePlaybackRates(input: string) {
  const values = input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  return [...new Set(values)];
}

function parseDefaultQuality(input: string): VideoQualityValue {
  if (input === 'auto') {
    return 'auto';
  }

  return Number(input);
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

    if (!draft.sourceUrl.trim()) {
      return {
        config: null,
        error: 'Source URL is required.'
      };
    }

    if (!Array.isArray(chapters)) {
      return {
        config: null,
        error: 'Chapters must be a JSON array.'
      };
    }

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

    if (playbackRates.length === 0) {
      return {
        config: null,
        error: 'Provide at least one playback rate.'
      };
    }

    if (!Number.isFinite(durationHint) || durationHint <= 0) {
      return {
        config: null,
        error: 'Duration hint must be a positive number.'
      };
    }

    if (
      !Number.isFinite(defaultVolume) ||
      defaultVolume < 0 ||
      defaultVolume > 1
    ) {
      return {
        config: null,
        error: 'Default volume must stay between 0 and 1.'
      };
    }

    if (!Number.isFinite(seekStep) || seekStep <= 0) {
      return {
        config: null,
        error: 'Seek step must be a positive number.'
      };
    }

    return {
      config: {
        autoPlay: draft.autoPlay,
        chapters,
        defaultQuality: parseDefaultQuality(draft.defaultQuality),
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
    return {
      config: null,
      error: 'Chapters JSON is invalid.'
    };
  }
}

function appendEvent(
  setEvents: Dispatch<SetStateAction<string[]>>,
  nextMessage: string
) {
  setEvents((currentEvents) => {
    if (currentEvents[0] === nextMessage) {
      return currentEvents;
    }

    return [nextMessage, ...currentEvents.slice(0, 7)];
  });
}

function formatTime(value: number) {
  const totalSeconds = Math.max(0, Math.floor(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function App() {
  const draftPresets = useMemo(
    () => buildDraftPresets(import.meta.env.BASE_URL),
    []
  );
  const defaultDraft = useMemo(() => draftPresets[0]!.draft, [draftPresets]);
  const initialParse = useMemo(
    () => parseDraftConfig(defaultDraft),
    [defaultDraft]
  );
  const [draftConfig, setDraftConfig] = useState(defaultDraft);
  const [appliedConfig, setAppliedConfig] = useState<AppliedConfig>(
    initialParse.config!
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<VideoPlayerState | null>(null);
  const [playerRevision, setPlayerRevision] = useState(0);
  const [eventLog, setEventLog] = useState<string[]>([
    'Ready for interaction. Apply a config change to remount the player.'
  ]);
  const [isPending, startTransition] = useTransition();

  const installSnippet = `pnpm add ${PACKAGE_NAME}`;
  const usageSnippet = useMemo(
    () => `import { VideoPlayer } from '${PACKAGE_NAME}';

const chapters = ${JSON.stringify(appliedConfig.chapters.slice(0, 2), null, 2)};

<VideoPlayer
  source={{ type: 'hls', src: '${appliedConfig.sourceUrl}' }}
  durationHint={${appliedConfig.durationHint}}
  chapters={chapters}
  defaultQuality={${typeof appliedConfig.defaultQuality === 'number' ? appliedConfig.defaultQuality : "'auto'"}}
  defaultVolume={${appliedConfig.defaultVolume}}
  playbackRates={[${appliedConfig.playbackRates.join(', ')}]}
/>;`,
    [appliedConfig]
  );

  const playerKey = `${playerRevision}:${appliedConfig.sourceUrl}:${appliedConfig.posterUrl}:${appliedConfig.defaultQuality}:${appliedConfig.defaultVolume}:${appliedConfig.durationHint}:${appliedConfig.seekStep}:${appliedConfig.playbackRates.join('-')}`;
  const stateCards = useMemo(
    () => [
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
      [
        'Volume',
        playerState ? `${Math.round(playerState.volume * 100)}%` : '--'
      ],
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
    ],
    [playerState]
  );

  function updateDraft<K extends keyof DraftConfig>(
    key: K,
    value: DraftConfig[K]
  ) {
    setDraftConfig((currentDraft) => ({
      ...currentDraft,
      [key]: value
    }));
  }

  function applyDraftConfig() {
    const parsedDraft = parseDraftConfig(draftConfig);

    if (!parsedDraft.config) {
      setConfigError(parsedDraft.error);
      return;
    }

    setConfigError(null);
    startTransition(() => {
      setAppliedConfig(parsedDraft.config!);
      setPlayerRevision((value) => value + 1);
    });
    appendEvent(setEventLog, 'Configuration applied from the demo playground.');
  }

  function resetDraftConfig() {
    setDraftConfig(defaultDraft);
    setConfigError(null);
  }

  function applyPreset(preset: DraftPreset) {
    setDraftConfig({ ...preset.draft });
    setConfigError(null);
    appendEvent(setEventLog, `${preset.label} preset loaded into the editor.`);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Reusable React package</span>
            <h1 className={styles.title}>Custom Video Player</h1>
            <p className={styles.lead}>
              A package-oriented demo for a custom HLS player with chapter
              awareness, layered settings, keyboard support, picture-in-picture,
              and a host-friendly callback surface.
            </p>

            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#playground">
                Open playground
              </a>
              <a className={styles.secondaryAction} href="#api">
                Review API surface
              </a>
            </div>

            <div className={styles.badgeRow}>
              <span>{PACKAGE_NAME}</span>
              <span>React 19</span>
              <span>TypeScript</span>
              <span>HLS</span>
              <span>GitHub Pages demo</span>
            </div>
          </div>

          <aside className={styles.commandCard}>
            <div className={styles.cardHeader}>
              <span className={styles.sectionLabel}>Fast path</span>
              <h2 className={styles.cardTitle}>Install, preview, validate</h2>
            </div>

            <div className={styles.commandList}>
              <div className={styles.commandItem}>
                <span>Install</span>
                <code>{installSnippet}</code>
              </div>
              <div className={styles.commandItem}>
                <span>Run demo</span>
                <code>pnpm dev</code>
              </div>
              <div className={styles.commandItem}>
                <span>Validation</span>
                <code>pnpm validate && pnpm test:e2e</code>
              </div>
            </div>

            <div className={styles.metricGrid}>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Current fixture</span>
                <strong>{formatTime(appliedConfig.durationHint)}</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Chapters</span>
                <strong>{appliedConfig.chapters.length}</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Initial quality</span>
                <strong>
                  {appliedConfig.defaultQuality === 'auto'
                    ? 'Auto'
                    : `${appliedConfig.defaultQuality}p`}
                </strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Default volume</span>
                <strong>
                  {Math.round(appliedConfig.defaultVolume * 100)}%
                </strong>
              </article>
            </div>
          </aside>
        </section>

        <section id="playground" className={styles.stage}>
          <div className={styles.previewColumn}>
            <article className={styles.playerCard}>
              <div className={styles.cardHeader}>
                <span className={styles.sectionLabel}>Live preview</span>
                <h2 className={styles.cardTitle}>
                  Package behavior in context
                </h2>
              </div>

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
                  if (Math.floor(time) % 30 === 0 && time > 0) {
                    appendEvent(
                      setEventLog,
                      `onTimeUpdate: checkpoint ${formatTime(time)}`
                    );
                  }
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

            <article className={styles.eventCard}>
              <div className={styles.cardHeader}>
                <span className={styles.sectionLabel}>Callback stream</span>
                <h2 className={styles.cardTitle}>Recent package events</h2>
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
                {eventLog.map((eventMessage, index) => (
                  <li key={`${eventMessage}-${index}`}>{eventMessage}</li>
                ))}
              </ul>
            </article>
          </div>

          <aside className={styles.playgroundCard}>
            <div className={styles.cardHeader}>
              <span className={styles.sectionLabel}>Playground</span>
              <h2 className={styles.cardTitle}>Edit props and re-apply</h2>
            </div>

            <div className={styles.presetList}>
              {draftPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={styles.presetButton}
                  onClick={() => applyPreset(preset)}
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>

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

            {configError ? (
              <p className={styles.errorNote}>{configError}</p>
            ) : (
              <p className={styles.helperNote}>
                Apply remounts the player with the current props so default
                playback behavior can be retested without refreshing the page.
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
                onClick={resetDraftConfig}
              >
                Reset fixture
              </button>
            </div>
          </aside>
        </section>

        <section className={styles.docsSection}>
          <div className={styles.twoColumn}>
            <article className={styles.panel}>
              <div className={styles.cardHeader}>
                <span className={styles.sectionLabel}>Usage</span>
                <h2 className={styles.cardTitle}>Install and embed</h2>
              </div>

              <pre className={styles.codeBlock}>
                <code>{installSnippet}</code>
              </pre>
              <pre className={styles.codeBlock}>
                <code>{usageSnippet}</code>
              </pre>
            </article>

            <article className={styles.panel}>
              <div className={styles.cardHeader}>
                <span className={styles.sectionLabel}>Integration model</span>
                <h2 className={styles.cardTitle}>What the host owns</h2>
              </div>

              <ul className={styles.infoList}>
                <li>Media source URLs, auth, and upstream data fetching.</li>
                <li>
                  Chapter normalization and persistence of user preferences.
                </li>
                <li>
                  Analytics and custom side effects through callback props.
                </li>
                <li>
                  Layout composition and any additional shell UI around the
                  player.
                </li>
              </ul>
            </article>
          </div>

          <div id="api" className={styles.twoColumn}>
            <article className={styles.panel}>
              <div className={styles.cardHeader}>
                <span className={styles.sectionLabel}>Props</span>
                <h2 className={styles.cardTitle}>Core inputs</h2>
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
                <span className={styles.sectionLabel}>
                  Callbacks and controls
                </span>
                <h2 className={styles.cardTitle}>Extensibility surface</h2>
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
          </div>
        </section>
      </div>
    </main>
  );
}
