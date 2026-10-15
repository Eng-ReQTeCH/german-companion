import {boardVocabulary,greetings,regularVerbs,boardAlphabet} from './board.js';
export const pronouns=['ich','du','er / sie / es','wir','ihr','sie / Sie'];
export const irregularExamples=[
 {infinitive:'sein',english:'to be',arabic:'يكون',forms:['bin','bist','ist','sind','seid','sind'],notes:'Learn the whole pattern. Example: Ich bin aus Ägypten.'},
 {infinitive:'haben',english:'to have',arabic:'يملك / لديه',forms:['habe','hast','hat','haben','habt','haben'],notes:'The b disappears in du hast and er/sie/es hat.'},
 {infinitive:'sprechen',english:'to speak',arabic:'يتحدث',forms:['spreche','sprichst','spricht','sprechen','sprecht','sprechen'],notes:'e becomes i in du and er/sie/es.'},
 {infinitive:'lesen',english:'to read',arabic:'يقرأ',forms:['lese','liest','liest','lesen','lest','lesen'],notes:'e becomes ie in du liest and er/sie/es liest.'},
 {infinitive:'sehen',english:'to see',arabic:'يرى',forms:['sehe','siehst','sieht','sehen','seht','sehen'],notes:'e becomes ie in du siehst and er/sie/es sieht.'}
];
export const alphabet=[['A','aː','ah'],['B','beː','bay'],['C','tseː','tsay'],['D','deː','day'],['E','eː','ay'],['F','ɛf','eff'],['G','ɡeː','gay'],['H','haː','hah'],['I','iː','ee'],['J','jɔt','yot'],['K','kaː','kah'],['L','ɛl','ell'],['M','ɛm','emm'],['N','ɛn','enn'],['O','oː','oh'],['P','peː','pay'],['Q','kuː','koo'],['R','ɛʁ','err'],['S','ɛs','ess'],['T','teː','tay'],['U','uː','oo'],['V','faʊ','fow'],['W','veː','vay'],['X','ɪks','iks'],['Y','ˈʏpsilɔn','Üpsilon'],['Z','tsɛt','tset']];
export const sounds=[
 ['ei / ai','/aɪ̯/','Eis, drei','Like “eye”. ei and ie are different.'],
 ['ie','/iː/','vier, sieben','A long ee sound.'],
 ['au','/aʊ̯/','Haus, Auto, Frau','Like “ow” in cow.'],
 ['eu / äu','/ɔʏ̯/','Euro, Bäume','Like “oy” in boy. äu is ä + u; it sounds like eu.'],
 ['sch','/ʃ/','schwarz, Schule','Like sh in ship.'],
 ['ch','/ç/ or /x/','Buch, ich, Bücher','After a, o, u, au: back-of-mouth Buch sound. After front vowels (including umlauts): soft ich sound. Not English “ch”.'],
 ['sp / st','/ʃp/ /ʃt/','Spiel, Straße','At the start of a syllable, usually shp / sht.'],
 ['tsch','/tʃ/','Deutsch','Like ch in chair.'],
 ['z / tz','/ts/','zehn, sitzen','Like ts in cats.'],
 ['w','/v/','wohnen','Like English v.'],
 ['v','often /f/','vier, Vater','Often f in native German words; borrowed words can use v.'],
 ['ß / ss','/s/','weiß, heißen','Voiceless s. ß follows a long vowel or diphthong; ss follows a short vowel.'],
 ['-ig','often /ɪç/','richtig','In standard German, word-final -ig commonly ends with the soft ich sound; regional pronunciation varies.']
];
export const smallNumbers=['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn','zwanzig'];
const tens={20:'zwanzig',30:'dreißig',40:'vierzig',50:'fünfzig',60:'sechzig',70:'siebzig',80:'achtzig',90:'neunzig'};
export function numberGerman(n){if(!Number.isInteger(n)||n<0||n>9999)throw Error('Choose a whole number from 0 to 9999.');if(n<=20)return smallNumbers[n];if(n<100){const unit=n%10;return (unit?(unit===1?'ein':smallNumbers[unit])+'und':'')+tens[n-unit];}if(n<1000){const h=Math.floor(n/100);return (h===1?'ein':smallNumbers[h])+'hundert'+(n%100?numberGerman(n%100):'');}const t=Math.floor(n/1000);return (t===1?'ein':numberGerman(t))+'tausend'+(n%1000?numberGerman(n%1000):'');}
const baseVocabulary=[...boardVocabulary,
 ['rot','red','أحمر','adjective'],['blau','blue','أزرق','adjective'],['gelb','yellow','أصفر','adjective'],['grün','green','أخضر','adjective'],['schwarz','black','أسود','adjective'],['weiß','white','أبيض','adjective'],['grau','grey','رمادي','adjective'],['braun','brown','بني','adjective'],['orange','orange','برتقالي','adjective'],['rosa','pink','وردي','adjective'],['lila','purple','بنفسجي','adjective'],
 ['heißen','to be called','يُدعى','verb'],['kommen','to come','يأتي','verb'],['wohnen','to live / reside','يسكن','verb'],['lernen','to learn','يتعلم','verb'],['sein','to be','يكون','verb'],['haben','to have','يملك / لديه','verb'],['sprechen','to speak','يتحدث','verb'],
 ['ich','I','أنا','other'],['du','you (informal, singular)','أنتَ / أنتِ','other'],['er','he','هو','other'],['sie','she / they','هي / هم','other'],['es','it','هو / هي لغير العاقل','other'],['wir','we','نحن','other'],['ihr','you (informal, plural)','أنتم','other'],['Sie','you (formal, singular or plural)','حضرتك / حضراتكم','other'],
 ['der Name','name','اسم','noun'],['die Farbe','color','لون','noun'],['die Lieblingsfarbe','favorite color','اللون المفضل','noun'],['Deutschland','Germany','ألمانيا','other'],['Ägypten','Egypt','مصر','other'],['Kairo','Cairo','القاهرة','other'],
 ['Hallo','hello','مرحبًا','greeting'],['Danke','thank you','شكرًا','expression'],['bitte','please / you’re welcome','من فضلك / عفوًا','expression'],['Guten Morgen','good morning','صباح الخير','greeting'],['Tschüss','bye','مع السلامة','greeting'],['ja','yes','نعم','expression'],['nein','no','لا','expression'],['das Buch','book','كتاب','noun'],['die Sprache','language','لغة','noun']
];
export const vocabulary=baseVocabulary.map(([german,english,arabic,type])=>({german,english,arabic,type})).concat(smallNumbers.map((german,n)=>({german,english:String(n),arabic:String(n),type:'number'})),[{german:'einhundert',english:'100',arabic:'١٠٠',type:'number'},{german:'eintausend',english:'1000',arabic:'١٠٠٠',type:'number'}]);
export function lookupWord(text){const exact=vocabulary.find(w=>w.german===text);return exact||vocabulary.find(w=>w.german.toLocaleLowerCase()===text.toLocaleLowerCase())||vocabulary.find(w=>w.type==='noun'&&w.german.replace(/^(der|die|das) /,'').toLocaleLowerCase()===text.toLocaleLowerCase())||null;}
export const weekOne={id:'week-1',title:'The foundations',week:1,date:'',summary:'Alphabet & sounds, greetings, numbers, colors, introductions and verb conjugation.',notes:'',completed:false,courseId:'week-1',contentRevision:'board-v1'};
export const lessonSpeech=Object.fromEntries(sounds.map((s,i)=>['sound-'+i,s[2].replaceAll(',','.')]).concat([
 ['introduction','Hallo! Ich heiße Lina. Ich komme aus Ägypten. Ich wohne in Kairo. Meine Lieblingsfarbe ist blau.'],
 ['umlauts','Bär. schön. grün. Straße.'],
 ['alphabet',alphabet.map(([letter])=>letter).join('. ')+'.'],
 ...greetings.map((group,i)=>['greeting-'+i,group.phrases.map(p=>p.replace(/\s*\(.*?\)/g,'')).join('. ')]),
 ...boardAlphabet.map(([letter,words],i)=>['board-letter-'+i,words.replaceAll(',','. ')]),
 ...regularVerbs.map(v=>['regular-'+v.infinitive,pronouns.map((p,i)=>(i===2?'er':i===5?'sie':p)+' '+v.forms[i]).join('. ')]),
 ['introductions-formal','Wie heißen Sie? Wie ist Ihr Name? Wer sind Sie? Woher kommen Sie? Wo wohnen Sie? Wie alt sind Sie?'],
 ['introductions-informal','Wie heißt du? Wie ist dein Name? Wer bist du? Woher kommst du? Wo wohnst du? Wie alt bist du?'],
 ['color-shades','hell. dunkel. hellblau. dunkelblau.'],
 ...baseVocabulary.map(w=>['word-'+w[0],w[0]]),
 ...irregularExamples.map(v=>['verb-'+v.infinitive,pronouns.map((p,i)=>(i===2?'er':i===5?'sie':p)+' '+v.forms[i]).join('. ')])
]));
export const exercises=[
 {question:'Which letter has the name /veː/?',options:['W','V','J'],answer:'W',why:'W is named We /veː/. V is Vau and J is Jot. Letter names and word sounds differ.'},
 {question:'Which pairing sounds like “oy” in boy?',options:['äu / eu','ie','ei'],answer:'äu / eu',why:'äu and eu share /ɔʏ̯/: Häuser, neun.'},
 {question:'What is 16?',options:['sechzehn','sechszehn','sechzig'],answer:'sechzehn',why:'16 loses the s of sechs. 60 is sechzig.'},
 {question:'What is 21?',options:['einundzwanzig','einsundzwanzig','zwanzigundeins'],answer:'einundzwanzig',why:'Say the ones before the tens: ein + und + zwanzig.'},
 {question:'Choose the correct sentence.',options:['Ich komme aus Ägypten.','Ich kommen aus Ägypten.','Ich komme in Ägypten.'],answer:'Ich komme aus Ägypten.',why:'ich takes -e. Use aus to express where you are from.'},
 {question:'Complete: Du ___ in Kairo.',options:['wohnst','wohne','wohnt'],answer:'wohnst',why:'wohnen: wohn + st for du.'},
 {question:'Complete: Er ___ Deutsch.',options:['spricht','sprecht','sprechen'],answer:'spricht',why:'sprechen changes e to i in du sprichst and er/sie/es spricht.'},
 {question:'Complete: Ihr ___ aus Deutschland.',options:['seid','sind','bist'],answer:'seid',why:'sein has an irregular pattern: ihr seid.'},
 {question:'Complete: Meine Lieblingsfarbe ___ blau.',options:['ist','bin','sind'],answer:'ist',why:'die Lieblingsfarbe is singular, so use ist.'},
 {question:'Which word means “green”?',options:['grün','grau','gelb'],answer:'grün',why:'grün = green; grau = grey; gelb = yellow.'}
 ,{question:'What is 758?',options:['siebenhundertachtundfünfzig','siebenhundertfünfundachtzig','siebenhundertundfünfzigacht'],answer:'siebenhundertachtundfünfzig',why:'758 = 700 + 58. achtundfünfzig is eight and fifty, written as one word.'},
 {question:'Complete: Du ___ ein Buch.',options:['hast','habst','hat'],answer:'hast',why:'haben is irregular in du hast and er/sie/es hat.'}
];
