# Changelog

## Windows edition 1.27.2

- Refined the Windows fretboard icon with smooth transparent edges, clearer strings, subtle teal shading and note highlights.
- Added 15 individually rendered ICO sizes from 16 to 256 pixels for title bars, taskbars, shortcuts and scaled displays, plus a 1024-pixel PNG master.
- Both app windows now use the multi-resolution ICO. The installer and executable embed the same artwork.
- Mac artwork and app behavior are unchanged; the Windows 1.27.1 zoom fix is included.

## Windows edition 1.27.1

- Fixed zoom shortcuts in the main and synth windows: Ctrl+=, Ctrl+Shift+= and numeric-keypad Plus now zoom in; Ctrl+Minus and Ctrl+0 zoom out and reset.
- Added hidden native-keyboard regression checks for both windows, including keypad keys, one zoom step per press, and ordinary typing/AltGr exclusions.
- Mac app version remains 1.27; existing settings and personal libraries are preserved.

## Windows edition 1.27.0

- Added a parallel Windows 10/11 x64 desktop app using the existing v1.27 UI, theory and audio engine.
- Added native Windows menus, Ctrl shortcuts, separate synth controls, local persistence, printing, and MIDI save/file-copy support.
- Added reproducible installer/portable packaging and silent Windows integration/audio checks. Mac and legacy sources are unchanged.

## 1.27

- Fixed the synth preset selector showing a stale label, such as Warm keys, while another sound was playing. The confirmed preset now updates even while the dropdown has focus.
- Added focused-selector UI and native playback regression checks; text and slider editing retain their existing focus protection.

## 1.26

- Replaced stacked progression disclosures with a compact Voicing, Practice and Saved progressions tool row.
- Gave chord voicing its own panel, separate from practice controls.
- Added current-setting summaries, one open panel at a time, bounded panel scrolling and a Done button that returns keyboard focus.
- Preserved settings, library drafts and playback when opening or closing tools.

## 1.25

- Fixed a startup crash caused by adding Ear Training to the three-tab degree-label menu. Menu construction now uses the same tab list as preference updates.
- Expanded the native integration check to install real startup menus, receive appearance messages, and verify notation actions/checkmarks. The new check detects the v1.24 regression.

## 1.24

- Added named sound snapshots with favorites, recall, update, rename, delete, and undo.
- Added a draggable, keyboard-accessible envelope graph and held-chord sound preview.
- Added practice loops with count-ins, metronome, bars per chord, and gradual tempo increases.
- Added smooth chord voicing, inversions, close/open spacing, and octave selection shared by playback and MIDI.
- Added named progression collections with search, workspace snapshots, update, deletion undo, and restoration of the previous workspace after loading.
- Added interval and chord-quality ear-training games with replay, answer fretboards, and local scores.
- Preserved existing workspace preferences and added silent regression checks for the new features and native bridge.

## 1.23

- Reorganized the synth into Sound and Performance tabs, with the preset selector always at the top and Play, Stop and Volume always at the bottom.
- Grouped wave blend with filters, moved reverb into Space & movement, and brought tempo alongside playing style and note pace.
- Added keyboard tab navigation and independent scrolling, preserving controls, saved sounds and playback.

## 1.22

- Fixed the native synth bridge discarding the new tone, envelope, stereo and movement controls. Edits now reach playback and remain saved across chord previews.
- Centralized sound-option validation in the existing engine validator, removing the outdated native key list.
- Added an integration test using both WebKit views and the production Swift message handler, including repeated chord previews, persistence, invalid input and preset reset.

## 1.21

- Expanded the wavetable bank to 12 presets with grouped descriptions and preset reset.
- Added editable ADSR envelope, cutoff, resonance, filter motion, detune, stereo width, vibrato and room reverb. Settings save locally and old presets migrate.
- Added normalized 64-harmonic endpoint tables with pitch-aware rolloff, smooth wave blending and 40 ms preset crossfades.
- Improved short-note envelopes, release tails, stereo voice placement, and gain headroom; added silent offline audio rendering checks.
- Fixed single-note finder voicings in arpeggio/fingerpick modes.

## 1.20

- Added Chords → Chord finder: select a voicing on a blank fretboard and see possible chord names.
- Recognizes exact formulas, inversions, alternate names, omitted fifths, and chords over a separate bass note.
- Added exact-voicing audition, keyboard navigation, note-name hints, and links to common shapes.
- Preserves the existing scales, chord shapes, progression arranger, synth, MIDI, themes, and illustrated headers.

First GitHub source release. The standalone HTML in `legacy/` remains at v1.4.
