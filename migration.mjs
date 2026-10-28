import {weekOne} from './public/course.js';
export function migrateStudy(state){
 state.verbs??=[];state.courseProgress??={};state.migrations??=[];state.practiceActivity??={};state.verbDrillActivity??={};state.practiceSessions??={};state.episuiteOutbox??=[];
 for(const word of state.words){word.gender??=({der:'m',die:'f',das:'n'}[(word.german||'').match(/^(der|die|das)\s/i)?.[1]?.toLowerCase()]||'');word.plural??='';word.image??='';}
 for(const lesson of state.lessons)if(lesson.courseId==='week-1'&&lesson.notes==='Your Week 1 study guide is below. Use these notes for examples or corrections from your teacher.')lesson.notes=weekOne.notes;
 if(!state.migrations.includes('week-1-v1')){
  const starter=state.lessons.find(l=>l.id==='starter'&&l.title==='The first conversation'&&l.summary.startsWith('Example material')&&l.notes.startsWith('STARTER EXAMPLES'));
  if(starter){Object.assign(starter,{...weekOne,id:'starter'});}else if(!state.lessons.some(l=>l.courseId==='week-1'))state.lessons.push(structuredClone(weekOne));
  state.migrations.push('week-1-v1');
 }
 if(!state.migrations.includes('week-1-board-v1')){
  const placeholders=new Set(['Your Week 1 study guide is below. Use these notes for examples or corrections from your teacher.','Use these notes for examples or corrections from your teacher. The structured Week 1 guide is above.']);
  for(const lesson of state.lessons)if(lesson.courseId==='week-1'){if(placeholders.has(lesson.notes))lesson.notes='';lesson.summary=weekOne.summary;lesson.contentRevision=weekOne.contentRevision;}
  state.migrations.push('week-1-board-v1');
 }
 return state;
}
