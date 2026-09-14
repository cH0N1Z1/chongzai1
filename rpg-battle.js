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
  onEnd: null,
  field: null            // 场地效果 { fog: true }
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
    critRate: 5,               // 基础暴击率 %
    stardust: cfg.stardust || 0,
    maxStardust: cfg.maxStardust || 0,
    skills: (cfg.skills || []).slice(),
    buffs: [],                 // [{type, value, turns}]
    stun: 0,                   // 保留：跳过行动（旧机制，暂未使用）
    isPlayer: !!cfg.isPlayer
  };
}

// ---- 当前数值（基础值 + buff） ----
function getCurrentStat(unit, stat){
  let v = unit[stat] || 0;
  unit.buffs.forEach(b => {
    if(b.type === 'atkUp'   && stat === 'atk')   v *= (1 + b.value/100);
    if(b.type === 'defUp'   && stat === 'def')   v *= (1 + b.value/100);
    if(b.type === 'speedUp' && stat === 'speed') v *= (1 + b.value/100);
    if(b.type === 'slow'    && stat === 'speed') v *= (1 - b.value/100);
  });
  return v;
}

function getCurrentCrit(unit){
  let c = unit.critRate || 5;
  unit.buffs.forEach(b => {
    if(b.type === 'critUp') c += b.value;
  });
  return c;
}

function getCurrentHit(unit){
  let h = 100;
  // 场地：迷雾
  if(BATTLE.field && BATTLE.field.fog) h -= 20;
  // 自身命中下降 buff（晕眩）
  unit.buffs.forEach(b => {
    if(b.type === 'hitDown') h -= b.value;
  });
  return Math.max(0, h);
}

// ---- 命中 / 暴击判定 ----
function rollHit(attacker){
  const rate = getCurrentHit(attacker);
  return Math.random() * 100 < rate;
}

function rollCrit(attacker){
  const rate = getCurrentCrit(attacker);
  return Math.random() * 100 < rate;
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
  BATTLE.field = config.field ? Object.assign({}, config.field) : null;

  const logArea = document.getElementById('battleLogArea');
  if(logArea) logArea.innerHTML = '';
  const skillArea = document.getElementById('battleSkillArea');
  if(skillArea) skillArea.innerHTML = '';

  openModal('battleModal');
  battleLog('⚔ 战斗开始');
  if(BATTLE.field && BATTLE.field.fog){
    battleLog('🌫 迷雾笼罩，命中率下降');
  }
  sortOrder();
  renderBattleStatus();
  nextTurn();
}

function sortOrder(){
  const all = [...BATTLE.allies, ...BATTLE.enemies].filter(u => u.hp > 0);
  all.sort((a,b) => getCurrentStat(b,'speed') - getCurrentStat(a,'speed'));
  BATTLE.order = all;
}

function nextTurn(){
  if(!BATTLE.active) return;
  if(checkEnd()) return;

  while(BATTLE.turnIndex < BATTLE.order.length && BATTLE.order[BATTLE.turnIndex].hp <= 0){
    BATTLE.turnIndex++;
  }

  if(BATTLE.turnIndex >= BATTLE.order.length){
    // 回合结束 → buff 结算
    endRound();
    BATTLE.round++;
    if(BATTLE.round >= BATTLE.maxRounds){ endBattle('timeout'); return; }
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

// 回合结束：所有 buff 剩余回合 -1，到期的清掉
function endRound(){
  const all = [...BATTLE.allies, ...BATTLE.enemies];
  all.forEach(u => {
    if(!u.buffs || u.buffs.length === 0) return;
    u.buffs.forEach(b => { b.turns--; });
    u.buffs = u.buffs.filter(b => b.turns > 0);
  });
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

  // 场地驱散（流明）
  if(skill.effect === 'dispelFog'){
    if(BATTLE.field && BATTLE.field.fog){
      BATTLE.field.fog = false;
      battleLog('  🌤 迷雾散去，命中恢复');
    } else {
      battleLog('  但没有迷雾可散');
    }
    renderBattleStatus();
    return;
  }

  const targets = pickTargets(unit, skill);
  targets.forEach(t => {
    const isHostile = unit.side !== t.side;

    // 命中判定（只对敌方目标）
    if(isHostile){
      if(!rollHit(unit)){
        battleLog(`  ${t.name} 闪开了（未命中）`);
        return;
      }
    }

    // 伤害
    if(skill.power > 0){
      const curAtk = getCurrentStat(unit, 'atk');
      const curDef = getCurrentStat(t, 'def');
      let dmg = calcDamage(curAtk, curDef, skill.power);
      if(rollCrit(unit)){
        dmg = Math.round(dmg * 1.5);
        battleLog(`  💥 暴击！`);
      }
      t.hp = Math.max(0, t.hp - dmg);
      battleLog(`  ${t.name} 受到 ${dmg} 伤害`);
    }

    // 效果挂载
    if(skill.effect === 'heal' && skill.effectValue){
      const heal = Math.min(skill.effectValue, t.maxHp - t.hp);
      t.hp += heal;
      battleLog(`  ${t.name} 恢复 ${heal} 生命`);
    }

    if(skill.effect === 'stun' && Math.random() < (skill.effectChance||0)){
      const v = skill.effectValue || 40;
      const d = skill.effectDuration || 2;
      addBuff(t, 'hitDown', v, d);
      battleLog(`  ${t.name} 命中下降 ${v}%（${d}回合）`);
    }

    if(skill.effect === 'slow' && Math.random() < (skill.effectChance||1)){
      const v = skill.effectValue || 10;
      const d = skill.effectDuration || 3;
      addBuff(t, 'slow', v, d);
      battleLog(`  ${t.name} 速度下降 ${v}%（${d}回合）`);
    }

    if(skill.effect === 'atkUp' || skill.effect === 'defUp' || skill.effect === 'speedUp' || skill.effect === 'critUp'){
      const v = skill.effectValue || 20;
      const d = skill.effectDuration || 3;
      addBuff(t, skill.effect, v, d);
      const label = {
        atkUp: '攻击提升', defUp: '防御提升',
        speedUp: '速度提升', critUp: '暴击提升'
      }[skill.effect];
      battleLog(`  ${t.name} ${label} ${v}%（${d}回合）`);
    }
  });
  renderBattleStatus();
}

// 挂 buff：同类叠加回合数，取较大值
function addBuff(unit, type, value, turns){
  if(!unit.buffs) unit.buffs = [];
  const exist = unit.buffs.find(b => b.type === type);
  if(exist){
    exist.value = Math.max(exist.value, value);
    exist.turns = Math.max(exist.turns, turns);
  } else {
    unit.buffs.push({ type, value, turns });
  }
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

  // 主角剩余星尘写回存档（血量每场满，不写回）
  const _me = BATTLE.allies.find(u => u.isPlayer);
  if(_me && typeof CORE !== 'undefined' && CORE.battle){
    CORE.battle.stardust = _me.stardust;
    if(typeof saveToPhone === 'function') saveToPhone();
  }

  if(typeof BATTLE.onEnd === 'function') BATTLE.onEnd(result);

  // 延迟关窗，让玩家看完结果
  setTimeout(() => {
    if(!BATTLE.active) closeModal('battleModal');
  }, 1800);
}