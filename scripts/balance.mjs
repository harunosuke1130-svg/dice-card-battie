import {CARDS,RULES,healingFactor,createGame,startTurn,setRoll,roll,cpuChoice,cpuSkillChoice,useCard,useSkill} from '../src/game.js';
function seeded(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
function view(g,actor){if(actor==='cpu')return g;const clone=structuredClone(g);for(const key of ['hp','hands','cooldowns','used','effects'])[clone[key].player,clone[key].cpu]=[clone[key].cpu,clone[key].player];clone.phase='cpuChoose';return clone;}
function choose(g,actor,mode){const v=view(g,actor);if(mode==='balanced')return cpuChoice(v);return g.hands[actor].map((id,i)=>{const a=CARDS[id].actions[g.number-1],e=g.effects[actor],target=actor==='player'?'cpu':'player';let d=a.damage>0?a.damage*e.multiplier+e.bonus:0;if(g.effects[target].shield)d=Math.ceil(d/2);const h=Math.min(RULES.maxHp-g.hp[actor],Math.floor(a.heal*healingFactor(g)));return {i,s:(d>=g.hp[target]?10000:0)+(mode==='healing'?h*2+d*.25:d+h*.1)};}).sort((a,b)=>b.s-a.s)[0].i;}
const results=[];
for(const mode of ['balanced','attack','healing']){
 const turns=[];let capped=0,wins=0;
 for(let seed=1;seed<=500;seed++){
  const random=seeded(seed),team=CARDS.map((_,i)=>i);for(let i=team.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[team[i],team[j]]=[team[j],team[i]];}
  const g=createGame(team.slice(0,5),random);
  for(let t=0;t<300&&!g.winner;t++){
   for(const actor of ['player','cpu']){
    if(actor==='player'){if(g.phase==='playerPending')startTurn(g,actor);g.phase='rolling';}else startTurn(g,actor);
    setRoll(g,roll(random));
    const skill=cpuSkillChoice(view(g,actor));if(skill>=0)useSkill(g,actor,skill,random);
    if(g.winner)break;useCard(g,actor,choose(g,actor,actor==='player'?mode:'balanced'));if(g.winner)break;
   }
  }
  if(!g.winner)capped++;if(g.winner==='player')wins++;turns.push(g.turn);
 }
 turns.sort((a,b)=>a-b);results.push({mode,games:turns.length,mean:+(turns.reduce((a,b)=>a+b,0)/turns.length).toFixed(2),median:turns[250],p10:turns[50],p90:turns[450],min:turns[0],max:turns.at(-1),within10to15:turns.filter(t=>t>=10&&t<=15).length,cappedAt300:capped,playerWins:wins});
}
console.log(JSON.stringify({maxHp:RULES.maxHp,results},null,2));
