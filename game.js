/* مغامرة المأمون V30 — المحرك التعليمي
   مصمم للطلبة غير الناطقين بالعربية: دعم إنجليزي اختياري، نطق بالحروف اللاتينية،
   صور بدل الشرح، تقييم حقيقي بدل التقييم الذاتي، ومستوى تكيفي لكل مهارة. */
(function(){
'use strict';
const C=window.MAAMOON_CONTENT;
/* إعدادات قاعدة البيانات (assets/config.js) — إذا كانت فارغة تعمل اللعبة محليًا */
const CFG=window.MAAMOON_CONFIG||{};const CLOUD=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey);var cloudReadyFlag=false;
const {BANK,DIAG,FINAL,LEVELS,ALPHABET,VOCAB,WRITING}=C;

/* مفاتيح الحفظ لم تتغير عمدًا حتى تبقى بيانات الطلبة من النسخ السابقة */
const DB_KEY='almaamoon_v26_db',SESSION_KEY='almaamoon_v26_session',SETTINGS_KEY='almaamoon_v26_settings';

const STAGES=[
 {zone:'عالم الحروف',zoneEn:'Letter World',place:'قلعة البحرين',skill:'الحروف والحركات والمدود',skillEn:'Letters, short & long vowels',key:'letters',icon:'<span class="ab-icon" aria-hidden="true">أ ب ت</span>',reward:'🔑',rewardName:'مفتاح الحروف',canDo:'أستطيع أن أميّز الحروف والحركات والمدود الأساسية.',canDoEn:'I can recognise letters, short vowels and long vowels.',desc:'استمع إلى الحرف أو المقطع ثم اختره.',descEn:'Listen to the letter or syllable, then choose it.'},
 {zone:'عالم الحروف',zoneEn:'Letter World',place:'باب البحرين',skill:'الأصوات المتشابهة',skillEn:'Similar sounds',key:'sounds',icon:'🎙️',reward:'🎧',rewardName:'وسام الأذن الذهبية',canDo:'أستطيع أن أميّز بين الأصوات العربية المتشابهة.',canDoEn:'I can hear the difference between similar Arabic sounds.',desc:'تسمع صوتًا واحدًا من زوج متشابه. أيّهما سمعت؟',descEn:'You hear one sound from a similar pair. Which one was it?'},
 {zone:'عالم الكلمات',zoneEn:'Word World',place:'متحف البحرين الوطني',skill:'قراءة الكلمات',skillEn:'Reading words',key:'wordReading',icon:'📖',reward:'📘',rewardName:'مفتاح الكلمات',canDo:'أستطيع أن أقرأ كلمات مألوفة بنفسي.',canDoEn:'I can read familiar words by myself.',desc:'اقرأ الكلمة بنفسك. المس الحروف لتسمعها.',descEn:'Read the word yourself. Tap the letters to hear them.'},
 {zone:'عالم الكلمات',zoneEn:'Word World',place:'شجرة الحياة',skill:'معنى الكلمات',skillEn:'Word meaning',key:'wordMeaning',icon:'🌳',reward:'🌱',rewardName:'بذرة المفردات',canDo:'أستطيع أن أفهم معنى كلمات مألوفة.',canDoEn:'I understand the meaning of familiar words.',desc:'طابق الكلمة بصورتها.',descEn:'Match each word to its picture.'},
 {zone:'عالم الجمل',zoneEn:'Sentence World',place:'جسر الملك فهد',skill:'بناء الجملة',skillEn:'Building sentences',key:'sentenceBuild',icon:'🧩',reward:'🌉',rewardName:'مفتاح الجملة',canDo:'أستطيع أن أبني جملة عربية قصيرة صحيحة.',canDoEn:'I can build a short, correct Arabic sentence.',desc:'رتّب الكلمات لتكوين الجملة.',descEn:'Put the words in the right order.'},
 {zone:'عالم الجمل',zoneEn:'Sentence World',place:'مركز البحرين التجاري العالمي',skill:'الاستماع إلى الجمل',skillEn:'Listening to sentences',key:'sentenceListen',icon:'🎧',reward:'🏙️',rewardName:'وسام المستمع',canDo:'أستطيع أن أفهم جملًا قصيرة أسمعها.',canDoEn:'I can understand short sentences I hear.',desc:'استمع إلى الجملة واختر الصورة أو المعنى.',descEn:'Listen to the sentence and choose the picture or meaning.'},
 {zone:'عالم الجمل',zoneEn:'Sentence World',place:'حلبة البحرين الدولية',skill:'سباق الجمل',skillEn:'Sentence race',key:'sentenceOrder',icon:'🏎️',reward:'🏆',rewardName:'كأس السباق',canDo:'أستطيع أن أرتب الجملة بسرعة ودقة.',canDoEn:'I can order a sentence quickly and correctly.',desc:'ابنِ الجملة قبل أن تصل السيارة المنافسة.',descEn:'Build the sentence before the other car finishes.'},
 {zone:'عالم الجمل',zoneEn:'Sentence World',place:'مسرح البحرين الوطني',skill:'القراءة والفهم',skillEn:'Reading & understanding',key:'fluency',icon:'🎭',reward:'🗝️',rewardName:'المفتاح الذهبي',canDo:'أستطيع أن أقرأ نصًا قصيرًا وأفهمه.',canDoEn:'I can read a short text and understand it.',desc:'اقرأ النص، المس أي كلمة لتسمعها، ثم أجب.',descEn:'Read the text, tap any word to hear it, then answer.'},
 {zone:'كنز الطلاقة',zoneEn:'Fluency Treasure',place:'قصر كنز الطلاقة',skill:'المهمة النهائية',skillEn:'Final mission',key:'treasure',icon:'👑',reward:'🎓',rewardName:'شهادة فارس الطلاقة',canDo:'أستخدم كل ما تعلمته في مهمة واحدة.',canDoEn:'I use everything I learned in one mission.',desc:'قياس نهائي يقارن مستواك الآن ببدايتك.',descEn:'A final check that compares you now with when you started.'}
];
/* ===== المهام: كل محطة مقسمة إلى مهام بأنشطة مختلفة، حتى يمتد البرنامج على أسابيع =====
   k = المهارة التي تُحتسب لها المهمة — gate = بوابة مراجعة لا تُفتح إلا في يوم لاحق */
const MISSIONS=[
 [{t:'letters',k:'letters',n:'اسمع واختر الحرف',en:'Listen and choose',i:'🎧'},{t:'hunt',k:'letters',n:'صيد الحروف',en:'Letter hunt',i:'🎯'},{t:'syllable',k:'letters',n:'ركّب الصوت',en:'Build the sound',i:'🧱'},{t:'inword',k:'letters',n:'أين الحرف في الكلمة؟',en:'Where is the letter?',i:'🔍'}],
 [{t:'samediff',k:'sounds',n:'نفس الصوت أم مختلف؟',en:'Same or different?',i:'👂'},{t:'sounds',k:'sounds',n:'أي صوت سمعت؟',en:'Which sound?',i:'🎙️'},{t:'sort',k:'sounds',n:'سلّتا الأصوات',en:'Sound baskets',i:'🧺'},{t:'review',k:'letters',zone:'letters',gate:true,n:'بوابة عالم الكلمات',en:'Gate to Word World',i:'🚪'}],
 [{t:'wordReading',k:'wordReading',n:'اقرأ واختر الصورة',en:'Read and choose',i:'📖'},{t:'hearword',k:'wordReading',n:'أي كلمة سمعت؟',en:'Which word did you hear?',i:'👂'}],
 [{t:'wordMeaning',k:'wordMeaning',n:'الكلمة والصورة',en:'Word and picture',i:'🖼️'},{t:'bigmatch',k:'wordMeaning',n:'المطابقة الكبرى',en:'Big matching game',i:'🧠'},{t:'review',k:'wordReading',zone:'words',gate:true,n:'بوابة عالم الجمل',en:'Gate to Sentence World',i:'🚪'}],
 [{t:'sentenceBuild',k:'sentenceBuild',n:'رتّب الكلمات',en:'Order the words',i:'🧩'},{t:'sentenceBuild',k:'sentenceBuild',n:'جمل جديدة',en:'New sentences',i:'✨'}],
 [{t:'sentenceListen',k:'sentenceListen',n:'استمع واختر',en:'Listen and choose',i:'🎧'},{t:'sentenceListen',k:'sentenceListen',n:'استماع جديد',en:'More listening',i:'✨'}],
 [{t:'sentenceOrder',k:'sentenceOrder',n:'السباق الأول',en:'First race',i:'🏎️'},{t:'sentenceOrder',k:'sentenceOrder',n:'سباق البطولة',en:'Championship race',i:'🏁'}],
 [{t:'fluency',k:'fluency',n:'النص الأول',en:'First text',i:'📖'},{t:'fluency',k:'fluency',n:'النص الثاني',en:'Second text',i:'🎭'}],
 [{t:'treasure',k:'fluency',gate:true,n:'المهمة النهائية',en:'Final mission',i:'👑'}]
];
const MISSION_TOTAL=MISSIONS.reduce((a,m)=>a+m.length,0);
const SKILL_NAMES={letters:'الحروف والحركات والمدود',sounds:'تمييز الأصوات',pronunciation:'النطق',wordReading:'قراءة الكلمات',wordMeaning:'فهم المفردات',sentenceBuild:'بناء الجملة',sentenceListen:'الاستماع للجمل',sentenceOrder:'ترتيب الجملة',fluency:'القراءة والفهم',writing:'الكتابة'};
const SKILL_EN={letters:'Letters',sounds:'Sounds',pronunciation:'Speaking',wordReading:'Word reading',wordMeaning:'Vocabulary',sentenceBuild:'Sentences',sentenceListen:'Listening',sentenceOrder:'Sentence race',fluency:'Reading',writing:'Writing'};
const PRAISE=[['أَحْسَنْتَ!','Well done!'],['مُمْتَاز!','Excellent!'],['رَائِع!','Great!'],['بَطَل!','Champion!'],['صَحِيح!','Correct!']];
const RETRY=[['لَا بَأْسَ، هَذِهِ هِيَ الإِجَابَةُ.','That\'s okay — here is the answer.'],['اسْتَمِعْ مَرَّةً أُخْرَى.','Listen once more.']];

/* ================= البيانات ================= */
let settings=load(SETTINGS_KEY,{sound:true});
let db=load(DB_KEY,null)||{counter:1,admins:[{user:'admin',pin:'1234'}],students:[],audioLibrary:{}};
db.pacing=db.pacing||{perDay:2};
db.admins=db.admins&&db.admins.length?db.admins:[{user:'admin',pin:'1234'}];
db.audioLibrary=db.audioLibrary||{};db.students=db.students||[];
db.students.forEach(ensureLearnerShape);
let session=load(SESSION_KEY,null);
let selectedStage=0,combo=0,activeTimers=[];

function load(k,fallback){try{const v=JSON.parse(localStorage.getItem(k));return v??fallback}catch{return fallback}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){flash('⚠️ مساحة التخزين ممتلئة. احذف بعض التسجيلات الصوتية أو صدّر نسخة احتياطية.')}}
function persist(){save(DB_KEY,CLOUD?Object.assign({},db,{audioLibrary:{}}):db);save(SESSION_KEY,session);save(SETTINGS_KEY,settings);if(CLOUD&&cloudReadyFlag)scheduleSync()}
function current(){const s=session&&session.role==='student'?db.students.find(x=>x.id===session.id):null;if(s)ensureLearnerShape(s);return s}
function blankStudent(name,grade,section,pin,support){db.counter=(db.counter||0)+1;const s={id:'s'+Date.now()+Math.random().toString(36).slice(2,6),name,grade:+grade,section:section||'أ',code:'MAM-'+String(db.counter).padStart(3,'0'),pin:pin||String(Math.floor(1000+Math.random()*9000)),diagnosticDone:false,baseline:null,cefr:'Pre-A1',tier:0,stage:0,completed:Array(8).fill(false),mastery:{letters:0,sounds:0,pronunciation:0,wordReading:0,wordMeaning:0,sentenceBuild:0,sentenceListen:0,sentenceOrder:0,fluency:0},points:0,attempts:{},errors:{},supports:{},lastLogin:new Date().toISOString(),graduated:false,certificate:'',progressChecks:[],support:support||'en',translit:(support||'en')==='en'};ensureLearnerShape(s);return s}
function ensureLearnerShape(s){if(!s)return;s.errors=s.errors||{};s.supports=s.supports||{};s.attempts=s.attempts||{};s.progressChecks=s.progressChecks||[];s.stars=s.stars||Array(9).fill(0);s.skillTier=s.skillTier||{};if(!s.support)s.support='en';if(typeof s.translit!=='boolean')s.translit=s.support==='en';s.mastery=s.mastery||{};s.completed=s.completed||Array(8).fill(false);s.missions=s.missions||{};s.mDates=s.mDates||{};s.dayLog=s.dayLog||{};
 /* الطلبة من النسخ السابقة: المحطات المكتملة تُعدّ مهامها كلها مكتملة */
 MISSIONS.forEach((ms,i)=>{const done=i<8?s.completed[i]:s.graduated;if(done&&!s.missions[i]){const sc=[80,80,90,100][s.stars&&s.stars[i]||0]||80;s.missions[i]=ms.map(()=>sc);s.mDates[i]=ms.map(()=>'2000-01-01')}})}
function ensureDemo(){if(CLOUD)return;if(!db.students.length){const s=blankStudent('طالب تجريبي',3,'أ','1111','en');s.code='MAM-001';db.counter=Math.max(db.counter,1);db.students.push(s);persist()}}
ensureDemo();

/* ================= أدوات ================= */
const HARAKAT=/[\u064B-\u0652\u0670]/g;
function esc(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function norm(t){return String(t||'').replace(HARAKAT,'').replace(/ـ/g,'').replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[،,.؟?!]/g,'').replace(/\s+/g,' ').trim()}
function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
function sample(a,n){return shuffle(a).slice(0,n)}
/* اختيار ذكي: يفضّل الأسئلة التي لم يرها الطالب في الجولات الأخيرة */
function itemId(x){return typeof x==='string'?x:(x.s||x.q||x.text||(x.w&&x.w.join(' '))||x.f||JSON.stringify(x)).slice(0,60)}
function freshSample(key,pool,n,remember=true){const s=current();if(!s)return sample(pool,n);s.recent=s.recent||{};const rec=s.recent[key]||[];const fresh=shuffle(pool.filter(x=>!rec.includes(itemId(x)))),seen=shuffle(pool.filter(x=>rec.includes(itemId(x))));const pick=[...fresh,...seen].slice(0,n);if(remember){s.recent[key]=[...pick.map(itemId),...rec].slice(0,Math.max(0,pool.length-n));persist()}return pick}
function $(id){return document.getElementById(id)}
function later(fn,ms){const t=setTimeout(fn,ms);activeTimers.push(t);return t}
function clearTimers(){activeTimers.forEach(t=>{clearTimeout(t);clearInterval(t)});activeTimers=[]}
function graphemes(w){const g=[];[...w].forEach(c=>{if(/[\u064B-\u0652\u0670]/.test(c)&&g.length)g[g.length-1]+=c;else if(c!==' ')g.push(c)});return g}
function baseLetter(t){const c=norm(t)[0]||'';return c}

/* النطق بالحروف اللاتينية (يُولَّد تلقائيًا من النص المشكول) */
const TR={'ء':"'",'أ':"'",'إ':"'",'ؤ':"'",'ئ':"'",'ب':'b','ت':'t','ث':'th','ج':'j','ح':'ḥ','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'ṣ','ض':'ḍ','ط':'ṭ','ظ':'ẓ','ع':'ʿ','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','ة':'h','و':'w','ي':'y','ى':'a','ا':'a','آ':"'aa"};
const SUN='تثدذرزسشصضطظلن';
function translit(text){
 if(!/[\u064B-\u0652]/.test(text))return '';
 return String(text).split(/\s+/).map(tw=>{
  const w=tw.replace(/[،.؟!؛:]/g,'');const punct=tw.slice(w.length).replace('؟','?').replace('،',',');
  const g=[];[...w].forEach(c=>{if(/[\u064B-\u0652\u0670]/.test(c)&&g.length)g[g.length-1].d+=c;else g.push({c,d:''})});
  let out='',i=0,pv='';
  if(g.length>2&&g[0].c==='ا'&&g[1].c==='ل'&&!g[0].d.includes('ْ')){const nx=g[2];if(nx.d.includes('ّ')&&SUN.includes(nx.c)){out+='a'+TR[nx.c]+'-';g[2]={c:nx.c,d:nx.d.replace('ّ','')}}else out+='al-';i=2}
  for(;i<g.length;i++){const {c,d}=g[i];const last=i===g.length-1;
   const fat=d.includes('َ'),kas=d.includes('ِ'),dam=d.includes('ُ'),sh=d.includes('ّ'),tA=d.includes('ً'),tU=d.includes('ٌ'),tI=d.includes('ٍ');const bare=!fat&&!kas&&!dam&&!sh&&!tA&&!tU&&!tI;
   let cons='';
   if(c==='ا'){if(i===0&&!d&&g[1]&&g[1].d.includes('ْ')){out+='i';pv='';continue}if(pv==='a'){out+='a';pv='aa';continue}if(tA||(last&&pv==='an'))continue;if(i!==0){out+='aa';pv='aa';continue}}
   else if(c==='ى'){out+=pv==='a'?'a':'aa';pv='aa';continue}
   else if(c==='و'&&bare&&pv==='u'){out+='u';pv='uu';continue}
   else if(c==='ي'&&bare&&pv==='i'){out+='i';pv='ii';continue}
   else if(c==='ة'){out+=tA?'tan':tU?'tun':tI?'tin':fat?'ta':dam?'tu':kas?'ti':'';pv='';continue}
   else if(c==='آ'){out+=(i===0?'':"'")+'aa';pv='aa';continue}
   else if(c==='أ'||c==='إ'){cons=i===0?'':"'";if(c==='إ'&&!kas){out+=cons+'i';pv='i';continue}}
   else if(c==='ي'&&last&&sh&&pv==='i'){out+='i';continue}
   else cons=TR[c]!==undefined?TR[c]:c;
   out+=cons+(sh?cons:'');
   if(fat){out+='a';pv='a'}else if(kas){out+='i';pv='i'}else if(dam){out+='u';pv='u'}else if(tA){out+='an';pv='an'}else if(tU){out+='un';pv='un'}else if(tI){out+='in';pv='in'}else pv='';
  }
  return out+punct}).join(' ');
}
/* مقاطع العرض ثنائية اللغة: gloss = ترجمة داعمة، tl = نطق لاتيني */
function G(en){return en?`<span class="gloss" dir="ltr">${esc(en)}</span>`:''}
function TL(ar){const t=translit(ar);return t?`<span class="tl" dir="ltr">${esc(t)}</span>`:''}
function applyLearnerPrefs(){const s=current();document.body.classList.toggle('help-on',!s||s.support==='en');document.body.classList.toggle('tl-on',!!(s&&s.translit));document.querySelectorAll('[data-toggle="help"]').forEach(b=>{b.classList.toggle('on',!s||s.support==='en');b.setAttribute('aria-pressed',String(!s||s.support==='en'))});document.querySelectorAll('[data-toggle="tl"]').forEach(b=>{b.classList.toggle('on',!!(s&&s.translit));b.setAttribute('aria-pressed',String(!!(s&&s.translit)))})}
function toggleHelp(){const s=current();if(!s)return;s.support=s.support==='en'?'off':'en';persist();applyLearnerPrefs();flash(s.support==='en'?'English help: ON':'مساعدة الإنجليزية: مُغلقة')}
function toggleTranslit(){const s=current();if(!s)return;s.translit=!s.translit;persist();applyLearnerPrefs();flash(s.translit?'Sound spelling: ON (kitaab)':'النطق اللاتيني: مُغلق')}

/* ================= الصوت ================= */
let arabicVoice=null;
function pickVoice(){if(!('speechSynthesis'in window))return;const vs=speechSynthesis.getVoices();const ar=vs.filter(v=>/^ar(?:[-_]|$)/i.test(v.lang));arabicVoice=ar.find(v=>/^ar[-_]SA/i.test(v.lang)&&v.localService)||ar.find(v=>/^ar[-_]SA/i.test(v.lang))||ar.find(v=>v.localService)||ar[0]||null}
if('speechSynthesis'in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function hasArabicVoice(){return true}
function audioKey(text){return String(text||'').normalize('NFC').replace(/\s+/g,' ').trim()}
function recordedAudio(text){const lib=db.audioLibrary||{};const k=audioKey(text);if(lib[k])return lib[k];const old=norm(text);return old.length>2?lib[old]:null}
let currentAudio=null,aiTtsCtx=null,aiTtsSource=null,aiTtsAbort=null,audioRunId=0;
const aiTtsCache=new Map();
function getAiTtsCtx(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;if(!aiTtsCtx)aiTtsCtx=new A();return aiTtsCtx}
function stopAudio(){audioRunId++;if(aiTtsAbort){try{aiTtsAbort.abort()}catch{}aiTtsAbort=null}if(aiTtsSource){try{aiTtsSource.stop()}catch{}aiTtsSource=null}if(currentAudio){try{currentAudio.pause()}catch{}currentAudio=null}if('speechSynthesis'in window)speechSynthesis.cancel()}
function isLongVowelSyllable(text){const t=audioKey(text);return /^[ء-ي][ُ]و$/u.test(t)||/^[ء-ي][ِ]ي$/u.test(t)}
function browserSpeak(clean,rate=.85,onEnd){if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance(clean);u.lang=arabicVoice?arabicVoice.lang:'ar-SA';u.rate=Math.max(.62,rate);u.pitch=1;u.volume=1;if(arabicVoice)u.voice=arabicVoice;if(onEnd){let fired=false;const fin=()=>{if(!fired){fired=true;onEnd()}};u.onend=fin;u.onerror=fin}speechSynthesis.speak(u)}else if(onEnd)later(onEnd,600)}
async function aiSpeak(clean,slow,onEnd,runId){const key=(slow?'S|':'N|')+clean;try{let buf=aiTtsCache.get(key);if(!buf){const ctl=new AbortController();aiTtsAbort=ctl;const r=await fetch('/api/mamoun-tts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:clean,slow:!!slow}),signal:ctl.signal});if(!r.ok)throw new Error('tts_'+r.status);buf=await r.arrayBuffer();if(aiTtsCache.size>80)aiTtsCache.delete(aiTtsCache.keys().next().value);aiTtsCache.set(key,buf.slice(0))}if(runId!==audioRunId)return;const ctx=getAiTtsCtx();if(!ctx)throw new Error('no_audio_context');if(ctx.state==='suspended')await ctx.resume();const decoded=await ctx.decodeAudioData(buf.slice(0));if(runId!==audioRunId)return;const src=ctx.createBufferSource();src.buffer=decoded;src.connect(ctx.destination);aiTtsSource=src;src.onended=()=>{if(runId!==audioRunId)return;aiTtsSource=null;if(onEnd)onEnd()};src.start(0)}catch(e){if(e&&e.name==='AbortError')return;if(runId!==audioRunId)return;browserSpeak(clean,slow?.68:.85,onEnd)}}
function speak(text,rate=.85,onEnd){if(!settings.sound||!text){if(onEnd)later(onEnd,50);return}const clean=audioKey(text);if(rate<=.55&&!onEnd)return speakSlow(clean);stopAudio();const runId=audioRunId;const src=recordedAudio(clean);if(src){try{currentAudio=new Audio(src);currentAudio.playbackRate=isLongVowelSyllable(clean)?1:Math.max(.7,Math.min(1.12,rate/.85));if(onEnd)currentAudio.onended=onEnd;currentAudio.play().catch(()=>browserSpeak(clean,rate,onEnd));return}catch{}}return aiSpeak(clean,rate<.7,onEnd,runId)}
/* iPad/iPhone: نفتح AudioContext عند أول لمسة حتى يمكن تشغيل صوت OpenAI بعد اكتمال الشبكة. */
function unlockAudio(){try{const c=getAiTtsCtx();if(c&&c.state==='suspended')c.resume();if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}const A=window.AudioContext||window.webkitAudioContext;if(A){beep.ctx=beep.ctx||new A();if(beep.ctx.state==='suspended')beep.ctx.resume()}}catch{}}
['pointerdown','touchend','click'].forEach(t=>document.addEventListener(t,unlockAudio,{once:true,capture:true}));
function speakSeries(items,rate=.8,onEach,gap){if(!settings.sound||!items||!items.length)return;const pause=gap||(rate<=.6?500:220);let i=0;const next=()=>{if(i>=items.length){if(onEach)onEach(i);return}if(onEach)onEach(i);const t=items[i++];speak(t,rate,()=>later(next,pause))};next()}
/* «ببطء» في V36.8 يستخدم نطقًا فصيحًا بطيئًا طبيعيًا من OpenAI بدل تشويه سرعة Safari. */
function syllables(w){const out=[];graphemes(w).forEach(g=>{const vowel=/[َُِ]/.test(g)&&!/ْ/.test(g);if(vowel||!out.length)out.push(g);else out[out.length-1]+=g});return out}
function speakSlow(text){const t=audioKey(text);if(!t||!settings.sound)return;stopAudio();const runId=audioRunId;const src=recordedAudio(t);if(src){try{currentAudio=new Audio(src);currentAudio.playbackRate=.78;currentAudio.play().catch(()=>browserSpeak(t,.68));return}catch{}}return aiSpeak(t,true,null,runId)}
function readButtons(box,texts){const btns=[...box.querySelectorAll('.choice')];speakSeries(texts,.78,i=>btns.forEach((b,j)=>b.classList.toggle('speaking',j===i)))}

/* ================= واجهة ================= */
function show(id){clearTimers();stopAudio();document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');window.scrollTo(0,0);applyLearnerPrefs()}
function overlay(html){$('overlayCard').innerHTML=html;$('overlay').classList.remove('hidden');const f=$('overlayCard').querySelector('input,button');if(f)f.focus()}
function closeOverlay(){$('overlay').classList.add('hidden')}
function flash(msg){const x=document.createElement('div');x.className='flash-msg';x.setAttribute('role','status');x.textContent=msg;document.body.appendChild(x);setTimeout(()=>x.remove(),2600)}
function beep(ok){if(!settings.sound)return;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=beep.ctx||(beep.ctx=new A());const notes=ok?[660,880]:[260,200];notes.forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=f;o.type=ok?'sine':'triangle';const t=c.currentTime+i*.09;g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.start(t);o.stop(t+.17)})}catch{}}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const box=document.createElement('div');box.className='confetti';const bits=['⭐','✨','🎉','🟡','🔵','🟢'];for(let i=0;i<36;i++){const s=document.createElement('span');s.textContent=bits[i%bits.length];s.style.left=Math.random()*100+'%';s.style.animationDelay=Math.random()*.6+'s';s.style.animationDuration=(1.6+Math.random()*1.2)+'s';box.appendChild(s)}document.body.appendChild(box);setTimeout(()=>box.remove(),3400)}
function coach(ar,en,mood){const t=$('coachTitle'),x=$('coachText');if(!t)return;t.innerHTML=esc(ar);x.innerHTML=G(en);const img=document.querySelector('.coach img');if(img&&mood){img.classList.remove('happy','think');void img.offsetWidth;img.classList.add(mood)}}
function refreshHud(){const s=current();if(!s)return;const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};set('hudName',s.name);set('hudGrade',s.grade);set('hudPoints',s.points);set('hudKeys',keys(s));set('hudLevel',s.cefr);set('stagePoints',s.points);set('writePoints',s.points);set('checkPoints',s.points)}
function setCombo(n){combo=n;const p=$('comboPill');if(!p)return;p.hidden=n<2;p.querySelector('b').textContent=n;if(n>=2){p.classList.remove('pop');void p.offsetWidth;p.classList.add('pop')}}
/* نقاط: 10 لكل إجابة صحيحة من أول مرة + مكافأة سلسلة */
function reward(ok,firstTry=true){const s=current();if(!s)return;if(ok&&firstTry){setCombo(combo+1);s.points+=10+(combo>=3?5:0)}else if(!ok)setCombo(0);persist();refreshHud()}
function praise(){const p=PRAISE[Math.floor(Math.random()*PRAISE.length)];coach(p[0],p[1],'happy');return p}

/* ================= المستوى والإتقان ================= */
function cefrFrom(n){let x='Pre-A1';LEVELS.forEach(l=>{if(n>=l.min)x=l.name});return x}
/* النطق والكتابة لا يدخلان المتوسط إلا بعد أن يجرّبهما الطالب */
/* النطق بالميكروفون أُزيل من اللعبة، فلا يدخل في أي متوسط أو تقرير */
function scoredSkills(s){return Object.keys(SKILL_NAMES).filter(k=>k!=='pronunciation'&&(k!=='writing'||(s.attempts&&s.attempts[k])))}
/* المهارة التي لم يتدرب عليها الطالب بعد تُقدَّر بنتيجة نطاقها في التشخيص، حتى لا يظهر «تراجع» غير حقيقي */
const DOMAIN_OF={letters:'letters',sounds:'letters',wordReading:'words',wordMeaning:'words',sentenceBuild:'sentences',sentenceListen:'sentences',sentenceOrder:'sentences',fluency:'sentences'};
function effMastery(s,k){const v=+s.mastery[k]||0;if(s.attempts&&s.attempts[k])return v;const d=s.baseline&&s.baseline.domains&&DOMAIN_OF[k]?s.baseline.domains[DOMAIN_OF[k]]:0;return Math.max(v,d||0)}
function overall(s){const ks=scoredSkills(s);return ks.length?Math.round(ks.reduce((a,k)=>a+effMastery(s,k),0)/ks.length):0}
function keys(s){return s.completed.filter(Boolean).length}
function tierFor(key){const s=current();const t=s.skillTier[key];return Math.max(0,Math.min(3,t==null?(s.tier||0):t))}
function logError(skill,item){const s=current();if(!s)return;s.errors[skill]=s.errors[skill]||{};const k=norm(item||'خطأ')||String(item);s.errors[skill][k]=(s.errors[skill][k]||0)+1;persist()}
function addAttempt(skill){const s=current();if(!s)return;s.attempts[skill]=(s.attempts[skill]||0)+1;persist()}
function weakestSkill(s){ensureLearnerShape(s);const e=scoredSkills(s).map(k=>[k,SKILL_NAMES[k],s.mastery[k]||0]);e.sort((a,b)=>a[2]-b[2]);return e[0]}
const SUPPORT_TIPS={letters:'تدريب سمعي يومي قصير على الحرف والحركة بخيارين فقط، مع مختبر الحروف.',sounds:'تمييز أزواج الأصوات المتشابهة ببطء، ثم نطقها أمام المعلم.',pronunciation:'استماع ثم تسجيل النطق ومقارنته بالنموذج.',wordReading:'تفكيك الكلمة حرفًا حرفًا بلمس الحروف ثم قراءتها كاملة.',wordMeaning:'ربط الكلمة بالصورة ثم استخدامها في جملة قصيرة.',sentenceBuild:'بناء جمل من 3 كلمات ثم زيادة الطول تدريجيًا.',sentenceListen:'الاستماع إلى جمل قصيرة مرتين ثم اختيار الصورة.',sentenceOrder:'ترتيب الجمل دون مؤقت ثم العودة إلى السباق.',fluency:'قراءة نص قصير مكررة مع لمس الكلمات الصعبة، ثم أسئلة الفهم.',writing:'تتبّع الحرف في مختبر الحروف ثم تهجئة كلمات من 3 حروف.'};
function supportRecommendation(s){const [k,n]=weakestSkill(s);return `${n}: ${SUPPORT_TIPS[k]||'تدريب موجّه قصير ثم إعادة القياس.'}`}
function supportCount(s){return Object.values(s.supports||{}).reduce((a,b)=>a+(+b||0),0)}
function updateSkill(key,correct,total){const s=current();const score=Math.round(correct/Math.max(1,total)*100);const old=s.mastery[key]||0;s.mastery[key]=Math.max(old,Math.round(old*.35+score*.65));s.cefr=cefrFrom(overall(s));persist();updateStageMastery(key);return score}
function updateStageMastery(key){const s=current(),v=s.mastery[key]||0;$('stageMastery').textContent=v+'%';$('skillBar').style.width=v+'%';$('skillStatus').innerHTML=(v>=90?'أتقنتها بثبات ⭐':v>=80?'أتقنت المهارة ✅':v>=60?'في طور الإتقان 🟡':'تحتاج إلى تدريب 🔁')+G(v>=80?'Mastered':v>=60?'Almost there':'Keep practising')}
function recordMic(ok){const s=current();if(!s)return;s.attempts.pronunciation=(s.attempts.pronunciation||0)+1;s.micOk=(s.micOk||0)+(ok?1:0);s.mastery.pronunciation=Math.round(s.micOk/s.attempts.pronunciation*100);if(ok){s.points+=5;refreshHud()}persist()}

