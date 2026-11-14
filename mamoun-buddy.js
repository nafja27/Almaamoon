(()=>{
'use strict';
const API='/api/mamoun-realtime';
const STATUS_API='/api/ai-status';
const MAX_MS=5*60*1000;
let pc=null,dc=null,stream=null,audioEl=null,sessionTimer=null,connected=false,muted=false,lastAssistant='',lastUser='';

function el(tag,cls,html){const x=document.createElement(tag);if(cls)x.className=cls;if(html!=null)x.innerHTML=html;return x}
function safe(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function activeScreen(){return document.querySelector('.screen.active')?.id||''}
function contextText(){
 const screen=activeScreen();
 const bits=[];
 if(screen==='labScreen'){
   bits.push('الطالب الآن في مختبر الحروف.');
   const sel=document.querySelector('.alpha-btn.sel');if(sel)bits.push(`الحرف المختار: ${sel.textContent.trim()}.`);
   const card=document.getElementById('letterCard');
   if(card){const word=card.querySelector('.lc-word .ar-text')?.textContent?.trim();if(word)bits.push(`كلمة المثال الظاهرة: ${word}.`)}
 } else if(screen==='stageScreen'){
   const title=document.getElementById('stageTitle')?.textContent?.trim();
   const coach=document.getElementById('coachText')?.textContent?.trim();
   bits.push('الطالب داخل مهمة تعليمية في المغامرة.');if(title)bits.push(`المهارة الحالية: ${title}.`);if(coach)bits.push(`التوجيه الظاهر: ${coach}.`);
 } else if(screen==='worldScreen'){
   const place=document.getElementById('missionPlace')?.textContent?.trim();const skill=document.getElementById('missionSkill')?.textContent?.trim();
   bits.push('الطالب على خريطة مغامرة المأمون.');if(place)bits.push(`المحطة المحددة: ${place}.`);if(skill)bits.push(`المهارة: ${skill}.`);
 } else if(screen==='writeScreen') bits.push('الطالب في ورشة الكتابة.');
 else if(screen==='checkScreen') bits.push('الطالب في فحص الحروف.');
 else bits.push('الطالب في الصفحة الرئيسية لمغامرة المأمون.');
 return bits.join(' ');
}
function baseInstruction(){return `أنت شخصية "المأمون"، رفيق تعليمي لطفل يتعلم العربية كلغة ثانية داخل منصة مغامرة المأمون. تحدث بالعربية الفصحى المبسطة فقط. لا تستخدم أي لهجة عامية مطلقًا. قل "أهلًا يا بطل" ولا تقل "هلا". استخدم جملًا قصيرة وواضحة ومشجعة، غالبًا جملة أو جملتين فقط. لا تسأل الطفل عن اسمه أو عمره أو مدرسته أو موقعه أو أي معلومة شخصية. لا تناقش موضوعات خارج تعلم العربية؛ أعد الحوار بلطف إلى الحروف والكلمات والجمل والقراءة. افهم الإنجليزية إذا احتاج الطفل إليها، لكن اجعل ردك الأساسي بالعربية، ويمكنك إعطاء كلمة إنجليزية قصيرة جدًا عند الضرورة. عند الخطأ قل مثلًا: "أحسنت المحاولة. استمع مرة أخرى ثم حاول." عند النجاح قل مثلًا: "أحسنت! نطقك واضح." استخدم نبرة دافئة ومرحة وبطيئة نسبيًا تناسب طفلًا في المرحلة الابتدائية. السياق الحالي في المنصة: ${contextText()}`}

const launcher=el('button','mamoun-buddy-launcher','<span class="mb-badge" id="mbAiBadge">AI</span><span class="mb-label" id="mbLauncherLabel">تحدّث مع المأمون AI</span><img src="assets/mascot.webp?v=365" alt="المأمون">');
launcher.type='button';launcher.setAttribute('aria-label','تحدّث مع المأمون');
const backdrop=el('div','mamoun-buddy-backdrop');
backdrop.innerHTML=`<section class="mamoun-buddy-panel" role="dialog" aria-modal="true" aria-label="التحدث مع المأمون">
 <div class="mb-scene">
   <div class="mb-avatar-wrap"><div class="mb-avatar" id="mbAvatar"><img id="mbBuddyImage" src="assets/mascot.webp?v=365" data-full-src="assets/mamoun-buddy.png?v=3610" alt="شخصية المأمون"><span class="mb-mouth"></span></div><span class="mb-listen-ring"></span></div>
   <div class="mb-scene-status" id="mbSceneStatus"><i></i><span>المأمون جاهز للتحدث معك</span></div>
 </div>
 <div class="mb-console">
   <header class="mb-head"><div class="mb-head-mark">🎙️</div><div class="mb-head-copy"><b>تحدّث مع المأمون</b><span>رفيقك الذكي لتعلّم العربية</span></div><button class="mb-close" id="mbClose" aria-label="إغلاق">×</button></header>
   <div class="mb-transcript" id="mbTranscript"><div class="mb-welcome"><h3>أهلًا يا بطل! 👋</h3><p>اضغط «ابدأ الحديث»، ثم تحدث بصورة طبيعية. سيستمع إليك المأمون ويرد عليك بصوته.</p></div></div>
   <footer class="mb-controls"><button class="mb-main-action" id="mbStart">🎙️ <span>ابدأ الحديث</span></button><div class="mb-control-row"><button class="mb-mini" id="mbMute" disabled>🔇 كتم الميكروفون</button><button class="mb-mini" id="mbContext" disabled>✨ ساعدني في هذه المهمة</button></div><div class="mb-privacy"><b>AI</b> صوت المأمون مولّد بالذكاء الاصطناعي. لا يحتاج إلى اسمك أو أي معلومات شخصية. تحدّث فقط عن نشاط التعلّم.</div></footer>
 </div>
 <audio id="mbAudio" autoplay playsinline></audio>
</section>`;
document.body.append(launcher,backdrop);
const $=id=>document.getElementById(id),avatar=$('mbAvatar'),status=$('mbSceneStatus'),transcript=$('mbTranscript'),start=$('mbStart'),mute=$('mbMute'),contextBtn=$('mbContext'),audio=$('mbAudio');audioEl=audio;
const aiBadge=$('mbAiBadge'),launcherLabel=$('mbLauncherLabel');
async function checkAiReady(){
 try{const r=await fetch(STATUS_API,{cache:'no-store'});const j=await r.json();const ok=!!j.ok;launcher.classList.toggle('ai-ready',ok);launcher.classList.toggle('ai-off',!ok);if(aiBadge)aiBadge.textContent=ok?'AI ✓':'AI !';if(launcherLabel)launcherLabel.textContent=ok?'تحدّث مع المأمون AI':'المأمون AI يحتاج تفعيل';return ok}catch{launcher.classList.add('ai-off');if(aiBadge)aiBadge.textContent='AI !';return false}}
checkAiReady();window.addEventListener('maamoon-ai-voice',e=>{const ok=!!e.detail?.ok;launcher.classList.toggle('ai-ready',ok);launcher.classList.toggle('ai-off',!ok);if(aiBadge)aiBadge.textContent=ok?'AI ✓':'AI !'});


function setAvatar(mode){avatar.classList.remove('talking','listening','thinking');if(mode)avatar.classList.add(mode)}
function setStatus(text,kind=''){status.className='mb-scene-status'+(kind?' '+kind:'');status.querySelector('span').textContent=text}
function addMsg(who,text){if(!text||!text.trim())return;const m=el('div','mb-msg '+who,safe(text.trim()));transcript.appendChild(m);transcript.scrollTop=transcript.scrollHeight}
function clearWelcome(){const w=transcript.querySelector('.mb-welcome');if(w)w.remove()}
function send(obj){if(dc?.readyState==='open')dc.send(JSON.stringify(obj))}
function refreshContext(){if(!connected)return;send({type:'session.update',session:{instructions:baseInstruction()}})}
function askContext(){if(!connected)return;refreshContext();send({type:'response.create',response:{instructions:`ساعد الطفل الآن في النشاط الظاهر. ${contextText()} أعط توجيهًا قصيرًا جدًا بالعربية الفصحى، ثم اسأله سؤالًا واحدًا بسيطًا مرتبطًا بالنشاط.`}})}

function onEvent(e){let ev;try{ev=JSON.parse(e.data)}catch{return}
 switch(ev.type){
  case 'session.created':
  case 'session.updated': break;
  case 'input_audio_buffer.speech_started': setAvatar('listening');setStatus('أنا أستمع إليك…','listening');break;
  case 'input_audio_buffer.speech_stopped': setAvatar('thinking');setStatus('أفكر في إجابتك…','live');break;
  case 'conversation.item.input_audio_transcription.completed':
    lastUser=ev.transcript||'';if(lastUser){clearWelcome();addMsg('child',lastUser)}break;
  case 'response.created': setAvatar('thinking');setStatus('أفكر…','live');lastAssistant='';break;
  case 'response.output_audio_transcript.delta':
    lastAssistant+=(ev.delta||'');setAvatar('talking');setStatus('المأمون يتحدث…','live');break;
  case 'response.output_audio_transcript.done':
    if(ev.transcript)lastAssistant=ev.transcript; if(lastAssistant){clearWelcome();addMsg('mamoun',lastAssistant);lastAssistant=''}break;
  case 'response.output_audio.done': setAvatar('');setStatus('تحدّث الآن، أنا أستمع إليك','live');break;
  case 'response.done': if(ev.response?.status==='failed'){addMsg('system','تعذر إكمال الرد. حاول مرة أخرى.');setAvatar('');}break;
  case 'error': addMsg('system','حدث خطأ في الاتصال. جرّب إنهاء الحديث ثم ابدأ من جديد.');setAvatar('');break;
 }
}

async function connect(){
 if(connected)return disconnect();
 start.disabled=true;start.classList.add('connecting');start.querySelector('span').textContent='جاري الاتصال…';setStatus('جاري تجهيز الميكروفون…');
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('microphone_unsupported');
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  pc=new RTCPeerConnection();
  pc.ontrack=e=>{audioEl.srcObject=e.streams[0];audioEl.play().catch(()=>{})};
  stream.getTracks().forEach(t=>pc.addTrack(t,stream));
  dc=pc.createDataChannel('oai-events');dc.addEventListener('message',onEvent);
  dc.addEventListener('open',()=>{
    connected=true;start.disabled=false;start.classList.remove('connecting');start.classList.add('stop');start.innerHTML='⏹️ <span>إنهاء الحديث</span>';mute.disabled=false;contextBtn.disabled=false;setStatus('تحدّث الآن، أنا أستمع إليك','live');
    refreshContext();
    send({type:'response.create',response:{instructions:'ابدأ الجلسة الآن بقول: "أهلًا يا بطل! أنا المأمون. هيا نتعلم العربية معًا. هل أنت مستعد؟" قلها بصوت دافئ وبطيء، ولا تضف سؤالًا آخر.'}});
    clearTimeout(sessionTimer);sessionTimer=setTimeout(()=>{addMsg('system','انتهت جلسة التدريب القصيرة. يمكنك بدء جلسة جديدة متى شئت.');disconnect()},MAX_MS);
  });
  pc.onconnectionstatechange=()=>{if(['failed','closed','disconnected'].includes(pc.connectionState)&&connected)disconnect(false)};
  const offer=await pc.createOffer();await pc.setLocalDescription(offer);
  const res=await fetch(API,{method:'POST',headers:{'content-type':'application/sdp'},body:offer.sdp});
  if(!res.ok){let msg='';try{const j=await res.json();msg=[j.error,j.code,j.detail].filter(Boolean).join(' — ')}catch{}throw new Error(msg||`HTTP_${res.status}`)}
  const answer={type:'answer',sdp:await res.text()};await pc.setRemoteDescription(answer);
 }catch(err){
  cleanup();start.disabled=false;start.classList.remove('connecting','stop');start.innerHTML='🎙️ <span>ابدأ الحديث</span>';setStatus('تعذر بدء المحادثة');
  const m=String(err?.message||err);
  if(m.includes('missing_api_key'))addMsg('system','لم تتم إضافة مفتاح OpenAI إلى Netlify بعد.');
  else if(m.includes('NotAllowedError')||m.includes('Permission'))addMsg('system','اسمح باستخدام الميكروفون من إعدادات المتصفح، ثم حاول مرة أخرى.');
  else if(m.includes('rate_limited'))addMsg('system','تم الوصول إلى حد الاستخدام المؤقت في OpenAI. انتظر قليلًا ثم حاول مرة أخرى.');else if(m.includes('auth_error'))addMsg('system','مفتاح OpenAI غير صالح أو لم يعد نشطًا.');else if(m.includes('permission_error'))addMsg('system','حساب OpenAI لا يملك صلاحية استخدام Realtime حاليًا.');else addMsg('system','تعذر الاتصال بالمأمون الآن. '+m.replace(/openai_realtime_error\s*—?\s*/,'').slice(0,220));
 }
}
function cleanup(){clearTimeout(sessionTimer);sessionTimer=null;try{dc?.close()}catch{};try{pc?.close()}catch{};try{stream?.getTracks().forEach(t=>t.stop())}catch{};pc=dc=stream=null;connected=false;muted=false;setAvatar('')}
function disconnect(showMsg=true){cleanup();start.disabled=false;start.classList.remove('connecting','stop');start.innerHTML='🎙️ <span>ابدأ الحديث</span>';mute.disabled=true;contextBtn.disabled=true;mute.textContent='🔇 كتم الميكروفون';setStatus('المأمون جاهز للتحدث معك');if(showMsg)addMsg('system','تم إنهاء الحديث.')}
function toggleMute(){if(!stream)return;muted=!muted;stream.getAudioTracks().forEach(t=>t.enabled=!muted);mute.textContent=muted?'🎙️ تشغيل الميكروفون':'🔇 كتم الميكروفون';setStatus(muted?'الميكروفون مكتوم':'تحدّث الآن، أنا أستمع إليك',muted?'':'live')}
function open(){backdrop.classList.add('open');document.body.style.overflow='hidden';const img=document.getElementById('mbBuddyImage');if(img&&img.dataset.fullSrc&&img.src.indexOf('mamoun-buddy.png')<0){const full=new Image();full.onload=()=>{img.src=img.dataset.fullSrc};full.src=img.dataset.fullSrc}}
function close(){backdrop.classList.remove('open');document.body.style.overflow='';if(connected)disconnect(false)}
launcher.onclick=open;const heroAiBtn=document.getElementById('heroAiBtn');if(heroAiBtn)heroAiBtn.onclick=open;$('mbClose').onclick=close;backdrop.addEventListener('click',e=>{if(e.target===backdrop)close()});start.onclick=connect;mute.onclick=toggleMute;contextBtn.onclick=askContext;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&backdrop.classList.contains('open'))close()});
// Keep the AI aware of page changes while a session is open.
const obs=new MutationObserver(()=>{if(connected){clearTimeout(obs._t);obs._t=setTimeout(refreshContext,350)}});obs.observe(document.getElementById('app')||document.body,{subtree:true,attributes:true,attributeFilter:['class']});
})();



