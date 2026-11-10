/* مغامرة المأمون — طبقة V35 (plus.js)
   ملف مستقل يضيف: المأمون المتحرك المتكلم، المؤثرات الصوتية والموسيقى، المكافآت،
   تحدي النطق بالميكروفون (إضافي لا يؤثر على الإتقان)، وحركة الخريطة.
   يستقبل الأحداث من game.js عبر window 'maamoon:*' ولا يغيّر منطق اللعبة. */
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
function activeScreen(){const x=document.querySelector('.screen.active');return x?x.id:''}

/* ---------- تفضيلات هذا الجهاز ---------- */
const PREF_KEY='almaamoon_plus_v35';
let prefs={music:false};
try{prefs=Object.assign(prefs,JSON.parse(localStorage.getItem(PREF_KEY)||'{}'))}catch(e){}
function savePrefs(){try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs))}catch(e){}}
const ss={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}};

/* =====================================================================
   1) محرك الصوت: مؤثرات + موسيقى خلفية (بدون ملفات، كله مولّد)
   ===================================================================== */
let ctx=null,sfxBus=null,musicBus=null,noiseBuf=null;
function ac(){
 if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;
  try{ctx=new A()}catch(e){return null}
  const comp=ctx.createDynamicsCompressor();comp.connect(ctx.destination);
  sfxBus=ctx.createGain();sfxBus.gain.value=.9;sfxBus.connect(comp);
  musicBus=ctx.createGain();musicBus.gain.value=0;musicBus.connect(comp)}
 if(ctx.state==='suspended')ctx.resume().catch(()=>{});
 return ctx}
['pointerdown','touchend','keydown'].forEach(t=>document.addEventListener(t,()=>{ac();if(prefs.music)musicStart()},{capture:true,passive:true}));

function tone(f,t0,d,o){o=o||{};const c=ctx,osc=c.createOscillator(),g=c.createGain();
 osc.type=o.type||'sine';osc.frequency.setValueAtTime(f,t0);if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t0+d*.9);
 const v=o.vol||.12,a=o.a||.008;g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+a);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
 osc.connect(g);g.connect(o.bus||sfxBus);osc.start(t0);osc.stop(t0+d+.05)}
function bell(f,t0,d,v){tone(f,t0,d,{vol:v||.1});tone(f*2,t0,d*.6,{vol:(v||.1)*.35});tone(f*3.01,t0,d*.3,{vol:(v||.1)*.12})}
function noise(t0,d,o){o=o||{};const c=ctx;if(!noiseBuf){noiseBuf=c.createBuffer(1,c.sampleRate,c.sampleRate);const ch=noiseBuf.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1}
 const src=c.createBufferSource();src.buffer=noiseBuf;const bp=c.createBiquadFilter();bp.type='bandpass';bp.Q.value=o.q||1.2;bp.frequency.setValueAtTime(o.from||400,t0);bp.frequency.exponentialRampToValueAtTime(o.to||2400,t0+d);
 const g=c.createGain();g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(o.vol||.08,t0+d*.35);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
 src.connect(bp);bp.connect(g);g.connect(sfxBus);src.start(t0);src.stop(t0+d+.05)}
