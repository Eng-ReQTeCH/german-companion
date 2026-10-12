import http from 'node:http';
import { readFile,writeFile,mkdir,rename } from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {seed,validate,exportAnki} from './domain.mjs';
import {exportPackage} from './anki.mjs';
import {germanAudio} from './tts.mjs';
const dir=path.resolve(process.env.DATA_DIR||'data');await mkdir(dir,{recursive:true});const file=path.join(dir,'study.json');let state;
try{state=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;state=seed();await writeFile(file,JSON.stringify(state));}
let queue=Promise.resolve();
const audioFor=germanAudio({directory:path.join(dir,'audio')});
const persist=async next=>{await writeFile(file+'.tmp',JSON.stringify(next,null,2));await rename(file+'.tmp',file);state=next;};
const send=(res,status,data,type='application/json')=>{res.writeHead(status,{'Content-Type':type+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(type==='application/json'?JSON.stringify(data):data);};
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>2000000)throw Error('File exceeds 2 MB.');}return JSON.parse(text||'{}');}
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost');const p=u.pathname;
 if(req.method==='GET'&&p==='/api/health')return send(res,200,{ok:true});
 if(req.method==='GET'&&p==='/api/state')return send(res,200,state);
 if(req.method==='GET'&&p.startsWith('/api/audio/')){const w=state.words.find(w=>w.id===p.slice('/api/audio/'.length));if(!w)return send(res,404,{error:'Word not found.'});try{const audio=await audioFor(w.german,u.searchParams.get('speed')||'normal');res.writeHead(200,{'Content-Type':'audio/wav','Content-Length':audio.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(audio);}catch(e){return send(res,503,{error:e.message});}}
 if(req.method==='GET'&&p==='/api/export'){const words=state.words.filter(w=>!u.searchParams.get('lesson')||w.lessonId===u.searchParams.get('lesson')),opts=Object.fromEntries(u.searchParams);if(opts.format==='apkg'){const buffer=await exportPackage(words,opts);res.setHeader('Content-Disposition','attachment; filename="wort-german.apkg"');return send(res,200,buffer,'application/octet-stream');}res.setHeader('Content-Disposition','attachment; filename="wort-german.txt"');return send(res,200,exportAnki(words,opts),'text/plain');}
 if(req.method==='GET'&&p==='/api/backup'){res.setHeader('Content-Disposition','attachment; filename="wort-backup.json"');return send(res,200,state);}
 if(['POST','PUT','DELETE'].includes(req.method)&&p.startsWith('/api/')){
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return send(res,403,{error:'Cross-origin request blocked.'});
  const input=await body(req);const run=queue.then(async()=>{const next=structuredClone(state);const parts=p.split('/');const kind=parts[2],id=parts[3];let result={ok:true};
   if(kind==='restore'&&req.method==='POST'){if(input.version!==1||!Array.isArray(input.words)||!Array.isArray(input.lessons)||input.words.length>10000||input.lessons.length>1000)throw Error('Invalid backup.');const ids=new Set();for(const k of ['words','lessons'])for(const r of input[k]){validate(k,r);if(typeof r.id!=='string'||!r.id||ids.has(r.id))throw Error('Invalid or duplicate IDs.');ids.add(r.id);if(k==='words'&&(!Number.isInteger(r.level)||r.level<0||r.level>6||!Number.isFinite(r.due)))throw Error('Invalid review data.');}if(!Array.isArray(input.reviews)||input.reviews.some(r=>!r||!Number.isFinite(r.at)||typeof r.wordId!=='string'))throw Error('Invalid review history.');await persist(input);return result;}
   if(kind==='bulk'&&req.method==='POST'){if(!Array.isArray(input.words)||!input.words.length||input.words.length>500)throw Error('Import between 1 and 500 words.');const records=input.words.map(w=>validate('words',w));const seen=new Set(next.words.map(w=>w.german.toLocaleLowerCase()));let added=0;for(const r of records){const key=r.german.toLocaleLowerCase();if(seen.has(key))continue;seen.add(key);next.words.push({...r,id:randomUUID(),level:0,due:0});added++;}result={added,skipped:records.length-added};}
   else if(kind==='review'&&req.method==='POST'){const w=next.words.find(w=>w.id===input.id);if(!w)throw Error('Word not found.');if(!['again','good','easy'].includes(input.rating))throw Error('Invalid rating.');w.level=input.rating==='again'?0:Math.min(6,w.level+(input.rating==='easy'?2:1));w.due=Date.now()+(input.rating==='again'?600000:[0,1,3,7,14,30,60][w.level]*86400000);next.reviews.push({wordId:w.id,at:Date.now(),rating:input.rating});}
   else if(['words','lessons'].includes(kind)){if(req.method==='POST'){const record={...validate(kind,input),id:randomUUID(),...(kind==='words'?{level:0,due:0}:{})};next[kind].push(record);result=record;}else{const i=next[kind].findIndex(r=>r.id===id);if(i<0)throw Error('Record not found.');if(req.method==='DELETE'){next[kind].splice(i,1);if(kind==='lessons')next.words.forEach(w=>{if(w.lessonId===id)w.lessonId='';});}else next[kind][i]={...next[kind][i],...validate(kind,input)};}}
   else throw Error('Unknown operation.');await persist(next);return result;
  });queue=run.catch(()=>{});return send(res,200,await run);
 }
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed.'});
 const routes={'/':'index.html','/app.js':'app.js','/speech.js':'speech.js','/style.css':'style.css'};if(!routes[p])return send(res,404,{error:'Not found.'});const content=await readFile(new URL('./public/'+routes[p],import.meta.url));res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self' ; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");send(res,200,content,p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');
 }catch(e){send(res,400,{error:e.message});}});
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Wort is ready at http://localhost:'+(process.env.PORT||3000)));
