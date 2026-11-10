/* مغامرة المأمون V37 — طبقة «إحساس اللعبة»
   أصوات مؤثرات أصلية (مولّدة بالكود، بدون ملفات)، نجوم وعملات تتطاير عند الإجابة الصحيحة،
   لافتة «أنجزت المهمة!» مع لحن احتفالي، انتقالات بين الشاشات، وحركة على الخريطة.
   لا تغيّر هذه الطبقة الدرجات أو البيانات؛ هي تستمع لما يحدث في الصفحة فقط. */
(()=>{
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function soundOn(){try{const s=JSON.parse(localStorage.getItem('almaamoon_v26_settings'));return !s||s.sound!==false}catch{return true}}

/* ---------- محرك الصوت ---------- */
let ctx=null,master=null;
function ac(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;if(!ctx){ctx=new A();master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination)}if(ctx.state==='suspended')ctx.resume();return ctx}
['pointerdown','touchend','keydown'].forEach(t=>document.addEventListener(t,()=>ac(),{once:true,capture:true}));
function tone(f,t0,dur,{type='square',vol=.12,slide=0,attack=.005}={}){const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t0);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f*slide),t0+dur);g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+attack);g.gain.exponentialRampToValueAtTime(.0008,t0+dur);o.connect(g);g.connect(master);o.start(t0);o.stop(t0+dur+.02)}
function noise(t0,dur,vol=.08,from=1800,to=300){const c=ac();if(!c)return;const n=c.createBufferSource(),b=c.createBuffer(1,Math.floor(c.sampleRate*dur),c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=1.2;f.frequency.setValueAtTime(from,t0);f.frequency.exponentialRampToValueAtTime(to,t0+dur);const g=c.createGain();g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0008,t0+dur);n.connect(f);f.connect(g);g.connect(master);n.start(t0);n.stop(t0+dur)}
const N=n=>440*Math.pow(2,(n-69)/12); /* رقم MIDI ← تردد */
const SFX={
 tap(){const c=ac();if(!c)return;tone(N(84),c.currentTime,.05,{type:'triangle',vol:.05})},
 correct(){const c=ac();if(!c)return;const t=c.currentTime;[76,79,84,88].forEach((m,i)=>tone(N(m),t+i*.055,.16,{type:'square',vol:.07}));tone(N(96),t+.22,.25,{type:'triangle',vol:.06})},
 wrong(){const c=ac();if(!c)return;const t=c.currentTime;tone(N(55),t,.14,{type:'square',vol:.07,slide:.8});tone(N(50),t+.12,.22,{type:'square',vol:.07,slide:.7})},
 coin(){const c=ac();if(!c)return;const t=c.currentTime;tone(N(83),t,.07,{type:'square',vol:.06});tone(N(88),t+.07,.28,{type:'square',vol:.06})},
 star(i=0){const c=ac();if(!c)return;const t=c.currentTime;const b=[79,83,86][i%3];[0,4,7,12].forEach((d,k)=>tone(N(b+d),t+k*.04,.12,{type:'triangle',vol:.07}))},
 whoosh(){const c=ac();if(!c)return;noise(c.currentTime,.28,.05,500,2600)},
 clear(){const c=ac();if(!c)return;const t=c.currentTime;
  /* لحن احتفالي أصلي قصير */
  const mel=[[72,0,.12],[76,.12,.12],[79,.24,.12],[84,.36,.24],[79,.62,.1],[84,.74,.5]];
  mel.forEach(([m,s,d])=>{tone(N(m),t+s,d+.05,{type:'square',vol:.075});tone(N(m-12),t+s,d+.05,{type:'triangle',vol:.06})});
  [[48,0],[55,.36],[60,.74]].forEach(([m,s])=>tone(N(m),t+s,.34,{type:'triangle',vol:.09}));
  noise(t+.74,.5,.03,6000,9000)},
 fanfare(){SFX.clear();const c=ac();if(!c)return;const t=c.currentTime+1.3;[[84,0],[88,.1],[91,.2],[96,.3]].forEach(([m,s])=>tone(N(m),t+s,.5,{type:'square',vol:.06}))},
 soft(){const c=ac();if(!c)return;const t=c.currentTime;[67,64,60].forEach((m,i)=>tone(N(m),t+i*.12,.2,{type:'triangle',vol:.06}))}
};
function play(name,arg){if(!soundOn())return;try{SFX[name]&&SFX[name](arg)}catch{}}
window.MaamoonFX={play,sfx:play};