const PENTA=[523.25,587.33,659.25,783.99,880,1046.5,1174.66,1318.51,1567.98];
const SFX={
 ok:t=>{bell(783.99,t,.35,.11);bell(1046.5,t+.09,.5,.11);tone(2093,t+.18,.25,{vol:.03})},
 no:t=>{tone(330,t,.18,{type:'triangle',to:262,vol:.07});tone(262,t+.16,.26,{type:'triangle',to:196,vol:.06})},
 combo:(t,n)=>{const k=Math.min(6,Math.max(3,n||3));for(let i=0;i<k;i++)bell(PENTA[i+1],t+i*.07,.28,.07)},
 star:(t,n)=>{bell(PENTA[Math.min(8,4+(n||0))],t,.4,.09)},
 key:t=>{[523.25,659.25,783.99].forEach((f,i)=>bell(f,t+i*.13,.45,.1));[1046.5,1318.51,1567.98].forEach(f=>tone(f,t+.42,1.3,{vol:.05,type:'triangle',a:.03}));for(let i=0;i<6;i++)tone(2093+Math.random()*1500,t+.5+i*.08,.18,{vol:.02})},
 mission:t=>{[659.25,783.99,1046.5].forEach((f,i)=>bell(f,t+i*.1,.4,.09));tone(1318.51,t+.32,.7,{vol:.04,type:'triangle'})},
 whoosh:t=>noise(t,.45,{from:300,to:2600,vol:.05}),
 step:t=>tone(180+Math.random()*40,t,.06,{type:'triangle',vol:.035}),
 pop:t=>tone(600,t,.09,{to:1200,vol:.05}),
 micOn:t=>{tone(660,t,.12,{vol:.06});tone(990,t+.1,.15,{vol:.06})},
 micOff:t=>{tone(990,t,.1,{vol:.05});tone(660,t+.09,.14,{vol:.05})}
};
function sfx(name,arg){if(!soundOn())return;const c=ac();if(!c||!SFX[name])return;try{SFX[name](c.currentTime+.02,arg)}catch(e){}}

/* موسيقى خلفية هادئة: سلّم خماسي وتسلسل C–Am–F–G، تنخفض تلقائيًا عندما يتكلم المأمون */
const CHORDS=[[130.81,196,261.63],[110,164.81,220],[87.31,130.81,174.61],[98,146.83,196]];
const MEL=[523.25,587.33,659.25,783.99,880,1046.5];
let musicTimer=null,nextNote=0,step8=0,musicLevel=0;
function musicStart(){if(musicTimer||!prefs.music||!soundOn())return;const c=ac();if(!c)return;nextNote=c.currentTime+.1;step8=0;musicTimer=setInterval(musicTick,90)}
function musicStop(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}if(musicBus&&ctx)musicBus.gain.setTargetAtTime(0,ctx.currentTime,.2)}
function musicTick(){if(!ctx)return;const e8=60/84/2;
 while(nextNote<ctx.currentTime+.3){const bar=Math.floor(step8/8),ch=CHORDS[Math.floor(bar/2)%4],pos=step8%8;
  if(pos===0&&bar%2===0)ch.forEach((f,i)=>tone(f,nextNote,e8*15.5,{type:'triangle',vol:.05-i*.01,a:.4,bus:musicBus}));
  if(pos===0||pos===4)tone(ch[0]/2*2,nextNote,e8*1.6,{type:'sine',vol:.06,bus:musicBus});
  if(Math.random()<(pos%2?.22:.45)){const f=pick(MEL);tone(f,nextNote,e8*2.2,{vol:.035,a:.02,bus:musicBus});tone(f*2,nextNote,e8,{vol:.006,bus:musicBus})}
  nextNote+=e8;step8++}
 /* خفض الموسيقى أثناء الكلام */
 const target=!prefs.music||!soundOn()||document.hidden?0:talking?.12:.55;
 if(target!==musicLevel){musicLevel=target;musicBus.gain.setTargetAtTime(target,ctx.currentTime,talking?.08:.6)}
 if(!prefs.music||!soundOn())musicStop()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)musicStop();else if(prefs.music)musicStart()});

function musicButtons(){
 const make=()=>{const b=document.createElement('button');b.className='round-btn plus-music-btn';b.type='button';b.setAttribute('aria-label','الموسيقى');b.onclick=()=>{prefs.music=!prefs.music;savePrefs();if(prefs.music){musicLevel=-1;musicStart()}else musicStop();syncMusicBtns();sfx('pop')};return b};
 [['worldSoundBtn'],['stageSoundBtn']].forEach(([id])=>{const s=$(id);if(s&&!s.parentNode.querySelector('.plus-music-btn'))s.parentNode.insertBefore(make(),s)});syncMusicBtns()}
