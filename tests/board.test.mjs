import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boardColors,boardNumbers,introductionPatterns,regularVerbs} from '../public/board.js';
import {irregularExamples,lookupWord,lessonSpeech,weekOne} from '../public/course.js';
import {weekOneGuide} from '../public/lesson.js';
import {seed} from '../domain.mjs';
import {migrateStudy} from '../migration.mjs';
test('class board is represented in vocabulary, conjugations and lesson text',()=>{
 assert.equal(boardColors.length,10);assert.deepEqual(boardNumbers,[24,59,76,21,245]);
 for(const verb of ['sprechen','lesen','sein','haben','sehen'])assert.ok(irregularExamples.find(v=>v.infinitive===verb));
 assert.equal(irregularExamples.find(v=>v.infinitive==='sehen').forms[1],'siehst');
 assert.equal(regularVerbs.find(v=>v.infinitive==='arbeiten').forms[4],'arbeitet');
 assert.equal(lookupWord('hell').english,'light / bright');assert.equal(lookupWord('Vorname').german,'der Vorname');
 const html=weekOneGuide();for(const phrase of ['Grüß Gott','Auf Wiederhören','Wie alt sind Sie?','Wer bist du?','aus dem Jemen','hell × dunkel','zweihundertfünfundvierzig','arbeiten','Words used on the board'])assert.ok(html.includes(phrase),phrase);
 assert.equal(introductionPatterns.length,4);assert.ok(lessonSpeech['greeting-0']);assert.ok(lessonSpeech['regular-arbeiten']);assert.ok(!/starter examples|teacher-specific details|replace or extend/i.test(html));assert.equal(weekOne.notes,'');
});
test('board migration clears only generated note prompts and preserves personal notes',()=>{
 const s=migrateStudy(seed());s.migrations=s.migrations.filter(v=>v!=='week-1-board-v1');s.lessons[0].notes='Use these notes for examples or corrections from your teacher. The structured Week 1 guide is above.';
 migrateStudy(s);assert.equal(s.lessons[0].notes,'');assert.equal(s.lessons[0].contentRevision,'board-v1');
 s.migrations=s.migrations.filter(v=>v!=='week-1-board-v1');s.lessons[0].notes='My own mnemonic';migrateStudy(s);assert.equal(s.lessons[0].notes,'My own mnemonic');
});
