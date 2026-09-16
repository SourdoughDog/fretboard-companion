'use strict';
const {app,BrowserWindow,Menu,ipcMain,protocol,session,shell,dialog,nativeTheme,screen}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const {ORIGIN,THEMES,allowedExternal,trustedSender,validateMidi}=require('./security.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'fretboard',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
const execFileAsync=promisify(execFile);
const resources=path.join(__dirname,'generated');
const themeNames=['Classic (Default)','Classic · Coast','Classic · Harbor','Lagoon','Ocean','Plum','Forest','Midnight','Sunset Studio','Pocket Pixel','Moonlit Grimoire','Orbital Console','Neon Arcade','Letterpress','Blueprint'];

class WindowsApp {
  constructor({hidden=false,userData=app.getPath('userData'),saveDialog,copyFile}={}) {
    this.hidden=hidden;this.userData=userData;this.main=null;this.synth=null;this.state=null;
    this.preferences={theme:'classic',scales:'numbers',chords:'numbers',progressions:'roman'};
    this.saveDialog=saveDialog||((options)=>dialog.showSaveDialog(this.main,options));
    this.copyFile=copyFile||copyMidiFile;this.midiBusy=false;this.listeners=[];
  }
  async start() {
    // A fixed origin keeps localStorage stable across installs and portable moves.
    protocol.handle('fretboard',request=>{
      const files=new Map([[`${ORIGIN}/index.html`,'index.html'],[`${ORIGIN}/synth-window.html`,'synth-window.html']]);
      const file=files.get(request.url);
      if(!file||request.method!=='GET')return new Response('Not found',{status:404});
      return new Response(fs.readFileSync(path.join(resources,file)),{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'}});
    });
    session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
    session.defaultSession.setPermissionCheckHandler(()=>false);
    session.defaultSession.on('will-download',event=>event.preventDefault());
    // Content is wholly local. Optional reference links are opened by the OS browser.
    session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','file://*/*','ws://*/*','wss://*/*']},(_details,callback)=>callback({cancel:true}));
    this.registerBridge();
    this.installMenus();
    this.main=this.makeWindow('index.html','Guitar Fretboard',this.savedBounds());
    this.main.on('close',()=>this.saveBounds());
    this.main.on('closed',()=>{this.main=null;if(this.synth&&!this.synth.isDestroyed())this.synth.destroy();this.synth=null;if(!this.hidden)app.quit();});
    await this.main.loadURL(`${ORIGIN}/index.html`);
    return this;
  }
  savedBounds() {
    let saved={};try{saved=JSON.parse(fs.readFileSync(path.join(this.userData,'window.json'),'utf8'));}catch{}
    const area=screen.getPrimaryDisplay().workArea;
    const width=Math.max(620,Math.min(Number(saved.width)||1220,area.width));
    const height=Math.max(520,Math.min(Number(saved.height)||900,area.height));
    const bounds={width,height};
    if(Number.isInteger(saved.x)&&Number.isInteger(saved.y)&&screen.getAllDisplays().some(({workArea:r})=>saved.x+width>r.x+80&&saved.x<r.x+r.width-80&&saved.y>=r.y&&saved.y<r.y+r.height-80))Object.assign(bounds,{x:saved.x,y:saved.y});
    return bounds;
  }
  saveBounds() {if(this.hidden||!this.main)return;try{fs.mkdirSync(this.userData,{recursive:true});fs.writeFileSync(path.join(this.userData,'window.json'),JSON.stringify(this.main.getNormalBounds()));}catch{}}
  makeWindow(page,title,bounds) {
    const win=new BrowserWindow({...bounds,title,show:false,backgroundColor:'#f7f4ec',icon:path.join(resources,'icon.png'),minWidth:page==='index.html'?620:520,minHeight:page==='index.html'?520:640,
      webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,backgroundThrottling:false,spellcheck:false,autoplayPolicy:'no-user-gesture-required',offscreen:this.hidden}});
    if(this.hidden)win.webContents.setAudioMuted(true);
    const openExternal=url=>{if(allowedExternal(url)&&!this.hidden)shell.openExternal(url).catch(()=>{});};
    win.webContents.setWindowOpenHandler(({url})=>{openExternal(url);return {action:'deny'};});
    win.webContents.on('will-navigate',(event,url)=>{if(url!==`${ORIGIN}/${page}`){event.preventDefault();openExternal(url);}});
    win.webContents.on('will-redirect',event=>event.preventDefault());
    win.webContents.on('will-attach-webview',event=>event.preventDefault());
    win.webContents.on('render-process-gone',(_event,details)=>{if(!this.hidden)dialog.showErrorBox('Guitar Fretboard stopped',`The window stopped (${details.reason}). Please close and reopen the app. Your saved settings remain on this PC.`);});
    win.webContents.on('did-fail-load',(_event,code,description)=>{if(code!==-3&&!this.hidden)dialog.showErrorBox('The fretboard could not open',description);});
    win.once('ready-to-show',()=>{if(!this.hidden)win.show();});
    return win;
  }
  async js(code,win=this.main) {if(!win||win.isDestroyed())return;return win.webContents.executeJavaScript(code,true);}
  call(name,...args) {return this.js(`${name}(...${JSON.stringify(args)})`);}
  safely(promise) {Promise.resolve(promise).catch(error=>{console.error(error);if(!this.hidden)dialog.showErrorBox('Guitar Fretboard',error.message);});}
  async openSynth() {
    if(this.synth&&!this.synth.isDestroyed()){if(!this.hidden)this.synth.show();await this.call('publishSynthState',true);return this.synth;}
    this.synth=this.makeWindow('synth-window.html','Wavetable Synth',{width:680,height:820});
    this.synth.on('closed',()=>{this.synth=null;});
    await this.synth.loadURL(`${ORIGIN}/synth-window.html`);
    await this.call('publishSynthState',true);
    return this.synth;
  }
  registerBridge() {
    const listen=(name,page,handler)=>{
      const listener=(event,body)=>{
        if(!trustedSender(event,page==='index.html'?this.main:this.synth,page))return;
        try {if(body===null||typeof body!=='object'||JSON.stringify(body).length>4_100_000)return;this.safely(handler(body));}catch(error){console.error(error);}
      };
      ipcMain.on('fretboard:'+name,listener);this.listeners.push([name,listener]);
    };
    listen('appearance','index.html',body=>{
      if(!THEMES.includes(body.theme))return;
      this.preferences.theme=body.theme;
      for(const tab of ['scales','chords','progressions'])if(['numbers','roman'].includes(body[tab]))this.preferences[tab]=body[tab];
      nativeTheme.themeSource=['classic-harbor','midnight','fantasy','orbital','neon','blueprint'].includes(body.theme)?'dark':'light';
      this.syncMenus();
    });
    listen('openSynth','index.html',()=>this.openSynth());
    listen('synthState','index.html',body=>{this.state=body;return this.js(`receiveSynthState(${JSON.stringify(body)})`,this.synth);});
    listen('synthControl','synth-window.html',body=>{
      switch(body.action){
        case 'ready':return this.call('publishSynthState',true);
        case 'play':return this.call('playProgression');
        case 'stop':return this.call('stopPlayback');
        case 'toggle':return this.js('(synthSession||synthPending)?stopPlayback():playProgression()');
        case 'set':if(typeof body.key==='string'&&['string','number','boolean'].includes(typeof body.value))return this.call('setSynthOption',body.key,body.value);break;
        case 'sound':if(['save','load','update','rename','favorite','delete','undo','preview'].includes(body.command))return this.call('soundLibraryAction',body.command,body);break;
      }
    });
    listen('midiExport','index.html',body=>this.exportMidi(body));
  }
  async exportMidi(body) {
    if(this.midiBusy)return;
    this.midiBusy=true;
    try {
      const {action,name,data}=validateMidi(body);
      if(action==='save'){
        const result=await this.saveDialog({title:'Save MIDI progression',defaultPath:name,filters:[{name:'MIDI sequence',extensions:['mid']}],properties:['showOverwriteConfirmation']});
        if(result.canceled||!result.filePath){await this.call('midiExportResult','MIDI save canceled.');return;}
        await fs.promises.writeFile(result.filePath,data);
        await this.call('midiExportResult','Saved MIDI. Import the file into your DAW.');
      }else{
        const folder=path.join(this.userData,'MIDI Exports',crypto.randomUUID());
        await fs.promises.mkdir(folder,{recursive:true});const filename=path.join(folder,name);
        await fs.promises.writeFile(filename,data);
        await this.copyFile(filename);
        await this.call('midiExportResult','MIDI file copied. Paste into a DAW that accepts files, or use Save MIDI to import it.');
      }
    }catch(error){await this.call('midiExportResult','Could not export MIDI: '+error.message);}
    finally{this.midiBusy=false;}
  }
  installMenus() {
    const perform=fn=>()=>this.safely(fn());
    const focusMain=()=>{if(!this.hidden){this.main?.show();this.main?.focus();}};
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {label:'&File',submenu:[
        {label:'Print Current View…',accelerator:'Ctrl+P',click:()=>this.main?.webContents.print({landscape:true,printBackground:true})},
        {type:'separator'},
        {label:'Wavetable Synth…',accelerator:'Ctrl+4',click:perform(()=>this.openSynth())},
        {label:'Degree Labels',submenu:['scales','chords','progressions'].map(tab=>({label:tab[0].toUpperCase()+tab.slice(1),submenu:['numbers','roman'].map(value=>({id:`notation-${tab}-${value}`,label:value==='numbers'?'Numbers · 1, ♭3, 5':'Roman · I, ♭III, V',type:'radio',checked:this.preferences[tab]===value,click:perform(()=>this.call('setAppNotation',value,tab))}))}))},
        {label:'Theme',submenu:THEMES.map((theme,index)=>({id:`theme-${theme}`,label:themeNames[index],type:'radio',checked:theme===this.preferences.theme,click:perform(()=>this.call('setAppTheme',theme))}))},
        {type:'separator'},{role:'close',label:'Close Window',accelerator:'Ctrl+W'},{role:'quit',label:'Exit',accelerator:'Alt+F4'}
      ]},
      {label:'&Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'},
        {type:'separator'},{id:'edit-find',label:'Find…',accelerator:'Ctrl+F',click:perform(async()=>{focusMain();await this.js("if(earVisible)document.getElementById('mode-scales').click();appKeyboardShortcut({key:'f',ctrlKey:true,preventDefault(){}});");})}]},
      {label:'&View',submenu:[...['scales','chords','progressions','ear'].map((tab,index)=>({id:`view-${tab}`,label:tab==='ear'?'Ear Training':tab[0].toUpperCase()+tab.slice(1),accelerator:`Ctrl+${index===3?5:index+1}`,click:perform(()=>{focusMain();return this.js(`document.getElementById('mode-${tab}').click()`);})})),{type:'separator'},{role:'zoomIn'},{role:'zoomOut'},{role:'resetZoom'},{type:'separator'},{role:'togglefullscreen'}]},
      {label:'&Help',submenu:[
        {label:'User Guide',click:perform(()=>shell.openPath(path.join(resources,'User Guide.txt')))},
        {label:'About Guitar Fretboard',click:()=>dialog.showMessageBox({type:'info',title:'Guitar Fretboard',message:'Fretboard companion · Windows 1.27.0',detail:'26 scales and modes · 34 chord types · Progression arranger\nWavetable synth · Ear training · 15 themes\n\nBuilt by SourdoughDog with coding and design assistance from OpenAI Codex.\n\nEverything works offline. Settings and libraries stay on this PC.'})}
      ]}
    ]));
  }
  syncMenus() {
    const menu=Menu.getApplicationMenu();
    // Selecting one radio item clears its siblings; do not assign false to them.
    menu.getMenuItemById(`theme-${this.preferences.theme}`).checked=true;
    for(const tab of ['scales','chords','progressions'])menu.getMenuItemById(`notation-${tab}-${this.preferences[tab]}`).checked=true;
  }
  dispose() {for(const [name,listener] of this.listeners)ipcMain.removeListener('fretboard:'+name,listener);if(this.synth&&!this.synth.isDestroyed())this.synth.destroy();if(this.main&&!this.main.isDestroyed())this.main.destroy();}
}

