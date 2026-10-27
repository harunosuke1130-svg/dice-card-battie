const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.context().setOffline(true);
const raw=await readFile(new URL('../docs/index.html',import.meta.url),'utf8');
const html=raw.replace('<script>','<script>window.__originalTimeout??=window.setTimeout;window.setTimeout=(fn,ms,...args)=>window.__originalTimeout(fn,ms/25,...args);').replace('\nrenderTeam();\n','\nwindow.__test={get game(){return game;},render};\nrenderTeam();\n');
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
async function open(){await page.setContent(html);await page.locator('#team-start').click();assert(await page.locator('#front-dialog').isVisible(),'開始前の前衛選択');await page.locator('[data-front="0"]').click();assert(await page.locator('#roll').isEnabled(),'初期前衛確定で開始');}
async function roll(){await page.locator('#roll').click();await page.waitForTimeout(70);}
async function normal(index){await page.locator(`[data-index="${index}"]`).click();await page.locator('#use').click();await page.waitForTimeout(250);}
async function chooseReplacement(){if(await page.locator('#front-dialog').isVisible())await page.locator('[data-front]').first().click();await page.waitForTimeout(250);}
await open();assert(await page.locator('#enemy-team .enemy-member').count()===5,'敵5体のHP公開');
assert(await page.locator('.skill-button:enabled').count()===0,'出目前のスキル禁止');await roll();
assert(await page.locator('.card .active').count()===5,'出目強調');const n=await page.locator('#die').textContent();await page.locator('[data-index="1"]').click();await page.locator('[data-close="card-dialog"]').click();assert(await page.locator('#die').textContent()===n,'選び直しで数字固定');
// Recover an injured reserve, without switching the front.
await page.evaluate(()=>{window.__test.game.members.player[2].hp=30;window.__test.render();});
await page.locator('[data-skill="1"]').click();await page.locator('#skill-target').selectOption('2');await page.locator('#skill-use').dblclick();await page.waitForTimeout(300);
assert(await page.evaluate(()=>window.__test.game.members.player[2].hp)===65,'指定した控えに35回復・連打は一回');assert(await page.evaluate(()=>window.__test.game.front.player)===0,'スキルで交代しない');assert(await page.locator('.skill-button:enabled').count()===0,'チーム全体一回');
await normal(3);await chooseReplacement();assert(await page.evaluate(()=>window.__test.game.front.player)===3,'攻撃役が前衛に残る');
assert(await page.evaluate(()=>window.__test.game.members.player[2].hp)===65,'控えへの通常攻撃なし');
await page.screenshot({path:'/tmp/rokuyo-individual-mobile.png',fullPage:true});
// Skill knockout and replacement preserve the number and normal action right.
await open();await roll();await page.evaluate(()=>{const g=window.__test.game;g.members.cpu[g.front.cpu].hp=10;window.__test.render();});const before=await page.locator('#die').textContent();await page.locator('[data-skill="4"]').click();await page.locator('#skill-use').click();await page.waitForTimeout(300);
assert(await page.evaluate(()=>window.__test.game.phase)==='choose','CPU後任自動選択後も通常技選択');assert(await page.locator('#die').textContent()===before,'後任選択後も数字維持');assert((await page.locator('#log').textContent()).includes('戦闘不能'),'KOログ');
// CPU skill knockout pauses for human replacement, then continues without consuming a player turn.
await open();await roll();await page.evaluate(()=>{const g=window.__test.game;for(const m of g.members.player)m.hp=5;window.__test.render();});await normal(0);await chooseReplacement();
// Finish the entire battle through real UI controls, handling forced switches.
for(let i=0;i<300;i++){
 if(await page.locator('#result-dialog').isVisible())break;
 if(await page.locator('#front-dialog').isVisible()){await chooseReplacement();continue;}
 const phase=await page.evaluate(()=>window.__test.game.phase);
 if(phase==='over'){await page.waitForTimeout(80);continue;}
 if(phase!=='roll'){await page.waitForTimeout(120);continue;}
 await roll();
 const skill=page.locator('.skill-button:enabled');
 if(await skill.count()){
  await skill.first().click();if(await page.locator('#skill-use').isEnabled()){await page.locator('#skill-use').click();await page.waitForTimeout(300);}else await page.locator('[data-close="skill-dialog"]').click();await page.waitForTimeout(70);
 }
 if(await page.evaluate(()=>window.__test.game.phase)!=='choose')continue;
 const index=await page.locator('.card').evaluateAll(cards=>cards.map((c,i)=>({i,alive:!c.classList.contains('is-ko'),damage:Number(c.querySelector('.damage-preview')?.textContent.match(/\d+/)?.[0]||0)})).filter(c=>c.alive).sort((a,b)=>b.damage-a.damage)[0].i);
 await normal(index);
}
assert(await page.locator('#result-dialog').isVisible(),'全滅で結果表示');assert(await page.locator('.skill-button:enabled').count()===0,'戦闘後操作不可');
await page.locator('#restart').click();await page.locator('#team-start').click();await page.locator('[data-front="0"]').click();
assert(await page.evaluate(()=>['player','cpu'].every(a=>window.__test.game.members[a].every((m,i)=>m.hp>0&&!m.shield)&&window.__test.game.cooldowns[a].every(c=>c===0))),'再戦HP・盾・CD初期化');
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'スマホ横はみ出しなし');
await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'/tmp/rokuyo-individual-desktop.png',fullPage:true});
assert(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor)==='rgb(16, 27, 36)','デザインの背景維持');
await open();
for(let i=0;i<300;i++){
 if(await page.locator('#result-dialog').isVisible())break;
 if(await page.locator('#front-dialog').isVisible()){await chooseReplacement();continue;}
 const phase=await page.evaluate(()=>window.__test.game.phase);
 if(phase==='over'){await page.waitForTimeout(80);continue;}
 if(phase!=='roll'){await page.waitForTimeout(120);continue;}
 await roll();
 const skill=page.locator('.skill-button:enabled');
 if(await skill.count()){
  await skill.first().click();if(await page.locator('#skill-use').isEnabled()){await page.locator('#skill-use').click();await page.waitForTimeout(300);}else await page.locator('[data-close="skill-dialog"]').click();await page.waitForTimeout(70);
 }
 if(await page.evaluate(()=>window.__test.game.phase)!=='choose')continue;
 const index=await page.locator('.card').evaluateAll(cards=>cards.map((c,i)=>({i,alive:!c.classList.contains('is-ko'),damage:Number(c.querySelector('.damage-preview')?.textContent.match(/\d+/)?.[0]||0)})).filter(c=>c.alive).sort((a,b)=>b.damage-a.damage)[0].i);
 await normal(index);
}
assert(await page.locator('#result-dialog').isVisible(),'HPを変更しない通常の1戦も完走');
assert(errors.length===0,errors.join('\n'));assert(requests.length===0,'外部通信なし');console.log('個別HP版：初期前衛・対象回復・連打制限・前衛交代・控えHP保持・スキルKOと後任・全滅決着・再戦・スマホ/PC表示：成功。通信0、JSエラー0。');await browser.close();
