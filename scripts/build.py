#!/usr/bin/env python3
"""Build the Apple silicon Mac app and a shareable ZIP; never launch it."""
from pathlib import Path
import argparse, platform, runpy, shutil, subprocess
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--sdk', help='Optional path to a compatible macOS SDK')
args = parser.parse_args()
if platform.system() != 'Darwin':
    parser.error('The native app requires macOS and Xcode Command Line Tools.')
def run(*parts):
    subprocess.run([str(p) for p in parts], check=True, cwd=ROOT)
(ROOT/'build').mkdir(exist_ok=True)
runpy.run_path(str(ROOT/'mac/package.py'))
app = ROOT/'build/Guitar Fretboard.app'
sdk = args.sdk or subprocess.check_output(['xcrun', '--sdk', 'macosx', '--show-sdk-path'], text=True).strip()
run('xcrun', 'swiftc', '-O', '-swift-version', '5', '-sdk', sdk,
    '-target', 'arm64-apple-macos13.0', '-module-cache-path', ROOT/'build/module-cache',
    '-framework', 'Cocoa', '-framework', 'WebKit', ROOT/'mac/main.swift',
    '-o', app/'Contents/MacOS/GuitarFretboard')
run('codesign', '--force', '--sign', '-', app)
run('codesign', '--verify', '--deep', '--strict', app)
stage = ROOT/'build/Guitar Fretboard for Mac'
if stage.exists():
    shutil.rmtree(stage)
stage.mkdir()
run('ditto', app, stage/'Guitar Fretboard.app')
shutil.copy2(ROOT/'build/Read Me.txt', stage/'Read Me.txt')
shutil.copy2(ROOT/'legacy/guitar_fretboard_companion.html', stage/'guitar_fretboard_companion.html')
archive = ROOT/'build/Guitar Fretboard for Mac.zip'
if archive.exists():
    archive.unlink()
run('ditto', '-c', '-k', '--sequesterRsrc', '--keepParent', stage, archive)
print('Ready:', archive)
