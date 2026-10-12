import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {exportAnki} from './domain.mjs';
// Legacy Anki package: SQLite collection plus a media manifest in a ZIP archive.
// Format references: docs.ankiweb.net and github.com/kerrickstaley/genanki.
function crc32(buf){let crc=0xffffffff;for(const byte of buf){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
export function zipStore(entries){const locals=[],central=[];let offset=0;for(const [name,value] of entries){const data=Buffer.from(value),filename=Buffer.from(name),crc=crc32(data);const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(filename.length,26);locals.push(local,filename,data);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(filename.length,28);c.writeUInt32LE(offset,42);central.push(c,filename);offset+=local.length+filename.length+data.length;}const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(central.reduce((s,b)=>s+b.length,0),12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,...central,end]);}
export async function exportPackage(words,options){
 options={direction:'forward',language:'both',...options};
 const rows=exportAnki(words,options).split('\n').filter(r=>r&&!r.startsWith('#')).map(r=>r.split('\t'));
 const sources=words.filter(w=>options.language==='english'?w.english:options.language==='arabic'?w.arabic:(w.english||w.arabic)).flatMap(w=>options.direction==='both'?[[w,'forward'],[w,'reverse']]:[[w,options.direction]]);
 const temp=await mkdtemp(path.join(tmpdir(),'wort-anki-'));let db;
 try{const dbPath=path.join(temp,'collection.anki2');db=new DatabaseSync(dbPath);
 const schema={col:'id integer primary key,crt integer,mod integer,scm integer,ver integer,dty integer,usn integer,ls integer,conf text,models text,decks text,dconf text,tags text',notes:'id integer primary key,guid text,mid integer,mod integer,usn integer,tags text,flds text,sfld integer,csum integer,flags integer,data text',cards:'id integer primary key,nid integer,did integer,ord integer,mod integer,usn integer,type integer,queue integer,due integer,ivl integer,factor integer,reps integer,lapses integer,left integer,odue integer,odid integer,flags integer,data text',revlog:'id integer primary key,cid integer,usn integer,ease integer,ivl integer,lastIvl integer,factor integer,time integer,type integer',graves:'usn integer,oid integer,type integer'};
 for(const [table,columns]of Object.entries(schema))db.exec(`CREATE TABLE ${table} (${columns})`);
 for(const [table,columns]of [['notes','usn'],['notes','csum'],['cards','usn'],['cards','nid'],['cards','did,queue,due'],['revlog','usn'],['revlog','cid']])db.exec(`CREATE INDEX ix_${table}_${columns.replaceAll(',','_')} ON ${table} (${columns})`);
 const timestamp=Date.now(),seconds=Math.floor(timestamp/1000),did=1876210001,mid=1876210002;
 const model={id:String(mid),name:'Wort bilingual',type:0,mod:seconds,usn:-1,sortf:0,did,tmpls:[{name:'Recall',ord:0,qfmt:'<div dir="auto">{{Front}}</div>',afmt:'{{FrontSide}}<hr id="answer"><div dir="auto">{{Back}}</div>',bqfmt:'',bafmt:'',bfont:'',bsize:0,did:null}],flds:['Front','Back'].map((name,ord)=>({name,ord,sticky:false,rtl:false,font:'Arial',size:24,media:[]})),css:'.card { font-family: Arial; font-size: 26px; text-align: center; color: #222b25; background: #f5f6f3; line-height:1.7; padding:24px; } small { font-size:18px; } .nightMode.card {color:#eee;background:#222b25;}',latexPre:'',latexPost:'',latexsvg:false,req:[[0,'all',[0]]],tags:[],vers:[]};
 const deck={id:did,name:'Wort::German',desc:'Your personal German vocabulary',mod:seconds,usn:-1,dyn:0,collapsed:false,conf:1,extendNew:0,extendRev:0,newToday:[0,0],revToday:[0,0],lrnToday:[0,0],timeToday:[0,0]};
 db.prepare('INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(1,seconds,timestamp,timestamp,11,0,0,0,'{}',JSON.stringify({[mid]:model}),JSON.stringify({[did]:deck}),'{}','{}');
 const note=db.prepare('INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)'),card=db.prepare('INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 rows.forEach(([front,back,tags],i)=>{const id=timestamp+i,[source,direction]=sources[i],hash=createHash('sha1').update((source.id||source.german)+'\0'+direction+'\0'+options.language).digest('hex');note.run(id,hash.slice(0,20),mid,seconds,-1,' '+tags+' ',front+'\x1f'+back,front,parseInt(createHash('sha1').update(front.replace(/<[^>]*>/g,'')).digest('hex').slice(0,8),16),0,'');card.run(id,id,did,0,seconds,-1,0,0,i+1,0,2500,0,0,0,0,0,0,'');});
 db.close();db=null;return zipStore([['collection.anki2',await readFile(dbPath)],['media','{}']]);
 }finally{db?.close();await rm(temp,{recursive:true,force:true});}
}
