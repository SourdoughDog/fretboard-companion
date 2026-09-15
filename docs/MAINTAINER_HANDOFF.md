# Fretboard companion — cold-session handoff

Updated: September 14, 2026. Read this before changing the app. This is a working reference for a new coding session with no conversation history. Verify mutable facts against the files and GitHub before acting.

## Start here

1. Read `AGENTS.md`, this document, and `README.md`.
2. Inspect `git status`, the current branch, remotes, and actual file contents. Do not assume a clean checkout. The original workstation has a known unfinished local Git initialization; its workspace-level `SESSION_HANDOFF.md` explains it.
3. Use this repository's `mac/` files for new development. An older development tree may also exist outside the repository; it is historical, not a second source to keep editing.
4. Identify the requested change and preserve existing behavior. Do not start the deferred refactor merely because this document discusses it.
5. Build/test only as appropriate to the change. Keep verification silent and offscreen.

## Product and ownership

- Public repository: https://github.com/SourdoughDog/fretboard-companion
- Current native source/local build: **1.23**, bundle build **24**. The last published release remains v1.20 until separately published.
- Release: https://github.com/SourdoughDog/fretboard-companion/releases/tag/v1.20
- Latest downloadable app: https://github.com/SourdoughDog/fretboard-companion/releases/latest/download/Guitar.Fretboard.for.Mac.zip
- UI branding: **Fretboard companion**. Native bundle/window name remains **Guitar Fretboard** / `Guitar Fretboard.app`; do not silently rename the bundle or its identifier.
- Bundle identifier: `local.guitar.fretboardcompanion`.
- Native target: Apple silicon, macOS 13+. Locally/ad-hoc signed, not Apple-notarized; not a Windows, Linux, Intel, or DAW plugin release.
- README credit approved by the owner: “Built by SourdoughDog with coding and design assistance from OpenAI Codex.” Codex has no personal collaborator account. Do not fabricate one or add OpenAI as a maintainer.
- No open-source license was selected at initial publication. Public visibility is not permission to choose a license on the owner's behalf.

## Owner's established preferences

- Work on the **native app**. Keep the original standalone HTML v1.4 intact unless explicitly asked to expand it.
- Preserve prior releases/source as backups before substantial app changes.
- **Do not interrupt the owner's screen or audio during review.** They often watch a show while work runs. Do not launch or focus the live app, take desktop screenshots, or play audio for routine testing. Use the hidden WebKit harness and silent audio mocks.
- UI should be approachable, clean, and enjoyable. Theme differences may include typography, shape, borders, and illustrations, not just color swaps.
- Theme choice and independent per-tab number/Roman settings belong in the native File menu, not an extra main-screen settings panel.
- Implement authorized work without repeated confirmation. Credentials, new permissions, unexpected publication, and irreversible changes still follow the active session's authorization rules.
- The user explicitly deferred reorganizing the big HTML/JavaScript file. Refactoring is a future topic, not an active task.

## Features to preserve

### Scales

26 scales/modes, 17 root spellings covering all 12 pitch classes, fret positions 0–12 in standard tuning, typo-tolerant search, degree formulas, note spelling, and ordered scale-specific harmony.

The harmony row must actually follow the selected scale. Do not reduce every choice to generic major/minor. Seven-note scales stack alternate degrees. Named subset scales use explicitly labeled reference scales (see `harmonySource`): major/minor pentatonic and blues reference major/natural minor; Hirajoshi references natural minor; bebop dominant references Mixolydian. Other non-seven-note scales show alternate-note voicings and explain the limitation. These references were a deliberate iteration with the user.

Degrees are measured against the major scale on the chosen root, including in minor: `1 2 b3 4 5 b6 b7`. Enharmonic spelling matters; do not replace every note name with a generic chromatic spelling.

### Chords

34 chord types and three views: **Fretboard**, **Chord shapes**, **Chord finder**. Shapes are the initial default. Shapes include open, barre, movable/compact, and jazz-shell categories. Hide categories with no available shapes; reset an unavailable selected filter to All shapes. Label omitted tones and non-root bass notes. Dot labels are chord degrees, not finger numbers.