async function copyMidiFile(filename) {
  // CF_HDROP is a real Windows file-list clipboard entry, not a text path.
  // The filename travels in the child environment, never inside PowerShell code.
  const script='Add-Type -AssemblyName System.Windows.Forms; $files = New-Object System.Collections.Specialized.StringCollection; [void]$files.Add($env:FRETBOARD_MIDI_FILE); [System.Windows.Forms.Clipboard]::SetFileDropList($files)';
  const executable=path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
  await execFileAsync(executable,['-NoLogo','-NoProfile','-NonInteractive','-STA','-Command',script],{windowsHide:true,timeout:15000,env:{...process.env,FRETBOARD_MIDI_FILE:filename}});
}

if(require.main===module){
  app.setName('Guitar Fretboard');
  app.setPath('userData',path.join(app.getPath('appData'),'Guitar Fretboard'));
  app.setAppUserModelId('local.guitar.fretboardcompanion.windows');
  if(!app.requestSingleInstanceLock())app.quit();
  else {
    let instance;
    app.on('second-instance',()=>{if(instance?.main){if(instance.main.isMinimized())instance.main.restore();instance.main.show();instance.main.focus();}});
    app.whenReady().then(async()=>{instance=new WindowsApp();await instance.start();}).catch(error=>{dialog.showErrorBox('Guitar Fretboard could not start',error.message);app.quit();});
    app.on('window-all-closed',()=>app.quit());
  }
}
module.exports={WindowsApp,copyMidiFile};
