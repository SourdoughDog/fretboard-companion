#!/usr/bin/env python3
"""Render synth checks silently into memory with macOS WebKit; never play sound."""
from pathlib import Path
import argparse, json, subprocess
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--sdk', help='Optional compiler-compatible macOS SDK')
args = parser.parse_args()
sdk = args.sdk or subprocess.check_output(['xcrun','--sdk','macosx','--show-sdk-path'],text=True).strip()
(ROOT/'build').mkdir(exist_ok=True)
runner=ROOT/'build/check-hidden-webkit'
subprocess.run(['xcrun','swiftc','-sdk',sdk,'-module-cache-path',str(ROOT/'build/module-cache'),'-framework','Cocoa','-framework','WebKit',str(ROOT/'tests/check-hidden-webkit.swift'),'-o',str(runner)],check=True)
result=subprocess.run([str(runner),str(ROOT/'mac/app-source.html'),str(ROOT/'tests/check-audio.async.js'),'1100','900'],check=True,capture_output=True,text=True)
report=json.loads(result.stdout.strip())
(ROOT/'build/audio-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS:',len(report['scenes']),'silent offline audio scenes. Report: build/audio-report.json')
