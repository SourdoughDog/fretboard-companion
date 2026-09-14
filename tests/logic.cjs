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
assert.equal(run('preferences.theme'),'classic');
assert.deepEqual(plain(run('preferences.notations')),{scales:'numbers',chords:'numbers',progressions:'roman'});
assert.equal(notes.length,78);assert.equal(elements.get('scale').children.length,4);
const expected={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],'harmonic-minor':[0,2,3,5,7,8,11],'melodic-minor':[0,2,3,5,7,9,11],ionian:[0,2,4,5,7,9,11],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10],lydian:[0,2,4,6,7,9,11],mixolydian:[0,2,4,5,7,9,10],aeolian:[0,2,3,5,7,8,10],locrian:[0,1,3,5,6,8,10],'major-pentatonic':[0,2,4,7,9],'minor-pentatonic':[0,3,5,7,10],'major-blues':[0,2,3,4,7,9],'minor-blues':[0,3,5,6,7,10],'suspended-pentatonic':[0,2,5,7,10],hirajoshi:[0,2,3,7,8],'harmonic-major':[0,2,4,5,7,8,11],'phrygian-dominant':[0,1,4,5,7,8,10],'lydian-dominant':[0,2,4,6,7,9,10],'whole-tone':[0,2,4,6,8,10],'half-whole':[0,1,3,4,6,7,9,10],'whole-half':[0,2,3,5,6,8,9,11],'double-harmonic':[0,1,4,5,7,8,11],'hungarian-minor':[0,2,3,6,7,8,11],'bebop-dominant':[0,2,4,5,7,9,10,11]};
const scales=plain(run('SCALES')),roots=plain(run('ROOTS'));
assert.equal(scales.length,26);const nat={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const pc=name=>(nat[name[0]]+[...name.slice(1)].reduce((n,a)=>n+(a==='#'?1:-1),0)+24)%12;
let positions=0;
for(const s of scales){assert.deepEqual(s.offsets,expected[s.id],s.id);assert.equal(new Set(s.offsets).size,s.offsets.length);for(const root of roots){run(`configure(${JSON.stringify(root)},${JSON.stringify(s.id)},false)`);assert.equal(notes.length,78);for(let i=0;i<78;i++){const n=notes[i],actual=([64,59,55,50,45,40][Math.floor(i/13)]+i%13)%12;assert.equal(pc(n.dataset.note),actual,root+' '+s.id+' '+i);assert.equal(n.dataset.inScale,String(expected[s.id].includes((actual-pc(root)+12)%12)));if(n.dataset.degree==='1')assert.equal(actual,pc(root));positions++;}for(let row=0;row<6;row++){assert.equal(notes[row*13].dataset.degree,notes[row*13+12].dataset.degree);assert.equal(notes[row*13].dataset.note,notes[row*13+12].dataset.note);}}}
assert.deepEqual(plain(run("configure('G#','major').notes")),['G#','A#','B#','C#','D#','E#','F##']);
assert.deepEqual(plain(run("configure('Gb','major').notes")),['Gb','Ab','Bb','Cb','Db','Eb','F']);
assert.deepEqual(plain(run("configure('A','minor').notes")),['A','B','C','D','E','F','G']);
assert.equal(run("configure('C','lydian'); currentDegree(6)"),'#4');
// Exercise selector handlers and display toggle as wired in the HTML.
elements.get('root').listeners.change({target:{value:'F#'}});assert.equal(run('state.root'),'F#');
elements.get('scale').listeners.change({target:{value:'minor-blues'}});assert.equal(run('state.scale'),'minor-blues');
elements.get('scale-only').listeners.click();assert.equal(run('state.only'),true);assert(notes.filter(n=>n.classes.has('is-hidden')).every(n=>n.attrs['aria-hidden']==='true'&&n.tabIndex===-1));assert.equal(elements.get('outside-legend').hidden,true);
elements.get('all-notes').listeners.click();assert.equal(run('state.only'),false);assert(notes.every(n=>!n.classes.has('is-hidden')));
run("configure('C','major',false)");elements.get('fretboard').listeners.click({target:notes[8]});assert.equal(notes.filter(n=>n.classes.has('highlight')).length,6);assert.equal(elements.get('clear-note').hidden,false);
elements.get('fretboard').listeners.keydown({target:notes[8],key:'ArrowRight',preventDefault(){}});assert.equal(focused.dataset.index,'9');
elements.get('fretboard').listeners.keydown({target:notes[9],key:'Escape'});assert(notes.every(n=>!n.classes.has('highlight')));
run("configure('C','major',true)");elements.get('fretboard').listeners.keydown({target:notes[1],key:'ArrowRight',preventDefault(){}});assert.equal(focused.dataset.index,'3');
assert.equal(tool.name,'set_fretboard_scale');const toolResult=tool.execute({root:'Eb',scale:'dorian',onlyScaleNotes:true});assert.equal(toolResult.root,'Eb');assert.equal(elements.get('root').value,'Eb');
const before=run('JSON.stringify(state)');assert.throws(()=>tool.execute({root:'H',scale:'major'}));assert.equal(run('JSON.stringify(state)'),before);assert.throws(()=>tool.execute({root:'C',scale:'major',foo:true}));
// No remote runtime assets, imports, requests, or dependency loading.
assert(!/<(?:script|img|iframe)[^>]+src=/.test(html));assert(!/<link[^>]+href="https?:/.test(html));assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|@import|import\s*\(/.test(script));
fs.writeFileSync(__dirname+'/logic-checks.json',JSON.stringify({scales:scales.length,roots:roots.length,configurations:scales.length*roots.length,positions,checks:['interval sets','enharmonic spelling','octave repetition','selectors','scale-only filter','note matching','keyboard navigation','optional agent tool valid and invalid inputs','no remote runtime dependencies'],browserVisualQA:'Run scripts/check-ui.py for silent native WebKit checks.'},null,2));
console.log(`PASS: ${scales.length} scales × ${roots.length} root spellings, ${positions} fretboard positions; event paths and offline dependencies checked. Browser rendering not tested.`);
console.log('Scale references:',scales.filter(s=>['hirajoshi','half-whole','whole-half','lydian-dominant'].includes(s.id)).map(s=>`${s.id}: ${s.ring}`).join(', '));
const chordExpected={'7b9':[0,4,7,10,1],'7sharp9':[0,4,7,10,3],'7b5':[0,4,6,10],'7sharp5':[0,4,8,10],'7sharp11':[0,4,7,10,6],'13b9':[0,4,7,10,1,9],'major7sharp11':[0,4,7,11,6],'major7sharp5':[0,4,8,11],'minor11':[0,3,7,10,2,5],'minor-six-nine':[0,3,7,9,2],major:[0,4,7],minor:[0,3,7],diminished:[0,3,6],augmented:[0,4,8],sus2:[0,2,7],sus4:[0,5,7],power:[0,7],sixth:[0,4,7,9],'minor-sixth':[0,3,7,9],dominant7:[0,4,7,10],major7:[0,4,7,11],minor7:[0,3,7,10],'minor-major7':[0,3,7,11],'half-diminished':[0,3,6,10],diminished7:[0,3,6,9],'7sus4':[0,5,7,10],add9:[0,4,7,2],'minor-add9':[0,3,7,2],'six-nine':[0,4,7,9,2],dominant9:[0,4,7,10,2],major9:[0,4,7,11,2],minor9:[0,3,7,10,2],dominant11:[0,4,7,10,2,5],dominant13:[0,4,7,10,2,5,9]};
const chords=plain(run('CHORDS'));let chordPositions=0;
assert.equal(chords.length,34);
for(const chord of chords){
 assert.deepEqual(chord.offsets,chordExpected[chord.id]);
 const distances=plain(run(`CHORDS.find(c=>c.id===${JSON.stringify(chord.id)}).formula.map(degreeDistance)`));
 assert(distances.every((n,i)=>i===0||n>distances[i-1]),'Ascending formula '+chord.id);
 for(const root of roots){
  run(`configureChord(${JSON.stringify(root)},${JSON.stringify(chord.id)},false)`);
  assert.equal(elements.get('scale-control').hidden,true);assert.equal(elements.get('chord-control').hidden,false);assert.equal(elements.get('scale-harmony').hidden,true);
  assert.equal(notes.length,78);
  for(let i=0;i<78;i++){
   const n=notes[i],actual=([64,59,55,50,45,40][Math.floor(i/13)]+i%13)%12;
   assert.equal(pc(n.dataset.note),actual,root+' '+chord.id+' '+i);
   assert.equal(n.dataset.inScale,String(chordExpected[chord.id].includes((actual-pc(root)+12)%12)));
   assert(n.attrs['aria-label'].includes('selected chord'));
   chordPositions++;
  }
 }
}
assert.deepEqual(plain(run("configureChord('C','diminished7').notes")),['C','Eb','Gb','Bbb']);
assert.equal(run("currentDegree(9)"),'bb7');assert(elements.get('spelling').textContent.includes('B♭♭ sounds like A'));
assert.deepEqual(plain(run("configureChord('C','major9').notes")),['C','E','G','B','D']);assert.equal(run('currentDegree(2)'),'9');
assert.equal(elements.get('steps').textContent,'Gaps between successive tones in the ascending formula: 4H · 3H · 4H · 3H. H = 1 fret; W = 2 frets.');
assert.deepEqual(plain(run("configureChord('Db','minor').notes")),['Db','Fb','Ab']);
elements.get('scale-only').listeners.click();assert.equal(elements.get('scale-only').textContent,'Chord tones only');assert(notes.filter(n=>!n.classes.has('is-hidden')).every(n=>n.dataset.inScale==='true'));
elements.get('root').listeners.change({target:{value:'A'}});assert.equal(run('state.mode'),'chords');assert.equal(run('state.chord'),'minor');assert.deepEqual(plain(run('currentScale().formula.map(d=>spell(state.root,d))')),['A','C','E']);
elements.get('chord').listeners.change({target:{value:'dominant7'}});assert.equal(run('state.chord'),'dominant7');
const previousScale=run('state.scale');elements.get('mode-scales').listeners.click();assert.equal(run('state.mode'),'scales');assert.equal(run('state.scale'),previousScale);assert.equal(elements.get('chord-control').hidden,true);assert.equal(elements.get('scale-harmony').hidden,false);
elements.get('mode-chords').listeners.click();assert.equal(run('state.chord'),'dominant7');assert.equal(run('state.root'),'A');
const invalidBefore=run('JSON.stringify(state)');assert.throws(()=>run("configureChord('H','major')"));assert.throws(()=>run("configureChord('C','unknown')"));assert.equal(run('JSON.stringify(state)'),invalidBefore);
fs.writeFileSync(__dirname+'/chord-checks.json',JSON.stringify({chords:chords.length,roots:roots.length,configurations:chords.length*roots.length,positions:chordPositions,checks:['chord interval sets','all fretboard positions','extension labels','double-flat spelling','successive formula steps','mode switching','root changes preserve chord selection','chord-tone filtering','invalid input rejection']},null,2));
console.log(`PASS: ${chords.length} chords × ${roots.length} root spellings, ${chordPositions} chord positions; extensions, diminished sevenths and mode controls verified.`);
// Each seven-note scale supplies its own ordered stack of thirds.
assert(!html.includes('id="harmony-key-mode"')&&!script.includes('harmonyModeOverride'));
const harmonyFixtures={
 major:['major','minor','minor','major','major','minor','diminished'],
 minor:['minor','diminished','major','minor','minor','major','major'],
 dorian:['minor','minor','major','major','minor','diminished','major'],
 phrygian:['minor','major','major','minor','diminished','major','minor'],
 lydian:['major','major','minor','diminished','major','minor','minor'],
 mixolydian:['major','minor','diminished','major','minor','minor','major'],
 locrian:['diminished','major','minor','minor','major','major','minor'],
 'harmonic-minor':['minor','diminished','augmented','minor','major','major','diminished'],
 'melodic-minor':['minor','minor','augmented','major','major','diminished','diminished']};
for(const [id,qualities] of Object.entries(harmonyFixtures)){
 run(`configure('C','${id}')`);
 assert.deepEqual(plain(run('scaleHarmony().flatMap(g=>g.chords.map(c=>c.quality))')),qualities);
}
const parents={'major-pentatonic':'major','minor-pentatonic':'minor','major-blues':'major','minor-blues':'minor',hirajoshi:'minor','bebop-dominant':'mixolydian'};
for(const scale of scales)for(const root of roots){
 const source=scales.find(s=>s.id===(parents[scale.id]||scale.id));
 const groups=plain(run(`scaleHarmony('${root}',SCALES.find(s=>s.id==='${scale.id}'))`));
 assert.equal(groups.length,source.formula.length);assert(groups.every(g=>g.chords.length===1));
 assert.deepEqual(groups.map(g=>g.degree),source.formula);
 for(const [i,group] of groups.entries())for(const c of group.chords){
  const expectedPitches=[0,2,4].map(step=>(pc(root)+expected[source.id][(i+step)%source.formula.length])%12);
  assert.deepEqual(c.notes.map(pc),expectedPitches);
  assert.deepEqual(c.voicing.slice(1).map(n=>n%12),expectedPitches);
  assert(c.voicing.every((n,j)=>j===0||n>c.voicing[j-1]));
  if(c.quality)assert.deepEqual(c.notes.map(n=>(pc(n)-pc(c.root)+12)%12),chordExpected[c.quality]);
 }
}
run("configure('C','harmonic-minor')");assert.deepEqual(plain(run('scaleHarmony().flatMap(g=>g.chords.map(c=>c.notes))')),[['C','Eb','G'],['D','F','Ab'],['Eb','G','B'],['F','Ab','C'],['G','B','D'],['Ab','C','Eb'],['B','D','F']]);
run("configure('C','major-pentatonic')");assert.deepEqual(plain(run('scaleHarmony().flatMap(g=>g.chords.map(c=>c.name))')),['C','Dm','Em','F','G','Am','Bdim']);
assert(elements.get('harmony-note').textContent.includes('seven-note reference'));
run("configure('C','whole-tone')");assert.equal(run('scaleHarmony().length'),6);assert(plain(run('scaleHarmony()')).every(g=>g.chords[0].quality==='augmented'));
run("configure('C','double-harmonic')");assert(run('scaleHarmony().some(g=>g.chords[0].quality===null)'));assert(elements.get('harmony-note').textContent.includes('parentheses'));
run("configure('C','minor');preferences.notations.scales='roman';renderScaleHarmony()");assert(elements.get('harmony-grid').innerHTML.includes('♭III'));assert(elements.get('harmony-grid').innerHTML.includes('ii°'));
run("preferences.notations.scales='numbers';renderScaleHarmony()");assert(elements.get('harmony-grid').innerHTML.includes('2dim'));
console.log('PASS: distinct modal/harmonic/melodic chord patterns, ordered notes and audible voicings in all roots/scales, explicit parent references, unusual scales and notation.');
// Arranger harmony is checked by pitch, independently of the notation renderer.
let harmonyChecks=0;
for(const root of roots)for(const mode of ['major','minor'])for(const size of ['triads','sevenths']){
 run(`progression={root:${JSON.stringify(root)},mode:'${mode}',size:'${size}',items:[]}`);
 const groups=plain(run('palettes()')),diatonic=groups[0].chords,keyPcs=mode==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10];
 for(const c of diatonic){const chordRoot=run(`degreePitch('${c.degree}')`);for(const n of chordExpected[c.quality])assert(keyPcs.includes((chordRoot+n)%12),'diatonic pitch membership');}
 for(const c of groups[2].chords){assert.equal((run(`degreePitch('${c.degree}')`)-run(`degreePitch('${c.target}')`)+12)%12,7,'secondary root a fifth above target');assert.equal(c.quality,'dominant7');}
 const dominant=groups[1].chords[0],tritone=groups[1].chords[2];
 assert.deepEqual([4,10].map(n=>(7+n)%12).sort((a,b)=>a-b),[4,10].map(n=>(1+n)%12).sort((a,b)=>a-b),'tritone guide-tone equivalence');
 for(const c of groups.flatMap(g=>g.chords)){
  const spelled=run(`spell(progression.root,'${c.degree}')`);assert.equal(pc(spelled),(pc(root)+run(`degreePitch('${c.degree}')`))%12);
  for(const d of chords.find(q=>q.id===c.quality).formula){assert.equal(pc(run(`spell(${JSON.stringify(spelled)},'${d}')`)),(pc(spelled)+run(`degreePitch('${d}')`))%12);}
  harmonyChecks++;
 }
 for(const idea of ['pop','cadence','borrowed','secondary','tritone']){
  run(`useStarter('${idea}')`);const items=plain(run('progression.items'));assert(items.length>=3);assert(items.every(c=>c.degree&&c.quality&&c.beats===4),'complete template '+mode+' '+idea);
 }
}
run("progression={root:'C',mode:'major',size:'triads',items:[]};preferences.notations={scales:'roman',chords:'roman',progressions:'roman'};renderArranger()");
assert.equal(run("degreeLabel('bb7')"),'♭♭VII');assert.equal(run("degreeLabel('#11')"),'♯XI');assert.equal(run("numeral({degree:'2',quality:'minor7'})"),'ii7');assert.equal(run("numeral({degree:'2',quality:'half-diminished'})"),'iiø7');
assert.equal(run("functionLabel(palettes()[2].chords.find(c=>c.target==='2'))"),'V7/ii');
assert.equal(run("chordName(palettes()[2].chords.find(c=>c.target==='2'))"),'A7');
assert.equal(run("chordName(palettes()[1].chords.find(c=>c.id==='tritone'))"),'D♭7');
assert.equal(run("chordName(palettes()[3].chords.find(c=>c.degree==='4'))"),'Fm');
run("configureChord('C','major9');render()");assert(elements.get('formula').innerHTML.includes('IX'));assert(elements.get('fretboard').innerHTML.includes('degree IX'));
assert.equal(elements.get('root-legend').textContent,'Root · I');
run("showPage(true);preferences.theme='midnight';applyPreferences()");assert.equal(elements.get('arranger').hidden,false);assert.equal(document.documentElement.attrs['data-theme'],'midnight');
run("useStarter('secondary')");assert.equal(run('progression.items.length'),4);
run("editSlot('duplicate',1)");assert.equal(run('progression.items.length'),5);
run("editSlot('right',1)");run("editSlot('remove',0)");assert.equal(run('progression.items.length'),4);
const oldNames=plain(run('progression.items.map(chordName)'));
elements.get('key-root').listeners.change({target:{value:'D'}});assert.notDeepEqual(plain(run('progression.items.map(chordName)')),oldNames);assert.equal(run('progression.items.length'),4);
elements.get('undo-progression').listeners.click();assert.equal(run('progression.root'),'C');
elements.get('key-mode').listeners.change({target:{value:'minor'}});assert.equal(run('progression.items.length'),0);
elements.get('undo-progression').listeners.click();assert.equal(run('progression.items.length'),4);assert.equal(run('progression.mode'),'major');
const beforePersist=run('JSON.stringify(progression)');run("saveWorkspace();progression.items=[];restoreWorkspace()");assert.equal(run('JSON.stringify(progression)'),beforePersist);
assert(run('exportProgression()').includes('beats'));
run("editSlot('map',0)");assert.equal(run('state.mode'),'chords');assert.equal(elements.get('arranger').hidden,true);
run("preferences.notations={scales:'numbers',chords:'numbers',progressions:'numbers'}");assert.equal(run("numeral({degree:'2',quality:'minor7'})"),'2m7');
console.log(`PASS: ${harmonyChecks} palette chords across all roots, key types and voicings; all starting ideas; Roman labels; themes; transpose, reorder, undo, persistence and fretboard handoff.`);
// Library: all existing chord types are genuinely available at every root.
run("progression={root:'C',mode:'major',size:'triads',items:[]};libraryState={query:'',root:'all',group:'all',inKey:false,limit:24}");
assert.equal(run('chordLibrary().length'),578);
for(const root of roots){run(`progression.root=${JSON.stringify(root)}`);for(const c of plain(run('chordLibrary()'))){assert.equal(pc(run(`spell(progression.root,${JSON.stringify(c.degree)})`)),pc(c.libraryRoot));}}
run("progression.root='C'");
function searchFor(query){run(`libraryState={query:${JSON.stringify(query)},root:'all',group:'all',inKey:false,limit:24}`);return plain(run('searchLibrary()'));}
assert(searchFor('Am7').some(c=>c.libraryRoot==='A'&&c.quality==='minor7'));
assert(searchFor('CM7').some(c=>c.libraryRoot==='C'&&c.quality==='major7'));
assert(searchFor('minor ninth').every(c=>c.quality==='minor9'));
assert(searchFor('F♯maj7').some(c=>c.libraryRoot==='F#'&&c.quality==='major7'));
assert(searchFor('Gbmaj7').some(c=>c.libraryRoot==='F#'&&c.quality==='major7'),'enharmonic search');
assert(searchFor('sus4').every(c=>['sus4','7sus4'].includes(c.quality)));
assert(searchFor('♭VII').some(c=>c.libraryRoot==='Bb'));
assert(searchFor('C').every(c=>c.libraryRoot==='C'),'single root query');
assert.equal(searchFor('nonsense-not-a-chord').length,0);
run("libraryState={query:'',root:'C',group:'Added notes & extensions',inKey:true,limit:24}");assert(plain(run('searchLibrary()')).every(c=>['add9','six-nine','major9'].includes(c.quality)));
run("libraryState={query:'',root:'all',group:'all',inKey:true,limit:24}");assert(plain(run('searchLibrary()')).every(c=>run(`chordInKey(${JSON.stringify(c)})`)));
run("libraryState.inKey=false;renderLibrary()");assert.equal(elements.get('library-more').hidden,false);
elements.get('chord-search').listeners.input({target:{value:'Cmaj9'}});assert(elements.get('library-results').innerHTML.includes('Cmaj9'));
elements.get('reset-search').listeners.click();assert.equal(run('libraryState.query'),'');
run("addChord('library:A:minor9')");assert.equal(run('progression.items[0].quality'),'minor9');assert.equal(run('numeral(progression.items[0],\'roman\')'),'vi9');
run("changeChordType(0,'minor-major7')");assert.equal(run('numeral(progression.items[0],\'roman\')'),'vi(maj7)');
run("addChord('secondary-2');changeChordType(1,'sus4')");assert.equal(run('progression.items[1].target'),undefined,'no stale applied-dominant label after changing type');
// Every insertion boundary, forward/backward/no-op, retains unique cards and beat values.
for(let from=0;from<4;from++)for(let boundary=0;boundary<=4;boundary++){
 run("useStarter('pop');progression.items.forEach((c,i)=>{c.beats=i+1})");
 const before=plain(run('progression.items')),expectedOrder=before.slice(),to=boundary>from?boundary-1:boundary;
 expectedOrder.splice(to,0,expectedOrder.splice(from,1)[0]);
 run(`applyDrop({kind:'move',index:${from}},${boundary})`);
 assert.deepEqual(plain(run('progression.items')),expectedOrder,`drop ${from} to ${boundary}`);
}
run("progression.items=[];applyDrop({kind:'add',id:'library:C:major9'},0)");assert.equal(run('progression.items[0].quality'),'major9');
run("applyDrop({kind:'add',id:'library:F:sus4'},0)");assert.equal(run('chordName(progression.items[0])'),'Fsus4');
const dragBefore=run('JSON.stringify(progression)');assert.equal(run("applyDrop({kind:'move',index:99},0)"),false);assert.equal(run("applyDrop({kind:'add',id:'bad'},0)"),false);assert.equal(run('JSON.stringify(progression)'),dragBefore);
// The pointer adapter supplies movement; native drag is deliberately canceled.
run("progression.items=[];addChord('library:C:minor7')");
let nativeCanceled=false;elements.get('arranger').listeners.dragstart({target:{closest:()=>({})},preventDefault(){nativeCanceled=true;}});assert(nativeCanceled);
run("applyDrop({kind:'copy',index:0},1)");assert.equal(run('progression.items.length'),2);assert.notEqual(run('progression.items[0].uid'),run('progression.items[1].uid'));
run("saveWorkspace();progression.items=[];restoreWorkspace()");assert.equal(run('progression.items[0].quality'),'minor7','expanded chord survives restore');
console.log('PASS: 408 library choices, spelling in 17 keys, symbol/type/Roman/enharmonic search, filters, expanded numeral quality, all drop boundaries and drag event wiring. Live drag and visual appearance not checked at user request.');
run("preferences.notations={scales:'numbers',chords:'numbers',progressions:'roman'};configure('C','major')");
assert.equal(run("degreeLabel('3')"),'3');
run("setAppNotation('roman','scales')");assert.equal(run("degreeLabel('3')"),'III');
assert.equal(run('preferences.notations.chords'),'numbers');
run("configureChord('C','minor')");assert.equal(run("degreeLabel('b3')"),'♭3');
run("showPage(true);renderArranger()");assert.equal(run("numeral({degree:'2',quality:'minor'})"),'ii');
run("setAppNotation('numbers','progressions')");assert.equal(run('arrangerVisible'),true);assert.equal(run("numeral({degree:'2',quality:'minor'})"),'2m');
assert.equal(run('preferences.notations.scales'),'roman');assert.equal(run('preferences.notations.chords'),'numbers');
run("setAppNotation('roman','chords')");assert.equal(run('arrangerVisible'),true,'setting another tab should not navigate');
run("configureChord('C','minor')");assert.equal(run("degreeLabel('b3')"),'♭III');
run("configure('C','major')");assert.equal(run("degreeLabel('3')"),'III');
const tabSettings=run('JSON.stringify(preferences.notations)');run("saveWorkspace();preferences.notations={scales:'numbers',chords:'numbers',progressions:'roman'};restoreWorkspace()");assert.equal(run('JSON.stringify(preferences.notations)'),tabSettings);
const immutable=run('JSON.stringify(preferences)');run("setAppNotation('bad','chords');setAppNotation('numbers','bogus')");assert.equal(run('JSON.stringify(preferences)'),immutable);
// Legacy settings preserve the user's progression and theme, while adopting the requested new defaults.
savedData.set('guitar-companion-v12',JSON.stringify({preferences:{notation:'roman',theme:'forest'},progression:{root:'G',mode:'major',size:'triads',items:[]}}));
run("preferences.notations={scales:'numbers',chords:'numbers',progressions:'roman'};restoreWorkspace()");assert.deepEqual(plain(run('preferences.notations')),{scales:'numbers',chords:'numbers',progressions:'roman'});assert.equal(run('preferences.theme'),'forest');assert.equal(run('progression.root'),'G');
console.log('PASS: independent tab defaults, active-tab rendering, native menu setters, cross-tab isolation, persistence and migration from v1.2.');
assert(searchFor('B7').every(c=>c.libraryRoot==='B'&&c.quality==='dominant7'),'B7 must not match Bb7');
assert(searchFor('Cmaj7').every(c=>c.quality==='major7'&&pc(c.libraryRoot)===0),'exact symbols exclude other chord types');
// Every extended in-key palette is verified against independent pitch-class recipes.
for(const root of roots)for(const mode of ['major','minor'])for(const size of plain(run('Object.keys(PALETTE_MODES)'))){
 run(`progression={root:${JSON.stringify(root)},mode:'${mode}',size:'${size}',items:[]}`);
 const keyPcs=mode==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10];
 const choices=plain(run('colorPalette()'));assert.equal(choices.length,7);
 for(const c of choices)for(const n of chordExpected[c.quality])assert(keyPcs.includes((run(`degreePitch('${c.degree}')`)+n)%12),mode+' '+size+' '+c.degree+' '+c.quality);
 assert.deepEqual(plain(run('colorPalette()')),choices,'random palette stays stable across renders');
 for(const idea of plain(run('STARTERS.map(t=>t.id)'))){run(`useStarter('${idea}')`);const items=plain(run('progression.items'));assert(items.length>=3);assert(items.every(c=>chordExpected[c.quality]&&Number.isFinite(run(`degreePitch('${c.degree}')`))&&c.beats===4));assert.equal(new Set(items.map(c=>c.uid)).size,items.length);}
}
const findMap=(query,mode='scales')=>plain(run(`mapSearch(${JSON.stringify(query)},'${mode}','C')`));
for(const [query,id] of [['dorain','dorian'],['mixolydan','mixolydian'],['pentatnoic','major-pentatonic'],['harmnoic minor','harmonic-minor']])assert(findMap(query).some(r=>r.id===id),query);
assert.equal(findMap('D dorain')[0].root,'D');assert.equal(findMap('D dorain')[0].id,'dorian');
assert.equal(findMap('A minro','chords')[0].id,'minor');assert.equal(findMap('A minro','chords')[0].root,'A');
assert.deepEqual(findMap('CM7','chords').map(r=>[r.root,r.id]),[['C','major7']]);
assert.deepEqual(findMap('Am7','chords').map(r=>[r.root,r.id]),[['A','minor7']]);
assert.equal(findMap('ninth','chords').length>=3,true);assert(findMap('suspnded','chords').some(r=>r.id==='sus2'));assert.equal(findMap('zzzzzzzzzz').length,0);
run("configure('C','major');mapQueries.scales='D dorain';renderMapSearch();chooseMapResult(0)");assert.equal(run('state.scale'),'dorian');assert.equal(run('state.root'),'D');
run("configureChord('C','major');mapQueries.chords='A minro';renderMapSearch();chooseMapResult(0)");assert.equal(run('state.chord'),'minor');assert.equal(run('state.root'),'A');
run("progression.size='random';preferences.uiSound=false;saveWorkspace();progression.size='triads';preferences.uiSound=true;restoreWorkspace()");assert.equal(run('progression.size'),'random');assert.equal(run('preferences.uiSound'),false);
console.log('PASS: all nine palette styles in 34 keys, 20 ideas in every key/style, stable random choices, typo/transposition search, exact symbols, selection and preference persistence.');