function syncMusicBtns(){document.querySelectorAll('.plus-music-btn').forEach(b=>{b.textContent='🎵';b.classList.toggle('off',!prefs.music);b.setAttribute('aria-pressed',String(!!prefs.music));b.title=prefs.music?'إيقاف الموسيقى — Music off':'تشغيل الموسيقى — Music on'})}

/* =====================================================================
   2) المأمون الحي: تنفّس، كلام، قفز، فقاعة كلام
   ===================================================================== */
let talking=false,lastAudio=null,lastSpeakAt=0;
on('speak',d=>{lastSpeakAt=Date.now();if(d.audio)lastAudio=d.audio;setTalking(true)});
function setTalking(v){if(v===talking)return;talking=v;document.body.classList.toggle('plus-talking',v)}
setInterval(()=>{const tts='speechSynthesis'in window&&(speechSynthesis.speaking||speechSynthesis.pending);const aud=lastAudio&&!lastAudio.paused&&!lastAudio.ended;setTalking(!!(tts||aud)||Date.now()-lastSpeakAt<250)},180);

function wrapMascots(){
 document.querySelectorAll('.hero-character img,.diag-guide img,.coach img').forEach(img=>{if(img.closest('.plus-mascot'))return;
  const w=document.createElement('span');w.className='plus-mascot';const body=document.createElement('span');body.className='plus-mbody';const bub=document.createElement('span');bub.className='plus-bubble';bub.setAttribute('role','status');
  img.parentNode.insertBefore(w,img);body.appendChild(img);w.appendChild(bub);w.appendChild(body)});
 const ex=$('explorer');if(ex&&!document.querySelector('.plus-ex-bubble')){const b=document.createElement('div');b.className='plus-bubble plus-ex-bubble';b.setAttribute('role','status');ex.parentNode.appendChild(b)}}
/* المأمون الظاهر في الشاشة الحالية */
function visibleMascot(){const sc=document.querySelector('.screen.active');return sc?sc.querySelector('.plus-mascot'):null}
function react(kind,el){el=el||visibleMascot();if(!el||reduced())return;const b=el.querySelector('.plus-mbody');if(!b)return;b.classList.remove('m-jump','m-wiggle','m-spin','m-wave','m-cheer','m-listen');void b.offsetWidth;b.classList.add('m-'+kind);clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('m-'+kind),kind==='listen'?60000:1400)}
function calm(el){el=el||visibleMascot();if(!el)return;const b=el.querySelector('.plus-mbody');if(b)b.classList.remove('m-listen')}
function bubble(text,ms,el){
 let bub;if(activeScreen()==='worldScreen'){bub=document.querySelector('.plus-ex-bubble');const ex=$('explorer');if(bub&&ex){bub.style.left=ex.style.left||'50%';bub.style.top=ex.style.top||'50%'}}
 else{el=el||visibleMascot();bub=el&&el.querySelector('.plus-bubble')}
 if(!bub)return;bub.textContent=text;bub.classList.remove('show');void bub.offsetWidth;bub.classList.add('show');clearTimeout(bub._t);bub._t=setTimeout(()=>bub.classList.remove('show'),ms||2400)}

/* الكلام بدون قطع صوت اللعبة: ينتظر حتى يسكت الصوت الحالي */
let pendingSay=null;
function sayWhenQuiet(text,maxWait){if(!soundOn()||!text)return;pendingSay={text,until:Date.now()+(maxWait||3500)}}
setInterval(()=>{if(!pendingSay)return;if(Date.now()>pendingSay.until){pendingSay=null;return}if(talking||Date.now()-lastSpeakAt<450)return;const t=pendingSay.text;pendingSay=null;const a=API();if(a&&a.speak)a.speak(t,.88)},150);
function sayNow(text){if(!soundOn()||!text)return;const a=API();if(a&&a.speak)a.speak(text,.88)}

