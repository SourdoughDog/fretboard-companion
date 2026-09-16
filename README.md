# Fretboard companion

An offline guitar theory companion for macOS and Windows: explore the neck, discover chords, arrange progressions, and hear what you create.

## Get the app

### macOS

[Download the Mac app](https://github.com/SourdoughDog/fretboard-companion/releases/download/v1.27/Guitar.Fretboard.for.Mac.zip), unzip it, and open **Guitar Fretboard.app**. You can move the app into Applications. See [Mac release notes and checksums](https://github.com/SourdoughDog/fretboard-companion/releases/tag/v1.27).

Requires **macOS 13 or later on an Apple silicon Mac (M1 or newer)**. The app is locally signed and **not Apple-notarized**. For an unidentified-developer warning on a copy you trust, follow [Apple’s per-app opening instructions](https://support.apple.com/102445).

### Windows

[Download the Windows installer](https://github.com/SourdoughDog/fretboard-companion/releases/download/v1.27/Guitar.Fretboard.Windows.1.27.1.x64.exe), run setup, then open **Guitar Fretboard** from the Start menu or desktop shortcut. Setup does not automatically launch the app.

For a portable copy, [download the Windows ZIP](https://github.com/SourdoughDog/fretboard-companion/releases/download/v1.27/Guitar.Fretboard.Windows.1.27.1.x64.zip), extract the **entire folder**, and open **Guitar Fretboard.exe**. Keep the accompanying files together. See [Windows release notes and checksums](https://github.com/SourdoughDog/fretboard-companion/releases/tag/v1.27).

Requires **Windows 10 or 11, x64 (Intel/AMD)**. The Windows build is **unsigned** and may show an unknown-publisher warning. It includes its Electron runtime; no separate Node.js, .NET, or browser installation is required.

Both editions work offline without Codex, a login, or an internet connection. They share the v1.27 interface, theory data, synth engine, and all 15 themes. Current releases: **Mac 1.27** and **Windows 1.27.1**.

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

Your settings, progression, sound library, saved progression collections, and ear-training scores save locally. Finder selections remain while the app is open. Mac and Windows libraries do not automatically migrate or synchronize. On Windows, installed and portable copies share `%APPDATA%\Guitar Fretboard`; uninstalling preserves that data.

Both editions have a separate synth controller window: closing it leaves playback running; closing the main window ends the app. **Save MIDI** exports a `.mid` file. **Copy MIDI** puts a file reference on the Mac or Windows clipboard; DAW paste support varies, so Save MIDI remains available. Windows file-copy support uses the Windows PowerShell and Windows Forms components supplied with Windows.

No analytics, accounts, or network services are required. Music analysis suggests useful interpretations rather than a unique answer for every context. The chord finder checks the supported formulas with the root present.

## Shortcuts

| Action | macOS | Windows |
| --- | --- | --- |
| Play or stop the progression, outside text fields and controls | Space | Space |
| Scales / Chords / Progressions | Command–1 / 2 / 3 | Ctrl+1 / 2 / 3 |
| Wavetable Synth | Command–4 | Ctrl+4 |
| Ear training | Command–5 | Ctrl+5 |
| Search the current section | Command–F | Ctrl+F |
| Preview a chord | Command-click | Ctrl-click |
| Copy a progression tile | Command–Shift-drag | Ctrl+Shift-drag |
| Print the current view | Command–P | Ctrl+P |
| Close the current window | Command–W | Ctrl+W |
| Stop playback or cancel a drag | Escape | Escape |
| Move and select on the fretboard | Arrow keys; Enter / Space | Arrow keys; Enter / Space |

See the [Mac user guide](docs/User%20Guide.txt) and [Windows setup and usage notes](windows/README.md). The Windows app includes an adapted full guide under **Help → User Guide**.

On Windows, **Ctrl+=**, **Ctrl+Shift+=**, or **Ctrl+keypad Plus** zooms in; **Ctrl+Minus** zooms out; **Ctrl+0** resets the size. Zoom is also available in the View menu.

## Build the app

Run commands from the repository root. Building requires development tools and may require internet access to download dependencies; the finished apps run offline.

### macOS

Requires macOS, Xcode Command Line Tools, Python 3.10+, and Pillow. Node.js 20+ is used for the logic tests. The Mac runtime uses the system's Cocoa, WebKit, and Web Audio frameworks, with no third-party runtime dependencies.

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

### Windows

Requires Windows, **Node.js 22.12+ or 24 LTS**, and npm. Electron and electron-builder versions are pinned in `package-lock.json`; the app packages its runtime with the shared HTML, CSS, JavaScript, and artwork.

```sh
npm ci
npm run build:windows
```

The unsigned **setup `.exe`**, **portable ZIP**, and unpacked app appear in `build/windows-release/`. The build targets x64, does not launch or install the app, and does not publish a release. It reads the authoritative `mac/` sources without modifying them. Generated Windows resources go into the ignored `windows/generated/` directory.

Electron may download its binary on first use. To prefetch it, run `npx install-electron --no`. Use `npm start` only when you intend to open the development app. See [Windows build details](windows/README.md) for storage, packaging, signing, and implementation notes.

## Tests

### Shared logic — macOS or Windows

Requires Node.js. These checks use silent mocks and do not open the app:

```sh
node tests/logic.cjs
node tests/features.cjs
```

The shared suites cover scales, chords, harmony, search, progression editing, shapes, MIDI, playback scheduling, persistence, personal libraries, voicing, practice, and ear training.

### macOS integration and audio

Run on macOS with the Mac build prerequisites:

```sh
python3 scripts/check-ui.py
python3 scripts/check-audio.py
python3 scripts/check-native-synth.py
```

Hidden WebKit checks cover the chord finder, practice tools, personal libraries, and synth panel across all 15 themes at wide and narrow sizes, including 408 chord/root combinations. Native bridge checks exercise menus and communication between the two windows. The native test runners accept `--sdk` for a compatible SDK.

### Windows integration and audio

After `npm ci`, run on Windows:

```sh
npm test
npm run test:windows
```

`npm test` includes both shared logic suites and Windows validation tests. `npm run test:windows` prepares the Windows resources and exercises the actual desktop shell in hidden windows with disposable profiles: startup, menus and checkmarks, Ctrl shortcuts, synth messages, focused preset updates, local persistence, MIDI export, window lifecycle, and all-theme layouts at two sizes. Reports and app-only offscreen renders are saved to `build/windows-checks/`.

Both platforms run 18 real offline audio scenes in memory, including rapid preset changes, overlapping notes, long releases, and 44.1/48/96 kHz sample rates. They check clipping headroom, finite samples, discontinuities, tails, and voice cleanup. Testing does not require desktop capture or speaker playback.

Windows automated tests substitute the save dialog and clipboard endpoints to avoid opening dialogs or changing the user's clipboard. Physical sound-device output, DAW paste behavior, printer hardware, and interactive installation/uninstallation remain manual checks.

## Source layout

### Shared interface, theory, and audio

- `mac/app-source.html`: main UI, music logic, audio engine, and local persistence used by both editions.
- `mac/synth-window.html`: separate synth controller UI used by both editions.
- `mac/themes.css` and `mac/art/`: authoritative shared styling and embedded SVG illustrations.
- `tests/logic.cjs` and `tests/features.cjs`: shared regression suites.
- `legacy/`: preserved standalone HTML v1.4, with fewer features than either desktop edition.

### macOS shell and tooling

- `mac/main.swift`: Cocoa windows, menus, clipboard, and MIDI file handling.
- `mac/build-themes.py`: embeds styles and artwork into the Mac HTML resources.
- `mac/package.py`: assembles app resources, metadata, icon, and user guide.
- `scripts/build.py`: compiles and packages the Mac app.
- `scripts/check-*.py` and native Swift test runners: silent Mac UI, bridge, and audio checks.

### Windows shell and tooling

- `windows/main.cjs`: Electron windows, native menus, printing, clipboard, MIDI dialogs, and synth message routing.
- `windows/preload.cjs` and `windows/security.cjs`: isolated renderer bridge, sender checks, MIDI validation, and reference-link restrictions.
- `windows/prepare.cjs`: generates Windows pages, Ctrl shortcuts, shared themes/artwork, icon, and adapted guide from the existing sources.
- `windows/check-windows.cjs`, `windows/run-checks.cjs`, and `windows/security.test.cjs`: hidden Windows integration and validation checks.
- `package.json` and `package-lock.json`: Windows development commands, pinned dependencies, and installer/portable packaging configuration.

Edit the authoritative UI, CSS, or SVG sources, then run the appropriate platform build to regenerate its resources. The older standalone HTML remains preserved separately. The Windows shell shares the current **v1.27** application features and has its own **1.27.1** release version.

## Credits

Built by SourdoughDog with coding and design assistance from OpenAI Codex.
