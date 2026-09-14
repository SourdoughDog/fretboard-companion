#!/usr/bin/env python3
"""Run chord finder checks in unshown, silent native WebKit windows."""
from pathlib import Path
import argparse, subprocess
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--sdk', help='Optional path to a compatible macOS SDK')
args = parser.parse_args()
sdk = args.sdk or subprocess.check_output(['xcrun', '--sdk', 'macosx', '--show-sdk-path'], text=True).strip()
(ROOT/'build').mkdir(exist_ok=True)
runner = ROOT/'build/check-hidden-webkit'
subprocess.run(['xcrun', 'swiftc', '-sdk', sdk, '-module-cache-path', str(ROOT/'build/module-cache'), '-framework', 'Cocoa', '-framework', 'WebKit', str(ROOT/'tests/check-hidden-webkit.swift'), '-o', str(runner)], check=True)
for width in (540, 1100):
    subprocess.run([str(runner), str(ROOT/'mac/app-source.html'), str(ROOT/'tests/check-hidden-finder.js'), str(width), '1000'], check=True)