/* ================= عرض الخيارات (نص أو صورة) ================= */
/* opts: نص عربي أو {e:'🍎'} — withAudio: زر استماع بجانب كل خيار نصي */
function renderOptions(box,opts,{withAudio=true,onPick,cls='',tl=true}={}){
 box.innerHTML='';box.className='choice-grid'+(opts.length===2?' two':'')+(cls?' '+cls:'');
 const buttons=[];
 opts.forEach((o,idx)=>{
  const wrap=document.createElement('div');wrap.className='choice-wrap';
  const b=document.createElement('button');b.type='button';
  if(typeof o==='object'&&o.t){b.className='choice ar';b.innerHTML=`<span class="opt-pic" aria-hidden="true">${o.e}</span><span class="ar-text">${esc(o.t)}</span>${tl?TL(o.t):''}`}
  else if(typeof o==='object'){b.className='choice pic';b.innerHTML=`<span class="pic-emoji" aria-hidden="true">${o.e}</span>`;b.setAttribute('aria-label',o.en||o.w||'صورة '+(idx+1))}
  else{b.className='choice ar';b.innerHTML=`<span class="ar-text">${esc(o)}</span>${tl?TL(o):''}`}
  b.onclick=()=>{if(b.disabled)return;onPick(idx,b,buttons)};
  wrap.appendChild(b);buttons.push(b);
  const say=typeof o==='object'?(o.t||o.w):o;
  if(withAudio&&say){const a=document.createElement('button');a.type='button';a.className='choice-audio';a.textContent='🔊';a.setAttribute('aria-label','استمع');a.onclick=e=>{e.stopPropagation();speak(say,.78)};wrap.appendChild(a)}
  box.appendChild(wrap)});
 return buttons;
}
function lockAndMark(buttons,picked,answer,noTL){buttons.forEach(b=>{b.disabled=true;const t=b.querySelector('.ar-text');if(!noTL&&t&&!b.querySelector('.tl')){const x=TL(t.textContent);if(x)t.insertAdjacentHTML('afterend',x)}});buttons[picked].classList.add(picked===answer?'correct':'wrong');if(picked!==answer)buttons[answer].classList.add('reveal')}
function nextButton(host,label,fn){const b=document.createElement('button');b.className='big-btn primary next-btn';b.innerHTML=`${label||'التالي'} <span class="gloss-inline" dir="ltr">Next</span> ◀`;b.onclick=fn;host.appendChild(b);b.focus();return b}
function progressDots(i,n){return `<div class="mini-dots" aria-label="${i+1} / ${n}">${Array.from({length:n},(_,k)=>`<span class="${k<i?'done':k===i?'current':''}"></span>`).join('')}</div>`}
function activityHead(title,titleEn,i,n,tag){return `<div class="activity-title">${tag?`<div class="cefr-tag">${tag}</div>`:''}<h2>${esc(title)}</h2>${G(titleEn)}${n?progressDots(i,n):''}</div>`}

/* ================= الحسابات ================= */
function startLogin(){overlay(`<h2>دخول الطالب</h2>${G('Student login')}<div class="form-field"><label for="loginCode">رمز الطالب <small dir="ltr">Student code</small></label><input id="loginCode" autocomplete="off" placeholder="MAM-001" dir="ltr"></div><div class="form-field"><label for="loginPin">الرقم السري <small dir="ltr">PIN</small></label><input id="loginPin" type="password" inputmode="numeric" autocomplete="off" dir="ltr"></div><div class="form-actions"><button class="big-btn ghost" id="cancelOverlay">إلغاء</button><button class="big-btn primary" id="doLogin">دخول</button></div>`);$('cancelOverlay').onclick=closeOverlay;const go=()=>{const code=toLatinDigits($('loginCode').value).trim().toUpperCase(),pin=toLatinDigits($('loginPin').value).trim();
 if(CLOUD){const btn=$('doLogin');btn.disabled=true;btn.textContent='...';cloudStudentLogin(code,pin).then(s=>{closeOverlay();if(s.pinPrompt||(s.pinDefault&&s.pinPrompt!==false))askPinChoice(s,afterLogin);else afterLogin()}).catch(e=>{btn.disabled=false;btn.textContent='دخول';flash(cloudMsg(e))});return}
 const s=db.students.find(x=>x.code.toUpperCase()===code&&x.pin===pin);if(!s)return flash('بيانات الدخول غير صحيحة — Wrong code or PIN');session={role:'student',id:s.id};s.lastLogin=new Date().toISOString();persist();closeOverlay();if(s.pinPrompt)askPinChoice(s,afterLogin);else afterLogin()};$('doLogin').onclick=go;$('loginPin').onkeydown=e=>{if(e.key==='Enter')go()}}
function createAccount(){if(CLOUD){overlay(`<div class="center"><div class="big-emoji">👩‍🏫</div><h2>حسابات الطلبة تُنشأ من المعلمة</h2>${G('Your teacher creates student accounts.')}<p>اطلب من معلمتك رمز الطالب والرقم السري، ثم اضغط «دخول الطالب».</p>${G('Ask your teacher for your student code and PIN, then tap Student login.')}<div class="form-actions center-row"><button class="big-btn ghost" id="cancelOverlay">إغلاق</button><button class="big-btn primary" id="goLogin">دخول الطالب ▶</button></div></div>`);$('cancelOverlay').onclick=closeOverlay;$('goLogin').onclick=startLogin;return}overlay(`<h2>حساب طالب جديد</h2>${G('New student')}<div class="form-field"><label for="newName">اسم الطالب <small dir="ltr">Name</small></label><input id="newName"></div><div class="form-row"><div class="form-field"><label for="newGrade">الصف <small dir="ltr">Grade</small></label><select id="newGrade">${[1,2,3,4,5,6].map(g=>`<option value="${g}">${g}</option>`).join('')}</select></div><div class="form-field"><label for="newSection">الشعبة</label><input id="newSection" value="أ"></div></div><div class="form-field"><label for="newSupport">لغة المساعدة <small dir="ltr">Help language</small></label><select id="newSupport"><option value="en">English — تظهر ترجمة ونطق لاتيني</option><option value="off">بدون — عربي فقط</option></select></div><div class="form-field"><label for="newPin">رقم سري من 4 أرقام <small dir="ltr">4-digit PIN</small></label><input id="newPin" inputmode="numeric" maxlength="4" placeholder="اتركه فارغًا ليُنشأ تلقائيًا" dir="ltr"></div><div class="form-actions"><button class="big-btn ghost" id="cancelOverlay">إلغاء</button><button class="big-btn gold" id="doCreate">إنشاء وبدء الاختبار</button></div>`);$('cancelOverlay').onclick=closeOverlay;$('doCreate').onclick=()=>{const name=$('newName').value.trim();if(!name)return flash('اكتب اسم الطالب');let pin=$('newPin').value.trim();if(pin&&!/^\d{4}$/.test(pin))return flash('الرقم السري يجب أن يكون 4 أرقام');const s=blankStudent(name,$('newGrade').value,$('newSection').value.trim(),pin,$('newSupport').value);db.students.push(s);session={role:'student',id:s.id};persist();$('overlayCard').innerHTML=`<div class="center"><div class="big-emoji">🎉</div><h2>تم إنشاء الحساب</h2>${G('Your account is ready. Write down your code and PIN.')}<div class="id-card"><span>رمز الطالب<b dir="ltr">${esc(s.code)}</b></span><span>الرقم السري<b dir="ltr">${esc(s.pin)}</b></span></div><button class="big-btn primary" id="startDiagNow">ابدأ الاختبار القصير ▶</button></div>`;$('startDiagNow').onclick=()=>{closeOverlay();startDiagnostic()}}}
function afterLogin(){const s=current();logActivity(s);persist();refreshHud();applyLearnerPrefs();if(!s.diagnosticDone)startDiagnostic();else{prepareWorld();show('worldScreen')}}

/* ================= عنصر سؤال عام (للتشخيص والقياس النهائي) ================= */
function renderItem(host,item,onAnswer){
 const isPic=typeof item.show==='string'&&!/[\u0600-\u06FF]/.test(item.show);
 host.innerHTML=`<h2 class="q-ar">${esc(item.q)}</h2>${G(item.en)}${item.show?`<div class="activity-target ${isPic?'pic-target':''}"><span class="ar-text">${esc(item.show)}</span></div>`:`<div class="activity-target listen-target" aria-hidden="true">🎧</div>`}${item.speak?`<div class="sound-actions"><button class="control-btn" data-hear>🔊 استمع</button><button class="control-btn" data-slow>🐢 ببطء</button></div>`:''}<div class="choice-grid" data-choices></div><div class="feedback" data-feed>${item.speak?'استمع جيدًا ثم اختر.':'اقرأ بنفسك ثم اختر.'}${G(item.speak?'Listen carefully, then choose.':'Read by yourself, then choose.')}</div>`;
 const hear=host.querySelector('[data-hear]'),slow=host.querySelector('[data-slow]');
 if(hear){hear.onclick=()=>speak(item.speak,.78);slow.onclick=()=>speak(item.speak,.5)}
 /* في أسئلة الحروف لا نقرأ الخيارات حتى لا تتحول إلى مطابقة صوتية */
 const optAudio=item.domain!=='letters'&&!!item.speak;
 const btns=renderOptions(host.querySelector('[data-choices]'),item.opts,{withAudio:optAudio,tl:false,onPick:(idx)=>{const ok=idx===item.ans;lockAndMark(btns,idx,item.ans,true);beep(ok);const f=host.querySelector('[data-feed]');f.innerHTML=ok?'أحسنت! '+G('Well done!'):'لا بأس. '+G('That\'s okay.');later(()=>onAnswer(ok),ok?700:1100)}});
 if(item.speak)later(()=>speak(item.speak,.8),350);
}

/* ================= الاختبار التشخيصي ================= */
let diagIndex=0,diagScore={},diagSeen={};
function startDiagnostic(){diagIndex=0;diagScore={letters:0,words:0,sentences:0};diagSeen={letters:0,words:0,sentences:0};show('diagnosticScreen');$('diagGuideText').innerHTML='استمع جيدًا. لا بأس إن لم تعرف الإجابة — هذا الاختبار يختار لك التدريب المناسب.'+G('Listen carefully. It\'s okay not to know — this check finds the right starting point for you.');renderDiag()}
function renderDiag(){const item=DIAG[diagIndex];$('diagCount').textContent=(diagIndex+1)+'/'+DIAG.length;$('diagDots').innerHTML=DIAG.map((_,i)=>`<span class="${i<diagIndex?'done':i===diagIndex?'current':''}"></span>`).join('');updateDiagMeters();renderItem($('diagItem'),item,ok=>{diagSeen[item.domain]++;if(ok)diagScore[item.domain]++;else logError('diagnostic-'+item.domain,item.speak||item.show||item.q);updateDiagMeters();diagIndex++;if(diagIndex>=DIAG.length)finishDiagnostic();else renderDiag()})}
function updateDiagMeters(){[['letters','meterLetters'],['words','meterWords'],['sentences','meterSentences']].forEach(([d,id])=>{const p=diagSeen[d]?Math.round(diagScore[d]/diagSeen[d]*100):0;$(id).style.width=p+'%'})}
function finishDiagnostic(){const s=current();const per=d=>Math.round(diagScore[d]/DIAG.filter(x=>x.domain===d).length*100);const domains={letters:per('letters'),words:per('words'),sentences:per('sentences')};const total=Math.round((domains.letters+domains.words+domains.sentences)/3);const t=total<35?0:total<55?1:total<75?2:3;s.baseline={date:new Date().toISOString(),domains,total};s.tier=t;
 /* كل مهارة تبدأ من مستوى نطاقها في التشخيص */
 const dt=p=>p<35?0:p<55?1:p<80?2:3;s.skillTier={letters:dt(domains.letters),sounds:dt(domains.letters),wordReading:dt(domains.words),wordMeaning:dt(domains.words),sentenceBuild:dt(domains.sentences),sentenceListen:dt(domains.sentences),sentenceOrder:dt(domains.sentences),fluency:Math.min(dt(domains.words),dt(domains.sentences)),writing:Math.min(dt(domains.letters),dt(domains.words),2)};
 s.cefr=cefrFrom(total);s.diagnosticDone=true;/* الطالب الضعيف جدًا في الحروف يمر بفحص الحروف الـ28 قبل المحطة الأولى */if(domains.letters<50&&!s.completed[0])s.letterCheck=true;s.stage=0;s.mastery.letters=Math.min(70,domains.letters);s.mastery.wordReading=Math.min(60,domains.words);s.mastery.sentenceBuild=Math.min(50,domains.sentences);persist();
 overlay(`<div class="center"><div class="big-emoji">🎯</div><h2>اكتمل الاختبار!</h2>${G('Check complete!')}<div class="path-preview center-row"><span><span class="ab-icon" aria-hidden="true">أ ب ت</span> الحروف ${domains.letters}%</span><span>🧩 الكلمات ${domains.words}%</span><span>💬 الجمل ${domains.sentences}%</span></div><p>مستواك الآن: <b dir="ltr">${s.cefr}</b></p><div class="support-box">سنبدأ دائمًا من <b>الحروف</b> ثم الكلمات ثم الجمل، وصعوبة الأسئلة تناسب مستواك. تنتقل إلى المحطة التالية عندما تحصل على 80% أو أكثر.${G('We always start with letters, then words, then sentences. Questions match your level. Score 80% to open the next station.')}</div><button class="big-btn primary" id="openWorld">ابدأ الرحلة ▶</button></div>`);$('openWorld').onclick=()=>{closeOverlay();prepareWorld();show('worldScreen')}}


/* ================= الخريطة ================= */
function stageUnlocked(s,i){if(i===0)return true;if(i===8)return s.completed.every(Boolean);return !!s.completed[i-1]}
function starText(n){return '★'.repeat(n)+'☆'.repeat(3-n)}
function drawLearningRoute(){const line=$('learningRouteLine');if(!line)return;line.setAttribute('points',[...document.querySelectorAll('.station-node')].map(n=>`${parseFloat(n.style.getPropertyValue('--x'))},${parseFloat(n.style.getPropertyValue('--y'))}`).join(' '))}
function prepareWorld(){const s=current();if(!s)return show('startScreen');refreshHud();requestAnimationFrame(fitMap);drawLearningRoute();
 document.querySelectorAll('.station-node').forEach((n,i)=>{const unlocked=stageUnlocked(s,i);n.classList.toggle('locked',!unlocked);n.classList.toggle('done',i<8&&s.completed[i]);n.classList.toggle('current',i===s.stage&&unlocked);n.disabled=!unlocked;n.setAttribute('aria-label',STAGES[i].place+' — '+STAGES[i].skill+(unlocked?'':' (مقفلة)'));let st=n.querySelector('.node-stars');if(!st){st=document.createElement('i');st.className='node-stars';n.appendChild(st)}st.textContent=s.stars[i]?starText(s.stars[i]):'';let md=n.querySelector('.node-missions');if(!md){md=document.createElement('i');md.className='node-missions';n.appendChild(md)}md.textContent='';n.onclick=()=>selectStage(i,true)});
 selectStage(Math.min(s.stage,8),false);setupPanelToggle();requestAnimationFrame(drawPathDots);
 document.querySelectorAll('.game-nav button').forEach(b=>{b.classList.toggle('active',b.dataset.tab==='world');b.onclick=()=>navTab(b.dataset.tab)});
 $('profileChip').onclick=showProfile;$('worldSoundBtn').textContent=settings.sound?'🔊':'🔇';$('worldSoundBtn').onclick=()=>{settings.sound=!settings.sound;persist();$('worldSoundBtn').textContent=settings.sound?'🔊':'🔇';beep(true)}}
function selectStage(i,move){const s=current();if(!stageUnlocked(s,i))return;selectedStage=i;const st=STAGES[i];$('missionZone').innerHTML=esc(st.zone)+G(st.zoneEn);$('missionPlace').textContent=st.place;$('missionSkill').innerHTML=esc(st.skill)+G(st.skillEn);$('missionDesc').innerHTML=esc(st.desc)+G(st.descEn);$('missionCanDo').innerHTML='🎯 '+esc(st.canDo)+G(st.canDoEn);$('missionReward').innerHTML=`${st.reward} ${esc(st.rewardName)}${s.stars[i]?` <span class="mission-stars">${starText(s.stars[i])}</span>`:''}`;renderMissionList(i);if(i===0&&needsLetterCheck(s)){$('missionCanDo').innerHTML+=`<div class="lc-mini"><span class="ab-icon" aria-hidden="true">أ ب ت</span> فحص الحروف أولًا: تعرف <b>${knownCount(s)}</b> من 28 — تحتاج ${LC_TARGET} ${G('Letter check first')}</div>`}if(move){moveExplorer(i);sparkAtNode(i);if(i!==8)speak(st.skill,.85)}}
function moveExplorer(i){const n=document.querySelector(`.station-node[data-stage="${i}"]`),ex=$('explorer');ex.style.left=n.style.getPropertyValue('--x');ex.style.top=n.style.getPropertyValue('--y')}
function sparkAtNode(i){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const n=document.querySelector(`.station-node[data-stage="${i}"]`),box=$('sparkles');for(let k=0;k<10;k++){const s=document.createElement('span');s.className='spark';s.textContent=k%2?'✨':'⭐';s.style.left=`calc(${n.style.getPropertyValue('--x')} + ${(Math.random()*50-25)}px)`;s.style.top=`calc(${n.style.getPropertyValue('--y')} + ${(Math.random()*40-20)}px)`;box.appendChild(s);setTimeout(()=>s.remove(),1000)}}
function launchStage(i,mi,force){const s=current();if(i===0&&needsLetterCheck(s))return openLetterCheck();
 if(mi==null&&!force){mi=nextMi(s,i);if(mi<0)mi=Math.floor(Math.random()*MISSIONS[i].length);const a=missionAccess(s,i,mi);
  if(!a.ok){/* إذا كانت المهمة الجديدة غير متاحة اليوم، نعطيه تدريبًا على مهمة أتقنها */const done=MISSIONS[i].map((_,k)=>k).filter(k=>mDone(s,i,k)&&!MISSIONS[i][k].gate);if(done.length){mi=done[Math.floor(Math.random()*done.length)];flash('تدريب على مهمة أتقنتها — Practice round')}else{if(a.tomorrow)return startPractice(i,a);if(!$('worldScreen').classList.contains('active')){prepareWorld();show('worldScreen')}selectStage(i,false);return flash(a.why)}}}
 selectedStage=i;curMi=mi;const st=STAGES[i],m=MISSIONS[i][mi];show('stageScreen');$('stageIcon').innerHTML=st.icon;$('stageTitle').innerHTML=esc(m.n)+`<small class="gloss" dir="ltr">${esc(m.en)} · ${esc(st.skillEn)}</small>`;coach(st.canDo,st.canDoEn);seedParticles(i);setCombo(0);renderStageActivity()}
function seedParticles(i){const box=$('stageParticles');box.innerHTML='';const pools=[['بَ','تُ','مِ','سَ'],['ح','ع','ق','ص'],['كِتَاب','قَلَم','بَاب','بَيْت'],['🌳','🏫','📘','🚌'],['أَنَا','أُحِبُّ','مَدْرَسَتِي'],['🎧','💬','✨'],['🏎️','⚡','🏁'],['📖','🎭','⭐'],['👑','🏆','🎓']];(pools[i]||pools[0]).forEach((t,j)=>{const p=document.createElement('span');p.className='particle';p.textContent=t;p.style.left=(10+j*22)+'%';p.style.animationDelay=(j*1.2)+'s';p.style.animationDuration=(6+j)+'s';box.appendChild(p)})}
function renderStageActivity(ctx={}){clearTimers();stopAudio();const m=curMission();updateStageMastery(m.k);const map={letters:actLetters,sounds:actSounds,wordReading:actWordReading,wordMeaning:actWordMeaning,sentenceBuild:actBuild,sentenceListen:actListen,sentenceOrder:actRace,fluency:actReading,treasure:actFinal,hunt:actHunt,syllable:actSyllable,inword:actInWord,samediff:actSameDiff,sort:actSort,hearword:actHearWord,bigmatch:actBigMatch,review:actReview};(map[m.t]||actLetters)(ctx)}
function board(){return $('activityBoard')}
/* المشتتات من النوع نفسه: اسم مع اسم، فعل مع فعل، صفة مع صفة */
const ADJ=['كَبِير','صَغِير','حَارّ','بَارِد','سَعِيد','حَزِين','سَرِيع','بَطِيء'];
function kindOf(w){return (VOCAB[w]&&VOCAB[w].k)||'n'}
function sameKind(w){const k=kindOf(w);return Object.keys(VOCAB).filter(x=>x!==w&&kindOf(x)===k)}
function endActivity(key,correct,total,ctx){if(ctx.remedial)remedialDone(key);else finishStage(key,correct,total)}
/* في التدريب العلاجي نقلل الخيارات إلى اثنين */
function trimOpts(opts,ans,ctx){if(!ctx.remedial||opts.length<=2)return{opts,ans};const other=shuffle(opts.map((_,i)=>i).filter(i=>i!==ans))[0];const keep=shuffle([ans,other]);return{opts:keep.map(i=>opts[i]),ans:keep.indexOf(ans)}}
/* إذا عنده حروف ضعيفة من فحص الحروف، نضع حتى سؤالين عنها في الجولة */
function boostWeak(src,pool){const s=current();if(!s||!s.letterMap)return src;const weak=new Set(ALPHABET.map(L=>L.l).filter(l=>{const st=letterStatus(s,l);return st==='weak'||st==='learning'}));if(!weak.size)return src;const cand=shuffle(pool.filter(x=>!src.includes(x)&&weak.has(baseLetter(x.s))));let k=0;for(let j=0;j<src.length&&k<2&&cand.length;j++){if(!weak.has(baseLetter(src[j].s))){src[j]=cand.pop();k++}}return src}
function shuffleOpts(opts,ans){const idx=shuffle(opts.map((_,i)=>i));return{opts:idx.map(i=>opts[i]),ans:idx.indexOf(ans)}}

/* ================= مشغّل أسئلة الاختيار من متعدد ================= */
/* item: {prompt,en,target,speak,opts,ans,optAudio,reveal,log,practice} */
function runMCQ(key,items,ctx,title,titleEn,onDone){
 let i=0,correct=0;
 function draw(){
  const x=items[i];const b=board();
  b.innerHTML=activityHead(title,titleEn,i,items.length,ctx.remedial?'🛟 تدريب علاجي':'المستوى '+(tierFor(key)+1))+
   `<p class="prompt-ar">${esc(x.prompt)}</p>${G(x.en)}<div class="activity-target ${x.targetClass||''}" data-target>${x.target}</div>`+
   `<div class="sound-actions">${x.speak?`<button class="control-btn" data-hear>🔊 استمع</button><button class="control-btn" data-slow>🐢 ببطء</button>`:''}${x.readOpts?`<button class="control-btn" data-readopts>🔊 اقرأ الخيارات</button>`:''}</div><div data-choices></div><div class="feedback" data-feed>${x.speak?'استمع ثم اختر.':'اختر الإجابة.'}${G(x.speak?'Listen, then choose.':'Choose the answer.')}</div><div class="after-actions" data-after></div>`;
  const q=s=>b.querySelector(s);
  if(x.speak){q('[data-hear]').onclick=()=>speak(x.speak,.78);q('[data-slow]').onclick=()=>speak(x.speak,.5)}
  const box=q('[data-choices]');
  const btns=renderOptions(box,x.opts,{withAudio:x.optAudio!==false,tl:x.optTL!==false,onPick:(idx)=>{
   const ok=idx===x.ans;lockAndMark(btns,idx,x.ans);beep(ok);reward(ok);
   if(x.reveal)q('[data-target]').innerHTML=x.reveal;
   const feed=q('[data-feed]'),afterBox=q('[data-after]');
   if(ok){correct++;const p=praise();feed.innerHTML=`<b>${p[0]}</b>${G(p[1])}`;feed.className='feedback good'}
   else{logError(key,x.log||x.speak||x.prompt);const r=RETRY[0];coach(r[0],r[1],'think');feed.innerHTML=`${r[0]}${G(r[1])}`;feed.className='feedback bad';if(x.answerSpeak)later(()=>speak(x.answerSpeak,.7),350)}
   const go=()=>{i++;if(i<items.length)draw();else if(onDone)onDone(correct,items.length);else endActivity(key,correct,items.length,ctx)};
   if(ok)later(go,1000);else nextButton(afterBox,'',go);
  }});
  if(x.readOpts)q('[data-readopts]').onclick=()=>readButtons(box,x.readOpts);
  if(x.speak&&x.autoplay!==false)later(()=>speak(x.speak,.78),350);
 }
 draw();
}

/* ================= 1) الحروف والحركات ================= */
function lettersItems(t,n,ctx){let pool=[...BANK.letters[t]];const longBank=[{s:'بَا',o:['بَ','بَا','بُو']},{s:'بُو',o:['بُ','بُو','بِي']},{s:'بِي',o:['بِ','بِي','بَا']},{s:'مَا',o:['مَ','مَا','مُو']},{s:'مُو',o:['مُ','مُو','مِي']},{s:'مِي',o:['مِ','مِي','مَا']},{s:'سَا',o:['سَ','سَا','سُو']},{s:'سُو',o:['سُ','سُو','سِي']},{s:'سِي',o:['سِ','سِي','سَا']}];if(!ctx.remedial)pool=pool.concat(longBank);if(ctx.remedial)pool=pool.filter(x=>!x.q);const src=boostWeak(freshSample('letters'+t,pool,n,!ctx.remedial),pool);
 const items=src.map(x=>{let ans;if(x.q==='begins')ans=x.o.findIndex(o=>baseLetter(o.w)===baseLetter(x.s));else{ans=x.o.indexOf(x.s);if(ans<0)ans=x.o.findIndex(o=>norm(o)===norm(x.s))}
  let {opts,ans:a}=shuffleOpts(x.o,ans);({opts,ans:a}=trimOpts(opts,a,ctx));
  const begins=x.q==='begins';
  return{prompt:begins?'أَيُّ صُورَةٍ تَبْدَأُ بِهَذَا الصَّوْتِ؟':'اسْتَمِعْ، ثُمَّ اخْتَرِ الحَرْفَ.',en:begins?'Which picture starts with this sound?':'Listen, then choose the letter.',target:'🎧',targetClass:'listen-target',speak:x.s,opts,ans:a,optAudio:begins,optTL:false,answerSpeak:begins?opts[a].w:x.s,
   reveal:begins?`<span class="ar-text">${esc(x.s)}</span>${TL(x.s)}<span class="reveal-word">${opts[a].e} ${esc(opts[a].w)}</span>`:`<span class="ar-text">${esc(x.s)}</span>${TL(x.s)}`,log:x.s}});
 return items}
function actLetters(ctx){const t=ctx.remedial?0:tierFor('letters');runMCQ('letters',lettersItems(t,ctx.remedial?3:6,ctx),ctx,'الحروف والحركات والمدود','Letters, short & long vowels')}

/* ================= 2) الأصوات المتشابهة ================= */
function soundsItems(t,n,ctx){const pairs=freshSample('sounds'+t,BANK.sounds[t],n,!ctx.remedial);
 const items=pairs.map(p=>{const target=p[Math.floor(Math.random()*p.length)];const shown=shuffle(p);const tr=trimOpts(shown.map(w=>BANK.soundPics[w]?{t:w,e:BANK.soundPics[w]}:w),shown.indexOf(target),ctx);
  return{prompt:'أَيَّ صَوْتٍ سَمِعْتَ؟',en:'Which sound did you hear?',target:'👂',targetClass:'listen-target',speak:target,opts:tr.opts,ans:tr.ans,optAudio:true,optTL:false,answerSpeak:target,practice:target,
   reveal:`<span class="ar-text">${esc(target)}</span>${TL(target)}<button class="control-btn compare-btn" data-compare="${esc(p.join('|'))}">🎧 قارن ${p.map(esc).join(' / ')}</button>`,log:p.join('/')}});
 return items}
function actSounds(ctx){const t=ctx.remedial?0:tierFor('sounds');runMCQ('sounds',soundsItems(t,ctx.remedial?3:6,ctx),ctx,'الأصوات المتشابهة','Similar sounds');bindCompare()}
function bindCompare(){const b=board();if(b._cmp)return;b._cmp=true;b.addEventListener('click',e=>{const c=e.target.closest('[data-compare]');if(c)speakSeries(c.dataset.compare.split('|'),.55)})}