// Check diagrams independently from the renderer against the chord pitch recipes.
let shapeCount=0;
for(const root of roots)for(const quality of Object.keys(chordExpected)){
 const shapes=plain(run(`chordShapes(${JSON.stringify(root)},'${quality}')`));assert(shapes.length>=2,root+' '+quality+' should offer alternatives');
 for(const shape of shapes){
  const tones=shape.frets.flatMap((f,i)=>f===null?[]:[([40,45,50,55,59,64][i]+f-pc(root)+120)%12]);
  assert(tones.every(n=>chordExpected[quality].includes(n)),root+' '+quality+' contains only chord tones');assert(tones.includes(0),'shape includes root');
  const required=shape.category==='shell'?[0,chordExpected[quality].includes(4)?4:3,chordExpected[quality].includes(11)?11:10]:chordExpected[quality].filter(n=>quality==='minor11'?![7,2].includes(n):quality==='dominant13'?![7,2,5].includes(n):quality==='dominant11'?![4,7].includes(n):chordExpected[quality].length>=4?n!==7:true);
  assert(required.every(n=>tones.includes(n)),root+' '+quality+' retains its defining tones');
  if(shape.category==='open')assert(shape.frets.includes(0));else if(shape.category!=='shell')assert(!shape.frets.includes(0));if(shape.category==='shell')assert.equal(tones.length,3);
  assert(shape.frets.every(f=>f===null||Number.isInteger(f)&&f>=0&&f<=15));shapeCount++;
 }
}
assert(plain(run("chordShapes('C','major')")).some(s=>JSON.stringify(s.frets)==='[null,3,2,0,1,0]'));
assert(plain(run("chordShapes('F','major')")).some(s=>JSON.stringify(s.frets)==='[1,3,3,2,1,1]'));
assert(plain(run("chordShapes('A','minor')")).some(s=>JSON.stringify(s.frets)==='[null,0,2,2,1,0]'));
run("configureChord('C','major');shapeFilter='open';renderChordShapes()");assert(elements.get('shape-list').innerHTML.includes('Open chord'));assert(!elements.get('shape-list').innerHTML.includes('Barre chord'));run("shapeFilter='all'");
assert.equal((html.match(/id="synth-loop"/g)||[]).length,1);assert(html.indexOf('id="synth-loop"')<html.indexOf('id="sequence"'));assert(!html.includes('<span class="drag-handle"'));
console.log(`PASS: ${shapeCount} chord diagrams in 17 root spellings, root coverage, defining tones, omissions, categories, familiar C/F/Am shapes, and Loop placement.`);
run("configureChord('C','major');setChordView('shapes')");assert.equal(elements.get('full-fretboard').hidden,true);assert.equal(elements.get('chord-shapes').hidden,false);assert.equal(elements.get('map-degree-control').hidden,true);
run("setChordView('fretboard')");assert.equal(elements.get('full-fretboard').hidden,false);assert.equal(elements.get('chord-shapes').hidden,true);run("saveWorkspace();preferences.chordView='shapes';restoreWorkspace()");assert.equal(run('preferences.chordView'),'fretboard');run("configure('C','major')");assert.equal(elements.get('chord-view-controls').hidden,true);assert.equal(elements.get('full-fretboard').hidden,false);
run("configureChord('C','dominant7');setChordView('shapes');shapeFilter='shell';renderChordShapes()");assert(elements.get('shape-list').innerHTML.includes('Jazz shell'));assert(elements.get('shape-list').innerHTML.includes('Omits 5'));run("shapeFilter='all'");
// Empty shape filters never appear, and a stale selected category falls back.
for(const root of roots)for(const quality of Object.keys(chordExpected)){
 run(`state.mode='chords';state.root=${JSON.stringify(root)};state.chord='${quality}';shapeFilter='open';renderChordShapes()`);
 const categories=new Set(plain(run('displayedShapes.map(s=>s.category)')));
 const shown=[...elements.get('shape-filters').innerHTML.matchAll(/data-shape-filter="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(shown,['all','open','barre','movable','shell'].filter(id=>id==='all'||categories.has(id)));
 assert.equal(run('shapeFilter'),categories.has('open')?'open':'all');
 assert(elements.get('shape-list').innerHTML.includes('shape-card'));
}
run("configureChord('D','minor-add9');shapeFilter='open';renderChordShapes()");assert.equal(run('shapeFilter'),'all');assert(!elements.get('shape-filters').innerHTML.includes('data-shape-filter="open"'));
// MIDI decoder does not share any encoding logic with the app.
function decodeMidi(bytes){
 const b=Buffer.from(bytes);assert.equal(b.toString('ascii',0,4),'MThd');assert.equal(b.readUInt32BE(4),6);assert.equal(b.readUInt16BE(8),0);assert.equal(b.readUInt16BE(10),1);const ppq=b.readUInt16BE(12);assert.equal(ppq,480);assert.equal(b.toString('ascii',14,18),'MTrk');assert.equal(b.readUInt32BE(18),b.length-22);
 let pos=22,tick=0,tempo=0,endTick=0;const on=new Map(),notes=[];
 const vlq=()=>{let v=0,n=0,byte;do{assert(++n<=4);byte=b[pos++];v=(v<<7)|(byte&127);}while(byte&128);return v;};
 while(pos<b.length){tick+=vlq();const status=b[pos++];if(status===255){const type=b[pos++],length=vlq();if(type===81)tempo=(b[pos]<<16)|(b[pos+1]<<8)|b[pos+2];if(type===47){assert.equal(length,0);endTick=tick;}pos+=length;continue;}const midi=b[pos++],velocity=b[pos++];assert(midi<=127&&velocity<=127);if(status===144){assert(velocity>0);assert(!on.has(midi),'no overlapping same-pitch MIDI notes');on.set(midi,{midi,velocity,start:tick});}else{assert.equal(status,128);assert(on.has(midi),'every note-off has a note-on');const n=on.get(midi);assert(tick>n.start);notes.push({...n,end:tick});on.delete(midi);}}
 assert.equal(on.size,0,'no stuck notes');return {tempo,ppq,endTick,notes};
}
run("progression={root:'C',mode:'major',size:'triads',items:[]};useStarter('warm');synthOptions.tempo=120");
for(const style of plain(run('Object.keys(PERFORMANCE_STYLES)')))for(const humanize of [0,100])for(const rate of [1,2,4]){
 run(`synthOptions.style='${style}';synthOptions.humanize=${humanize};synthOptions.rate=${rate};synthOptions.swing=60`);
 const file=plain(run("Array.from(midiBytes('performance'))")),parsed=decodeMidi(file);assert.equal(parsed.tempo,500000);assert.equal(parsed.endTick,16*480);assert(parsed.notes.length>0);
 assert.deepEqual(plain(run("Array.from(midiBytes('performance'))")),file,'performance export is deterministic');
 const intervals=plain(run('progression.items')).map(c=>chordExpected[c.quality].map(n=>(n+run(`degreePitch('${c.degree}')`))%12));
 for(const note of parsed.notes){const index=Math.min(3,Math.floor(note.start/(4*480)));assert(intervals[index].includes(note.midi%12),'MIDI note belongs to its chord');assert(note.end<=(index+1)*4*480);}
}
run("synthOptions.style='fingerpick';synthOptions.humanize=100");const held=decodeMidi(plain(run("Array.from(midiBytes('chords'))")));assert(held.notes.every(n=>n.start%(4*480)===0));
run("progression.root='F#'");const transposed=decodeMidi(plain(run("Array.from(midiBytes('chords'))")));assert.deepEqual(transposed.notes.map(n=>n.midi%12),held.notes.map(n=>(n.midi+6)%12));
for(const quality of Object.keys(chordExpected))for(const style of ['up','down','updown','fingerpick']){run(`progression.root='C';progression.items=[{degree:'1',quality:'${quality}',beats:8,origin:'Test'}];synthOptions.tempo=220;synthOptions.rate=4;synthOptions.humanize=100;synthOptions.swing=60;synthOptions.style='${style}'`);decodeMidi(plain(run("Array.from(midiBytes('performance'))")));}
run("progression.items=[]");assert.throws(()=>run('midiBytes()'));run("synthOptions={tempo:100,preset:'keys',morph:35,volume:35,loop:false,style:'chords',rate:2,humanize:0,swing:0}");
console.log('PASS: six performance styles, three rates, humanization/swing bounds, deterministic MIDI, tempo, transposition, held-chord export and matched note-off events.');

// Silent Web Audio harness: validates the actual synth graph and scheduling without a real audio device.
class AudioParamStub{constructor(value=0){this.value=value;this.events=[];}event(kind,value,time){assert(Number.isFinite(value)&&Number.isFinite(time));assert(time>=0);this.events.push({kind,value,time});this.value=value;return this;}setValueAtTime(v,t){return this.event('set',v,t);}linearRampToValueAtTime(v,t){return this.event('linear',v,t);}exponentialRampToValueAtTime(v,t){assert(v>0);return this.event('exponential',v,t);}setTargetAtTime(v,t,constant){assert(constant>0);return this.event('target',v,t);}cancelScheduledValues(t){this.events=this.events.filter(e=>e.time<t);return this;}}
class AudioNodeStub{constructor(kind,context){this.kind=kind;this.context=context;this.connections=[];this.gain=new AudioParamStub(1);this.frequency=new AudioParamStub(440);this.detune=new AudioParamStub();this.pan=new AudioParamStub();this.Q=new AudioParamStub();for(const key of ['threshold','knee','ratio','attack','release'])this[key]=new AudioParamStub();context.nodes.push(this);}connect(node){assert(node);this.connections.push(node);return node;}disconnect(){this.disconnected=true;}setPeriodicWave(wave){assert(wave.imag[1]>0);this.wave=wave;}start(t){assert(Number.isFinite(t));this.started=t;}stop(t){assert(Number.isFinite(t));this.stopped=t;}}
let audioCreations=0,deferredResume=null;
class AudioContextStub{constructor(){audioCreations++;this.currentTime=0;this.sampleRate=48000;this.state='suspended';this.nodes=[];this.destination={kind:'silent-destination'};}async resume(){if(deferredResume)await deferredResume;this.state='running';}createBuffer(channels,length,rate){const data=new Float32Array(length);return {sampleRate:rate,length,getChannelData:()=>data};}createBufferSource(){return new AudioNodeStub('buffer',this);}createGain(){return new AudioNodeStub('gain',this);}createDynamicsCompressor(){return new AudioNodeStub('compressor',this);}createBiquadFilter(){return new AudioNodeStub('filter',this);}createStereoPanner(){return new AudioNodeStub('pan',this);}createOscillator(){return new AudioNodeStub('osc',this);}createPeriodicWave(real,imag){assert.equal(real.length,imag.length);assert.equal(imag[0],0);assert([...real,...imag].every(Number.isFinite));return {real,imag};}}
let timerID=0;const intervals=new Map(),timeouts=new Map();
ctx.window={AudioContext:AudioContextStub};ctx.setInterval=(fn,ms)=>{assert.equal(ms,25);intervals.set(++timerID,fn);return timerID;};ctx.clearInterval=id=>intervals.delete(id);ctx.setTimeout=(fn,ms)=>{timeouts.set(++timerID,fn);return timerID;};ctx.clearTimeout=id=>timeouts.delete(id);
// No synth context is created by initial rendering, preference changes, or any earlier arranger action.
assert.equal(audioCreations,0);assert.equal(run('synthContext'),null);
for(const preset of ['keys','pad','glass','pluck']){
 for(const mix of [0,25,50,75,100]){const wave=run(`tableHarmonics('${preset}',${mix})`);assert.equal(wave.imag.length,33);assert.equal(wave.imag[0],0);assert.equal(wave.real.reduce((a,b)=>a+b,0),0);assert(wave.imag[1]>.9);assert([...wave.imag].every(Number.isFinite));}
 assert.notDeepEqual([...run(`tableHarmonics('${preset}',0).imag`)],[...run(`tableHarmonics('${preset}',100).imag`)],'morph changes spectrum');
}
for(const root of roots)for(const chord of chords){const mids=plain(run(`synthNotes({degree:'1',quality:'${chord.id}'},${JSON.stringify(root)})`));assert.equal(mids.length,chord.formula.length+1);assert(mids.every(n=>Number.isInteger(n)&&n>=36&&n<=80));assert.deepEqual(mids.slice(1).map(n=>(n-pc(root)+12)%12),chordExpected[chord.id]);}
assert.deepEqual(plain(run("synthNotes({degree:'1',quality:'major9'},'C')")),[36,48,52,55,59,62]);assert.equal(run('midiFrequency(69)'),440);
assert.deepEqual(plain(run("playbackPlan([{beats:1},{beats:2},{beats:3}],120).map(e=>[e.offset,e.duration])")),[[0,.5],[.5,1],[1.5,1.5]]);
(async()=>{
 run("progression={root:'C',mode:'major',size:'triads',items:[]};useStarter('cadence');synthOptions.tempo=120");
 await run('playProgression()');assert.equal(audioCreations,1);assert.equal(run('synthPending'),false);assert.equal(intervals.size,1);
 const ac=run('synthContext');let oscillators=ac.nodes.filter(n=>n.kind==='osc');assert.equal(oscillators.length,10);assert(oscillators.every(n=>n.started===.08&&n.stopped>.08));assert.equal(run('synthSession.settings.loop'),false);
 // Advance the audio clock and deliver oscillator-end callbacks, without rendering or emitting sound.
 function advance(end){for(let t=ac.currentTime+.05;t<=end+.00001;t+=.05){ac.currentTime=t;for(const n of ac.nodes)if(n.kind==='osc'&&!n.ended&&n.stopped<=t){n.ended=true;n.onended?.();}run('tickSynth()');}}
 advance(6.5);assert.equal(run('synthSession'),null);assert.equal(intervals.size,0);assert(elements.get('playback-status').textContent.startsWith('Finished'));
 oscillators=ac.nodes.filter(n=>n.kind==='osc');assert.equal(oscillators.length,30,'all 3 chords include their low root');
 const startTimes=[...new Set(oscillators.map(o=>o.started))];assert.deepEqual(startTimes.map(n=>Math.round(n*100)/100),[.08,2.08,4.08]);
 run("synthOptions.loop=true");await run('playProgression()');advance(ac.currentTime+7);assert(run('synthSession')!==null,'loop remains active');
 const running=run('synthSession');run("setSynthOption('volume',0)");assert.equal(run('synthSession'),running,'volume does not restart playback');assert.equal(run('synthMaster.gain.value'),0);
 const stopAt=ac.currentTime;run('stopPlayback()');assert.equal(run('synthSession'),null);assert.equal(intervals.size,0);assert(running.bus.gain.events.some(e=>e.kind==='linear'&&e.value===0&&Math.abs(e.time-stopAt-.025)<.00001));
 run("synthOptions.loop=false;synthOptions.volume=35");await run('playProgression(1)');assert.equal(run('synthSession.plan[0].index'),1);assert(run('synthSession.plan[0].duration')<=2);run("changeChordType(0,'minor9')");assert.equal(run('synthSession'),null,'editing cancels preview');
 await run('playProgression()');run("setSynthOption('preset','glass')");assert(run('synthSession'),'sound changes preserve playback');assert.equal(run('synthSession.settings.preset'),'glass');run('stopPlayback()');
 const oldTempo=run('synthOptions.tempo');run("setSynthOption('tempo',0);setSynthOption('tempo',Infinity)");assert.equal(run('synthOptions.tempo'),oldTempo);
 run("setSynthOption('morph',73);saveWorkspace();synthOptions.morph=0;restoreWorkspace()");assert.equal(run('synthOptions.morph'),73);
  // Keep a stable playback session through all supported changes.
 run("stopPlayback();useStarter('pop');synthOptions.loop=false;synthOptions.tempo=120");await run('playProgression()');advance(ac.currentTime+.3);
 const live=run('synthSession'),anchor=run('synthSession.queue[0].uid');
 for(const [key,value] of [['morph',81],['preset','pad'],['volume',22],['tempo',150],['loop',true]]){run(`setSynthOption('${key}',${JSON.stringify(value)})`);assert.equal(run('synthSession'),live,key+' keeps session');}
 assert.equal(run('synthSession.settings.tempo'),150);assert(run('synthSession.voices.size')>0);
 assert([...run('synthSession.voices')].every(o=>Math.abs(o.wave.imag[3]-run("tableHarmonics('pad',81).imag[3]"))<.00001));
 run("addChord('library:D:minor9',1)");assert.equal(run('synthSession'),live);assert.equal(run('synthSession.plan[synthSession.nextIndex].chord.quality'),'minor9');
 run("editSlot('remove',0)");assert.equal(run('synthSession'),live);assert.equal(run('synthSession.plan[synthSession.nextIndex].chord.quality'),'minor9');assert.equal(run('synthSession.marked'),-1,'removed current chord is not highlighted as a different tile');
 advance(ac.currentTime+2);assert(run('synthSession'));assert.equal(run('synthSession.marked'),0);
 run("applyDrop({kind:'copy',index:0},1)");assert.equal(run('synthSession'),live);assert.notEqual(run('progression.items[0].uid'),run('progression.items[1].uid'));assert.equal(run('synthSession.plan[synthSession.nextIndex].chord.uid'),run('progression.items[1].uid'));
 run("moveChord(3,1)");assert.equal(run('synthSession'),live);assert.equal(run('synthSession.plan[synthSession.nextIndex].chord.uid'),run('progression.items[1].uid'));
 run("changeProgression(()=>progression.root='D')");assert.equal(run('synthSession.keyRoot'),'D');assert.equal(run('synthSession'),live);
 run("configureChord('Eb','minor9')");assert.equal(run('synthSession'),live,'map exploration does not interrupt');
 run("setSynthOption('loop',false)");assert.equal(run('synthSession'),live);run('changeProgression(()=>progression.items=[])');assert.equal(run('synthSession'),null,'empty list stops gracefully');
 // Editing just inside the scheduling lookahead cancels an obsolete future chord.
 run("progression.root='C';synthOptions.tempo=120;useStarter('pop')");await run('playProgression()');const firstStart=run('synthSession.queue[0].start');advance(firstStart+1.9);
 const future=run('synthSession.queue.find(e=>e.start>synthContext.currentTime)');assert(future,'next event is already scheduled');
 run("editSlot('remove',1)");assert(future.group.disconnected);assert([...future.oscillators].every(o=>o.stopped===ac.currentTime));assert(!run('synthSession.queue').includes(future));
 assert(run('synthSession'),'editing in the lookahead keeps playback running');
 advance(firstStart+2.2);assert.equal(run('synthSession.marked'),1);assert.equal(run('synthSession.markedEvent.chord.degree'),'6');run('stopPlayback()');
 // Appending during the final chord extends a non-looping run; loop can be enabled then disabled live.
 run("progression.items=[];addChord('library:C:major7');synthOptions.loop=false");await run('playProgression()');advance(ac.currentTime+.2);const lastSession=run('synthSession');assert.equal(run('synthSession.finishedScheduling'),true);
 run("addChord('library:G:dominant7')");assert.equal(run('synthSession'),lastSession);assert.equal(run('synthSession.finishedScheduling'),false);assert.equal(run('synthSession.nextIndex'),1);
 run("setSynthOption('loop',true)");advance(ac.currentTime+5);assert.equal(run('synthSession'),lastSession);run("setSynthOption('loop',false)");advance(ac.currentTime+5);assert.equal(run('synthSession'),null);
 // All changes while the audio device is resuming are reflected in the initial plan.
 let unlock;deferredResume=new Promise(r=>unlock=r);ac.state='suspended';const pendingEdit=run('playProgression()');run("addChord('library:F:major9');setSynthOption('preset','glass')");unlock();await pendingEdit;deferredResume=null;assert.equal(run('synthSession.plan.length'),3);assert.equal(run('synthSession.settings.preset'),'glass');run('stopPlayback()');
 console.log('PASS: live synth controls, add/remove/reorder/copy/transpose, current-card removal, future-event cancellation, append at end, loop changes, pending-resume edits, and graceful empty-list stop.');

  // Performance controls are live without restarting; new patterns apply at the next chord.
 run("stopPlayback();useStarter('pop');synthOptions.tempo=120;synthOptions.style='chords';synthOptions.humanize=0;synthOptions.swing=0");await run('playProgression()');advance(ac.currentTime+.3);const perfSession=run('synthSession');
 for(const [key,value] of [['style','fingerpick'],['humanize',70],['rate',4],['swing',40]]){run(`setSynthOption('${key}',${JSON.stringify(value)})`);assert.equal(run('synthSession'),perfSession);}
 advance(ac.currentTime+2.1);const performing=run('synthSession.queue').at(-1);assert(performing.oscillators.size>10);assert([...performing.oscillators].every(o=>Number.isFinite(o.started)&&o.stopped>o.started));
 run('stopPlayback()');const beforeFeedback=ac.nodes.length;run("preferences.uiSound=true;feedbackAt=0;pluckFeedback({degree:'1',quality:'major'},false)");assert(ac.nodes.length>beforeFeedback,'warm drag feedback schedules synchronously');const feedback=ac.nodes.at(-2);assert.equal(feedback.kind,'buffer');assert.equal(feedback.started,ac.currentTime);assert.equal(ac.nodes.at(-1).gain.value,.17);const wood=Array.from(feedback.buffer.getChannelData(0));assert(wood.every(Number.isFinite));assert(Math.abs(Math.max(...wood.map(Math.abs))-.82)<.00001);assert.equal(Math.abs(wood[0]),0);assert.equal(Math.abs(wood.at(-1)),0);assert(wood.slice(-480).reduce((n,v)=>n+v*v,0)<wood.slice(0,480).reduce((n,v)=>n+v*v,0)*.01);run("feedbackAt=0;pluckFeedback({degree:'b2',quality:'7b9'},true)");assert.equal(ac.nodes.at(-2).buffer,feedback.buffer,'pickup/drop and different chords reuse the identical sound');feedback.onended();assert(feedback.disconnected);assert.equal(run('woodKnockSamples(44100).length'),3969);
 run('preferences.uiSound=false');
 const pose=plain(run('dragLiftPose({x:100,y:80,liftAt:10,releaseX:5,releaseY:0},10)'));assert.equal(pose.x,95);assert.equal(pose.scale,.975);
 const settled=plain(run('dragLiftPose({x:100,y:80,liftAt:10,releaseX:5,releaseY:0},150)'));assert.equal(settled.x,100);assert(Math.abs(settled.scale-1)<1e-9);
 // Space starts/stops, typing and control activation remain intact, Escape stops.
 let blocked=false;const typing={closest:()=>({})},canvas={closest:()=>null};
 run('showPage(true)');ctx.keyboardEvent={code:'Space',key:' ',target:typing,preventDefault(){blocked=true;}};run('appKeyboardShortcut(keyboardEvent)');assert(!blocked);assert.equal(run('synthSession'),null);
 ctx.keyboardEvent={code:'Space',key:' ',target:canvas,preventDefault(){blocked=true;}};run('appKeyboardShortcut(keyboardEvent)');await Promise.resolve();assert(blocked);assert(run('synthSession')||run('synthPending'));run('appKeyboardShortcut(keyboardEvent)');assert.equal(run('synthSession'),null);assert.equal(run('synthPending'),false);
 await run('playProgression()');ctx.keyboardEvent={key:'Escape',target:canvas,preventDefault(){}};run('appKeyboardShortcut(keyboardEvent)');assert.equal(run('synthSession'),null);
 run("setSynthOption('style','down');setSynthOption('humanize',43);setSynthOption('rate',1);setSynthOption('swing',20);saveWorkspace();synthOptions.style='chords';synthOptions.humanize=0;restoreWorkspace()");assert.equal(run('synthOptions.style'),'down');assert.equal(run('synthOptions.humanize'),43);
 run("setSynthOption('style','invalid');setSynthOption('rate',3);setSynthOption('humanize',101);setSynthOption('swing',99)");assert.equal(run('synthOptions.style'),'down');assert.equal(run('synthOptions.rate'),1);assert.equal(run('synthOptions.humanize'),43);assert.equal(run('synthOptions.swing'),20);
 run("synthOptions.style='chords';synthOptions.humanize=0;synthOptions.rate=2;synthOptions.swing=0");
 console.log('PASS: live performance settings, immediate stronger drag cue, Space/Escape with typing protection, settings persistence and validation.');

// Cancel while resume() is pending: a delayed audio permission/resume must not resurrect playback.
 let release;deferredResume=new Promise(r=>release=r);ac.state='suspended';const pending=run('playProgression()');run('stopPlayback()');release();await pending;assert.equal(run('synthSession'),null);deferredResume=null;
 if(process.env.FRETBOARD_TEST_HTML){
  run("progression={root:'C',mode:'major',size:'triads',items:[]};preferences.notations.progressions='roman';synthOptions.loop=false");
  function contextChords(spec){run('progression.items='+JSON.stringify(spec.map(([degree,quality])=>({degree,quality,beats:4,origin:'Edited chord'}))));return plain(run('progression.items.map((c,i)=>analyzeChord(c,i))'));}
  assert.equal(contextChords([['5','major']])[0].label,'In key');
  assert.equal(contextChords([['b2','dominant7'],['1','major7']])[0].label,'Tritone substitution');
  assert.equal(contextChords([['6','dominant7'],['2','minor']])[0].analysis,'V7/ii');
  assert.equal(contextChords([['#4','minor7'],['7','dominant7'],['3','major']])[0].label,'ii of III');
  assert.equal(contextChords([['#4','minor7'],['7','dominant7'],['3','major']])[0].analysis,'ii7/III');
  assert.equal(contextChords([['4','minor'],['1','major']])[0].label,'Parallel minor');
  assert.equal(contextChords([['7','diminished7'],['1','major']])[0].label,'Leading tone → home');
  assert(contextChords([['2','dominant7'],['3','minor']])[0].label.startsWith('Possible'));
  assert(!contextChords([['b2','major'],['1','major']])[0].label.includes('tritone'),'major triad alone is not a tritone substitute');
  contextChords([['1','major'],['b2','dominant7']]);assert.equal(run('sequenceAnalysis(1).label'),'Possible tritone sub');
  run('synthOptions.loop=true');assert.equal(run('sequenceAnalysis(1).label'),'Tritone substitution');run('synthOptions.loop=false');
  run("progression.mode='minor'");assert.equal(contextChords([['2','half-diminished'],['5','dominant7'],['1','minor']])[0].label,'Predominant · ii–V');
  run("progression.root='D';progression.mode='major'");assert.equal(contextChords([['b2','dominant7'],['1','major']])[0].label,'Tritone substitution');
  run("renderArranger()");assert(!elements.get('sequence').innerHTML.includes('Edited chord'),'old provenance is never the displayed analysis');
  assert(run('exportProgression()').includes('Tritone substitution'));
  // An uninserted library chord can be auditioned even with an empty progression.
  run("progression.root='C';progression.items=[]");const beforePreview=run('JSON.stringify(progression)');await run("previewArrangerChord(findArrangerChord('library:C:major9'))");assert.equal(run('synthSession.plan[0].index'),-1);assert(Number.isFinite(run('synthSession.plan[0].duration')));ac.currentTime+=.10;run('tickSynth()');assert(elements.get('playback-status').textContent.includes('Cmaj9'));assert.equal(run('JSON.stringify(progression)'),beforePreview);run('stopPlayback()');
  // Verify modifier-click routing rather than adding or editing the chord.
  run('var originalPreview=previewArrangerChord;var previewRequest=null;previewArrangerChord=c=>{previewRequest=c;}');
  const choice={dataset:{add:'library:A:minor7'},closest:()=>choice};let prevented=false;elements.get('library-results').listeners.click({target:choice,metaKey:true,preventDefault(){prevented=true;}});assert(prevented);assert.equal(run('previewRequest.quality'),'minor7');assert.equal(run('progression.items.length'),0);run('previewArrangerChord=originalPreview');
  elements.get('library-results').listeners.click({target:choice,metaKey:false});assert.equal(run('progression.items.length'),1);
  run("showDiscovery('search')");assert.equal(elements.get('chord-palettes').hidden,true);assert.equal(elements.get('library-content').hidden,false);
  run("showDiscovery('suggested')");assert.equal(elements.get('chord-palettes').hidden,false);assert.equal(elements.get('library-content').hidden,true);
  console.log('PASS: context-aware dominant/tritone/applied-ii/borrowing analysis, loop boundaries, transposition, export labels, command-click preview without insertion, and studio panes.');
 }
 ac.state='suspended';ac.resume=async()=>{throw new Error('test unavailable')};await run('playProgression()');assert.equal(run('synthSession'),null);assert(elements.get('playback-status').textContent.includes('Could not start audio'));
 console.log('PASS: silent synth graph, 408 chord voicings, spectral morphing, beat timing, voice cleanup, loop, preview, volume, stop/edit cancellation, async resume cancellation and audio-error handling. No speakers or screen used.');
 fs.writeFileSync(__dirname+'/synth-checks.json',JSON.stringify({version:'1.6',audioDeviceUsed:false,screenUsed:false,presets:4,chordVoicings:408,checks:['harmonic wave tables','morph spectra','pitches','scheduling','loop','preview','voice teardown','fade on stop','live volume','persistence','pending-resume cancellation','error recovery'],limitation:'Web Audio graph tested with a silent API harness; no live browser/audio audition.'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
