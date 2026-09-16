'use strict';
// Build Windows resources from the authoritative Mac UI without modifying it.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {writeIcons} = require('./icon.cjs');
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
fs.writeFileSync(path.join(output, 'User Guide.txt'), 'WINDOWS EDITION · 1.27.2\n\nUnzip the complete portable folder and open Guitar Fretboard.exe, or use the Setup installer.\nWindows 10/11, x64. No browser, Node.js or internet connection is needed to run.\nSettings save in %APPDATA%\\Guitar Fretboard. Mac and Windows libraries do not sync automatically.\nCopy MIDI copies a file to the Windows clipboard; use Save MIDI if your DAW does not accept pasted files.\n\nCLASSIC COLLECTION' + guide);
fs.writeFileSync(path.join(output, 'resources.sha256.json'), JSON.stringify(hashes, null, 2) + '\n');

// Smooth, size-specific ICO artwork plus a high-resolution PNG master.
writeIcons(output);
console.log('Prepared Windows UI, synth, guide and multi-resolution icon.');
