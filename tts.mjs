import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';

export function germanAudio({directory,endpoint=process.env.TTS_URL||'http://127.0.0.1:5002/synthesize',fetcher=fetch}){
 const pending=new Map();
 return async(text,speed='normal')=>{
  if(typeof text!=='string'||!text.trim()||text.length>300)throw Error('Pronunciation supports words and phrases up to 300 characters.');
  if(!['normal','slow'].includes(speed))throw Error('Invalid pronunciation speed.');
  const key=createHash('sha256').update('thorsten-high-v1:'+speed+':'+text).digest('hex');
  const file=path.join(directory,key+'.wav');
  try{return await readFile(file);}catch(e){if(e.code!=='ENOENT')throw e;}
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
   let response;try{response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,length_scale:speed==='slow'?1.25:1.0}),signal:AbortSignal.timeout(30000)});}catch{throw Error('The German voice service is unavailable. Start the Piper service and try again.');}
   if(!response.ok)throw Error('The German voice service could not generate audio.');
   const audio=Buffer.from(await response.arrayBuffer());
   if(audio.length<44||audio.length>2000000||audio.toString('ascii',0,4)!=='RIFF'||audio.toString('ascii',8,12)!=='WAVE')throw Error('The German voice service returned invalid audio.');
   await mkdir(directory,{recursive:true});await writeFile(file+'.tmp',audio);await rename(file+'.tmp',file);return audio;
  })();pending.set(key,task);
  try{return await task;}finally{pending.delete(key);}
 };
}
