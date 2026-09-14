from pathlib import Path
import hashlib, plistlib, shutil, runpy
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
original = root/'legacy/guitar_fretboard_companion.html'
work = root/'mac'
runpy.run_path(str(work/'build-themes.py'))
app = root/'build/Guitar Fretboard.app'
resources = app/'Contents/Resources'
resources.mkdir(parents=True, exist_ok=True)
(app/'Contents/MacOS').mkdir(exist_ok=True)
digest = hashlib.sha256(original.read_bytes()).hexdigest()
(root/'build/original-html.sha256').write_text(digest+'\n')
html = (work/'app-source.html').read_text()
shutil.copy2(work/'synth-window.html',resources/'synth-window.html')
html = html.replace('<div class="settings"', '<div class="settings" hidden')
html = html.replace('Open this HTML file directly in your browser; no installation or connection is needed. You can also print from your browser.', 'This Mac app works offline in its own window. Choose File → Print Current View to print, or use the View menu to adjust the size.')
html = html.replace('Everything this app needs is inside this file.', 'Everything this app needs is included in the app.')
(resources/'index.html').write_text(html)
info = dict(CFBundleName='Guitar Fretboard', CFBundleDisplayName='Guitar Fretboard', CFBundleExecutable='GuitarFretboard', CFBundleIdentifier='local.guitar.fretboardcompanion', CFBundlePackageType='APPL', CFBundleShortVersionString='1.20', CFBundleVersion='21', CFBundleIconFile='AppIcon', NSHighResolutionCapable=True, LSMinimumSystemVersion='13.0', NSPrincipalClass='NSApplication', NSHumanReadableCopyright='Offline guitar theory companion')
with (app/'Contents/Info.plist').open('wb') as f: plistlib.dump(info,f)
(app/'Contents/PkgInfo').write_bytes(b'APPL????')
im=Image.new('RGBA',(1024,1024),(0,0,0,0));d=ImageDraw.Draw(im)
d.rounded_rectangle((44,44,980,980),radius=210,fill='#006e75')
for x in [276,512,748]:d.line((x,182,x,844),fill='#5ea4a9',width=15)
for y in [300,442,584,726]:d.line((180,y,844,y),fill='#95c6ca',width=12)
d.ellipse((415,345,609,539),fill='#ffffff')
d.ellipse((664,642,832,810),fill='#ffd6b8')
im.save(resources/'AppIcon.icns', format='ICNS')
readme='''GUITAR FRETBOARD — OFFLINE MAC APP · v1.20

Open Guitar Fretboard.app. Drag it to your Desktop or Applications if desired.
Requires macOS 13 or later on an Apple silicon Mac. Works offline.

CLASSIC COLLECTION — THE NEW DEFAULT
Classic is the default on a fresh install. Existing saved theme
choices are preserved. Choose File > Theme to switch at any time.
- Classic: warm ivory, evergreen and deep teal with orange/gold trim.
- Classic Coast: coral, turquoise, sunny yellow and soft ivory.
- Classic Harbor: deep navy, aqua, coral and golden accents.
All three share a distinct hi-fi-inspired layout: a framed title panel,
five-color ribbon, numbered chord badges, inset displays and tactile controls.
The styling follows you across every tab and the separate Wavetable Synth.

HEADER
The main title is a two-line Fretboard companion wordmark, styled by your
selected theme. Shorter title cards give the name and artwork separate space.
The former degree tagline and Works offline badge have been removed.

ILLUSTRATED THEMES
Lagoon: tropical shores, a setting sun, flowing wave borders and sea-glass cards.
Ocean: nautical charts, compass artwork, porthole notes and navy instrument trim.
Plum: Art Nouveau fruit and foliage, ivory pages and sculpted botanical frames.
Lagoon and Forest retain their original scenes and sizing, with the artwork
continued on the left to complete the shoreline and foothills.
Forest: layered woodland, pine silhouettes, stitched field cards and moss accents.
Midnight: constellations, a crescent moon, orbit lines and midnight-blue panels.
These retain their existing names and saved selections. Art is embedded vector
work, stays sharp at any size and never needs the internet. Classic remains the
default. All existing themes remain available.

VISUAL THEMES
Choose File > Theme. Your choice applies to every tab and the Wavetable Synth
window and is remembered between launches. Lagoon, Ocean, Plum, Forest and Midnight now each have a distinct illustrated UI.
Seven new styles change the typography, cards, controls and surface details:
- Sunset Studio: 1970s cream enamel, warm stripes and rounded analog controls.
- Pocket Pixel: handheld LCD greens, pixel headings and square raised buttons.
- Moonlit Grimoire: dark pages, gilded frames and illuminated serif headings.
- Orbital Console: cyan instruments, angular modules and telemetry grids.
- Neon Arcade: violet panels, pink signage and cyan synthwave accents.
- Letterpress: ivory paper, editorial type and crisp ink rules.
- Blueprint: drafting grids, monospaced labels and white technical linework.
Uses built-in Mac fonts with local fallbacks; no downloads or internet needed.

SCALE-SPECIFIC CHORDS
The chord row follows the selected root and scale, with one basic chord per
degree in order. Seven-note modes and scales use their own notes, stacking
alternate degrees: Dorian, harmonic minor, melodic minor and the others each
keep their distinct harmony. Click or Command-click to hear the shown notes.
Major/minor pentatonic and blues use the named major/natural-minor reference;
Hirajoshi uses natural minor, and bebop dominant uses Mixolydian. The row
explicitly identifies each reference. Other scales with five, six or eight
notes show alternate-note voicings and explain why there are not seven chords.
Unusual voicings show explicit intervals when no standard basic name applies.
The degree labels follow the Scales tab preference in File.

PROGRESSION STUDIO
Choose a key at the top. The left column offers suggested chords or a full
searchable library; the right column holds your sequence.
Click a chord to add it, or drag it into the sequence. Drag a card by its
surface to reorder it. Command-Shift-drag a tile to make a copy.
Tiles give slightly during the initial pull, then lift into the drag.
There is no hold delay. Releasing a partial pull leaves the sequence alone.
Tiles swing gently with motion; copies fade in as you pull them away.
The Knock sounds button switches the softened, quieter wood-block cue on
or off.
Pickup and drop use the same fixed sound, independent of the chord or key. System
Reduce Motion removes the swing and fade animations. Open Edit on a card
for its type, beats and details.
Command-click any chord in the chooser or sequence to hear it without adding
or changing it. In the Chords tab, Command-click the fretboard to hear the
selected chord.

PALETTES, IDEAS & SEARCH
The in-key chooser offers triads, sevenths, sixths, ninths, add9, 6/9,
suspended, mixed and random colors. Each option stays entirely in key;
when an extension does not fit, a simpler chord fills in. Random choices
stay stable until New colors is pressed.
Twenty starting ideas cover familiar loops, gentle colors, jazz, borrowing,
modal detours and blues. Their descriptions explain intentional outside-key
colors. Choosing an idea replaces the sequence; Undo restores it.
Scales and Chords each have a search field. Try a name or chord symbol,
optionally preceded by a root, such as D dorian or Am7. Close matches help
with misspellings. Select a result or press Return to show it on the map.

HARMONY LABELS
Labels are recalculated from the key and the following one or two chords.
They identify clear dominant resolutions, tritone substitutions, applied
ii–V patterns and parallel-key borrowing. Otherwise they show In key,
Harmonic minor, a possible role, or Chromatic color. Open Edit for an
explanation. With Loop enabled, the analysis considers the sequence boundary.
These are practical interpretations; melody and voicing can change analysis.

WAVETABLE SYNTH
Choose File → Wavetable Synth, or Wavetable in the arranger, to open the
separate sound window. Choose a preset, blend its wave, and adjust tempo,
volume and performance. Loop is now above the progression in the main window.
Play and Stop remain in both windows.
Closing the synth window keeps playback running. Stop it in the arranger
or reopen the sound window. Closing the main app window stops playback.
Wave blend, sound and volume adjust while playing. New sound envelopes and
tempo apply from the next chord. Add, remove, duplicate or reorder while
playing: the sounding chord finishes naturally, then the sequence follows
your edits. Clearing all chords stops playback.
No sound starts without a listening or drag gesture. Drag feedback follows
the synth volume and can be turned off independently.

CHORD FINDER
Choose Chords > Chord finder to start with a blank fretboard. Pick one note
per string; click it again to remove it or click the string label to mute.
Open strings are fret 0. Matching chord names update as you select notes,
including inversions, alternate names, omitted fifths and chords over bass
notes. Exact matches come first. Hear selection plays the actual pitches;
Command-click also previews. Explore chord opens its common shapes without
losing your finder selection. Arrow keys navigate; Enter/Space select and
Delete mutes that string. Selections last while the app is open.

CHORD SHAPES
The Chords tab offers Fretboard, Chord shapes and Chord finder views directly below the
selectors. It starts with shapes and remembers your choice. Scales continue
to show the full fretboard.
Filter shapes by Open, Barre, Movable / compact, or Jazz shells. Only
categories with matching shapes appear. If a chord change makes the selected
category unavailable, the view returns to All shapes. Shells use
root, third and seventh; omitted fifths and extensions are clearly listed.
The chord selector now offers 34 types, including 7(b9), 7(#9), 7(b5),
7(#5), 7(#11), 13(b9), maj7(#11), maj7(#5), m11 and m6/9. Columns run low E to high e.
X means mute; an open circle means an open string. Highlighted dots are
roots. A connecting line suggests a barre. Numbers inside dots are chord
degrees, not finger numbers. Higher-position charts show their first fret.
Omitted tones and non-root bass notes are labeled. Hear shape auditions the
actual string pitches, using your current performance settings.

PERFORMANCE & MIDI
The synth window includes held chords, gentle strums, ascending/descending
arpeggios, up-and-down arpeggios and a fingerpicked performance. Choose
quarter, eighth or sixteenth notes. Humanize varies timing and touch; Swing
makes alternating steps gently uneven. Performance changes begin with the
next chord. The fingerpicked pattern uses chord tones and bass accents.
In the progression, open MIDI and choose Current performance or Held chords.
Copy MIDI places a .mid file on the Mac clipboard. DAWs vary in file-paste
support: use Save MIDI and import or drag the file into your DAW if needed.
Exports include notes, velocities, tempo, and one pass through the sequence.
They contain no audio recording or wavetable preset; choose a DAW instrument.
Files copied to the clipboard remain in your Application Support folder.

KEYBOARD SHORTCUTS
Space: play / stop the progression (typing fields and ordinary controls
retain their normal keyboard actions). Escape: stop or cancel a drag.
Command-F: focus the current tab's search.
Command-1 / 2 / 3: Scales / Chords / Progressions. Command-4: Wavetable Synth.
Command-click: preview a chord. Command-Shift-drag: copy a progression tile.

APPEARANCE
File → Degree Labels → Scales / Chords / Progressions changes each tab
independently. Defaults: numbers for Scales and Chords; Roman for Progressions.
File → Theme selects any of the fifteen themes, shared by both windows.

Your progression and settings save locally. Use Copy chart to copy the
current sequence, or File → Print Current View to print it.

This release updates the Mac app only. The included standalone HTML stays
at v1.4; the original HTML is preserved in the legacy folder.
'''
(root/'build/Read Me.txt').write_text(readme)
assert hashlib.sha256(original.read_bytes()).hexdigest()==digest
print(app)
