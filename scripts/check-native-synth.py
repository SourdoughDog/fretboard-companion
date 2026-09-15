#!/usr/bin/env python3
"""Test both synth views through the real Swift handler, silently and offscreen."""
from pathlib import Path
import argparse, subprocess
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--sdk',help='Optional compiler-compatible macOS SDK')
parser.add_argument('--native-source',type=Path,default=ROOT/'mac/main.swift',help='Optional previous Swift source for regression verification')
args=parser.parse_args()
sdk=args.sdk or subprocess.check_output(['xcrun','--sdk','macosx','--show-sdk-path'],text=True).strip()
build=ROOT/'build/native-synth-test';build.mkdir(parents=True,exist_ok=True)
# Compile the complete production class unchanged, with a test launch extension
# in the same Swift file so it can wire its private views without opening windows.
production=args.native_source.read_text().split('\nlet app = NSApplication.shared\n')[0]
source=build/'main.swift';source.write_text(production+'\n'+(ROOT/'tests/check-native-synth.swift').read_text())
runner=build/'check-native-synth'
subprocess.run(['xcrun','swiftc','-swift-version','5','-sdk',sdk,'-module-cache-path',str(ROOT/'build/module-cache'),'-framework','Cocoa','-framework','WebKit',str(source),'-o',str(runner)],check=True)
subprocess.run([str(runner),str(ROOT)],check=True)