The finder starts blank, selects at most one fret per string, and uses `null` for muted strings (zero is a sounding open string). Clicking again removes a note. It recognizes exact formulas, inversions, alternate names, optional omitted perfect fifths, and complete chords over a separate bass note. Exact matches rank first; roots in the actual bass rank earlier within a class. The root must be present; this is not a universal rootless-chord inference engine. Repeated pitch classes count once, but playback preserves all selected string pitches. Bass is the lowest sounding MIDI pitch, not necessarily the lowest numbered/physically thickest selected string.

Finder names update immediately; the leading name also appears above the board. It offers note-name hints, Clear all, Hear selection, and Explore chord. Explore switches to common shapes without erasing the finder voicing. Finder notes last for the running session; the view preference is persisted. Don't add unsignaled automatic sound on note selection.

### Progressions

Nine in-key palette styles, 20 starting ideas, searchable chord library, per-card editing, live harmony labels, borrowing, secondary dominants, applied ii–V patterns, and tritone substitutions. Context labels are interpretations, and must not claim certainty where context is insufficient.

Surface dragging reorders tiles; there are no drag handles. Command–Shift-drag copies a tile, with gradual appearance and motion/swing. There is a 12px initial resistance threshold, not a hold delay. Feedback is a short, fixed-pitch, soft wood-block knock. Respect the sound toggle and Reduce Motion. Do not revert to quiet delayed plucks or pitch-changing feedback.

Loop lives above the progression, not in the synth window. Add/remove/reorder/copy while playing should preserve the currently sounding chord and reconcile future events. Clearing the sequence stops playback.

### Sound, export, and shortcuts

The polyphonic wavetable synth runs in the main web view. Its separate native panel is a controller, not a second audio engine. Closing the panel leaves playback running; closing the main app stops it. Live timbre/volume changes work during playback; tempo, envelope, and performance changes follow the existing scheduling rules.

Performance modes: held chords, gentle strum, ascending, descending, up/down, and fingerpicked; rates, humanization, and swing. MIDI exports support held chords or the chosen performance, with note-offs, tempo, velocities, and one pass through the progression. Copy MIDI uses a file URL on the Mac clipboard; DAWs differ in paste support, so Save MIDI remains available.

Space plays/stops the progression outside typing fields and ordinary controls. Command–1/2/3 selects primary tabs; Command–4 opens synth; Command–F searches; Command-click previews; Escape stops/cancels; arrow keys navigate fretboards and Enter/Space selects. Preserve text/control keyboard behavior.

## Architecture and source map

| File | Purpose |
| --- | --- |
| `mac/app-source.html` | Main DOM, base CSS, embedded shared-theme block, and the large application JavaScript script. This is currently deliberately a single file. |
| `mac/main.swift` | Cocoa windows and menus; WKWebView bridge; appearance; synth panel; clipboard/MIDI save handling. |
| `mac/synth-window.html` | Synth panel UI and its inline controller JavaScript; receives state from the main view. |
| `mac/themes.css` | Authoritative shared theme styles. Edit this instead of the generated copies. |
| `mac/art/*.svg` | Five original vector illustrations embedded as data URLs. |
| `mac/build-themes.py` | Expands `@styled`, `@classic`, `@nature`, and `@art(name)` into CSS; replaces the marked shared CSS block in BOTH HTML files. |
| `mac/package.py` | Builds HTML resources, Info.plist, generated user guide, and ICNS icon using Pillow. |
| `scripts/build.py` | Runs resource generation, Swift compilation, ad-hoc signing/verification, staging, and ZIP creation. Never launches the app. |
| `tests/logic.cjs` | Broad regression suite with a minimal DOM and silent audio graph adapter. |
| `tests/check-hidden-webkit.swift` | Nonactivating, unshown WebKit test runner, with a nonpersistent data store and AudioContext disabled. |
| `tests/check-hidden-finder.js` | Finder recognition/interaction checks including all themes, native audition pitches, and view restoration. |
| `scripts/check-ui.py` | Compiles/runs the hidden WebKit checks at 540 and 1100 CSS px. |
| `legacy/guitar_fretboard_companion.html` | Frozen standalone HTML v1.4; intentionally fewer features. |
| `docs/User Guide.txt` | User-facing reference. Update when behavior changes. |