/* ---------- جسيمات ونجوم ---------- */
const layer=document.createElement('div');layer.className='fx-layer';layer.setAttribute('aria-hidden','true');document.body.appendChild(layer);
function centerOf(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}
function burst(el,{count=12,big=false}={}){if(reduce||!el||!el.isConnected)return;const {x,y}=centerOf(el);
 const ring=document.createElement('span');ring.className='fx-ring';ring.style.left=x+'px';ring.style.top=y+'px';layer.appendChild(ring);setTimeout(()=>ring.remove(),600);
 for(let i=0;i<count;i++){const p=document.createElement('span');p.className='fx-star'+(i%3===0?' alt':'');p.textContent=i%4===0?'✦':'★';const a=(Math.PI*2*i/count)+Math.random()*.4,d=(big?140:80)+Math.random()*50;
  p.style.left=x+'px';p.style.top=y+'px';p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');p.style.setProperty('--rot',(Math.random()*540-270)+'deg');p.style.fontSize=(big?22:14)+Math.random()*12+'px';layer.appendChild(p);setTimeout(()=>p.remove(),900)}}
function coinTo(el,amount='+10'){if(reduce||!el||!el.isConnected)return;const {x,y}=centerOf(el);const c=document.createElement('span');c.className='fx-coin';c.dir='ltr';c.innerHTML=`<i>⭐</i><b>${amount}</b>`;c.style.left=x+'px';c.style.top=y+'px';
 const tgt=document.querySelector('.screen.active #stagePoints, .screen.active #writePoints, .screen.active #checkPoints, .screen.active #hudPoints');
 if(tgt){const t=centerOf(tgt);c.style.setProperty('--tx',(t.x-x)+'px');c.style.setProperty('--ty',(t.y-y)+'px')}else{c.style.setProperty('--tx','0px');c.style.setProperty('--ty','-120px')}
 layer.appendChild(c);setTimeout(()=>{c.remove();play('coin');if(tgt){const pill=tgt.closest('.hud-pill')||tgt;pill.classList.remove('fx-bump');void pill.offsetWidth;pill.classList.add('fx-bump')}},720)}
function shake(){if(reduce)return;const b=document.querySelector('.screen.active .activity-board');if(!b)return;b.classList.remove('fx-shake');void b.offsetWidth;b.classList.add('fx-shake');setTimeout(()=>b.classList.remove('fx-shake'),420)}

/* ---------- لافتة «أنجزت المهمة» ---------- */
function banner(kind){if(document.querySelector('.fx-banner'))return;const b=document.createElement('div');b.className='fx-banner '+kind;
 const t=kind==='grad'?['🎓 أتممت الرحلة!','JOURNEY COMPLETE!']:kind==='station'?['🏆 أكملت المحطة!','STATION CLEAR!']:['⭐ أنجزت المهمة!','MISSION CLEAR!'];
 b.innerHTML=`<div class="fx-banner-inner"><b>${t[0]}</b><span dir="ltr">${t[1]}</span></div>`;document.body.appendChild(b);setTimeout(()=>b.classList.add('out'),1500);setTimeout(()=>b.remove(),2000)}
function celebrateFinish(f){if(f.dataset.fx)return;f.dataset.fx='1';
 if(f.querySelector('.support-score')){play('soft');return}
 const grad=f.classList.contains('certificate'),station=/المحطة/.test((f.querySelector('h2')||{}).textContent||'');
 banner(grad?'grad':station?'station':'mission');play(grad||station?'fanfare':'clear');
 const stars=[...f.querySelectorAll('.stars-row span.on')];stars.forEach((s,i)=>setTimeout(()=>{play('star',i);burst(s,{count:10,big:true})},650+i*260));
 const badge=f.querySelector('.mastery-badge');if(badge&&!reduce)badge.classList.add('fx-badge')}

/* ---------- مراقبة ما يحدث في اللعبة ---------- */
const GOOD=['correct','pop','ok','fill','solved','good','traced'];
const seen=new WeakMap();
function mark(el,cls){let s=seen.get(el);if(!s){s=new Set();seen.set(el,s)}if(s.has(cls))return false;s.add(cls);return true}
const mo=new MutationObserver(recs=>{for(const r of recs){
 if(r.type==='attributes'){const el=r.target;if(!(el instanceof HTMLElement))continue;const cl=el.classList;
  if(cl.contains('choice')||cl.contains('sd-btn')){if(cl.contains('correct')&&mark(el,'c')){burst(el);coinTo(el)}else if(cl.contains('wrong')&&mark(el,'w'))shake()}
  else if(cl.contains('bubble')&&cl.contains('pop')&&mark(el,'p'))burst(el,{count:8});
  else if(cl.contains('bubble')&&cl.contains('nope')&&mark(el,'n'))shake();
  else if(cl.contains('match-card')&&cl.contains('ok')&&mark(el,'o'))burst(el,{count:8});
  else if(cl.contains('basket')&&cl.contains('fill')&&mark(el,'f')){burst(el);coinTo(el)}
  else if((cl.contains('sentence-slots')&&cl.contains('solved')||cl.contains('spell-built')&&cl.contains('good')||cl.contains('syl-preview')&&cl.contains('good')||cl.contains('trace-wrap')&&cl.contains('traced'))&&mark(el,'g')){burst(el,{count:14,big:true});coinTo(el)}
  else if(cl.contains('screen')&&cl.contains('active')&&r.oldValue&&!/\bactive\b/.test(r.oldValue)){if(!reduce){cl.remove('fx-enter');void el.offsetWidth;cl.add('fx-enter')}play('whoosh');if(el.id==='worldScreen')popDots()}
 }else if(r.type==='childList'){r.addedNodes.forEach(n=>{if(!(n instanceof HTMLElement))return;const f=n.classList.contains('stage-finish')?n:n.querySelector&&n.querySelector('.stage-finish');if(f)celebrateFinish(f)})}
}});
mo.observe(document.getElementById('app')||document.body,{subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true,childList:true});

/* نقرة صغيرة عند لمس أي زر */
document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('button,.upload-label');if(b&&!b.disabled)play('tap')},{capture:true,passive:true});

/* ---------- الخريطة: نقاط تظهر بالتتابع + غيوم تتحرك ---------- */
function popDots(){if(reduce)return;setTimeout(()=>{document.querySelectorAll('#mapBox .path-dot, #mapBox .station-node').forEach((d,i)=>{d.style.setProperty('--fx-delay',(i*18)+'ms');d.classList.remove('fx-pop');void d.offsetWidth;d.classList.add('fx-pop')})},120)}
function addMapLife(){const m=document.getElementById('mapBox');if(!m||m.querySelector('.fx-clouds'))return;const c=document.createElement('div');c.className='fx-clouds';c.setAttribute('aria-hidden','true');c.innerHTML='<i></i><i></i><i></i>';m.appendChild(c);const s=document.createElement('div');s.className='fx-shine';s.setAttribute('aria-hidden','true');m.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addMapLife);else addMapLife();
})();
