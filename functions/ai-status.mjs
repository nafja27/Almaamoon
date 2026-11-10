const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export default async(request)=>{
 if(request.method!=='GET')return json({error:'method_not_allowed'},405);
 return json({ok:!!process.env.OPENAI_API_KEY,voice:'marin',realtime:'gpt-realtime-2.1'});
};
export const config={path:'/api/ai-status',method:'GET'};