Useful JavaScript entry points (search by symbol; line numbers move):

- Data/spelling: `SCALES`, `CHORDS`, `ROOTS`, `degreePitch`, `degreeDistance`, `spell`, `rootPitch`, `noteData`.
- Views/state: `state`, `preferences`, `configure`, `configureChord`, `render`, `syncChordView`, `setChordView`, `showPage`, `applyPreferences`.
- Harmony: `harmonySource`, `scaleHarmony`, `renderScaleHarmony`, `analyzeChord`, `sequenceAnalysis`.
- Shapes: `chordShapes`, `shapePitches`, `shapeOmissions`, `renderChordShapes`, `hearShape`.
- Finder: `finder`, `identifyVoicing`, `finderPitches`, `renderFinder`, `toggleFinderNote`, `hearFinder`.
- Progressions: `progression`, `changeProgression`, `renderArranger`, `palettes`, `searchLibrary`, `applyDrop`.
- Audio: `synthNotes`, `ensureSynth`, `playProgression`, `setSynthOption`, `reconcilePlayback`, `performanceEvents`, `scheduleSynthChord`, `stopPlayback`.
- Bridge/export: `publishSynthState`, `setSynthOption`, `midiBytes`, `exportMidi`, `midiExportResult`; synth control dispatch lives in Swift's `synthControl` message handler.

State persists via localStorage key **`guitar-companion-v12`** even though the app is now v1.20. Saved payload includes `preferences`, `progression`, `synth`, and `paletteSeed`. Preserve migration/validation. Defaults: Classic theme; numbers in Scales/Chords; Roman numerals in Progressions; shapes view; UI sound enabled. Do not reset a user's saved theme on upgrades.

Tuning arrays use different orientations: `OPEN_MIDI=[64,59,55,50,45,40]` is high e to low E for the horizontal board/finder; shape routines use low-to-high tuning. Mixing them breaks bass identification and audition.

Swift message handlers include `appearance`, `synthState`, `openSynth`, `midiExport`, and the synth panel's `synthControl`. Shared state travels through Swift to `receiveSynthState` in the panel. Native menu setters call named JavaScript globals; keep their interfaces stable.

## Themes and illustration history

| ID | Display name |
| --- | --- |
| `classic` | Classic (fresh-install default) |
| `classic-coast` | Classic · Coast |
| `classic-harbor` | Classic · Harbor |
| `teal` | Lagoon |
| `ocean` | Ocean |
| `plum` | Plum |
| `forest` | Forest |
| `midnight` | Midnight |
| `retro` | Sunset Studio |
| `pixel` | Pocket Pixel |
| `fantasy` | Moonlit Grimoire |
| `orbital` | Orbital Console |
| `neon` | Neon Arcade |
| `letterpress` | Letterpress |
| `blueprint` | Blueprint |

Native theme menu list, JS validators/restoration, option list, and CSS scopes must all agree if adding a theme. Each theme applies to the main app and synth panel. CSS specificity can override result sizes or uppercase minor chord names: preserve `Cm` vs `CM` and current finder overrides.

The masthead is a compact two-line “Fretboard / companion” wordmark in the selected theme's font. The former “Every degree, frets 0–12” text and “Works offline” badge were explicitly removed.

**Do not repeat the v1.18 artwork regression.** Lagoon and Forest originally had hard left seams. Shrinking/recomposing them with `background-size:contain` and redrawing the existing waves/mountains was rejected. v1.19 restored their original shapes/size/right alignment and extended the SVG canvas to the LEFT (`viewBox="-180 0 820 240"`) to complete the shore/foothill. Their main-header pseudo-elements now span the header; a narrow-screen mask protects title legibility. The synth retains its previous crop/scale. Keep existing artwork intact if further adjusting edges.

## Build and verification

Run from repository root. Normal developer setup:

```sh
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements-build.txt
python3 scripts/build.py
node tests/logic.cjs
python3 scripts/check-ui.py
```

Both Python scripts accept `--sdk /path/to/MacOSX.sdk`. Use a compiler-compatible SDK. The original workstation required SDK 26.5 because its default SDK 27 did not match the installed Swift compiler. It compiled with `-swift-version 5` and `-target arm64-apple-macos13.0`. Two existing warnings about `Selector(("copy:"))` / `Selector(("selectAll:"))` are benign.

