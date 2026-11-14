const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

const ARABIC=/[\u0600-\u06FF]/u;
const clean=(v)=>String(v||'').normalize('NFC').replace(/[<>\[\]{}\\]/g,'').replace(/\s+/g,' ').trim().slice(0,450);
const SHORT=/^[ء-ي][َُِ]$/u;
const LONG_A=/^[ء-ي]َا$/u;
const LONG_U=/^[ء-ي]ُو$/u;
const LONG_I=/^[ء-ي]ِي$/u;

function soundInstruction(text){
 if(SHORT.test(text)){
  const mark=text.slice(-1);const name=mark==='َ'?'فتحة':mark==='ُ'?'ضمة':'كسرة';
  return ` هذا مقطع صوتي قصير جدًا للتدريب على ${name}. انطق المقطع مرة واحدة فقط. اجعل الحركة قصيرة ومقتضبة بوضوح، من غير أي مد. يجب أن يكون طول الحركة تقريبًا نصف طول المد المقابل. لا تضف أي كلمة قبل المقطع أو بعده.`;
 }
 if(LONG_A.test(text))return ' هذا مقطع فيه مد بالألف. انطق المقطع مرة واحدة فقط، ومد صوت الفتحة بوضوح إلى نحو ضعفي الحركة القصيرة المقابلة. يجب أن يسمع المتعلم فرقًا واضحًا بين بَ وبَا وأمثالهما. لا تضف أي كلمة أخرى.';
 if(LONG_U.test(text))return ' هذا مقطع فيه مد بالواو. انطق المقطع مرة واحدة فقط، ومد صوت الضمة بوضوح إلى نحو ضعفي الحركة القصيرة المقابلة. يجب أن يسمع المتعلم فرقًا واضحًا بين بُ وبُو وأمثالهما. لا تضف أي كلمة أخرى.';
 if(LONG_I.test(text))return ' هذا مقطع فيه مد بالياء. انطق المقطع مرة واحدة فقط، ومد صوت الكسرة بوضوح إلى نحو ضعفي الحركة القصيرة المقابلة. يجب أن يسمع المتعلم فرقًا واضحًا بين بِ وبِي وأمثالهما. لا تضف أي كلمة أخرى.';
 return '';
}

function throatInstruction(text){
 /*V41.4: التفريق بين الحاء والخاء والهاء والعين (نَحْلَة لا نَخْلَة)*/
 const plain=String(text).replace(/[\u064B-\u0652\u0670]/g,'');
 const has=c=>plain.includes(c);let t='';
 if(has('ح'))t+=' انتبه: في النص حرف الحاء (ح). انطقها حاءً صافية من وسط الحلق، مهموسة رقيقة بلا خشونة ولا احتكاك في أقصى الفم، ولا تقلبها أبدًا خاءً (خ) ولا هاءً (ه).';
 if(has('خ'))t+=' في النص حرف الخاء (خ) فانطقها خاءً واضحة من أقصى الحلق ولا تقلبها حاءً.';
 if(has('ح')||has('خ')){const w=plain.trim();if(!/\s/.test(w)&&w.length<=6)t+=` الكلمة المطلوبة هي «${text}» بالضبط، فلا تستبدلها بكلمة قريبة منها في النطق.`}
 return t;
}

export default async(request)=>{
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const key=process.env.OPENAI_API_KEY;
 if(!key)return json({error:'missing_api_key'},503);
 try{
  const body=await request.json().catch(()=>({}));
  const text=clean(body.text),slow=!!body.slow,fast=!!body.fast;
  if(!text||!ARABIC.test(text))return json({error:'invalid_text'},400);
  let instructions='تحدث بالعربية الفصحى الواضحة بصوت دافئ وطبيعي ومحادثي، كرفيق تعليمي ودود لطفل يتعلم العربية كلغة ثانية. لا تتحدث كنظام آلي أو كمذيع. استخدم تنغيمًا بشريًا لطيفًا، والتزم بالنص المكتوب كما هو واحترم التشكيل والحركات والمدود بدقة.';
  instructions+=soundInstruction(text);
  instructions+=throatInstruction(text);
  /* V40.2: منع التكرار */
  instructions+=' انطق النص المكتوب مرة واحدة فقط ثم توقف تمامًا. لا تكرر أي مقطع أو كلمة، ولا تضف أي كلام قبله أو بعده.';
  if(fast)instructions+=' تحدث بحماس وفرح بصوت إنساني دافئ وطبيعي تمامًا، بسرعة كلام طبيعية كأنك تشجع طفلًا متحمسًا، بلا بطء ولا وقفات طويلة.';
  else if(slow)instructions+=' انطق أبطأ قليلًا فقط مع بقاء الإيقاع طبيعيًا. لا تفصل الحروف بطريقة روبوتية.';
  else instructions+=' استخدم سرعة تعليمية هادئة وطبيعية.';
  const isPhoneme=SHORT.test(text)||LONG_A.test(text)||LONG_U.test(text)||LONG_I.test(text);
  const speed=isPhoneme?1.0:(fast?1.06:(slow?0.88:0.98));
  const r=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{authorization:`Bearer ${key}`,'content-type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini-tts-2025-12-15',voice:'marin',input:text,instructions,response_format:'mp3',speed})});
  if(!r.ok){const err=await r.text();console.error('mamoun-tts OpenAI error',r.status,err.slice(0,500));return json({error:r.status===429?'rate_limited':'openai_tts_error'},r.status===429?429:502)}
  const audio=await r.arrayBuffer();
  return new Response(audio,{status:200,headers:{'content-type':'audio/mpeg','cache-control':'public, max-age=604800, immutable','x-content-type-options':'nosniff','x-maamoon-voice':'openai-marin'}})
 }catch(e){console.error('mamoun-tts failed',e?.message||e);return json({error:'server_error'},500)}
};

export const config={path:'/api/mamoun-tts',method:'POST',rateLimit:{windowLimit:120,windowSize:60,aggregateBy:['ip','domain']}};
