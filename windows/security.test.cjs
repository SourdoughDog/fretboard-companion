'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {allowedExternal,validateMidi,trustedSender,ORIGIN}=require('./security.cjs');
const data=Buffer.from('4d546864000000060000000101e04d54726b0000000400ff2f00','hex').toString('base64');
test('MIDI validates chunk boundaries and keeps paths inside the selected directory',()=>{
  assert.equal(validateMidi({action:'copy',data,filename:'../../CON.mid'}).name,'Guitar progression.mid');
  assert.equal(validateMidi({action:'save',data,filename:'C major.mid'}).name,'C major.mid');
  for(const body of [{action:'delete',data},{action:'save',data:'invalid'},{action:'save',data:'a'.repeat(4_000_001)},{action:'save',data:Buffer.from('MThd bad data').toString('base64')},{action:'save',data:Buffer.from('4d546864000000060000000101e04d54726b0000010400ff2f00','hex').toString('base64')}])assert.throws(()=>validateMidi(body));
});
test('External references allow only the original HTTPS reading hosts',()=>{
  assert(allowedExternal('https://ianring.com/musictheory/scales/'));assert(allowedExternal('https://viva.pressbooks.pub/openmusictheory/'));
  for(const url of ['file:///C:/Windows','javascript:alert(1)','https://ianring.com.evil.test/','https://evil.test','https://user@ianring.com','http://ianring.com','https://ianring.com:8080'])assert(!allowedExternal(url));
});
test('Only the expected top-level page and webContents can send native commands',()=>{
  const frame={url:ORIGIN+'/index.html'},wc={mainFrame:frame},win={isDestroyed:()=>false,webContents:wc};
  assert(trustedSender({sender:wc,senderFrame:frame},win,'index.html'));
  assert(!trustedSender({sender:wc,senderFrame:{url:frame.url}},win,'index.html'));
  assert(!trustedSender({sender:{},senderFrame:frame},win,'index.html'));
  assert(!trustedSender({sender:wc,senderFrame:frame},win,'synth-window.html'));
});