The build generates:

- `build/Guitar Fretboard.app`
- `build/Guitar Fretboard for Mac/` staging directory
- `build/Guitar Fretboard for Mac.zip`
- Generated guide, HTML hash record, and module cache under ignored `build/`.

The build recreates its staging directory and replaces its ZIP. Back up release artifacts before rebuilding if needed. It does not copy to the owner's Desktop/Applications and does not update an already-running app. Never modify a binary in place while running it; build a new bundle and have the user replace/reopen their copy.

No screenshots or sound are necessary for logic checks. The native runner uses `.prohibited` activation, an unshown window, and a private ephemeral store. In a sandbox it may require explicit tool escalation; explain that it renders its own content silently without reading the desktop. A native UI check is not a listening test. Report the distinction accurately.

For visual changes, inspect rendered output from a hidden WKWebView snapshot harness if available. The original workstation has one outside this repo (see its local handoff). Do not use the live app or desktop capture as a shortcut.

For a release: run relevant checks, build, verify code signature and ZIP integrity, confirm version/build metadata, compare packaged resources, preserve legacy HTML, and validate that shared theme blocks are identical. The source markup has a favicon data URL in addition to the five illustration URLs; don't mistake that extra URL for an embedding error.

Bump native version/build in **both** `mac/package.py` and the About panel in `mac/main.swift`. Update README/changelog/user guide as appropriate. Regenerate themes through the build; don't hand-edit generated blocks. The initial GitHub asset used `Guitar.Fretboard.for.Mac.zip` (dots) as a release-friendly copy of the build ZIP, with matching `SHA256SUMS.txt`. Keep the latest-download README link valid if naming changes.

## GitHub and change discipline

The public v1.20 release and all initial 22 source files were verified against the prepared local files; release ZIP/checksum digests were verified in GitHub's UI. README later gained a direct download link and the approved credit. Those README-only changes did not rebuild/reissue v1.20.

Do not overwrite newer remote edits with a stale local upload. Fetch/compare first where possible; preserve local differences if repairing an unfinished checkout. Lack of a local HEAD is not proof that the project was never published. Do not force-push to resolve it.

Initial publication used GitHub's signed-in browser UI because no GitHub CLI or connected GitHub tool was available. The account was **SourdoughDog**. Browser authentication and available tools must be checked anew; never reuse tab IDs or assume credentials. No tokens are stored in this document. Read current browser/upload tool instructions before UI actions. Do not change repository visibility, collaborators, license, or authentication while doing an unrelated code task.

## Deferred refactor — only if requested later

The user accepted keeping HTML/CSS/JavaScript + Swift for now and explicitly postponed modularization. A future refactor could separate theory data, spelling/harmony, views/state, progression editing, audio scheduling, and native bridge interfaces.

Important dependencies for that future work:

- Current function initialization order and direct DOM wiring matter; do not introduce temporal-dead-zone or first-render failures.
- Swift calls globals via `evaluateJavaScript`; moving everything into ES modules without a bridge adapter will break native menus/synth/MIDI.
- Both native views currently call `loadFileURL(..., allowingReadAccessTo: url)` for the single HTML file. External JS/CSS assets would need deliberate bundle-relative read access to the Resources directory and navigation-policy review, not unrestricted filesystem access.
- `build-themes.py` rewrites both HTML files; choose one authoritative stylesheet and update the packaging/tests if extraction changes that contract.
- The Node harness currently extracts a single inline `<script>`. It must be adapted before splitting scripts; do not drop test coverage to make a refactor pass.
- Preserve localStorage schema, saved choices, native bundle ID, exact voicing playback, and all public bridge entry points.

## Updating this handoff

After meaningful work, update the version, file map, tested commands, behavior caveats, and outstanding work here. Keep environment-specific paths and temporary authentication/Git state in the workspace-local handoff instead of portable public docs. A new session should be able to continue from these files without rereading the original conversation.

## v1.21 audio update

