import {readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {irregularExamples} from './public/course.js';
const clean=s=>String(s||'').replace(/<!--[^]*?-->/g,'').replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g,'$1').replace(/\{\{[^{}]*\}\}/g,'').replace(/<[^>]*>/g,'').replace(/''+/g,'').replace(/\[[0-9, –-]+\]/g,'').trim();
export function parseGermanEntry(source,word){
 const german=source.split(/\n==[^\n]*\(Deutsch\)[^\n]*==/)[1]?.split(/\n==[^=]/)[0]||source;
 const meanings=[...german.matchAll(/\{\{Ü(?:t|\?)?\|en\|([^|{}]+)[^{}]*\}\}/g)].map(m=>clean(m[1]));
 const english=[...new Set(meanings)].slice(0,8).join(' / ');
 const entries=[];
 for(const match of german.matchAll(/\{\{Deutsch (Substantiv|Verb) Übersicht\s*\n([^]*?)\n\}\}/g)){
  const values=Object.fromEntries([...match[2].matchAll(/\|\s*([^=\n]+?)\s*=\s*([^\n|]*)/g)].map(m=>[m[1].trim(),clean(m[2])]));
  const all=prefix=>[...new Set(Object.entries(values).filter(([k,v])=>(k===prefix||k.startsWith(prefix+' '))&&v&&!/^[-—?]+$/.test(v)).map(([,v])=>v))].join('|');
  const noun=match[1]==='Substantiv',gender=values.Genus||'';
  const known=irregularExamples.find(v=>v.infinitive===word);
  const singular=['ich','du','er, sie, es'].map(p=>values['Präsens_'+p]||'');
  const stem=word.replace(/(?:en|n)$/,'');const regular=/\{\{(?:schwaches Verb|regelmäßig)\|/.test(german);
  const imperative=values['Imperativ Plural']||'';const particle=imperative.includes(' ')?imperative.split(' ').at(-1):'';const pluralVerb=particle&&word.startsWith(particle)?word.slice(particle.length)+' '+particle:word;const forms=(known?.forms||[...singular,pluralVerb,imperative,pluralVerb]).map(form=>/^[-—]+$/.test(form)?'':form);
  const feminine=clean(german.split('{{Weibliche Wortformen}}')[1]?.split(/\n\{\{/)[0]||'').replace(/^[:\s]+/,'');
  entries.push({german:word,english,type:noun?'noun':'verb',gender:noun&&['m','f','n'].includes(gender)?gender:'',plural:noun?all('Nominativ Plural'):'',feminine:noun?feminine:'',irregular:noun?'':known?'yes':/\{\{unreg\.\s*[|}]/.test(german)?'yes':regular||/te$/.test(values['Präteritum_ich']||'')?'no':'unknown',forms:noun?[]:forms,notes:'Source: https://de.wiktionary.org/wiki/'+encodeURIComponent(word)});
 }
 if(!entries.length&&english){const type=/\{\{Wortart\|Adjektiv\|Deutsch/.test(german)?'adjective':'other';entries.push({german:word,english,type,gender:'',plural:'',feminine:'',notes:'Source: https://de.wiktionary.org/wiki/'+encodeURIComponent(word)});}
 return entries;
}
export function germanDictionary(directory){
 const file=path.join(directory,'german-dictionary-cache.json');let cache={},writes=Promise.resolve();const pending=new Map();
 const ready=readFile(file,'utf8').then(s=>{cache=JSON.parse(s);}).catch(e=>{if(e.code!=='ENOENT')throw e;});
 const persist=()=>writes=writes.catch(()=>{}).then(async()=>{await writeFile(file+'.tmp',JSON.stringify(cache));await rename(file+'.tmp',file);});
 async function lookup(input){await ready;const word=input.trim().replace(/^(der|die|das)\s+/i,'');if(!word||word.length>100)throw Error('Enter a German word up to 100 characters.');if(Object.hasOwn(cache,word))return cache[word];if(pending.has(word))return pending.get(word);
  const task=(async()=>{const url=new URL('https://de.wiktionary.org/w/api.php');url.search=new URLSearchParams({action:'query',prop:'revisions',rvprop:'content',rvslots:'main',titles:word,redirects:'1',format:'json',formatversion:'2'});const r=await fetch(url,{headers:{'User-Agent':'WortStudyCompanion/1.0 (personal German study)'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Dictionary unavailable. Retry this word later.');const data=await r.json();if(data.error)throw Error('Dictionary could not process this word.');const page=data.query?.pages?.[0];const result={entries:parseGermanEntry(page?.revisions?.[0]?.slots?.main?.content||'',page?.title||word)};cache[word]=result;await persist();return result;})().finally(()=>pending.delete(word));pending.set(word,task);return task;
 }
 return {lookup,clear:async()=>{await ready;await Promise.allSettled([...pending.values()]);cache={};await persist();}};
}