/* ---------- عبارات المأمون ---------- */
const GOOD=['أَحْسَنْتَ!','مُمْتَازٌ!','رَائِعٌ!','إِجَابَةٌ صَحِيحَةٌ!','أَنْتَ بَطَلٌ!','عَمَلٌ جَمِيلٌ!','اِسْتَمِرَّ!','صَحِيحٌ!'];
const TRY=['لَا بَأْسَ! حَاوِلْ مَرَّةً أُخْرَى 💪','نَتَعَلَّمُ مِنَ الخَطَأِ 🌱','اِسْمَعْ جَيِّدًا وَحَاوِلْ 👂','قَرِيبٌ! أَنْتَ تَسْتَطِيعُ 💪'];
const COMBO={3:'ثَلَاثُ إِجَابَاتٍ صَحِيحَةٍ!',5:'خَمْسُ إِجَابَاتٍ صَحِيحَةٍ! رَائِعٌ!',8:'ثَمَانِي إِجَابَاتٍ! أَنْتَ نَجْمٌ!',10:'عَشْرُ إِجَابَاتٍ! مُذْهِلٌ!',15:'خَمْسَ عَشْرَةَ! بَطَلٌ حَقِيقِيٌّ!',20:'عِشْرُونَ إِجَابَةً! أَسْطُورَةٌ!'};
let lastGood='';
function goodWord(){let w;do{w=pick(GOOD)}while(w===lastGood&&GOOD.length>1);lastGood=w;return w}

/* =====================================================================
   3) التحية: «أهلًا» مرة واحدة فقط في بداية الجلسة
   ===================================================================== */
const GREET_KEY='plus_greeted';
const GREET_TEXT='أَهْلًا! أَنَا المَأْمُونُ 👋 هَيَّا نَبْدَأُ المُغَامَرَةَ!';
const GREET_SAY='أَهْلًا! أَنَا المَأْمُونُ. هَيَّا نَبْدَأُ المُغَامَرَةَ!';
let startBubbleDefault='';
function setupGreeting(){const sb=document.querySelector('.start-screen .speech-bubble');if(!sb)return;startBubbleDefault=sb.innerHTML;
 if(ss.get(GREET_KEY))return;sb.textContent=GREET_TEXT;sb.classList.add('plus-greet');
 /* المتصفح لا يسمح بالصوت قبل أول لمسة، فنحيّي عند أول لمسة على الشاشة الرئيسية */
 const greet=e=>{if(ss.get(GREET_KEY))return cleanup();if(activeScreen()!=='startScreen')return;ss.set(GREET_KEY,'1');cleanup();
  const onButton=e&&e.target&&e.target.closest&&e.target.closest('button,input,a');
  react('wave',document.querySelector('.start-screen .plus-mascot'));if(!onButton)setTimeout(()=>sayNow(GREET_SAY),60)};
 const cleanup=()=>document.removeEventListener('pointerdown',greet,true);
 document.addEventListener('pointerdown',greet,true)}
on('screen',d=>{if(d.id==='startScreen'){const sb=document.querySelector('.start-screen .speech-bubble');if(sb&&ss.get(GREET_KEY)&&startBubbleDefault){sb.innerHTML=startBubbleDefault;sb.classList.remove('plus-greet')}}});

/* بعد الدخول: لا نكرر «أهلًا»؛ نشجعه على المتابعة مرة واحدة لكل طالب في الجلسة */
on('login',d=>{ss.set(GREET_KEY,'1');const s=cur();const key='plus_welcomed_'+(s&&(s.id||s.code||s.name)||'x');
 setTimeout(()=>{if(ss.get(key)||activeScreen()!=='worldScreen')return;ss.set(key,'1');const n=firstName();
  bubble(n?`هَيَّا يَا ${n}! 🚀`:'هَيَّا نُكْمِلُ الرِّحْلَةَ! 🚀',3200);sayWhenQuiet(n?`هَيَّا يَا ${n}، نُكْمِلُ الرِّحْلَةَ!`:'هَيَّا نُكْمِلُ الرِّحْلَةَ!');walkHop()},700)});

