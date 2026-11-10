/* مغامرة المأمون — طبقة V38 (plus.js)
   تُضاف فوق V37 بدون تكرار ما فيها (المؤثرات والعملات ولافتة الإنجاز موجودة في game-fx.js):
   • المأمون الحي: يتنفس، يتحرك وهو يتكلم، يقفز ويهز رأسه، وفقاعة كلام بعبارات متنوعة.
   • تحدي النطق 🎤: يسجّل صوت الطالب ويقيّمه بالذكاء الاصطناعي (/api/pronunciation)،
     أو بالتعرّف على الكلام في المتصفح إذا كانت الخدمة غير متاحة. إضافي فقط: لا يدخل في الإتقان.
   • موسيقى خلفية هادئة بزر 🎵، تنخفض عندما يتكلم المأمون.
   • كلام المأمون لا يقطع صوت الدرس أبدًا، والاسم يُنطق فقط إذا كان مكتوبًا بالعربية. */
(function(){
'use strict';
const API=()=>window.__maamoon;
const CFG=window.MAAMOON_CONFIG||{};
const $=id=>document.getElementById(id);
const on=(t,f)=>window.addEventListener('maamoon:'+t,e=>{try{f(e.detail||{})}catch(err){console.warn('plus:'+t,err)}});
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick=a=>a[Math.floor(Math.random()*a.length)];
function soundOn(){const a=API();return !(a&&a.settings&&a.settings.sound===false)}
function cur(){const a=API();try{return a&&a.current?a.current():null}catch(e){return null}}
function firstName(){const s=cur();return s&&s.name?String(s.name).trim().split(/\s+/)[0]:''}
function spokenName(){const n=firstName();return /^[ء-يً-ْ]+$/.test(n)?n:''}
function activeScreen(){const x=document.querySelector('.screen.active');return x?x.id:''}
const PREF_KEY='almaamoon_plus_v38';
let prefs={music:false};
try{prefs=Object.assign(prefs,JSON.parse(localStorage.getItem(PREF_KEY)||'{}'))}catch(e){}
function savePrefs(){try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs))}catch(e){}}

/* ================= الصوت: نغمات قصيرة + موسيقى ================= */
let ctx=null,sfxBus=null,musicBus=null;
function ac(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;try{ctx=new A()}catch(e){return null}
  const comp=ctx.createDynamicsCompressor();comp.connect(ctx.destination);sfxBus=ctx.createGain();sfxBus.gain.value=.8;sfxBus.connect(comp);musicBus=ctx.createGain();musicBus.gain.value=0;musicBus.connect(comp)}
 if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx}
['pointerdown','touchend','keydown'].forEach(t=>document.addEventListener(t,()=>{ac();if(prefs.music)musicStart()},{capture:true,passive:true}));
function tone(f,t0,d,o){o=o||{};const c=ctx,osc=c.createOscillator(),g=c.createGain();osc.type=o.type||'sine';osc.frequency.setValueAtTime(f,t0);if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t0+d*.9);
 const v=o.vol||.1,a=o.a||.008;g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+a);g.gain.exponentialRampToValueAtTime(.0001,t0+d);osc.connect(g);g.connect(o.bus||sfxBus);osc.start(t0);osc.stop(t0+d+.05)}
const SFX={star:(t,n)=>{const f=[880,1046.5,1318.5][Math.min(2,n||0)];tone(f,t,.4,{vol:.09});tone(f*2,t,.25,{vol:.03})},
 micOn:t=>{tone(660,t,.12,{vol:.06});tone(990,t+.1,.15,{vol:.06})},micOff:t=>{tone(990,t,.1,{vol:.05});tone(660,t+.09,.14,{vol:.05})},
 pop:t=>tone(600,t,.09,{to:1200,vol:.05})};