/* ================= 3) قراءة الكلمات — يقرأ الطالب بنفسه ثم نتحقق ================= */
function actWordReading(ctx){const t=ctx.remedial?0:tierFor('wordReading');const list=BANK.wordReading[t];const words=freshSample('wordReading'+t,list,ctx.remedial?3:6,!ctx.remedial);let i=0,score=0;
 function draw(){const w=words[i];const v=VOCAB[w];let helped=false,answered=false;const b=board();
  const gs=graphemes(w);
  b.innerHTML=activityHead('اقْرَأِ الكَلِمَةَ','Read the word',i,words.length,ctx.remedial?'🛟 تدريب علاجي':'المستوى '+(t+1))+
   `<p class="prompt-ar">اقْرَأْ بِنَفْسِكَ. المِسْ أَيَّ حَرْفٍ لِتَسْمَعَهُ.</p>${G('Read it yourself. Tap any letter to hear it.')}`+
   `<div class="word-reader"><div class="letter-tiles" dir="rtl">${gs.map((g,k)=>`<button class="letter-tile" data-k="${k}">${esc(g)}</button>`).join('')}</div><div class="activity-target small" data-target><span class="ar-text">${esc(w)}</span></div></div>`+
   `<div class="sound-actions"><button class="control-btn" data-blend>🧩 ادمج الحروف</button><button class="control-btn help-btn" data-help>💡 اسمع الكلمة</button></div>`+
   `<p class="prompt-ar small">${v?'أَيُّ صُورَةٍ هِيَ؟':'أَيُّ صَوْتٍ هُوَ هَذِهِ الكَلِمَةُ؟'}</p>${G(v?'Which picture is it?':'Which recording matches the word?')}<div data-choices></div><div class="feedback" data-feed>${ctx.remedial?'':'بدون مساعدة = نقطة كاملة ⭐'}${G(ctx.remedial?'':'No help = full point ⭐')}</div><div class="after-actions" data-after></div>`;
  const q=s=>b.querySelector(s);
  /* لمس الحرف: إذا كان عليه حركة نسمعه وحده، وإلا نسمع الكلمة حتى هذا الحرف (دمج تدريجي) */
  b.querySelectorAll('.letter-tile').forEach(tile=>tile.onclick=()=>{const k=+tile.dataset.k;const g=gs[k];tile.classList.add('lit');setTimeout(()=>tile.classList.remove('lit'),600);const vowel=/[َُِ]/.test(g);speak(vowel?g:gs.slice(0,k+1).join(''),.6)});
  q('[data-blend]').onclick=()=>{const parts=[];for(let k=1;k<=gs.length;k++)parts.push(gs.slice(0,k).join(''));const tiles=[...b.querySelectorAll('.letter-tile')];speakSeries(parts,.55,n=>tiles.forEach((tl,j)=>tl.classList.toggle('lit',j<n)))};
  q('[data-help]').onclick=()=>{helped=true;q('[data-help]').classList.add('used');speak(w,.6)};
  const box=q('[data-choices]');let opts,ans;
  if(v){const others=sample(sameKind(w).filter(k=>VOCAB[k].e!==v.e),ctx.remedial?1:2);const all=shuffle([w,...others]);opts=all.map(k=>({e:VOCAB[k].e,en:VOCAB[k].en}));ans=all.indexOf(w);
   const btns=renderOptions(box,opts,{withAudio:false,onPick:idx=>pick(idx,btns)})}
  else{/* بطاقات صوتية: يسمع الطالب ثلاث كلمات ويختار التي تطابق المكتوب */
   const others=sample(list.filter(k=>k!==w),ctx.remedial?1:2);const all=shuffle([w,...others]);ans=all.indexOf(w);
   box.className='choice-grid audio-cards';box.innerHTML='';const btns=[];
   all.forEach((k,idx)=>{const card=document.createElement('div');card.className='audio-card';card.innerHTML=`<button class="control-btn" data-play>🔊 ${idx+1}</button><button class="choice pick" data-pick>✓ هَذِهِ</button>`;card.querySelector('[data-play]').onclick=()=>{box.querySelectorAll('.audio-card').forEach(c=>c.classList.remove('playing'));card.classList.add('playing');speak(k,.7)};const pb=card.querySelector('[data-pick]');pb.onclick=()=>pick(idx,btns);btns.push(pb);box.appendChild(card)})}
  function pick(idx,btns){if(answered)return;answered=true;const ok=idx===ans;lockAndMark(btns,idx,ans);beep(ok);reward(ok,!helped);
   const credit=ok?(helped?.5:1):0;score+=credit;const feed=q('[data-feed]');
   q('[data-target]').innerHTML=`<span class="ar-text">${esc(w)}</span>${TL(w)}${v?G(v.e+' '+v.en):''}`;
   if(ok){const p=praise();feed.innerHTML=`<b>${p[0]}</b> ${helped?'(بمساعدة)':'⭐'}${G(p[1])}`;feed.className='feedback good'}
   else{logError('wordReading',w);feed.innerHTML='هذه هي الكلمة. استمع واقرأها معي.'+G('Here is the word. Listen and read it with me.');feed.className='feedback bad'}
   later(()=>speak(w,.65),300);const af=q('[data-after]');nextButton(af,'',()=>{i++;if(i<words.length)draw();else endActivity('wordReading',score,words.length,ctx)})}
 }
 draw()}

/* ================= 4) معنى الكلمات + لعبة المطابقة ================= */
function actWordMeaning(ctx){const t=ctx.remedial?0:tierFor('wordMeaning');const set=BANK.wordMeaning[t];let items=[];
 const picDistractors=(w,n)=>sample(sameKind(w).filter(k=>VOCAB[k].e!==VOCAB[w].e),n);
 if(set.mode==='context'){items=freshSample('wm'+t,set.items,ctx.remedial?3:5,!ctx.remedial).map(x=>{let{opts,ans}=shuffleOpts(x.o,x.a);({opts,ans}=trimOpts(opts,ans,ctx));const full=x.q.replace('___',x.o[x.a]);return{prompt:'اخْتَرِ الكَلِمَةَ المُنَاسِبَةَ.',en:'Choose the right word.',target:`<span class="ar-text sentence">${esc(x.q).replace('___','<u class="blank">⬚</u>')}</span>${G(x.en)}`,targetClass:'sentence-target',opts,ans,optAudio:true,answerSpeak:full,reveal:`<span class="ar-text sentence">${esc(full)}</span>${TL(full)}${G(x.en.replace('___','…'))}`,log:x.q}})}
 else{const words=freshSample('wm'+t,set.words,ctx.remedial?3:5,!ctx.remedial);items=words.map(w=>{const v=VOCAB[w];const ds=picDistractors(w,ctx.remedial?1:2);const all=shuffle([w,...ds]);const ans=all.indexOf(w);
  if(set.mode==='wordToPic')return{prompt:'اسْتَمِعْ وَاقْرَأْ، ثُمَّ اخْتَرِ الصُّورَةَ.',en:'Listen and read, then choose the picture.',target:`<span class="ar-text">${esc(w)}</span>${TL(w)}`,speak:w,opts:all.map(k=>({e:VOCAB[k].e,en:VOCAB[k].en})),ans,optAudio:false,answerSpeak:w,reveal:`<span class="ar-text">${esc(w)}</span>${TL(w)}${G(v.en)}`,log:w};
  return{prompt:'مَا الكَلِمَةُ المُنَاسِبَةُ لِلصُّورَةِ؟',en:'Which word matches the picture?',target:`<span class="pic-big">${v.e}</span>`,targetClass:'pic-target',opts:all,ans,optAudio:true,answerSpeak:w,reveal:`<span class="pic-big">${v.e}</span><span class="ar-text">${esc(w)}</span>${TL(w)}${G(v.en)}`,log:w}})}
 const matchWords=set.mode==='context'?sample(set.match,4):sample(set.words.filter(w=>VOCAB[w]),4);
 runMCQ('wordMeaning',items,ctx,'معنى الكلمات','Word meaning',(c,t)=>{if(ctx.remedial)return endActivity('wordMeaning',c,t,ctx);matchGame(matchWords,(mc,mt)=>endActivity('wordMeaning',c+mc,t+mt,ctx))});
}
function matchGame(words,done){const b=board();let selected=null,matched=0,firstTry=0;const missed=new Set();
 const pics=shuffle(words),ws=shuffle(words);
 b.innerHTML=activityHead('لُعْبَةُ المُطَابَقَةِ','Matching game',0,0,'🧠 تحدٍّ')+`<p class="prompt-ar">المِسْ كَلِمَةً، ثُمَّ المِسْ صُورَتَهَا.</p>${G('Tap a word, then tap its picture.')}<div class="match-board"><div class="match-col ${words.length>4?'many':''}" data-words>${ws.map(w=>`<button class="match-card word" data-w="${esc(w)}"><span class="ar-text">${esc(w)}</span>${TL(w)}</button>`).join('')}</div><div class="match-col ${words.length>4?'many':''}" data-pics>${pics.map(w=>`<button class="match-card pic" data-p="${esc(w)}" aria-label="${esc((VOCAB[w]||{}).en||'')}">${(VOCAB[w]||{e:'❓'}).e}</button>`).join('')}</div></div><div class="feedback" data-feed>${G('Match all 4 pairs')}</div>`;
 b.querySelectorAll('[data-w]').forEach(c=>c.onclick=()=>{if(c.disabled)return;b.querySelectorAll('[data-w]').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');selected=c.dataset.w;speak(selected,.75)});
 b.querySelectorAll('[data-p]').forEach(c=>c.onclick=()=>{if(c.disabled||!selected)return;const wc=b.querySelector(`[data-w="${CSS.escape(selected)}"]`);if(c.dataset.p===selected){c.disabled=wc.disabled=true;c.classList.add('ok');wc.classList.add('ok');wc.classList.remove('sel');matched++;if(!missed.has(selected))firstTry++;beep(true);reward(true,!missed.has(selected));selected=null;if(matched===words.length){praise();confettiSmall();later(()=>done(firstTry,words.length),900)}}else{missed.add(selected);c.classList.add('shake');setTimeout(()=>c.classList.remove('shake'),450);beep(false);reward(false);logError('wordMeaning',selected)}})}
function confettiSmall(){const x=document.querySelector('.match-board');if(x){x.classList.add('win');setTimeout(()=>x.classList.remove('win'),900)}}

/* ================= 5) بناء الجملة ================= */
function actBuild(ctx){const t=ctx.remedial?0:tierFor('sentenceBuild');const list=freshSample('build'+t,BANK.sentenceBuild[t],ctx.remedial?2:(t===0?5:4),!ctx.remedial);runBuilder('sentenceBuild',list,ctx,false)}
function actRace(ctx){const t=ctx.remedial?0:tierFor('sentenceOrder');const list=freshSample('race'+t,BANK.sentenceBuild[t],ctx.remedial?2:3,!ctx.remedial);runBuilder('sentenceOrder',list,ctx,!ctx.remedial)}
function runBuilder(key,list,ctx,race){let i=0,correct=0;const lostItems=new Set();
 function draw(){clearTimers();const item=list[i],words=item.w,target=words.join(' ');let built=[],tries=0,hinted=false,finished=false;
  let shuffled=shuffle(words);let guard=0;while(shuffled.join(' ')===target&&guard++<10)shuffled=shuffle(words);
  const b=board();
  b.innerHTML=activityHead(race?'سِبَاقُ الجُمْلَةِ':'رَتِّبِ الكَلِمَاتِ',race?'Sentence race':'Build the sentence',i,list.length,ctx.remedial?'🛟 تدريب علاجي':race?'🏎️ أنت ضد المنافس':'المستوى '+(tierFor(key)+1))+
   (race?`<div class="race-track"><div class="finish-line">🏁</div><div class="player-car" data-player>🏎️</div><div class="rival-car" data-rival>🚗</div></div>`:'')+
   `<div class="goal-card"><span class="goal-emoji">${item.e}</span>${G(item.en)}</div>`+
   `<div class="sentence-slots" data-slots aria-label="جملتك"><span class="slot-hint">المِسِ الكَلِمَاتِ بِالتَّرْتِيبِ ${G('Tap the words in order')}</span></div><div class="word-bank" data-bank></div>`+
   `<div class="sound-actions"><button class="control-btn" data-hear>🔊 استمع إلى الجملة</button>${race?'':`<button class="control-btn help-btn" data-hint>💡 تلميح</button>`}<button class="big-btn primary" data-check>${race?'انطلق ⚡':'تحقّق ✓'}</button></div><div class="feedback" data-feed></div><div class="after-actions" data-after></div>`;
  const q=s=>b.querySelector(s),slots=q('[data-slots]'),bank=q('[data-bank]'),feed=q('[data-feed]');
  const bankBtns=shuffled.map(w=>{const btn=document.createElement('button');btn.className='token ar';btn.innerHTML=`${esc(w)}${TL(w)}`;btn.onclick=()=>{if(btn.disabled||finished)return;btn.disabled=true;built.push({w,btn});speak(w,.8);renderSlots()};bank.appendChild(btn);return btn});
  function renderSlots(){slots.innerHTML=built.length?'':`<span class="slot-hint">المِسِ الكَلِمَاتِ بِالتَّرْتِيبِ ${G('Tap the words in order')}</span>`;built.forEach((x,j)=>{const btn=document.createElement('button');btn.className='token ar selected';btn.innerHTML=`${esc(x.w)}${TL(x.w)}`;btn.onclick=()=>{if(finished)return;x.btn.disabled=false;built.splice(j,1);renderSlots()};slots.appendChild(btn)})}
  q('[data-hear]').onclick=()=>speak(target,.72);
  if(!race)q('[data-hint]').onclick=()=>{/* يضع الكلمة الصحيحة التالية */hinted=true;const k=built.findIndex((x,j)=>x.w!==words[j]);if(k>=0){built.slice(k).forEach(x=>x.btn.disabled=false);built=built.slice(0,k)}const nextW=words[built.length];if(nextW==null)return;const btn=bankBtns.find(bb=>!bb.disabled&&bb.textContent.startsWith(nextW));if(btn){btn.disabled=true;built.push({w:nextW,btn});renderSlots();speak(nextW,.8)}};
  let rival=0,rivalTimer=null;
  if(race){/* سرعة المنافس تتكيف مع طول الجملة ومستوى الطالب */const seconds=10+words.length*4.5*(1+(3-tierFor(key))*.18);const step=88/(seconds*4);rivalTimer=setInterval(()=>{if(finished)return;rival=Math.min(88,rival+step);const rc=q('[data-rival]');if(rc)rc.style.left=rival+'%';if(rival>=88)lose()},250);activeTimers.push(rivalTimer)}
  function lose(){if(finished)return;finished=true;lostItems.add(i);clearInterval(rivalTimer);beep(false);reward(false);logError(key,target);bankBtns.forEach(bb=>bb.disabled=true);feed.className='feedback bad';feed.innerHTML=`وصل المنافس أولًا! هذه هي الجملة: <b class="ar-text">${esc(target)}</b>${TL(target)}${G('The other car won. Here is the sentence.')}`;speak(target,.7);const af=q('[data-after]');const again=document.createElement('button');again.className='big-btn ghost';again.textContent='🔁 سباق جديد بالجملة نفسها';again.onclick=()=>draw();af.appendChild(again);nextButton(af,'',advance)}
  function advance(){i++;if(i<list.length)draw();else endActivity(key,correct,list.length,ctx)}
  q('[data-check]').onclick=()=>{if(finished)return;if(built.length<words.length){feed.className='feedback';feed.innerHTML='أكمل الجملة أولًا.'+G('Use all the words first.');return}
   const ok=built.map(x=>x.w).join(' ')===target;
   if(ok){finished=true;clearInterval(rivalTimer);const first=tries===0&&!hinted&&!lostItems.has(i);if(first)correct++;else if(!race&&tries<=1)correct+=.5;beep(true);reward(true,first);const p=praise();feed.className='feedback good';feed.innerHTML=`<b>${p[0]}</b>${G(p[1])}`;slots.classList.add('solved');if(race){const pc=q('[data-player]');if(pc)pc.style.left='86%'}speak(target,.75);const af=q('[data-after]');later(()=>nextButton(af,'',advance),600);return}
   tries++;beep(false);reward(false);
   /* نلوّن أول كلمة في غير مكانها */
   const wrongAt=built.findIndex((x,j)=>x.w!==words[j]);[...slots.children].forEach((c,j)=>c.classList.toggle('wrong-slot',j>=wrongAt));
   if(race){rival=Math.min(88,rival+12);const rc=q('[data-rival]');if(rc)rc.style.left=rival+'%';feed.className='feedback bad';feed.innerHTML='الترتيب غير صحيح — تقدّم المنافس!'+G('Wrong order — the other car moved ahead!');if(rival>=88)lose();return}
   if(tries>=2){finished=true;logError(key,target);feed.className='feedback bad';feed.innerHTML=`هذه هي الجملة الصحيحة: <b class="ar-text">${esc(target)}</b>${TL(target)}${G('Here is the correct sentence.')}`;speak(target,.7);nextButton(q('[data-after]'),'',advance)}
   else{feed.className='feedback bad';feed.innerHTML='الكلمات الملوّنة في غير مكانها. حاول مرة أخرى.'+G('The coloured words are in the wrong place. Try again.')}};
  if(!race&&ctx.remedial)later(()=>speak(target,.65),350);
 }
 draw()}

/* ================= 6) الاستماع إلى الجمل ================= */
function actListen(ctx){const t=ctx.remedial?0:tierFor('sentenceListen');const src=freshSample('listen'+t,BANK.sentenceListen[t],ctx.remedial?3:4,!ctx.remedial);
 const items=src.map(x=>{let{opts,ans}=shuffleOpts(x.o,x.a);({opts,ans}=trimOpts(opts,ans,ctx));const pics=typeof opts[0]==='object';
  return{prompt:pics?'اسْتَمِعْ، ثُمَّ اخْتَرِ الصُّورَةَ.':'اسْتَمِعْ، ثُمَّ اخْتَرِ المَعْنَى.',en:pics?'Listen, then choose the picture.':'Listen, then choose the meaning.',target:'🎧',targetClass:'listen-target',speak:x.s,opts,ans,optAudio:false,optTL:false,answerSpeak:x.s,reveal:`<span class="ar-text sentence">${esc(x.s)}</span>${TL(x.s)}${G(x.en)}`,log:x.s}});
 runMCQ('sentenceListen',items,ctx,'الاستماع إلى الجمل','Listening')}

/* ================= 7) القراءة والفهم ================= */
function actReading(ctx){const t=ctx.remedial?0:tierFor('fluency');const d=freshSample('reading'+t,BANK.reading[t],1,!ctx.remedial)[0];let correct=0,answered=0;const qs=ctx.remedial?d.qs.slice(0,2):d.qs;const b=board();
 const words=d.text.split(/\s+/);
 b.innerHTML=activityHead('اقْرَأْ وَافْهَمْ','Read and understand',0,0,ctx.remedial?'🛟 تدريب علاجي':'المستوى '+(t+1))+`<p class="prompt-ar">اقْرَأِ النَّصَّ. المِسْ أَيَّ كَلِمَةٍ لِتَسْمَعَهَا.</p>${G('Read the text. Tap any word to hear it.')}<div class="reading-text ar" dir="rtl">${words.map(w=>`<button class="read-word" data-say="${esc(w.replace(/[.،؟!]/g,''))}">${esc(w)}</button>`).join(' ')}</div><details class="translation"><summary dir="ltr">🇬🇧 Show English translation</summary><p dir="ltr">${esc(d.en)}</p></details><div class="sound-actions"><button class="control-btn" data-read>🔊 استمع إلى النص</button><button class="control-btn" data-slow>🐢 ببطء</button></div><div data-qs></div><div class="feedback" data-feed>أجب عن الأسئلة. ${G('Answer the questions.')}</div><div class="after-actions" data-after></div>`;
 b.querySelectorAll('.read-word').forEach(w=>w.onclick=()=>{w.classList.add('lit');setTimeout(()=>w.classList.remove('lit'),700);speak(w.dataset.say,.65)});
 const allWords=[...b.querySelectorAll('.read-word')];
 /* قراءة النص مع إضاءة الكلمة المقروءة */
 const readAlong=rate=>speakSeries(words.map(w=>w.replace(/[.،؟!]/g,'')),rate,n=>allWords.forEach((w,j)=>w.classList.toggle('lit',j===n)));
 b.querySelector('[data-read]').onclick=()=>readAlong(.8);b.querySelector('[data-slow]').onclick=()=>readAlong(.55);
 const host=b.querySelector('[data-qs]');
 /* سؤال واحد في كل مرة: أوضح للطالب، وتبقى الشاشة كلها ظاهرة */
 let qi=0;
 const showQ=()=>{const qq=qs[qi];let{opts,ans}=shuffleOpts(qq.o,qq.a);({opts,ans}=trimOpts(opts,ans,ctx));host.innerHTML='';const card=document.createElement('div');card.className='question-card';card.innerHTML=`<div class="q-head"><span class="q-num">${qi+1}/${qs.length}</span><b class="ar-text">${esc(qq.q)}</b><button class="choice-audio inline" aria-label="استمع إلى السؤال">🔊</button></div>${G(qq.en)}<div data-c></div>`;card.querySelector('.choice-audio').onclick=()=>speak(qq.q,.75);host.appendChild(card);
  const btns=renderOptions(card.querySelector('[data-c]'),opts,{withAudio:true,onPick:idx=>{const ok=idx===ans;lockAndMark(btns,idx,ans);beep(ok);reward(ok);answered++;if(ok)correct++;else logError('fluency',qq.q);card.classList.add(ok?'q-ok':'q-bad');
   const f=b.querySelector('[data-feed]'),af=b.querySelector('[data-after]');af.innerHTML='';
   if(ok){const p=praise();f.className='feedback good';f.innerHTML=`<b>${p[0]}</b>${G(p[1])}`}else{f.className='feedback bad';f.innerHTML='هذه هي الإجابة الصحيحة.'+G('This is the correct answer.')}
   const go=()=>{qi++;f.className='feedback';f.innerHTML=`${qi<qs.length?'السؤال التالي':''}`;af.innerHTML='';if(qi<qs.length)showQ();else endActivity('fluency',correct,qs.length,ctx)};
   if(ok&&qi<qs.length-1)later(go,1100);else nextButton(af,qi<qs.length-1?'':'إنهاء',go)}})};
 showQ();
}

/* ================= 8) المهمة النهائية ================= */
function actFinal(){const s=current();const before=s.baseline?s.baseline.total:0,now=overall(s),gain=Math.max(0,now-before);const b=board();
 b.innerHTML=`<div class="stage-finish"><div class="trophy">👑</div><h2>المهمة النهائية</h2>${G('The final mission')}<p>أكملت المحطات الثماني! الآن قياس قصير يقارن مستواك ببدايتك.</p>${G('You finished all 8 stations! Now a short check compares you with when you started.')}<div class="path-preview center-row"><span>البداية ${before}%</span><span>الآن ${now}%</span><span>التحسن +${gain}</span></div><button class="big-btn gold" data-go>ابدأ القياس 🎯</button></div>`;
 b.querySelector('[data-go]').onclick=()=>{let i=0,c=0;const items=shuffle(FINAL);const draw=()=>{if(i>=items.length)return done();b.innerHTML=activityHead('القِيَاسُ النِّهَائِيُّ','Final check',i,items.length,'Progress check')+'<div data-item></div>';renderItem(b.querySelector('[data-item]'),items[i],ok=>{if(ok)c++;i++;draw()})};
  const done=()=>{const score=Math.round(c/items.length*100);s.progressChecks.push({date:new Date().toISOString(),score});recordMission(s,8,0,Math.max(80,score));s.graduated=true;s.certificate='MAAMOON-'+s.code+'-'+new Date().getFullYear();s.points+=100;s.stars[8]=Math.max(s.stars[8],score>=100?3:score>=85?2:1);s.cefr=cefrFrom(Math.round((score+overall(s))/2));persist();refreshHud();confetti();
   b.innerHTML=`<div class="stage-finish certificate"><div class="trophy">🎓</div><h2>تهانينا يا ${esc(s.name)}</h2>${G('Congratulations!')}<div class="mastery-badge">فارس الطلاقة</div><p>أتممت الرحلة من الحروف إلى الكلمات ثم الجمل.</p><div class="path-preview center-row"><span>البداية ${s.baseline?s.baseline.total:0}%</span><span>القياس النهائي ${score}%</span><span dir="ltr">${esc(s.cefr)}</span></div><div class="form-actions center-row"><button class="big-btn ghost" data-cert>🖨️ طباعة الشهادة</button><button class="big-btn primary" data-prof>عرض تقرير التقدم</button></div></div>`;
   b.querySelector('[data-prof]').onclick=showProfile;b.querySelector('[data-cert]').onclick=()=>printCertificate(s,score)};
  draw()}}
function printCertificate(s,score){const w=window.open('','_blank');if(!w)return flash('اسمح بالنوافذ المنبثقة لطباعة الشهادة');w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>شهادة</title><style>body{font-family:Tahoma,Arial;text-align:center;padding:40px;color:#0d3f65}.c{border:10px double #d9a11d;border-radius:24px;padding:40px}h1{font-size:44px;margin:10px}b{color:#14a7a4}</style></head><body><div class="c"><img src="${location.href.replace(/[^/]*$/,'')}assets/logo-full.webp" width="170"><h1>شهادة فارس الطلاقة</h1><p style="font-size:22px">تشهد مدرسة المأمون الابتدائية للبنين بأن الطالب</p><h2 style="font-size:36px">${esc(s.name)}</h2><p style="font-size:20px">أتمّ برنامج «مغامرة المأمون» من الحروف إلى الطلاقة</p><p style="font-size:20px">خط الأساس: <b>${s.baseline?s.baseline.total:0}%</b> — القياس النهائي: <b>${score}%</b> — المستوى: <b dir="ltr">${esc(s.cefr)}</b></p><p>${new Date().toLocaleDateString('ar-BH')} — ${esc(s.certificate)}</p></div><script>setTimeout(()=>print(),400)<\/script></body></html>`);w.document.close()}

/* ================= نهاية المحطة ================= */
function remedialDone(key){const b=board();confetti();b.innerHTML=`<div class="stage-finish"><div class="trophy">🌟</div><h2>أحسنت في التدريب!</h2>${G('Great practice!')}<p>الآن أعد المهمة. عند 80% تتقنها.</p>${G('Now try the mission again. 80% masters it.')}<button class="big-btn primary" data-retry>أعد التحدي ▶</button></div>`;b.querySelector('[data-retry]').onclick=()=>renderStageActivity()}

/* ================= ورشة الكتابة ================= */
function wboard(){return $('writeBoard')}
function vowelledOf(bare){return Object.keys(VOCAB).find(k=>norm(k)===norm(bare))||bare}
function letterName(l){const L=ALPHABET.find(x=>x.l===l);return L?L.name:l}

/* لوح التتبّع: يرسم الطالب فوق الحرف الرمادي، ونقيس نسبة تغطية الحرف ونسبة الخروج عنه */
function tracePad(host,glyph,{practice=false,onResult}={}){
 host.innerHTML=`<div class="trace-wrap"><canvas class="trace-guide" aria-hidden="true"></canvas><canvas class="trace-ink" aria-label="لوح الكتابة — ارسم فوق الحرف"></canvas><span class="trace-hint">☝️</span></div><div class="sound-actions trace-actions"><button class="control-btn" data-clear>🧽 امسح ${G('Clear')}</button><button class="big-btn primary" data-tcheck>تحقّق ✓</button></div><div class="feedback trace-feed" data-tfeed>ارسم بإصبعك فوق الحرف الرمادي. ${G('Trace over the grey letter with your finger.')}</div>`;
 const wrap=host.querySelector('.trace-wrap'),guide=host.querySelector('.trace-guide'),ink=host.querySelector('.trace-ink'),feed=host.querySelector('[data-tfeed]');
 const dpr=Math.min(2,window.devicePixelRatio||1);let W=0,font=null,drawn=false,drawing=false,last=null,done=false;
 const gctx=guide.getContext('2d'),ictx=ink.getContext('2d');
 /* حجم الخط بحيث يملأ الحرف نحو 75% من اللوح */
 function layout(ctx,size){ctx.font=`700 ${size}px "Noto Naskh Arabic", serif`;ctx.direction='rtl';ctx.textAlign='left';ctx.textBaseline='alphabetic';const m=ctx.measureText(glyph);return{w:m.actualBoundingBoxLeft+m.actualBoundingBoxRight,h:m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,m}}
 function place(ctx,size){const L=layout(ctx,size);return{x:(W-L.w)/2+L.m.actualBoundingBoxLeft,y:(W-L.h)/2+L.m.actualBoundingBoxAscent}}
 function paintGlyph(ctx,size,style,extraStroke){const p=place(ctx,size);ctx.fillStyle=style;ctx.fillText(glyph,p.x,p.y);if(extraStroke){ctx.lineWidth=extraStroke;ctx.lineJoin='round';ctx.strokeStyle=style;ctx.strokeText(glyph,p.x,p.y)}}
 function setup(){W=Math.round(wrap.clientWidth)||300;[guide,ink].forEach(c=>{c.width=W*dpr;c.height=W*dpr;c.style.width=c.style.height=W+'px';c.getContext('2d').setTransform(dpr,0,0,dpr,0,0)});
  const probe=layout(gctx,100);const sc=Math.min(W*.76/Math.max(1,probe.w),W*.72/Math.max(1,probe.h));font=100*sc;
  gctx.clearRect(0,0,W,W);gctx.setLineDash([]);paintGlyph(gctx,font,'#d9e7ee');
  /* خط منقّط للإرشاد */
  const p=place(gctx,font);gctx.setLineDash([4,6]);gctx.lineWidth=2;gctx.strokeStyle='#9fbccb';gctx.strokeText(glyph,p.x,p.y);gctx.setLineDash([]);
  ictx.lineCap='round';ictx.lineJoin='round';ictx.lineWidth=Math.max(12,W*.075);ictx.strokeStyle='#0d3f65'}
 /* إدخال موحّد: فأرة، إصبع، أو قلم (Apple Pencil) — إصبع واحد فقط، وتُتجاهل راحة اليد والإصبع الثاني */
 const pos=(cx,cy)=>{const r=ink.getBoundingClientRect();return{x:(cx-r.left)*(W/r.width),y:(cy-r.top)*(W/r.height)}};
 let active=null,penSeen=false;
 function startAt(p){if(done)return;drawing=true;drawn=true;wrap.classList.add('inked');last=p;ictx.beginPath();ictx.arc(p.x,p.y,ictx.lineWidth/2,0,Math.PI*2);ictx.fillStyle='#0d3f65';ictx.fill()}
 function lineTo(p){if(!drawing)return;ictx.beginPath();ictx.moveTo(last.x,last.y);ictx.lineTo(p.x,p.y);ictx.stroke();last=p}
 function end(){drawing=false;active=null}
 if(window.PointerEvent){
  ink.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;
   if(e.pointerType==='pen')penSeen=true;
   /* إذا استخدم الطالب القلم نتجاهل لمس اليد على الشاشة */
   if(penSeen&&e.pointerType==='touch')return;
   if(active!==null&&active!==e.pointerId)return;active=e.pointerId;
   try{ink.setPointerCapture(e.pointerId)}catch{}startAt(pos(e.clientX,e.clientY));e.preventDefault()});
  ink.addEventListener('pointermove',e=>{if(e.pointerId!==active)return;const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];(evs.length?evs:[e]).forEach(ev=>lineTo(pos(ev.clientX,ev.clientY)));e.preventDefault()});
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>ink.addEventListener(t,e=>{if(e.pointerId===active)end()}));
 }else{/* متصفحات iOS القديمة بدون Pointer Events */
  ink.addEventListener('touchstart',e=>{if(active!==null)return;const t=e.changedTouches[0];active=t.identifier;startAt(pos(t.clientX,t.clientY));e.preventDefault()},{passive:false});
  ink.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===active)lineTo(pos(t.clientX,t.clientY));e.preventDefault()},{passive:false});
  ['touchend','touchcancel'].forEach(tp=>ink.addEventListener(tp,e=>{for(const t of e.changedTouches)if(t.identifier===active)end()}));
  ink.addEventListener('mousedown',e=>{startAt(pos(e.clientX,e.clientY));const mv=ev=>lineTo(pos(ev.clientX,ev.clientY)),upf=()=>{end();removeEventListener('mousemove',mv);removeEventListener('mouseup',upf)};addEventListener('mousemove',mv);addEventListener('mouseup',upf)});
 }
 /* منع تمرير الصفحة والتكبير وقائمة الضغط الطويل أثناء الكتابة على iPad */
 ['touchstart','touchmove'].forEach(t=>wrap.addEventListener(t,e=>{if(e.cancelable)e.preventDefault()},{passive:false}));
 wrap.addEventListener('contextmenu',e=>e.preventDefault());
 function clear(){ictx.clearRect(0,0,W,W);drawn=false;wrap.classList.remove('inked')}
 host.querySelector('[data-clear]').onclick=()=>{if(!done)clear()};
 /* التقييم على شبكة 100×100 */
 function evaluate(){const N=100;const mk=()=>{const c=document.createElement('canvas');c.width=c.height=N;return c};
  const ci=mk(),cm=mk(),ct=mk();const x=ci.getContext('2d');x.drawImage(ink,0,0,N,N);
  const scale=N/W;[[cm,0],[ct,W*.09]].forEach(([c,extra])=>{const cx=c.getContext('2d');cx.setTransform(scale,0,0,scale,0,0);paintGlyph(cx,font,'#000',extra)});
  const a=x.getImageData(0,0,N,N).data,m=cm.getContext('2d').getImageData(0,0,N,N).data,t=ct.getContext('2d').getImageData(0,0,N,N).data;
  /* نوسّع خط الطالب قليلًا: التتبّع على منتصف الحرف صحيح حتى لو لم يملأ سُمك الحرف كله */
  const inkM=new Uint8Array(N*N);for(let p=0;p<N*N;p++)inkM[p]=a[p*4+3]>40?1:0;
  const R=Math.max(3,Math.round(N*.055)),dil=new Uint8Array(N*N);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!inkM[y*N+x])continue;for(let dy=-R;dy<=R;dy++){const yy=y+dy;if(yy<0||yy>=N)continue;for(let dx=-R;dx<=R;dx++){const xx=x+dx;if(xx<0||xx>=N||dx*dx+dy*dy>R*R)continue;dil[yy*N+xx]=1}}}
  let mask=0,cov=0,inkN=0,spill=0;for(let p=0;p<N*N;p++){const M=m[p*4+3]>60,T=t[p*4+3]>30;if(M){mask++;if(dil[p])cov++}if(inkM[p]){inkN++;if(!T)spill++}}
  /* كل جزء منفصل من الحرف (الجسم وكل نقطة) يجب أن يُرسم */
  const lab=new Int32Array(N*N).fill(-1);let parts=0,missed=0;
  for(let p=0;p<N*N;p++){if(lab[p]>=0||!(m[p*4+3]>60))continue;const st=[p];lab[p]=parts;let size=0,hit=0;while(st.length){const q=st.pop();size++;if(dil[q])hit++;const x=q%N,y=(q/N)|0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=N||yy>=N)return;const r=yy*N+xx;if(lab[r]<0&&m[r*4+3]>60){lab[r]=parts;st.push(r)}})}parts++;if(size>=3&&hit/size<.4)missed++}
  return{coverage:mask?cov/mask:0,spill:inkN?spill/inkN:1,missedParts:missed}}
 let tries=0;
 host.querySelector('[data-tcheck]').onclick=()=>{if(done)return;if(!drawn){feed.innerHTML='ارسم فوق الحرف أولًا. '+G('Trace the letter first.');return}
  const r=evaluate();const ok=r.coverage>=.6&&r.spill<=.3&&!r.missedParts;tries++;const pct=Math.round(r.coverage*100);
  if(ok){const stars=r.coverage>=.85&&r.spill<=.15?3:r.coverage>=.72?2:1;beep(true);feed.className='feedback trace-feed good';feed.innerHTML=`<b>${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</b> أحسنت! غطّيت ${pct}% من الحرف. ${G(`Well done! You covered ${pct}% of the letter.`)}`;wrap.classList.add('traced');if(!practice){done=true;onResult&&onResult(tries===1?1:.5)}else later(()=>{clear();wrap.classList.remove('traced')},1600)}
  else{beep(false);feed.className='feedback trace-feed bad';const tip=r.spill>.3?'خرجت كثيرًا عن الحرف. ارسم فوق الخط الرمادي بالضبط.':r.coverage>=.6&&r.missedParts?'لا تنسَ النقاط!':'أكمل الحرف كله، ولا تنسَ النقاط.';const tipEn=r.spill>.3?'Too much outside the letter. Stay on the grey line.':r.coverage>=.6&&r.missedParts?'Don\'t forget the dots!':'Finish the whole letter — don\'t forget the dots.';feed.innerHTML=`${tip} (${pct}%) ${G(tipEn)}`;
   if(!practice&&tries>=2){done=true;onResult&&onResult(0)}else later(clear,900)}};
 (document.fonts?document.fonts.load(`700 80px "Noto Naskh Arabic"`,glyph):Promise.resolve()).catch(()=>{}).then(()=>requestAnimationFrame(setup));
 let rt=null,lastW=0;const onResize=()=>{if(!host.isConnected){window.removeEventListener('resize',onResize);return}clearTimeout(rt);rt=setTimeout(()=>{const nw=Math.round(wrap.clientWidth);if(!nw||nw===lastW||done)return;lastW=nw;const had=drawn;setup();clear();if(had)feed.innerHTML='تغيّر حجم الشاشة، ارسم الحرف مرة أخرى. '+G('The screen changed size — please trace again.')},250)};window.addEventListener('resize',onResize);window.addEventListener('orientationchange',onResize);requestAnimationFrame(()=>{lastW=Math.round(wrap.clientWidth)});
}