/* =====================================================================
   4) ردود الفعل على الإجابات والمكافآت
   ===================================================================== */
on('praise',d=>{bubble(d.ar||goodWord(),1800);react('jump')});
on('answer',d=>{
 if(d.ok){if(!document.querySelector('.screen.active .plus-bubble.show'))bubble(goodWord(),1600);react('jump');
  if(d.firstTry&&COMBO[d.combo]){comboBurst(d.combo);const n=firstName();sayWhenQuiet((n?`${n}! `:'')+COMBO[d.combo].replace(/!$/,''),4000);react('spin')}}
 else{bubble(pick(TRY),2000);react('wiggle')}});
on('mission',d=>{
 if(d.pass){sfx('mission');react('cheer');starRain(d.stars||1);
  if(d.stationDone)setTimeout(()=>keyCelebration(d),500);
  else{const n=firstName();setTimeout(()=>{bubble('أَتْقَنْتَ المُهِمَّةَ! ⭐',2600);sayWhenQuiet(`أَحْسَنْتَ${n?' يَا '+n:''}! أَتْقَنْتَ المُهِمَّةَ.`,3000)},450)}}
 else{react('wiggle');setTimeout(()=>{bubble('سَنَتَدَرَّبُ مَعًا 🤝',2600);sayWhenQuiet('لَا بَأْسَ، سَنَتَدَرَّبُ مَعًا خُطْوَةً خُطْوَةً.',3000)},400)}});

function comboBurst(n){sfx('combo',n);if(reduced())return;const x=document.createElement('div');x.className='plus-combo';x.innerHTML=`<b>🔥 ${n}</b><span>${n>=10?'أُسْطُورِيّ!':n>=5?'رَائِع!':'سِلْسِلَة!'}</span>`;document.body.appendChild(x);setTimeout(()=>x.remove(),1500)}
function starRain(stars){if(reduced())return;const box=document.createElement('div');box.className='plus-star-rain';for(let i=0;i<14+stars*6;i++){const s=document.createElement('span');s.textContent=pick(['⭐','✨','🌟']);s.style.left=(Math.random()*100)+'%';s.style.animationDelay=(Math.random()*.7)+'s';s.style.fontSize=(18+Math.random()*22)+'px';box.appendChild(s)}document.body.appendChild(box);setTimeout(()=>box.remove(),2800);for(let k=0;k<stars;k++)setTimeout(()=>sfx('star',k),250+k*180)}

/* احتفال المفتاح عند إكمال المحطة */
function keyCelebration(d){
 const keysNow=(()=>{const s=cur();return s&&s.completed?s.completed.filter(Boolean).length:0})();
 const ov=document.createElement('div');ov.className='plus-key-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','حصلت على مفتاح جديد');
 ov.innerHTML=`<div class="plus-key-card"><div class="plus-rays"></div><div class="plus-key-icon">${d.reward||'🔑'}</div><h2>حَصَلْتَ عَلَى ${d.rewardName||'مِفْتَاحٍ جَدِيدٍ'}!</h2><p class="gloss" dir="ltr">You won a new key!</p><div class="plus-keys-row">${Array.from({length:8},(_,i)=>`<span class="${i<keysNow?'on':''} ${i===keysNow-1?'new':''}">🔑</span>`).join('')}</div><button class="big-btn gold" type="button">رَائِع! ▶</button></div>`;
 document.body.appendChild(ov);sfx('key');sfx('whoosh');
 const n=firstName();sayWhenQuiet(`رَائِعٌ${n?' يَا '+n:''}! حَصَلْتَ عَلَى ${d.rewardName||'مِفْتَاحٍ جَدِيدٍ'}.`,2500);
 if(!reduced()){const conf=document.createElement('div');conf.className='plus-star-rain';for(let i=0;i<40;i++){const s=document.createElement('span');s.textContent=pick(['🎉','✨','⭐','🟡','🔵','🟢']);s.style.left=Math.random()*100+'%';s.style.animationDelay=Math.random()*.8+'s';conf.appendChild(s)}ov.appendChild(conf)}
 const close=()=>{ov.classList.add('out');setTimeout(()=>ov.remove(),350)};ov.querySelector('button').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});setTimeout(()=>{if(document.body.contains(ov))close()},7000);ov.querySelector('button').focus()}

