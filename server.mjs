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
function parseGermanNounTemplate(raw,lemma){
 const args=raw.split('|').map(x=>x.trim()),positional=args.filter(x=>!x.includes('=')&&!/^\d+$/.test(x)),spec=args.find(x=>/^1\s*=/.test(x))?.replace(/^1\s*=/,'')||positional[0]||'';
 const gender=(spec.match(/^\s*([mfn])(?:,|$)/i)||[])[1]?.toLowerCase()||'';
 const parts=spec.split(',');let pluralSpec=parts.length>2?parts[2].trim():'';
 const forms=new Set();
 const umlaut=word=>word.replace(/au/i,m=>m[0]===m[0].toUpperCase()?'Äu':'äu').replace(/[aou]/i,m=>({'a':'ä','A':'Ä','o':'ö','O':'Ö','u':'ü','U':'Ü'})[m]||m);
 const variants=pluralSpec?pluralSpec.split(':').map(x=>x.trim()).filter(Boolean):[];
 for(let form of variants){
  form=form.replace(/\[[^\]]*\]/g,'').trim();if(!form||['-','--','?'].includes(form))continue;
  if(form.startsWith('^')){forms.add(umlaut(lemma)+form.slice(1));continue;}
  if(form.startsWith(lemma)){forms.add(form);continue;}
  if(/^\(?e\)?s?$/.test(form)){if(form.includes('(e)')){forms.add(lemma+'s');forms.add(lemma+'es');}else forms.add(lemma+form);continue;}
  if(/^(?:e|er|n|en|s|es|ien|se|nen)?$/.test(form)){forms.add(lemma+form);continue;}
  forms.add(form);
 }
 if(!forms.size&&!pluralSpec){let plural='';const lower=lemma.toLocaleLowerCase('de');if(/nis$/.test(lower))plural=lemma+'se';else if(gender==='f')plural=/e$/.test(lower)?lemma+'n':/[^aeiouäöü]in$/.test(lower)?lemma.slice(0,-1)+'nen':lemma+'en';else if(/e$/.test(lower))plural=lemma+'n';else if(gender==='n'&&/lein$/.test(lower))plural=lemma;else if(gender==='n'&&/um$/.test(lower))plural=lemma.slice(0,-2)+'en';else if(/mus$/.test(lower))plural=lemma.slice(0,-3)+'men';else if(/[^aeiouäöü]us$/.test(lower))plural=lemma+'e';else if(/(?:el|em|en|er)$/.test(lower))plural=lemma;else plural=lemma+'e';if(plural)forms.add(plural);}
 return {gender,plural:[...forms].join('|')};
}
async function fetchWiktionaryLookup(english){
 const fetchPage=async titles=>{const url=new URL('https://en.wiktionary.org/w/api.php');url.search=new URLSearchParams({action:'query',prop:'revisions',rvprop:'content',rvslots:'main',titles:titles.join('|'),format:'json',formatversion:'2'});const response=await fetch(url,{headers:{'User-Agent':'WortStudyCompanion/1.0 (personal language study app)'},signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Wiktionary is unavailable right now.');const data=await response.json();return Object.fromEntries((data.query?.pages||[]).map(p=>[String(p.title||'').toLocaleLowerCase(),p.revisions?.[0]?.slots?.main?.content||'']));};
 const clean=s=>s.replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,'$2').replace(/<[^>]+>/g,'').replace(/''+/g,'').replace(/\s+/g,' ').trim();
 const sourcePages=await fetchPage([english]),source=sourcePages[english.toLocaleLowerCase()]||Object.values(sourcePages)[0];if(!source)return {suggestions:[]};
 const candidates=new Map();const templates=source.matchAll(/\{\{t\+?\|de\|([^|{}]+)(?:\|([^{}]+?))?\}\}/gi);
 for(const match of templates){let german=clean(match[1]);if(!german||german.includes(':')||german.length>100)continue;const tail=match[2]||'';const gender=(tail.match(/(?:^|\|)(m|f|n)(?:\||$)/i)||[])[1]?.toLowerCase()||'';const old=candidates.get(german);if(!old||(!old.gender&&gender))candidates.set(german,{german,gender,plural:'',english:clean(english),type:gender?'noun':'other',source:'Wiktionary'});}
 const picked=[...candidates.values()].slice(0,12);if(!picked.length)return {suggestions:[]};
 const nounCandidates=picked.filter(x=>x.gender).slice(0,6);if(nounCandidates.length){const pages=await fetchPage(nounCandidates.map(x=>x.german));for(let i=0;i<nounCandidates.length;i++){const wikitext=pages[nounCandidates[i].german.toLocaleLowerCase()]||'';const head=wikitext.split(/\n==\s*(?:German|Deutsch)\s*==/i)[1]?.split(/\n===[^=]/)[0]||wikitext;let parsed={gender:'',plural:''};for(const m of head.matchAll(/\{\{de-noun\|([^{}]*)\}\}/gi)){parsed=parseGermanNounTemplate(m[1],nounCandidates[i].german);if(parsed.gender||parsed.plural)break;}
  if(!nounCandidates[i].gender&&parsed.gender)nounCandidates[i].gender=parsed.gender;
  if(parsed.plural)nounCandidates[i].plural=parsed.plural;
  nounCandidates[i].type=nounCandidates[i].gender?'noun':'other';
 }}
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
const episuiteUrl=String(process.env.EPISUITE_URL||'').trim().replace(/\/+$/,'');
let episuiteTaskSync=null,episuiteTaskLastAttempt=0,episuiteActivityRetryAt=0;
const episuiteDate=(timezone,now=new Date())=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone||'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const fields=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${fields.year}-${fields.month}-${fields.day}`;};
async function syncEpisuiteTask(){
 if(!episuiteUrl||Date.now()-episuiteTaskLastAttempt<30000)return;
 if(episuiteTaskSync)return episuiteTaskSync;
 episuiteTaskLastAttempt=Date.now();
 episuiteTaskSync=(async()=>{
  const response=await fetch(episuiteUrl+'/api/state',{signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error(`Episuite state returned ${response.status}.`);const remote=await response.json();
  const configuredId=String(process.env.EPISUITE_TASK_ID||'').trim(),title=String(process.env.EPISUITE_TASK_TITLE||'Study German').trim().toLocaleLowerCase();
  const matches=(remote.tasks||[]).filter(t=>!t.deleted&&(configuredId?t.id===configuredId:String(t.title||'').trim().toLocaleLowerCase()===title));
  if(matches.length!==1){if(matches.length>1)console.warn('Episuite sync skipped: configure EPISUITE_TASK_ID because the task title is ambiguous.');return;}
  const task=matches[0],day=episuiteDate(remote.settings?.timezone);const complete=task.repeat==='none'?task.completed:(task.history?.[day]||[]).length>=(Number(task.target)||1);if(complete)return;
  const updated=await fetch(episuiteUrl+'/api/tasks/'+encodeURIComponent(task.id)+'/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});if(!updated.ok)throw Error(`Episuite task completion returned ${updated.status}.`);
 })().finally(()=>{episuiteTaskSync=null;});
 try{await episuiteTaskSync;}catch(error){if(Date.now()-episuiteTaskLastAttempt<60000)console.warn('Episuite task sync unavailable:',error.message);}
}
async function persistEpisuiteOutboxEvent(eventId){
 if(!episuiteUrl||Date.now()<episuiteActivityRetryAt)return;
 const event=state.episuiteOutbox.find(item=>item.eventId===eventId);if(!event)return;
 try{
  const response=await fetch(episuiteUrl+'/api/integrations/german-companion/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event),signal:AbortSignal.timeout(5000)});
  if(response.status===404||response.status===405){episuiteActivityRetryAt=Date.now()+5*60*1000;return;}
  if(!response.ok)throw Error(`Episuite activity returned ${response.status}.`);
  const run=queue.then(async()=>{const next=structuredClone(state);next.episuiteOutbox=next.episuiteOutbox.filter(item=>item.eventId!==eventId);await persist(next);});queue=run.catch(()=>{});await run;const nextEvent=state.episuiteOutbox[0];if(nextEvent)void persistEpisuiteOutboxEvent(nextEvent.eventId);
 }catch(error){episuiteActivityRetryAt=Date.now()+15*60*1000;console.warn('Episuite activity sync queued for retry:',error.message);}
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
   else if(kind==='practice-activity'&&req.method==='POST'){const sessionId=String(input.sessionId||''),date=String(input.date||''),seconds=Number(input.totalSeconds),activityKind=input.kind==='verb-drill'?'verb-drill':'flashcards';if(!/^[\w-]{8,100}$/.test(sessionId)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||!Number.isInteger(seconds)||seconds<0||seconds>86400)throw Error('Invalid practice activity.');next.practiceSessions??={};next.practiceActivity??={};next.verbDrillActivity??={};next.episuiteOutbox??=[];const previous=next.practiceSessions[sessionId]||{date,seconds:0,completed:false,verified:false,kind:activityKind};if(previous.date!==date||previous.kind!==activityKind)throw Error('Practice session details cannot change.');const wasCompleted=Boolean(previous.completed),wasVerified=Boolean(previous.verified),added=Math.max(0,seconds-(previous.seconds||0));previous.seconds=Math.max(previous.seconds||0,seconds);previous.verified=Boolean(previous.verified||input.verified);previous.completed=Boolean(previous.completed||input.completed);next.practiceSessions[sessionId]=previous;if(added)next.practiceActivity[date]=(next.practiceActivity[date]||0)+added;if(!wasVerified&&previous.verified&&activityKind==='verb-drill')next.verbDrillActivity[date]=(next.verbDrillActivity[date]||0)+1;if(!wasCompleted&&previous.completed)next.episuiteOutbox.push({eventId:'wort:'+sessionId,sessionId,date,seconds:previous.seconds,kind:activityKind,verbDrills:activityKind==='verb-drill'?1:0,createdAt:Date.now()});result={ok:true,date,seconds:previous.seconds};}
   else if(kind==='review'&&req.method==='POST'){const w=next.words.find(w=>w.id===input.id);if(!w)throw Error('Word not found.');if(!['again','good','easy'].includes(input.rating))throw Error('Invalid rating.');w.level=input.rating==='again'?0:Math.min(6,w.level+(input.rating==='easy'?2:1));w.due=Date.now()+(input.rating==='again'?600000:[0,1,3,7,14,30,60][w.level]*86400000);next.reviews.push({wordId:w.id,at:Date.now(),rating:input.rating});}
   else if(['words','lessons','verbs'].includes(kind)){if(req.method==='POST'){const values=validate(kind,input);if(kind==='verbs'&&next.verbs.some(v=>v.infinitive.toLocaleLowerCase()===values.infinitive.toLocaleLowerCase()))throw Error('This verb is already saved. Edit its existing entry.');const record={...values,id:randomUUID(),...(kind==='words'?{level:0,due:0}:{})};next[kind].push(record);result=record;}else{const i=next[kind].findIndex(r=>r.id===id);if(i<0)throw Error('Record not found.');if(req.method==='DELETE'){next[kind].splice(i,1);if(kind==='lessons')next.words.forEach(w=>{if(w.lessonId===id)w.lessonId='';});}else next[kind][i]={...next[kind][i],...validate(kind,input)};}}
   else throw Error('Unknown operation.');await persist(next);return result;
  });queue=run.catch(()=>{});const saved=await run;if(kind==='review'||(kind==='practice-activity'&&(Number(input.totalSeconds)>0||input.completed||input.verified)))void syncEpisuiteTask();if(kind==='practice-activity'&&input.completed)void persistEpisuiteOutboxEvent('wort:'+String(input.sessionId));return send(res,200,saved);
 }
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed.'});
 const routes={'/':'index.html','/app.js':'app.js','/export-plan.js':'export-plan.js','/export-ui.js':'export-ui.js','/shortcuts.js':'shortcuts.js','/course.js':'course.js','/board.js':'board.js','/lesson.js':'lesson.js','/speech.js':'speech.js','/style.css':'style.css'};if(!routes[p])return send(res,404,{error:'Not found.'});const content=await readFile(new URL('./public/'+routes[p],import.meta.url));res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self' ; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");send(res,200,content,p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');
 }catch(e){send(res,400,{error:e.message});}});
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Wort is ready at http://localhost:'+(process.env.PORT||3000)));
const episuiteOutboxRetry=setInterval(()=>{const event=state.episuiteOutbox?.[0];if(event)void persistEpisuiteOutboxEvent(event.eventId);},5*60*1000);episuiteOutboxRetry.unref();
if(state.episuiteOutbox?.length)void persistEpisuiteOutboxEvent(state.episuiteOutbox[0].eventId);