/* بطاقة الدخول إلى الورشة */
function openWorkshop(){const s=current();if(!s)return show('startScreen');show('writeScreen');refreshHud();const t=tierFor('writing');const b=wboard();
 const levelText=['حروف منفصلة','حروف أصعب','أشكال الحرف في الكلمة','كلمات كاملة'][t],levelEn=['Single letters','Harder letters','Letter shapes in words','Whole words'][t];
 b.innerHTML=`<div class="write-intro"><div class="big-emoji">✍️</div><h2>ورشة الكتابة</h2>${G('Writing workshop')}<p class="prompt-ar">تتبّع ٣ حروف بإصبعك، ثم كوّن ٤ كلمات من حروفها.</p>${G('Trace 3 letters with your finger, then build 4 words from their letters.')}<div class="path-preview center-row"><span>المستوى ${t+1}: ${levelText}</span>${s.writeStars?`<span class="mission-stars">${starText(s.writeStars)}</span>`:''}<span>إتقان الكتابة ${s.attempts.writing?(s.mastery.writing||0)+'%':'—'}</span></div>${G('Level '+(t+1)+': '+levelEn)}<div class="form-actions center-row"><button class="big-btn ghost" data-lab><span class="ab-icon" aria-hidden="true">أ ب ت</span> مختبر الحروف</button><button class="big-btn primary" data-start>ابدأ الكتابة ▶</button></div></div>`;
 b.querySelector('[data-start]').onclick=()=>runWriting();b.querySelector('[data-lab]').onclick=()=>openLab('writeScreen');setCombo(0)}

function runWriting(){const t=tierFor('writing');const traces=freshSample('trace'+t,WRITING.trace[t],3),spells=freshSample('spell'+t,WRITING.spell[t],4);
 const items=[...traces.map(x=>({kind:'trace',x})),...spells.map(x=>({kind:'spell',x}))];let i=0,score=0;
 const next=()=>{i++;if(i<items.length)draw();else finishWriting(score,items.length)};
 function draw(){clearTimers();stopAudio();const it=items[i];const b=wboard();
  if(it.kind==='trace'){const x=it.x;const isForm=typeof x==='object',glyph=isForm?x.f:x,isWord=!isForm&&x.length>1;
   const say=isForm?letterName(x.l):isWord?vowelledOf(x):letterName(x);
   const posAr={start:'في أول الكلمة',middle:'في وسط الكلمة',end:'في آخر الكلمة'},posEn={start:'at the start of a word',middle:'in the middle of a word',end:'at the end of a word'};
   const prompt=isForm?`اكتب حرف ${x.l} ${posAr[x.p]}.`:isWord?'اكتب الكلمة.':'اكتب الحرف.';const promptEn=isForm?`Write ${x.l} ${posEn[x.p]}.`:isWord?'Write the word.':'Write the letter.';
   b.innerHTML=activityHead('تَتَبَّعْ وَاكْتُبْ','Trace and write',i,items.length,'✍️ المستوى '+(t+1))+`<p class="prompt-ar">${esc(prompt)}</p>${G(promptEn)}<div class="sound-actions"><button class="control-btn" data-hear>🔊 ${isWord?'استمع إلى الكلمة':'اسم الحرف'}</button>${isWord&&VOCAB[say]?`<span class="goal-emoji">${VOCAB[say].e}</span>`:''}</div><div data-pad></div><div class="after-actions" data-after></div>`;
   b.querySelector('[data-hear]').onclick=()=>speak(say,.7);later(()=>speak(say,.7),300);
   tracePad(b.querySelector('[data-pad]'),glyph,{onResult:credit=>{score+=credit;reward(credit>0,credit===1);if(credit>0)praise();else logError('writing',glyph);nextButton(b.querySelector('[data-after]'),'',next)}})}
  else spellItem(b,it.x,t,i,items.length,credit=>{score+=credit;next()})}
 draw()}

/* التهجئة: الحروف تظهر منفصلة، وعند تكوين الكلمة تتصل تلقائيًا — فيتعلم الطالب كيف تتصل الحروف */
function spellItem(b,w,t,i,n,done){const letters=[...w.replace(HARAKAT,'')];const v=VOCAB[w];const conf=WRITING.confusable;
 const pool=new Set();letters.forEach(l=>[...(conf[l]||'')].forEach(c=>{if(!letters.includes(c))pool.add(c)}));const extra=sample([...pool],t<2?2:3);
 const tiles=shuffle([...letters,...extra].map((l,k)=>({l,k})));let built=[],tries=0,hinted=false,finished=false;
 const showPic=t<3&&v;
 b.innerHTML=activityHead('كَوِّنِ الكَلِمَةَ','Build the word',i,n,'✍️ المستوى '+(t+1))+`<p class="prompt-ar">${showPic?'اكتب اسم الصورة بالحروف.':'استمع، ثم اكتب الكلمة بالحروف.'}</p>${G(showPic?'Spell the name of the picture.':'Listen, then spell the word.')}`+
  `<div class="spell-top">${showPic?`<span class="pic-big">${v.e}</span>`:'<span class="listen-target">🎧</span>'}<div class="sound-actions"><button class="control-btn" data-hear>🔊 استمع</button><button class="control-btn" data-slow>🐢 ببطء</button></div></div>`+
  `<div class="spell-built" data-built aria-live="polite"></div><div class="spell-tiles" data-tiles dir="rtl"></div><div class="sound-actions"><button class="control-btn" data-undo>⌫ امسح حرفًا</button><button class="control-btn help-btn" data-hint>💡 تلميح</button></div><div class="feedback" data-feed>المس الحروف بالترتيب. ${G('Tap the letters in order.')}</div><div class="after-actions" data-after></div>`;
 const q=s=>b.querySelector(s),feed=q('[data-feed]');
 q('[data-hear]').onclick=()=>speak(w,.72);q('[data-slow]').onclick=()=>speak(w,.5);later(()=>speak(w,.72),300);
 const tileBtns=tiles.map(tl=>{const btn=document.createElement('button');btn.className='spell-tile';btn.textContent=tl.l;btn.onclick=()=>{if(btn.disabled||finished)return;btn.disabled=true;built.push({l:tl.l,btn});speak(tl.l==='ة'?'تَاء مَرْبُوطَة':letterName(tl.l),.9);render();if(built.length===letters.length)check()};q('[data-tiles]').appendChild(btn);return btn});
 function render(){const txt=built.map(x=>x.l).join('');const left=letters.length-built.length;q('[data-built]').innerHTML=`<span class="spell-word">${esc(txt)||'&nbsp;'}</span><span class="spell-left">${'◌'.repeat(Math.max(0,left))}</span>`}
 render();
 q('[data-undo]').onclick=()=>{if(finished||!built.length)return;built.pop().btn.disabled=false;q('[data-built]').classList.remove('bad');render()};
 q('[data-hint]').onclick=()=>{if(finished)return;hinted=true;q('[data-hint]').classList.add('used');const k=built.findIndex((x,j)=>x.l!==letters[j]);if(k>=0)built.splice(k).forEach(x=>x.btn.disabled=false);const want=letters[built.length];const btn=tileBtns.find(bb=>!bb.disabled&&bb.textContent===want);if(btn)btn.click()};
 function check(){const ok=built.map(x=>x.l).join('')===letters.join('');
  if(ok){finished=true;const credit=tries===0&&!hinted?1:.5;beep(true);reward(true,credit===1);const p=praise();feed.className='feedback good';feed.innerHTML=`<b>${p[0]}</b>${G(p[1])}`;q('[data-built]').classList.add('good');q('[data-built]').innerHTML=`<span class="spell-word ar-text">${esc(w)}</span>${TL(w)}${v?G(v.en):''}`;later(()=>speak(w,.7),250);nextButton(q('[data-after]'),'',()=>done(credit));return}
  tries++;beep(false);reward(false);q('[data-built]').classList.add('bad');
  if(tries>=2){finished=true;logError('writing',w);feed.className='feedback bad';feed.innerHTML=`هذه هي الكلمة: ${G('Here is the word:')}`;q('[data-built]').classList.remove('bad');q('[data-built]').innerHTML=`<span class="spell-word ar-text">${esc(w)}</span><span class="spell-letters">${letters.map(esc).join(' + ')}</span>${TL(w)}`;later(()=>speak(w,.65),250);nextButton(q('[data-after]'),'',()=>done(0))}
  else{const k=built.findIndex((x,j)=>x.l!==letters[j]);feed.className='feedback bad';feed.innerHTML=`الحرف رقم ${k+1} غير صحيح. استمع مرة أخرى. ${G('Letter number '+(k+1)+' is wrong. Listen again.')}`;later(()=>{built.splice(k).forEach(x=>x.btn.disabled=false);q('[data-built]').classList.remove('bad');render();speak(w,.6)},900)}}
}

function finishWriting(correct,total){const s=current();const score=Math.round(correct/total*100),pass=score>=80;s.mastery.writing=s.mastery.writing||0;updateSkill('writing',correct,total);addAttempt('writing');const b=wboard();const t=tierFor('writing');
 if(pass){const stars=score>=100?3:score>=90?2:1;const first=!s.writeStars;s.writeStars=Math.max(s.writeStars||0,stars);s.points+=first?25+stars*10:stars*5;let up=false;if(score>=95&&t<3){s.skillTier.writing=t+1;up=true}s.failStreak=s.failStreak||{};s.failStreak.writing=0;persist();refreshHud();confetti();
  b.innerHTML=`<div class="stage-finish"><div class="trophy">✍️</div><h2>كاتب ماهر!</h2>${G('Great writer!')}<div class="stars-row">${[1,2,3].map(n=>`<span class="${n<=stars?'on':''}" style="animation-delay:${n*.18}s">★</span>`).join('')}</div><div class="mastery-badge">${score}%</div>${first?`<div class="sticker-won"><span>✍️</span><b>قلم الكاتب</b>${G('New sticker!')}</div>`:''}${up?`<p class="level-up">⬆️ انتقلت إلى مستوى كتابة أعلى! ${G('Your writing level went up!')}</p>`:''}<div class="form-actions center-row"><button class="big-btn ghost" data-again>🔁 جولة جديدة</button><button class="big-btn primary" data-map>العودة للخريطة ▶</button></div></div>`}
 else{s.failStreak=s.failStreak||{};s.failStreak.writing=(s.failStreak.writing||0)+1;let eased=false;if(s.failStreak.writing>=2&&t>0){s.skillTier.writing=t-1;s.failStreak.writing=0;eased=true}persist();
  b.innerHTML=`<div class="stage-finish"><div class="trophy">🛟</div><h2>تحتاج إلى تدريب أكثر</h2>${G('Let\'s practise more.')}<div class="mastery-badge support-score">${score}%</div><p>جرّب مختبر الحروف لتتدرب على كتابة الحروف، ثم العب جولة جديدة.</p>${G('Practise writing letters in the Letter Lab, then play a new round.')}${eased?`<p class="level-up">الجولة القادمة أسهل قليلًا. ${G('The next round will be a little easier.')}</p>`:''}<div class="form-actions center-row"><button class="big-btn ghost" data-lab><span class="ab-icon" aria-hidden="true">أ ب ت</span> مختبر الحروف</button><button class="big-btn primary" data-again>🔁 جولة جديدة</button></div></div>`}
 const a=b.querySelector('[data-again]');if(a)a.onclick=()=>runWriting();const m=b.querySelector('[data-map]');if(m)m.onclick=()=>{prepareWorld();show('worldScreen')};const l=b.querySelector('[data-lab]');if(l)l.onclick=()=>openLab('writeScreen')}

/* ================= فحص الحروف الـ28 (للطالب الضعيف جدًا) =================
   كل حرف له سؤالان: صوت ← شكل، وشكل ← صورة كلمة تبدأ به.
   الحرف «معروف» إذا أُجيب صحيحًا في يومين مختلفين وكانت آخر محاولة صحيحة.
   المحطة الأولى تُفتح عند معرفة 24 حرفًا على الأقل. */
const LC_TARGET=24,LC_GROUP=7;
function today(){return new Date().toLocaleDateString('en-CA')}
function letterStatus(s,l){const m=(s.letterMap||{})[l];if(!m)return 'new';if(m.t)return 'known';const days=(m.d||[]).length;if(days>=2&&m.last)return 'known';if(days>=1&&m.last)return 'learning';return m.n?'weak':'new'}
function knownCount(s){return ALPHABET.filter(L=>letterStatus(s,L.l)==='known').length}
function needsLetterCheck(s){return !!(s&&s.letterCheck&&!s.completed[0]&&knownCount(s)<LC_TARGET)}
function recordLetter(s,l,ok){s.letterMap=s.letterMap||{};const m=s.letterMap[l]||{d:[],n:0};m.n=(m.n||0)+1;m.last=ok;if(ok){const t=today();if(!m.d.includes(t))m.d.push(t);m.d=m.d.slice(-5)}s.letterMap[l]=m}
const LC_LABEL={known:['أعرفه','Known'],learning:['صحيح مرة — نتأكد يومًا آخر','Correct once — check again another day'],weak:['أحتاج تدريبًا','Needs practice'],new:['لم أجرّبه','Not tried yet']};
function letterGrid(s,{clickable=false}={}){return `<div class="lc-grid" dir="rtl">${ALPHABET.map(L=>{const st=letterStatus(s,L.l);const m=(s.letterMap||{})[L.l];return `<${clickable?'button':'div'} class="lc-cell ${st}${m&&m.t?' teacher':''}" data-l="${L.l}" title="${LC_LABEL[st][0]}">${L.l}</${clickable?'button':'div'}>`}).join('')}</div><div class="lc-legend"><span class="known">أعرفه</span><span class="learning">صحيح مرة</span><span class="weak">أحتاج تدريبًا</span><span class="new">لم أجرّبه</span></div>`}

/* اختيار 7 حروف للجلسة: الضعيفة أولًا، ثم الجديدة، ثم التي تحتاج تأكيدًا في يوم جديد */
function pickSessionLetters(s){const t=today();const rank=L=>{const st=letterStatus(s,L.l),m=(s.letterMap||{})[L.l];if(st==='known')return 9;if(st==='weak')return 0;if(st==='new')return 1;return m&&m.d.includes(t)?5:2};
 const order=ALPHABET.map((L,i)=>({L,i,r:rank(L)})).filter(x=>x.r<9).sort((a,b)=>a.r-b.r||a.i-b.i);
 /* الحروف الجديدة تأتي بترتيب المجموعات (أ–خ ثم د–ص ...) حتى لا يُرهق الطالب */
 return order.slice(0,LC_GROUP).map(x=>x.L)}

function openLetterCheck(from){const s=current();if(!s)return;show('checkScreen');refreshHud();const b=$('checkBoard');const k=knownCount(s);
 b.innerHTML=`<div class="write-intro"><div class="big-emoji"><span class="ab-icon" aria-hidden="true">أ ب ت</span></div><h2>فحص الحروف</h2>${G('Letter check')}<p class="prompt-ar">${s.completed[0]||!s.letterCheck?'تدرّب على الحروف التي لم تتقنها بعد.':`قبل المحطة الأولى، نتأكد أنك تعرف الحروف. تحتاج ${LC_TARGET} حرفًا من 28.`}</p>${G(s.completed[0]||!s.letterCheck?'Practise the letters you have not mastered yet.':`Before the first station, let's make sure you know the letters. You need ${LC_TARGET} of 28.`)}<div class="lc-progress"><b>${k}</b> / 28<div class="bar"><b style="width:${Math.round(k/28*100)}%"></b></div></div>${letterGrid(s)}<p class="note">كل جلسة 7 حروف. الحرف يصبح أخضر عندما تعرفه في يومين مختلفين. ${G('7 letters per session. A letter turns green when you know it on two different days.')}</p><div class="form-actions center-row"><button class="big-btn ghost" data-lab><span class="ab-icon" aria-hidden="true">أ ب ت</span> مختبر الحروف</button>${k<28?'<button class="big-btn primary" data-go>ابدأ الجلسة ▶</button>':''}</div></div>`;
 const go=b.querySelector('[data-go]');if(go)go.onclick=runLetterCheck;b.querySelector('[data-lab]').onclick=()=>openLab('checkScreen')}

function runLetterCheck(){const s=current();const letters=pickSessionLetters(s);if(!letters.length)return openLetterCheck();
 const others=l=>ALPHABET.filter(x=>x.l!==l);
 const conf=l=>{const c=[...((WRITING.confusable||{})[l]||'')].filter(x=>ALPHABET.some(A=>A.l===x)&&x!==l);const pool=[...new Set([...c,...shuffle(others(l).map(x=>x.l))])];return pool.slice(0,2)};
 const qs=[];letters.forEach(L=>{const snd=L.l==='ا'?'أَ':L.l+'َ';
  const o1=shuffle([L.l,...conf(L.l)]);qs.push({l:L.l,type:'sound',speak:snd,opts:o1,ans:o1.indexOf(L.l)});
  const ds=sample(others(L.l).filter(x=>x.e!==L.e),2);const o2=shuffle([L,...ds]);qs.push({l:L.l,type:'pic',opts:o2.map(x=>({e:x.e,w:x.word,en:x.en})),ans:o2.indexOf(L),L})});
 /* نفرّق سؤالي الحرف الواحد حتى لا يأتيا متتاليين */
 const order=[...qs.filter(q=>q.type==='sound'),...shuffle(qs.filter(q=>q.type==='pic'))];
 const res={};let i=0;const b=$('checkBoard');setCombo(0);
 function draw(){const q=order[i];clearTimers();stopAudio();
  const isSound=q.type==='sound';
  b.innerHTML=activityHead('فَحْصُ الحُرُوفِ','Letter check',i,order.length,'<span class="ab-icon" aria-hidden="true">أ ب ت</span> '+letters.map(x=>x.l).join(' '))+
   `<p class="prompt-ar">${isSound?'اسْتَمِعْ، ثُمَّ اخْتَرِ الحَرْفَ.':'أَيُّ صُورَةٍ تَبْدَأُ بِهَذَا الحَرْفِ؟'}</p>${G(isSound?'Listen, then choose the letter.':'Which picture starts with this letter?')}`+
   `<div class="activity-target ${isSound?'listen-target':''}">${isSound?'🎧':`<span class="ar-text lc-show">${q.l}</span>`}</div>`+
   `${isSound?'<div class="sound-actions"><button class="control-btn" data-hear>🔊 استمع</button><button class="control-btn" data-slow>🐢 ببطء</button></div>':''}<div data-c></div><div class="feedback" data-feed></div><div class="after-actions" data-after></div>`;
  if(isSound){b.querySelector('[data-hear]').onclick=()=>speak(q.speak,.75);b.querySelector('[data-slow]').onclick=()=>speak(q.speak,.5);later(()=>speak(q.speak,.75),300)}
  /* في سؤال الصورة لا نقرأ الكلمات، حتى يعتمد الطالب على شكل الحرف */
  const btns=renderOptions(b.querySelector('[data-c]'),q.opts,{withAudio:false,tl:false,onPick:idx=>{const ok=idx===q.ans;lockAndMark(btns,idx,q.ans,true);beep(ok);reward(ok);res[q.l]=(res[q.l]===undefined?true:res[q.l])&&ok;
   const f=b.querySelector('[data-feed]');const L=ALPHABET.find(x=>x.l===q.l);
   if(ok){const p=praise();f.className='feedback good';f.innerHTML=`<b>${p[0]}</b>${G(p[1])}`;if(!isSound)later(()=>speak(L.word,.75),200);later(nxt,1100)}
   else{logError('letters',q.l);f.className='feedback bad';f.innerHTML=`هذا حرف <b class="ar-text">${q.l}</b> — ${esc(L.name)} ${TL(L.name)} <span class="reveal-word">${L.e} ${esc(L.word)}</span>${G('This is the letter '+L.tr)}`;later(()=>speakSeries([L.name,q.l==='ا'?'أَ':q.l+'َ',L.word],.7),300);nextButton(b.querySelector('[data-after]'),'',nxt)}}});
 }
 function nxt(){i++;if(i<order.length)draw();else finish()}
 function finish(){const s=current();letters.forEach(L=>recordLetter(s,L.l,!!res[L.l]));s.attempts.letterCheck=(s.attempts.letterCheck||0)+1;const got=letters.filter(L=>res[L.l]).length;s.points+=got*2;persist();refreshHud();const k=knownCount(s);const opened=s.letterCheck&&!s.completed[0]&&k>=LC_TARGET;if(got>=5)confetti();
  b.innerHTML=`<div class="stage-finish"><div class="trophy">${opened?'🔓':'<span class="ab-icon" aria-hidden="true">أ ب ت</span>'}</div><h2>${opened?'فتحت المحطة الأولى!':'انتهت الجلسة'}</h2>${G(opened?'You opened the first station!':'Session finished')}<div class="lc-session">${letters.map(L=>`<span class="lc-cell ${res[L.l]?'learning':'weak'}">${L.l}<i>${res[L.l]?'✓':'✗'}</i></span>`).join('')}</div><p>عرفت <b>${got}</b> من ${letters.length} حروف في هذه الجلسة.</p>${G(`You knew ${got} of ${letters.length} letters this session.`)}<div class="lc-progress"><b>${k}</b> / 28 ${G('letters mastered')}<div class="bar"><b style="width:${Math.round(k/28*100)}%"></b></div></div>${letterGrid(s)}${!opened&&s.letterCheck&&!s.completed[0]?`<p class="note">الحروف الصحيحة اليوم تصبح خضراء عندما تعرفها مرة أخرى في يوم آخر. ${G('Letters you got right today turn green when you get them right again on another day.')}</p>`:''}<div class="form-actions center-row"><button class="big-btn ghost" data-map>الخريطة</button>${letters.some(L=>!res[L.l])?'<button class="big-btn gold" data-lab><span class="ab-icon" aria-hidden="true">أ ب ت</span> راجع في مختبر الحروف</button>':''}${opened?'<button class="big-btn primary" data-open>ابدأ المحطة الأولى ▶</button>':k<28?'<button class="big-btn primary" data-again>جلسة جديدة ▶</button>':''}</div></div>`;
  const q=sel=>b.querySelector(sel);q('[data-map]').onclick=()=>{prepareWorld();show('worldScreen')};if(q('[data-lab]'))q('[data-lab]').onclick=()=>openLab('checkScreen');if(q('[data-again]'))q('[data-again]').onclick=runLetterCheck;if(q('[data-open]'))q('[data-open]').onclick=()=>{prepareWorld();launchStage(0)}}
 draw()}

/* ================= استيراد الطلبة من Excel =================
   يقرأ الملف على الجهاز نفسه (بدون إنترنت)، ويتعرف على أعمدة الاسم والصف والشعبة ولغة المساعدة،
   ثم ينشئ الحسابات برقم سري موحّد 1234، ويطلب من الطالب في أول دخول أن يغيّره أو يواصل به. */
