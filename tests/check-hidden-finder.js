(()=>{
 const assert=(v,m)=>{if(!v)throw Error(m)},checks=[];
 assert(finder.frets.every(f=>f===null),'Finder starts blank');
 let cases=0;
 for(const q of CHORDS)for(let root=0;root<12;root++){
  const pitches=q.offsets.map(n=>48+root+n),matches=identifyVoicing(pitches);
  assert(matches.some(m=>rootPitch(m.root)===root&&m.quality===q.id&&m.kind==='exact'),'Exact formula '+root+' '+q.id);cases++;
  for(const m of matches){const pcs=[...new Set(pitches.map(mod))],tones=CHORDS.find(q=>q.id===m.quality).offsets.map(n=>mod(rootPitch(m.root)+n));if(m.kind==='exact')assert(pcs.length===tones.length&&tones.every(n=>pcs.includes(n)),'False exact match');}
 }
 assert(!identifyVoicing([]).length&&!identifyVoicing([40,52]).length,'Silence/octaves do not invent chords');
 assert(identifyVoicing([48,52,55,60])[0].name==='C','Doubled C major');
 assert(identifyVoicing([40,48,55]).some(m=>m.name==='C/E'&&m.kind==='exact'),'Actual low pitch determines inversion');
 const sixth=identifyVoicing([48,52,55,57]);assert(sixth.some(m=>m.name==='C6')&&sixth.some(m=>m.name==='Am7/C'),'Equivalent names');
 assert(identifyVoicing([48,51,54,57]).filter(m=>m.quality==='diminished7'&&m.kind==='exact').length===4,'Symmetric diminished seventh');
 assert(identifyVoicing([48,52,58]).some(m=>m.name==='C7 (no5)'),'Shell chord');
 assert(!identifyVoicing([48,52,58],false).some(m=>m.kind==='no5'),'Omission toggle');
 assert(identifyVoicing([38,48,52,55]).some(m=>m.name==='C/D'&&m.kind==='bass'),'Separate bass');
 assert(!identifyVoicing([48,49,50]).some(m=>m.kind==='exact'),'Cluster not falsely exact');
 configureChord('C','major');$('view-finder').click();
 assert(!$('chord-finder').hidden&&$('map-controls').hidden&&$('map-info').hidden&&$('full-fretboard').hidden&&$('chord-shapes').hidden,'Finder replaces other panels');
 assert(document.querySelectorAll('[data-finder-index]').length===78,'78 selectable positions');
 assert(!document.querySelector('#finder-board [aria-pressed=true]'),'Blank board');
 for(const i of [0,14,26,41,55])$('finder-board').querySelector(`[data-finder-index="${i}"]`).click();
 assert(JSON.stringify(finder.frets)===JSON.stringify([0,1,0,2,3,null]),'Playable C fingering');
 assert(finder.matches[0].name==='C','C shown');
 const oldPreview=previewArrangerChord;let heard=null;previewArrangerChord=c=>{heard=c;};$('finder-hear').click();assert(JSON.stringify(heard.voicing)===JSON.stringify([48,52,55,60,64]),'Audition exact guitar voicing');
 $('finder-board').querySelector('[data-finder-index="77"]').dispatchEvent(new MouseEvent('click',{bubbles:true,metaKey:true}));assert(finder.frets[5]===null,'Cmd click preserves voicing');previewArrangerChord=oldPreview;
 toggleFinderNote(15);assert(finder.frets[1]===2&&document.querySelectorAll('#finder-board [aria-pressed=true]').length===5,'One note per string');toggleFinderNote(15);assert(finder.frets[1]===null,'Toggle removes');toggleFinderNote(14);
 $('finder-board').querySelector('[data-finder-index="14"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert(document.activeElement.dataset.finderIndex==='15','Arrow navigation');
 $('finder-results').querySelector('[data-finder-explore]').click();assert(preferences.chordView==='shapes'&&state.root==='C'&&!$('chord-shapes').hidden,'Explore result');setChordView('finder');assert(finder.frets[4]===3,'Retains voicing across views');
 for(const theme of ['classic','classic-coast','classic-harbor','teal','ocean','plum','forest','midnight','retro','pixel','fantasy','orbital','neon','letterpress','blueprint']){
  setAppTheme(theme);assert(!$('chord-finder').hidden,'Theme keeps finder');assert(document.documentElement.scrollWidth<=innerWidth+1,'Page overflow '+theme);assert(getComputedStyle($('map-controls')).display==='none','Controls hidden '+theme);
 }
 setAppNotation('roman','chords');assert($('finder-results').textContent.includes('III'),'Roman intervals');
 configure('D','dorian');assert($('chord-finder').hidden&&!$('full-fretboard').hidden&&!$('map-controls').hidden&&!$('map-info').hidden,'Scale view restored');configureChord('C','major');
 setChordView('fretboard');assert(!$('full-fretboard').hidden&&$('chord-finder').hidden,'Fretboard view restored');setChordView('finder');
 $('finder-clear').click();assert(finder.frets.every(f=>f===null)&&!finder.matches.length&&$('finder-hear').disabled,'Clear all');
 setAppTheme('classic');setAppNotation('numbers','chords');for(const i of [0,14,26,41,55])toggleFinderNote(i);window.scrollTo(0,170);
 return JSON.stringify({formulaCases:cases,checks:'Exact names, inversions, symmetry, missing fifth, separate bass, repeated pitches, UI selection, audition pitches, keyboard, views, all themes, clear',audioUsed:false,screenUsed:false});
})();