/* =====================================================================
   5) تحدي النطق 🎤 — إضافي فقط: لا يدخل في الإتقان ولا يمنع التقدم
   ===================================================================== */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const sayEnabled=()=>!!SR&&CFG.pronunciationChallenge!==false&&!sayDisabledForSession;
let sayDisabledForSession=false,activeRec=null;
function normAr(t){return String(t||'').replace(/[ً-ٰٟـ]/g,'').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^ء-ي\s]/g,'').replace(/\s+/g,' ').trim()}
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let prev=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const row=[i];for(let j=1;j<=n;j++)row[j]=Math.min(prev[j]+1,row[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=row}return prev[n]}
function similarity(target,heard){const T=normAr(target),H=normAr(heard);if(!T||!H)return 0;const t=T.replace(/ /g,''),h=H.replace(/ /g,'');
 if(h===t)return 1;
 /* الكلمة داخل ما سمعه (مثل «الفيل» بدل «فيل») */
 if((' '+H+' ').includes(' '+T+' ')||(' '+H+' ').includes(' ال'+T+' '))return 1;
 const hNoAl=H.split(' ').map(w=>w.replace(/^ال/,'')).join(''),tNoAl=T.split(' ').map(w=>w.replace(/^ال/,'')).join('');
 const s1=1-lev(t,h)/Math.max(t.length,h.length),s2=1-lev(tNoAl,hNoAl)/Math.max(tNoAl.length,hNoAl.length,1);
 return Math.max(0,s1,s2)}
