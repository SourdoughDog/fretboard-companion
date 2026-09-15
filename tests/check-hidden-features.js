(()=>{
 const assert=(v,m)=>{if(!v)throw Error(m)};
 const click=id=>$(id).click(),change=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new Event('change',{bubbles:true}));};
 // UI-only checks never request an AudioContext.
 hearEarQuestion=()=>{};
 click('mode-progressions');useStarter('pop');
 assert(['voicing','practice','collection'].every(name=>$(name+'-panel').hidden),'Tools start collapsed');
 const original=JSON.stringify({practice,voicingOptions,synthOptions});click('tool-practice');click('tool-voicing');
 assert($('practice-panel').hidden&&!$('voicing-panel').hidden,'Voicing opens independently');
 assert(!$('practice-panel').contains($('voicing-mode')),'Voicing is outside practice');
 assert(JSON.stringify({practice,voicingOptions,synthOptions})===original,'Opening tools preserves settings');
 $('song-name').value='Keep this draft';click('tool-collection');click('tool-voicing');click('tool-collection');assert($('song-name').value==='Keep this draft','Draft survives panel switching');
 click('close-collection-panel');assert(document.activeElement===$('tool-collection')&&$('collection-panel').hidden,'Done closes and restores focus');
 click('tool-voicing');renderArranger();assert(!$('voicing-panel').hidden,'State update preserves panel');
 change('voicing-mode','smooth');change('voicing-spacing','open');assert(voicingOptions.mode==='smooth'&&voicingOptions.spacing==='open','Voicing controls');
 click('tool-practice');$('practice-enabled').checked=true;$('practice-enabled').dispatchEvent(new Event('change'));change('practice-bars','2');assert(progressionPlan()[0].duration===8*60/synthOptions.tempo,'Practice bars');assert($('synth-loop').checked&&$('synth-loop').disabled,'Practice repeat reflected in transport');
 click('tool-collection');$('song-name').value='My <song>';$('song-collection').value='Warmups';click('song-save');assert(personalLibrary.songs.length===1,'Save progression UI');assert($('song-list').textContent.includes('My <song>')&&!$('song-list').querySelector('song'),'Escaped name');
 const id=personalLibrary.songs[0].id;progression.root='D';$('song-list').querySelector('[data-song-load]').click();assert(progression.root==='C','Load progression UI');click('song-restore');assert(progression.root==='D','Restore workspace UI');
 $('song-search').value='not present';$('song-search').dispatchEvent(new Event('input'));assert(!$('song-list').querySelector('[data-song-load]'),'Search');$('song-search').value='';$('song-search').dispatchEvent(new Event('input'));
 $('song-list').querySelector('[data-song-delete]').click();assert(!personalLibrary.songs.length,'Delete');click('song-undo');assert(personalLibrary.songs.length===1,'Undo');
 click('mode-ear');change('ear-game','interval');change('ear-level','starter');click('ear-next');assert(earQuestion&&!$('ear-replay').disabled,'Start round');const correct=earQuestion.answer.id;$('ear-answers').querySelector(`[data-ear-answer="${correct}"]`).click();assert(!$('ear-explanation').hidden&&$('ear-board').rows.length===7,'Answer/fretboard');assert(personalLibrary.scores['interval-starter'].correct===1,'Score');
 change('ear-game','chord');change('ear-level','extended');click('ear-next');click('ear-reveal');assert(earQuestion.revealed&&$('ear-direction-label').hidden,'Chord reveal');
 for(const theme of ['classic','classic-coast','classic-harbor','teal','ocean','plum','forest','midnight','retro','pixel','fantasy','orbital','neon','letterpress','blueprint']){
  setAppTheme(theme);
  for(const page of ['progressions','ear']){click('mode-'+page);
   for(const tool of page==='progressions'?[null,'voicing','practice','collection']:[null]){setProgressionTool(tool);
    assert(document.documentElement.scrollWidth<=innerWidth+1,'Page overflow '+theme+' '+page+' '+tool);
    const area=$(page==='ear'?'ear-training':'arranger');for(const el of area.querySelectorAll('input,select,button')){if(!el.getClientRects().length)continue;const r=el.getBoundingClientRect();assert(r.left>=-1&&r.right<=innerWidth+1,'Control bounds '+theme+' '+el.id);}
    if(tool){assert($(tool+'-panel').getBoundingClientRect().height<innerHeight*.75,'Panel has bounded height');assert($('tool-'+tool).getAttribute('aria-expanded')==='true','Expanded state');}
   }
  }
 }
 setAppTheme('classic');click('mode-ear');change('ear-game','interval');change('ear-level','starter');click('ear-next');revealEarAnswer(earQuestion.answer.id);window.scrollTo(0,0);
 return JSON.stringify({themes:15,width:innerWidth,checks:'practice controls, voicing, saved progressions, safe names, search, load/restore/delete/undo, ear games, answer fretboard, score and layout',silent:true});
})();
