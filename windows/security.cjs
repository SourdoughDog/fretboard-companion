'use strict';
const path = require('node:path');
const ORIGIN = 'fretboard://app';
const THEMES = ['classic','classic-coast','classic-harbor','teal','ocean','plum','forest','midnight','retro','pixel','fantasy','orbital','neon','letterpress','blueprint'];
function allowedExternal(value) {
  try { const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&['ianring.com','viva.pressbooks.pub'].includes(url.hostname); } catch { return false; }
}
function trustedSender(event, window, page) {
  return !!window&&!window.isDestroyed()&&event.sender===window.webContents&&event.senderFrame===window.webContents.mainFrame&&event.senderFrame.url===`${ORIGIN}/${page}`;
}
function validateMidi(body) {
  if(!body||!['save','copy'].includes(body.action)||typeof body.data!=='string'||body.data.length>4_000_000||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.data))throw Error('Could not create a valid MIDI file.');
  const data=Buffer.from(body.data,'base64');
  if(data.length<26||data.toString('ascii',0,4)!=='MThd'||data.readUInt32BE(4)!==6)throw Error('Could not create a valid MIDI file.');
  const count=data.readUInt16BE(10);let offset=14;
  if(!count||data.readUInt16BE(8)>2||!data.readUInt16BE(12))throw Error('Could not create a valid MIDI file.');
  for(let i=0;i<count;i++){if(offset+8>data.length||data.toString('ascii',offset,offset+4)!=='MTrk')throw Error('Could not create a valid MIDI track.');offset+=8+data.readUInt32BE(offset+4);if(offset>data.length)throw Error('Incomplete MIDI track.');}
  if(offset!==data.length)throw Error('Unexpected MIDI data.');
  let name=(typeof body.filename==='string'?body.filename:'Guitar progression.mid').replace(/[^A-Za-z0-9 #._-]/g,'').replace(/^[. ]+|[. ]+$/g,'').slice(0,120);
  if(!name||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))name='Guitar progression.mid';
  if(!name.toLowerCase().endsWith('.mid'))name+='.mid';
  return {action:body.action,name:path.basename(name),data};
}
module.exports={ORIGIN,THEMES,allowedExternal,trustedSender,validateMidi};
