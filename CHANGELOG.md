# Changelog

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