const DEFAULT_PIN='1234';
function loadXLSX(){return new Promise((res,rej)=>{if(window.XLSX)return res(window.XLSX);const s=document.createElement('script');s.src='assets/vendor/xlsx.full.min.js';s.onload=()=>res(window.XLSX);s.onerror=()=>rej(new Error('xlsx'));document.head.appendChild(s)})}
const AR_DIGITS={'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
const GRADE_WORDS=[['اول',1],['أول',1],['الأول',1],['ثان',2],['ثاني',2],['ثالث',3],['رابع',4],['خامس',5],['سادس',6]];
function toLatinDigits(t){return String(t??'').replace(/[٠-٩]/g,d=>AR_DIGITS[d])}
function parseGrade(v){const t=toLatinDigits(v).trim();const m=t.match(/[1-6]/);if(m)return +m[0];const w=GRADE_WORDS.find(([k])=>t.includes(k));return w?w[1]:null}
function parseSection(v){const t=toLatinDigits(v).trim();if(!t)return null;const parts=t.split(/[\/\-\s]+/).filter(Boolean);return parts.length>1?parts[parts.length-1]:t}
function parseHelp(v){const t=String(v??'').trim().toLowerCase();if(!t)return null;if(/en|eng|english|انج|إنج/.test(t))return 'en';if(/ar|عرب|بدون|لا|off|no/.test(t))return 'off';return null}
function cleanName(v){return String(v??'').replace(/\s+/g,' ').trim()}
/* التعرف على الأعمدة من صف العناوين */
function detectColumns(rows){const find=(cells,words)=>cells.findIndex(c=>{const t=String(c??'').toLowerCase().replace(/\s+/g,'');return words.some(w=>t.includes(w))});
 for(let r=0;r<Math.min(5,rows.length);r++){const cells=rows[r]||[];const name=find(cells,['اسم','الاسم','name','student','الطالب']);if(name>=0){return{header:r,name,grade:find(cells,['الصف','صف','grade','class','المستوى']),section:find(cells,['الشعبة','شعبة','section','فصل']),help:find(cells,['لغة','language','help','مساعدة'])}}}
 /* بدون عناوين: أطول عمود نصي هو الاسم */
 const width=Math.max(...rows.map(r=>(r||[]).length),1);let best=0,score=-1;for(let c=0;c<width;c++){const sc=rows.reduce((a,r)=>a+(/[\u0600-\u06FFa-z]{2,}/i.test(String((r||[])[c]??''))?String(r[c]).length:0),0);if(sc>score){score=sc;best=c}}
 return{header:-1,name:best,grade:-1,section:-1,help:-1}}
function readRows(XLSX,buf,name){let wb;
 if(/\.csv$/i.test(name)){/* ملفات CSV: UTF-8 أولًا، ثم الترميز العربي القديم Windows-1256 الذي يحفظ به Excel القديم */
  let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch{try{text=new TextDecoder('windows-1256').decode(buf)}catch{text=new TextDecoder('utf-8').decode(buf)}}
  wb=XLSX.read(text.replace(/^\uFEFF/,''),{type:'string'})}
 else wb=XLSX.read(buf,{type:'array'});
 return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:false})}

function openImport(){if(!isAdmin())return adminLogin();
 overlay(`<div class="studio"><h2>📥 استيراد الطلبة من Excel</h2>
 <p>ارفعي ملف Excel فيه أسماء الطلبة. تتعرف اللعبة تلقائيًا على الأعمدة: <b>الاسم</b> (مطلوب)، و<b>الصف</b> و<b>الشعبة</b> و<b>لغة المساعدة</b> (اختيارية). كل الحسابات تُنشأ برقم سري <b dir="ltr">1234</b>، ويُسأل الطالب في أول دخول: يغيّره أو يواصل به.</p>
 <div class="form-row"><div class="form-field"><label for="impGrade">الصف (إذا لم يكن في الملف)</label><select id="impGrade">${[1,2,3,4,5,6].map(g=>`<option value="${g}">${g}</option>`).join('')}</select></div><div class="form-field"><label for="impSection">الشعبة (إذا لم تكن في الملف)</label><input id="impSection" value="أ"></div></div>
 <div class="form-field"><label for="impHelp">لغة المساعدة (إذا لم تكن في الملف)</label><select id="impHelp"><option value="en">English — ترجمة ونطق لاتيني</option><option value="off">بدون — عربي فقط</option></select></div>
 <div class="form-actions"><label class="big-btn primary upload-label">📂 اختيار ملف Excel<input id="impFile" type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" hidden></label><button class="big-btn ghost" id="impTemplate">⬇️ تنزيل نموذج فارغ</button><button class="big-btn ghost" id="cancelOverlay">إلغاء</button></div>
 <div id="impStatus" class="feedback">الصيغ المدعومة: xlsx و xls و csv.</div><div id="impPreview"></div></div>`);
 $('cancelOverlay').onclick=closeOverlay;
 $('impTemplate').onclick=async()=>{try{const X=await loadXLSX();const ws=X.utils.aoa_to_sheet([['الاسم','الصف','الشعبة','لغة المساعدة'],['أحمد علي',3,'أ','English'],['Ravi Kumar',3,'أ','English'],['يوسف محمد',3,'ب','عربي']]);ws['!cols']=[{wch:28},{wch:8},{wch:8},{wch:14}];const wb=X.utils.book_new();wb.Workbook={Views:[{RTL:true}]};X.utils.book_append_sheet(wb,ws,'الطلبة');X.writeFile(wb,'نموذج_أسماء_الطلبة.xlsx')}catch{flash('تعذر إنشاء النموذج')}};
 $('impFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const st=$('impStatus');st.className='feedback';st.textContent='جارٍ قراءة الملف...';
  let X;try{X=await loadXLSX()}catch{st.className='feedback bad';st.innerHTML='تعذر تحميل قارئ Excel. تأكدي أن مجلد <b>assets/vendor</b> موجود مع اللعبة.';return}
  try{const buf=await f.arrayBuffer();const rows=readRows(X,buf,f.name).filter(r=>r&&r.some(c=>String(c).trim()));if(!rows.length){st.className='feedback bad';st.textContent='الملف فارغ.';return}
   const col=detectColumns(rows);const data=rows.slice(col.header+1);
   const dg=+$('impGrade').value,ds=$('impSection').value.trim()||'أ',dh=$('impHelp').value;
   const seenInFile=new Set();
   const list=data.map((r,idx)=>{const name=cleanName(r[col.name]);const grade=(col.grade>=0&&parseGrade(r[col.grade]))||dg;const section=(col.section>=0&&parseSection(r[col.section]))||ds;const help=(col.help>=0&&parseHelp(r[col.help]))||dh;
    let status='new';if(!name||name.length<2)status='empty';else{const key=norm(name)+'|'+grade+'|'+section;if(seenInFile.has(key))status='dupfile';else if(db.students.some(s=>norm(s.name)===norm(name)&&+s.grade===grade&&String(s.section)===String(section)))status='exists';seenInFile.add(key)}
    return{row:idx+col.header+2,name,grade,section,help,status,include:status==='new'}});
   renderImportPreview(list,col,rows[col.header]||[])}
  catch(err){st.className='feedback bad';st.textContent='تعذر قراءة الملف. تأكدي أنه ملف Excel صحيح.'}}}

function renderImportPreview(list,col,headers){const st=$('impStatus');const ok=list.filter(x=>x.status==='new').length,ex=list.filter(x=>x.status==='exists').length,dup=list.filter(x=>x.status==='dupfile').length,emp=list.filter(x=>x.status==='empty').length;
 const colName=i=>i>=0?`«${esc(headers[i]||'عمود '+(i+1))}»`:'—';
 st.className='feedback good';st.innerHTML=`الطلبة الجدد: <b>${ok}</b>${ex?` — موجودون مسبقًا (لن يُكرروا): <b>${ex}</b>`:''}${dup?` — مكرر في الملف: <b>${dup}</b>`:''}${emp?` — صفوف بلا اسم: <b>${emp}</b>`:''}<br><small>الأعمدة: الاسم ${colName(col.name)} · الصف ${colName(col.grade)} · الشعبة ${colName(col.section)} · اللغة ${colName(col.help)}</small>`;
 const label={new:'<span class="status active">جديد</span>',exists:'<span class="status grad">موجود مسبقًا</span>',dupfile:'<span class="status support">مكرر في الملف</span>',empty:'<span class="status support">بلا اسم</span>'};
 $('impPreview').innerHTML=`<div class="table-wrap imp-table"><table class="admin-table"><thead><tr><th>✓</th><th>السطر في Excel</th><th>الاسم</th><th>الصف</th><th>الشعبة</th><th>اللغة</th><th>الحالة</th></tr></thead><tbody>${list.map((x,i)=>`<tr class="${x.include?'':'muted-row'}"><td><input type="checkbox" data-i="${i}" ${x.include?'checked':''} ${x.status==='empty'?'disabled':''} aria-label="تضمين"></td><td>${x.row}</td><td><b>${esc(x.name)||'—'}</b></td><td>${x.grade}</td><td>${esc(x.section)}</td><td>${x.help==='en'?'English':'عربي'}</td><td>${label[x.status]}</td></tr>`).join('')}</tbody></table></div><div class="form-actions"><button class="big-btn gold" id="impGo">إنشاء الحسابات (<span id="impN">${ok}</span>)</button></div>`;
 $('impPreview').querySelectorAll('[data-i]').forEach(c=>c.onchange=()=>{list[+c.dataset.i].include=c.checked;c.closest('tr').classList.toggle('muted-row',!c.checked);$('impN').textContent=list.filter(x=>x.include).length});
 $('impGo').onclick=()=>{const chosen=list.filter(x=>x.include&&x.name);if(!chosen.length)return flash('لم يتم اختيار أي طالب');
  if(CLOUD){const btn=$('impGo');btn.disabled=true;btn.textContent='جارٍ الإنشاء في قاعدة البيانات...';
   rpc('admin_create_students',{p_token:cloud.token,p_list:chosen.map(x=>({name:x.name,grade:x.grade,section:x.section,data:{support:x.help,translit:x.help==='en',pinPrompt:true,imported:new Date().toISOString(),completed:Array(8).fill(false),mastery:{},points:0,stage:0,tier:0,cefr:'Pre-A1'}}))})
    .then(made=>{const created=made.map(mergeStudent);persist();showImportDone(created)}).catch(e=>{btn.disabled=false;btn.textContent='إنشاء الحسابات';flash(cloudMsg(e))});return}
  const created=chosen.map(x=>{const s=blankStudent(x.name,x.grade,x.section,DEFAULT_PIN,x.help);s.pinPrompt=true;s.imported=new Date().toISOString();db.students.push(s);return s});persist();showImportDone(created)}}

function showImportDone(created){overlay(`<div class="studio center"><div class="big-emoji">✅</div><h2>تم إنشاء الحسابات: ${created.length}</h2><p>الرقم السري لكل الطلبة: <b dir="ltr">1234</b>. في أول دخول يختار الطالب تغييره أو المواصلة به.</p><div class="table-wrap imp-table"><table class="admin-table"><thead><tr><th>الطالب</th><th>الرمز</th><th>الصف</th></tr></thead><tbody>${created.map(s=>`<tr><td>${esc(s.name)}</td><td dir="ltr"><b>${esc(s.code)}</b></td><td>${s.grade}/${esc(s.section)}</td></tr>`).join('')}</tbody></table></div><div class="form-actions center-row"><button class="big-btn primary" id="impCards">🖨️ طباعة بطاقات الدخول</button><button class="big-btn ghost" id="impXlsx">⬇️ تنزيل القائمة Excel</button><button class="big-btn ghost" id="impClose">إغلاق</button></div></div>`);
 $('impCards').onclick=()=>printLoginCards(created);$('impXlsx').onclick=()=>exportLogins(created);$('impClose').onclick=()=>{closeOverlay();showAdmin()}}
