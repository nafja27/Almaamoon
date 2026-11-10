const reply=(body,status=200,headers={})=>new Response(body,{status,headers:{'cache-control':'no-store',...headers}});

const INSTRUCTIONS=`أنت شخصية "المأمون"، رفيق تعليمي للأطفال داخل منصة "مغامرة المأمون" لتعلّم العربية لغير الناطقين بها.
قواعدك ثابتة:
- تحدث بالعربية الفصحى المبسطة فقط، بصوت دافئ وطبيعي ومحادثي. استخدم تنغيمًا بشريًا متنوعًا ووقفات قصيرة طبيعية، واجعل الابتسامة مسموعة في صوتك من غير مبالغة. لا تتحدث بنبرة روبوتية أو كنبرة مذيع، ولا تستخدم إيقاعًا ثابتًا أو قراءة مسطحة.
- قل "أهلًا يا بطل"، ولا تستخدم كلمات عامية مثل: هلا، شنو، إي، عادي.
- اجعل كل رد قصيرًا جدًا: غالبًا جملة أو جملتين. تحدث كأنك تخاطب طفلًا أمامك مباشرة، لا كأنك تقرأ نصًا مكتوبًا.
- ركّز على الحروف والحركات والمدود والكلمات والجمل والقراءة والكتابة.
- إذا كان كلام الطفل خارج موضوع التعلم، أعده بلطف إلى نشاط العربية.
- لا تطلب الاسم أو العمر أو المدرسة أو الموقع أو أي معلومات شخصية.
- افهم الإنجليزية عند الحاجة، لكن أجب أساسًا بالعربية، ويمكنك إعطاء كلمة إنجليزية قصيرة جدًا كمساعدة.
- عند الإجابة الصحيحة شجّع الطفل بعبارات مثل: "أحسنت!" أو "ممتاز!".
- عند الخطأ لا تقل إن الإجابة سيئة. قل: "أحسنت المحاولة. استمع مرة أخرى ثم حاول.".
- عندما تطلب من الطفل النطق، انطق النموذج بوضوح وبإيقاع طبيعي ثم توقف فعلًا ليجيب. في الأصوات القصيرة والمدود لا تضف كلمات حول النموذج أثناء النطق نفسه.
- لا تتحدث طويلًا ولا تطرح أكثر من سؤال واحد في كل دور.`;

export default async(request)=>{
 if(request.method!=='POST')return reply(JSON.stringify({error:'method_not_allowed'}),405,{'content-type':'application/json'});
 const key=process.env.OPENAI_API_KEY;
 if(!key)return reply(JSON.stringify({error:'missing_api_key'}),503,{'content-type':'application/json'});
 try{
  const sdp=await request.text();
  if(!sdp||sdp.length>60000)return reply(JSON.stringify({error:'invalid_sdp'}),400,{'content-type':'application/json'});

  const session={
   type:'realtime',
   model:'gpt-realtime-2.1',
   instructions:INSTRUCTIONS,
   audio:{output:{voice:'marin'}}
  };

  const fd=new FormData();
  fd.set('sdp',sdp);
  fd.set('session',JSON.stringify(session));

  const apiResponse=await fetch('https://api.openai.com/v1/realtime/calls',{
   method:'POST',
   headers:{authorization:`Bearer ${key}`},
   body:fd
  });

  const body=await apiResponse.text();
  if(!apiResponse.ok){
   let detail='',code='';
   try{
    const parsed=JSON.parse(body);
    detail=String(parsed?.error?.message||'').slice(0,260);
    code=String(parsed?.error?.code||parsed?.error?.type||'').slice(0,80);
   }catch{}
   console.error('OpenAI Realtime:',apiResponse.status,code,detail||body.slice(0,500));
   return reply(JSON.stringify({
    error:apiResponse.status===429?'rate_limited':apiResponse.status===401?'auth_error':apiResponse.status===403?'permission_error':'openai_realtime_error',
    status:apiResponse.status,
    code,
    detail
   }),502,{'content-type':'application/json'});
  }

  return reply(body,200,{'content-type':'application/sdp'});
 }catch(e){
  console.error('mamoun-realtime failed',e?.message||e);
  return reply(JSON.stringify({error:'server_error',detail:String(e?.message||'').slice(0,220)}),500,{'content-type':'application/json'});
 }
};

export const config={
 path:'/api/mamoun-realtime',
 method:'POST',
 rateLimit:{windowLimit:20,windowSize:3600,aggregateBy:['ip','domain']}
};
