const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.env.FRETBOARD_TEST_HTML||__dirname+'/../mac/app-source.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
// A minimal DOM adapter checks authored render output and event paths without opening a browser.
const elements=new Map();let notes=[],focused=null,tool=null;
class Element{
 constructor(id=''){this.id=id;this.dataset={};this.attrs={};this.listeners={};this.children=[];this.hidden=false;this._html='';this.classes=new Set();this.classList={add:(...names)=>names.forEach(n=>this.classes.add(n)),remove:(...names)=>names.forEach(n=>this.classes.delete(n)),toggle:(k,b)=>b?this.classes.add(k):this.classes.delete(k)};}
 set innerHTML(value){this._html=value;if(this.id==='fretboard')notes=[...value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(m=>{const el=new Element();for(const a of m[1].matchAll(/([\w-]+)="([^"]*)"/g)){el.attrs[a[1]]=a[2];if(a[1].startsWith('data-'))el.dataset[a[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=a[2];}el.tabIndex=Number(el.attrs.tabindex);el.classes=new Set(el.attrs.class.split(' '));return el;});}
 get innerHTML(){return this._html;}
 setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}append(el){this.children.push(el);}addEventListener(k,fn){this.listeners[k]=fn;}focus(){focused=this;}closest(){return this;}
}
for(const id of html.matchAll(/\bid="([^"]+)"/g))elements.set(id[1],new Element(id[1]));
const document={documentElement:new Element(),getElementById:id=>{assert(elements.has(id),'Missing DOM target '+id);return elements.get(id);},createElement:()=>new Element(),querySelectorAll:()=>notes,querySelector:selector=>notes.find(n=>n.dataset.index===selector.match(/data-index="(\d+)"/)?.[1]),modelContext:{registerTool:t=>{tool=t;}}};
const savedData=new Map();const localStorage={getItem:k=>savedData.get(k)||null,setItem:(k,v)=>savedData.set(k,v)};
const ctx=vm.createContext({document,console,localStorage});vm.runInContext(script,ctx);
const run=src=>vm.runInContext(src,ctx),plain=x=>JSON.parse(JSON.stringify(x));
class AudioParamStub{constructor(value=0){this.value=value;this.events=[];}event(kind,value,time){assert(Number.isFinite(value)&&Number.isFinite(time));assert(time>=0);this.events.push({kind,value,time});this.value=value;return this;}setValueAtTime(v,t){return this.event('set',v,t);}linearRampToValueAtTime(v,t){return this.event('linear',v,t);}exponentialRampToValueAtTime(v,t){assert(v>0);return this.event('exponential',v,t);}setTargetAtTime(v,t,constant){assert(constant>0);return this.event('target',v,t);}cancelAndHoldAtTime(t){return this.cancelScheduledValues(t);}cancelScheduledValues(t){this.events=this.events.filter(e=>e.time<t);return this;}}
class AudioNodeStub{constructor(kind,context){this.kind=kind;this.context=context;this.connections=[];this.gain=new AudioParamStub(1);this.frequency=new AudioParamStub(440);this.detune=new AudioParamStub();this.pan=new AudioParamStub();this.Q=new AudioParamStub();for(const key of ['threshold','knee','ratio','attack','release'])this[key]=new AudioParamStub();context.nodes.push(this);}connect(node){assert(node);this.connections.push(node);return node;}disconnect(){this.disconnected=true;}setPeriodicWave(wave){assert(wave.imag[1]>0);this.wave=wave;}start(t){assert(Number.isFinite(t));this.started=t;}stop(t=this.context.currentTime){assert(Number.isFinite(t));this.stopped=t;}}
let audioCreations=0,deferredResume=null;
class AudioContextStub{constructor(){audioCreations++;this.currentTime=0;this.sampleRate=48000;this.state='suspended';this.nodes=[];this.destination={kind:'silent-destination'};}async resume(){if(deferredResume)await deferredResume;this.state='running';}createBuffer(channels,length,rate){const data=new Float32Array(length);return {sampleRate:rate,length,getChannelData:()=>data};}createConvolver(){return new AudioNodeStub('convolver',this);}createBufferSource(){return new AudioNodeStub('buffer',this);}createGain(){return new AudioNodeStub('gain',this);}createDynamicsCompressor(){return new AudioNodeStub('compressor',this);}createBiquadFilter(){return new AudioNodeStub('filter',this);}createStereoPanner(){return new AudioNodeStub('pan',this);}createOscillator(){return new AudioNodeStub('osc',this);}createPeriodicWave(real,imag){assert.equal(real.length,imag.length);assert.equal(imag[0],0);assert([...real,...imag].every(Number.isFinite));return {real,imag};}}
let timerID=0;const intervals=new Map(),timeouts=new Map();
ctx.window={AudioContext:AudioContextStub};ctx.setInterval=(fn,ms)=>{assert.equal(ms,25);intervals.set(++timerID,fn);return timerID;};ctx.clearInterval=id=>intervals.delete(id);ctx.setTimeout=(fn,ms)=>{timeouts.set(++timerID,fn);return timerID;};ctx.clearTimeout=id=>timeouts.delete(id);
// Library transactions, snapshots, migration and storage failure protection.
run("setSynthOption('attack',.8);setSynthOption('release',1.5);soundLibraryAction('save',{name:'  Soft <keys>  '})");
assert.equal(run('personalLibrary.sounds.length'),1);const soundId=run('activeSoundId');assert.equal(run('personalLibrary.sounds[0].name'),'Soft <keys>');
run("setSynthOption('preset','glass');setSynthOption('tempo',132);setSynthOption('style','fingerpick')");run(`soundLibraryAction('load',{id:'${soundId}'})`);
assert.equal(run('synthOptions.attack'),.8);assert.equal(run('synthOptions.release'),1.5);assert.equal(run('synthOptions.tempo'),132);assert.equal(run('synthOptions.style'),'fingerpick');
run(`soundLibraryAction('favorite',{id:'${soundId}'})`);assert(run('personalLibrary.sounds[0].favorite'));
run(`soundLibraryAction('rename',{id:'${soundId}',name:'Evening pad'})`);assert.equal(run('personalLibrary.sounds[0].name'),'Evening pad');
run(`soundLibraryAction('delete',{id:'${soundId}'})`);assert.equal(run('personalLibrary.sounds.length'),0);run('undoLibrary()');assert.equal(run('personalLibrary.sounds.length'),1);
const libraryBefore=run('JSON.stringify(personalLibrary)');const realSet=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota')};run("soundLibraryAction('save',{name:'Cannot save'})");assert.equal(run('JSON.stringify(personalLibrary)'),libraryBefore);assert(run('libraryMessage').includes('not changed'));localStorage.setItem=realSet;
run("useStarter('pop');practice={enabled:true,metronome:true,countIn:2,bars:2,step:5,target:150};voicingOptions={mode:'smooth',spacing:'open',octave:-1}");
elements.get('song-name').value='Weekend <practice>';elements.get('song-collection').value='Practice set';run('saveSong()');const songId=run('activeSongId'),saved=plain(run('workspaceSnapshot()'));
run("setSynthOption('preset','brass');progression.root='F#';practice.enabled=false;voicingOptions.mode='root'");const previous=plain(run('workspaceSnapshot()'));run(`loadSong('${songId}')`);assert.deepEqual(plain(run('workspaceSnapshot()')),saved);assert.deepEqual(plain(run('workspaceBeforeLoad')),previous);assert(elements.get('song-list').innerHTML.includes('Weekend &lt;practice&gt;'));
run("progression.items[0].beats=8");assert.equal(run('personalLibrary.songs[0].workspace.progression.items[0].beats'),4,'saved snapshot independent of edits');
run('personalLibrary={sounds:[],songs:[],scores:{}};restorePersonalLibrary()');assert.equal(run('personalLibrary.songs.length'),1);assert.equal(run('personalLibrary.sounds[0].name'),'Evening pad');
run('practice={...PRACTICE_DEFAULTS};voicingOptions={...VOICING_DEFAULTS};restoreWorkspace()');assert.equal(run('practice.bars'),2);assert.equal(run('voicingOptions.mode'),'smooth');
assert(!run("validProgression({root:'C',mode:'major',size:'triads',items:[null]})"));assert(!run("validPractice('target',NaN)"));assert(!run("validVoicing('octave',99)"));
console.log('PASS: named sounds, favorites, recall without changing performance, deletion undo, storage failure, saved collections and independent workspace restoration.');
// Every voicing preserves the pitch classes of every supported chord and stays in MIDI range.
run('practice={...PRACTICE_DEFAULTS};voicingOptions={...VOICING_DEFAULTS}')
for(const mode of ['original','smooth','root','first','second'])for(const spacing of ['close','open'])for(const octave of [-1,0,1])for(const root of ['C','F#','Bb'])for(const chord of plain(run('CHORDS'))){
 const notes=plain(run(`voicedProgression([{degree:'1',quality:'${chord.id}',beats:4}], '${root}', {mode:'${mode}',spacing:'${spacing}',octave:${octave}})[0].voicing`)),rootPc=run(`rootPitch('${root}')`);
 assert.deepEqual([...new Set(notes.map(n=>(n-rootPc+120)%12))].sort((a,b)=>a-b),[...new Set(chord.offsets)].sort((a,b)=>a-b));assert(notes.every(n=>Number.isInteger(n)&&n>=0&&n<=127));
 if(mode==='first'&&spacing==='close')assert.equal((notes[0]-rootPc+120)%12,[...chord.offsets].sort((a,b)=>a-b)[1]);
}
assert.deepEqual(plain(run("voicedProgression([{voicing:[40,47,52],degree:'1',quality:'major'}],'C',{mode:'smooth',spacing:'open',octave:1})[0].voicing")),[40,47,52]);
run("progression.root='C';useStarter('pop')");const close=plain(run("voicedProgression(progression.items,'C',{mode:'root',spacing:'close',octave:0})")),smooth=plain(run("voicedProgression(progression.items,'C',{mode:'smooth',spacing:'close',octave:0})"));
const movement=chords=>chords.slice(1).reduce((sum,c,i)=>sum+c.voicing.reduce((s,n,k)=>s+Math.abs(n-chords[i].voicing[k]),0),0);assert(movement(smooth)<movement(close));
run("voicingOptions={mode:'first',spacing:'close',octave:1}");const bytes=plain(run("Array.from(midiBytes('chords'))"));const notesInMidi=[];for(let i=0;i<bytes.length-2;i++)if(bytes[i]===0x90)notesInMidi.push(bytes[i+1]);assert.deepEqual([...new Set(notesInMidi)].sort((a,b)=>a-b),[...new Set(plain(run('voicedProgression(progression.items)')).flatMap(c=>c.voicing))].sort((a,b)=>a-b));
const arp=plain(run("performanceEvents(voicedProgression([{degree:'1',quality:'major',beats:4}],'C',{mode:'first',spacing:'close',octave:0})[0],{tempo:120,style:'up',rate:2},2,'C').map(p=>p.midi)"));assert.deepEqual([...new Set(arp)].sort((a,b)=>a-b),[52,55,60],'arpeggio includes inversion bass');
console.log('PASS: 3,060 voicing combinations preserve chord tones and MIDI range; inversions, exact guitar voicings, smoother motion, and exported MIDI pitches.');
// Stable questions, first-answer scoring, answer spelling, separate score buckets.
elements.get('ear-game').value='interval';elements.get('ear-level').value='starter';elements.get('ear-direction').value='down';
run("earQuestion=makeEarQuestion('interval','starter','down',()=>0)");assert.deepEqual(plain(run('earQuestion.notes')),[48,50]);assert.deepEqual(plain(run('earPicks(earQuestion).map(p=>p.midi)')),[50,48]);
const qBefore=run('JSON.stringify(earQuestion)');run('earPicks(earQuestion)');assert.equal(run('JSON.stringify(earQuestion)'),qBefore);
run("revealEarAnswer('M2')");assert.equal(run("personalLibrary.scores['interval-starter'].correct"),1);run("revealEarAnswer('M2')");assert.equal(run("personalLibrary.scores['interval-starter'].total"),1);
assert(elements.get('ear-note-list').textContent.includes('C · D'));assert(elements.get('ear-board').innerHTML.includes('ear-dot'));
run("earQuestion=makeEarQuestion('chord','extended','together',()=>.6);revealEarAnswer()");assert.equal(run("personalLibrary.scores['chord-extended'].correct"),0);assert.equal(run("personalLibrary.scores['chord-extended'].total"),1);
run("showEarPage();setAppTheme('midnight')");assert.equal(run('earVisible'),true);assert.equal(elements.get('ear-training').hidden,false);run('showPage(true)');assert.equal(elements.get('ear-training').hidden,true);
console.log('PASS: interval/chord question sets, descending playback, first-answer-only scoring, reveal, fretboard answers and theme/tab navigation.');
(async()=>{
 run("stopPlayback();progression.root='C';progression.items=[{degree:'1',quality:'major',beats:4,origin:'Test'}];synthOptions.tempo=120;synthOptions.loop=false;synthOptions.style='chords';practice={enabled:true,metronome:true,countIn:1,bars:1,step:10,target:135};voicingOptions={...VOICING_DEFAULTS}");
 await run('playProgression()');const ac=run('synthContext');
 function advance(end){for(let t=ac.currentTime+.025;t<=end+.00001;t+=.025){ac.currentTime=t;for(const n of ac.nodes)if(n.kind==='osc'&&!n.ended&&n.stopped<=t){n.ended=true;n.onended?.();}run('tickSynth()');}}
 assert.equal(run('synthSession.queue.length'),0,'count-in before chords');assert.equal(ac.nodes.filter(n=>n.kind==='osc'&&[850,1200].includes(n.frequency.value)&&n.started!==undefined).length,4);
 assert(Math.abs(run('synthSession.nextTime')-2.08)<.0001);advance(2.1);assert.equal(run('synthSession.queue[0].tempo'),120);assert.equal(run('synthSession.queue[0].lap'),1);
 advance(4.1);assert.equal(run('synthSession.queue.at(-1).tempo'),130);assert.equal(run('synthSession.queue.at(-1).lap'),2);
 run("setSynthOption('morph',72)");assert.equal(run('synthSession.settings.tempo'),135,'sound edits preserve accelerated timing');
 advance(6.1);assert.equal(run('synthSession.queue.at(-1).tempo'),135);assert(run('synthSession'),'practice loops even when ordinary loop off');
 const clicks=ac.nodes.filter(n=>n.kind==='osc'&&[850,1200].includes(n.frequency.value)&&n.started!==undefined);assert(clicks.every(n=>n.stopped>n.started&&n.stopped-n.started<.051));
 const active=run('synthSession');run('stopPlayback()');assert([...active.voices].every(n=>n.stopped<=ac.currentTime+.036),'stop cancels clicks and notes');
 await run('playProgression()');run("setPracticeOption('bars',2)");assert.equal(run('synthSession'),null,'practice edits stop cleanly');assert.equal(run('effectivePracticeItems(progression.items)[0].beats'),8);
 await run('playProgression(0)');assert.equal(run('synthSession.practice'),false,'card previews skip practice count-in');run('stopPlayback()');
 run("earQuestion=makeEarQuestion('interval','starter','up',()=>0)");await run('playProgression(null,{degree:"1",quality:"major",beats:4,voicing:earQuestion.notes,lessonPicks:earPicks(earQuestion)})');
 assert.equal(run('synthSession.lesson'),true);assert.equal(run('synthSession.settings.preset'),'keys');assert.deepEqual(plain(run('[...synthSession.notes].map(n=>n.midi)')),[48,50]);run('stopPlayback()');
 console.log('PASS: count-in before chords, metronome timing and cleanup, tempo ramp/ceiling, stop/cancel, practice-free previews, and fixed-sound exercise playback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
