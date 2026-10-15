import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {planExport,shuffleCards,normalizeExportOptions} from '../public/export-plan.js';
import {exportRows,exportAnki} from '../domain.mjs';
import {exportPackage} from '../anki.mjs';
const words=Array.from({length:8},(_,i)=>({id:'word-'+i,german:'Wort '+i,english:'word '+i,arabic:'كلمة '+i,example:'Ein Beispiel.',notes:'Remember this.',tags:'week1',lessonId:i<4?'a':'b',type:i<4?'noun':'verb'}));
async function inspectPackage(options,random=()=>0,records=words){const buffer=await exportPackage(records,options,random),length=buffer.readUInt32LE(18),offset=30+buffer.readUInt16LE(26),directory=await mkdtemp(path.join(tmpdir(),'wort-export-check-'));let db;try{const file=path.join(directory,'deck.db');await writeFile(file,buffer.subarray(offset,offset+length));db=new DatabaseSync(file);return {rows:db.prepare('SELECT n.guid,n.flds,n.sfld,c.due FROM notes n JOIN cards c ON c.nid=n.id ORDER BY c.due').all(),col:db.prepare('SELECT * FROM col').get(),integrity:db.prepare('PRAGMA integrity_check').get().integrity_check};}finally{db?.close();await rm(directory,{recursive:true,force:true});}}
test('default shuffle mixes cards without mutating input or separating row identities',()=>{
 const original=words.map(w=>w.id),rows=exportRows(words,{},()=>0);assert.equal(normalizeExportOptions().shuffle,true);assert.notDeepEqual(rows.map(r=>r.source.id),original);assert.deepEqual(words.map(w=>w.id),original);assert.deepEqual(new Set(rows.map(r=>r.source.id)),new Set(original));
 for(const r of rows)assert.ok(r.fields[0].includes(r.source.german));
 assert.deepEqual(exportRows(words,{shuffle:false}).map(r=>r.source.id),original);assert.deepEqual(shuffleCards([],()=>0),[]);
});
test('export preview plan and output share scope, translations and both-direction counts',()=>{
 const records=[...words,{id:'blank',german:'Unknown',english:'',arabic:'',type:'noun',lessonId:'a'}];
 const plan=planExport(records,{lesson:'a',language:'arabic',direction:'both'});assert.equal(plan.scope.length,5);assert.equal(plan.included.length,4);assert.equal(plan.skipped.length,1);assert.equal(plan.cards.length,8);
 assert.equal(exportRows(records,plan.options).length,8);assert.equal(planExport(records,{type:'verb',search:'word 7'}).cards.length,1);
 assert.equal(planExport([{german:'X',english:' ',arabic:'نعم'}]).cards.length,1);
});
test('exported APKG queue positions are shuffled by default and GUIDs survive reshuffling/edits',async()=>{
 const ordered=await inspectPackage({shuffle:false}),mixed=await inspectPackage({});assert.equal(mixed.integrity,'ok');assert.notDeepEqual(mixed.rows.map(r=>r.sfld),ordered.rows.map(r=>r.sfld));assert.deepEqual(mixed.rows.map(r=>r.due),[1,2,3,4,5,6,7,8]);
 const edited=await inspectPackage({shuffle:true},()=>.5,words.map(w=>({...w,english:'edited '+w.english})));
 assert.deepEqual(new Set(ordered.rows.map(r=>r.guid)),new Set(mixed.rows.map(r=>r.guid)));assert.deepEqual(new Set(mixed.rows.map(r=>r.guid)),new Set(edited.rows.map(r=>r.guid)));
 const both=await inspectPackage({direction:'both'});assert.equal(both.rows.length,16);assert.equal(new Set(both.rows.map(r=>r.guid)).size,16);
});
test('Arabic direction, example/note options, text headers and custom deck names are preserved',async()=>{
 const rows=exportRows(words,{language:'arabic',direction:'reverse',examples:false,notes:true,shuffle:false});assert.match(rows[0].fields[0],/lang="ar" dir="rtl"/);assert.doesNotMatch(rows[0].fields[1],/Ein Beispiel/);assert.match(rows[0].fields[1],/Remember this/);
 const text=exportAnki(words,{deck:'Wort::Week 1',shuffle:false});assert.match(text,/#deck:Wort::Week 1/);assert.equal(text.split('\n').filter(l=>l&&!l.startsWith('#')).length,8);
 const custom=await inspectPackage({deck:'Wort::Week 1'});assert.equal(Object.values(JSON.parse(custom.col.decks))[0].name,'Wort::Week 1');
 assert.throws(()=>normalizeExportOptions({deck:'X\n#tags:bad'}));assert.throws(()=>normalizeExportOptions({shuffle:'invalid'}));
});