async function exportLogins(list){try{const X=await loadXLSX();const ws=X.utils.aoa_to_sheet([['الاسم','رمز الطالب','الرقم السري المبدئي','الصف','الشعبة'],...list.map(s=>[s.name,s.code,pinIsDefault(s)?DEFAULT_PIN:'(غيّره الطالب)',s.grade,s.section])]);ws['!cols']=[{wch:28},{wch:12},{wch:18},{wch:6},{wch:8}];const wb=X.utils.book_new();wb.Workbook={Views:[{RTL:true}]};X.utils.book_append_sheet(wb,ws,'بيانات الدخول');X.writeFile(wb,'بيانات_دخول_الطلبة.xlsx')}catch{flash('تعذر إنشاء الملف')}}
/* بطاقات دخول للقص: 10 بطاقات في الصفحة */
function printLoginCards(list){const w=window.open('','_blank');if(!w)return flash('اسمح بالنوافذ المنبثقة للطباعة');const base=location.href.replace(/[^/]*$/,'');
 w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>بطاقات الدخول</title><style>@page{size:A4;margin:10mm}body{font-family:Tahoma,Arial;margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6mm}.card{border:2px dashed #7fa6b8;border-radius:10px;padding:5mm 6mm;height:44mm;box-sizing:border-box;display:flex;gap:5mm;align-items:center;break-inside:avoid}.card img{width:18mm}.n{font-size:17pt;font-weight:bold;color:#0d3f65;margin-bottom:2mm}.r{font-size:12pt;margin:1mm 0}.r b{font-size:16pt;letter-spacing:1px;font-family:Arial}.s{font-size:9pt;color:#555;margin-top:2mm}.e{font-size:8.5pt;color:#555;direction:ltr;text-align:right}</style></head><body><div class="grid">${list.map(s=>`<div class="card"><img src="${base}assets/logo.webp" alt=""><div><div class="n">${esc(s.name)}</div><div class="r">رمز الطالب: <b dir="ltr">${esc(s.code)}</b></div><div class="r">الرقم السري: <b dir="ltr">${pinIsDefault(s)?DEFAULT_PIN:'••••'}</b></div><div class="s">مغامرة المأمون — الصف ${s.grade}/${esc(s.section)}</div><div class="e">Student code + PIN. You can change your PIN when you log in.</div></div></div>`).join('')}</div><script>setTimeout(()=>print(),500)<\/script></body></html>`);w.document.close()}

/* ================= الرقم السري: الاختيار في أول دخول ================= */
function askPinChoice(s,then){overlay(`<div class="center"><div class="big-emoji">🔐</div><h2>مرحبًا ${esc(s.name)}!</h2>${G('Welcome!')}<p>رقمك السري الآن <b dir="ltr">1234</b>. هل تريد أن تغيّره إلى رقم خاص بك؟</p>${G('Your PIN is 1234. Do you want to change it to your own PIN?')}<div class="form-actions center-row"><button class="big-btn ghost" id="pinKeep">المواصلة بنفس الرقم ${G('Keep 1234')}</button><button class="big-btn primary" id="pinChange">تغيير الرقم السري ${G('Change PIN')}</button></div></div>`);
 $('pinKeep').onclick=()=>{s.pinPrompt=false;persist();closeOverlay();then()};
 $('pinChange').onclick=()=>changeStudentPin(s,then)}
function changeStudentPin(s,then){overlay(`<div class="center"><h2>🔐 رقم سري جديد</h2>${G('New PIN')}<p>اختر 4 أرقام تتذكرها. ${G('Choose 4 numbers you can remember.')}</p><div class="form-field"><label for="sp1">الرقم الجديد <small dir="ltr">New PIN</small></label><input id="sp1" type="password" inputmode="numeric" maxlength="4" dir="ltr" class="pin-input" autocomplete="off"></div><div class="form-field"><label for="sp2">أعد كتابته <small dir="ltr">Type it again</small></label><input id="sp2" type="password" inputmode="numeric" maxlength="4" dir="ltr" class="pin-input" autocomplete="off"></div><div class="form-actions center-row"><button class="big-btn ghost" id="spCancel">رجوع</button><button class="big-btn primary" id="spSave">حفظ ✓</button></div></div>`);
 $('spCancel').onclick=()=>{if(s.pinPrompt)askPinChoice(s,then);else{closeOverlay();then&&then()}};
 const save=()=>{const a=toLatinDigits($('sp1').value.trim()),b=toLatinDigits($('sp2').value.trim());if(!/^\d{4}$/.test(a))return flash('اكتب 4 أرقام — Use 4 digits');if(a!==b)return flash('الرقمان غير متطابقين — PINs do not match');if(a===DEFAULT_PIN)return flash('اختر رقمًا غير 1234 — Choose a PIN other than 1234');
  if(CLOUD){$('spSave').disabled=true;return rpc('student_set_pin',{p_token:cloud.token,p_new:a}).then(()=>{s.pinDefault=false;s.pinPrompt=false;s.pinChanged=new Date().toISOString();persist();pinSaved()}).catch(e=>{$('spSave').disabled=false;flash(cloudMsg(e))})}
  s.pin=a;s.pinPrompt=false;s.pinChanged=new Date().toISOString();persist();pinSaved()};
 const pinSaved=()=>{overlay(`<div class="center"><div class="big-emoji">✅</div><h2>تم حفظ رقمك السري</h2>${G('Your new PIN is saved.')}<p>احفظه جيدًا ولا تخبر به أحدًا.</p>${G('Remember it and keep it secret.')}<button class="big-btn primary" id="spDone">متابعة ▶</button></div>`);$('spDone').onclick=()=>{closeOverlay();then&&then()}};
 $('spSave').onclick=save;$('sp2').onkeydown=e=>{if(e.key==='Enter')save()}}

/* إضافة طالب واحد من لوحة الإدارة */
function addOneStudent(){overlay(`<h2>➕ طالب جديد</h2><div class="form-field"><label for="aoName">اسم الطالب</label><input id="aoName"></div><div class="form-row"><div class="form-field"><label for="aoGrade">الصف</label><select id="aoGrade">${[1,2,3,4,5,6].map(g=>`<option>${g}</option>`).join('')}</select></div><div class="form-field"><label for="aoSec">الشعبة</label><input id="aoSec" value="أ"></div></div><div class="form-field"><label for="aoHelp">لغة المساعدة</label><select id="aoHelp"><option value="en">English</option><option value="off">عربي فقط</option></select></div><p class="muted">الرقم السري المبدئي 1234، ويُسأل الطالب في أول دخول إن كان يريد تغييره.</p><div class="form-actions"><button class="big-btn ghost" id="cancelOverlay">إلغاء</button><button class="big-btn gold" id="aoGo">إنشاء</button></div>`);$('cancelOverlay').onclick=closeOverlay;
 $('aoGo').onclick=()=>{const name=$('aoName').value.trim();if(!name)return flash('اكتب اسم الطالب');const g=+$('aoGrade').value,sec=$('aoSec').value.trim()||'أ',h=$('aoHelp').value;
  if(CLOUD){$('aoGo').disabled=true;return rpc('admin_create_students',{p_token:cloud.token,p_list:[{name,grade:g,section:sec,data:{support:h,translit:h==='en',pinPrompt:true,completed:Array(8).fill(false),mastery:{},points:0,stage:0,tier:0,cefr:'Pre-A1'}}]}).then(m=>{const s=mergeStudent(m[0]);persist();showImportDone([s])}).catch(e=>{$('aoGo').disabled=false;flash(cloudMsg(e))})}
  const s=blankStudent(name,g,sec,DEFAULT_PIN,h);s.pinPrompt=true;db.students.push(s);persist();showImportDone([s])}}

/* ================= المهام والوتيرة =================
   • كل محطة مقسمة إلى مهام (MISSIONS). المحطة تكتمل عند اجتياز كل مهامها بـ 80%.
   • حد يومي للمهام الجديدة (تحدده الإدارة). إعادة المهام المجتازة للتدريب مفتوحة دائمًا.
   • بوابات المراجعة بين العوالم لا تُفتح في يوم اجتياز المهمة التي قبلها. */
let curMi=0,practiceRun=false;
function curMission(){return MISSIONS[selectedStage][curMi]||MISSIONS[selectedStage][0]}
function mScore(s,i,mi){return ((s.missions||{})[i]||[])[mi]}
function mDone(s,i,mi){return (mScore(s,i,mi)||0)>=80}
function nextMi(s,i){return MISSIONS[i].findIndex((_,mi)=>!mDone(s,i,mi))}
function doneCount(s,i){return MISSIONS[i].filter((_,mi)=>mDone(s,i,mi)).length}
function perDay(){return +(db.pacing&&db.pacing.perDay)||0}
function todayNew(s){return (s.dayLog||{})[today()]||0}
function dailyLeft(s){const p=perDay();return p?Math.max(0,p-todayNew(s)):99}
function prevMissionDate(s,i,mi){if(mi>0)return ((s.mDates||{})[i]||[])[mi-1];if(i>0){const L=MISSIONS[i-1].length-1;return ((s.mDates||{})[i-1]||[])[L]}return null}
/* هل يستطيع بدء هذه المهمة؟ يعيد {ok, why, whyEn} */
function missionAccess(s,i,mi){
 if(!stageUnlocked(s,i))return{ok:false,why:'المحطة مقفلة',whyEn:'Station locked',icon:'🔒'};
 if(mDone(s,i,mi))return{ok:true,practice:true};
 const nx=nextMi(s,i);if(mi!==nx)return{ok:false,why:'أكمل المهمة السابقة أولًا',whyEn:'Finish the previous mission first',icon:'🔒'};
 if(i===0&&needsLetterCheck(s))return{ok:false,why:'فحص الحروف أولًا',whyEn:'Letter check first',icon:'🔤',check:true};
 if(dailyLeft(s)<=0)return{ok:false,why:'المهمة الجديدة تُفتح غدًا — العب جولة تدريب الآن',whyEn:'New mission opens tomorrow — play a practice round now',icon:'🌙',tomorrow:true};
 if(MISSIONS[i][mi].gate&&prevMissionDate(s,i,mi)===today())return{ok:false,why:'البوابة تُفتح غدًا لنتأكد أنك تتذكر',whyEn:'The gate opens tomorrow — to check you remember',icon:'🌙',tomorrow:true};
 return{ok:true}}
function stationStars(s,i){const sc=MISSIONS[i].map((_,mi)=>mScore(s,i,mi)||0);if(sc.some(x=>x<80))return 0;const avg=sc.reduce((a,b)=>a+b,0)/sc.length;return avg>=97?3:avg>=88?2:1}
function missionDots(s,i){return MISSIONS[i].map((_,mi)=>mDone(s,i,mi)?'●':'○').join('')}
function activeDays(s){return (s.seenDays||[]).length}
function logActivity(s){s.seenDays=s.seenDays||[];const t=today();if(!s.seenDays.includes(t)){s.seenDays.push(t);s.seenDays=s.seenDays.slice(-120)}}
/* أقل عدد أيام ممكن لإنهاء البرنامج بالوتيرة الحالية (لعرضه للإدارة) */
function minDays(p){let day=1,used=0,lastDay=0;MISSIONS.forEach(ms=>ms.forEach(m=>{if(p&&used>=p){day++;used=0}if(m.gate&&lastDay===day){day++;used=0}used++;lastDay=day}));return day}

/* لوحة المهام داخل بطاقة المحطة على الخريطة */
function renderMissionList(i){const s=current();const panel=$('missionPanel');let box=$('missionList');if(!box){box=document.createElement('div');box.id='missionList';box.className='mission-list';panel.insertBefore(box,panel.querySelector('.mission-bottom'))}
 const left=dailyLeft(s),p=perDay();
 box.innerHTML=`<div class="ml-head"><b>المهام ${doneCount(s,i)}/${MISSIONS[i].length}</b>${p?`<span class="day-pill ${left?'':'empty'}">📅 مهام اليوم: ${todayNew(s)}/${p}</span>`:''}</div>`+MISSIONS[i].map((m,mi)=>{const a=missionAccess(s,i,mi);const done=mDone(s,i,mi);const st=done?'done':a.ok?'next':a.tomorrow?'tomorrow':'locked';const sc=mScore(s,i,mi);
  return `<button class="ml-item ${st}" data-mi="${mi}" ${a.ok?'':'aria-disabled="true"'}><span class="ml-icon">${done?'✅':a.ok?m.i:a.icon}</span><span class="ml-text"><b>${esc(m.n)}</b>${G(m.en)}${!done&&!a.ok?`<small class="ml-why">${esc(a.why)}</small>`:''}</span><span class="ml-meta">${done?starText(sc>=100?3:sc>=90?2:1):m.gate?'🚪':''}</span></button>`}).join('');
 box.querySelectorAll('.ml-item').forEach(b=>b.onclick=()=>{const mi=+b.dataset.mi;const a=missionAccess(s,i,mi);if(a.check)return openLetterCheck();if(!a.ok){if(a.tomorrow)return startPractice(i,a);flash(a.why+' — '+a.whyEn);return}launchStage(i,mi)});
 /* زر البدء الرئيسي */
 const btn=$('enterStageBtn');const nx=nextMi(s,i);
 if(nx<0){btn.innerHTML='🔁 تدرّب من جديد';btn.disabled=false;btn.onclick=()=>launchStage(i,Math.floor(Math.random()*MISSIONS[i].length))}
 else{const a=missionAccess(s,i,nx);if(a.ok){btn.innerHTML=`ابدأ المهمة ${nx+1}/${MISSIONS[i].length} ▶`;btn.disabled=false;btn.onclick=()=>launchStage(i,nx)}
  else if(a.check){btn.innerHTML='فحص الحروف ▶';btn.disabled=false;btn.onclick=()=>openLetterCheck()}
  else if(a.tomorrow){btn.innerHTML='▶ العب — جولة تدريب';btn.disabled=false;btn.onclick=()=>startPractice(i,a)}
  else{btn.innerHTML='🔒 مقفلة';btn.disabled=true}}}

/* لا نوقف الطالب أبدًا: عندما تكون المهمة الجديدة لغد، يلعب فورًا جولة تدريب بأسئلة جديدة من مهام أتقنها */
function practicePick(s,prefI){const done=[];MISSIONS.forEach((ms,i)=>ms.forEach((m,mi)=>{if(mDone(s,i,mi)&&m.t!=='treasure'&&!m.gate)done.push({i,mi,sc:mScore(s,i,mi)||0})}));if(!done.length)return null;
 const same=done.filter(x=>x.i===prefI);const pool=same.length?same:done;pool.sort((a,b)=>a.sc-b.sc);const top=pool.slice(0,Math.max(2,Math.ceil(pool.length/2)));return top[Math.floor(Math.random()*top.length)]}
function startPractice(prefI,a){const s=current();const pk=practicePick(s,prefI);
 if(!pk){/* لا توجد مهام متقنة بعد: نسمح بالمهمة نفسها بدل الإيقاف */const nx=nextMi(s,prefI);return launchStage(prefI,nx<0?0:nx,true)}
 practiceRun=true;launchStage(pk.i,pk.mi,true);later(()=>{coach('جَوْلَةُ تَدْرِيبٍ! المُهِمَّةُ الجَدِيدَةُ تُفْتَحُ غَدًا.','Practice round! The new mission opens tomorrow.','happy')},60);flash('جولة تدريب ⭐ — المهمة الجديدة تُفتح غدًا')}
function showTomorrow(a){startPractice(selectedStage,a)}

/* تسجيل نتيجة المهمة */
function recordMission(s,i,mi,score){s.missions[i]=s.missions[i]||MISSIONS[i].map(()=>null);s.mDates[i]=s.mDates[i]||MISSIONS[i].map(()=>null);const wasDone=mDone(s,i,mi);const old=s.missions[i][mi]||0;s.missions[i][mi]=Math.max(old,score);
 let firstPass=false,stationDone=false;if(score>=80&&!wasDone){firstPass=true;s.mDates[i][mi]=today();s.dayLog[today()]=(s.dayLog[today()]||0)+1;if(nextMi(s,i)<0){stationDone=true;if(i<8){s.completed[i]=true;s.stage=Math.max(s.stage,Math.min(8,i+1))}}}
 if(nextMi(s,i)<0)s.stars[i]=Math.max(s.stars[i]||0,stationStars(s,i));logActivity(s);return{firstPass,stationDone,wasDone}}

/* ===== نهاية المهمة (تحل محل finishStage القديمة) ===== */
function finishStage(key,correct,total){const s=current(),score=Math.round(correct/Math.max(1,total)*100),pass=score>=80;const i=selectedStage,mi=curMi,m=curMission();updateSkill(key,correct,total);addAttempt(key);const b=board();
 if(pass){const stars=score>=100?3:score>=90?2:1;const r=recordMission(s,i,mi,score);s.points+=r.firstPass?15+stars*5:(stars>=3?3:1);if(r.stationDone)s.points+=25;
  let levelUp=false;const t=tierFor(key);if(score>=95&&t<3&&!r.wasDone){s.skillTier[key]=t+1;levelUp=true}
  s.failStreak=s.failStreak||{};s.failStreak[key]=0;persist();refreshHud();confetti();beep(true);
  const st=STAGES[i];const nx=nextMi(s,i);const acc=nx>=0?missionAccess(s,i,nx):null;
  coach(r.stationDone?'أَكْمَلْتَ المَحَطَّةَ كُلَّهَا!':'أَحْسَنْتَ! أَتْقَنْتَ هَذِهِ المُهِمَّةَ.',r.stationDone?'You completed the whole station!':'Well done! You mastered this mission.','happy');
  let nextHtml='';
  if(r.stationDone)nextHtml=`<div class="sticker-won"><span>${st.reward}</span><b>${esc(st.rewardName)}</b>${G('New sticker! The next station is open.')}</div>`;
  else if(nx>=0&&acc&&acc.ok)nextHtml=`<p class="level-up">المهمة التالية جاهزة: <b>${esc(MISSIONS[i][nx].n)}</b> ${G('Next mission is ready: '+MISSIONS[i][nx].en)}</p>`;
  else if(nx>=0&&acc&&acc.tomorrow)nextHtml=`<p class="level-up">🌙 ${esc(acc.why)} ${G(acc.whyEn)}</p>`;
  const progress=`<div class="mission-progress">${MISSIONS[i].map((mm,k)=>`<span class="${mDone(s,i,k)?'on':''} ${k===mi?'cur':''}" title="${esc(mm.n)}">${mDone(s,i,k)?'★':k+1}</span>`).join('')}</div>`;
  b.innerHTML=`<div class="stage-finish"><div class="trophy">${r.stationDone?'🏆':'⭐'}</div><h2>${r.stationDone?'أكملت المحطة!':r.wasDone?'تدريب رائع!':'أتقنت المهمة!'}</h2>${G(r.stationDone?'Station complete!':r.wasDone?'Great practice!':'Mission mastered!')}<div class="stars-row" aria-label="${stars} من 3 نجوم">${[1,2,3].map(n=>`<span class="${n<=stars?'on':''}" style="animation-delay:${n*.18}s">★</span>`).join('')}</div><div class="mastery-badge">${score}%</div>${progress}${nextHtml}${levelUp?`<p class="level-up">⬆️ ارتفع مستوى هذه المهارة! ${G('This skill levelled up!')}</p>`:''}<div class="form-actions center-row"><button class="big-btn ghost" data-retry>🔁 العب مرة أخرى</button>${nx>=0&&acc&&acc.ok&&!r.stationDone?'<button class="big-btn gold" data-next>المهمة التالية ▶</button>':''}${(nx>=0&&acc&&acc.tomorrow)||(r.stationDone&&dailyLeft(s)<=0)?'<button class="big-btn gold" data-keep>▶ استمر باللعب</button>':''}<button class="big-btn primary" data-map>الخريطة ▶</button></div></div>`;
  b.querySelector('[data-retry]').onclick=()=>launchStage(i,mi);const nb=b.querySelector('[data-next]');if(nb)nb.onclick=()=>launchStage(i,nx);const kb=b.querySelector('[data-keep]');if(kb)kb.onclick=()=>startPractice(i);
  b.querySelector('[data-map]').onclick=()=>{prepareWorld();show('worldScreen');later(()=>{const target=r.stationDone?Math.min(8,i+1):i;if(stageUnlocked(s,target)){moveExplorer(target);sparkAtNode(target);selectStage(target,false)}},400)}}
 else{s.failStreak=s.failStreak||{};s.failStreak[key]=(s.failStreak[key]||0)+1;let eased=false;if(s.failStreak[key]>=2&&tierFor(key)>0){s.skillTier[key]=tierFor(key)-1;s.failStreak[key]=0;eased=true}
  recordMission(s,i,mi,score);persist();coach('سَنَتَدَرَّبُ مَعًا خُطْوَةً خُطْوَةً.','We will practise together, step by step.','think');
  b.innerHTML=`<div class="stage-finish"><div class="trophy">🛟</div><h2>سنرفع مستواك خطوة بخطوة</h2>${G('Let\'s practise a little more.')}<div class="mastery-badge support-score">${score}%</div><p>تحتاج إلى 80% لإتقان هذه المهمة. سنلعب تدريبًا أسهل أولًا ثم تعيد المحاولة.</p>${G('You need 80% to master this mission. First an easier practice, then try again.')}${eased?`<p class="level-up">سنجعل الأسئلة أسهل قليلًا. ${G('The questions will be a little easier.')}</p>`:''}<button class="big-btn gold" data-support>ابدأ التدريب ▶</button></div>`;
  b.querySelector('[data-support]').onclick=()=>{const s2=current();s2.supports[key]=(s2.supports[key]||0)+1;persist();renderStageActivity({remedial:true})}}}

/* ================= أنشطة جديدة لعالم الحروف ================= */
const HUNT_SETS=[['ب','ت','ن','م','ل','س','ر','د'],['ج','ح','خ','ش','ف','ق','ك','ي','ب','ت','ن'],['ص','ض','ط','ظ','ع','غ','ه','ث','ذ','ز'],ALPHABET.map(L=>L.l).filter(l=>l!=='ا')];
const JOINS=l=>!'ادذرزو'.includes(l);
function huntForms(l,t){if(!JOINS(l))return [l,'ـ'+l];if(t<=0)return [l,l];if(t===1)return [l,l+'ـ','ـ'+l];return [l,l+'ـ','ـ'+l+'ـ','ـ'+l]}
function confusableOf(l){const c=[...(((WRITING||{}).confusable||{})[l])||''].filter(x=>ALPHABET.some(A=>A.l===x)&&x!==l);return c}
function sylOf(l,v){if(l==='أ'||l==='ا')return v==='ِ'?'إِ':'أ'+v;return l+v}
function mTitle(){const m=curMission();return[m.n,m.en]}
function tierTag(key,ctx){return ctx.remedial?'🛟 تدريب علاجي':'المستوى '+(tierFor(key)+1)}

/* 🎯 صيد الحروف: المس كل أشكال الحرف بين حروف متشابهة */
function actHunt(ctx){const t=ctx.remedial?0:tierFor('letters');const rounds=ctx.remedial?2:4;const targets=freshSample('hunt'+t,HUNT_SETS[t],rounds,!ctx.remedial);let r=0,score=0;const [ti,te]=mTitle();
 function draw(){clearTimers();const l=targets[r];const L=ALPHABET.find(x=>x.l===l);const nT=ctx.remedial?3:4,nD=ctx.remedial?5:8;
  const conf=confusableOf(l);const pool=[...conf,...shuffle(HUNT_SETS[Math.min(3,t+1)].filter(x=>x!==l&&!conf.includes(x)))];
  const forms=huntForms(l,t);const cells=[...Array(nT)].map((_,k)=>({l,f:forms[k%forms.length],hit:true}));
  for(let k=0;k<nD;k++){const d=k<conf.length*2?conf[k%conf.length]:pool[k%pool.length];const fs=huntForms(d,t);cells.push({l:d,f:fs[Math.floor(Math.random()*fs.length)],hit:false})}
  const grid=shuffle(cells);let found=0,miss=0,done=false;const b=board();
  b.innerHTML=activityHead(ti,te,r,rounds,tierTag('letters',ctx))+`<div class="hunt-target"><button class="hunt-letter" data-say>${l}</button><div><p class="prompt-ar">المِسْ كُلَّ حَرْفِ «${l}» — بِكُلِّ أَشْكَالِهِ.</p>${G('Tap every '+L.tr+' — in all its shapes.')}<div class="hunt-count"><b data-found>0</b> / ${nT}</div></div></div><div class="hunt-grid" dir="rtl">${grid.map((c,k)=>`<button class="bubble" data-k="${k}" style="animation-delay:${(k%5)*.3}s">${c.f}</button>`).join('')}</div><div class="feedback" data-feed></div>`;
  const say=()=>speakSeries([L.name,sylOf(l,'َ')],.75);b.querySelector('[data-say]').onclick=say;later(say,300);
  b.querySelectorAll('.bubble').forEach(btn=>btn.onclick=()=>{if(done||btn.disabled)return;const c=grid[+btn.dataset.k];
   if(c.hit){btn.disabled=true;btn.classList.add('pop');found++;beep(true);b.querySelector('[data-found]').textContent=found;
    if(found===nT){done=true;const sc=Math.max(0,1-miss*.25);score+=sc;reward(miss===0,miss===0);const f=b.querySelector('[data-feed]');f.className='feedback good';f.innerHTML=(miss?`وجدتها كلها! (${miss} لمسة خاطئة)`:'<b>ممتاز! بدون أخطاء</b>')+G(miss?'You found them all!':'Perfect — no mistakes!');later(()=>{r++;if(r<rounds)draw();else endActivity('letters',score,rounds,ctx)},1200)}}
   else{miss++;btn.classList.add('shake','nope');setTimeout(()=>btn.classList.remove('shake'),450);beep(false);reward(false);logError('letters',l+'≠'+c.l);speak(ALPHABET.find(x=>x.l===c.l)?ALPHABET.find(x=>x.l===c.l).name:c.l,.9)}})}
 draw()}

/* 🧱 ركّب الصوت: اختر الحرف ثم الحركة لتكوّن المقطع الذي سمعته */
function actSyllable(ctx){const t=ctx.remedial?0:tierFor('letters');const n=ctx.remedial?3:6;const letters=freshSample('syl'+t,HUNT_SETS[t],n,!ctx.remedial);
 const V=[['َ','فَتْحَة','a'],['ِ','كَسْرَة','i'],['ُ','ضَمَّة','u']];const LONG=[['َا','أَلِف مَدّ','aa'],['ِي','يَاء مَدّ','ii'],['ُو','وَاو مَدّ','uu']];
 let i=0,score=0;const [ti,te]=mTitle();
 function draw(){clearTimers();const l=letters[i];const useLong=t>=3&&Math.random()<.5;const vs=useLong?LONG:V;const v=vs[Math.floor(Math.random()*3)];const target=sylOf(l,v[0]);
  const lopts=shuffle([l,...shuffle(confusableOf(l).length?confusableOf(l):HUNT_SETS[t].filter(x=>x!==l)).slice(0,ctx.remedial?1:2)]);
  let pl=null,pv=null,tries=0,done=false;const b=board();
  b.innerHTML=activityHead(ti,te,i,n,tierTag('letters',ctx))+`<p class="prompt-ar">اسْتَمِعْ، ثُمَّ اخْتَرِ الحَرْفَ وَالحَرَكَةَ.</p>${G('Listen, then choose the letter and the vowel.')}<div class="sound-actions"><button class="control-btn" data-hear>🔊 استمع</button><button class="control-btn" data-slow>🐢 ببطء</button></div><div class="syl-preview" data-prev><span>؟</span></div><div class="syl-row"><span class="syl-label">الحَرْف ${G('Letter')}</span><div class="syl-opts" data-letters>${lopts.map(x=>`<button class="syl-tile" data-l="${x}">${x}</button>`).join('')}</div></div><div class="syl-row"><span class="syl-label">الحَرَكَة ${G('Vowel')}</span><div class="syl-opts" data-vowels>${vs.map((x,k)=>`<button class="syl-tile vowel" data-v="${k}"><b>◌${x[0]}</b><small>${x[1]}</small></button>`).join('')}</div></div><div class="feedback" data-feed></div><div class="after-actions" data-after></div>`;
  const q=s=>b.querySelector(s);q('[data-hear]').onclick=()=>speak(target,.7);q('[data-slow]').onclick=()=>speak(target,.45);later(()=>speak(target,.7),300);
  const upd=()=>{q('[data-prev]').innerHTML=`<span>${pl?sylOf(pl,pv!=null?vs[pv][0]:''):(pv!=null?'◌'+vs[pv][0]:'؟')}</span>`;if(pl&&pv!=null&&!done)check()};
  b.querySelectorAll('[data-l]').forEach(x=>x.onclick=()=>{if(done)return;pl=x.dataset.l;b.querySelectorAll('[data-l]').forEach(y=>y.classList.toggle('sel',y===x));speak(ALPHABET.find(A=>A.l===pl).name,.9);upd()});
  b.querySelectorAll('[data-v]').forEach(x=>x.onclick=()=>{if(done)return;pv=+x.dataset.v;b.querySelectorAll('[data-v]').forEach(y=>y.classList.toggle('sel',y===x));upd()});
  function check(){const ok=pl===l&&vs[pv][0]===v[0];const f=q('[data-feed]');speak(sylOf(pl,vs[pv][0]),.7);
   if(ok){done=true;if(tries===0)score++;else score+=.5;beep(true);reward(true,tries===0);q('[data-prev]').classList.add('good');q('[data-prev]').innerHTML=`<span>${target}</span>${TL(target)}`;const p=praise();f.className='feedback good';f.innerHTML=`<b>${p[0]}</b>${G(p[1])}`;later(()=>{i++;if(i<n)draw();else endActivity('letters',score,n,ctx)},1300);return}
   tries++;beep(false);reward(false);
   if(tries>=2){done=true;logError('letters',target);q('[data-prev]').innerHTML=`<span>${target}</span>${TL(target)}`;f.className='feedback bad';f.innerHTML=`الصوت هو «${target}»: حرف ${l} مع ${v[1]}.${G('The sound is '+translit(target)+'.')}`;later(()=>speak(target,.6),700);nextButton(q('[data-after]'),'',()=>{i++;if(i<n)draw();else endActivity('letters',score,n,ctx)})}
   else{f.className='feedback bad';f.innerHTML=(pl!==l?'الحرف غير صحيح. ':'')+(vs[pv][0]!==v[0]?'الحركة غير صحيحة. ':'')+'استمع وحاول مرة أخرى.'+G((pl!==l?'Wrong letter. ':'')+(vs[pv][0]!==v[0]?'Wrong vowel. ':'')+'Listen and try again.');later(()=>{q('[data-prev]').classList.remove('good');pl=null;pv=null;b.querySelectorAll('.syl-tile').forEach(y=>y.classList.remove('sel'));upd();speak(target,.6)},1100)}}}
 draw()}

/* 🔍 أين الحرف في الكلمة؟ أول / وسط / آخر — مع شكل الحرف في كل موضع */
function actInWord(ctx){const t=ctx.remedial?0:tierFor('letters');const n=ctx.remedial?3:6;const maxLen=[4,5,6,8][t];
 const cands=[];Object.keys(VOCAB).forEach(w=>{if((VOCAB[w].k||'n')!=='n')return;const gs=graphemes(w).map(g=>g.replace(HARAKAT,''));if(gs.length<3||gs.length>maxLen)return;gs.forEach((b,k)=>{if(!JOINS(b)||b==='ة'||b==='ء'||b==='ى'||!ALPHABET.some(A=>A.l===b))return;if(gs.filter(x=>x===b).length!==1)return;/* بعد حرف لا يتصل يظهر الحرف بشكل أول الكلمة؛ نتجنب هذه الحالة */if(k>0&&!JOINS(gs[k-1]))return;cands.push({w,l:b,k,pos:k===0?0:k===gs.length-1?2:1})})});
 /* نوازن بين المواضع الثلاثة */
 const byPos=[0,1,2].map(p=>shuffle(cands.filter(c=>c.pos===p)));const items=[];const usedW=new Set();for(let k=0;items.length<n&&k<60;k++){const arr=byPos[k%3];const c=arr.find(x=>!usedW.has(x.w));if(c){usedW.add(c.w);items.push(c)}}
 const POS=[['فِي أَوَّلِهَا','start'],['فِي وَسَطِهَا','middle'],['فِي آخِرِهَا','end']];let i=0,score=0;const [ti,te]=mTitle();
 function draw(){clearTimers();const c=items[i];const L=ALPHABET.find(x=>x.l===c.l);const v=VOCAB[c.w];const b=board();
  const forms=[c.l+'ـ','ـ'+c.l+'ـ','ـ'+c.l];let opts=[0,1,2];if(ctx.remedial)opts=shuffle(opts.filter(p=>p!==c.pos)).slice(0,1).concat(c.pos).sort();
  b.innerHTML=activityHead(ti,te,i,items.length,tierTag('letters',ctx))+`<p class="prompt-ar">أَيْنَ حَرْفُ «${c.l}» فِي الكَلِمَةِ؟</p>${G('Where is the letter '+L.tr+' in the word?')}<div class="inword-card"><span class="pic-big">${v.e}</span><span class="ar-text inword-word" data-word>${esc(c.w)}</span><div class="sound-actions"><button class="control-btn" data-hw>🔊 الكلمة</button><button class="control-btn" data-hl>🔊 الحرف ${c.l}</button></div></div><div class="choice-grid inword-opts ${opts.length===2?'two':''}" data-c>${opts.map(p=>`<div class="choice-wrap"><button class="choice ar" data-p="${p}"><span class="ar-text">${forms[p]}</span><small class="pos-label">${POS[p][0]}</small>${G(POS[p][1])}</button></div>`).join('')}</div><div class="feedback" data-feed></div><div class="after-actions" data-after></div>`;
  const q=s=>b.querySelector(s);q('[data-hw]').onclick=()=>speak(c.w,.65);q('[data-hl]').onclick=()=>speakSeries([L.name,sylOf(c.l,'َ')],.75);later(()=>speakSeries([c.w,L.name],.7),300);
  const btns=[...b.querySelectorAll('[data-p]')];btns.forEach(btn=>btn.onclick=()=>{const p=+btn.dataset.p,ok=p===c.pos;btns.forEach(x=>x.disabled=true);btn.classList.add(ok?'correct':'wrong');if(!ok)btns.find(x=>+x.dataset.p===c.pos).classList.add('reveal');beep(ok);reward(ok);
   /* نلوّن الحرف داخل الكلمة */const gs=graphemes(c.w);q('[data-word]').innerHTML=gs.map((g,k)=>k===c.k?`<span class="hl">${esc(g)}</span>`:esc(g)).join('');
   const f=q('[data-feed]');if(ok){score++;const pr=praise();f.className='feedback good';f.innerHTML=`<b>${pr[0]}</b>${G(pr[1])}`;later(()=>{i++;if(i<items.length)draw();else endActivity('letters',score,items.length,ctx)},1300)}
   else{logError('letters',c.w+':'+c.l);f.className='feedback bad';f.innerHTML=`الحرف «${c.l}» ${POS[c.pos][0]}، وشكله هكذا: <b class="ar-text">${forms[c.pos]}</b>${G('The letter is at the '+POS[c.pos][1]+' of the word.')}`;later(()=>speak(c.w,.6),300);nextButton(q('[data-after]'),'',()=>{i++;if(i<items.length)draw();else endActivity('letters',score,items.length,ctx)})}})}
 if(!items.length)return endActivity('letters',1,1,ctx);draw()}

/* ================= أنشطة جديدة للأصوات ================= */
/* 👂 نفس الصوت أم مختلف؟ — لا يحتاج إلى القراءة إطلاقًا */
function actSameDiff(ctx){const t=ctx.remedial?0:tierFor('sounds');const n=ctx.remedial?4:8;const pairs=freshSample('sd'+t,BANK.sounds[t],n,!ctx.remedial);let i=0,score=0;const [ti,te]=mTitle();
 const items=pairs.map((p,k)=>{const a=p[Math.floor(Math.random()*p.length)];const same=k%2===0?Math.random()<.5:Math.random()<.35;const bb=same?a:p.filter(x=>x!==a)[0];return{a,b:bb,same:a===bb}});
 function draw(){clearTimers();const x=items[i];const b=board();let done=false;
  b.innerHTML=activityHead(ti,te,i,n,tierTag('sounds',ctx))+`<p class="prompt-ar">اسْتَمِعْ إِلَى الصَّوْتَيْنِ: هَلْ هُمَا نَفْسُ الصَّوْتِ؟</p>${G('Listen to the two sounds. Are they the same?')}<div class="sd-pair"><button class="sd-bubble" data-one>🔊<b>1</b></button><button class="sd-bubble" data-two>🔊<b>2</b></button></div><div class="sound-actions"><button class="control-btn" data-again>🔁 استمع مرة أخرى</button></div><div class="choice-grid two sd-answers"><div class="choice-wrap"><button class="choice sd-btn" data-ans="same"><span class="sd-sym">=</span><b>نَفْسُ الصَّوْتِ</b>${G('Same')}</button></div><div class="choice-wrap"><button class="choice sd-btn" data-ans="diff"><span class="sd-sym">≠</span><b>مُخْتَلِفَانِ</b>${G('Different')}</button></div></div><div class="feedback" data-feed></div><div class="after-actions" data-after></div>`;
  const q=s=>b.querySelector(s);const one=q('[data-one]'),two=q('[data-two]');
  const play=()=>speakSeries([x.a,x.b],.62,k=>{one.classList.toggle('lit',k===0);two.classList.toggle('lit',k===1)});
  one.onclick=()=>speak(x.a,.62);two.onclick=()=>speak(x.b,.62);q('[data-again]').onclick=play;later(play,350);
  b.querySelectorAll('[data-ans]').forEach(btn=>btn.onclick=()=>{if(done)return;done=true;const ok=(btn.dataset.ans==='same')===x.same;b.querySelectorAll('[data-ans]').forEach(z=>z.disabled=true);btn.classList.add(ok?'correct':'wrong');if(!ok)b.querySelector(`[data-ans="${x.same?'same':'diff'}"]`).classList.add('reveal');beep(ok);reward(ok);
   one.innerHTML=`<span class="ar-text">${esc(x.a)}</span>`;two.innerHTML=`<span class="ar-text">${esc(x.b)}</span>`;const f=q('[data-feed]');
   if(ok){score++;const p=praise();f.className='feedback good';f.innerHTML=`<b>${p[0]}</b>${G(p[1])}`;later(()=>{i++;if(i<n)draw();else endActivity('sounds',score,n,ctx)},1400)}
   else{logError('sounds',x.a+'/'+x.b);f.className='feedback bad';f.innerHTML=(x.same?'الصوتان متطابقان.':`الصوتان مختلفان: «${esc(x.a)}» و«${esc(x.b)}».`)+G(x.same?'They were the same sound.':'They were different sounds.');later(()=>speakSeries([x.a,x.b],.5),400);nextButton(q('[data-after]'),'',()=>{i++;if(i<n)draw();else endActivity('sounds',score,n,ctx)})}})}
 draw()}

/* 🧺 سلّتا الأصوات: كل صوت يُسمع يذهب إلى سلّة حرفه */
const SORT_PAIRS=[[['ح','ه'],['س','ص'],['ت','ط'],['ك','ق'],['ذ','ز'],['ع','أ']],[['ح','خ'],['ث','س'],['د','ض'],['غ','ع'],['ظ','ذ'],['ق','غ']]];
function actSort(ctx){const t=ctx.remedial?0:tierFor('sounds');const set=SORT_PAIRS[t>=2?1:0];const pair=freshSample('sort'+t,set,1,!ctx.remedial)[0];const n=ctx.remedial?4:8;const [ti,te]=mTitle();
 const V=['َ','ِ','ُ'];const words=t>=2?Object.keys(VOCAB).filter(w=>(VOCAB[w].k||'n')==='n'&&pair.includes(baseLetter(w)==='ا'?'أ':baseLetter(w))):[];
 const items=[...Array(n)].map((_,k)=>{const l=pair[k%2];const w=words.filter(x=>(baseLetter(x)==='ا'?'أ':baseLetter(x))===l);if(w.length&&Math.random()<.4){const ww=w[Math.floor(Math.random()*w.length)];return{say:ww,l,pic:VOCAB[ww].e}}return{say:sylOf(l,V[Math.floor(Math.random()*3)]),l}});
 const order=shuffle(items);let i=0,score=0;
 function draw(){clearTimers();const x=order[i];const b=board();let tries=0,done=false;const Ls=pair.map(l=>ALPHABET.find(A=>A.l===(l==='أ'?'ا':l)));
  b.innerHTML=activityHead(ti,te,i,n,tierTag('sounds',ctx))+`<p class="prompt-ar">اسْتَمِعْ، ثُمَّ ضَعِ الصَّوْتَ فِي سَلَّةِ حَرْفِهِ.</p>${G('Listen, then put the sound in the right basket.')}<div class="sort-card"><button class="sort-token" data-play>${x.pic?`<span class="pic-emoji">${x.pic}</span>`:'🔊'}</button></div><div class="baskets" dir="rtl">${pair.map((l,k)=>`<button class="basket" data-b="${l}"><span class="basket-letter">${l}</span><span class="basket-ex">${esc(sylOf(l,'َ'))} ${esc(sylOf(l,'ِ'))} ${esc(sylOf(l,'ُ'))}</span><span class="basket-icon">🧺</span></button>`).join('')}</div><div class="feedback" data-feed></div>`;
  const q=s=>b.querySelector(s);q('[data-play]').onclick=()=>speak(x.say,.65);later(()=>speak(x.say,.65),350);
  b.querySelectorAll('[data-b]').forEach(btn=>btn.onclick=()=>{if(done)return;const ok=btn.dataset.b===x.l;const f=q('[data-feed]');
   if(ok){done=true;if(tries===0)score++;beep(true);reward(true,tries===0);btn.classList.add('fill');q('[data-play]').classList.add('drop');f.className='feedback good';f.innerHTML=`<b class="ar-text">${esc(x.say)}</b> ← ${x.l} ${G(translit(x.say))}`;later(()=>{i++;if(i<n)draw();else endActivity('sounds',score,n,ctx)},1100)}
   else{tries++;beep(false);reward(false);logError('sounds',x.say);btn.classList.add('shake');setTimeout(()=>btn.classList.remove('shake'),450);f.className='feedback bad';f.innerHTML='استمع مرة أخرى 👂'+G('Listen again');later(()=>speakSeries([x.say,sylOf(pair[0],'َ'),sylOf(pair[1],'َ')],.55),300);if(tries>=2){done=true;b.querySelector(`[data-b="${x.l}"]`).classList.add('reveal');later(()=>{i++;if(i<n)draw();else endActivity('sounds',score,n,ctx)},2600)}}})}
 draw()}

/* ================= أنشطة جديدة لعالم الكلمات ================= */
/* 👂 أي كلمة سمعت؟ الخيارات كلمات متشابهة الشكل تختلف في حرف واحد */
function nearMisses(w,count){const gs=graphemes(w);const idx=shuffle(gs.map((_,k)=>k).filter(k=>{const b=gs[k].replace(HARAKAT,'');return confusableOf(b).length&&b!=='ة'}));const out=new Set();
 for(const k of idx){const b=gs[k].replace(HARAKAT,'');for(const c of shuffle(confusableOf(b))){const ng=[...gs];ng[k]=gs[k].replace(b,c);const nw=ng.join('');if(nw!==w)out.add(nw);if(out.size>=count)break}if(out.size>=count)break}
 return [...out].slice(0,count)}
function hearWordItems(t,n,ctx){const list=BANK.wordReading[t];const words=freshSample('hw'+t,list,n,!ctx.remedial);
 return words.map(w=>{let d=nearMisses(w,ctx.remedial?1:2);if(d.length<(ctx.remedial?1:2))d=d.concat(sample(list.filter(x=>x!==w&&!d.includes(x)),(ctx.remedial?1:2)-d.length));const all=shuffle([w,...d]);const v=VOCAB[w];
  return{prompt:'اسْتَمِعْ، ثُمَّ اخْتَرِ الكَلِمَةَ المَكْتُوبَةَ.',en:'Listen, then choose the written word.',target:'🎧',targetClass:'listen-target',speak:w,opts:all,ans:all.indexOf(w),optAudio:false,optTL:false,answerSpeak:w,reveal:`<span class="ar-text">${esc(w)}</span>${TL(w)}${v?G(v.e+' '+v.en):''}`,log:w}})}
function actHearWord(ctx){const t=ctx.remedial?0:tierFor('wordReading');const [ti,te]=mTitle();runMCQ('wordReading',hearWordItems(t,ctx.remedial?3:6,ctx),ctx,ti,te)}
/* 🧠 المطابقة الكبرى: 6 أزواج */
function actBigMatch(ctx){const t=ctx.remedial?0:tierFor('wordMeaning');const set=BANK.wordMeaning[t];const pool=(set.mode==='context'?set.match:set.words).filter(w=>VOCAB[w]);const words=freshSample('bm'+t,pool,ctx.remedial?3:6,!ctx.remedial);
 const uniq=[];words.forEach(w=>{if(!uniq.some(u=>VOCAB[u].e===VOCAB[w].e))uniq.push(w)});matchGame(uniq,(mc,mt)=>endActivity('wordMeaning',mc,mt,ctx))}

/* 🚪 بوابة المراجعة: أسئلة مختلطة من العالم كله، بلا تلميحات */
function actReview(ctx){const m=curMission();let items;
 if(m.zone==='letters'){const t=ctx.remedial?0:tierFor('letters');items=shuffle([...lettersItems(t,ctx.remedial?2:5,ctx),...soundsItems(ctx.remedial?0:tierFor('sounds'),ctx.remedial?2:5,ctx).map(x=>Object.assign(x,{practice:null}))])}
 else{const t=ctx.remedial?0:tierFor('wordReading');const tm=ctx.remedial?0:tierFor('wordMeaning');const set=BANK.wordMeaning[tm];const wpool=(set.mode==='context'?set.match:set.words).filter(w=>VOCAB[w]&&(VOCAB[w].k||'n')==='n');
  const pics=freshSample('rv'+tm,wpool.length>=5?wpool:Object.keys(VOCAB).filter(w=>(VOCAB[w].k||'n')==='n'),ctx.remedial?2:5,!ctx.remedial).map(w=>{const ds=sample(Object.keys(VOCAB).filter(x=>x!==w&&(VOCAB[x].k||'n')==='n'&&VOCAB[x].e!==VOCAB[w].e),ctx.remedial?1:2);const all=shuffle([w,...ds]);return{prompt:'مَا الكَلِمَةُ المُنَاسِبَةُ لِلصُّورَةِ؟',en:'Which word matches the picture?',target:`<span class="pic-big">${VOCAB[w].e}</span>`,targetClass:'pic-target',opts:all,ans:all.indexOf(w),optAudio:false,optTL:false,answerSpeak:w,reveal:`<span class="pic-big">${VOCAB[w].e}</span><span class="ar-text">${esc(w)}</span>${TL(w)}${G(VOCAB[w].en)}`,log:w}});
  items=shuffle([...hearWordItems(t,ctx.remedial?2:5,ctx),...pics])}
 const [ti,te]=mTitle();runMCQ(m.k,items,ctx,ti,te)}

/* ================= نقاط المهام على طريق الخريطة =================
   مهام كل محطة تظهر نقاطًا على الطريق بينها وبين المحطة التالية،
   فيرى الطالب كم بقي له ليصل، ويمشي المستكشف عليها كلما أتقن مهمة. */
function nodePos(i){const n=document.querySelector(`.station-node[data-stage="${i}"]`);return n?{x:parseFloat(n.style.getPropertyValue('--x')),y:parseFloat(n.style.getPropertyValue('--y'))}:null}
/* نختار مواقع النقاط على الطريق في أماكن خالية من أسماء المحطات واللوحات */
let dotCache=null;
function freeFractions(i,n){const world=$('mapBox');const a=nodePos(i),b=nodePos(i+1)||a;if(!world)return null;const W=world.getBoundingClientRect();
 const blocks=[...world.querySelectorAll('.station-node,.station-node span')].map(el=>{const r=el.getBoundingClientRect();return{l:r.left-W.left-8,r:r.right-W.left+8,t:r.top-W.top-8,b:r.bottom-W.top+8}});
 const free=[];for(let f=.08;f<=.92;f+=.01){const x=(a.x+(b.x-a.x)*f)/100*W.width,y=(a.y+(b.y-a.y)*f)/100*W.height;if(!blocks.some(k=>x>k.l&&x<k.r&&y>k.t&&y<k.b))free.push(f)}
 if(free.length<n)return null;
 /* نوزع النقاط بالتساوي على المواقع الخالية */return[...Array(n)].map((_,k)=>free[Math.round((k+.5)*free.length/n-.5)])}
function dotPos(i,k,n){const a=nodePos(i),b=nodePos(i+1)||a;dotCache=dotCache||{};const key=i+':'+n;if(!(key in dotCache))dotCache[key]=freeFractions(i,n);const fr=dotCache[key];const f=fr?fr[k]:.24+.52*(k+.5)/n;return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}}
/* الخريطة تحافظ على أبعاد الصورة الأصلية، فتبقى أسماء المحطات فوق معالمها تمامًا */
const MAP_AR=1536/928;
function fitMap(){const world=document.querySelector('.world'),box=$('mapBox');if(!world||!box)return;const panel=$('missionPanel');const mobile=innerWidth<=760;
 const W=world.clientWidth,H=world.clientHeight;const pw=mobile?0:((panel&&panel.offsetWidth)||0)+28;const ph=mobile?178:0;
 const aw=Math.max(200,W-pw-16),ah=Math.max(160,H-ph-16);let w=Math.min(aw,ah*MAP_AR),h=w/MAP_AR;
 box.style.width=w+'px';box.style.height=h+'px';box.style.left=(8+(aw-w)/2)+'px';box.style.top=(8+(ah-h)/2)+'px';box.style.setProperty('--mw',w+'px')}
function drawPathDots(){const s=current();const world=$('mapBox');if(!s||!world)return;dotCache=null;fitMap();world.querySelectorAll('.path-dot').forEach(d=>d.remove());
 const trail=[];let here=null;
 for(let i=0;i<8;i++){const ms=MISSIONS[i],unl=stageUnlocked(s,i);const a=nodePos(i);if(!a)continue;
  if(unl){trail.push(a);if(!s.completed[i])here=here||a}
  ms.forEach((m,k)=>{const p=dotPos(i,k,ms.length);const done=mDone(s,i,k);const acc=unl?missionAccess(s,i,k):{ok:false,icon:'🔒'};
   const st=done?'done':!unl?'locked':acc.ok?'next':acc.tomorrow?'tomorrow':'locked';
   const d=document.createElement('button');d.className='path-dot '+st+(m.gate?' gate':'');d.style.left=p.x+'%';d.style.top=p.y+'%';
   d.innerHTML=`<span>${done?'★':m.gate?'🚪':st==='tomorrow'?'🌙':st==='next'?k+1:''}</span>`;d.title=m.n+' — '+m.en;d.setAttribute('aria-label',`${STAGES[i].place}: ${m.n} (${done?'مكتملة':acc.ok?'متاحة':acc.why||'مقفلة'})`);
   d.onclick=e=>{e.stopPropagation();if(!unl)return flash('المحطة مقفلة — Station locked');
    /* اللمسة الأولى تختار المحطة، والثانية تبدأ المهمة */
    if(selectedStage!==i||!d.classList.contains('armed')){world.querySelectorAll('.path-dot.armed').forEach(x=>x.classList.remove('armed'));selectStage(i,false);d.classList.add('armed');const it=document.querySelector(`#missionList .ml-item[data-mi="${k}"]`);if(it){it.classList.add('flash');setTimeout(()=>it.classList.remove('flash'),900);it.scrollIntoView({block:'nearest'})}speak(m.n,.9);return}
    if(acc.check)return openLetterCheck();if(!acc.ok)return acc.tomorrow?startPractice(i,acc):flash(acc.why);launchStage(i,k)};
   world.appendChild(d);
   if(unl&&done&&(i<s.stage||!s.completed[i]))trail.push(p);if(!s.completed[i]&&done)here=p});
 }
 if(stageUnlocked(s,8))trail.push(nodePos(8));
 /* الجزء الذي قطعه الطالب من الطريق يظهر ذهبيًا */
 const svg=document.querySelector('.learning-route');if(svg){let done=svg.querySelector('#learningRouteDone');if(!done){done=document.createElementNS('http://www.w3.org/2000/svg','polyline');done.id='learningRouteDone';svg.appendChild(done)}
  const upto=[];for(const p of trail){upto.push(p);if(here&&p===here)break}done.setAttribute('points',upto.filter(Boolean).map(p=>`${p.x},${p.y}`).join(' '))}
 /* المستكشف يقف عند آخر مهمة أتقنها */
 const ex=$('explorer');const pos=here||nodePos(Math.min(s.stage,8));if(ex&&pos){ex.style.left=pos.x+'%';ex.style.top=pos.y+'%'}}

/* إعادة رسم النقاط عند تغيير حجم الشاشة أو تدويرها */
let dotResizeT=null;window.addEventListener('resize',()=>{clearTimeout(dotResizeT);dotResizeT=setTimeout(()=>{if($('worldScreen').classList.contains('active')){fitMap();drawPathDots()}},200)});
/* على الهاتف: بطاقة المحطة تُطوى أسفل الشاشة حتى لا تغطي الخريطة */
function setupPanelToggle(){const panel=$('missionPanel');if(!panel||panel.querySelector('.panel-toggle'))return;const t=document.createElement('button');t.className='panel-toggle';t.setAttribute('aria-expanded','false');t.innerHTML='<span class="pt-open">▲ المهام</span><span class="pt-close">▼ إخفاء</span>';t.onclick=()=>{const open=panel.classList.toggle('expanded');t.setAttribute('aria-expanded',String(open))};panel.prepend(t)}

/* ================= قاعدة البيانات السحابية (Supabase) =================
   • إذا لم تُملأ الإعدادات في assets/config.js تعمل اللعبة محليًا كما كانت.
   • كل التقدم يُحفظ على الجهاز أولًا، ثم يُرفع تلقائيًا، وإذا انقطع الإنترنت يُرفع عند عودته.
   • التحقق من الرقم السري يتم على الخادم؛ الأرقام السرية لا تُحفظ في المتصفح. */
const CLOUD_KEY='almaamoon_cloud';
let cloud=load(CLOUD_KEY,null)||{};
let syncSnap={},audioSnap={},pacingSnap=null,syncTimer=null,syncBusy=false,syncAgain=false;
function saveCloud(){save(CLOUD_KEY,cloud)}
/* المفتاح القديم (anon JWT) يُرسل في الترويستين، والمفتاح الجديد (sb_publishable_) في apikey فقط */
function rpcHeaders(){const k=String(CFG.supabaseAnonKey).trim();const h={'Content-Type':'application/json',apikey:k};if(!/^sb_publishable_/.test(k))h.Authorization='Bearer '+k;return h}
async function rpc(fn,args){
 let r;try{r=await fetch(CFG.supabaseUrl.replace(/\/+$/,'')+'/rest/v1/rpc/'+fn,{method:'POST',headers:rpcHeaders(),body:JSON.stringify(args||{})})}
 catch(e){const x=new Error('OFFLINE');x.code='OFFLINE';throw x}
 let j=null;try{j=await r.json()}catch{}
 if(!r.ok){const msg=(j&&(j.message||j.hint))||('HTTP_'+r.status);const x=new Error(msg);x.code=msg;throw x}
 if(j&&j.error){const x=new Error(j.error);x.code=j.error;throw x}
 return j}
const CLOUD_MSG={WRONG_LOGIN:'بيانات الدخول غير صحيحة — Wrong code or PIN',LOCKED:'الحساب مقفل 10 دقائق بسبب محاولات خاطئة كثيرة — Locked for 10 minutes',SESSION_EXPIRED:'انتهت الجلسة، سجّل الدخول مرة أخرى — Please log in again',PIN_FORMAT:'الرقم السري غير صالح',PIN_DEFAULT:'اختر رقمًا غير 1234 — Choose a PIN other than 1234',OFFLINE:'لا يوجد اتصال بالإنترنت — No internet connection',AUDIO_TOO_LARGE:'التسجيل طويل جدًا'};
function cloudMsg(e){return CLOUD_MSG[e&&e.code]||('تعذر الاتصال بقاعدة البيانات ('+((e&&e.code)||'?')+')')}
function snapOf(s){const c=Object.assign({},s);delete c.pin;delete c.serverUpdatedAt;return JSON.stringify(c)}
/* يحدّث الكائن نفسه (لا ينشئ جديدًا) حتى لا تفقد الأنشطة المفتوحة مرجعها */
function mergeStudent(obj){let s=db.students.find(x=>x.id===obj.id);if(s){Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,obj)}else{s=Object.assign({},obj);db.students.push(s)}ensureLearnerShape(s);syncSnap[s.id]=snapOf(s);return s}
/* الفرق بين نسختين: فقط الحقول التي تغيّرت (القوائم تُرسل كاملة) */
function isObj(v){return v&&typeof v==='object'&&!Array.isArray(v)}
function deepDiff(a,b){const out={};Object.keys(b).forEach(k=>{if(!(k in a)){out[k]=b[k];return}if(JSON.stringify(a[k])===JSON.stringify(b[k]))return;if(isObj(a[k])&&isObj(b[k])){const d=deepDiff(a[k],b[k]);if(Object.keys(d).length)out[k]=d}else out[k]=b[k]});return out}
function pinIsDefault(s){return CLOUD?s.pinDefault!==false:s.pin===DEFAULT_PIN}

