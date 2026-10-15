export function normalizeExportOptions(input={}){
 const options={direction:'forward',language:'both',shuffle:true,examples:true,notes:false,deck:'Wort::German',...input};
 if(!['forward','reverse','both'].includes(options.direction)||!['english','arabic','both'].includes(options.language))throw Error('Invalid export options.');
 for(const key of ['shuffle','examples','notes']){
  if(![true,false,'true','false'].includes(options[key]))throw Error('Invalid '+key+' option.');
  options[key]=options[key]===true||options[key]==='true';
 }
 options.deck=String(options.deck).trim();
 if(!options.deck||options.deck.length>80||/[\x00-\x1f<>]/.test(options.deck)||options.deck.split('::').some(s=>!s.trim()))throw Error('Use a deck name of 1–80 characters, with nonempty sections.');
 return options;
}
export function planExport(words,input={}){
 const options=normalizeExportOptions(input),search=String(options.search||'').trim().toLocaleLowerCase();
 const scope=words.filter(w=>(!options.lesson||w.lessonId===options.lesson)&&(!options.type||w.type===options.type)&&(!search||[w.german,w.english,w.arabic,w.tags,w.example].join(' ').toLocaleLowerCase().includes(search)));
 const translated=w=>options.language==='english'?String(w.english||'').trim():options.language==='arabic'?String(w.arabic||'').trim():(String(w.english||'').trim()||String(w.arabic||'').trim());
 const included=scope.filter(w=>String(w.german||'').trim()&&translated(w));
 const includedSet=new Set(included),skipped=scope.filter(w=>!includedSet.has(w));
 const cards=included.flatMap(word=>options.direction==='both'?[{word,direction:'forward'},{word,direction:'reverse'}]:[{word,direction:options.direction}]);
 return {options,scope,included,skipped,cards};
}
export function shuffleCards(cards,random=Math.random){
 const result=cards.slice();for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
}