function sfx(name,arg){if(!soundOn())return;const c=ac();if(!c||!SFX[name])return;try{SFX[name](c.currentTime+.02,arg)}catch(e){}}
const CHORDS=[[130.81,196,261.63],[110,164.81,220],[87.31,130.81,174.61],[98,146.83,196]],MEL=[523.25,587.33,659.25,783.99,880,1046.5];
let musicTimer=null,nextNote=0,step8=0,musicLevel=-1;
function musicStart(){if(musicTimer||!prefs.music||!soundOn())return;const c=ac();if(!c)return;nextNote=c.currentTime+.1;step8=0;musicTimer=setInterval(musicTick,90)}
function musicStop(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}if(musicBus&&ctx)musicBus.gain.setTargetAtTime(0,ctx.currentTime,.2);musicLevel=-1}
function musicTick(){if(!ctx)return;const e8=60/84/2;
 while(nextNote<ctx.currentTime+.3){const bar=Math.floor(step8/8),ch=CHORDS[Math.floor(bar/2)%4],pos=step8%8;
  if(pos===0&&bar%2===0)ch.forEach((f,i)=>tone(f,nextNote,e8*15.5,{type:'triangle',vol:.05-i*.01,a:.4,bus:musicBus}));
  if(pos===0||pos===4)tone(ch[0],nextNote,e8*1.6,{vol:.06,bus:musicBus});
  if(Math.random()<(pos%2?.22:.45)){const f=pick(MEL);tone(f,nextNote,e8*2.2,{vol:.035,a:.02,bus:musicBus})}
  nextNote+=e8;step8++}
 const target=!prefs.music||!soundOn()||document.hidden?0:talking?.12:.5;
 if(target!==musicLevel){musicLevel=target;musicBus.gain.setTargetAtTime(target,ctx.currentTime,talking?.08:.6)}
 if(!prefs.music||!soundOn())musicStop()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)musicStop();else if(prefs.music)musicStart()});
function musicButtons(){['worldSoundBtn','stageSoundBtn'].forEach(id=>{const s=$(id);if(!s||s.parentNode.querySelector('.plus-music-btn'))return;
  const b=document.createElement('button');b.className='round-btn plus-music-btn';b.type='button';b.setAttribute('aria-label','الموسيقى');
  b.onclick=()=>{prefs.music=!prefs.music;savePrefs();if(prefs.music)musicStart();else musicStop();syncMusicBtns();sfx('pop')};s.parentNode.insertBefore(b,s)});syncMusicBtns()}
function syncMusicBtns(){document.querySelectorAll('.plus-music-btn').forEach(b=>{b.textContent='🎵';b.classList.toggle('off',!prefs.music);b.setAttribute('aria-pressed',String(!!prefs.music));b.title=prefs.music?'إيقاف الموسيقى — Music off':'تشغيل الموسيقى — Music on'})}

/* ================= المأمون الحي ================= */
let talking=false;
function setTalking(v){if(v===talking)return;talking=v;document.body.classList.toggle('plus-talking',v)}
setInterval(()=>{const a=API();let v=false;try{v=a&&a.isSpeaking?a.isSpeaking():('speechSynthesis'in window&&speechSynthesis.speaking)}catch(e){}setTalking(!!v)},180);
function wrapMascots(){
 document.querySelectorAll('img[src*="mascot.webp"]').forEach(img=>{if(img.closest('.plus-mascot,.mamoun-buddy-launcher,.mamoun-buddy-panel,.profile-chip'))return;if(img.closest('.top-hud'))return;
  const w=document.createElement('span');w.className='plus-mascot';const body=document.createElement('span');body.className='plus-mbody';const bub=document.createElement('span');bub.className='plus-bubble';bub.setAttribute('role','status');
  img.parentNode.insertBefore(w,img);body.appendChild(img);w.appendChild(bub);w.appendChild(body)})}
