export const RULES = { handSize: 5, normalHealScale: 1.3, fatigueStart: 16, fatigueStep: .1, minimumHealFactor: .25 };
const hit = (name, damage = 0, heal = 0) => ({ name, damage, heal: Math.round(heal * RULES.normalHealScale) });
export const CARDS = [
  {name:'燎原の剣士', symbol:'⚔', color:'ember', type:'烈火 / 攻撃', actions:[hit('火花',8),hit('斬り払い',14),hit('紅蓮の一閃',32),hit('息を整える',0,15),hit('炎の輪',22),hit('燃え尽きる刃',38)]},
  {name:'月泉の巫女', symbol:'☾', color:'moon', type:'月光 / 回復', actions:[hit('泉の祝福',0,30),hit('月のしずく',10,10),hit('祈り',0,20),hit('満月の光',24,12),hit('静かな夜',0,8),hit('月光弾',16)]},
  {name:'逆風の射手', symbol:'➶', color:'wind', type:'疾風 / 逆転', actions:[hit('風穿ち',40),hit('双連矢',28),hit('牽制射撃',12),hit('矢をつがえる'),hit('追い風',8,8),hit('風待ち',0,5)]},
  {name:'琥珀の守人', symbol:'⬡', color:'gold', type:'大地 / 安定', actions:[hit('岩の拳',18),hit('琥珀の槍',18),hit('大地の鼓動',18),hit('石の刃',18),hit('守人の息吹',10,15),hit('地鳴り',18)]},
  {name:'宵闇の魔術師', symbol:'✧', color:'moon', type:'星影 / 奇襲', actions:[hit('影のささやき',5),hit('星喰い',36),hit('夜の帳',0,12),hit('虚空の渦',34),hit('魔力切れ'),hit('影の針',14)]},
  {name:'翠樹の薬師', symbol:'❀', color:'wind', type:'新緑 / 再生', actions:[hit('若葉の薬',0,18),hit('棘の種',16),hit('生命の実',0,35),hit('癒しの蔓',12,12),hit('森の目覚め',26,8),hit('木漏れ日',0,10)]},
  {name:'雷鳴の渡り鳥', symbol:'ϟ', color:'gold', type:'雷光 / 強襲', actions:[hit('羽ばたき',12),hit('雷の羽',20),hit('稲妻落とし',28),hit('天雷',42),hit('ひと休み',0,10),hit('帯電',4)]},
  {name:'霧海の旅人', symbol:'≋', color:'tide', type:'霧海 / 均衡', actions:[hit('潮の剣',22),hit('霧の休息',0,24),hit('波の刃',20),hit('返し波',16,8),hit('深海の渦',34),hit('凪の呼吸',10,18)]},
];
// 固有スキルの数値・説明はこの一覧で編集できます。
const SKILLS = [
 {name:'紅蓮の誓い',description:'このターンの通常技の攻撃だけを2倍にする。',cooldown:4,multiplier:2},
 {name:'月泉の祝福',description:'生存している味方1体を選び、HPを35回復する。控えも選択可能。',cooldown:3,heal:35},
 {name:'風向きの逆転',description:'確定した数字を1回振り直す。同じ数字になることもある。',cooldown:3,reroll:true},
 {name:'琥珀の結界',description:'生存している味方1体に結界。対象が次に受ける防御可能なダメージ1回を半減し、最後に四捨五入。交代しても対象は変わらず、消費まで継続。重複不可。',cooldown:3,shield:true},
 {name:'虚空の穿孔',description:'敵の前衛に防御・属性を無視して20ダメージ。',cooldown:4,damage:20,bypass:true},
 {name:'翠樹の活力',description:'生存している味方1体のHPを20回復。このターンに使う通常技に攻撃力10を加える（攻撃技のみ）。',cooldown:4,heal:20,bonus:10},
 {name:'先駆けの雷',description:'敵の前衛に属性を無視して12ダメージ。防御効果の対象になる。',cooldown:3,damage:12},
 {name:'潮のめぐり',description:'敵の前衛に属性を無視して12ダメージ。生存している味方1体のHPを16回復。',cooldown:3,damage:12,heal:16},
];
// HP・属性・副属性は同じ順の一覧で管理。副属性は表示分類のみ。
const PROFILES = [
 {maxHp:120,element:'火',tags:['騎士','剣士']},
 {maxHp:100,element:'聖光',tags:['巫女','治癒師']},
 {maxHp:95,element:'自然',tags:['射手','風使い']},
 {maxHp:160,element:'自然',tags:['守護者','剛力']},
 {maxHp:100,element:'呪闇',tags:['魔術師']},
 {maxHp:110,element:'自然',tags:['薬師','治癒師']},
 {maxHp:105,element:'聖光',tags:['クリーチャー','雷使い']},
 {maxHp:130,element:'水',tags:['旅人','剣士']},
];
export const AFFINITY = { bonus:1.05, advantages:{水:['火'],火:['自然'],自然:['水'],聖光:['呪闇'],呪闇:['聖光']} };
CARDS.forEach((card,i)=>Object.assign(card,PROFILES[i],{skill:SKILLS[i]}));
export const opponent=actor=>actor==='player'?'cpu':'player';
export function roll(random=Math.random){return Math.floor(random()*6)+1;}
export function living(g,actor){return g.members[actor].map((m,i)=>m.hp>0?i:-1).filter(i=>i>=0);}
export function cardAt(g,actor,i){return CARDS[g.hands[actor][i]];}
function valid(g,actor,i){return ['player','cpu'].includes(actor)&&Number.isInteger(i)&&!!g.members[actor][i]&&g.members[actor][i].hp>0;}
export function createGame(team=[0,1,2,3,4],random=Math.random){
 if(team.length!==RULES.handSize||new Set(team).size!==team.length||team.some(id=>!Number.isInteger(id)||!CARDS[id]))throw Error('異なる5体を選択してください');
 const pool=CARDS.map((_,i)=>i),cpu=[];while(cpu.length<RULES.handSize)cpu.push(pool.splice(Math.floor(random()*pool.length),1)[0]);
 const hands={player:[...team],cpu};
 const g={hands,members:{},front:{player:null,cpu:null},cooldowns:{},used:{player:false,cpu:false},effects:{player:{multiplier:1,bonus:0},cpu:{multiplier:1,bonus:0}},phase:'opening',number:null,turn:1,winner:null,replacing:null,resumePhase:null};
 for(const actor of ['player','cpu']){g.members[actor]=hands[actor].map(id=>({hp:CARDS[id].maxHp,shield:false}));g.cooldowns[actor]=hands[actor].map(()=>0);}
 // CPUの初期前衛は自分のHPだけで決定。プレイヤーの未確定選択には依存しない。
 g.front.cpu=replacementChoice(g,'cpu');return g;
}
export function replacementChoice(g,actor){return living(g,actor).sort((a,b)=>g.members[actor][b].hp-g.members[actor][a].hp)[0]??null;}
export function selectFront(g,actor,index){
 if(!valid(g,actor,index)||g.winner)return false;
 if(g.phase==='opening'&&actor==='player'){g.front.player=index;g.phase='roll';return true;}
 if(g.phase!=='replacement'||g.replacing!==actor)return false;
 g.front[actor]=index;g.phase=g.resumePhase;g.resumePhase=null;g.replacing=null;return true;
}
export function startTurn(g,actor){
 if(g.winner||g.phase!==(actor==='player'?'playerPending':'cpuPending'))return false;
 g.cooldowns[actor]=g.cooldowns[actor].map(n=>Math.max(0,n-1));g.used[actor]=false;g.effects[actor]={multiplier:1,bonus:0};
 g.number=null;g.phase=actor==='player'?'roll':'cpuRolling';if(actor==='player')g.turn++;return true;
}
export function setRoll(g,n){if(g.winner||!['rolling','cpuRolling'].includes(g.phase)||!Number.isInteger(n)||n<1||n>6)return false;g.number=n;g.phase=g.phase==='rolling'?'choose':'cpuChoose';return true;}
export function healingFactor(g){return Math.round(Math.max(RULES.minimumHealFactor,1-Math.max(0,g.turn-RULES.fatigueStart+1)*RULES.fatigueStep)*10000)/10000;}
export function attributeMultiplier(from,to){return Array.isArray(AFFINITY.advantages[from])&&AFFINITY.advantages[from].includes(to)?AFFINITY.bonus:1;}
export function previewNormal(g,actor,index){
 if(!valid(g,actor,index)||!Number.isInteger(g.number))return {damage:0,multiplier:1};
 const target=opponent(actor),ti=g.front[target];if(!valid(g,target,ti))return {damage:0,multiplier:1};
 const card=cardAt(g,actor,index),a=card.actions[g.number-1],e=g.effects[actor];
 const multiplier=a.fixed?1:attributeMultiplier(card.element,cardAt(g,target,ti).element);
 const boosted=a.damage>0?a.damage*e.multiplier+e.bonus:0;
 return {damage:Math.round(boosted*multiplier*(g.members[target][ti].shield?.5:1)),multiplier};
}
function damage(g,actor,index,amount,{bypass=false,normal=false}={}){
 const m=g.members[actor][index];if(!m||m.hp<=0)return 0;
 if(!normal)amount=Math.round(amount*(!bypass&&m.shield?.5:1));
 if(amount>0&&!bypass)m.shield=false;
 const actual=Math.min(m.hp,amount);m.hp-=actual;if(!m.hp)m.shield=false;return actual;
}
function recover(g,actor,i,amount){if(!valid(g,actor,i))return 0;const m=g.members[actor][i],actual=Math.min(cardAt(g,actor,i).maxHp-m.hp,Math.floor(amount*healingFactor(g)));m.hp+=actual;return actual;}
function resolve(g,actor,nextPhase){
 const enemy=opponent(actor);g.phase=nextPhase;
 if(!living(g,enemy).length){g.winner=actor;g.phase='over';return;}
 if(!valid(g,enemy,g.front[enemy])){g.front[enemy]=null;g.replacing=enemy;g.resumePhase=nextPhase;g.phase='replacement';}
}
function canAct(g,actor,i){return valid(g,actor,i)&&!g.winner&&g.phase===(actor==='player'?'choose':'cpuChoose');}
export function skillReason(g,actor,i){
 if(!valid(g,actor,i))return '戦闘不能：使用不可';if(g.winner)return '戦闘終了';
 if(g.phase!==(actor==='player'?'choose':'cpuChoose'))return ['roll','rolling'].includes(g.phase)?'数字を確定してください':'今は使用できません';
 if(g.used[actor])return 'このターンは使用済み';if(cardAt(g,actor,i).skill.shield&&living(g,actor).every(n=>g.members[actor][n].shield))return '全員に結界が継続中（重複不可）';if(g.cooldowns[actor][i])return `あと${g.cooldowns[actor][i]}ターン`;return '';
}
export function useSkill(g,actor,index,targetIndex=index,random=Math.random){
 if(skillReason(g,actor,index))return null;
 const card=cardAt(g,actor,index),s=card.skill;
 if((s.heal||s.shield)&&!valid(g,actor,targetIndex))return null;
 if(s.shield&&g.members[actor][targetIndex].shield)return null;
 const enemy=opponent(actor),enemyIndex=g.front[enemy];if(!valid(g,enemy,enemyIndex))return null;
 g.used[actor]=true;g.cooldowns[actor][index]=s.cooldown;
 const oldNumber=g.number,dealt=damage(g,enemy,enemyIndex,s.damage||0,{bypass:s.bypass}),heal=s.heal?recover(g,actor,targetIndex,s.heal):0;
 if(s.shield)g.members[actor][targetIndex].shield=true;
 if(s.multiplier)g.effects[actor].multiplier=s.multiplier;if(s.bonus)g.effects[actor].bonus=s.bonus;if(s.reroll)g.number=roll(random);
 resolve(g,actor,actor==='player'?'choose':'cpuChoose');
 return {actor,card,index,healIndex:targetIndex,kind:'skill',action:s,number:g.number,oldNumber,damage:dealt,heal,target:cardAt(g,enemy,enemyIndex).name,healTarget:s.heal||s.shield?cardAt(g,actor,targetIndex).name:null,knockedOut:g.members[enemy][enemyIndex].hp===0,note:s.reroll?`数字を${oldNumber}から${g.number}へ振り直し`:s.shield?`${cardAt(g,actor,targetIndex).name}に結界（消費まで継続）`:s.description};
}
export function useCard(g,actor,index,healIndex=index){
 if(!canAct(g,actor,index))return null;
 const card=cardAt(g,actor,index),a=card.actions[g.number-1];if(a.heal&&!valid(g,actor,healIndex))return null;
 const enemy=opponent(actor),enemyIndex=g.front[enemy];if(!valid(g,enemy,enemyIndex))return null;
 const preview=previewNormal(g,actor,index);g.front[actor]=index;
 const dealt=damage(g,enemy,enemyIndex,preview.damage,{normal:true}),heal=a.heal?recover(g,actor,healIndex,a.heal):0;
 g.effects[actor]={multiplier:1,bonus:0};resolve(g,actor,actor==='player'?'cpuPending':'playerPending');
 return {actor,card,index,healIndex,kind:'normal',action:a,number:g.number,damage:dealt,heal,target:cardAt(g,enemy,enemyIndex).name,healTarget:a.heal?cardAt(g,actor,healIndex).name:null,knockedOut:g.members[enemy][enemyIndex].hp===0,multiplier:preview.multiplier,note:preview.multiplier>1&&a.damage?`属性有利 ×${preview.multiplier}`:''};
}
export function healChoice(g,actor){return living(g,actor).sort((a,b)=>(cardAt(g,actor,b).maxHp-g.members[actor][b].hp)-(cardAt(g,actor,a).maxHp-g.members[actor][a].hp))[0];}
export function actionChoice(g,actor){
 const healIndex=healChoice(g,actor),missing=cardAt(g,actor,healIndex).maxHp-g.members[actor][healIndex].hp,enemy=opponent(actor),target=g.members[enemy][g.front[enemy]];
 let choice=null;
 for(const index of living(g,actor)){
  const p=previewNormal(g,actor,index),a=cardAt(g,actor,index).actions[g.number-1];
  const score=(target&&p.damage>=target.hp?1000:0)+Math.min(target?.hp??0,p.damage)+Math.min(missing,Math.floor(a.heal*healingFactor(g)))*.6+g.members[actor][index].hp/cardAt(g,actor,index).maxHp*2;
  if(!choice||score>choice.score)choice={index,healIndex,score};
 }return choice;
}
export function cpuChoice(g){return actionChoice(g,'cpu').index;}
export function skillChoice(g,actor){
 let best=null,bestScore=5;const baseline=actionChoice(g,actor).score,enemy=opponent(actor),target=g.front[enemy];
 for(const index of living(g,actor)){
  if(skillReason(g,actor,index))continue;
  const s=cardAt(g,actor,index).skill,targetIndex=s.shield?actionChoice(g,actor).index:healChoice(g,actor);
  if(s.shield&&g.members[actor][targetIndex].shield)continue;
  const copy=structuredClone(g),result=useSkill(copy,actor,index,targetIndex,()=>.5);if(!result)continue;
  let gain=result.damage+result.heal*.8;
  if(result.knockedOut)gain+=1000;
  if(s.shield)gain+=g.members[actor][targetIndex].hp<50?16:10;
  if(s.reroll){let sum=0;for(let n=1;n<=6;n++){copy.number=n;sum+=actionChoice(copy,actor).score/6;}gain+=sum-baseline;}
  else if(copy.phase!=='replacement'&&!copy.winner)gain+=actionChoice(copy,actor).score-baseline;
  if(gain>bestScore){bestScore=gain;best={index,targetIndex};}
 }return best;
}
export function cpuSkillChoice(g){return skillChoice(g,'cpu');}
