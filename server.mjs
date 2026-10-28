import http from 'node:http';
import { readFile,writeFile,mkdir,rename } from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {seed,validate,exportAnki} from './domain.mjs';
import {exportPackage} from './anki.mjs';
import {germanAudio} from './tts.mjs';
import {lookupWord,lessonSpeech,numberGerman} from './public/course.js';
import {migrateStudy} from './migration.mjs';
import {planExport} from './public/export-plan.js';
const dir=path.resolve(process.env.DATA_DIR||'data');await mkdir(dir,{recursive:true});const file=path.join(dir,'study.json');let state;
try{state=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;state=seed();await writeFile(file,JSON.stringify(state));}
let queue=Promise.resolve();
if(!state.migrations?.includes('week-1-v1'))await writeFile(path.join(dir,'before-week-1.json'),JSON.stringify(state,null,2));
state=migrateStudy(state);await writeFile(file+'.tmp',JSON.stringify(state,null,2));await rename(file+'.tmp',file);
const audioFor=germanAudio({directory:path.join(dir,'audio')});
const dictionaryCacheFile=path.join(dir,'wiktionary-cache.json');let dictionaryCache={};
try{dictionaryCache=JSON.parse(await readFile(dictionaryCacheFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
let dictionaryCacheWrite=Promise.resolve(),dictionaryCacheClearing=null;const dictionaryLookupsInFlight=new Map();
async function fetchWiktionaryLookup(english){
 const fetchPage=async titles=>{const url=new URL('https://en.wiktionary.org/w/api.php');url.search=new URLSearchParams({action:'query',prop:'revisions',rvprop:'content',rvslots:'main',titles:titles.join('|'),format:'json',formatversion:'2'});const response=await fetch(url,{headers:{'User-Agent':'WortStudyCompanion/1.0 (personal language study app)'},signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Wiktionary is unavailable right now.');const data=await response.json();return (data.query?.pages||[]).map(p=>p.revisions?.[0]?.slots?.main?.content||'');};
 const clean=s=>s.replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,'$2').replace(/<[^>]+>/g,'').replace(/''+/g,'').replace(/\s+/g,' ').trim();
 const source=(await fetchPage([english]))[0];if(!source)return {suggestions:[]};
 const candidates=new Map();const templates=source.matchAll(/\{\{t\+?\|de\|([^|{}]+)(?:\|([^{}]+?))?\}\}/gi);
 for(const match of templates){let german=clean(match[1]);if(!german||german.includes(':')||german.length>100)continue;const tail=match[2]||'';const gender=(tail.match(/(?:^|\|)(m|f|n)(?:\||$)/i)||[])[1]?.toLowerCase()||'';const old=candidates.get(german);if(!old||(!old.gender&&gender))candidates.set(german,{german,gender,plural:'',english:clean(english),type:gender?'noun':'other',source:'Wiktionary'});}
 const picked=[...candidates.values()].slice(0,12);if(!picked.length)return {suggestions:[]};
 const pages=await fetchPage(picked.map(x=>x.german));for(let i=0;i<picked.length;i++){const wikitext=pages[i]||'';const head=wikitext.split(/\n==\s*(?:German|Deutsch)\s*==/i)[1]?.split(/\n===[^=]/)[0]||wikitext;const forms=new Set();for(const m of head.matchAll(/\{\{de-noun\|([^{}]*)\}\}/gi)){const args=m[1].split('|');let plural=args.find(x=>/^plural\s*=/.test(x))?.split('=').slice(1).join('=')||args.find((x,n)=>n>0&&!/^(?:m|f|n|m-p|f-p|n-p|\d+|head|g|pl)\s*=/i.test(x)&&!/^\d+$/.test(x));if(plural){plural=clean(plural.replace(/^\d+\s*=/,''));if(plural&&!['-','—','?'].includes(plural))for(const form of plural.split(/[,/]\s*/))if(form.length<100)forms.add(form);}}
  const genderMatch=head.match(/\{\{(?:m|f|n)\}\}/i)||head.match(/\|(?:g|gender)\s*=\s*(m|f|n)/i);if(!picked[i].gender&&genderMatch)picked[i].gender=(genderMatch[1]||genderMatch[0].replace(/[{}]/g,'')).toLowerCase();picked[i].plural=[...forms].join('|');picked[i].type=picked[i].gender?'noun':'other';
 }
 return {suggestions:picked};
}
function wiktionaryLookup(english){
 if(dictionaryCacheClearing)return dictionaryCacheClearing.then(()=>wiktionaryLookup(english));
 const key=english.trim().toLocaleLowerCase(),cached=dictionaryCache[key];
 if(cached)return Promise.resolve(cached.result);
 if(dictionaryLookupsInFlight.has(key))return dictionaryLookupsInFlight.get(key);
 const request=fetchWiktionaryLookup(english).then(async result=>{
  dictionaryCache[key]={fetchedAt:Date.now(),result};
  dictionaryCacheWrite=dictionaryCacheWrite.then(async()=>{await writeFile(dictionaryCacheFile+'.tmp',JSON.stringify(dictionaryCache));await rename(dictionaryCacheFile+'.tmp',dictionaryCacheFile);}).catch(()=>{});await dictionaryCacheWrite;
  return result;
 }).catch(error=>{if(cached?.result)return cached.result;throw error;}).finally(()=>dictionaryLookupsInFlight.delete(key));
 dictionaryLookupsInFlight.set(key,request);return request;
}
async function clearWiktionaryCache(){
 if(dictionaryCacheClearing)return dictionaryCacheClearing;
 dictionaryCacheClearing=(async()=>{await Promise.allSettled([...dictionaryLookupsInFlight.values()]);await dictionaryCacheWrite;dictionaryCache={};dictionaryCacheWrite=dictionaryCacheWrite.then(async()=>{await writeFile(dictionaryCacheFile+'.tmp','{}');await rename(dictionaryCacheFile+'.tmp',dictionaryCacheFile);});await dictionaryCacheWrite;})();
 try{await dictionaryCacheClearing;}finally{dictionaryCacheClearing=null;}
}
const persist=async next=>{await writeFile(file+'.tmp',JSON.stringify(next,null,2));await rename(file+'.tmp',file);state=next;};
const send=(res,status,data,type='application/json')=>{res.writeHead(status,{'Content-Type':type+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(type==='application/json'?JSON.stringify(data):data);};
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>30000000)throw Error('File exceeds 30 MB.');}return JSON.parse(text||'{}');}
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost');const p=u.pathname;
 if(req.method==='GET'&&p==='/api/health')return send(res,200,{ok:true});
 if(req.method==='GET'&&p==='/api/state')return send(res,200,state);
 if(req.method==='GET'&&p==='/api/lookup'){const english=(u.searchParams.get('english')||'').trim();if(!english||english.length>100)throw Error('Enter an English word or short phrase.');return send(res,200,await wiktionaryLookup(english));}
 if(req.method==='POST'&&p==='/api/lookup-cache/clear'){if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return send(res,403,{error:'Cross-origin request blocked.'});await clearWiktionaryCache();return send(res,200,{ok:true});}
 if(req.method==='GET'&&p.startsWith('/api/course-audio/')){const key=decodeURIComponent(p.slice('/api/course-audio/'.length));let text=lessonSpeech[key];if(/^number-\d+$/.test(key)){const n=Number(key.slice(7));if(n<=9999)text=numberGerman(n);}if(!text)return send(res,404,{error:'Audio example not found.'});try{const audio=await audioFor(text);res.writeHead(200,{'Content-Type':'audio/wav','Content-Length':audio.length,'Cache-Control':'no-store'});return res.end(audio);}catch(e){return send(res,503,{error:e.message});}}
 if(req.method==='GET'&&p.startsWith('/api/audio/')){const w=state.words.find(w=>w.id===p.slice('/api/audio/'.length));if(!w)return send(res,404,{error:'Word not found.'});try{const audio=await audioFor(w.german,u.searchParams.get('speed')||'normal');res.writeHead(200,{'Content-Type':'audio/wav','Content-Length':audio.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(audio);}catch(e){return send(res,503,{error:e.message});}}
 if(req.method==='GET'&&p==='/api/export'){const opts=Object.fromEntries(u.searchParams),format=opts.format||'apkg',plan=planExport(state.words,opts);if(!['apkg','text'].includes(format))throw Error('Invalid export format.');if(!plan.cards.length)throw Error('No words have a meaning in the selected language.');const name='wort-german-'+plan.options.language+'-'+plan.options.direction;if(format==='apkg'){const buffer=await exportPackage(state.words,opts);res.setHeader('Content-Disposition','attachment; filename="'+name+'.apkg"');return send(res,200,buffer,'application/octet-stream');}const output=exportAnki(state.words,opts);res.setHeader('Content-Disposition','attachment; filename="'+name+'.txt"');return send(res,200,output,'text/plain');}
 if(req.method==='GET'&&p==='/api/backup'){res.setHeader('Content-Disposition','attachment; filename="wort-backup.json"');return send(res,200,state);}
 if(['POST','PUT','DELETE'].includes(req.method)&&p.startsWith('/api/')){
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return send(res,403,{error:'Cross-origin request blocked.'});
  const input=await body(req);const run=queue.then(async()=>{const next=structuredClone(state);const parts=p.split('/');const kind=parts[2],id=parts[3];let result={ok:true};
   if(kind==='restore'&&req.method==='POST'){if(input.version!==1||!Array.isArray(input.words)||!Array.isArray(input.lessons)||input.words.length>10000||input.lessons.length>1000|| (input.verbs!==undefined&&(!Array.isArray(input.verbs)||input.verbs.length>1000)))throw Error('Invalid backup.');const ids=new Set();for(const k of ['words','lessons','verbs'])for(const r of input[k]||[]){validate(k,r);if(typeof r.id!=='string'||!r.id||ids.has(r.id))throw Error('Invalid or duplicate IDs.');ids.add(r.id);if(k==='words'&&(!Number.isInteger(r.level)||r.level<0||r.level>6||!Number.isFinite(r.due)))throw Error('Invalid review data.');}if(!Array.isArray(input.reviews)||input.reviews.some(r=>!r||!Number.isFinite(r.at)||typeof r.wordId!=='string'))throw Error('Invalid review history.');if(input.courseProgress!==undefined&&(!input.courseProgress||typeof input.courseProgress!=='object'||Array.isArray(input.courseProgress)))throw Error('Invalid course progress.');if(input.migrations!==undefined&&(!Array.isArray(input.migrations)||input.migrations.some(m=>typeof m!=='string')))throw Error('Invalid migrations.');await persist(migrateStudy(input));return result;}
   if(kind==='capture'&&req.method==='POST'){const german=String(input.german||'').trim();if(!german||german.length>100)throw Error('Enter a word or short phrase, up to 100 characters.');const savedVerb=next.verbs.find(v=>v.infinitive===german);const entry=lookupWord(german)||(savedVerb?{german,english:savedVerb.english,arabic:savedVerb.arabic,type:'verb'}:null);const canonical=entry?.german||german;const existing=next.words.find(w=>w.german===canonical);if(existing)return {word:existing,created:false};const record={...validate('words',{...entry,german:canonical,lessonId:input.lessonId||''}),id:randomUUID(),level:0,due:0};next.words.push(record);result={word:record,created:true};}
   else if(kind==='course-progress'&&req.method==='POST'){if(!['alphabet','sounds','greetings','numbers','colors','introductions','verbs'].includes(input.topic)||typeof input.completed!=='boolean')throw Error('Invalid topic progress.');next.courseProgress[input.topic]=input.completed;}
   else if(kind==='bulk'&&req.method==='POST'){if(!Array.isArray(input.words)||!input.words.length||input.words.length>500)throw Error('Import between 1 and 500 words.');const records=input.words.map(w=>validate('words',w));const seen=new Set(next.words.map(w=>w.german));let added=0;for(const r of records){const key=r.german;if(seen.has(key))continue;seen.add(key);next.words.push({...r,id:randomUUID(),level:0,due:0});added++;}result={added,skipped:records.length-added};}
   else if(kind==='review'&&req.method==='POST'){const w=next.words.find(w=>w.id===input.id);if(!w)throw Error('Word not found.');if(!['again','good','easy'].includes(input.rating))throw Error('Invalid rating.');w.level=input.rating==='again'?0:Math.min(6,w.level+(input.rating==='easy'?2:1));w.due=Date.now()+(input.rating==='again'?600000:[0,1,3,7,14,30,60][w.level]*86400000);next.reviews.push({wordId:w.id,at:Date.now(),rating:input.rating});}
   else if(['words','lessons','verbs'].includes(kind)){if(req.method==='POST'){const values=validate(kind,input);if(kind==='verbs'&&next.verbs.some(v=>v.infinitive.toLocaleLowerCase()===values.infinitive.toLocaleLowerCase()))throw Error('This verb is already saved. Edit its existing entry.');const record={...values,id:randomUUID(),...(kind==='words'?{level:0,due:0}:{})};next[kind].push(record);result=record;}else{const i=next[kind].findIndex(r=>r.id===id);if(i<0)throw Error('Record not found.');if(req.method==='DELETE'){next[kind].splice(i,1);if(kind==='lessons')next.words.forEach(w=>{if(w.lessonId===id)w.lessonId='';});}else next[kind][i]={...next[kind][i],...validate(kind,input)};}}
   else throw Error('Unknown operation.');await persist(next);return result;
  });queue=run.catch(()=>{});return send(res,200,await run);
 }
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed.'});
 const routes={'/':'index.html','/app.js':'app.js','/export-plan.js':'export-plan.js','/export-ui.js':'export-ui.js','/shortcuts.js':'shortcuts.js','/course.js':'course.js','/board.js':'board.js','/lesson.js':'lesson.js','/speech.js':'speech.js','/style.css':'style.css'};if(!routes[p])return send(res,404,{error:'Not found.'});const content=await readFile(new URL('./public/'+routes[p],import.meta.url));res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self' ; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");send(res,200,content,p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');
 }catch(e){send(res,400,{error:e.message});}});
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Wort is ready at http://localhost:'+(process.env.PORT||3000)));