function starsFor(sc,kind){const hi=kind==='sentence'?.9:.99;return sc>=hi?3:sc>=.67?2:sc>=.4?1:0}
on('say',d=>{if(!d.host||!d.text||!sayEnabled())return;addSayChallenge(d.host,d.text,d.kind||'word')});
on('screen',()=>stopRec());
function stopRec(){if(activeRec){try{activeRec.abort()}catch(e){}activeRec=null}}
function addSayChallenge(host,text,kind){
 const box=document.createElement('div');box.className='plus-say';
 box.innerHTML=`<button type="button" class="control-btn plus-say-btn"><span class="mic">🎤</span> ${kind==='sentence'?'قُلِ الجُمْلَةَ بِصَوْتِكَ':'قُلْهَا بِصَوْتِكَ'} <small class="gloss-inline" dir="ltr">Say it</small></button><div class="plus-say-res" aria-live="polite"></div>`;
 host.insertBefore(box,host.firstChild);
 const btn=box.querySelector('.plus-say-btn'),res=box.querySelector('.plus-say-res');let tries=0,best=0;
 btn.onclick=()=>{if(activeRec){stopRec();return}
  const a=API();if(a&&a.stopAudio)a.stopAudio();pendingSay=null;
  let rec;try{rec=new SR()}catch(e){res.innerHTML='الميكروفون غير متاح في هذا المتصفح.';return}
  activeRec=rec;rec.lang='ar-SA';rec.interimResults=false;rec.maxAlternatives=5;rec.continuous=false;
  let got=false;const stopT=setTimeout(()=>{try{rec.stop()}catch(e){}},kind==='sentence'?8000:5000);
  btn.classList.add('listening');btn.querySelector('.mic').textContent='🔴';res.innerHTML='<span class="plus-listen">أَسْمَعُكَ الآنَ… <small dir="ltr">Listening…</small></span>';
  react('listen');sfx('micOn');
  rec.onresult=e=>{got=true;const alts=[];for(const r of e.results)for(let k=0;k<r.length;k++)alts.push(r[k].transcript);
   let sc=0,heard=alts[0]||'';alts.forEach(x=>{const v=similarity(text,x);if(v>sc){sc=v;heard=x}});
   const st=starsFor(sc,kind);tries++;showResult(st,heard)};
  rec.onerror=e=>{clearTimeout(stopT);const er=e.error||'';
   if(er==='not-allowed'||er==='service-not-allowed'){res.innerHTML='اِسْمَحْ بِاسْتِخْدَامِ المِيكْرُوفُونِ ثُمَّ حَاوِلْ.<small class="gloss" dir="ltr">Please allow the microphone.</small>';if(er==='service-not-allowed')sayDisabledForSession=true}
   else if(er==='network')res.innerHTML='تَحَدِّي النُّطْقِ يَحْتَاجُ إِلَى الإِنْتَرْنِت.<small class="gloss" dir="ltr">Needs internet.</small>';
   else if(er!=='aborted')res.innerHTML='لَمْ أَسْمَعْكَ. اِقْتَرِبْ وَتَكَلَّمْ بِوُضُوحٍ 🙂<small class="gloss" dir="ltr">I could not hear you. Try again.</small>'};
  rec.onend=()=>{clearTimeout(stopT);if(activeRec===rec)activeRec=null;btn.classList.remove('listening');btn.querySelector('.mic').textContent='🎤';calm();sfx('micOff');
   if(!got&&res.querySelector('.plus-listen'))res.innerHTML='لَمْ أَسْمَعْكَ. اِضْغَطْ 🎤 وَتَكَلَّمْ 🙂<small class="gloss" dir="ltr">Tap 🎤 and speak.</small>'};
  try{rec.start()}catch(e){activeRec=null;btn.classList.remove('listening');res.innerHTML=''}};
 function showResult(st,heard){
  const msg=[[kind==='sentence'?'اِسْمَعِ الجُمْلَةَ ثُمَّ حَاوِلْ مَرَّةً أُخْرَى 👂':'اِسْمَعِ الكَلِمَةَ ثُمَّ حَاوِلْ مَرَّةً أُخْرَى 👂','Listen, then try again.'],['قَرِيبٌ! حَاوِلْ مَرَّةً أُخْرَى 💪','Close! Try again.'],['جَيِّدٌ جِدًّا! 👍','Very good!'],['نُطْقٌ مُمْتَازٌ! 🌟','Excellent pronunciation!']][st];
  res.innerHTML=`<div class="plus-say-stars">${[1,2,3].map(n=>`<span class="${n<=st?'on':''}" style="animation-delay:${n*.15}s">★</span>`).join('')}</div><b>${msg[0]}</b><small class="gloss" dir="ltr">${msg[1]}</small>${heard?`<small class="plus-heard">سَمِعْتُ: <span>${heard.replace(/[<>&]/g,'')}</span></small>`:''}`;
  for(let k=0;k<st;k++)setTimeout(()=>sfx('star',k),200+k*170);
  if(st>=3){react('cheer');bubble('نُطْقٌ مُمْتَازٌ!',1800)}else if(st===2)react('jump');else react('wiggle');
  /* تسجيل المحاولة ونقاط إضافية لأفضل نتيجة فقط (النطق لا يدخل في متوسط الإتقان) */
  if(tries===1){const a=API();if(a&&a.recordMic)a.recordMic(st>=2)}best=Math.max(best,st)
  if(st<3&&tries<3)btn.innerHTML='<span class="mic">🎤</span> حَاوِلْ مَرَّةً أُخْرَى <small class="gloss-inline" dir="ltr">Try again</small>';
  else if(st<3){btn.disabled=true;btn.innerHTML='<span class="mic">🎤</span> أَحْسَنْتَ المُحَاوَلَةَ'}
  else{btn.innerHTML='<span class="mic">🎤</span> مَرَّةً أُخْرَى <small class="gloss-inline" dir="ltr">Again</small>'}}}