function visibleMascot(){const sc=document.querySelector('.screen.active');return sc?sc.querySelector('.plus-mascot'):null}
function react(kind,el){el=el||visibleMascot();if(!el||reduced())return;const b=el.querySelector('.plus-mbody');if(!b)return;b.classList.remove('m-jump','m-wiggle','m-spin','m-cheer','m-listen');void b.offsetWidth;b.classList.add('m-'+kind);clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('m-'+kind),kind==='listen'?60000:1400)}
function calm(){const el=visibleMascot();const b=el&&el.querySelector('.plus-mbody');if(b)b.classList.remove('m-listen')}
function bubble(text,ms,el){el=el||visibleMascot();const bub=el&&el.querySelector('.plus-bubble');if(!bub)return;bub.textContent=text;bub.classList.remove('show');void bub.offsetWidth;bub.classList.add('show');clearTimeout(bub._t);bub._t=setTimeout(()=>bub.classList.remove('show'),ms||2400)}

/* كلام المأمون: ينتظر حتى يسكت صوت اللعبة، ثم يتكلم بنفس صوت اللعبة (صوت الذكاء الاصطناعي إن وجد) */
let pendingSay=null,quietSince=Date.now();
function sayWhenQuiet(text,maxWait){if(!soundOn()||!text)return;pendingSay={text,until:Date.now()+(maxWait||3500),screen:activeScreen()}}
setInterval(()=>{if(talking){quietSince=Date.now();return}if(!pendingSay)return;if(Date.now()>pendingSay.until||activeScreen()!==pendingSay.screen){pendingSay=null;return}
 if(Date.now()-quietSince<500)return;const t=pendingSay.text;pendingSay=null;const a=API();if(a&&a.speak)a.speak(t,.88)},150);

const GOOD=['أَحْسَنْتَ!','مُمْتَازٌ!','رَائِعٌ!','إِجَابَةٌ صَحِيحَةٌ!','أَنْتَ بَطَلٌ!','عَمَلٌ جَمِيلٌ!','اِسْتَمِرَّ!'];
const TRY=['لَا بَأْسَ! حَاوِلْ مَرَّةً أُخْرَى 💪','نَتَعَلَّمُ مِنَ الخَطَأِ 🌱','اِسْمَعْ جَيِّدًا وَحَاوِلْ 👂','قَرِيبٌ! أَنْتَ تَسْتَطِيعُ 💪'];
const COMBO={3:'ثَلَاثُ إِجَابَاتٍ صَحِيحَةٍ!',5:'خَمْسُ إِجَابَاتٍ صَحِيحَةٍ!',8:'ثَمَانِي إِجَابَاتٍ! أَنْتَ نَجْمٌ!',10:'عَشْرُ إِجَابَاتٍ! مُذْهِلٌ!',15:'خَمْسَ عَشْرَةَ! بَطَلٌ حَقِيقِيٌّ!',20:'عِشْرُونَ إِجَابَةً!'};
let lastGood='';function goodWord(){let w;do{w=pick(GOOD)}while(w===lastGood);lastGood=w;return w}

on('praise',d=>{bubble(d.ar||goodWord(),1800);react('jump')});
on('answer',d=>{
 if(d.ok){react('jump');if(!document.querySelector('.screen.active .plus-bubble.show'))bubble(goodWord(),1600);
  /* سلسلة الإجابات: فقاعة مكتوبة فقط، بدون كلام حتى لا يُقطع صوت السؤال التالي */
  if(d.firstTry&&COMBO[d.combo]){const n=firstName();setTimeout(()=>bubble((n?n+'! ':'')+COMBO[d.combo],2600),150);react('spin')}}
 else{bubble(pick(TRY),2000);react('wiggle')}});
