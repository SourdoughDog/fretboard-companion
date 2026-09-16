'use strict';
const {contextBridge, ipcRenderer}=require('electron');
// Preserve the existing narrow bridge contract; expose no Node or general IPC API.
const names=location.pathname==='/synth-window.html'?['synthControl']:['appearance','synthState','openSynth','midiExport'];
const messageHandlers={};
for(const name of names)messageHandlers[name]={postMessage:body=>ipcRenderer.send('fretboard:'+name,body)};
contextBridge.exposeInMainWorld('webkit',{messageHandlers});