/* مؤشر الحفظ */
function setSync(st){let el=$('syncBadge');if(!CLOUD)return;if(!el){el=document.createElement('div');el.id='syncBadge';el.className='sync-badge';el.setAttribute('role','status');document.body.appendChild(el)}
 const m={ok:['☁️','محفوظ','Saved'],busy:['⏳','جارٍ الحفظ','Saving'],off:['⚠️','غير متصل — سيُحفظ لاحقًا','Offline — will save later'],err:['⚠️','لم يُحفظ — نحاول مجددًا','Not saved — retrying']}[st];el.className='sync-badge '+st;el.innerHTML=`${m[0]} ${m[1]}<small dir="ltr">${m[2]}</small>`;el.hidden=!(cloud.token)}
function scheduleSync(){if(!CLOUD||!cloud.token)return;clearTimeout(syncTimer);syncTimer=setTimeout(runSync,1200)}
async function runSync(){if(!CLOUD||!cloud.token)return;if(syncBusy){syncAgain=true;return}syncBusy=true;
 try{
  if(cloud.role==='student'){const s=current();if(s){const snap=snapOf(s);if(syncSnap[s.id]!==snap){setSync('busy');const r=await rpc('student_sync',{p_token:cloud.token,p_data:JSON.parse(snap),p_base:cloud.base||null});
    if(r.student){/* المعلمة عدّلت إعدادات هذا الطالب: نأخذ إعداداتها */mergeStudent(r.student);refreshHud();if($('worldScreen').classList.contains('active'))prepareWorld()}else syncSnap[s.id]=snap;
    cloud.base=r.updatedAt;cloud.lastSnap=snapOf(s);saveCloud()}}}
  else if(cloud.role==='admin'){
   /* الطلبة الجدد، المعدّلون، والمحذوفون */
   const fresh=db.students.filter(s=>!(s.id in syncSnap));
   if(fresh.length){setSync('busy');const made=await rpc('admin_create_students',{p_token:cloud.token,p_list:fresh.map(s=>({id:s.id,code:s.code,name:s.name,grade:s.grade,section:s.section,pin:s.pin,data:JSON.parse(snapOf(s))}))});
    fresh.forEach(s=>{const i=db.students.indexOf(s);if(i>=0)db.students.splice(i,1)});made.forEach(mergeStudent);if(isAdmin()&&$('adminScreen').classList.contains('active'))showAdmin()}
   for(const s of db.students){const snap=snapOf(s);if(syncSnap[s.id]!==snap){const patch=deepDiff(JSON.parse(syncSnap[s.id]||'{}'),JSON.parse(snap));if(Object.keys(patch).length){setSync('busy');await rpc('admin_update_student',{p_token:cloud.token,p_id:s.id,p_patch:patch})}syncSnap[s.id]=snap}}
   for(const id of Object.keys(syncSnap)){if(!db.students.some(s=>s.id===id)){setSync('busy');await rpc('admin_delete_student',{p_token:cloud.token,p_id:id});delete syncSnap[id]}}
   /* الوتيرة */
   const pj=JSON.stringify(db.pacing||{});if(pacingSnap!==pj){await rpc('admin_set_setting',{p_token:cloud.token,p_key:'pacing',p_value:db.pacing||{}});pacingSnap=pj}
   /* تسجيلات استوديو الصوت */
   const lib=db.audioLibrary||{};
   for(const k of Object.keys(lib)){const sig=lib[k].length+':'+lib[k].slice(-24);if(audioSnap[k]!==sig){setSync('busy');await rpc('admin_save_audio',{p_token:cloud.token,p_key:k,p_data:lib[k]});audioSnap[k]=sig}}
   for(const k of Object.keys(audioSnap)){if(!(k in lib)){await rpc('admin_delete_audio',{p_token:cloud.token,p_key:k});delete audioSnap[k]}}
  }
  setSync('ok')}
 catch(e){if(e.code==='SESSION_EXPIRED'){cloudLogoutLocal();flash(cloudMsg(e));show('startScreen');refreshResume()}else{setSync(e.code==='OFFLINE'?'off':'err')}}
 finally{syncBusy=false;if(syncAgain){syncAgain=false;scheduleSync()}}}
function snapAudio(){audioSnap={};const lib=db.audioLibrary||{};Object.keys(lib).forEach(k=>audioSnap[k]=lib[k].length+':'+lib[k].slice(-24))}
function cloudLogoutLocal(){/* خصوصية الأجهزة المشتركة: لا نترك بيانات الصف على الجهاز بعد خروج الإدارة، ولا بيانات الطالب إذا رُفعت */
 if(cloud.role==='admin'){db.students=[];syncSnap={}}else if(cloud.role==='student'&&cloud.id){const s=db.students.find(x=>x.id===cloud.id);if(s&&cloud.lastSnap===snapOf(s))db.students=db.students.filter(x=>x.id!==cloud.id)}
 cloud={};saveCloud();session=null;persist();const b=$('syncBadge');if(b)b.hidden=true}

/* ===== الدخول ===== */
async function cloudStudentLogin(code,pin){const r=await rpc('student_login',{p_code:code,p_pin:pin});const s=mergeStudent(r.student);cloud={token:r.token,role:'student',id:s.id,lastSnap:snapOf(s),base:s.serverUpdatedAt};saveCloud();session={role:'student',id:s.id};s.lastLogin=new Date().toISOString();persist();setSync('ok');return s}
async function cloudAdminLogin(user,pin){const r=await rpc('admin_login',{p_user:user,p_pin:pin});cloud={token:r.token,role:'admin',pinDefault:r.pinDefault};saveCloud();await cloudLoadAdmin();session={role:'admin'};persist();setSync('ok')}
async function cloudLoadAdmin(){const list=await rpc('admin_list',{p_token:cloud.token});db.students=[];syncSnap={};list.forEach(mergeStudent);pacingSnap=JSON.stringify(db.pacing||{});snapAudio();persist()}
async function cloudLogout(){const t=cloud.token;cloudLogoutLocal();if(t){try{await rpc('session_logout',{p_token:t})}catch{}}}

/* ===== بدء التشغيل ===== */
async function cloudInit(){if(!CLOUD)return;document.body.classList.add('cloud-mode');
 try{const st=await rpc('get_settings',{});if(st&&st.pacing){db.pacing=st.pacing;pacingSnap=JSON.stringify(db.pacing)}}catch{}
 try{const lib=await rpc('get_audio_all',{});db.audioLibrary=lib||{};snapAudio()}catch{}
 if(cloud.token&&cloud.role==='student'){try{const srv=await rpc('student_get',{p_token:cloud.token});const loc=db.students.find(x=>x.id===srv.id);
   /* إذا كان على الجهاز تقدم لم يُرفع بعد نرفعه، وإلا نأخذ نسخة الخادم */
   if(loc&&cloud.lastSnap!==snapOf(loc)){syncSnap[loc.id]=cloud.lastSnap||'';scheduleSync()}else{const m=mergeStudent(srv);cloud.lastSnap=snapOf(m);cloud.base=srv.serverUpdatedAt;saveCloud()}
   session={role:'student',id:srv.id};persist();refreshResume();setSync('ok')}
  catch(e){if(e.code==='SESSION_EXPIRED'){cloudLogoutLocal();refreshResume()}else setSync('off')}}
 else if(cloud.token&&cloud.role==='admin'){try{await cloudLoadAdmin();session={role:'admin'};if($('adminScreen').classList.contains('active'))showAdmin();setSync('ok')}catch(e){if(e.code==='SESSION_EXPIRED'){cloudLogoutLocal();show('startScreen')}else setSync('off')}}
 addEventListener('online',()=>scheduleSync());setInterval(()=>{if(cloud.token)runSync()},30000)}

cloudReadyFlag=true;

/* ================= ملف التقدم + ألبوم الملصقات ================= */
function skillCards(s){return scoredSkills(s).map(k=>{const v=s.mastery[k]||0;return `<div class="skill-card"><h4>${SKILL_NAMES[k]}${G(SKILL_EN[k])}</h4><div class="baseline-current"><span>${v}%</span></div><div class="bar"><b style="width:${v}%"></b></div><small>${v>=80?'متقن ✅':v>=60?'في طور الإتقان':'يحتاج إلى دعم'}</small></div>`}).join('')}
function stickerBook(s){return `<div class="sticker-book">${STAGES.map((st,i)=>{const got=i<8?s.completed[i]:s.graduated;return `<div class="sticker ${got?'got':''}"><span class="sticker-icon">${got?st.reward:'🔒'}</span><b>${esc(st.rewardName)}</b><i>${got?starText(s.stars[i]||0):''}</i></div>`}).join('')}<div class="sticker ${s.writeStars?'got':''}"><span class="sticker-icon">${s.writeStars?'✍️':'🔒'}</span><b>قلم الكاتب</b><i>${s.writeStars?starText(s.writeStars):''}</i></div></div>`}
function showProfile(){const s=current();if(!s)return;show('profileScreen');const before=s.baseline?s.baseline.total:0,now=overall(s),gain=now-before;
 $('profileContent').innerHTML=`<div class="profile-hero"><img src="assets/mascot.webp" alt=""><div><div class="game-label">${s.graduated?'🎓 خريج البرنامج':'🚀 في رحلة التعلم'}</div><h1>${esc(s.name)}</h1><p>رمز الطالب: <b dir="ltr">${esc(s.code)}</b> — الصف ${esc(s.grade)}/${esc(s.section)} — المستوى: <b dir="ltr">${esc(s.cefr)}</b></p><div class="path-preview"><span>البداية ${before}%</span><span>الآن ${now}%</span><span>التحسن ${gain>=0?'+':''}${gain}</span></div></div></div>
 <div class="metric-grid"><div class="metric"><b>${keys(s)}/8</b><span>المحطات${G('Stations')}</span></div><div class="metric"><b>${MISSIONS.reduce((a,_,i)=>a+doneCount(s,i),0)}/${MISSION_TOTAL}</b><span>المهام${G('Missions')}</span></div><div class="metric"><b>${activeDays(s)}</b><span>أيام التعلم${G('Learning days')}</span></div><div class="metric"><b>${s.points}</b><span>النقاط${G('Points')}</span></div><div class="metric"><b>${s.stars.reduce((a,b)=>a+(b||0),0)+(s.writeStars||0)}/30</b><span>النجوم${G('Stars')}</span></div><div class="metric"><b dir="ltr">${esc(s.cefr)}</b><span>CEFR-aligned</span></div></div>
 <h3 class="section-title">ألبوم الملصقات ${G('My sticker book')}</h3>${stickerBook(s)}
 ${s.letterCheck||s.letterMap?`<h3 class="section-title">خريطة حروفي ${G('My letters')} — ${knownCount(s)}/28</h3>${letterGrid(s)}`:''}<h3 class="section-title">مهاراتي ${G('My skills')}</h3><div class="skill-grid">${skillCards(s)}</div>
 <div class="support-box"><h3>🧠 التدريب الذكي ${G('Smart practice')}</h3><p>${esc(supportRecommendation(s))}</p><div class="form-actions"><button class="big-btn primary" id="profileSmartPractice">ابدأ التدريب الذكي ▶</button><button class="big-btn ghost" id="profileLab"><span class="ab-icon" aria-hidden="true">أ ب ت</span> مختبر الحروف</button><button class="big-btn gold" id="profileWrite">✍️ ورشة الكتابة</button></div></div>
 <div class="settings-row"><button class="toggle-btn" id="profilePin">🔐 تغيير الرقم السري</button><button class="toggle-btn" data-toggle="help">🇬🇧 English help</button><button class="toggle-btn" data-toggle="tl">Aa kitaab</button></div>`;
 $('profileSmartPractice').onclick=launchSmartPractice;$('profileLab').onclick=()=>openLab('profileScreen');$('profilePin').onclick=()=>changeStudentPin(s,()=>showProfile());$('profileWrite').onclick=openWorkshop;bindToggles();applyLearnerPrefs()}


/* ================= مدرب النطق بالذكاء الاصطناعي V36.6 ================= */
let aiPronunciationTarget='',aiPronunciationRecorder=null,aiPronunciationStream=null,aiPronunciationChunks=[],aiPronunciationStopTimer=null;

function aiSetStatus(text,kind=''){
 const el=$('aiPronunciationStatus');if(!el)return;
 el.className='ai-pronunciation-status'+(kind?' '+kind:'');
 el.innerHTML=text;
}
function aiSetTarget(t){
 aiPronunciationTarget=t||'';
 document.querySelectorAll('.ai-target').forEach(b=>b.classList.toggle('sel',b.dataset.aiTarget===aiPronunciationTarget));
 const n=$('aiTargetNow');if(n)n.textContent=aiPronunciationTarget;
 if(aiPronunciationTarget)speak(aiPronunciationTarget,isLongVowelSyllable(aiPronunciationTarget)?.88:.68);
}
function audioBufferToWav(audioBuffer){
 const channels=1,sampleRate=audioBuffer.sampleRate,samples=audioBuffer.getChannelData(0),bytesPerSample=2;
 const buffer=new ArrayBuffer(44+samples.length*bytesPerSample),view=new DataView(buffer);
 const write=(off,s)=>{for(let i=0;i<s.length;i++)view.setUint8(off+i,s.charCodeAt(i))};
 write(0,'RIFF');view.setUint32(4,36+samples.length*2,true);write(8,'WAVE');write(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);
 view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channels*bytesPerSample,true);
 view.setUint16(32,channels*bytesPerSample,true);view.setUint16(34,16,true);write(36,'data');
 view.setUint32(40,samples.length*bytesPerSample,true);
 let o=44;for(let i=0;i<samples.length;i++,o+=2){let s=Math.max(-1,Math.min(1,samples[i]));view.setInt16(o,s<0?s*0x8000:s*0x7fff,true)}
 return new Blob([view],{type:'audio/wav'});
}
async function recordingBlobToWav(blob){
 const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw new Error('audio_context');
 const ctx=new Ctx();
 try{
  const ab=await blob.arrayBuffer();
  const decoded=await ctx.decodeAudioData(ab.slice(0));
  return audioBufferToWav(decoded);
 }finally{try{await ctx.close()}catch{}}
}
function saveAIPronunciationResult(target,result){
 const s=current();if(!s)return;
 s.aiPronunciation=s.aiPronunciation||{attempts:0,passed:0,best:{},recent:[]};
 s.aiPronunciation.attempts++;
 if(result.passed)s.aiPronunciation.passed++;
 s.aiPronunciation.best[target]=Math.max(s.aiPronunciation.best[target]||0,+result.score||0);
 s.aiPronunciation.recent.unshift({target,score:+result.score||0,passed:!!result.passed,at:new Date().toISOString()});
 s.aiPronunciation.recent=s.aiPronunciation.recent.slice(0,20);
 persist();
}
async function sendPronunciationToAI(wav,target){
 const form=new FormData();form.append('audio',wav,'pronunciation.wav');form.append('target',target);
 const r=await fetch('/api/pronunciation',{method:'POST',body:form,headers:{'Accept':'application/json'}});
 let data={};try{data=await r.json()}catch{}
 if(!r.ok)throw new Error(data.error||'request_failed');
 return data;
}
async function startAIPronunciation(){
 if(!aiPronunciationTarget)return aiSetStatus('اختَر الصوت الذي تريد التدرب عليه أولًا.','retry');
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')return aiSetStatus('هذا الجهاز لا يدعم التسجيل من المتصفح. جرّب Safari أو Chrome محدثًا.','err');
 const btn=$('aiPronounceBtn');if(!btn)return;
 if(aiPronunciationRecorder&&aiPronunciationRecorder.state!=='inactive'){aiPronunciationRecorder.stop();return}
 try{
  aiPronunciationStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  aiPronunciationChunks=[];
  aiPronunciationRecorder=new MediaRecorder(aiPronunciationStream);
  aiPronunciationRecorder.ondataavailable=e=>{if(e.data&&e.data.size)aiPronunciationChunks.push(e.data)};
  aiPronunciationRecorder.onstop=async()=>{
   clearTimeout(aiPronunciationStopTimer);
   aiPronunciationStream?.getTracks().forEach(t=>t.stop());
   btn.classList.remove('recording');btn.disabled=true;btn.textContent='🧠 جاري التقييم...';
   try{
    const raw=new Blob(aiPronunciationChunks,{type:aiPronunciationRecorder.mimeType||'audio/webm'});
    if(raw.size<800)return aiSetStatus('ما سمعت صوتًا واضحًا. جرّب مرة ثانية وتكلم قريبًا من الجهاز.','retry');
    const wav=await recordingBlobToWav(raw);
    const result=await sendPronunciationToAI(wav,aiPronunciationTarget);
    saveAIPronunciationResult(aiPronunciationTarget,result);
    const heard=result.heard?`<small style="display:block;margin-top:4px">سمعت: ${esc(result.heard)}</small>`:'';
    if(result.passed){aiSetStatus(`✅ ${esc(result.feedback||'ممتاز! نطقك صحيح.')} <b>${Math.round(result.score||0)}%</b>${heard}`,'ok');confetti()}
    else aiSetStatus(`🔁 ${esc(result.feedback||'قريب جدًا، استمع ثم جرّب مرة ثانية.')} <b>${Math.round(result.score||0)}%</b>${heard}`,'retry');
   }catch(e){
    const m=String(e&&e.message||'');
    if(m.includes('missing_api_key'))aiSetStatus('ميزة الذكاء الاصطناعي جاهزة، لكن نحتاج إضافة مفتاح OpenAI في إعدادات Netlify أولًا.','err');
    else if(m.includes('rate_limited'))aiSetStatus('محاولات كثيرة في وقت قصير. جرّب بعد قليل.','retry');
    else aiSetStatus('تعذر تقييم النطق الآن. تأكد من الإنترنت ثم جرّب مرة ثانية.','err');
   }finally{btn.disabled=false;btn.textContent='🎤 انطق الآن'}
  };
  aiPronunciationRecorder.start();
  btn.classList.add('recording');btn.textContent='⏹ إيقاف';
  aiSetStatus(`🔴 أسمعك الآن… قل: <b>${esc(aiPronunciationTarget)}</b>`);
  aiPronunciationStopTimer=setTimeout(()=>{if(aiPronunciationRecorder&&aiPronunciationRecorder.state!=='inactive')aiPronunciationRecorder.stop()},3200);
 }catch{
  aiPronunciationStream?.getTracks().forEach(t=>t.stop());
  btn.classList.remove('recording');btn.textContent='🎤 انطق الآن';
  aiSetStatus('اسمح للمتصفح باستخدام الميكروفون ثم جرّب مرة ثانية.','err');
 }
}
function bindAIPronunciation(){
 document.querySelectorAll('.ai-target').forEach(b=>b.onclick=()=>aiSetTarget(b.dataset.aiTarget));
 const btn=$('aiPronounceBtn');if(btn)btn.onclick=startAIPronunciation;
}


/* ================= مختبر الحروف (تعلّم حر بدون درجات) ================= */
let labReturn='startScreen';
function letterForms(L){const j=L.joins,t='ـ';return[['منفصل','alone',L.l],['أول الكلمة','start',j?L.l+t:L.l],['وسط الكلمة','middle',j?t+L.l+t:t+L.l],['آخر الكلمة','end',t+L.l]]}
function openLab(from){labReturn=from||(current()?'worldScreen':'startScreen');show('labScreen');const cs=current();$('labContent').innerHTML=`<p class="prompt-ar center">المِسْ أَيَّ حَرْفٍ لِتَتَعَلَّمَهُ.</p>${G('Tap any letter to learn it.')}${cs&&cs.diagnosticDone?`<div class="center-row lab-check"><button class="big-btn gold" id="labCheckBtn"><span class="ab-icon" aria-hidden="true">أ ب ت</span> فحص الحروف — أعرف ${knownCount(cs)} من 28</button></div>`:''}<div class="lab-layout"><div class="alphabet-grid" dir="rtl">${ALPHABET.map((L,i)=>`<button class="alpha-btn ${cs&&cs.letterMap?'st-'+letterStatus(cs,L.l):''}" data-i="${i}" aria-label="${esc(L.name)}">${L.l}</button>`).join('')}</div><div class="letter-card" id="letterCard"></div></div>`;if($('labCheckBtn'))$('labCheckBtn').onclick=()=>openLetterCheck();document.querySelectorAll('.alpha-btn').forEach(b=>b.onclick=()=>{showLetter(+b.dataset.i);if(innerWidth<980)$('letterCard').scrollIntoView({behavior:'smooth',block:'start'})});showLetter(1)}
function showLetter(i){const L=ALPHABET[i];document.querySelectorAll('.alpha-btn').forEach(b=>b.classList.toggle('sel',+b.dataset.i===i));const vowels=L.l==='ا'?[['أَ','a'],['أُ','u'],['إِ','i']]:[[L.l+'َ','fatḥa'],[L.l+'ُ','ḍamma'],[L.l+'ِ','kasra']];const longs=L.l==='ا'?[]:[[L.l+'َا','aa'],[L.l+'ُو','uu'],[L.l+'ِي','ii']];const aiTargets=[L.name,...vowels.map(x=>x[0]),...longs.map(x=>x[0]),L.word].filter((x,p,a)=>x&&a.indexOf(x)===p);aiPronunciationTarget=L.name;
 $('letterCard').innerHTML=`<div class="lc-top"><button class="lc-letter" data-say="${esc(L.name)}">${L.l}</button><div><h2>${esc(L.name)}</h2><span class="tl always" dir="ltr">${esc(L.tr)}</span><button class="control-btn" data-say="${esc(L.name)}">🔊 اسم الحرف</button></div></div>
 <h4>الحركات القصيرة ${G('Short vowels')}</h4><div class="lc-row">${vowels.map(([v,n])=>`<button class="lc-chip" data-say="${esc(v)}"><b>${v}</b><small dir="ltr">${esc(translit(v)||n)}</small></button>`).join('')}</div>${longs.length?`<h4>المدود الطويلة ${G('Long vowels')}</h4><div class="lc-row long-vowels">${longs.map(([v,n])=>`<button class="lc-chip long" data-say="${esc(v)}"><b>${v}</b><small dir="ltr">${esc(translit(v)||n)}</small></button>`).join('')}</div><p class="note long-note">قارِن: <b>${vowels[1][0]}</b> ↔ <b>${longs[1][0]}</b> &nbsp; و &nbsp; <b>${vowels[2][0]}</b> ↔ <b>${longs[2][0]}</b> ${G('Compare the short and long sounds.')}</p>`:''}
 <div class="ai-pronunciation"><div class="ai-pronunciation-head"><h4>🎤 مدرب النطق الذكي</h4><span class="ai-badge">✦ OpenAI</span></div><p class="note">اختَر صوتًا، استمع إليه، ثم انطقه. سيعطيك المأمون تغذية راجعة مباشرة.</p><div class="ai-targets">${aiTargets.map((t,j)=>`<button class="ai-target ${j===0?'sel':''}" data-ai-target="${esc(t)}">${esc(t)}</button>`).join('')}</div><div class="ai-pronounce-row"><button id="aiPronounceBtn" class="ai-mic-btn">🎤 انطق الآن</button><span class="ai-target-now">سأستمع إلى: <b id="aiTargetNow">${esc(L.name)}</b></span></div><div id="aiPronunciationStatus" class="ai-pronunciation-status">اضغط على «انطق الآن»، وقل الصوت بوضوح.</div><small class="ai-privacy">🔒 لا نرسل اسم الطالب أو رمزه. يُرسل فقط مقطع النطق القصير والصوت المطلوب للتقييم.</small></div>
 <h4>أشكال الحرف ${G('Letter shapes in a word')}</h4><div class="lc-row forms">${letterForms(L).map(([ar,en,f])=>`<div class="lc-form"><b>${f}</b><small>${ar}${G(en)}</small></div>`).join('')}</div>${L.joins?'':`<p class="note">هذا الحرف لا يتصل بالحرف الذي بعده. ${G('This letter never joins to the letter after it.')}</p>`}
 <h4>كلمة ${G('Example word')}</h4><button class="lc-word" data-say="${esc(L.word)}"><span class="pic-big">${L.e}</span><span class="ar-text">${esc(L.word)}</span><span class="tl always" dir="ltr">${esc(translit(L.word))}</span>${G(L.en)}</button><h4>✍️ اكتب الحرف ${G('Write the letter')}</h4><div data-trace></div>`;
 $('letterCard').querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>{const t=b.dataset.say;speak(t,isLongVowelSyllable(t)?.88:.68);const hit=[...document.querySelectorAll('.ai-target')].find(x=>x.dataset.aiTarget===t);if(hit){aiPronunciationTarget=t;document.querySelectorAll('.ai-target').forEach(x=>x.classList.toggle('sel',x===hit));if($('aiTargetNow'))$('aiTargetNow').textContent=t}});
 bindAIPronunciation();tracePad($('letterCard').querySelector('[data-trace]'),L.l,{practice:true});later(()=>speak(L.name,.7),150)}

