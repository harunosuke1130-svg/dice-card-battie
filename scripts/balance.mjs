import {CARDS,createGame,selectFront,replacementChoice,startTurn,setRoll,roll,previewNormal,living,healChoice,actionChoice,skillChoice,useCard,useSkill,healingFactor} from '../src/game.js';
function seeded(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
function choose(g,actor,mode){if(mode==='balanced')return actionChoice(g,actor);const healIndex=healChoice(g,actor),missing=CARDS[g.hands[actor][healIndex]].maxHp-g.members[actor][healIndex].hp,enemy=actor==='player'?'cpu':'player',target=g.members[enemy][g.front[enemy]];return living(g,actor).map(index=>{const a=CARDS[g.hands[actor][index]].actions[g.number-1],d=previewNormal(g,actor,index).damage,h=Math.min(missing,Math.floor(a.heal*healingFactor(g)));return {index,healIndex,score:(d>=target.hp?1000:0)+(mode==='healing'?h*2+d*.25:d+h*.1)};}).sort((a,b)=>b.score-a.score)[0];}
const results=[];
for(const mode of ['balanced','attack','healing']){
 const turns=[];let capped=0,wins=0;
 for(let seed=1;seed<=500;seed++){
  const random=seeded(seed),team=CARDS.map((_,i)=>i);for(let i=team.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[team[i],team[j]]=[team[j],team[i]];}
  const g=createGame(team.slice(0,5),random);selectFront(g,'player',replacementChoice(g,'player'));
  let moves=0;
  while(!g.winner&&g.turn<=300&&moves++<5000){
   if(g.phase==='replacement'){selectFront(g,g.replacing,replacementChoice(g,g.replacing));continue;}
   if(g.phase==='roll'){g.phase='rolling';setRoll(g,roll(random));continue;}
   if(g.phase==='cpuRolling'){setRoll(g,roll(random));continue;}
   if(g.phase==='playerPending'||g.phase==='cpuPending'){startTurn(g,g.phase==='playerPending'?'player':'cpu');continue;}
   const actor=g.phase==='choose'?'player':'cpu',s=skillChoice(g,actor);
   if(s)useSkill(g,actor,s.index,s.targetIndex,random);else{const a=choose(g,actor,actor==='player'?mode:'balanced');useCard(g,actor,a.index,a.healIndex);}
  }
  if(!g.winner)capped++;if(g.winner==='player')wins++;turns.push(g.turn);
 }
 turns.sort((a,b)=>a-b);results.push({mode,games:turns.length,mean:+(turns.reduce((a,b)=>a+b,0)/turns.length).toFixed(2),median:turns[250],p10:turns[50],p90:turns[450],min:turns[0],max:turns.at(-1),unfinished:capped,playerWins:wins});
}
console.log(JSON.stringify({version:'individual-hp',profiles:CARDS.map(c=>({name:c.name,maxHp:c.maxHp,element:c.element})),results},null,2));
