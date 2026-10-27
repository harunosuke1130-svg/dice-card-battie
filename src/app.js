import {CARDS,RULES,createGame,roll,setRoll,useCard,cpuChoice,useSkill,skillReason,startTurn,cpuSkillChoice,healingFactor} from './game.js';
const $=id=>document.getElementById(id);
let game=createGame(),selected=null,logs=[],generation=0,team=[0,1,2,3,4];
game.phase="setup";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function actions(card,number){return card.actions.map((a,i)=>`<div class="action-row ${number===i+1?'active':''}"><span class="number">${i+1}</span><span>${a.name}</span><b>${a.damage?`${a.damage} 攻撃`:''}${a.damage&&a.heal?' / ':''}${a.heal?`${Math.floor(a.heal*healingFactor(game))} 回復`:''}${!a.damage&&!a.heal?'—':''}</b></div>`).join('');}
function render(){
 document.body.classList.toggle('preparing',game.phase==='setup');
 for(const actor of ['player','cpu']){$(`${actor}-hp`).innerHTML=`${game.hp[actor]} <span>/ ${RULES.maxHp}</span>`;$(`${actor}-bar`).style.width=`${game.hp[actor]/RULES.maxHp*100}%`;}
 const phaseText={setup:'戦闘前：5体を選択',roll:'① 数字を出す',rolling:'運命の数字を決めています',choose:'② 任意でスキル → ③ 通常技を選ぶ',cpuPending:'③ CPUのターン',cpuRolling:'③ CPUが数字を出しています',cpuChoose:'③ CPUがカードを選んでいます',playerPending:'あなたのターンへ',over:'決闘終了'};
 $('phase').textContent=phaseText[game.phase];$('turn').textContent=`第${game.turn}巡`;
 $('die').textContent=game.number??'?';$('die').classList.toggle('rolling',game.phase==='rolling'||game.phase==='cpuRolling');
 $('roll').disabled=game.phase!=='roll';$('roll').textContent=game.phase==='over'?'決闘終了':game.phase==='choose'?'チームから通常技を選ぼう':game.phase.startsWith('cpu')?'相手が思考中…':'数字を出す ↗';
 $('arena-message').textContent=game.phase==='choose'?`「${game.number}」の行動が発動します`:game.phase==='roll'?'数字を見てから、カードを選択':game.phase==='over'?'選択が、運命を決めた。':'相手の一手を見届けよう';
 $('player-effects').textContent=effectStatus('player');$('cpu-effects').textContent=effectStatus('cpu');
 $('hand-hint').textContent=game.phase==='choose'?`「${game.number}」の行を比べて選ぼう`:'キャラクターをタップして詳細を確認';
 $('team-status').textContent=`${team.length} / ${RULES.handSize}体 選択中`;
 $('team-start').disabled=team.length!==RULES.handSize;
 $('team-setup').hidden=game.phase!=='setup';
 $('hand').innerHTML=game.hands.player.map((id,i)=>{const c=CARDS[id];return `<article class="card ${c.color}"><button class="character-select" data-index="${i}" ${!['roll','choose'].includes(game.phase)?'disabled':''}><div class="card-top"><span>${c.type}</span><span>✧</span></div><div class="card-art">${c.symbol}<span class="art-orbit"></span></div><h3>${c.name}</h3><div class="card-actions">${actions(c,game.phase==='choose'?game.number:null)}</div><div class="card-bottom">${game.phase==='choose'?'タップして通常技を確認':'タップして詳細を見る'}</div></button>${skillPanel(i)}</article>`;}).join('');
 $('log').innerHTML=logs.length?logs.slice(0,12).map(l=>`<li><span>${l.actor==='player'?'あなた':'番人'}<small>出目 ${l.number}</small></span><div><b>${l.kind==='skill'?'【固有スキル】':'【通常技】'}${l.card.name} · ${l.action.name}</b><p>${effect(l)}${l.note?` ／ ${l.note}`:''}</p></div></li>`).join(''):'<li class="empty-log">ここに、あなたと番人の戦いが刻まれます。</li>';
}
function effect(a){return [a.damage?`${a.actor==='player'?'番人':'あなた'}に${a.damage}ダメージ`:'',a.heal?`体力を${a.heal}回復`:''].filter(Boolean).join('、')||'何も起こらなかった';}
function detail(index){selected=index;const c=CARDS[game.hands.player[index]];const ready=game.phase==='choose';$('card-detail').innerHTML=`<div class="detail-symbol ${c.color}">${c.symbol}</div><div class="eyebrow">${c.type}</div><h2>${c.name}</h2><p>${ready?`今回の数字は「${game.number}」。強調された行動が発動します。`:'数字を出してから、使用するカードを選びます。'}</p><div class="detail-actions">${actions(c,ready?game.number:null)}</div><div class="skill-detail"><b>固有スキル：${c.skill.name}</b><p>${c.skill.description}</p><p>待ち時間${c.skill.cooldown}ターン ／ ${skillReason(game,'player',index)||'使用可能'}</p></div>`;$('use').disabled=!ready;$('use').textContent=ready?'このキャラクターで通常技を使う':'まず数字を出してください';$('card-dialog').showModal();}
function animate(a){for(const [actor,value] of [[a.actor==='player'?'cpu':'player',a.damage?`−${a.damage}`:''],[a.actor,a.heal?`＋${a.heal}`:'']]){if(!value)continue;const el=$(`${actor}-float`);el.textContent=value;el.className=`float ${value.startsWith('＋')?'healing':'damage'}`;void el.offsetWidth;el.classList.add('animate');} }
function apply(actor,index){const a=useCard(game,actor,index);if(!a)return false;logs.unshift(a);$('last-action').textContent=`${a.card.name}「${a.action.name}」 — ${effect(a)}`;render();animate(a);return true;}
async function finish(token){if(game.winner){await sleep(650);if(token!==generation)return;$('result-title').textContent=game.winner==='player'?'あなたの勝利':'番人の勝利';$('result-description').textContent=game.winner==='player'?'運命を読み切った、見事な決闘でした。':'次の数字には、新しい勝ち筋が待っています。';$('result-dialog').showModal();}}
$('roll').onclick=async()=>{if(game.phase!=='roll')return;const token=generation;game.phase='rolling';render();await sleep(650);if(token!==generation)return;setRoll(game,roll());render();};
function effectStatus(actor){const e=game.effects[actor];return [healingFactor(game)<1?`回復疲労：回復量${Math.round(healingFactor(game)*100)}％`:'',e.shield?'結界：次のダメージを半減':'',e.multiplier>1?'通常技の攻撃2倍':'',e.bonus?'通常技の攻撃＋10':''].filter(Boolean).join(' ／ ');}
function skillPanel(i){const c=CARDS[game.hands.player[i]],reason=skillReason(game,'player',i);return `<div class="skill-panel"><b>固有スキル · ${c.skill.name}</b><p>${c.skill.description}${c.skill.heal&&healingFactor(game)<1?`<br>回復疲労適用後：${Math.floor(c.skill.heal*healingFactor(game))}回復`:""}</p><small>待ち時間 ${c.skill.cooldown}ターン ／ 残り ${game.cooldowns.player[i]}ターン</small><button class="skill-button" data-skill="${i}" ${reason?'disabled':''}>${reason||'使用可能：スキルを使う'}</button></div>`;}
function record(a){logs.unshift(a);$('last-action').textContent=`${a.card.name}「${a.action.name}」 — ${effect(a)}${a.note?' ／ '+a.note:''}`;render();animate(a);}
$('hand').onclick=e=>{const skill=e.target.closest('[data-skill]');if(skill){const a=useSkill(game,'player',Number(skill.dataset.skill));if(a){record(a);if(game.winner)finish(generation);}return;}const card=e.target.closest('[data-index]');if(card&&['roll','choose'].includes(game.phase))detail(Number(card.dataset.index));};
$('use').onclick=async()=>{if(game.phase!=='choose'||selected===null)return;const index=selected;selected=null;$('card-dialog').close();const token=generation;if(!apply('player',index))return;if(game.winner){finish(token);return;}
 await sleep(900);if(token!==generation)return;startTurn(game,'cpu');render();await sleep(650);if(token!==generation)return;setRoll(game,roll());render();await sleep(700);if(token!==generation)return;
 const skillIndex=cpuSkillChoice(game);if(skillIndex>=0){const a=useSkill(game,'cpu',skillIndex);if(a)record(a);if(game.winner){finish(token);return;}await sleep(850);if(token!==generation)return;}
 apply('cpu',cpuChoice(game));if(game.winner){finish(token);return;}await sleep(1000);if(token!==generation)return;startTurn(game,'player');render();};
