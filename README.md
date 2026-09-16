# Fretboard companion

An offline guitar theory companion for macOS and Windows: explore the neck, discover chords, arrange progressions, and hear what you create.

## Windows edition

The parallel Windows edition uses the current v1.27 interface, theory data and audio engine. It adds Windows menus, Ctrl shortcuts, a separate synth window, printing, and native MIDI save/file-copy support. All 15 themes and local libraries are preserved. It runs offline on Windows 10/11 x64 without installing Node.js or a browser. Windows and Mac keep separate local libraries; automatic cross-device sync is not included.

Build a setup installer and portable ZIP on Windows:

```sh
npm ci
npm test
npm run test:windows
npm run build:windows
```

Artifacts appear in `build/windows-release/`. Open the setup `.exe`, or extract the entire portable ZIP and open `Guitar Fretboard.exe`. The Windows build is unsigned. See [Windows build and test notes](windows/README.md) for requirements, storage, architecture, and verification limits. The Mac download below is unchanged; the Windows artifacts have not been published to GitHub.

## Get the app

[Download the latest Mac app](https://github.com/SourdoughDog/fretboard-companion/releases/latest/download/Guitar.Fretboard.for.Mac.zip), unzip it, and open **Guitar Fretboard.app**. You can move the app into Applications. See [release notes and checksums](https://github.com/SourdoughDog/fretboard-companion/releases/latest).

The native release requires **macOS 13 or later on an Apple silicon Mac (M1 or newer)**. It does not require a browser, Codex, a login, or an internet connection. The app is locally signed and **not Apple-notarized**. For an unidentified-developer warning on a copy you trust, follow [Apple’s per-app opening instructions](https://support.apple.com/102445).

## Explore and play

- **Scales:** 26 scales and modes, note spelling, degree formulas, and scale-specific harmony across frets 0–12.
- **Chords:** 34 chord types, full fretboard maps, open and barre shapes, movable voicings, and jazz shells.
- **Chord finder:** start with a blank fretboard, choose one note per string, and discover possible names, inversions, omitted fifths, and chords over a separate bass note. Hear the exact notes you selected.
- **Progressions:** arrange chords by dragging, search the library, try 20 ideas, and explore borrowing, applied dominants, and tritone substitutions.
- **Wavetable synth:** 12 presets with Sound and Performance tabs, editable envelopes, filters, stereo, vibrato and reverb; strumming, arpeggios, humanization, swing, and MIDI export.
- **Practice:** count-ins, metronome, bars per chord, and gradual tempo increases; smooth voicing, inversions, spacing, and register.
- **Personal library:** named sounds with favorites, an editable envelope graph, and saved progressions organized into collections.
- **Ear training:** interval and chord-quality games with replay, local scores, and answer notes on the fretboard.
- **Appearance:** 15 themes and independent number/Roman-numeral preferences for each tab, available in the File menu.

Your settings, progression, sound library, saved progression collections, and ear-training scores save locally. Finder selections remain while the app is open. No analytics, accounts, or network services are required. Music analysis suggests useful interpretations rather than a unique answer for every context. The chord finder checks the supported formulas with the root present.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| Space | Play or stop the progression, outside text fields and controls |
| Command–1 / 2 / 3 | Scales / Chords / Progressions |
| Command–4 | Wavetable Synth |
| Command–5 | Ear training |
| Command–F | Search the current section |
| Command-click | Preview a chord |
| Command–Shift-drag | Copy a progression tile |
| Arrow keys; Enter / Space | Move and select on the fretboard |

See the [user guide](docs/User%20Guide.txt) for details.

## Build the Mac app

Requires macOS, Xcode Command Line Tools, Python 3.10+, and Pillow. Node.js 20+ is used for the logic tests. The app has no third-party runtime dependencies; it uses Cocoa, WebKit, and Web Audio.

```sh
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements-build.txt
python3 scripts/build.py
```

The finished app and ZIP appear in `build/`. The build only creates files; it never opens the app. It targets Apple silicon and macOS 13+. Local ad-hoc signing does not perform Apple notarization.

If your selected SDK and Swift compiler are from different toolchain versions, select a matching Xcode toolchain or pass a compatible SDK explicitly:

```sh
python3 scripts/build.py --sdk /path/to/MacOSX.sdk
```

## Tests

```sh
node tests/logic.cjs
node tests/features.cjs
python3 scripts/check-ui.py
python3 scripts/check-audio.py
python3 scripts/check-native-synth.py
```

The logic suite covers scales, chords, harmony, search, progression editing, shapes, MIDI, playback scheduling, and persistence. Native UI checks cover the chord finder in all themes at wide and narrow sizes, including 408 chord/root combinations. The synth panel is checked across all 15 themes at two window sizes. Offline audio checks render 18 scenes into memory, including rapid preset changes, overlapping notes, long releases and 44.1/48/96 kHz sample rates. They check clipping headroom, finite samples, discontinuities, tails and voice cleanup. No screen capture or speaker playback is needed. Both native test runners accept `--sdk`.

## Source layout

- `mac/app-source.html`: main app UI, music logic, and audio engine.
- `mac/main.swift`: native windows, menus, clipboard, and MIDI file handling.
- `mac/synth-window.html`: separate synth controls.
- `mac/themes.css` and `mac/art/`: shared styling and embedded SVG illustrations.
- `mac/build-themes.py`: embeds styles and artwork into both HTML files.
- `mac/package.py`: assembles resources, metadata, and the generated user guide.
- `scripts/`: portable build and silent UI-check commands.
- `legacy/`: preserved standalone HTML v1.4, with fewer features than the native app.

Edit the shared CSS or SVG sources, then run the build to regenerate the embedded theme blocks. The older standalone HTML is intentionally preserved separately. The current native app source and latest published release are version **1.27**.

## Credits

Built by SourdoughDog with coding and design assistance from OpenAI Codex.