on('mission',d=>{const n=spokenName();
 if(d.pass){react('cheer');setTimeout(()=>{bubble(d.stationDone?'أَكْمَلْتَ المَحَطَّةَ! 🏆':'أَتْقَنْتَ المُهِمَّةَ! ⭐',2800);
   sayWhenQuiet(d.stationDone?`رَائِعٌ${n?' يَا '+n:''}! حَصَلْتَ عَلَى ${d.rewardName||'مِفْتَاحٍ جَدِيدٍ'}.`:`أَحْسَنْتَ${n?' يَا '+n:''}! أَتْقَنْتَ المُهِمَّةَ.`,4500)},600)}
 else{react('wiggle');setTimeout(()=>{bubble('سَنَتَدَرَّبُ مَعًا 🤝',2600);sayWhenQuiet('لَا بَأْسَ، سَنَتَدَرَّبُ مَعًا خُطْوَةً خُطْوَةً.',3500)},400)}});
on('screen',d=>{if(d.id==='worldScreen'||d.id==='stageScreen')musicButtons();stopRec()});

/* ================= تحدي النطق 🎤 ================= */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let aiOk=null;
fetch('/api/ai-status',{cache:'no-store'}).then(r=>r.json()).then(j=>{aiOk=!!(j&&j.ok)}).catch(()=>{aiOk=false});
const canRecord=()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&(window.AudioContext||window.webkitAudioContext));
function sayMode(){if(CFG.pronunciationChallenge===false)return null;if(aiOk&&canRecord())return 'ai';if(SR)return 'browser';return null}
let activeRec=null;
function stopRec(){if(activeRec){try{activeRec.cancel()}catch(e){}activeRec=null}}
on('say',d=>{if(!d.host||!d.text)return;const go=()=>{if(sayMode())addSay(d.host,d.text,d.kind||'word')};if(aiOk===null)setTimeout(go,800);else go()});

/* تسجيل WAV أحادي 16kHz (ما تحتاجه خدمة التقييم) */
async function recordWav(maxMs,onStart){
 const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,channelCount:1}});
 const A=window.AudioContext||window.webkitAudioContext;const rc=new A();if(rc.state==='suspended')await rc.resume();
 const srcN=rc.createMediaStreamSource(stream);const proc=rc.createScriptProcessor(4096,1,1);const chunks=[];let stopped=false,timer;
 proc.onaudioprocess=e=>{if(!stopped)chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))};
 srcN.connect(proc);proc.connect(rc.destination);if(onStart)onStart();
 const cleanup=()=>{stopped=true;clearTimeout(timer);try{proc.disconnect();srcN.disconnect()}catch(e){}stream.getTracks().forEach(t=>t.stop());rc.close().catch(()=>{})};
 let resolveFn,rejectFn;const done=new Promise((res,rej)=>{resolveFn=res;rejectFn=rej});
 const finish=()=>{if(stopped)return;const rate=rc.sampleRate;cleanup();resolveFn(encodeWav(chunks,rate,16000))};
 timer=setTimeout(finish,maxMs);
 return{done,stop:finish,cancel:()=>{if(!stopped){cleanup();rejectFn(new Error('aborted'))}}}}
function encodeWav(chunks,inRate,outRate){let len=0;chunks.forEach(c=>len+=c.length);const all=new Float32Array(len);let o=0;chunks.forEach(c=>{all.set(c,o);o+=c.length});
 const ratio=inRate/outRate,n=Math.floor(all.length/ratio),pcm=new Int16Array(n);
 for(let i=0;i<n;i++){const s=Math.max(-1,Math.min(1,all[Math.floor(i*ratio)]));pcm[i]=s<0?s*0x8000:s*0x7FFF}
 const buf=new ArrayBuffer(44+pcm.length*2),v=new DataView(buf);const w=(p,s)=>{for(let i=0;i<s.length;i++)v.setUint8(p+i,s.charCodeAt(i))};
 w(0,'RIFF');v.setUint32(4,36+pcm.length*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,outRate,true);v.setUint32(28,outRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,pcm.length*2,true);
 new Int16Array(buf,44).set(pcm);return new Blob([buf],{type:'audio/wav'})}

