'use strict';
// Exercise the production shell in unshown windows with a disposable profile.
const {app,Menu,nativeImage}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.join(root,'build','windows-checks');
fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(output,'profile-'));
app.setPath('userData',profile);app.commandLine.appendSwitch('mute-audio');
app.on('window-all-closed',()=>{}); // Keep the harness alive to assert final teardown.
const {WindowsApp}=require('./main.cjs');
const results={platform:process.platform,electron:process.versions.electron,silent:true,checks:[]};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let host;
async function until(fn,label){for(let i=0;i<150;i++){if(await fn())return;await pause(20);}throw Error('Timed out: '+label);}
async function fresh(){await host.js('localStorage.clear()');await host.main.loadURL('fretboard://app/index.html');await host.js('window.AudioContext=undefined; window.webkitAudioContext=undefined;');}
async function snapshot(win,name){await pause(120);const image=await win.webContents.capturePage();assert(!image.isEmpty());fs.writeFileSync(path.join(output,name+'.png'),image.toPNG());}
async function check(name,fn){await fn();results.checks.push(name);console.log('PASS: '+name);}

app.whenReady().then(async()=>{
  let copiedPath=null,saveResult={canceled:false,filePath:path.join(profile,'progression.mid')};
  host=new WindowsApp({hidden:true,userData:profile,saveDialog:async()=>saveResult,copyFile:async filename=>{copiedPath=filename;}});
  const makeWindow=host.makeWindow.bind(host);
  host.makeWindow=(...args)=>{const win=makeWindow(...args);win.webContents.on('console-message',event=>{if(event.level==='error')console.error('Renderer: '+event.message);});win.webContents.on('preload-error',(_event,_path,error)=>console.error(error));return win;};
  await host.start();
  await check('Windows ICO decodes at all 15 display sizes with smooth transparent edges',async()=>{
    const ico=fs.readFileSync(path.join(__dirname,'generated','icon.ico'));
    assert.equal(ico.readUInt16LE(2),1);
    const sizes=[16,20,24,30,32,36,40,48,60,64,72,80,96,128,256];
    assert.equal(ico.readUInt16LE(4),sizes.length);
    let end=6+16*sizes.length;
    for(let i=0;i<sizes.length;i++){
      const entry=6+16*i,size=sizes[i],length=ico.readUInt32LE(entry+8),offset=ico.readUInt32LE(entry+12);
      assert.equal(ico[entry]||256,size);assert.equal(ico[entry+1]||256,size);
      assert.equal(offset,end);end=offset+length;assert(end<=ico.length);
      const image=nativeImage.createFromBuffer(ico.subarray(offset,end));
      assert.deepEqual(image.getSize(),{width:size,height:size});
      const bitmap=image.toBitmap();
      assert.equal(bitmap[3],0,'Transparent corner');
      assert(bitmap.some((alpha,index)=>index%4===3&&alpha>0&&alpha<255),'Antialiased contour');
    }
    assert.equal(end,ico.length);
    assert(!nativeImage.createFromPath(path.join(__dirname,'generated','icon.ico')).isEmpty());
    assert.deepEqual(nativeImage.createFromPath(path.join(__dirname,'generated','icon.png')).getSize(),{width:1024,height:1024});
  });
  await check('Sandboxed offline startup, complete theory data, narrow IPC and Windows hints',async()=>{
    assert.deepEqual(await host.js('[SCALES.length,CHORDS.length,typeof require,typeof process]'),[26,34,'undefined','undefined']);
    assert(await host.js('!!window.webkit.messageHandlers.openSynth&&!window.webkit.messageHandlers.synthControl'));
    assert(await host.js("document.body.textContent.includes('Ctrl')&&!document.body.textContent.includes('⌘')"));
    assert(host.main.webContents.getLastWebPreferences().sandbox);
    assert(!host.main.isVisible());
  });
  await check('Zoom shortcuts: Ctrl+=, Ctrl+Shift+=, keypad +, minus and reset in both windows',async()=>{
    await host.openSynth();
    for(const win of [host.main,host.synth]){
      const wc=win.webContents;
      const press=async(keyCode,modifiers=['control'])=>{
        wc.sendInputEvent({type:'keyDown',keyCode,modifiers});
        wc.sendInputEvent({type:'keyUp',keyCode,modifiers});
        await pause(80);
      };
      wc.setZoomLevel(0);
      for(const [key,mods] of [['=',['control']],['+',['control','shift']],['numadd',['control','isKeypad']]]){
        await press(key,mods);
        await until(()=>wc.getZoomLevel()>0,'zoom in with '+key+' '+mods.join('+'));
        assert.equal(wc.getZoomLevel(),0.5,'Each shortcut zooms exactly once');
        await press('0');assert.equal(wc.getZoomLevel(),0);
      }
      await press('-');assert.equal(wc.getZoomLevel(),-0.5);
      await press('0');assert.equal(wc.getZoomLevel(),0);
      await press('numsub',['control','isKeypad']);assert.equal(wc.getZoomLevel(),-0.5);
      await press('0');assert.equal(wc.getZoomLevel(),0);
      for(const [key,mods] of [['=',[]],['+',['shift']],['=',['control','alt']]]){
        await press(key,mods);assert.equal(wc.getZoomLevel(),0,'Ordinary typing and AltGr must not zoom');
      }
      assert(!win.isVisible());
    }
    host.synth.close();await until(()=>!host.synth,'zoom test synth close');
  });
  for(const width of [620,1100]){
    host.main.setContentSize(width,1000);
    for(const [name,file] of [['Chord finder (408 formulas, all themes)','check-hidden-finder.js'],['Practice, voicing, collections, ear training and all themes','check-hidden-features.js']]){
      await fresh();
      const script=fs.readFileSync(path.join(root,'tests',file),'utf8').replaceAll('metaKey:true','ctrlKey:true');
      await check(name+' at '+width+'px',async()=>{const report=JSON.parse(await host.js(script));assert(report.checks);});
    }
  }
  await fresh();host.main.setContentSize(1220,900);
  await snapshot(host.main,'scales-classic');
  await check('Native menu actions, checkmarks, independent notation and Ctrl+F',async()=>{
    const menu=Menu.getApplicationMenu();
    for(const tab of ['scales','chords','progressions','ear']){menu.getMenuItemById('view-'+tab).click();await until(()=>host.js(`document.getElementById('mode-${tab}').getAttribute('aria-pressed')==='true'`),'view '+tab);}
    for(const theme of ['midnight','classic']){menu.getMenuItemById('theme-'+theme).click();await until(()=>host.preferences.theme===theme,'theme '+theme);assert(menu.getMenuItemById('theme-'+theme).checked);}
    menu.getMenuItemById('notation-chords-roman').click();await until(()=>host.preferences.chords==='roman','chord notation');assert.equal(host.preferences.scales,'numbers');
    menu.getMenuItemById('view-progressions').click();menu.getMenuItemById('edit-find').click();
    await until(()=>host.js("document.activeElement.id==='chord-search'&&!$('library-content').hidden"),'progression search');
    menu.getMenuItemById('view-chords').click();await host.js("setChordView('finder')");menu.getMenuItemById('edit-find').click();
    await until(()=>host.js("document.activeElement.id==='map-search'&&preferences.chordView==='shapes'"),'finder search');
  });
  await check('Real two-window IPC: presets, all sound controls, saved sounds and invalid input',async()=>{
    await host.openSynth();
    await until(()=>host.js('!!lastState',host.synth),'synth state');
    assert(await host.js('!!window.webkit.messageHandlers.synthControl&&!window.webkit.messageHandlers.midiExport',host.synth));
    const controls={attack:.8,decay:.7,sustain:54,release:1.7,cutoff:4100,resonance:31,filterEnv:26,detune:9,width:75,vibrato:13,vibratoRate:4,reverb:22,morph:62,volume:71,humanize:19,swing:21};
    for(const [key,value] of Object.entries(controls)){
      await host.js(`send('set',{key:${JSON.stringify(key)},value:${value}})`,host.synth);
      await until(()=>host.js(`synthOptions[${JSON.stringify(key)}]===${value}`),'control '+key);
    }
    const before=await host.js('synthOptions.attack');await host.js("send('set',{key:'attack',value:-999});send('set',{key:'__proto__',value:'invalid'})",host.synth);await pause(60);assert.equal(await host.js('synthOptions.attack'),before);
    await host.js("$('sound-name').value='Windows test sound';$('sound-save').click()",host.synth);
    await until(()=>host.js('personalLibrary.sounds.length===1'),'sound saved');
    await host.js("$('synth-preset').focus();$('synth-preset').value='glass';$('synth-preset').dispatchEvent(new Event('change'))",host.synth);
    await until(()=>host.js("synthOptions.preset==='glass'"),'preset to engine');
    await host.call('setSynthOption','preset','pad');
    await until(()=>host.js("$('synth-preset').value==='pad'",host.synth),'focused preset from engine');
  });
  await snapshot(host.synth,'synth-classic');
  await check('MIDI save, cancel, validation and file-copy dispatch through the real bridge',async()=>{
    await host.js("useStarter('pop');exportMidi('save')");
    await until(()=>host.js("$('midi-status').textContent.startsWith('Saved MIDI.')"),'MIDI save');
    const expected=Buffer.from(await host.js('Array.from(midiBytes())'));
    assert(fs.readFileSync(saveResult.filePath).equals(expected));
    await until(()=>!host.midiBusy,'save complete');
    await host.js("exportMidi('copy')");await until(()=>!!copiedPath,'MIDI copy');assert(fs.readFileSync(copiedPath).equals(expected));
    await until(()=>!host.midiBusy,'copy complete');
    saveResult={canceled:true};await host.js("exportMidi('save')");await until(()=>host.js("$('midi-status').textContent.includes('canceled')"),'canceled status');
    await host.js("window.webkit.messageHandlers.midiExport.postMessage({action:'save',data:'bad'})");await until(()=>host.js("$('midi-status').textContent.includes('Could not export')"),'invalid status');
  });
  await check('Synth Play/Stop uses one engine; closing the controller preserves playback',async()=>{
    await host.js("window.AudioContext=class extends OfflineAudioContext{constructor(){super(2,48000*8,48000)}get state(){return 'running'}async resume(){}};window.webkitAudioContext=window.AudioContext;void 0");
    await host.js("send('play')",host.synth);await until(()=>host.js('!!synthSession'),'play from synth');
    await host.js('window.__session=synthSession;void 0');
    host.synth.close();await until(()=>!host.synth,'controller close');assert(await host.js('synthSession===window.__session'));
    await host.openSynth();await until(()=>host.js('lastState?.playing===true',host.synth),'reopened playing state');
    await host.js("send('stop')",host.synth);await until(()=>host.js('!synthSession&&!synthPending'),'stop from synth');
  });
  await check('Workspace, theme, library and settings persist after closing/reopening views',async()=>{
    await host.call('setAppTheme','midnight');await host.js("setSynthOption('tempo',137);saveWorkspace()");
    const before=await host.js('JSON.stringify(progression.items)');
    host.synth.close();await until(()=>!host.synth,'synth close');
    assert.equal(await host.js('synthOptions.tempo'),137);
    await host.main.loadURL('fretboard://app/index.html');
    assert.equal(await host.js('preferences.theme'),'midnight');assert.equal(await host.js('synthOptions.tempo'),137);
    assert.equal(await host.js('personalLibrary.sounds.length'),1);assert.equal(await host.js('JSON.stringify(progression.items)'),before);
    await host.openSynth();await until(()=>host.js('lastState?.options.tempo===137',host.synth),'reopened synth');
  });
  await host.js("$('mode-progressions').click();setProgressionTool('voicing')");await snapshot(host.main,'progressions-midnight');
  await check('Synth controller layout at narrow and wide sizes across 15 themes',async()=>{
    const source=fs.readFileSync(path.join(root,'mac','app-source.html'),'utf8');
    const fixture=source.slice(source.indexOf('const SOUND_DEFAULTS='),source.indexOf('const harmonicCache='));
    const test=fs.readFileSync(path.join(root,'tests','check-hidden-synth.js'),'utf8').replace('/* SOUND_FIXTURE */',fixture);
    // Controller-only fixture records commands, while the separate test above uses real IPC.
    await host.js("window.__messages=[];send=(action,extra={})=>window.__messages.push({action,...extra});void 0",host.synth);
    for(const width of [520,680]){host.synth.setContentSize(width,820);assert(JSON.parse(await host.js(test,host.synth)).checks);}
  });
  await check('18 real offline audio scenes: presets, live edits, tails, clipping and 44.1/48/96 kHz',async()=>{
    await fresh();
    const script=fs.readFileSync(path.join(root,'tests','check-audio.async.js'),'utf8');
    results.audio=JSON.parse(await host.js('(async()=>{'+script+'})()'));
    assert.equal(results.audio.scenes.length,18);
  });
  await check('Main close also destroys the synth controller',async()=>{host.main.close();await until(()=>!host.main&&!host.synth,'main and synth close');});
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
  console.log('Windows checks passed; hidden renders and report are in build/windows-checks.');
  app.exit(0);
}).catch(error=>{console.error(error.stack||error);fs.writeFileSync(path.join(output,'failure.txt'),String(error.stack||error));host?.dispose();app.exit(1);});
