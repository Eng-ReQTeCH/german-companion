import { randomUUID } from 'node:crypto';
import {pronouns} from './public/course.js';
export const seed = () => ({version:1,words:[['Hallo','hello','مرحبًا','greeting'],['Danke','thank you','شكرًا','expression'],['bitte','please / you’re welcome','من فضلك / عفوًا','expression'],['Guten Morgen','good morning','صباح الخير','greeting'],['Tschüss','bye','مع السلامة','greeting'],['ja','yes','نعم','expression'],['nein','no','لا','expression'],['das Buch','book','كتاب','noun'],['die Sprache','language','لغة','noun'],['lernen','to learn','يتعلم','verb']].map(([german,english,arabic,type])=>({id:randomUUID(),german,english,arabic,type,example:'',notes:'',lessonId:'starter',tags:'starter',level:0,due:0})),lessons:[{id:'starter',title:'The first conversation',week:1,date:'',summary:'Example material · Replace or edit this with your actual course notes.',notes:'STARTER EXAMPLES\n\nHallo! — Hello!\nIch heiße … — My name is …\nWie heißt du? — What is your name? (informal)\nIch lerne Deutsch. — I am learning German.\n\nREMEMBER\nGerman nouns start with a capital letter. Learn each noun with its article: der, die or das.\n\nYOUR COURSE\nAdd your teacher’s examples, grammar notes and questions here.',completed:false}],reviews:[]});
const fields={words:['german','english','arabic','type','example','notes','lessonId','tags'],lessons:['title','summary','notes','date'],verbs:['infinitive','english','arabic','notes']};
export function validate(kind,input){
 if(!input || typeof input!=='object')throw Error('Invalid record.');
 const out={};for(const key of fields[kind]){out[key]=String(input[key]??'').trim();if(out[key].length>20000)throw Error('Text is too long.');}
 if(kind==='words'&&!out.german)throw Error('Add a German word.');
 if(kind==='verbs'){if(!out.infinitive)throw Error('Add the infinitive.');if(!Array.isArray(input.forms)||input.forms.length!==pronouns.length||input.forms.some(f=>typeof f!=='string'||!f.trim()||f.length>100))throw Error('Add a conjugation for all six pronouns.');out.forms=input.forms.map(f=>f.trim());}
 if(kind==='lessons'){if(!out.title)throw Error('Add a lesson title.');out.week=Number(input.week);if(!Number.isInteger(out.week)||out.week<1||out.week>999)throw Error('Week must be between 1 and 999.');out.completed=!!input.completed;}
 return out;
}
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])).replace(/\r?\n/g,'<br>').replace(/\t/g,'&#9;');
export function exportAnki(words,{direction='forward',language='both'}={}){
 if(!['forward','reverse','both'].includes(direction)||!['english','arabic','both'].includes(language))throw Error('Invalid export options.');
 const rows=[];for(const w of words){const meaning=[language!=='arabic'&&w.english,language!=='english'&&w.arabic].filter(Boolean).map(escapeHTML).join('<br>');if(!meaning)continue;const de=escapeHTML(w.german), detail=w.example?'<br><small>'+escapeHTML(w.example)+'</small>':'';const tags=String(w.tags||'').split(/[\s,]+/).filter(Boolean).map(t=>t.replace(/[^\p{L}\p{N}_-]/gu,'')).filter(Boolean).join(' ');if(direction!=='reverse')rows.push([de,meaning+detail,tags]);if(direction!=='forward')rows.push([meaning,de+detail,tags]);}
 return '#separator:Tab\n#html:true\n#deck:Wort::German\n#tags column:3\n#columns:Front\tBack\tTags\n'+rows.map(r=>r.join('\t')).join('\n')+'\n';
}