The sound bank now has 12 presets. `SOUND_RANGES` defines the persisted and
validated sound controls; preset selection/reset copies only sound fields,
leaving transport/performance untouched. The native panel receives preset
metadata through `publishSynthState`, and uses the existing `set` bridge.
Old saved presets gain their corresponding defaults before valid saved values
are overlaid. The localStorage key and bundle identity are unchanged.

Each note has two detuned stereo voices, each blending two normalized endpoint
waves (four oscillators). Morph changes smooth gains; preset changes crossfade
oscillator banks over 40 ms. A 512-entry per-context PeriodicWave cache holds
pitch-filtered tables; the highest octave of partials tapers below Nyquist with
headroom for maximum vibrato/detuning. Normalization happens before pitch
filtering, with Web Audio's automatic normalization disabled. See the
[Web Audio specification](https://www.w3.org/TR/webaudio-1.0/#PeriodicWave).

A session owns its room convolver, dry/wet gains and shared vibrato LFO. Groups
feed its effects input; the final session bus fades both dry and wet on Stop.
Natural completion waits for the 1.6-second room tail. Note/bank onended handlers
disconnect voices and modulation edges. Controls for envelope apply to unscheduled
notes; preset changes preserve existing amplitude envelopes. Filter controls
retain a smooth contour; unrelated controls do not cancel filter automation.

`tests/check-audio.async.js` uses real OfflineAudioContext rendering in silent
hidden WebKit. It checks all presets, dense chords, live changes, high pitches,
long releases and sample rates 44.1/48/96 kHz for finite output, headroom, tails
and cleanup. This is not a speaker listening test. `scripts/check-audio.py`
runs it and records a report under build/. `tests/check-hidden-synth.js` checks
all controls and themes through the controller bridge. The original standalone
HTML and earlier release artifacts remain unchanged. No GitHub publication
is included in this update.

Validation for this update: the native finder tests passed at 540/1100 CSS px,
and synth control tests passed at 520/680 CSS px across all 15 themes. Visual
review used an offscreen Classic panel snapshot. Seventeen real offline audio
scenes passed, including a full output chain at maximum master volume, rapid
preset switching before and during notes, and eight overlapping dense chords.
Resonance has smoothed gain compensation on existing as well as new notes.

The full Node logic suite also passed after this update, including persistence,
MIDI, theory, shapes, live sequence edits, scheduling and stop/resume behavior.

## v1.22 native control fix

The old Swift `synthControl` handler retained an eight-key allowlist and silently
dropped all 12 new controls. v1.22 removes that duplicate list: messages from
the synth web view are JSON-encoded and forwarded to `setSynthOption`; the
existing `validSynthOption` rejects unknown keys, invalid types and ranges.

The earlier v1.21 checks covered the controller and engine separately, not
the actual Swift bridge. `scripts/check-native-synth.py` now compiles the full
production app class unchanged with a test-only launch extension. Two private
WKWebViews use its real handler for slider changes and state publication.
Three chord previews use real offline Web Audio graphs without a sound device;
checks cover scheduled settings, saved/restored settings, panel values, invalid
input and preset reset. Keep this check when adding future synth controls.

The native integration test passed all 12 new controls through three previews
and failed as expected against the preserved v1.21 handler. v1.22/build23
was built, code-signed and verified, with ZIP integrity and binary/resource
contents checked. No installed app was replaced and no release was published.

## v1.23 synth organization

The controller now has Sound/Performance tabs (`setSynthTab`) with keyboard
arrow/Home/End navigation. The preset header and Play/Stop/Volume footer remain
visible around an independently scrolling workspace. Sound groups Wave blend
and filter controls under Tone, then Envelope and Space & movement disclosures.
Reverb is under Space & movement. Performance groups style, tempo, note pace,
humanize and swing. Tab changes do not send audio commands or reset settings;
state updates preserve the selected tab and open sections.

The audio engine and native control routing were not changed. Native integration
checks passed all 12 expanded controls across three chord previews, storage
restoration and preset reset. UI checks passed both tabs in all 15 themes at
520/680 CSS px; offscreen visual review covered both Classic tabs at 680×820
and the compact Midnight layout at 520×640. Earlier v1.22 artifacts are backed
up under build/backups/v1.22/.
