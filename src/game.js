export const RULES = { maxHp: 300, handSize: 5, normalHealScale: 1.3, fatigueStart: 16, fatigueStep: .1, minimumHealFactor: .25 };
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
 {name:'月泉の祝福',description:'自分側の体力を35回復する。',cooldown:3,heal:35},
 {name:'風向きの逆転',description:'確定した数字を1回振り直す。同じ数字になることもある。',cooldown:3,reroll:true},
 {name:'琥珀の結界',description:'次に受ける攻撃ダメージを1回だけ半分にする（端数切り上げ）。重複不可。防御無視の攻撃では消えない。',cooldown:3,shield:true},
 {name:'虚空の穿孔',description:'敵の防御を無視して20ダメージ。',cooldown:4,damage:20,bypass:true},
 {name:'翠樹の活力',description:'体力を20回復。このターンの通常技に攻撃力10を加える（攻撃技のみ）。',cooldown:4,heal:20,bonus:10},
 {name:'先駆けの雷',description:'敵に12ダメージを与える。防御効果の対象になる。',cooldown:3,damage:12},
 {name:'潮のめぐり',description:'敵に12ダメージを与え、自分側の体力を16回復する。',cooldown:3,damage:12,heal:16},
];
CARDS.forEach((card,i)=>{card.skill=SKILLS[i];});
export function roll(random = Math.random) { return Math.floor(random()*6)+1; }
export function createGame(team=[0,1,2,3,4], random=Math.random) {
 if(team.length!==RULES.handSize || new Set(team).size!==team.length || team.some(id=>!Number.isInteger(id)||!CARDS[id])) throw Error('異なる5体を選択してください');
 const pool=CARDS.map((_,i)=>i),cpu=[];
 while(cpu.length<RULES.handSize)cpu.push(pool.splice(Math.floor(random()*pool.length),1)[0]);
 return {hp:{player:RULES.maxHp,cpu:RULES.maxHp},hands:{player:[...team],cpu},cooldowns:{player:Array(RULES.handSize).fill(0),cpu:Array(RULES.handSize).fill(0)},used:{player:false,cpu:false},effects:{player:{shield:false,multiplier:1,bonus:0},cpu:{shield:false,multiplier:1,bonus:0}},phase:'roll',number:null,turn:1,winner:null};
}
const opponent=actor=>actor==='player'?'cpu':'player';
function canAct(g,actor,index){return ['player','cpu'].includes(actor)&&!g.winner&&g.phase===(actor==='player'?'choose':'cpuChoose')&&Number.isInteger(index)&&index>=0&&index<g.hands[actor].length;}
export function startTurn(g,actor){
 if(g.winner||g.phase!==(actor==='player'?'playerPending':'cpuPending'))return false;
 g.cooldowns[actor]=g.cooldowns[actor].map(n=>Math.max(0,n-1));g.used[actor]=false;
 g.effects[actor].multiplier=1;g.effects[actor].bonus=0;
 g.number=null;g.phase=actor==='player'?'roll':'cpuRolling';if(actor==='player')g.turn++;return true;
}
export function setRoll(g,number){
 if(g.winner||!['rolling','cpuRolling'].includes(g.phase)||!Number.isInteger(number)||number<1||number>6)return false;
 g.number=number;g.phase=g.phase==='rolling'?'choose':'cpuChoose';return true;
}
function deal(g,target,amount,bypass=false){
 if(amount>0&&g.effects[target].shield&&!bypass){amount=Math.ceil(amount/2);g.effects[target].shield=false;}
 const actual=Math.min(g.hp[target],amount);g.hp[target]-=actual;return actual;
}
export function healingFactor(g){return Math.round(Math.max(RULES.minimumHealFactor,1-Math.max(0,g.turn-RULES.fatigueStart+1)*RULES.fatigueStep)*10000)/10000;}
function recover(g,actor,amount){amount=Math.floor(amount*healingFactor(g));const actual=Math.min(RULES.maxHp-g.hp[actor],amount);g.hp[actor]+=actual;return actual;}
function checkWinner(g,actor){if(g.hp[opponent(actor)]===0){g.winner=actor;g.phase='over';}}
export function skillReason(g,actor,index){
 if(!['player','cpu'].includes(actor)||!Number.isInteger(index)||!CARDS[g.hands[actor][index]])return '対象がありません';
 if(g.winner)return '戦闘終了';
 if(g.phase!==(actor==='player'?'choose':'cpuChoose'))return g.phase==='roll'||g.phase==='rolling'?'数字を確定してください':'相手のターン・通常技確定後は使用不可';
 if(g.used[actor])return 'このターンは使用済み';
 if(g.cooldowns[actor][index]>0)return `あと${g.cooldowns[actor][index]}ターン`;
 if(CARDS[g.hands[actor][index]].skill.shield&&g.effects[actor].shield)return '結界が継続中（重複不可）';
 return '';
}
export function useSkill(g,actor,index,random=Math.random){
 if(skillReason(g,actor,index))return null;
 const card=CARDS[g.hands[actor][index]],s=card.skill,oldNumber=g.number;
 // 制限を効果より先に確定し、連打・再入を防ぐ。
 g.used[actor]=true;g.cooldowns[actor][index]=s.cooldown;
 const damage=deal(g,opponent(actor),s.damage||0,s.bypass),heal=recover(g,actor,s.heal||0);
 if(s.multiplier)g.effects[actor].multiplier=s.multiplier;
 if(s.bonus)g.effects[actor].bonus=s.bonus;
 if(s.shield)g.effects[actor].shield=true;
 if(s.reroll)g.number=roll(random);
 checkWinner(g,actor);
 return {actor,card,action:s,kind:'skill',number:g.number,oldNumber,damage,heal,note:s.reroll?`数字を${oldNumber}から${g.number}へ振り直し`:s.description};
}
export function useCard(g,actor,index){
 if(!canAct(g,actor,index))return null;
 const card=CARDS[g.hands[actor][index]],action=card.actions[g.number-1],e=g.effects[actor];
 const raw=action.damage>0?action.damage*e.multiplier+e.bonus:0;
 const damage=deal(g,opponent(actor),raw),heal=recover(g,actor,action.heal);
 e.multiplier=1;e.bonus=0;
 g.phase=actor==='player'?'cpuPending':'playerPending';checkWinner(g,actor);
 return {actor,card,action,kind:'normal',number:g.number,damage,heal,note:raw!==action.damage?`攻撃強化：${action.damage} → ${raw}`:''};
}
function normalScore(g,id){const a=CARDS[id].actions[g.number-1],e=g.effects.cpu;let d=a.damage>0?a.damage*e.multiplier+e.bonus:0;if(g.effects.player.shield)d=Math.ceil(d/2);return (d>=g.hp.player?10000:0)+Math.min(d,g.hp.player)+Math.min(RULES.maxHp-g.hp.cpu,Math.floor(a.heal*healingFactor(g)))*(g.hp.cpu<RULES.maxHp*.25?1.1:.6);}
export function cpuChoice(g){return g.hands.cpu.map((id,index)=>({index,score:normalScore(g,id)})).sort((a,b)=>b.score-a.score)[0].index;}
export function cpuSkillChoice(g){
 let best=-1,bestScore=5;const baseline=normalScore(g,g.hands.cpu[cpuChoice(g)]);
 for(let i=0;i<g.hands.cpu.length;i++){
  if(skillReason(g,'cpu',i))continue;
  const copy=JSON.parse(JSON.stringify(g)),s=CARDS[g.hands.cpu[i]].skill;
  useSkill(copy,'cpu',i,()=>.5);
  let gain;
  if(s.reroll){gain=0;for(let n=1;n<=6;n++){copy.number=n;gain+=normalScore(copy,copy.hands.cpu[cpuChoice(copy)])/6;}gain-=baseline;}
  else {gain=(g.hp.player-copy.hp.player)+Math.min(RULES.maxHp-g.hp.cpu,Math.floor((s.heal||0)*healingFactor(g)))*(g.hp.cpu<RULES.maxHp*.25?1.1:.6)+normalScore(copy,copy.hands.cpu[cpuChoice(copy)])-baseline;if(s.shield)gain+=g.hp.cpu<RULES.maxHp*.4?17:9;if(copy.winner)gain+=20000;}
  if(gain>bestScore){bestScore=gain;best=i;}
 }
 return best;
}
