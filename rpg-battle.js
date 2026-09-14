// ============================================================
//  rpg-battle.js - 回合制战斗（纯代码，AI 不参与）
//  依赖：shared.js → rpg-core.js → rpg-story.js
//  战斗界面在独立窗口 #battleModal
// ============================================================

const BATTLE = {
  active: false,
  allies: [],
  enemies: [],
  order: [],
  turnIndex: 0,
  round: 0,
  maxRounds: 30,
  waiting: false,
  onEnd: null
};

let BATTLE_DATA = null;

async function loadBattleData(){
  if(BATTLE_DATA) return BATTLE_DATA;
  try {
    const r = await fetch('./battle.json');
    BATTLE_DATA = await r.json();
  } catch(e) {
    console.warn('战斗数据加载失败', e);
    BATTLE_DATA = { skills:{}, enemies:{}, duel:{} };
  }
  return BATTLE_DATA;
}

// 伤害公式（系数可调）
function calcDamage(atk, def, power){
  const base = atk * (power / 100);
  const reduce = base * (def / (def + 200));
  return Math.max(1, Math.round(base - reduce));
}

function makeUnit(cfg){
  return {
    id: cfg.id || cfg.name,
    name: cfg.name,
    side: cfg.side,
    hp: cfg.hp,
    maxHp: cfg.hp,
    atk: cfg.atk,
    def: cfg.def,
    speed: cfg.speed,
    stardust: cfg.stardust || 0,
    maxStardust: cfg.maxStardust || 0,
    skills: (cfg.skills || []).slice(),
    stun: 0,
    isPlayer: !!cfg.isPlayer
  };
}

// 战斗日志写进独立窗口
function battleLog(text, cls){
  const area = document.getElementById('battleLogArea');
  if(!area) return;
  const div = document.createElement('div');
  div.className = cls || 'battle-line';
  div.textContent = text;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function hpBar(u){
  const pct = Math.max(0, Math.round(u.hp / u.maxHp * 100));
  return `${u.name} ${u.hp}/${u.maxHp}（${pct}%）`;
}

function renderBattleStatus(){
  const a = '我方：' + BATTLE.allies.filter(u=>u.hp>0).map(hpBar).join(' ｜ ');
  const e = '敌方：' + BATTLE.enemies.filter(u=>u.hp>0).map(hpBar).join(' ｜ ');
  battleLog(a + '\n' + e, 'battle-status');
}

async function startBattle(config){
  await loadBattleData();
  if(BATTLE.active) return;
  BATTLE.active = true;
  BATTLE.allies = (config.allies || []).map(makeUnit);
  BATTLE.enemies = (config.enemies || []).map(makeUnit);
  BATTLE.round = 0;
  BATTLE.turnIndex = 0;
  BATTLE.waiting = false;
  BATTLE.onEnd = config.onEnd || null;

  const logArea = document.getElementById('battleLogArea');
  if(logArea) logArea.innerHTML = '';
  const skillArea = document.getElementById('battleSkillArea');
  if(skillArea) skillArea.innerHTML = '';

  openModal('battleModal');
  battleLog('⚔ 战斗开始');
  sortOrder();
  renderBattleStatus();
  nextTurn();
}

function sortOrder(){
  const all = [...BATTLE.allies, ...BATTLE.enemies].filter(u => u.hp > 0);
  all.sort((a,b) => b.speed - a.speed);
  BATTLE.order = all;
}

function nextTurn(){
  if(!BATTLE.active) return;
  if(checkEnd()) return;

  while(BATTLE.turnIndex < BATTLE.order.length && BATTLE.order[BATTLE.turnIndex].hp <= 0){
    BATTLE.turnIndex++;
  }

  if(BATTLE.turnIndex >= BATTLE.order.length){
    BATTLE.round++;
    if(BATTLE.round >= BATTLE.maxRounds){ endBattle('timeout'); return; }
    BATTLE.order.forEach(u => { if(u.stun > 0) u.stun--; });
    sortOrder();
    BATTLE.turnIndex = 0;
    while(BATTLE.turnIndex < BATTLE.order.length && BATTLE.order[BATTLE.turnIndex].hp <= 0){
      BATTLE.turnIndex++;
    }
    if(BATTLE.turnIndex >= BATTLE.order.length){ endBattle('timeout'); return; }
  }

  const unit = BATTLE.order[BATTLE.turnIndex];
  renderBattleStatus();

  if(unit.stun > 0){
    battleLog(`${unit.name} 被眩晕，跳过行动`);
    BATTLE.turnIndex++;
    setTimeout(nextTurn, 700);
    return;
  }

  if(unit.isPlayer){
    BATTLE.waiting = true;
    showSkillOptions(unit);
  } else {
    setTimeout(() => {
      const skill = pickSkill(unit);
      doSkill(unit, skill);
      BATTLE.turnIndex++;
      setTimeout(nextTurn, 800);
    }, 700);
  }
}

function showSkillOptions(unit){
  const area = document.getElementById('battleSkillArea');
  if(!area) return;
  area.innerHTML = '';
  unit.skills.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'battle-skill-btn';
    btn.textContent = `${s.name}${s.cost ? '（'+s.cost+'星尘）' : ''}`;
    btn.onclick = () => playerChooseSkill(i);
    area.appendChild(btn);
  });
}

