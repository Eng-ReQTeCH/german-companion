import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseGermanEntry,germanDictionary} from '../dictionary.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
const noun=`== Lehrer (Deutsch) ==
{{Deutsch Substantiv Übersicht
|Genus=m
|Nominativ Plural=Lehrer
}}
{{Weibliche Wortformen}}
:[[Lehrerin]]
{{Übersetzungen}}
{{Ü|en|teacher}}
`;
test('noun import reads explicit plural, feminine and meaning',()=>{const [e]=parseGermanEntry(noun,'Lehrer');assert.equal(e.gender,'m');assert.equal(e.plural,'Lehrer');assert.equal(e.feminine,'Lehrerin');assert.equal(e.english,'teacher');});
test('separable irregular verbs retain dictionary word order for all pronouns',()=>{const [e]=parseGermanEntry(`== aufstehen (Deutsch) ==
=== {{Wortart|Verb|Deutsch}}, {{unreg.}} ===
{{Deutsch Verb Übersicht
|Präsens_ich=stehe auf
|Präsens_du=stehst auf
|Präsens_er, sie, es=steht auf
|Imperativ Plural=steht auf
}}
{{Ü|en|get up}}`,'aufstehen');assert.equal(e.irregular,'yes');assert.deepEqual(e.forms,['stehe auf','stehst auf','steht auf','stehen auf','steht auf','stehen auf']);});
test('missing words return no invented entry',()=>assert.deepEqual(parseGermanEntry('','missing'),[]));
test('automatic imports persist metadata, skip duplicates and add irregular drills atomically',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'wort-auto-import-'));
 const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'31491',DATA_DIR:directory,EPISUITE_URL:''},stdio:['ignore','pipe','pipe']});
 try{await new Promise((resolve,reject)=>{child.stdout.on('data',d=>{if(d.toString().includes('ready'))resolve();});child.once('exit',code=>reject(Error('Startup failed: '+code)));child.once('error',reject);});
 const base='http://127.0.0.1:31491/api/';const post=async(entry)=>{const r=await fetch(base+'import-entry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)});assert.equal(r.status,200);return r.json();};
 const entry={german:'Lehrer',english:'teacher',type:'noun',gender:'m',plural:'Lehrer',feminine:'Lehrerin'};assert.deepEqual(await post(entry),{added:true});assert.deepEqual(await post(entry),{skipped:true});
 await post({german:'gehen',english:'go',type:'verb',irregular:'yes',forms:['gehe','gehst','geht','gehen','geht','gehen']});
 const state=await(await fetch(base+'state')).json();assert.equal(state.words.find(w=>w.german==='der Lehrer').feminine,'Lehrerin');assert.equal(state.verbs.filter(v=>v.infinitive==='gehen').length,1);
 await post({german:'sie',english:'she',type:'pronoun'});await post({german:'Sie',english:'you (polite)',type:'pronoun'});
 await post({german:'Bank',english:'bank',type:'noun',gender:'f',plural:'Banken'});await post({german:'Bank',english:'bank',type:'noun',gender:'f',plural:'Bänke'});
 await post({german:'Geschwister',english:'siblings',type:'noun',number:'plural',plural:'Geschwister'});
 const after=await(await fetch(base+'state')).json();assert.equal(after.words.filter(w=>['sie','Sie'].includes(w.german)).length,2);assert.equal(after.words.filter(w=>w.german==='die Bank').length,2);assert.equal(after.words.find(w=>w.german==='die Geschwister').gender,'');
 const backup=await(await fetch(base+'backup')).json();assert.equal(backup.words.find(w=>w.german==='gehen').irregular,'yes');
 const review=await fetch(base+'review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:state.words.find(w=>w.german==='gehen').id,rating:'good'})});assert.equal(review.status,200);
 }finally{if(child.exitCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;}await rm(directory,{recursive:true,force:true});}
});
test('dictionary shares requests, persists across instances and clears only explicitly',async()=>{const directory=await mkdtemp(path.join(tmpdir(),'wort-dictionary-')),original=globalThis.fetch;let requests=0;globalThis.fetch=async()=>{requests++;return {ok:true,json:async()=>({query:{pages:[{title:'Lehrer',revisions:[{slots:{main:{content:noun}}}]}]}})}};try{const d=germanDictionary(directory);await Promise.all([d.lookup('Lehrer'),d.lookup('Lehrer')]);assert.equal(requests,1);await germanDictionary(directory).lookup('Lehrer');assert.equal(requests,1);await d.clear();await d.lookup('Lehrer');assert.equal(requests,2);}finally{globalThis.fetch=original;await rm(directory,{recursive:true,force:true});}});