/* ================= الإدارة ================= */
function adminLogin(){overlay(`<h2>دخول الإدارة</h2><div class="form-field"><label for="au">اسم المستخدم</label><input id="au" autocomplete="off" dir="ltr"></div><div class="form-field"><label for="ap">الرقم السري</label><input id="ap" type="password" autocomplete="off" dir="ltr"></div><div class="form-actions"><button class="big-btn ghost" id="cancelOverlay">إلغاء</button><button class="big-btn primary" id="adminGo">دخول</button></div>`);$('cancelOverlay').onclick=closeOverlay;const go=()=>{const u=$('au').value.trim(),p=$('ap').value.trim();
 if(CLOUD){const b=$('adminGo');b.disabled=true;b.textContent='...';cloudAdminLogin(u,p).then(()=>{closeOverlay();showAdmin()}).catch(e=>{b.disabled=false;b.textContent='دخول';flash(cloudMsg(e))});return}
 const a=db.admins.find(x=>x.user===u&&x.pin===p);if(!a)return flash('بيانات الإدارة غير صحيحة');session={role:'admin'};persist();closeOverlay();showAdmin()};$('adminGo').onclick=go;$('ap').onkeydown=e=>{if(e.key==='Enter')go()}}
function isAdmin(){return session&&session.role==='admin'}
function storageKB(){try{let n=0;for(const k of [DB_KEY,SESSION_KEY,SETTINGS_KEY])n+=(localStorage.getItem(k)||'').length;return Math.round(n*2/1024)}catch{return 0}}
function statusOf(s){const n=overall(s);return s.graduated?['grad','🎓 خريج']:!s.diagnosticDone?['active','لم يبدأ']:n<60?['support','🛟 يحتاج دعمًا']:['active','مستمر']}
function showAdmin(){if(!isAdmin())return adminLogin();show('adminScreen');const students=db.students;students.forEach(ensureLearnerShape);const diagnosed=students.filter(s=>s.baseline),grads=students.filter(s=>s.graduated).length,avgBase=Math.round(diagnosed.reduce((a,s)=>a+s.baseline.total,0)/(diagnosed.length||1)),avgNow=Math.round(diagnosed.reduce((a,s)=>a+overall(s),0)/(diagnosed.length||1)),needSupport=students.filter(s=>s.diagnosticDone&&overall(s)<60&&!s.graduated).length;
 const warnings=[];if(CLOUD?cloud.pinDefault:db.admins[0].pin==='1234')warnings.push('⚠️ الرقم السري للإدارة ما زال الافتراضي (1234). غيّريه من زر «تغيير الرقم السري».');if(!hasArabicVoice())warnings.push('🔈 لا يوجد صوت عربي مثبت في هذا المتصفح. استخدمي Chrome أو Edge، أو سجّلي صوت المعلمة من «استوديو الصوت».');const kb=storageKB();if(kb>3500)warnings.push(`💾 مساحة التخزين المستخدمة ${kb} KB من نحو 5000 KB. صدّري نسخة احتياطية واحذفي التسجيلات غير المستخدمة.`);
 $('adminContent').innerHTML=`<div class="admin-card"><div class="admin-head"><div><h2>لوحة أثر البرنامج</h2><p>خط الأساس، المستوى الحالي، مهارات الضعف، الدعم العلاجي والتخرج. الانتقال بين المحطات يحتاج 80% فأعلى.</p></div><div class="admin-actions"><button class="big-btn gold" id="importBtn">📥 استيراد طلبة من Excel</button><button class="big-btn ghost" id="addOneBtn">➕ طالب جديد</button><button class="big-btn teal" id="voiceStudioBtn">🎙️ استوديو الصوت</button><button class="big-btn ghost" id="pinBtn">🔐 تغيير الرقم السري</button><button class="big-btn ghost" id="backupBtn">💾 نسخة احتياطية</button><label class="big-btn ghost upload-label">📂 استعادة<input id="restoreInput" type="file" accept="application/json,.json" hidden></label></div></div>${warnings.map(w=>`<div class="admin-warning">${w}</div>`).join('')}<div class="pacing-card"><b>⏱️ وتيرة البرنامج</b><label for="paceSel">عدد المهام الجديدة لكل طالب في اليوم</label><select id="paceSel">${[1,2,3,4,0].map(v=>`<option value="${v}" ${perDay()===v?'selected':''}>${v?v+' مهام':'بلا حد (للتجربة والعرض فقط)'}</option>`).join('')}</select><span class="muted" id="paceInfo">إجمالي المهام ${MISSION_TOTAL}. أقل مدة ممكنة: <b>${minDays(perDay())}</b> يوم دراسي.</span><small class="muted">إعادة المهام المُتقنة للتدريب مفتوحة دائمًا، ولا تُحتسب من الحد اليومي.</small></div><div class="admin-stats"><div class="admin-stat"><b>${students.length}</b><span>إجمالي الطلبة</span></div><div class="admin-stat"><b>${grads}</b><span>الخريجون</span></div><div class="admin-stat"><b>${avgBase}%</b><span>متوسط خط الأساس</span></div><div class="admin-stat"><b>${avgNow}%</b><span>المستوى الحالي</span></div><div class="admin-stat"><b>+${Math.max(0,avgNow-avgBase)}</b><span>متوسط التحسن</span></div><div class="admin-stat support-stat"><b>${needSupport}</b><span>بحاجة إلى دعم</span></div></div></div>
 <div class="admin-card"><div class="admin-toolbar"><input id="adminSearch" placeholder="ابحث بالاسم أو الرمز"><select id="adminGrade"><option value="">كل الصفوف</option>${[1,2,3,4,5,6].map(x=>`<option>${x}</option>`).join('')}</select><select id="adminStatus"><option value="">كل الحالات</option><option value="support">يحتاج دعمًا</option><option value="graduate">خريج</option><option value="new">لم يبدأ</option></select><button class="big-btn gold" id="exportBtn">تصدير CSV</button></div><div id="adminTableWrap" class="table-wrap"></div></div>`;
 const draw=()=>{const kw=$('adminSearch').value.trim(),g=$('adminGrade').value,st=$('adminStatus').value;const list=students.filter(s=>(!kw||s.name.includes(kw)||s.code.toUpperCase().includes(kw.toUpperCase()))&&(!g||String(s.grade)===g)&&(!st||(st==='support'?s.diagnosticDone&&overall(s)<60&&!s.graduated:st==='graduate'?s.graduated:!s.diagnosticDone)));
  $('adminTableWrap').innerHTML=list.length?`<table class="admin-table"><thead><tr><th>الطالب</th><th>الصف</th><th>CEFR</th><th>البداية</th><th>الحالي</th><th>التحسن</th><th>النجوم</th><th>المحطة</th><th>أضعف مهارة</th><th>الحالة</th><th></th></tr></thead><tbody>${list.map(s=>{const b=s.baseline?s.baseline.total:0,n=overall(s),w=weakestSkill(s),[cls,label]=statusOf(s);return`<tr><td><b>${esc(s.name)}</b><small style="display:block" dir="ltr">${esc(s.code)}</small></td><td>${esc(s.grade)}/${esc(s.section)}</td><td dir="ltr">${esc(s.cefr)}</td><td>${b}%</td><td>${n}%</td><td>+${Math.max(0,n-b)}</td><td>${s.stars.reduce((a,x)=>a+(x||0),0)}★</td><td>${esc(STAGES[Math.min(s.stage,8)].skill)}<small style="display:block">المهام ${MISSIONS.reduce((a,_,i)=>a+doneCount(s,i),0)}/${MISSION_TOTAL} · أيام ${activeDays(s)}</small></td><td><b>${esc(w[1])}</b><small style="display:block">${w[2]}%</small></td><td><span class="status ${cls}">${label}</span></td><td><button class="mini-report" data-report="${esc(s.id)}">تفاصيل</button></td></tr>`}).join('')}</tbody></table>`:'<p class="empty-state">لا يوجد طلبة بهذه الشروط. أنشئ حسابًا جديدًا من الشاشة الرئيسية.</p>';
  document.querySelectorAll('[data-report]').forEach(b=>b.onclick=()=>showStudentReport(b.dataset.report))};
 draw();$('adminSearch').oninput=draw;$('adminGrade').onchange=draw;$('adminStatus').onchange=draw;$('exportBtn').onclick=()=>exportCSV(students);$('voiceStudioBtn').onclick=openVoiceStudio;$('importBtn').onclick=openImport;$('addOneBtn').onclick=addOneStudent;$('pinBtn').onclick=changeAdminPin;$('paceSel').onchange=e=>{db.pacing={perDay:+e.target.value};persist();$('paceInfo').innerHTML=`إجمالي المهام ${MISSION_TOTAL}. أقل مدة ممكنة: <b>${minDays(perDay())}</b> يوم دراسي.`;flash('تم حفظ وتيرة البرنامج')};$('backupBtn').onclick=backup;$('restoreInput').onchange=restore}
function changeAdminPin(){overlay(`<h2>🔐 تغيير الرقم السري للإدارة</h2><div class="form-field"><label for="np1">الرقم السري الجديد (4 أرقام أو أكثر)</label><input id="np1" type="password" dir="ltr"></div><div class="form-field"><label for="np2">أعد كتابته</label><input id="np2" type="password" dir="ltr"></div><div class="form-actions"><button class="big-btn ghost" id="cancelOverlay">إلغاء</button><button class="big-btn primary" id="savePin">حفظ</button></div>`);$('cancelOverlay').onclick=closeOverlay;$('savePin').onclick=()=>{const a=$('np1').value.trim(),b=$('np2').value.trim();if(a.length<4)return flash('الرقم السري قصير جدًا');if(a!==b)return flash('الرقمان غير متطابقين');if(CLOUD){return rpc('admin_change_pin',{p_token:cloud.token,p_new:a}).then(()=>{cloud.pinDefault=false;saveCloud();closeOverlay();flash('تم تغيير الرقم السري ✅');showAdmin()}).catch(e=>flash(cloudMsg(e)))}db.admins[0].pin=a;persist();closeOverlay();flash('تم تغيير الرقم السري ✅');showAdmin()}}
function backup(){const blob=new Blob([JSON.stringify({app:'almaamoon',version:30,date:new Date().toISOString(),db})],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`مغامرة_المأمون_نسخة_احتياطية_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);flash('تم تنزيل النسخة الاحتياطية ✅')}
function restore(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);const incoming=data.db||data;if(!incoming||!Array.isArray(incoming.students))throw new Error('bad');overlay(`<h2>📂 استعادة البيانات</h2><p>الملف يحتوي على <b>${incoming.students.length}</b> طالب و<b>${Object.keys(incoming.audioLibrary||{}).length}</b> تسجيل صوتي.</p><p><b>الدمج</b> يضيف الطلبة الجدد ويحدّث الموجودين (مفيد لجمع بيانات أكثر من جهاز). <b>الاستبدال</b> يمسح بيانات هذا الجهاز.</p><div class="form-actions"><button class="big-btn ghost" id="cancelOverlay">إلغاء</button><button class="big-btn gold" id="doReplace">استبدال</button><button class="big-btn primary" id="doMerge">دمج</button></div>`);$('cancelOverlay').onclick=closeOverlay;
   $('doMerge').onclick=()=>{incoming.students.forEach(ns=>{ensureLearnerShape(ns);const i=db.students.findIndex(x=>x.id===ns.id||x.code===ns.code);if(i<0)db.students.push(ns);else{const old=db.students[i];/* نحتفظ بالسجل الأكثر تقدمًا */if((ns.points||0)>=(old.points||0))db.students[i]=ns}});Object.assign(db.audioLibrary,incoming.audioLibrary||{});db.counter=Math.max(db.counter||0,incoming.counter||0,db.students.length);persist();closeOverlay();flash('تم الدمج ✅');showAdmin()};
   $('doReplace').onclick=()=>{if(!confirm('سيتم حذف بيانات هذا الجهاز واستبدالها. متابعة؟'))return;db=incoming;db.admins=db.admins&&db.admins.length?db.admins:[{user:'admin',pin:'1234'}];db.audioLibrary=db.audioLibrary||{};db.students.forEach(ensureLearnerShape);persist();closeOverlay();flash('تمت الاستعادة ✅');showAdmin()}}
  catch{flash('الملف غير صالح. اختر ملف النسخة الاحتياطية (.json)')}};r.readAsText(f);e.target.value=''}
function topErrors(s,n){const all=[];Object.entries(s.errors||{}).forEach(([k,obj])=>Object.entries(obj||{}).forEach(([item,c])=>all.push({skill:SKILL_NAMES[k]||(k.startsWith('diagnostic')?'التشخيص':k),item,c})));return all.sort((a,b)=>b.c-a.c).slice(0,n)}
function showStudentReport(id){const s=db.students.find(x=>x.id===id);if(!s)return;ensureLearnerShape(s);const before=s.baseline?s.baseline.total:0,now=overall(s),weak=weakestSkill(s);const errs=topErrors(s,6);const errorTotal=Object.values(s.errors).reduce((sum,o)=>sum+Object.values(o||{}).reduce((a,b)=>a+(+b||0),0),0);
 overlay(`<div class="report"><h2>تقرير الطالب: ${esc(s.name)}</h2><div class="report-summary"><span>البداية <b>${before}%</b></span><span>الحالي <b>${now}%</b></span><span>التحسن <b>+${Math.max(0,now-before)}</b></span><span>المستوى <b dir="ltr">${esc(s.cefr)}</b></span><span>المهام <b>${MISSIONS.reduce((a,_,i)=>a+doneCount(s,i),0)}/${MISSION_TOTAL}</b></span><span>أيام النشاط <b>${activeDays(s)}</b></span><span>لغة المساعدة <b>${s.support==='en'?'English':'عربي فقط'}</b></span><span>الرقم السري <b>${pinIsDefault(s)?'1234 (مبدئي)':'غيّره الطالب ✅'}</b></span></div>${s.baseline?`<p class="muted">التشخيص: الحروف ${s.baseline.domains.letters}% — الكلمات ${s.baseline.domains.words}% — الجمل ${s.baseline.domains.sentences}%</p>`:''}<div class="skill-grid">${skillCards(s)}</div><div class="support-box"><h3>أولوية الدعم</h3><p><b>${esc(weak[1])} (${weak[2]}%)</b></p><p>${esc(supportRecommendation(s))}</p><p>مرات التدريب العلاجي: <b>${supportCount(s)}</b> — الأخطاء المسجلة: <b>${errorTotal}</b></p><h4>خريطة الحروف الـ28 — المعروف ${knownCount(s)}/28 ${s.letterCheck?(s.completed[0]||knownCount(s)>=LC_TARGET?'(اجتاز الفحص ✅)':'(الفحص مطلوب قبل المحطة الأولى — يحتاج '+LC_TARGET+')'):'(الفحص اختياري)'}</h4><p class="muted">اضغطي على أي حرف لتأكيد أن الطالب يعرفه (يظهر بإطار ذهبي)، واضغطي مرة أخرى للإلغاء.</p>${letterGrid(s,{clickable:true})}${errs.length?`<h4>أكثر ما يخطئ فيه</h4><ul class="error-list">${errs.map(e=>`<li><span>${esc(e.item)}</span><small>${esc(e.skill)}</small><b>×${e.c}</b></li>`).join('')}</ul>`:''}</div><div class="form-actions"><button class="big-btn ghost" id="rPin">🔑 إعادة الرقم السري إلى 1234</button><button class="big-btn ghost" id="rCard">🖨️ بطاقة الدخول</button><button class="big-btn ghost" id="rCheck"><span class="ab-icon" aria-hidden="true">أ ب ت</span> ${s.letterCheck?'إلغاء إلزام فحص الحروف':'إلزام فحص الحروف'}</button><button class="big-btn ghost" id="rDiag">🎯 إعادة التشخيص</button><button class="big-btn ghost danger" id="rDel">🗑 حذف</button><button class="big-btn primary" id="reportClose">إغلاق</button></div></div>`);
 $('reportClose').onclick=closeOverlay;$('rCard').onclick=()=>printLoginCards([s]);
 document.querySelectorAll('#overlayCard .lc-cell[data-l]').forEach(c=>c.onclick=()=>{s.letterMap=s.letterMap||{};const l=c.dataset.l;const m=s.letterMap[l]||{d:[],n:0};m.t=!m.t;s.letterMap[l]=m;persist();showStudentReport(id)});
 $('rCheck').onclick=()=>{s.letterCheck=!s.letterCheck;persist();flash(s.letterCheck?'أصبح فحص الحروف مطلوبًا قبل المحطة الأولى':'أُلغي إلزام فحص الحروف');showStudentReport(id)};
 $('rPin').onclick=()=>{if(!confirm(`إعادة الرقم السري لـ ${s.name} إلى 1234؟ سيُسأل عند دخوله القادم إن كان يريد تغييره.`))return;if(CLOUD){return rpc('admin_reset_pin',{p_token:cloud.token,p_id:s.id}).then(()=>{s.pinDefault=true;s.pinPrompt=true;persist();flash(`أصبح الرقم السري لـ ${s.name}: 1234`);showStudentReport(id)}).catch(e=>flash(cloudMsg(e)))}s.pin=DEFAULT_PIN;s.pinPrompt=true;persist();flash(`أصبح الرقم السري لـ ${s.name}: 1234`);showStudentReport(id)};
 $('rDiag').onclick=()=>{if(!confirm('سيعيد الطالب الاختبار التشخيصي في دخوله القادم (يبقى تقدمه في المحطات). متابعة؟'))return;s.diagnosticDone=false;persist();flash('سيبدأ الطالب بالتشخيص في الدخول القادم');closeOverlay()};
 $('rDel').onclick=()=>{if(!confirm(`حذف ${s.name} نهائيًا؟`))return;db.students=db.students.filter(x=>x.id!==id);persist();closeOverlay();showAdmin()}}
function exportCSV(list){const rows=[['الطالب','الرمز','الصف','الشعبة','لغة المساعدة','CEFR','خط الأساس','الحالي','التحسن','المحطات','النجوم','أضعف مهارة','التوصية','التدريب العلاجي','الكتابة','الحروف المعروفة','الرقم السري','المهام المكتملة','أيام النشاط','الخريج','آخر دخول']];list.forEach(s=>{const b=s.baseline?s.baseline.total:0,n=overall(s),w=weakestSkill(s);rows.push([s.name,s.code,s.grade,s.section,s.support==='en'?'English':'عربي',s.cefr,b,n,Math.max(0,n-b),keys(s),s.stars.reduce((a,x)=>a+(x||0),0),w[1]+' '+w[2]+'%',supportRecommendation(s),supportCount(s),s.attempts.writing?(s.mastery.writing||0)+'%':'—',s.letterMap?knownCount(s)+'/28':'—',pinIsDefault(s)?'1234 (مبدئي)':'مُغيَّر',MISSIONS.reduce((a,_,i)=>a+doneCount(s,i),0)+'/'+MISSION_TOTAL,activeDays(s),s.graduated?'نعم':'لا',(s.lastLogin||'').slice(0,10)])});const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='تقرير_مغامرة_المأمون.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

/* ================= استوديو الصوت: قائمة بكل نص في اللعبة ================= */
function allSpeakables(){const out={'حروف':new Set(),'كلمات':new Set(),'جمل':new Set()};const add=(t,cat)=>{if(t&&/[\u0600-\u06FF]/.test(t))out[cat||(t.includes(' ')?'جمل':[...norm(t)].length<=2?'حروف':'كلمات')].add(t)};
 ALPHABET.forEach(L=>{add(L.name,'حروف');['َ','ِ','ُ'].forEach(v=>add(L.l+v,'حروف'));add(L.word,'كلمات')});
 [...DIAG,...FINAL].forEach(x=>{add(x.speak);(x.opts||[]).forEach(o=>typeof o==='string'&&add(o))});
 BANK.letters.flat().forEach(x=>{add(x.s,'حروف');x.o.forEach(o=>typeof o==='string'?add(o,'حروف'):add(o.w,'كلمات'))});
 BANK.sounds.flat().flat().forEach(t=>add(t));BANK.wordReading.flat().forEach(t=>add(t,'كلمات'));Object.keys(VOCAB).forEach(t=>add(t,'كلمات'));
 BANK.sentenceBuild.flat().forEach(x=>{add(x.w.join(' '),'جمل');x.w.forEach(w=>add(w,'كلمات'))});BANK.sentenceListen.flat().forEach(x=>add(x.s,'جمل'));
 BANK.wordMeaning.forEach(m=>{(m.items||[]).forEach(x=>add(x.q.replace('___',x.o[x.a]),'جمل'))});BANK.reading.flat().forEach(r=>r.qs.forEach(q=>add(q.q,'جمل')));WRITING.spell.flat().forEach(w=>add(w,'كلمات'));
 return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,[...v]]))}
function openVoiceStudio(){const groups=allSpeakables();const total=Object.values(groups).reduce((a,v)=>a+v.length,0);const done=Object.values(groups).flat().filter(t=>recordedAudio(t)).length;
 overlay(`<div class="studio"><h2>🎙️ استوديو الصوت</h2><p>سجّلي صوت المعلمة لأي نص، وستستخدمه اللعبة تلقائيًا بدل صوت المتصفح. الصوت البشري أوضح بكثير للمتعلم غير الناطق، خاصة للحروف.</p><div class="voice-stats">المسجّل: <b>${done}</b> من <b>${total}</b> — المساحة المستخدمة: <b>${storageKB()} KB</b></div><div class="form-row"><div class="form-field"><label for="vCat">الفئة</label><select id="vCat">${Object.keys(groups).map(k=>`<option>${k}</option>`).join('')}</select></div><div class="form-field"><label for="vFilter">العرض</label><select id="vFilter"><option value="missing">غير المسجّل فقط</option><option value="all">الكل</option></select></div></div><div class="voice-list" id="vList"></div><div class="form-field"><label for="voiceText">النص المختار (أو اكتب نصًا آخر)</label><input id="voiceText" class="ar-input"></div><div class="form-actions"><button class="big-btn primary" id="voiceRecord">🎙️ تسجيل</button><button class="big-btn ghost" id="voiceStop" disabled>⏹ إيقاف</button><label class="big-btn gold upload-label">⬆️ رفع ملف<input id="voiceUpload" type="file" accept="audio/*" hidden></label><button class="big-btn ghost" id="voicePlay">▶ تشغيل</button><button class="big-btn ghost" id="voiceDelete">🗑 حذف</button></div><div id="voiceStatus" class="feedback">اختاري نصًا من القائمة، ثم سجّلي. التسجيل يتوقف تلقائيًا بعد 6 ثوانٍ.</div><div class="form-actions"><button class="big-btn primary" id="voiceClose">إغلاق</button></div></div>`);
 const status=$('voiceStatus'),txt=()=>$('voiceText').value.trim();
 const drawList=()=>{const items=groups[$('vCat').value].filter(t=>$('vFilter').value==='all'||!recordedAudio(t));$('vList').innerHTML=items.length?items.map(t=>`<button class="voice-item ${recordedAudio(t)?'has':''}" data-t="${esc(t)}">${recordedAudio(t)?'✅':'○'} ${esc(t)}</button>`).join(''):'<p class="muted">كل نصوص هذه الفئة مسجّلة ✅</p>';$('vList').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{$('vList').querySelectorAll('.voice-item').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');$('voiceText').value=b.dataset.t;speak(b.dataset.t,.8)})};
 drawList();$('vCat').onchange=drawList;$('vFilter').onchange=drawList;
 let rec=null,stream=null,chunks=[],stopTimer=null;
 const saveData=(t,data)=>{db.audioLibrary[audioKey(t)]=data;persist();status.innerHTML=`تم حفظ التسجيل لـ «${esc(t)}» ✅`;drawList()};
 $('voiceRecord').onclick=async()=>{const t=txt();if(!t)return status.textContent='اختاري النص أولًا.';try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});chunks=[];rec=new MediaRecorder(stream);rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};rec.onstop=()=>{clearTimeout(stopTimer);const blob=new Blob(chunks,{type:rec.mimeType||'audio/webm'});const r=new FileReader();r.onload=()=>saveData(t,r.result);r.readAsDataURL(blob);stream.getTracks().forEach(x=>x.stop());$('voiceRecord').disabled=false;$('voiceStop').disabled=true};rec.start();stopTimer=setTimeout(()=>{if(rec.state!=='inactive')rec.stop()},6000);$('voiceRecord').disabled=true;$('voiceStop').disabled=false;status.innerHTML='🔴 يتم التسجيل الآن... قولي: <b>'+esc(t)+'</b>'}catch{status.innerHTML='تعذر تشغيل الميكروفون. افتحي اللعبة من ملف <b>START_GAME</b> ثم اسمحي باستخدام الميكروفون.'}};
 $('voiceStop').onclick=()=>{if(rec&&rec.state!=='inactive')rec.stop()};
 $('voiceUpload').onchange=e=>{const t=txt(),f=e.target.files[0];if(!t||!f)return status.textContent='اختاري النص ثم الملف.';if(f.size>400000)return status.textContent='الملف كبير جدًا (أكثر من 400KB). استخدمي مقطعًا قصيرًا.';const r=new FileReader();r.onload=()=>saveData(t,r.result);r.readAsDataURL(f);e.target.value=''};
 $('voicePlay').onclick=()=>{const t=txt();if(!t)return;if(!recordedAudio(t))status.textContent='لا يوجد تسجيل — هذا صوت المتصفح.';speak(t,.85)};
 $('voiceDelete').onclick=()=>{const t=txt();if(!t)return;delete db.audioLibrary[audioKey(t)];delete db.audioLibrary[norm(t)];persist();status.textContent='تم حذف التسجيل.';drawList()};
 $('voiceClose').onclick=()=>{if(rec&&rec.state!=='inactive')rec.stop();closeOverlay();if(isAdmin())showAdmin()}}

/* ================= التدريب الذكي والتنقل ================= */
function skillStageIndex(key){return{letters:0,sounds:1,pronunciation:1,wordReading:2,wordMeaning:3,sentenceBuild:4,sentenceListen:5,sentenceOrder:6,fluency:7}[key]??0}
function smartPracticeStage(s){const maxUnlocked=Math.min(7,Math.max(0,s.stage||0));const c=scoredSkills(s).filter(k=>k!=='pronunciation').map(k=>({k,n:SKILL_NAMES[k],v:s.mastery[k]||0,stage:k==='writing'?-1:skillStageIndex(k)})).filter(x=>x.stage<=maxUnlocked);c.sort((a,b)=>a.v-b.v);return c[0]||{k:'letters',n:'الحروف والحركات',v:0,stage:0}}
function launchSmartPractice(){const s=current();if(!s)return;if(!s.diagnosticDone)return startDiagnostic();if(needsLetterCheck(s))return openLetterCheck();const r=smartPracticeStage(s);flash(`التدريب الذكي اختار: ${r.n} (${r.v}%)`);if(r.k==='writing')return openWorkshop();launchStage(r.stage)}
function navTab(tab){if(tab==='profile')showProfile();else if(tab==='practice')launchSmartPractice();else if(tab==='lab')openLab('worldScreen');else if(tab==='write')openWorkshop();else if(tab==='admin')adminLogin()}
function bindToggles(){document.querySelectorAll('[data-toggle="help"]').forEach(b=>b.onclick=toggleHelp);document.querySelectorAll('[data-toggle="tl"]').forEach(b=>b.onclick=toggleTranslit)}
function logout(){if(CLOUD&&cloud.token){cloudLogout();applyLearnerPrefs();show('startScreen');refreshResume();return}session=null;persist();applyLearnerPrefs();show('startScreen');refreshResume()}
function refreshResume(){const box=$('resumeBox');const s=current();if(s){box.classList.remove('hidden');box.innerHTML=`مرحبًا <b>${esc(s.name)}</b> 👋 <button class="big-btn ghost" id="resumeBtn">متابعة رحلتي</button>`;$('resumeBtn').onclick=afterLogin}else box.classList.add('hidden')}
function voiceBanner(){const b=$('voiceBanner');if(!b)return;b.classList.toggle('hidden',hasArabicVoice()||Object.keys(db.audioLibrary||{}).length>20)}
function bind(){$('loginBtn').onclick=startLogin;$('createBtn').onclick=createAccount;$('labStartBtn').onclick=()=>openLab('startScreen');$('adminOpenBtn').onclick=()=>isAdmin()?showAdmin():adminLogin();
 $('backWorldBtn').onclick=()=>{prepareWorld();show('worldScreen')};$('labBackBtn').onclick=()=>{if(labReturn==='worldScreen'&&current()){prepareWorld();show('worldScreen')}else if(labReturn==='profileScreen'&&current())showProfile();else if(labReturn==='writeScreen'&&current())openWorkshop();else if(labReturn==='checkScreen'&&current())openLetterCheck();else show('startScreen')};
 $('profileLogout').onclick=logout;$('writeBackBtn').onclick=()=>{prepareWorld();show('worldScreen')};$('checkBackBtn').onclick=()=>{prepareWorld();show('worldScreen')};$('adminLogoutBtn').onclick=logout;
 document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{const n=b.dataset.nav;if(n==='start'){show('startScreen');refreshResume()}else if(n==='world'){prepareWorld();show('worldScreen')}});
 $('overlay').onclick=e=>{if(e.target.id==='overlay')closeOverlay()};document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlay()});
 $('stageSoundBtn').onclick=()=>{settings.sound=!settings.sound;persist();$('stageSoundBtn').textContent=settings.sound?'🔊':'🔇';if(!settings.sound)stopAudio()};
 bindToggles()}
bind();refreshResume();applyLearnerPrefs();cloudInit();
setTimeout(voiceBanner,1500);
if(session&&session.role==='admin')showAdmin();
/* لأغراض الاختبار الآلي فقط */
window.__maamoon={get db(){return db},get cloud(){return cloud},runSync,CLOUD,persist,recordMission,missionAccess,nextMi,MISSIONS,minDays,openImport,askPinChoice,openWorkshop,openLetterCheck,knownCount,letterStatus,needsLetterCheck,tracePad,current,STAGES,launchStage,finishStage,startDiagnostic,prepareWorld,showProfile,openLab,showAdmin,translit,tierFor};
})();
