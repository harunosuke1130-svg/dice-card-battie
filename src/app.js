import {CARDS,RULES,AFFINITY,createGame,roll,setRoll,useCard,useSkill,skillReason,startTurn,healingFactor,living,cardAt,selectFront,replacementChoice,previewNormal,healChoice,actionChoice,cpuSkillChoice} from './game.js';
const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let team=[0,1,2,3,4],game=createGame(team),selected=null,logs=[],generation=0,advancing=false,inputLockedUntil=0;
game.phase='setup';
const side=actor=>actor==='player'?'あなた':'番人';
function memberInfo(actor,index){const c=cardAt(game,actor,index),m=game.members[actor][index];return `<div class="member-state">${m.hp<=0?'戦闘不能':game.front[actor]===index?'前衛':'控え'}${m.shield?' ・ 結界':''}</div><div class="attribute">${c.element}属性 · ${c.tags.join(' / ')}</div><div class="member-hp" data-hp="${actor}-${index}">${m.hp} / ${c.maxHp}</div><div class="health-track"><div style="width:${m.hp/c.maxHp*100}%"></div></div>`;}
function actions(c,number,actor=null,index=null){return c.actions.map((a,i)=>{let bonus='';if(actor&&i+1===number&&a.damage){const p=previewNormal(game,actor,index);bonus=`<small class="damage-preview">実効威力 ${p.damage}${p.multiplier>1?` · 属性有利 ×${p.multiplier}`:''}</small>`;}return `<div class="action-row ${number===i+1?'active':''}"><span class="number">${i+1}</span><span>${a.name}${bonus}</span><b>${a.damage?`${a.damage} 攻撃`:''}${a.damage&&a.heal?' / ':''}${a.heal?`${Math.floor(a.heal*healingFactor(game))} 回復`:''}${!a.damage&&!a.heal?'—':''}</b></div>`;}).join('');}
function skillPanel(i){const c=cardAt(game,'player',i),reason=skillReason(game,'player',i);return `<div class="skill-panel"><b>固有スキル · ${c.skill.name}</b><p>${c.skill.description}${c.skill.heal&&healingFactor(game)<1?`<br>現在の最大回復量：${Math.floor(c.skill.heal*healingFactor(game))}`:''}</p><small>待ち時間 ${c.skill.cooldown}ターン ／ 残り ${game.cooldowns.player[i]}ターン</small><button class="skill-button" data-skill="${i}" ${reason?'disabled':''}>${reason||'使用可能：スキルを使う'}</button></div>`;}
function render(){
 for(const el of document.querySelectorAll('[data-affinity-bonus]'))el.textContent=AFFINITY.bonus;
 document.body.classList.toggle('preparing',game.phase==='setup');$('team-setup').hidden=game.phase!=='setup';$('team-status').textContent=`${team.length} / ${RULES.handSize}体 選択中`;$('team-start').disabled=team.length!==RULES.handSize;
 for(const actor of ['player','cpu']){
  const index=game.front[actor],m=game.members[actor][index],c=m?cardAt(game,actor,index):null;
  $(`${actor}-name`).textContent=c?`${c.name} · 前衛`:'前衛を選択中';$(`${actor}-avatar`).textContent=c?.symbol??'✧';
  $(`${actor}-hp`).textContent=m?`${m.hp} / ${c.maxHp}`:'—';$(`${actor}-bar`).style.width=m?`${m.hp/c.maxHp*100}%`:'0%';
  const e=game.effects[actor];$(`${actor}-effects`).textContent=[`生存 ${living(game,actor).length} / 5体`,m?.shield?'前衛に結界':'',e.multiplier>1?'このターンの通常技の攻撃2倍':'',e.bonus?'このターンの通常技の攻撃＋10':'',healingFactor(game)<1?`回復疲労：${Math.round(healingFactor(game)*100)}％`:''].filter(Boolean).join(' ／ ');
 }
 const phases={setup:'戦闘前：5体を選択',opening:'最初の前衛を選択',roll:'① 数字を出す',rolling:'運命の数字を決めています',choose:'② 任意でスキル → ③ 出場キャラと通常技を選ぶ',cpuPending:'番人のターンへ',cpuRolling:'番人が数字を出しています',cpuChoose:'番人が出場キャラを選んでいます',playerPending:'あなたのターンへ',replacement:`${game.replacing==='player'?'あなた':'番人'}の後任を選択`,over:'決闘終了'};
 $('phase').textContent=phases[game.phase];$('turn').textContent=`第${game.turn}巡`;$('die').textContent=game.number??'?';$('die').classList.toggle('rolling',['rolling','cpuRolling'].includes(game.phase));
 $('roll').disabled=game.phase!=='roll';$('roll').textContent=game.phase==='over'?'決闘終了':game.phase==='choose'?'生存キャラから通常技を選ぼう':game.phase==='replacement'?'後任を選んでいます':'数字を出す ↗';
 $('arena-message').textContent=game.phase==='choose'?`「${game.number}」の通常技を使い、そのキャラが前衛に残ります`:'相手の前衛だけが攻撃対象になります';
 $('hand-hint').textContent=game.phase==='choose'?`「${game.number}」の行を比較。回復先は確定画面で選択`:'各キャラのHP・前衛・控えを確認';
 $('enemy-team').innerHTML=game.hands.cpu.map((id,i)=>{const c=CARDS[id],m=game.members.cpu[i];return `<article class="enemy-member ${game.front.cpu===i?'is-front':''} ${!m.hp?'is-ko':''}"><strong>${c.symbol} ${c.name}</strong>${memberInfo('cpu',i)}<small>スキル：${c.skill.name} ／ ${!m.hp?'戦闘不能':game.cooldowns.cpu[i]?`あと${game.cooldowns.cpu[i]}ターン`:'待ち時間なし'}</small></article>`;}).join('');
 $('hand').innerHTML=game.hands.player.map((id,i)=>{const c=CARDS[id],m=game.members.player[i],enabled=m.hp>0&&['roll','choose'].includes(game.phase);return `<article class="card ${c.color} ${game.front.player===i?'is-front':''} ${!m.hp?'is-ko':''}"><button class="character-select" data-index="${i}" ${enabled?'':'disabled'}><div class="card-top"><span>${c.type}</span><span>✧</span></div><div class="card-art">${c.symbol}<span class="art-orbit"></span></div><h3>${c.name}</h3>${memberInfo('player',i)}<div class="card-actions">${actions(c,game.phase==='choose'?game.number:null,'player',i)}</div><div class="card-bottom">${!m.hp?'戦闘不能：出場・スキル不可':'タップして出場と通常技を確認'}</div></button>${skillPanel(i)}</article>`;}).join('');
 $('log').innerHTML=logs.length?logs.slice(0,40).map(l=>`<li><span>${side(l.actor)}<small>${l.number?`出目 ${l.number}`:'交代'}</small></span><div><b>${l.message||`${l.kind==='skill'?'【固有スキル】':'【通常技】'}${l.card.name} · ${l.action.name}`}</b><p>${l.message?'攻撃・ターン消費なし':effectText(l)}</p></div></li>`).join(''):'<li class="empty-log">ここに、あなたと番人の戦いが刻まれます。</li>';
}
function effectText(a){return [a.damage?`${a.target}に${a.damage}ダメージ`:'',a.heal?`${a.healTarget}のHPを${a.heal}回復`:'',a.knockedOut?`${a.target}が戦闘不能`:'',a.note||''].filter(Boolean).join(' ／ ')||'何も起こらなかった';}
function record(a){if(!a)return false;logs.unshift(a);$('last-action').textContent=`${a.card.name}「${a.action.name}」 — ${effectText(a)}`;render();animate(a);return true;}
function animate(a){if(a.damage){const el=$(`${a.actor==='player'?'cpu':'player'}-float`);el.textContent=`−${a.damage}`;el.className='float damage';void el.offsetWidth;el.classList.add('animate');}if(a.heal){const el=document.querySelector(`[data-hp="${a.actor}-${a.healIndex}"]`);if(el){el.classList.remove('heal-pulse');void el.offsetWidth;el.classList.add('heal-pulse');}}}
function targetOptions(defaultIndex,shield=false){return living(game,'player').map(i=>{const m=game.members.player[i],c=cardAt(game,'player',i);return `<option value="${i}" ${i===defaultIndex?'selected':''} ${shield&&m.shield?'disabled':''}>${c.name}（${m.hp}/${c.maxHp}・${game.front.player===i?'前衛':'控え'}${m.shield?'・結界あり':''}）</option>`;}).join('');}
function detail(index){
 if(!game.members.player[index]?.hp)return;selected=index;const c=cardAt(game,'player',index),ready=game.phase==='choose',a=ready?c.actions[game.number-1]:null;
 $('card-detail').innerHTML=`<div class="detail-symbol ${c.color}">${c.symbol}</div><h2>${c.name}</h2>${memberInfo('player',index)}<p>${ready?`通常技を確定すると、このキャラが前衛に残り、次の敵の攻撃を受けます。攻撃対象：${cardAt(game,'cpu',game.front.cpu).name}`:'数字を先に確定してから出場キャラを選びます。'}</p><div class="detail-actions">${actions(c,ready?game.number:null,'player',index)}</div>${a?.heal?`<label class="target-label">回復対象（生存している味方1体）<select id="normal-target">${targetOptions(index)}</select></label>`:''}<div class="skill-detail"><b>固有スキル：${c.skill.name}</b><p>${c.skill.description}</p></div>`;
 $('use').disabled=!ready;$('use').textContent=ready?'このキャラで出場し、通常技を使う':'まず数字を出してください';$('card-dialog').showModal();
}
function openSkill(index){if(skillReason(game,'player',index))return;selected=index;const c=cardAt(game,'player',index),s=c.skill;
 let defaultIndex=s.shield?living(game,'player').find(i=>!game.members.player[i].shield):healChoice(game,'player');
 $('skill-detail').innerHTML=`<div class="eyebrow">固有スキル ／ ${c.name}</div><h2>${s.name}</h2><p>${s.description}</p><p>スキルだけでは前衛は交代しません。通常技の権利は残ります。</p>${s.heal||s.shield?`<label class="target-label">${s.shield?'結界を付ける対象':'回復対象'}（生存している味方1体）<select id="skill-target">${targetOptions(defaultIndex,s.shield)}</select></label>`:''}${s.heal&&healingFactor(game)<1?`<p>回復疲労適用後：最大${Math.floor(s.heal*healingFactor(game))}回復</p>`:''}${s.damage?`<p>攻撃対象：${cardAt(game,'cpu',game.front.cpu).name}（敵の前衛）</p>`:''}`;
 $('skill-use').disabled=s.shield&&defaultIndex===undefined;$('skill-dialog').showModal();
}
function frontDialog(){const opening=game.phase==='opening';$('front-title').textContent=opening?'最初の前衛を選ぶ':'戦闘不能になりました。後任を選ぶ';$('front-note').textContent='この選択では攻撃もターン消費も発生しません。';$('front-options').innerHTML=living(game,'player').map(i=>`<button class="front-option" data-front="${i}"><b>${cardAt(game,'player',i).symbol} ${cardAt(game,'player',i).name}</b>${memberInfo('player',i)}</button>`).join('');if(!$('front-dialog').open)$('front-dialog').showModal();}
async function advance(){
 if(advancing)return;advancing=true;const token=generation;
 try{while(token===generation){render();
  if(game.phase==='opening'||game.phase==='replacement'&&game.replacing==='player'){frontDialog();return;}
  if(game.phase==='replacement'){const actor=game.replacing,index=replacementChoice(game,actor);selectFront(game,actor,index);logs.unshift({actor,number:game.number,message:`${cardAt(game,actor,index).name}が後任の前衛に出場`});continue;}
  if(game.phase==='over'){await sleep(550);if(token!==generation)return;$('result-title').textContent=game.winner==='player'?'あなたの勝利':'番人の勝利';$('result-description').textContent='相手チームの5体すべてが戦闘不能になりました。';if(!$('result-dialog').open)$('result-dialog').showModal();return;}
  if(game.phase==='cpuPending'){await sleep(700);if(token!==generation)return;startTurn(game,'cpu');continue;}
  if(game.phase==='cpuRolling'){await sleep(600);if(token!==generation)return;setRoll(game,roll());continue;}
  if(game.phase==='cpuChoose'){await sleep(750);if(token!==generation)return;const s=cpuSkillChoice(game);if(s){record(useSkill(game,'cpu',s.index,s.targetIndex));}else{const a=actionChoice(game,'cpu');record(useCard(game,'cpu',a.index,a.healIndex));}continue;}
  if(game.phase==='playerPending'){await sleep(700);if(token!==generation)return;startTurn(game,'player');continue;}
  return;
 }}finally{advancing=false;}
}
$('roll').onclick=async()=>{if(game.phase!=='roll')return;const token=generation;game.phase='rolling';render();await sleep(650);if(token!==generation)return;setRoll(game,roll());render();};
$('hand').onclick=e=>{if(Date.now()<inputLockedUntil)return;const skill=e.target.closest('[data-skill]');if(skill){openSkill(Number(skill.dataset.skill));return;}const c=e.target.closest('[data-index]');if(c&&['roll','choose'].includes(game.phase))detail(Number(c.dataset.index));};
$('use').onclick=()=>{if(game.phase!=='choose'||selected===null)return;const index=selected,target=$('normal-target')?Number($('normal-target').value):index;const a=useCard(game,'player',index,target);if(!a)return;selected=null;$('card-dialog').close();record(a);advance();};
$('skill-use').onclick=()=>{if(selected===null)return;const index=selected,target=$('skill-target')?Number($('skill-target').value):index,a=useSkill(game,'player',index,target);if(!a)return;selected=null;inputLockedUntil=Date.now()+250;$('skill-dialog').close();record(a);advance();};
$('front-options').onclick=e=>{const b=e.target.closest('[data-front]');if(!b)return;const index=Number(b.dataset.front);if(!selectFront(game,'player',index))return;$('front-dialog').close();logs.unshift({actor:'player',number:game.number,message:`${cardAt(game,'player',index).name}が前衛に出場`});render();advance();};
$('front-dialog').addEventListener('cancel',e=>e.preventDefault());
$('rules-button').onclick=()=>$('rules-dialog').showModal();for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
function renderTeam(){ $('team-options').innerHTML=CARDS.map((c,i)=>`<label class="team-option ${c.color}"><input type="checkbox" data-team="${i}" ${team.includes(i)?'checked':''}><span class="team-symbol">${c.symbol}</span><b>${c.name}</b><span>最大HP ${c.maxHp} ／ ${c.element}属性</span><span>${c.tags.join(' / ')}</span><small>固有スキル：${c.skill.name}（${c.skill.cooldown}ターン）</small><p>${c.skill.description}</p><div class="team-actions">${actions(c,null)}</div></label>`).join('');render();}
$('team-options').onchange=e=>{const id=Number(e.target.dataset.team);if(e.target.checked){if(team.length===RULES.handSize){e.target.checked=false;$('team-status').textContent='先に1体の選択を外してください';return;}team.push(id);}else team=team.filter(n=>n!==id);render();};
$('team-start').onclick=()=>{if(team.length!==RULES.handSize||game.phase!=='setup')return;game=createGame(team);logs=[];selected=null;$('last-action').textContent='最初の前衛を選んで決闘を始めよう。';render();advance();};
$('restart').onclick=()=>{generation++;game=createGame(team);game.phase='setup';logs=[];selected=null;$('result-dialog').close();$('last-action').textContent='チームを選んで、新たな決闘へ。';renderTeam();$('team-setup').scrollIntoView({block:'start'});};
$('review').onclick=()=>{$('result-dialog').close();$('last-action').innerHTML='<button id="open-result" class="quiet">結果を見る・もう一度遊ぶ ↗</button>';$('open-result').onclick=()=>$('result-dialog').showModal();};
renderTeam();