/* =========================================================
   V36.13 — نقاط المهام + حركة المأمون الحماسية على الخريطة
   هذا الجزء لا يغيّر بيانات الطلبة أو المهام، بل يضيف طبقة لعب مرئية فقط.
   ========================================================= */
(()=>{
'use strict';

const STYLE_ID='mamoun-party-map-v3613';
const css=`
#mapBox .mamoun-token-wrap{
  position:absolute;
  left:48%;top:34%;
  width:calc(var(--mw)*.066);
  height:calc(var(--mw)*.094);
  min-width:52px;min-height:76px;
  transform:translate(-50%,-82%);
  z-index:12;
  pointer-events:none;
  transition:left .9s cubic-bezier(.18,.82,.22,1),top .9s cubic-bezier(.18,.82,.22,1);
  filter:drop-shadow(0 11px 8px rgba(0,0,0,.22));
}
#mapBox .mamoun-token-wrap::after{
  content:"";
  position:absolute;
  left:50%;bottom:1%;
  width:56%;height:9%;
  transform:translateX(-50%);
  border-radius:50%;
  background:rgba(8,39,61,.28);
  filter:blur(2px);
  animation:mamounShadow 1.55s ease-in-out infinite;
  z-index:-1;
}
#mapBox .mamoun-token-wrap::before{
  content:"✨";
  position:absolute;
  right:-12%;top:3%;
  font-size:calc(var(--mw)*.017);
  opacity:0;
  transform:scale(.4) rotate(-20deg);
  z-index:3;
}
#mapBox .mamoun-token-wrap.ready::before{
  animation:mamounSpark 2.6s ease-in-out infinite;
}
#mapBox .mamoun-token-wrap #explorer{
  position:relative!important;
  left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;
  width:100%!important;height:100%!important;
  object-fit:contain!important;
  transform:none!important;
  margin:0!important;
  animation:mamounPartyIdle 1.55s ease-in-out infinite!important;
  filter:brightness(1.04) saturate(1.08) drop-shadow(0 5px 4px rgba(0,0,0,.12))!important;
}
#mapBox .mamoun-token-wrap.moving #explorer{
  animation:mamounPartyMove .30s ease-in-out infinite!important;
}
#mapBox .mamoun-token-wrap.celebrate #explorer{
  animation:mamounPartyWin .9s cubic-bezier(.16,.84,.29,1.25) both!important;
}
#mapBox .mamoun-token-wrap.celebrate::before{
  content:"⭐";
  animation:mamounWinStar .9s ease-out both!important;
}
#mapBox .mamoun-game-mood{
  position:absolute;
  left:50%;top:-18%;
  transform:translate(-50%,-100%) scale(.9);
  min-width:max-content;
  padding:6px 10px;
  border-radius:999px;
  background:rgba(255,255,255,.96);
  border:2px solid #f3c952;
  color:#0d3f65;
  font:900 calc(var(--mw)*.011)/1.1 system-ui,-apple-system,"Noto Sans Arabic",sans-serif;
  box-shadow:0 6px 16px rgba(0,0,0,.18);
  opacity:0;
  transition:.2s ease;
  white-space:nowrap;
}
#mapBox .mamoun-token-wrap.ready .mamoun-game-mood,
#mapBox .mamoun-token-wrap.celebrate .mamoun-game-mood{
  opacity:1;
  transform:translate(-50%,-100%) scale(1);
}
#mapBox .path-dot.stage-checkpoint::after{
  content:attr(data-step);
  position:absolute;
  top:calc(100% + 2px);
  left:50%;
  transform:translateX(-50%);
  min-width:16px;height:16px;
  padding:0 3px;
  display:grid;place-items:center;
  border-radius:999px;
  background:rgba(7,52,82,.88);
  color:#fff;
  border:1px solid rgba(255,255,255,.8);
  font-size:9px;font-weight:900;line-height:1;
  box-shadow:0 2px 5px rgba(0,0,0,.25);
  pointer-events:none;
}
#mapBox .path-dot.current-checkpoint{
  z-index:11;
}
#mapBox .path-dot.current-checkpoint span{
  background:#ffd34f!important;
  color:#614500!important;
  border-color:#fff!important;
  width:30px!important;height:30px!important;
  box-shadow:0 0 0 5px rgba(255,211,79,.34),0 0 0 10px rgba(255,255,255,.18),0 4px 9px rgba(0,0,0,.28)!important;
  animation:checkpointGlow 1.05s ease-in-out infinite!important;
}
#mapBox .path-dot.done span{
  background:#23b764!important;
  border-color:#ecfff4!important;
  color:#fff!important;
}
#mapBox .path-dot.done::after{
  background:#17884a;
}
#mapBox .path-dot.tomorrow span{
  box-shadow:0 0 0 4px rgba(243,201,82,.22),0 3px 8px rgba(0,0,0,.25)!important;
}
#mapBox .path-dot.locked::after{
  opacity:.48;
}
#mapBox .checkpoint-stage-count{
  position:absolute;
  z-index:10;
  transform:translate(-50%,-50%);
  padding:4px 8px;
  border-radius:999px;
  background:rgba(7,52,82,.88);
  color:#fff;
  border:1px solid rgba(255,255,255,.7);
  font-size:10px;
  font-weight:900;
  pointer-events:none;
  box-shadow:0 4px 10px rgba(0,0,0,.18);
}
@keyframes mamounPartyIdle{
  0%,100%{transform:translateY(0) rotate(-1deg) scale(1)}
  22%{transform:translateY(-5px) rotate(1.3deg) scale(1.015)}
  48%{transform:translateY(0) rotate(-.4deg) scale(1)}
  72%{transform:translateY(-3px) rotate(1deg) scale(1.01)}
}
@keyframes mamounPartyMove{
  0%,100%{transform:translateY(0) rotate(-4deg) scale(1.02)}
  50%{transform:translateY(-8px) rotate(4deg) scale(1.045)}
}
@keyframes mamounPartyWin{
  0%{transform:translateY(0) rotate(0) scale(1)}
  28%{transform:translateY(-20px) rotate(-7deg) scale(1.09)}
  52%{transform:translateY(-6px) rotate(7deg) scale(1.06)}
  76%{transform:translateY(-13px) rotate(-3deg) scale(1.08)}
  100%{transform:translateY(0) rotate(0) scale(1)}
}
@keyframes mamounShadow{
  0%,100%{transform:translateX(-50%) scale(1);opacity:.28}
  50%{transform:translateX(-50%) scale(.78);opacity:.16}
}
@keyframes mamounSpark{
  0%,55%,100%{opacity:0;transform:scale(.4) rotate(-20deg)}
  65%{opacity:1;transform:scale(1.12) rotate(8deg)}
  78%{opacity:.8;transform:scale(.86) rotate(-5deg)}
}
@keyframes mamounWinStar{
  0%{opacity:0;transform:translate(0,8px) scale(.4) rotate(-20deg)}
  35%{opacity:1;transform:translate(8px,-10px) scale(1.35) rotate(16deg)}
  100%{opacity:0;transform:translate(22px,-28px) scale(.8) rotate(40deg)}
}
@keyframes checkpointGlow{
  0%,100%{transform:scale(1)}
  50%{transform:scale(1.16)}
}
@media(max-width:700px){
  #mapBox .mamoun-token-wrap{
    width:calc(var(--mw)*.075);
    height:calc(var(--mw)*.106);
    min-width:43px;min-height:62px;
  }
  #mapBox .mamoun-game-mood{font-size:9px;padding:4px 7px}
  #mapBox .path-dot.stage-checkpoint::after{font-size:8px;min-width:13px;height:13px}
  #mapBox .path-dot.current-checkpoint span{width:24px!important;height:24px!important}
}
@media(prefers-reduced-motion:reduce){
  #mapBox .mamoun-token-wrap,#mapBox .mamoun-token-wrap #explorer{transition:none!important;animation:none!important}
}
`;

if(!document.getElementById(STYLE_ID)){
  const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s);
}

let wrap=null, mood=null, lastKey='', syncTimer=null, initialised=false;

function api(){return window.__maamoon||null}
function worldActive(){return document.getElementById('worldScreen')?.classList.contains('active')}
function missionList(){return api()?.MISSIONS||[]}
function student(){try{return api()?.current?.()||null}catch{return null}}

function ensureToken(){
  const map=document.getElementById('mapBox');
  const ex=document.getElementById('explorer');
  if(!map||!ex)return false;
  if(wrap&&wrap.isConnected)return true;

  wrap=document.createElement('div');
  wrap.id='mamounTokenWrap';
  wrap.className='mamoun-token-wrap ready';

  ex.parentNode.insertBefore(wrap,ex);
  wrap.appendChild(ex);

  mood=document.createElement('div');
  mood.className='mamoun-game-mood';
  mood.textContent='جاهز!';
  wrap.appendChild(mood);
  return true;
}

function decorateDots(){
  const dots=[...document.querySelectorAll('#mapBox .path-dot')];
  const ms=missionList();
  let p=0;
  for(let stage=0;stage<Math.min(8,ms.length);stage++){
    for(let mi=0;mi<ms[stage].length;mi++){
      const d=dots[p++];
      if(!d)continue;
      d.classList.add('stage-checkpoint');
      d.dataset.stage=String(stage);
      d.dataset.mission=String(mi);
      d.dataset.step=String(mi+1);
      d.dataset.total=String(ms[stage].length);
    }
  }
}

function elementXY(el){
  if(!el)return null;
  if(el.classList.contains('station-node')){
    const x=parseFloat(el.style.getPropertyValue('--x'));
    const y=parseFloat(el.style.getPropertyValue('--y'));
    return Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null;
  }
  const x=parseFloat(el.style.left),y=parseFloat(el.style.top);
  return Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null;
}

function targetForProgress(){
  const s=student();
  if(!s)return null;
  const stage=Math.min(Number(s.stage)||0,8);

  if(stage>=8){
    return document.querySelector('#mapBox .station-node[data-stage="8"]');
  }

  let t=document.querySelector(`#mapBox .path-dot.next[data-stage="${stage}"]`);
  if(!t)t=document.querySelector(`#mapBox .path-dot.tomorrow[data-stage="${stage}"]`);
  if(!t)t=document.querySelector(`#mapBox .path-dot:not(.done)[data-stage="${stage}"]`);
  if(!t)t=document.querySelector(`#mapBox .station-node[data-stage="${stage}"]`);
  return t;
}

function moodText(target){
  if(!target)return 'هيا!';
  if(target.classList.contains('tomorrow'))return 'نواصل غدًا 🌙';
  if(target.classList.contains('station-node')&&target.dataset.stage==='8')return 'إلى الكنز! ⭐';
  const n=Number(target.dataset.step||0),total=Number(target.dataset.total||0);
  return n&&total?`المهمة ${n} من ${total} ✨`:'جاهز!';
}

function targetKey(target){
  if(!target)return '';
  if(target.classList.contains('station-node'))return 'station-'+target.dataset.stage;
  return `stage-${target.dataset.stage}-mission-${target.dataset.mission}`;
}

function celebrate(){
  if(!wrap)return;
  wrap.classList.remove('moving','ready','celebrate');
  void wrap.offsetWidth;
  wrap.classList.add('celebrate');
  setTimeout(()=>{if(wrap){wrap.classList.remove('celebrate');wrap.classList.add('ready')}},950);
}

function moveTo(target,{celebrateChange=true}={}){
  if(!ensureToken()||!target)return;
  const p=elementXY(target);if(!p)return;

  document.querySelectorAll('#mapBox .path-dot.current-checkpoint').forEach(d=>d.classList.remove('current-checkpoint'));
  if(target.classList.contains('path-dot'))target.classList.add('current-checkpoint');

  const key=targetKey(target);
  const changed=!!lastKey&&key!==lastKey;

  if(mood)mood.textContent=moodText(target);
  wrap.classList.remove('ready','celebrate');
  wrap.classList.add('moving');
  wrap.style.left=p.x+'%';
  wrap.style.top=p.y+'%';

  clearTimeout(wrap._moveTimer);
  wrap._moveTimer=setTimeout(()=>{
    if(!wrap)return;
    wrap.classList.remove('moving');
    wrap.classList.add('ready');
    if(changed&&celebrateChange)celebrate();
  },920);

  if(!lastKey)wrap.classList.add('ready');
  lastKey=key;
}

function sync(){
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>{
    if(!worldActive())return;
    if(!ensureToken())return;
    decorateDots();
    moveTo(targetForProgress());
  },60);
}

function watch(){
  const app=document.getElementById('app')||document.body;
  const map=document.getElementById('mapBox');
  if(!map)return setTimeout(watch,250);

  const mo=new MutationObserver(sync);
  mo.observe(map,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});

  const screenObs=new MutationObserver(sync);
  screenObs.observe(app,{subtree:true,attributes:true,attributeFilter:['class']});

  map.addEventListener('click',e=>{
    const d=e.target.closest?.('.path-dot');
    if(!d||d.classList.contains('locked'))return;
    if(d.classList.contains('next')||d.classList.contains('tomorrow')){
      moveTo(d,{celebrateChange:false});
    }
  },true);

  window.addEventListener('resize',sync,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(sync,250),{passive:true});
  sync();
  setTimeout(sync,500);
  setTimeout(sync,1200);
  initialised=true;
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
else watch();
})();
