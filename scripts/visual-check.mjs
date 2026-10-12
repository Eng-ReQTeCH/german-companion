import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire('C:/Users/Monty/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
await mkdir('test-results/redesign',{recursive:true});
const errors=[];
try{
 for(const width of [1440,768,390]){
  for(const route of ['home','words','lessons','practice','export','settings']){
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:3000/#'+route);await page.waitForFunction(()=>document.querySelector('#status').textContent==='Saved on your server');
   await page.screenshot({path:`test-results/redesign/${route}-${width}.png`,fullPage:true});
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`${route} overflows at ${width}px`);
   if(route==='words'){await page.getByRole('button',{name:'+ Add a word',exact:true}).click();await page.screenshot({path:`test-results/redesign/dialog-${width}.png`,fullPage:true});const overflow=await page.locator('dialog').evaluate(d=>d.getBoundingClientRect().right>innerWidth);if(overflow)throw Error('Dialog overflows');}
   await page.close();
  }
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log('All six screens and vocabulary dialogs passed at desktop, tablet and phone widths. No page overflow or JavaScript errors.');
}finally{await browser.close();}
