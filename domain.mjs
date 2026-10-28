import { randomUUID } from 'node:crypto';
import {pronouns} from './public/course.js';
import {planExport,shuffleCards} from './public/export-plan.js';
export const seed = () => ({version:1,words:[['Hallo','hello','مرحبًا','greeting'],['Danke','thank you','شكرًا','expression'],['bitte','please / you’re welcome','من فضلك / عفوًا','expression'],['Guten Morgen','good morning','صباح الخير','greeting'],['Tschüss','bye','مع السلامة','greeting'],['ja','yes','نعم','expression'],['nein','no','لا','expression'],['das Buch','book','كتاب','noun'],['die Sprache','language','لغة','noun'],['lernen','to learn','يتعلم','verb']].map(([german,english,arabic,type])=>({id:randomUUID(),german,english,arabic,type,example:'',notes:'',lessonId:'starter',tags:'starter',level:0,due:0})),lessons:[{id:'starter',title:'The first conversation',week:1,date:'',summary:'Example material · Replace or edit this with your actual course notes.',notes:'STARTER EXAMPLES\n\nHallo! — Hello!\nIch heiße … — My name is …\nWie heißt du? — What is your name? (informal)\nIch lerne Deutsch. — I am learning German.\n\nREMEMBER\nGerman nouns start with a capital letter. Learn each noun with its article: der, die or das.\n\nYOUR COURSE\nAdd your teacher’s examples, grammar notes and questions here.',completed:false}],reviews:[]});
const fields={words:['german','english','arabic','type','example','notes','lessonId','tags','gender','plural','image'],lessons:['title','summary','notes','date'],verbs:['infinitive','english','arabic','notes']};
export function validate(kind,input){
 if(!input || typeof input!=='object')throw Error('Invalid record.');
 const out={};for(const key of fields[kind]){out[key]=String(input[key]??'').trim();if(out[key].length>(key==='image'?1800000:20000))throw Error('Text is too long.');}
 if(kind==='words'&&!['','m','f','n'].includes(out.gender))throw Error('Choose masculine, feminine, or neuter.');
 if(kind==='words'&&out.gender&&out.german){const article={m:'der',f:'die',n:'das'}[out.gender];out.german=article+' '+out.german.replace(/^(der|die|das)\s+/i,'');}
 if(kind==='words'&&!out.german)throw Error('Add a German word.');
 if(kind==='verbs'){if(!out.infinitive)throw Error('Add the infinitive.');if(!Array.isArray(input.forms)||input.forms.length!==pronouns.length||input.forms.some(f=>typeof f!=='string'||!f.trim()||f.length>100))throw Error('Add a conjugation for all six pronouns.');out.forms=input.forms.map(f=>f.trim());}
 if(kind==='lessons'){if(!out.title)throw Error('Add a lesson title.');out.week=Number(input.week);if(!Number.isInteger(out.week)||out.week<1||out.week>999)throw Error('Week must be between 1 and 999.');out.completed=!!input.completed;}
 return out;
}
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])).replace(/\r?\n/g,'<br>').replace(/\t/g,'&#9;');
export function exportRows(words,input={},random=Math.random){
 const {options,cards}=planExport(words,input);
 return (options.shuffle?shuffleCards(cards,random):cards).map(({word:w,direction})=>{
  const meanings=[options.language!=='arabic'&&w.english&&`<div lang="en" dir="ltr">${escapeHTML(w.english)}</div>`,options.language!=='english'&&w.arabic&&`<div lang="ar" dir="rtl">${escapeHTML(w.arabic)}</div>`].filter(Boolean).join('');
  const de=`<div lang="de" dir="ltr">${escapeHTML(w.german)}</div>`;
  const details=[w.gender&&`<div class="noun" lang="de" dir="ltr">${escapeHTML(({m:'der · masculine',f:'die · feminine',n:'das · neuter'})[w.gender]||'')} · plural: ${escapeHTML(w.plural||'—')}</div>`,options.examples&&w.example&&`<div class="example" lang="de" dir="ltr">${escapeHTML(w.example)}</div>`,options.notes&&w.notes&&`<div class="note" dir="auto">${escapeHTML(w.notes)}</div>`].filter(Boolean).join('');
  const tags=String(w.tags||'').split(/[\s,]+/).filter(Boolean).map(t=>t.replace(/[^\p{L}\p{N}_-]/gu,'')).filter(Boolean).join(' ');
  return {source:w,direction,fields:[direction==='forward'?de:meanings,(direction==='forward'?meanings:de)+details,tags],sortText:direction==='forward'?w.german:[options.language!=='arabic'&&w.english,options.language!=='english'&&w.arabic].filter(Boolean).join(' ')};
 });
}
export function exportAnki(words,input={}){
 const {options}=planExport(words,input);
 return '#separator:Tab\n#html:true\n#deck:'+options.deck+'\n#tags column:3\n#columns:Front\tBack\tTags\n'+exportRows(words,options).map(r=>r.fields.join('\t')).join('\n')+'\n';
}
