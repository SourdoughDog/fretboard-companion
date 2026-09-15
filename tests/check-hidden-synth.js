(()=>{
 /* SOUND_FIXTURE */
 const assert=(v,m)=>{if(!v)throw Error(m)};
 const presets=Object.entries(SYNTH_PRESETS).map(([id,p])=>({id,name:p.name,family:p.family,description:p.description}));
 const state={theme:'classic',options:{...synthOptions},presets,modified:false,playing:false,pending:false,canPlay:true,status:'Ready when you are.',wave:'0,35 320,35'};
 receiveSynthState(state);
 assert(!$('panel-sound').hidden&&$('panel-performance').hidden,'Sound opens first');
 $('tab-performance').click();assert($('panel-sound').hidden&&!$('panel-performance').hidden,'Performance tab');receiveSynthState(state);assert(!$('panel-performance').hidden,'State update preserves tab');
 $('tab-performance').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));assert(document.activeElement===$('tab-sound')&&!$('panel-sound').hidden,'Tab keyboard navigation');
 assert($('synth-preset').options.length===12,'12 preset choices');assert($('synth-preset').querySelectorAll('optgroup').length===4,'Grouped bank');
 for(const p of presets){state.options={...state.options,...SYNTH_PRESETS[p.id],preset:p.id};receiveSynthState(state);assert($('synth-preset').value===p.id,'Selected '+p.id);assert($('preset-description').textContent===p.description,'Description '+p.id);}
 // Playback publishes state while the native preset selector retains focus.
 state.options={...state.options,...SYNTH_PRESETS.keys,preset:'keys'};receiveSynthState(state);$('synth-preset').focus();
 assert(document.activeElement===$('synth-preset'),'Preset has focus for regression');
 for(const id of ['glass','pad','brass','keys']){state.playing=true;state.options={...state.options,...SYNTH_PRESETS[id],preset:id};receiveSynthState(state);assert($('synth-preset').value===id,'Focused preset follows playing sound '+id);assert($('synth-preset').selectedOptions[0].textContent===SYNTH_PRESETS[id].name,'Preset caption matches sound '+id);}
 const optionNode=$('synth-preset').options[0];receiveSynthState({...state,status:'Playing next chord'});assert($('synth-preset').options[0]===optionNode,'Playback leaves preset option nodes intact');
 $('synth-preset').blur();state.playing=false;
 for(const key of soundKeys){const control=$('synth-'+key);control.value=key==='cutoff'?50:(Number(control.min)+Number(control.max))/2;control.dispatchEvent(new Event('input',{bubbles:true}));const m=window.__messages.at(-1);assert(m.action==='set'&&m.key===key&&Number.isFinite(m.value),'Bridge '+key);assert(control.labels.length===1,'Label '+key);assert(control.getAttribute('aria-valuetext'),'Accessible value '+key);}
 assert(Math.abs(cutoffFromSlider(cutoffToSlider(4200))-4200)<=1,'Log cutoff roundtrip');
 state.modified=true;receiveSynthState(state);$('reset-sound').click();assert(window.__messages.at(-1).key==='preset','Reset bridge');state.modified=false;receiveSynthState(state);assert($('reset-sound').disabled,'Default reset disabled');
 $('synth-preset').value='glass';$('synth-preset').dispatchEvent(new Event('change'));assert(window.__messages.at(-1).value==='glass','Preset bridge');
 for(const style of ['chords','strum','up','down','updown','fingerpick']){state.options.style=style;receiveSynthState(state);assert($('synth-rate').disabled===['chords','strum'].includes(style),'Pace '+style);}
 state.playing=true;receiveSynthState(state);assert($('synth-play').disabled&&!$('synth-stop').disabled,'Playing transport');$('synth-stop').click();assert(window.__messages.at(-1).action==='stop','Stop bridge');state.playing=false;
 for(const theme of ['classic','classic-coast','classic-harbor','teal','ocean','plum','forest','midnight','retro','pixel','fantasy','orbital','neon','letterpress','blueprint']){
  state.theme=theme;receiveSynthState(state);document.querySelectorAll('.sound-section').forEach(el=>el.open=true);
  for(const tab of ['sound','performance']){
   setSynthTab(tab);
   assert(document.documentElement.scrollWidth<=innerWidth+1,'Overflow '+theme+' '+tab);
   for(const el of document.querySelectorAll('input,select,button')){const r=el.getBoundingClientRect();assert(r.left>=0&&r.right<=innerWidth+1,'Control bounds '+theme+' '+el.id);}
   const workspace=document.querySelector('.sound-workspace'),transport=document.querySelector('.synth-transport'),before=transport.getBoundingClientRect();
   workspace.scrollTop=workspace.scrollHeight;
   const after=transport.getBoundingClientRect();assert(Math.abs(before.top-after.top)<1,'Transport moves while scrolling');assert(after.top>=0&&after.bottom<=innerHeight+1,'Transport clipped '+theme+' '+tab);
   assert($('synth-preset').getBoundingClientRect().top>=0,'Preset clipped');
  }
 }
 state.savedSounds=[{id:'test-sound',name:'My <keys>',favorite:false}];state.activeSoundId='test-sound';state.canUndoLibrary=true;receiveSynthState(state);
 assert($('saved-sound').value==='test-sound','Saved sound selection');$('sound-name').value='Warm night';$('sound-save').click();assert(window.__messages.at(-1).command==='save'&&window.__messages.at(-1).name==='Warm night','Save sound bridge');
 for(const action of ['update','rename','favorite','delete','undo','preview']){$('sound-'+action).click();assert(window.__messages.at(-1).command===action,'Sound command '+action);}
 $('sound-favorites').checked=true;$('sound-favorites').dispatchEvent(new Event('change'));assert($('saved-sound').options.length===1,'Favorites filter');$('sound-favorites').checked=false;$('sound-favorites').dispatchEvent(new Event('change'));
 for(const key of ['attack','decay','sustain','release']){const handle=$('envelope-'+key),before=lastState.options[key];handle.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));assert(window.__messages.at(-1).key===key&&window.__messages.at(-1).value===envelopeRanges[key][0],'Envelope minimum '+key);handle.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));assert(lastState.options[key]===envelopeRanges[key][1],'Envelope maximum '+key);assert(!$('envelope-line').getAttribute('d').includes('NaN'),'Finite envelope');}
 $('envelope-preview').click();assert(window.__messages.at(-1).command==='preview','Envelope audition');
 state.theme='classic';state.options={...state.options,...SYNTH_PRESETS.keys,preset:'keys',style:'chords'};receiveSynthState(state);document.querySelectorAll('.sound-section').forEach(el=>el.open=false);setSynthTab('sound');window.scrollTo(0,0);
 return JSON.stringify({presets:12,themes:15,controls:soundKeys.length,width:innerWidth,checks:'preset bank, units, reset, every sound control bridge, tabs and keyboard, persistent transport, performance, all-theme layout'});
})();