function playerChooseSkill(index){
  if(!BATTLE.waiting) return;
  const unit = BATTLE.order[BATTLE.turnIndex];
  const skill = unit.skills[index];
  if(!skill) return;
  if((skill.cost||0) > unit.stardust){
    battleLog('星尘不足，无法释放');
    return;
  }
  BATTLE.waiting = false;
  const area = document.getElementById('battleSkillArea');
  if(area) area.innerHTML = '';
  doSkill(unit, skill);
  BATTLE.turnIndex++;
  setTimeout(nextTurn, 800);
}

function pickSkill(unit){
  const usable = unit.skills.filter(s => (s.cost||0) <= unit.stardust);
  if(usable.length === 0) return unit.skills[0] || null;
  return usable[Math.floor(Math.random()*usable.length)];
}

function doSkill(unit, skill){
  if(!skill) return;
  unit.stardust = Math.max(0, unit.stardust - (skill.cost||0));
  battleLog(`✦ ${unit.name} 使用「${skill.name}」`);
  const targets = pickTargets(unit, skill);
  targets.forEach(t => {
    if(skill.power > 0){
      const dmg = calcDamage(unit.atk, t.def, skill.power);
      t.hp = Math.max(0, t.hp - dmg);
      battleLog(`  ${t.name} 受到 ${dmg} 伤害`);
    }
    if(skill.effect === 'stun' && Math.random() < (skill.effectChance||0)){
      t.stun = (t.stun||0) + (skill.effectDuration||1);
      battleLog(`  ${t.name} 被眩晕！`);
    }
    if(skill.effect === 'heal' && skill.effectValue){
      const heal = Math.min(skill.effectValue, t.maxHp - t.hp);
      t.hp += heal;
      battleLog(`  ${t.name} 恢复 ${heal} 生命`);
    }
  });
  renderBattleStatus();
}

function pickTargets(unit, skill){
  const opposite = unit.side === 'ally' ? BATTLE.enemies : BATTLE.allies;
  const alive = opposite.filter(u => u.hp > 0);
  if(alive.length === 0) return [];
  if(skill.target === 'all') return alive;
  if(skill.target === 'self') return [unit];
  return [alive[Math.floor(Math.random()*alive.length)]];
}

function checkEnd(){
  const alliesAlive = BATTLE.allies.some(u => u.hp > 0);
  const enemiesAlive = BATTLE.enemies.some(u => u.hp > 0);
  if(!alliesAlive || !enemiesAlive){
    endBattle(!enemiesAlive ? 'win' : 'lose');
    return true;
  }
  return false;
}

function endBattle(result){
  if(!BATTLE.active) return;
  BATTLE.active = false;
  BATTLE.waiting = false;

  const skillArea = document.getElementById('battleSkillArea');
  if(skillArea) skillArea.innerHTML = '';

  let text = '';
  if(result === 'win') text = '★ 战斗胜利';
  else if(result === 'lose') text = '✕ 战斗失败';
  else {
    const allyPct = BATTLE.allies.reduce((s,u)=>s+u.hp,0) / Math.max(1, BATTLE.allies.reduce((s,u)=>s+u.maxHp,0));
    const enemyPct = BATTLE.enemies.reduce((s,u)=>s+u.hp,0) / Math.max(1, BATTLE.enemies.reduce((s,u)=>s+u.maxHp,0));
    result = allyPct >= enemyPct ? 'win' : 'lose';
    text = `回合上限 · ${allyPct >= enemyPct ? '我方占优' : '敌方占优'}`;
  }
  battleLog(`—— ${text} ——`, result === 'win' ? 'battle-win' : 'battle-lose');

  if(typeof BATTLE.onEnd === 'function') BATTLE.onEnd(result);

  // 延迟关窗，让玩家看完结果
  setTimeout(() => {
    if(!BATTLE.active) closeModal('battleModal');
  }, 1800);
}