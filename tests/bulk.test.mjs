import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
test('bulk import is atomic and skips repeated German words',async()=>{const dir=await mkdtemp(path.join(tmpdir(),'wort-bulk-'));const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'31380',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});try{await new Promise((resolve,reject)=>{child.stdout.on('data',d=>{if(d.toString().includes('ready'))resolve();});child.on('error',reject);});const post=words=>fetch('http://127.0.0.1:31380/api/bulk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({words})});assert.equal((await post([{german:'der Tisch',english:'table'},{german:'bad'}])).status,400);let state=await (await fetch('http://127.0.0.1:31380/api/state')).json();assert.equal(state.words.length,10);const r=await post([{german:'der Tisch',english:'table'},{german:'Hallo',english:'hello'},{german:'der Tisch',arabic:'طاولة'}]);assert.deepEqual(await r.json(),{added:1,skipped:2});state=await (await fetch('http://127.0.0.1:31380/api/state')).json();assert.equal(state.words.length,11);}finally{child.kill();await new Promise(r=>child.once('exit',r));await rm(dir,{recursive:true,force:true});}});