/* مطابقة تقريبية لنص المتصفح (الوضع الاحتياطي) */
function normAr(t){return String(t||'').replace(/[ً-ٰٟـ]/g,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^ء-ي\s]/g,'').replace(/\s+/g,' ').trim()}
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let prev=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const row=[i];for(let j=1;j<=n;j++)row[j]=Math.min(prev[j]+1,row[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=row}return prev[n]}
function similarity(target,heard){const T=normAr(target),H=normAr(heard);if(!T||!H)return 0;const t=T.replace(/ /g,''),h=H.replace(/ /g,'');if(h===t)return 1;
 if((' '+H+' ').includes(' '+T+' ')||(' '+H+' ').includes(' ال'+T+' '))return 1;
 const strip=x=>x.split(' ').map(w=>w.replace(/^ال/,'')).join('');const s1=1-lev(t,h)/Math.max(t.length,h.length),s2=1-lev(strip(T),strip(H))/Math.max(strip(T).length,strip(H).length,1);return Math.max(0,s1,s2)}

function addSay(host,text,kind){
 const mode=sayMode();const box=document.createElement('div');box.className='plus-say';
 box.innerHTML=`<button type="button" class="control-btn plus-say-btn"><span class="mic">🎤</span> <span class="lbl">${kind==='sentence'?'قُلِ الجُمْلَةَ بِصَوْتِكَ':'قُلْهَا بِصَوْتِكَ'}</span> <small class="gloss-inline" dir="ltr">Say it</small></button><div class="plus-say-res" aria-live="polite"></div>`;
 host.insertBefore(box,host.firstChild);
 const btn=box.querySelector('.plus-say-btn'),lbl=box.querySelector('.lbl'),res=box.querySelector('.plus-say-res');let tries=0,busy=false;
 const listening=()=>{btn.classList.add('listening');btn.querySelector('.mic').textContent='🔴';res.innerHTML=`<span class="plus-listen">أَسْمَعُكَ الآنَ… ${mode==='ai'?'اضغط مرة ثانية عند الانتهاء':''} <small dir="ltr">Listening…</small></span>`;react('listen');sfx('micOn')};
 const idle=()=>{btn.classList.remove('listening');btn.querySelector('.mic').textContent='🎤';calm()};
 btn.onclick=async()=>{
  if(activeRec){if(activeRec.stop)activeRec.stop();return}
  if(busy)return;const a=API();if(a&&a.stopAudio)a.stopAudio();pendingSay=null;
  if(mode==='ai'){
   try{const rec=await recordWav(kind==='sentence'?7000:4000,listening);activeRec=rec;
    const wav=await rec.done;activeRec=null;idle();sfx('micOff');busy=true;res.innerHTML='<span class="plus-listen">المَأْمُونُ يَسْتَمِعُ إِلَى نُطْقِكَ… 🤔</span>';
    const fd=new FormData();fd.append('audio',wav,'say.wav');fd.append('target',text);
    const r=await fetch('/api/pronunciation',{method:'POST',body:fd});const j=await r.json().catch(()=>({}));busy=false;
    if(!r.ok){res.innerHTML=r.status===429?'حَاوِلْ بَعْدَ قَلِيلٍ 🙂':'لَمْ أَسْتَطِعِ التَّقْيِيمَ الآنَ. حَاوِلْ مَرَّةً أُخْرَى.';return}
    const sc=Math.max(0,Math.min(100,+j.score||0));const st=j.passed?(sc>=90?3:2):(sc>=40?1:0);tries++;showResult(st,j.heard||'',j.feedback||'')}
   catch(e){activeRec=null;busy=false;idle();if(e&&e.message==='aborted')return;
    res.innerHTML=e&&e.name==='NotAllowedError'?'اِسْمَحْ بِاسْتِخْدَامِ المِيكْرُوفُونِ ثُمَّ حَاوِلْ.<small class="gloss" dir="ltr">Please allow the microphone.</small>':'المِيكْرُوفُونُ غَيْرُ مُتَاحٍ الآنَ.'}}
  else{
   let rec;try{rec=new SR()}catch(e){return}
   rec.lang='ar-SA';rec.interimResults=false;rec.maxAlternatives=5;rec.continuous=false;let got=false;
   activeRec={stop:()=>{try{rec.stop()}catch(e){}},cancel:()=>{try{rec.abort()}catch(e){}}};
   const stopT=setTimeout(()=>{try{rec.stop()}catch(e){}},kind==='sentence'?8000:5000);listening();
   rec.onresult=e=>{got=true;let sc=0,heard='';for(const rr of e.results)for(let k=0;k<rr.length;k++){const v=similarity(text,rr[k].transcript);if(v>=sc){sc=v;heard=rr[k].transcript}}
    tries++;showResult(sc>=(kind==='sentence'?.9:.99)?3:sc>=.67?2:sc>=.4?1:0,heard,'')};
   rec.onerror=e=>{const er=e.error||'';if(er==='not-allowed'||er==='service-not-allowed')res.innerHTML='اِسْمَحْ بِاسْتِخْدَامِ المِيكْرُوفُونِ ثُمَّ حَاوِلْ.';else if(er==='network')res.innerHTML='تَحَدِّي النُّطْقِ يَحْتَاجُ إِلَى الإِنْتَرْنِت.';else if(er!=='aborted')res.innerHTML='لَمْ أَسْمَعْكَ. اِقْتَرِبْ وَتَكَلَّمْ بِوُضُوحٍ 🙂'};
   rec.onend=()=>{clearTimeout(stopT);activeRec=null;idle();sfx('micOff');if(!got&&res.querySelector('.plus-listen'))res.innerHTML='لَمْ أَسْمَعْكَ. اِضْغَطْ 🎤 وَتَكَلَّمْ 🙂'};
   try{rec.start()}catch(e){activeRec=null;idle()}}};
 function showResult(st,heard,feedback){
  const msg=[[kind==='sentence'?'اِسْمَعِ الجُمْلَةَ ثُمَّ حَاوِلْ مَرَّةً أُخْرَى 👂':'اِسْمَعِ الكَلِمَةَ ثُمَّ حَاوِلْ مَرَّةً أُخْرَى 👂','Listen, then try again.'],['قَرِيبٌ! حَاوِلْ مَرَّةً أُخْرَى 💪','Close! Try again.'],['جَيِّدٌ جِدًّا! 👍','Very good!'],['نُطْقٌ مُمْتَازٌ! 🌟','Excellent pronunciation!']][st];
  res.innerHTML=`<div class="plus-say-stars">${[1,2,3].map(n=>`<span class="${n<=st?'on':''}" style="animation-delay:${n*.15}s">★</span>`).join('')}</div><b>${msg[0]}</b><small class="gloss" dir="ltr">${msg[1]}</small>${feedback?`<small class="plus-heard">${feedback.replace(/[<>&]/g,'')}</small>`:''}${heard?`<small class="plus-heard">سَمِعْتُ: <span>${heard.replace(/[<>&]/g,'')}</span></small>`:''}`;
  for(let k=0;k<st;k++)setTimeout(()=>sfx('star',k),200+k*170);
  if(st>=3){react('cheer');bubble('نُطْقٌ مُمْتَازٌ!',1800)}else if(st===2)react('jump');else react('wiggle');
  /* أول محاولة فقط تُسجَّل؛ النطق لا يدخل في متوسط الإتقان */
  if(tries===1){const a=API();if(a&&a.recordMic)a.recordMic(st>=2)}
  if(st<3&&tries<3)lbl.textContent='حَاوِلْ مَرَّةً أُخْرَى';else if(st<3){btn.disabled=true;lbl.textContent='أَحْسَنْتَ المُحَاوَلَةَ'}else lbl.textContent='مَرَّةً أُخْرَى'}}

function init(){wrapMascots();musicButtons();document.body.classList.add('plus-on')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MaamoonPlus={sfx,bubble,react,version:'V38'};
})();
