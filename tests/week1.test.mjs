import {test} from 'node:test';
import assert from 'node:assert/strict';
import {numberGerman,lookupWord,pronouns,irregularExamples} from '../public/course.js';
import {migrateStudy} from '../migration.mjs';
import {seed,validate,exportAnki} from '../domain.mjs';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
test('number builder handles irregular teens, inverted tens and compounds',()=>{
 const cases={1:'eins',16:'sechzehn',17:'siebzehn',20:'zwanzig',21:'einundzwanzig',30:'dreißig',60:'sechzig',70:'siebzig',100:'einhundert',101:'einhunderteins',758:'siebenhundertachtundfünfzig',1000:'eintausend',1001:'eintausendeins',9999:'neuntausendneunhundertneunundneunzig'};
 for(const [n,expected]of Object.entries(cases))assert.equal(numberGerman(Number(n)),expected);
 for(const n of [-1,2.5,10000,NaN])assert.throws(()=>numberGerman(n));
});
test('migration preserves custom notes, reviews and vocabulary and is idempotent',()=>{
 const original=seed();const before=JSON.stringify(original.words);migrateStudy(original);assert.equal(original.lessons[0].courseId,'week-1');assert.equal(JSON.stringify(original.words),before);assert.equal(original.verbs.length,0);migrateStudy(original);assert.equal(original.lessons.length,1);
 const customized=seed();customized.lessons[0].notes='My teacher notes';migrateStudy(customized);assert.equal(customized.lessons[0].notes,'My teacher notes');assert.equal(customized.lessons.length,2);
});
test('vocabulary keeps sie and Sie distinct; all conjugations have six slots',()=>{
 assert.match(lookupWord('Sie').english,/formal/);assert.match(lookupWord('sie').english,/she/);assert.equal(lookupWord('grün').arabic,'أخضر');assert.equal(lookupWord('unlisted'),null);assert.equal(lookupWord('Lieblingsfarbe').german,'die Lieblingsfarbe');
 assert.equal(pronouns.length,6);for(const v of irregularExamples)assert.equal(validate('verbs',v).forms.length,6);assert.throws(()=>validate('verbs',{infinitive:'sein',forms:['bin']}));
 assert.equal(exportAnki([{german:'untranslated'}]).split('\n').filter(l=>l&&!l.startsWith('#')).length,0);
});
test('quick capture, verb persistence, progress and old-backup compatibility',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'wort-week1-'));const original=seed();await writeFile(path.join(dir,'study.json'),JSON.stringify(original));
 const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'31381',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{child.stdout.on('data',d=>{if(d.toString().includes('ready'))resolve();});child.on('error',reject);child.on('exit',c=>reject(Error('Server exit '+c)));setTimeout(()=>reject(Error('Startup timeout')),10000).unref();});
  const call=async(p,method='GET',data)=>{const r=await fetch('http://127.0.0.1:31381/api/'+p,{method,headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json()};};
  const initial=(await call('state')).data;assert.equal(initial.lessons[0].courseId,'week-1');
  const known=(await call('capture','POST',{german:'grün'})).data;assert.equal(known.word.english,'green');assert.equal((await call('capture','POST',{german:'grün'})).data.created,false);
  const unknown=(await call('capture','POST',{german:'die Testwolke'})).data.word;assert.equal(unknown.english,'');assert.ok(unknown.id);
  await call('words/'+unknown.id,'PUT',{...unknown,english:'test cloud'});
  const verb=(await call('verbs','POST',irregularExamples[0])).data;assert.equal(verb.forms[4],'seid');assert.equal((await call('verbs','POST',irregularExamples[0])).status,400);
  assert.equal((await call('verbs/'+verb.id,'PUT',{...verb,notes:'My class note'})).status,200);
  assert.equal((await call('course-progress','POST',{topic:'sounds',completed:true})).status,200);
  const backup=(await call('backup')).data;assert.equal(backup.verbs[0].notes,'My class note');assert.equal(backup.courseProgress.sounds,true);
  await call('restore','POST',backup);assert.equal((await call('state')).data.verbs[0].id,verb.id);
  assert.equal((await call('restore','POST',original)).status,200);assert.deepEqual((await call('state')).data.verbs,[]);
 }finally{child.kill();await new Promise(r=>child.once('exit',r));await rm(dir,{recursive:true,force:true});}
});
