# Windows edition · 1.27.0

The Windows desktop shell packages the same v1.27 HTML, music logic, Web Audio engine, synth controller, CSS, and illustrations as the Mac app. The original `mac/` and `legacy/` source files remain unchanged. No refactor or additional music implementation is required.

## Run

Windows 10/11, x64. Use the setup installer, or extract the **complete** portable ZIP and open `Guitar Fretboard.exe`. Keep the executable and its accompanying files together. No separate browser, Node.js, .NET, account, or internet connection is required at runtime. The first Windows build is unsigned; it has no publisher certificate or SmartScreen reputation.

Settings, progression, sounds, collections and scores are stored under `%APPDATA%\Guitar Fretboard`. The installer and portable copy share this data; a second launch activates the existing instance. Uninstalling preserves this folder. Mac data does not migrate or synchronize automatically. Back up the folder while the app is closed before transferring data between Windows PCs.

Ctrl+1/2/3 selects Scales/Chords/Progressions, Ctrl+4 opens Wavetable Synth, Ctrl+5 opens Ear Training, Ctrl+F searches, and Ctrl+P prints. Ctrl-click previews a chord; Ctrl+Shift-drag copies a progression tile. Space/Escape retain the existing playback and typing-field behavior. File contains Theme and independent Degree Labels menus. Closing the synth leaves playback running; closing the main window ends the app.

Copy MIDI writes a `.mid` file to `MIDI Exports` in the application data folder and places a native Windows file-list entry on the clipboard. DAW paste support varies; Save MIDI is always available. Exports are retained so pasted file references stay valid. Copy MIDI uses Windows PowerShell and Windows Forms, supplied with Windows; systems that restrict PowerShell can still use Save MIDI.

## Build

Install Node.js 22.12+ or 24 LTS and npm on Windows. Dependency downloads require internet access; packaged use is offline.

```sh
npm ci
npm test
npm run test:windows
npm run build:windows
```

Electron 44 may download its binary on first use. To prefetch it explicitly, run `npx install-electron --no`. Versions are pinned in the lockfile. `npm start` intentionally opens the development app; do not use it for routine silent review.

The build emits an NSIS setup executable, portable ZIP and unpacked app under `build/windows-release/`. The setup runs per user by default, allows choosing the installation directory, and does not automatically launch the app. Packaging does not publish a release. Preserve prior artifacts before rebuilding; use `CSC_LINK`/`CSC_KEY_PASSWORD` and the electron-builder signing configuration if the owner later supplies a signing certificate. Never put credentials in the repository.

## Implementation

- `prepare.cjs` regenerates both pages from `mac/`, expands authoritative themes and artwork, adapts Command to Ctrl, hides the web settings panel in favor of native menus, and hashes the inline scripts for CSP. It also reproduces the existing app icon and adapts the guide. Generated files are ignored.
- `main.cjs` supplies native windows, menus, printing, window bounds, MIDI dialogs and file clipboard, and relays the existing synth messages. The main window remains the only audio engine.
- `preload.cjs` exposes only the page's named message handlers. Renderers have no Node access, use context isolation and sandboxing, and cannot navigate to remote content. IPC validates the originating window and top-level frame. A fixed local `fretboard://app` origin keeps storage stable across upgrades and portable-folder moves.
- `security.cjs` validates MIDI bytes, safe filenames, sender identity and the original reference-link hosts. MIDI payloads never become executable code. Optional theory links open in the default browser; renderer network traffic is blocked.
- `check-windows.cjs` exercises the actual production shell in hidden windows with isolated temporary profiles. It reuses the existing finder, feature, synth-layout and offline-audio checks. Tests capture only the app's own offscreen render, never the desktop.

## Verification and limits

`npm test` runs the existing theory/feature suites and Windows boundary tests. `npm run test:windows` covers startup, 408 finder formulas, all themes at two sizes, native menu selection/checkmarks, search, the real two-window control bridge, focused preset updates, local persistence, MIDI output bytes/cancellation, controller close/reopen and playback lifecycle. Eighteen real OfflineAudioContext scenes check peaks, tails, voice cleanup and sample rates of 44.1/48/96 kHz. Reports and app-only PNGs go to `build/windows-checks/`.

MIDI dialog and clipboard endpoints are substituted in the automated suite so testing neither opens dialogs nor changes the user's clipboard. The file-generation and production bridge paths are exercised; physical sound output, DAW paste behavior, printer hardware and interactive installation/uninstallation need a manual release smoke test. No Mac build is attempted on Windows. The first deliverables target x64; ARM64-native and Microsoft Store packaging are not provided.
