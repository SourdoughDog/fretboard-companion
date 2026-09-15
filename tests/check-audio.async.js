// Real Web Audio rendering into memory only. AudioContext stays disabled by the native runner.
return await (async()=>{
 const assert=(v,m)=>{if(!v)throw Error(m)},results=[];
 async function render(id,rate=48000,overrides={},live=false){
  const seconds=7,ctx=new OfflineAudioContext(2,rate*seconds,rate);synthContext=ctx;
  const settings={...synthOptions,...SYNTH_PRESETS[id],preset:id,tempo:120,style:'chords',rate:2,humanize:0,swing:0,...overrides,volume:100};synthOptions={...settings};synthMaster=createSynthOutput(ctx);
  const bus=ctx.createGain();bus.connect(ctx.outputBus);
  const session={bus,effects:createSynthEffects(ctx,bus,settings),notes:new Set(),voices:new Set(),voiceInfo:new Map(),settings,keyRoot:'C',queue:[]};synthSession=session;synthOptions={...settings};
  const chord={degree:'1',quality:'dominant13',beats:2,voicing:overrides.voicing||[36,48,52,55,58,62,65,69]};
  if(overrides.metronome){session.practice=true;session.beat=0;practice.metronome=true;}
  if(overrides.stress){for(let i=0;i<8;i++)scheduleSynthChord(session,{chord,index:i,duration:.25},.08+i*.25);}else scheduleSynthChord(session,{chord,index:0,duration:1},.08);
  const suspensions=live?[.02,.35,.38,.41,.7].map(t=>ctx.suspend(t)):[];
  const rendered=ctx.startRendering();
  for(let i=0;i<suspensions.length;i++){await suspensions[i];setSynthOption('morph',i%2?100:0);setSynthOption('preset',['glass','strings','brass','pad','keys'][i]);setSynthOption('cutoff',i%2?150:6200);setSynthOption('resonance',100);setSynthOption('detune',18);setSynthOption('width',100);setSynthOption('vibrato',30);await ctx.resume();}
  const buffer=await rendered;
  let peak=0,power=0,tail=0,step=0,transitionStep=0,side=0,dc=0;
  const left=buffer.getChannelData(0),right=buffer.getChannelData(1);
  for(let i=0;i<left.length;i++){assert(Number.isFinite(left[i])&&Number.isFinite(right[i]),id+' non-finite sample');peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));power+=left[i]**2+right[i]**2;dc+=left[i]+right[i];side+=(left[i]-right[i])**2;if(i>0){const delta=Math.max(Math.abs(left[i]-left[i-1]),Math.abs(right[i]-right[i-1]));step=Math.max(step,delta);if(i/rate>.34&&i/rate<.42)transitionStep=Math.max(transitionStep,delta);}if(i>left.length-rate*.1)tail=Math.max(tail,Math.abs(left[i]),Math.abs(right[i]));}
  const rms=Math.sqrt(power/(left.length*2));assert(peak<.95,id+' excessive output peak '+peak);assert(rms>.0002,id+' unexpectedly silent '+rms);assert(tail<.00001,id+' stuck tail '+tail);assert(Math.abs(dc/(left.length*2))<.001,id+' DC offset');if(live)assert(transitionStep<.08,'live transition discontinuity '+transitionStep);
  assert(session.voices.size===0&&session.notes.size===0,id+' voice cleanup');
  results.push({preset:id,rate,live,peak:+peak.toFixed(4),rms:+rms.toFixed(4),maxStep:+step.toFixed(4),transitionStep:+transitionStep.toFixed(4),tail,stereoRms:+Math.sqrt(side/left.length).toFixed(4)});
  disconnectSynthEffects(session.effects);synthSession=null;
 }
 for(const id of Object.keys(SYNTH_PRESETS))await render(id);
 await render('keys',44100,{},true);
 await render('brass',48000,{morph:100,cutoff:12000,resonance:100,detune:18,vibrato:30,reverb:60,sustain:100,release:3});
 await render('strings',96000,{morph:100,voicing:[96,103,110,117,124,127],release:.3});
 await render('organ',48000,{stress:true,morph:100,cutoff:150,resonance:100,reverb:60,sustain:100,release:3});
 await render('pad',48000,{attack:2,release:3,style:'up',rate:4});
 await render('keys',48000,{metronome:true});
 return JSON.stringify({silentOfflineRendering:true,scenes:results});
})();
