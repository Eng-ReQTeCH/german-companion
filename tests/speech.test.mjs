import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {speakGerman} from '../public/speech.js';
import {germanAudio} from '../tts.mjs';
test('speech plays server audio and stops the previous word',async()=>{
 const instances=[];class Audio {constructor(url){this.url=url;instances.push(this);}async play(){}pause(){this.paused=true;}}
 await speakGerman('word-1',{AudioClass:Audio});await speakGerman('word-2',{AudioClass:Audio});
 assert.equal(instances[0].url,'/api/audio/word-1');assert.equal(instances[0].paused,true);assert.equal(instances[1].url,'/api/audio/word-2');
});
test('audio failure is reported without calling browser speech',async()=>{
 class Audio{pause(){}async play(){throw Error('failed');}}
 await assert.rejects(speakGerman('word',{AudioClass:Audio}),/Piper voice service/);
});
test('German neural audio is validated, cached and deduplicated',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'wort-audio-'));try{
 let calls=0;const wav=Buffer.alloc(48);wav.write('RIFF');wav.write('WAVE',8);
 const audio=germanAudio({directory,fetcher:async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.text,'Tschüss');assert.equal(body.length_scale,1);return new Response(wav);}});
 const [a,b]=await Promise.all([audio('Tschüss'),audio('Tschüss')]);assert.deepEqual(a,b);await audio('Tschüss');assert.equal(calls,1);
 await assert.rejects(audio('x'.repeat(301)),/300/);
 const invalid=germanAudio({directory,fetcher:async()=>new Response('not audio')});await assert.rejects(invalid('new word'),/invalid audio/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
