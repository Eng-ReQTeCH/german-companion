import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const base='http://127.0.0.1:3000';
const state=await (await fetch(base+'/api/state')).json();
const word=state.words.find(w=>w.german==='Hallo')||state.words[0];
for(const key of ['alphabet','sound-3','number-758','introduction']){
 const response=await fetch(base+'/api/course-audio/'+key);assert.equal(response.status,200,await response.clone().text());
 const wav=Buffer.from(await response.arrayBuffer());assert.equal(wav.toString('ascii',8,12),'WAVE');assert.ok(wav.length>1000);console.log(`Week 1 ${key}: ${wav.length} bytes`);
}
for(const speed of ['normal','slow']){
 const response=await fetch(base+'/api/audio/'+word.id+'?speed='+speed);assert.equal(response.status,200,await response.clone().text());
 const audio=Buffer.from(await response.arrayBuffer());assert.equal(audio.toString('ascii',0,4),'RIFF');assert.equal(audio.toString('ascii',8,12),'WAVE');assert.ok(audio.length>1000);
 console.log(`${speed} word audio: ${audio.length} bytes`);
}
const sample=await fetch('http://127.0.0.1:5002/synthesize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Guten Morgen! Ich lerne Deutsch. Vielen Dank und auf Wiedersehen.',length_scale:1})});
assert.equal(sample.status,200);const wav=Buffer.from(await sample.arrayBuffer());assert.equal(wav.toString('ascii',8,12),'WAVE');
await mkdir('test-results',{recursive:true});await writeFile('test-results/german-voice.wav',wav);
console.log(`German neural voice sample generated: ${wav.length} bytes`);
const require=createRequire('C:/Users/Monty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage();await page.goto(base+'/#words');
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='Saved on your server');
 const response=page.waitForResponse(r=>r.url().includes('/api/audio/'));
 const button=page.getByRole('button',{name:'Hear '+word.german,exact:true});await button.click();assert.equal((await response).status(),200);
 await page.waitForFunction(()=>!document.querySelector('[data-action="speak"]').disabled);
 const error=await page.locator('#toast').textContent();assert.ok(!error.includes('could not play'),error);
 console.log('Browser Listen button successfully played server-generated German WAV audio.');
}finally{await browser.close();}
