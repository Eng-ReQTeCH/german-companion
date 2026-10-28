import {planExport} from './export-plan.js';
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
export function exportMarkup(words=[]){return `<div class="export-layout export-studio"><form class="panel" id="export-form"><h2>Choose. Download. Study.</h2><label for="export-direction">Card direction</label><select id="export-direction" name="direction"><option value="forward">German → meaning</option><option value="reverse">Meaning → German</option><option value="both">Both directions</option></select><label for="export-language">Meaning language</label><select id="export-language" name="language"><option value="both">English + Arabic</option><option value="english">English</option><option value="arabic">Arabic</option></select><label for="export-tag">Study set</label><select id="export-tag" name="tag"><option value="">All words</option>${[...new Set(words.flatMap(w=>String(w.tags||'').split(/[\s,]+/).filter(Boolean))||[])].sort().map(t=>`<option value="${e(t)}">${e(t)}</option>`).join('')}</select><p id="export-filter-description" class="hint" hidden></p><details class="export-advanced"><summary>Advanced options</summary><label for="export-deck">Deck name</label><input id="export-deck" name="deck" value="Wort::German" maxlength="80" required><label for="export-format">File format</label><select id="export-format" name="format"><option value="apkg">Anki deck (.apkg)</option><option value="text">Text import (.txt)</option></select><label for="export-order">Card order</label><select id="export-order" name="shuffle"><option value="true">Shuffled (recommended)</option><option value="false">Collection order</option></select><label class="check-label"><input type="checkbox" name="examples" checked> Include example sentences</label><label class="check-label"><input type="checkbox" name="notes"> Include word notes</label></details><div class="export-summary" id="export-count" aria-live="polite"></div><details id="export-skipped" hidden><summary></summary><ul></ul><a class="text-button" href="#words">Fill in missing meanings ↗</a></details><p id="export-error" class="form-error" role="alert"></p><button class="primary export-download" id="export-download" type="submit">Download Anki file ↓</button><p class="hint" id="export-order-note"></p><p class="hint" id="export-shortcut-hint"></p></form><section class="export-inspector"><div class="section-head"><h2>Try your cards</h2><span class="count" id="export-position"></span></div><div class="flashcard export-sample"><span class="tag" id="export-face">QUESTION</span><div class="term" id="export-front" dir="auto"></div><div id="export-answer" hidden><div id="export-back" dir="auto"></div><div id="export-details"></div></div><button type="button" id="export-flip" class="text-button">Show answer</button></div><div class="export-preview-controls"><button type="button" id="export-prev" aria-label="Previous preview card">← Previous</button><button type="button" id="export-next" aria-label="Next preview card">Next →</button></div><p class="hint">These are sample cards. Shuffling changes the downloaded order.</p><div class="note" id="export-import-help"><strong>Open the .apkg file in Anki.</strong><p>Your deck, card formatting and tags are included. You can re-export edited words; card identities stay the same for the same word, language and direction.</p></div><details class="export-advanced"><summary>About shuffled order & re-imports</summary><p class="hint">New-card positions are randomized in the package. Once imported, Anki’s deck options and existing learning progress control the order you study. Re-importing updates notes; it does not reset your reviews or reshuffle cards you already study. To randomize new-card display each day, use Anki’s Display Order → Random cards.</p><a class="text-button" href="https://docs.ankiweb.net/deck-options.html#display-order" target="_blank" rel="noopener">Anki display-order guide ↗</a></details></section></div>`;}
export function mountExporter({words,defaults={},filters=null,onMessage=()=>{},onUpdate=()=>{}}){
 const form=$('#export-form'),downloadButton=$('#export-download'),errorBox=$('#export-error');let saved={};try{saved=JSON.parse(localStorage.getItem('wort-export')||'{}');}catch{}
 const settings=filters?{...saved,...defaults}:{...defaults,...saved};
 for(const key of ['direction','language','tag','deck','format','shuffle'])if(settings[key]!==undefined&&form.elements[key])form.elements[key].value=String(settings[key]);
 for(const key of ['examples','notes'])if(typeof settings[key]==='boolean')form.elements[key].checked=settings[key];
 if(filters){$('#export-filter-description').hidden=false;$('#export-filter-description').textContent=[filters.search&&'Search: '+filters.search,filters.type&&'Type: '+filters.type].filter(Boolean).join(' · ')||'All words in your current list.';}
 let plan=null,index=0,revealed=false,busy=false;
 function options(){const values=Object.fromEntries(new FormData(form));for(const key of ['examples','notes'])values[key]=form.elements[key].checked;if(filters)Object.assign(values,filters);return values;}
 function preview(){
  const card=plan?.cards[index];$('#export-position').textContent=card?`${index+1} / ${plan.cards.length}`:'0 cards';$('#export-flip').disabled=!card;$('#export-prev').disabled=!card||plan.cards.length<2;$('#export-next').disabled=!card||plan.cards.length<2;
  $('#export-answer').hidden=!revealed||!card;$('#export-front').hidden=revealed&&!!card;$('#export-face').textContent=revealed?'ANSWER':'QUESTION';$('#export-flip').textContent=revealed?'Show question':'Show answer';
  if(!card){$('#export-front').textContent='No cards to preview';$('#export-details').textContent='';return;}
  const w=card.word,o=plan.options;
  const german=`<div lang="de" dir="ltr">${e(w.german)}</div>`;
  const known=[o.language!=='arabic'&&w.english&&`<div lang="en" dir="ltr">${e(w.english)}</div>`,o.language!=='english'&&w.arabic&&`<div lang="ar" dir="rtl">${e(w.arabic)}</div>`].filter(Boolean).join('');
  $('#export-front').innerHTML=card.direction==='forward'?german:known;$('#export-back').innerHTML=card.direction==='forward'?known:german;
  $('#export-details').innerHTML=[o.examples&&w.example&&`<p class="hint" lang="de">${e(w.example)}</p>`,o.notes&&w.notes&&`<p class="hint" dir="auto">${e(w.notes)}</p>`].filter(Boolean).join('');
 }
 function update(){
  if(busy)return;
  try{
   plan=planExport(words,options());index=0;revealed=false;$('#export-error').textContent='';
   const o=plan.options;try{localStorage.setItem('wort-export',JSON.stringify({direction:o.direction,language:o.language,tag:form.elements.tag.value||'',deck:o.deck,shuffle:o.shuffle,format:form.elements.format.value,examples:o.examples,notes:o.notes}));}catch{}
   $('#export-count').innerHTML=`<strong>${plan.cards.length} cards</strong><span>${plan.included.length} words included${plan.skipped.length?' · '+plan.skipped.length+' skipped':''}</span>`;
   $('#export-skipped').hidden=!plan.skipped.length;$('#export-skipped summary').textContent=`${plan.skipped.length} words need a meaning for this language`;
   $('#export-skipped ul').innerHTML=plan.skipped.map(w=>`<li lang="de">${e(w.german)}</li>`).join('');
   $('#export-download').disabled=!plan.cards.length||busy;
   $('#export-order-note').textContent=o.shuffle?'Shuffled by default. Your choices are remembered on this device.':'Collection order selected. Your choices are remembered on this device.';
   $('#export-import-help').innerHTML=form.elements.format.value==='text'?'<strong>In Anki: File → Import → select your text file.</strong><p>Choose the Basic note type. Map Front to Front and Back to Back. The file includes UTF-8 text, HTML formatting, tags and a deck header.</p>':'<strong>Open the .apkg file in Anki.</strong><p>Your deck, card formatting and tags are included. Re-exporting keeps the same card identities for the same word, language and direction.</p>';
  }catch(error){plan=null;$('#export-error').textContent=error.message;$('#export-download').disabled=true;$('#export-count').textContent='Check your export options.';}
  preview();onUpdate();
 }
 function flip(){if(!plan?.cards.length)return;revealed=!revealed;preview();}
 function next(delta=1){if(!plan?.cards.length)return;index=(index+delta+plan.cards.length)%plan.cards.length;revealed=false;preview();}
 async function download(){
  if(busy||!plan?.cards.length)return;
  const opts=options();
  busy=true;downloadButton.disabled=true;downloadButton.textContent='Preparing your deck…';errorBox.textContent='';onUpdate();
  form.querySelectorAll('input,select').forEach(control=>control.disabled=true);
  try{
   const response=await fetch('/api/export?'+new URLSearchParams(opts));if(!response.ok){let error;try{error=(await response.json()).error;}catch{}throw Error(error||'Could not export. Try again.');}
   const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`wort-german-${opts.language}-${opts.direction}.${opts.format==='text'?'txt':'apkg'}`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);onMessage('Deck downloaded. Open it in Anki to study.');
  }catch(error){errorBox.textContent=error.message;}finally{busy=false;form.querySelectorAll('input,select').forEach(control=>control.disabled=false);downloadButton.textContent='Download Anki file ↓';downloadButton.disabled=!plan?.cards.length;onUpdate();}
 }
 form.addEventListener('submit',event=>{event.preventDefault();download();});form.addEventListener('change',update);$('#export-deck').addEventListener('input',update);
 $('#export-flip').onclick=flip;$('#export-prev').onclick=()=>next(-1);$('#export-next').onclick=()=>next(1);update();return {flip,next,download,get cardCount(){return plan?.cards.length||0;},get ready(){return !!plan?.cards.length&&!busy;}};
}