/* =====================================================================
   6) الخريطة الحية: مسار متحرك، مشي المستكشف، طيور وموج
   ===================================================================== */
function setupMap(){const box=$('mapBox');if(!box||box.querySelector('.plus-ambient'))return;
 const amb=document.createElement('div');amb.className='plus-ambient';amb.setAttribute('aria-hidden','true');
 /* لمعان الماء في مناطق البحر من الصورة */
 const glints=[[12,40],[22,58],[8,72],[27,90],[87,30],[92,52],[84,88],[60,95],[40,62],[62,18],[30,20],[95,72]];
 glints.forEach(([x,y],i)=>{const g=document.createElement('i');g.className='glint';g.style.left=x+'%';g.style.top=y+'%';g.style.animationDelay=(i*.6%4)+'s';amb.appendChild(g)});
 /* نوارس */
 for(let i=0;i<3;i++){const b=document.createElement('span');b.className='gull g'+i;b.innerHTML='<svg viewBox="0 0 40 16"><path d="M2 12 Q10 2 20 10 Q30 2 38 12" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>';amb.appendChild(b)}
 /* غيوم خفيفة */
 for(let i=0;i<2;i++){const c=document.createElement('span');c.className='cloud-soft c'+i;amb.appendChild(c)}
 const art=box.querySelector('.world-art');art.after(amb);
 /* مشي المستكشف عند تغيّر موقعه */
 const ex=$('explorer');if(ex){let lx=parseFloat(ex.style.left)||0,ly=parseFloat(ex.style.top)||0,walkT=null;
  new MutationObserver(()=>{const x=parseFloat(ex.style.left),y=parseFloat(ex.style.top);if(isNaN(x)||isNaN(y))return;const dist=Math.hypot(x-lx,y-ly);if(dist<.3){lx=x;ly=y;return}
   ex.classList.toggle('face-left',x<lx);ex.classList.add('walking');if(activeScreen()==='worldScreen'){sfx('whoosh');for(let k=0;k<5;k++)setTimeout(()=>sfx('step'),120+k*190);trail(lx,ly,x,y)}
   lx=x;ly=y;clearTimeout(walkT);walkT=setTimeout(()=>ex.classList.remove('walking'),1150)}).observe(ex,{attributes:true,attributeFilter:['style']})}}
function trail(x0,y0,x1,y1){if(reduced())return;const box=$('mapBox');if(!box)return;for(let k=1;k<=6;k++){const f=k/7;const p=document.createElement('span');p.className='plus-step';p.textContent='✨';p.style.left=(x0+(x1-x0)*f)+'%';p.style.top=(y0+(y1-y0)*f)+'%';p.style.animationDelay=(k*.15)+'s';box.appendChild(p);setTimeout(()=>p.remove(),2200)}}
function walkHop(){const ex=$('explorer');if(!ex||reduced())return;ex.classList.remove('hop');void ex.offsetWidth;ex.classList.add('hop');setTimeout(()=>ex.classList.remove('hop'),900)}
on('screen',d=>{if(d.id==='worldScreen'){const box=$('mapBox');if(box&&!reduced()){box.classList.remove('plus-enter');void box.offsetWidth;box.classList.add('plus-enter');setTimeout(()=>box.classList.remove('plus-enter'),1400)}musicButtons()}
 if(d.id==='stageScreen')musicButtons()});
/* =====================================================================
   تشغيل
   ===================================================================== */
function init(){wrapMascots();setupGreeting();setupMap();musicButtons();document.body.classList.add('plus-on')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MaamoonPlus={sfx,bubble,react,version:'V35'};
})();
