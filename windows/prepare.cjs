'use strict';
// Build Windows resources from the authoritative Mac UI without modifying it.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'mac');
const output = path.join(__dirname, 'generated');
fs.mkdirSync(output, { recursive: true });
const ids = ['teal','ocean','plum','forest','midnight','classic','classic-coast','classic-harbor','retro','pixel','fantasy','orbital','neon','letterpress','blueprint'];
const scope = list => ':root:is(' + list.map(id => `[data-theme="${id}"]`).join(',') + ')';
const css = fs.readFileSync(path.join(source, 'themes.css'), 'utf8')
  .replaceAll('@styled', scope(ids))
  .replaceAll('@classic', scope(ids.slice(5,8)))
  .replaceAll('@nature', scope(ids.slice(0,5)))
  .replace(/@art\(([-a-z]+)\)/g, (_, name) => 'url("data:image/svg+xml,' + encodeURIComponent(fs.readFileSync(path.join(source, 'art', name + '.svg'), 'utf8')).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()) + '")');
function windowsText(text) {
  return text.replaceAll('⌘⇧', 'Ctrl+Shift').replaceAll('⌘', 'Ctrl+').replaceAll('Ctrl+-', 'Ctrl-')
    .replaceAll('Command', 'Ctrl').replaceAll('this Mac', 'this PC').replaceAll('the Mac app', 'the Windows app');
}
const hashes = {};
for (const [input, filename] of [['app-source.html','index.html'], ['synth-window.html','synth-window.html']]) {
  let html = fs.readFileSync(path.join(source, input), 'utf8');
  html = html.replace(/\n\/\* BEGIN STYLE THEMES \*\/[\s\S]*?\/\* END STYLE THEMES \*\/\n/, '\n')
    .replace('</style>', '\n/* BEGIN STYLE THEMES */\n' + css + '\n/* END STYLE THEMES */\n</style>');
  html = windowsText(html).replaceAll('.metaKey', '.ctrlKey')
    .replace('<div class="settings"', '<div class="settings" hidden')
    .replace('Open this HTML file directly in your browser; no installation or connection is needed. You can also print from your browser.', 'This Windows app works offline in its own window. Choose File → Print Current View to print, or use the View menu to adjust the size.')
    .replace('Everything this app needs is inside this file.', 'Everything this app needs is included in the app.');
  // HTML parsing normalizes line endings before CSP computes the script hash.
  html = html.replace(/\r\n?/g, '\n');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => "'sha256-" + crypto.createHash('sha256').update(m[1]).digest('base64') + "'");
  const csp = `default-src 'none'; script-src ${scripts.join(' ')}; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  html = html.replace('<head>', '<head>\n<meta http-equiv="Content-Security-Policy" content="' + csp + '">');
  fs.writeFileSync(path.join(output, filename), html);
  hashes[filename] = crypto.createHash('sha256').update(html).digest('hex');
}
const guide = windowsText(fs.readFileSync(path.join(root, 'docs', 'User Guide.txt'), 'utf8').split('CLASSIC COLLECTION')[1]).replaceAll('Mac fonts','system fonts').replaceAll('Mac clipboard','Windows clipboard').replace(/This release updates the Windows app only\.[\s\S]*$/, 'This Windows edition uses the current v1.27 app features. The original Mac and legacy sources remain preserved in the source repository.\n');
fs.writeFileSync(path.join(output, 'User Guide.txt'), 'WINDOWS EDITION · 1.27.0\n\nUnzip the complete portable folder and open Guitar Fretboard.exe, or use the Setup installer.\nWindows 10/11, x64. No browser, Node.js or internet connection is needed to run.\nSettings save in %APPDATA%\\Guitar Fretboard. Mac and Windows libraries do not sync automatically.\nCopy MIDI copies a file to the Windows clipboard; use Save MIDI if your DAW does not accept pasted files.\n\nCLASSIC COLLECTION' + guide);
fs.writeFileSync(path.join(output, 'resources.sha256.json'), JSON.stringify(hashes, null, 2) + '\n');

// Reproduce the existing app icon with a small dependency-free PNG/ICO encoder.
const size = 256, rows = Buffer.alloc((size * 4 + 1) * size);
for (let y=0; y<size; y++) for (let x=0; x<size; x++) {
  const px=x*4, py=y*4, cx=Math.max(254,Math.min(770,px)), cy=Math.max(254,Math.min(770,py));
  let color=[0,0,0,0];
  if ((px-cx)**2+(py-cy)**2<=210**2) color=[0,110,117,255];
  if (py>=182&&py<=844&&[276,512,748].some(v=>Math.abs(px-v)<=7.5)) color=[94,164,169,255];
  if (px>=180&&px<=844&&[300,442,584,726].some(v=>Math.abs(py-v)<=6)) color=[149,198,202,255];
  if ((px-512)**2+(py-442)**2<=97**2) color=[255,255,255,255];
  if ((px-748)**2+(py-726)**2<=84**2) color=[255,214,184,255];
  rows.set(color,y*(size*4+1)+1+x*4);
}
function crc32(bytes) { let crc=0xffffffff; for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0; }
function chunk(type,data) {const name=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([name,data])),out.length-4);return out;}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
fs.writeFileSync(path.join(output,'icon.png'),png);
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);
fs.writeFileSync(path.join(output,'icon.ico'),Buffer.concat([ico,png]));
console.log('Prepared Windows UI, synth, guide and icon from the shared Mac sources.');
