import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shortcutAction} from '../public/shortcuts.js';
const event=(key,extra={})=>({key,target:{closest:()=>null},...extra});
test('shortcuts avoid typing, IME, repeats and native browser commands',()=>{
 const field={closest:selector=>selector.startsWith('input')?{}:null};
 for(const key of ['n','e','p','d','?','ArrowRight'])assert.equal(shortcutAction(event(key,{target:field}),{view:'export',exportReady:true}),null);
 assert.equal(shortcutAction(event('n',{ctrlKey:true}),{view:'words'}),null);assert.equal(shortcutAction(event('n',{repeat:true}),{view:'words'}),null);assert.equal(shortcutAction(event('n',{isComposing:true}),{view:'words'}),null);
});
test('context shortcuts match export readiness, review state and dialog actions',()=>{
 assert.equal(shortcutAction(event('d'),{view:'export',exportReady:true}),'download');assert.equal(shortcutAction(event('d'),{view:'export',exportReady:false}),null);
 assert.equal(shortcutAction(event('Enter',{ctrlKey:true}),{view:'export',exportReady:true}),'download');assert.equal(shortcutAction(event(' '),{view:'export',exportCards:2}),'flip');
 assert.equal(shortcutAction(event('1'),{view:'practice',practice:{revealed:false}}),null);assert.equal(shortcutAction(event('2'),{view:'practice',practice:{revealed:true}}),'rate-good');
 assert.equal(shortcutAction(event('Enter',{metaKey:true}),{view:'words',dialog:true}),'save-dialog');assert.equal(shortcutAction(event('n'),{view:'words',dialog:true}),null);
 assert.equal(shortcutAction(event('Escape'),{view:'words',help:true}),'close-help');assert.equal(shortcutAction(event('4'),{view:'lesson/starter'}),'topic-numbers');
});