$('rules-button').onclick=()=>$('rules-dialog').showModal();
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>$(button.dataset.close).close();
function renderTeam(){ $('team-options').innerHTML=CARDS.map((c,i)=>`<label class="team-option ${c.color}"><input type="checkbox" data-team="${i}" ${team.includes(i)?'checked':''}><span class="team-symbol">${c.symbol}</span><b>${c.name}</b><span>${c.type}</span><small>固有スキル：${c.skill.name}（${c.skill.cooldown}ターン）</small><p>${c.skill.description}</p><div class="team-actions">${actions(c,null)}</div></label>`).join('');render();}
$('team-options').onchange=e=>{const id=Number(e.target.dataset.team);if(e.target.checked){if(team.length===RULES.handSize){e.target.checked=false;$('team-status').textContent='先に1体の選択を外してください';return;}team.push(id);}else team=team.filter(n=>n!==id);render();};
$('team-start').onclick=()=>{if(team.length!==RULES.handSize||game.phase!=='setup')return;game=createGame(team);logs=[];selected=null;$('last-action').textContent='固定チームで決闘開始。最初の数字を出そう。';render();$('roll').scrollIntoView({block:'center',behavior:'smooth'});};
$('restart').onclick=()=>{generation++;game=createGame(team);game.phase='setup';logs=[];selected=null;$('result-dialog').close();$('last-action').textContent='チームを選んで、新たな決闘へ。';renderTeam();$('team-setup').scrollIntoView({block:'start'});};
$('review').onclick=()=>{$('result-dialog').close();$('last-action').innerHTML='<button id="open-result" class="quiet">結果を見る・もう一度遊ぶ ↗</button>';$('open-result').onclick=()=>$('result-dialog').showModal();};
renderTeam();
