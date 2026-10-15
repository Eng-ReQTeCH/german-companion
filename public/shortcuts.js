export function typingTarget(target){return !!target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]');}
export function shortcutAction(event,context){
 if(event.defaultPrevented||event.repeat||event.isComposing)return null;
 const key=event.key,mod=event.ctrlKey||event.metaKey;
 if(context.help)return key==='Escape'?'close-help':null;
 if(context.dialog)return mod&&key==='Enter'?'save-dialog':null;
 if(context.view==='export'&&mod&&key==='Enter')return context.exportReady?'download':null;
 if(event.altKey||mod)return null;
 if(context.verbNext&&key==='Enter'&&event.target?.id==='verb-drill-answer')return 'verb-next';
 if(typingTarget(event.target))return null;
 if((key===' '||key==='Enter')&&event.target?.closest?.('button,a,summary'))return null;
 if(key==='?')return 'help';
 if(key.toLowerCase()==='n')return 'new-word';
 if(key.toLowerCase()==='e'&&context.view!=='export')return 'export';
 if(key.toLowerCase()==='p'&&context.view!=='practice')return 'practice';
 if(key.toLowerCase()==='s'&&context.view==='practice'&&context.canStart)return 'start-review';
 if(key==='/'&&context.view==='words')return 'search';
 if(context.view==='verbs'&&key.toLowerCase()==='v')return 'new-verb';
 if(context.view==='export')return ({' ':context.exportCards?'flip':null,ArrowLeft:context.exportCards>1?'previous':null,ArrowRight:context.exportCards>1?'next':null,d:context.exportReady?'download':null})[key.length===1?key.toLowerCase():key]||null;
 if(context.view==='practice'&&context.practice&&!context.practice.busy){
  if(key===' '&&!context.practice.revealed)return 'reveal';
  if(context.practice.revealed&&['1','2','3'].includes(key))return 'rate-'+['again','good','easy'][Number(key)-1];
  if(key.toLowerCase()==='r')return 'replay';
 }
 if(context.view.startsWith('lesson/')){
  if(/^[1-7]$/.test(key))return 'topic-'+['alphabet','sounds','greetings','numbers','colors','introductions','verbs'][Number(key)-1];
  if(key.toLowerCase()==='q')return 'topic-check';
 }
 return null;
}
function hints(c){
 if(c.dialog)return c.quick?[['Enter','Add word'],['Esc','Close']]:[['Ctrl / ⌘ + Enter','Save'],['Esc','Close']];
 if(c.typing){if(c.view==='export')return [...(c.exportReady?[['Ctrl / ⌘ + Enter','Download']]:[]),['Tab / Shift + Tab','Move between fields']];if(c.verbField)return [['Enter',c.verbNext?'Next pronoun':'Check form'],['Tab','Next control']];if(c.meaningField)return [['Enter','Save meaning'],['Tab','Next field']];return [['Tab / Shift + Tab','Move between fields']];}
 const rows=[['N','Add word']];
 if(c.view==='words')rows.push(['/','Search'],['E','Export this view']);
 else if(c.view!=='export')rows.push(['E','Anki export']);
 if(c.view!=='practice')rows.push(['P','Practice']);
 if(c.view==='practice'&&c.canStart)rows.push(['S','Start review']);
 if(c.view==='export')rows.push(...(c.exportCards?[['Space','Flip preview']]:[]),...(c.exportCards>1?[['← / →','Browse cards']]:[]),...(c.exportReady?[['D','Download'],['Ctrl / ⌘ + Enter','Download from a field']]:[]));
 if(c.view==='practice'&&c.practice&&!c.practice.busy){if(c.practice.revealed)rows.push(['1','Again'],['2','Got it'],['3','Easy']);else rows.push(['Space','Reveal']);rows.push(['R','Listen']);}
 if(c.view==='verbs'){rows.push(['V','Add verb']);if(c.verbActive)rows.push(['Enter',c.verbNext?'Next pronoun':'Check form']);}
 if(c.view.startsWith('lesson/'))rows.push(['1–7','Jump to topic'],['Q','Knowledge check']);
 rows.push(['?','Shortcuts']);return rows;
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installShortcuts({getContext,run}){
 const help=document.createElement('dialog');help.id='shortcut-help';help.setAttribute('aria-labelledby','shortcut-help-title');document.body.append(help);
 const bar=document.createElement('section');bar.className='shortcut-bar';bar.setAttribute('aria-label','Available keyboard shortcuts');document.querySelector('.navigation').after(bar);
 function context(){const active=document.activeElement;return {...getContext(),typing:typingTarget(active),verbField:active?.id==='verb-drill-answer',meaningField:!!active?.matches?.('[data-meaning]')};}
 function render(){const c=context(),items=hints(c);const html=items.map(([key,label])=>`<span><kbd>${escape(key)}</kbd> ${escape(label)}</span>`).join('');
  const content=html+'<button class="shortcut-help-button" type="button" aria-label="Show keyboard shortcuts">Keyboard shortcuts</button>';
  if(bar.innerHTML!==content){bar.innerHTML=content;bar.querySelector('button').onclick=open;}
  const form=document.querySelector('#editor[open] #edit-form');if(form){let hint=form.querySelector('.dialog-key-hint');if(!hint){hint=document.createElement('p');hint.className='hint dialog-key-hint';form.append(hint);}const text='<kbd>Ctrl / ⌘ + Enter</kbd> Save · <kbd>Esc</kbd> Close';if(hint.innerHTML!==text)hint.innerHTML=text;}
  const exporterHint=document.querySelector('#export-shortcut-hint');if(exporterHint){const text=c.exportCards?'<kbd>Space</kbd> Flip preview'+(c.exportCards>1?' · <kbd>←</kbd> / <kbd>→</kbd> Browse':'')+(c.exportReady?' · <kbd>D</kbd> Download':''):'Add a meaning to a word to create study cards.';if(exporterHint.innerHTML!==text)exporterHint.innerHTML=text;}
  for(const [selector,keys]of [['[data-action="add-word"]','n'],['[data-action="add-verb"]','v'],['#search','/'],['#export-download','d Control+Enter Meta+Enter'],['#export-flip','Space'],['#export-prev','ArrowLeft'],['#export-next','ArrowRight']])document.querySelectorAll(selector).forEach(element=>element.setAttribute('aria-keyshortcuts',keys));
 }
 function open(){const c=context();if(c.dialog)return;help.innerHTML=`<div class="dialog-head"><h2 id="shortcut-help-title">Keyboard shortcuts</h2><button type="button" aria-label="Close keyboard shortcuts">×</button></div><p class="hint">Available on this screen. Letter shortcuts pause while you type.</p><dl class="shortcut-list">${hints(c).map(([key,label])=>`<div><dt><kbd>${escape(key)}</kbd></dt><dd>${escape(label)}</dd></div>`).join('')}<div><dt><kbd>Tab / Shift + Tab</kbd></dt><dd>Move between controls</dd></div><div><dt><kbd>Enter</kbd></dt><dd>Use a focused control or submit a form</dd></div><div><dt><kbd>Esc</kbd></dt><dd>Close a dialog</dd></div></dl>`;help.querySelector('button').onclick=()=>help.close();help.showModal();}
 document.addEventListener('keydown',event=>{const c={...getContext(),help:help.open};const action=shortcutAction(event,c);if(!action)return;event.preventDefault();if(action==='help')open();else if(action==='close-help')help.close();else run(action);});
 let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render();});});
 observer.observe(document.querySelector('#main'),{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','hidden']});observer.observe(document.querySelector('#editor'),{childList:true,subtree:true,attributes:true,attributeFilter:['open','disabled','hidden']});
 document.addEventListener('focusin',()=>queueMicrotask(render));document.addEventListener('focusout',()=>queueMicrotask(render));
 render();return {render,open};
}
