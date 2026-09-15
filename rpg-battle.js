// ============================================================
//  rpg-battle.js - 回合制战斗（重写版）
//  流程：逐个选技能+目标（自动确认）→ 最后一个角色出现确定 → 播放
//  依赖：shared.js → rpg-core.js → rpg-story.js
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
  field: null,
  phase: 'idle',
  selectIndex: 0,
  selectingTarget: false,
  pendingUnit: null,
  pendingSkill: null,
  pendingTarget: null
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

function calcDamage(atk, def, power){
  const base = atk * (power / 100);
  const reduce = base * (def / (def + 200));
  return Math.max(1, Math.round(base - reduce));
}

function makeUnit(cfg, side, index){
  return {
    id: cfg.id || cfg.name,
    name: cfg.name,
    side: side,
    index: index,
    hp: cfg.hp,
    maxHp: cfg.hp,
    atk: cfg.atk,
    def: cfg.def,
    speed: cfg.speed,
    critRate: 5,
    stardust: cfg.stardust || 0,
    maxStardust: cfg.maxStardust || 0,
    skills: (cfg.skills || []).slice(),
    buffs: [],
    stun: 0,
    isPlayer: !!cfg.isPlayer,
    avatar: cfg.avatar || '',
    action: null
  };
}

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
  unit.buffs.forEach(b => { if(b.type === 'critUp') c += b.value; });
  return c;
}

function getCurrentHit(unit){
  let h = 100;
  if(BATTLE.field && BATTLE.field.fog) h -= 20;
  unit.buffs.forEach(b => { if(b.type === 'hitDown') h -= b.value; });
  return Math.max(0, h);
}

function rollHit(attacker){ return Math.random() * 100 < getCurrentHit(attacker); }
function rollCrit(attacker){ return Math.random() * 100 < getCurrentCrit(attacker); }

function isHostileSkill(skill){
  if(!skill) return false;
  if(skill.target === 'self') return false;
  if(skill.effect === 'heal' || skill.effect === 'atkUp' || skill.effect === 'defUp' ||
     skill.effect === 'speedUp' || skill.effect === 'critUp'){
    return false;
  }
  return true;
}

function battleLog(text, cls){
  const area = document.getElementById('battleLogArea');
  if(!area) return;
  const div = document.createElement('div');
  div.className = cls || 'battle-line';
  div.textContent = text;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

// ============================================================
//  战斗开始
// ============================================================
async function startBattle(config){
  await loadBattleData();
  if(BATTLE.active) return;
  BATTLE.active = true;
  BATTLE.allies = (config.allies || []).map((c, i) => makeUnit(c, 'ally', i + 1));
  BATTLE.enemies = (config.enemies || []).map((c, i) => makeUnit(c, 'enemy', i + 1));
  BATTLE.round = 1;
  BATTLE.turnIndex = 0;
  BATTLE.waiting = false;
  BATTLE.onEnd = config.onEnd || null;
  BATTLE.field = config.field ? Object.assign({}, config.field) : null;
  BATTLE.phase = 'select';
  BATTLE.selectIndex = 0;
  BATTLE.selectingTarget = false;
  BATTLE.pendingUnit = null;
  BATTLE.pendingSkill = null;
  BATTLE.pendingTarget = null;
  BATTLE.order = [];

  const logArea = document.getElementById('battleLogArea');
  if(logArea) logArea.innerHTML = '';
  const skillArea = document.getElementById('battleSkillArea');
  if(skillArea) skillArea.innerHTML = '';

  openModal('battleModal');
  battleLog('⚔ 战斗开始');
  if(BATTLE.field && BATTLE.field.fog){
    battleLog('🌫 迷雾笼罩，命中率下降');
  }
  renderBattleStatus();
  startSelectPhase();
}

// ============================================================
//  选行动阶段
// ============================================================
function startSelectPhase(){
  BATTLE.phase = 'select';
  BATTLE.selectIndex = 0;
  BATTLE.selectingTarget = false;
  BATTLE.pendingUnit = null;
  BATTLE.pendingSkill = null;
  BATTLE.pendingTarget = null;
  BATTLE.waiting = true;
  [...BATTLE.allies, ...BATTLE.enemies].forEach(u => u.action = null);
  renderBattleStatus();
  selectNextAlly();
}

function selectNextAlly(){
  while(BATTLE.selectIndex < BATTLE.allies.length && BATTLE.allies[BATTLE.selectIndex].hp <= 0){
    BATTLE.selectIndex++;
  }
  if(BATTLE.selectIndex >= BATTLE.allies.length){
    executePhase();
    return;
  }
  BATTLE.pendingUnit = BATTLE.allies[BATTLE.selectIndex];
  BATTLE.pendingSkill = null;
  BATTLE.pendingTarget = null;
  BATTLE.selectingTarget = false;
  showSkillOptions(BATTLE.pendingUnit);
  renderBattleStatus();
  updateFooterButtons();
}

function showSkillOptions(unit){
  const area = document.getElementById('battleSkillArea');
  if(!area) return;
  area.innerHTML = '';
  if(!unit) return;
  unit.skills.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'battle-skill-btn';
    btn.textContent = `${s.name}${s.cost ? '（'+s.cost+'星尘）' : ''}`;
    btn.onclick = () => playerChooseSkill(i);
    area.appendChild(btn);
  });
}

// 判断当前选中的角色是不是最后一个活着的我方单位
function isLastSelectableAlly(){
  for(let i = BATTLE.selectIndex + 1; i < BATTLE.allies.length; i++){
    if(BATTLE.allies[i].hp > 0) return false;
  }
  return true;
}

function updateFooterButtons(){
  const returnBtn = document.getElementById('battleReturnBtn');
  const confirmBtn = document.getElementById('battleConfirmBtn');
  const inSelect = (BATTLE.phase === 'select');

  const canReturn = inSelect && (
    BATTLE.pendingSkill || BATTLE.selectingTarget || BATTLE.pendingTarget ||
    BATTLE.selectIndex > 0
  );

  const needTarget = BATTLE.pendingSkill && BATTLE.pendingSkill.target === 'one';
  const canConfirm = inSelect && isLastSelectableAlly() && BATTLE.pendingSkill &&
                     (!needTarget || BATTLE.pendingTarget);

  if(returnBtn) returnBtn.classList.toggle('hidden', !canReturn);
  if(confirmBtn) confirmBtn.classList.toggle('hidden', !canConfirm);
}

// 当前角色的行动存入，切换到下一个
function autoConfirmCurrent(){
  const unit = BATTLE.pendingUnit;
  const skill = BATTLE.pendingSkill;
  if(!unit || !skill) return;
  unit.action = { skill: skill, target: BATTLE.pendingTarget };
  unit.stardust -= (skill.cost || 0);
  BATTLE.pendingUnit = null;
  BATTLE.pendingSkill = null;
  BATTLE.pendingTarget = null;
  BATTLE.selectingTarget = false;
  BATTLE.selectIndex++;
  selectNextAlly();
}

function playerChooseSkill(index){
  if(!BATTLE.waiting || BATTLE.phase !== 'select') return;
  const unit = BATTLE.pendingUnit;
  if(!unit) return;
  const skill = unit.skills[index];
  if(!skill) return;
  if((skill.cost||0) > unit.stardust){
    battleLog('星尘不足，无法释放');
    return;
  }
  BATTLE.pendingSkill = skill;
  BATTLE.pendingTarget = null;

  if(skill.target === 'one'){
    BATTLE.selectingTarget = true;
    const area = document.getElementById('battleSkillArea');
    if(area) area.innerHTML = '';
    battleLog(`请选择「${skill.name}」的目标`);
    renderBattleStatus();
    updateFooterButtons();
  } else {
    BATTLE.selectingTarget = false;
    if(isLastSelectableAlly()){
      renderBattleStatus();
      updateFooterButtons();
    } else {
      autoConfirmCurrent();
    }
  }
}

function clickAllyTarget(idx){
  if(!BATTLE.selectingTarget) return;
  const target = BATTLE.allies[idx];
  if(!target || target.hp <= 0) return;
  if(isHostileSkill(BATTLE.pendingSkill)) return;
  confirmTarget(target);
}

function clickEnemyTarget(idx){
  if(!BATTLE.selectingTarget) return;
  const target = BATTLE.enemies[idx];
  if(!target || target.hp <= 0) return;
  if(!isHostileSkill(BATTLE.pendingSkill)) return;
  confirmTarget(target);
}

function confirmTarget(target){
  BATTLE.pendingTarget = target;
  BATTLE.selectingTarget = false;
  battleLog(`目标：${target.name}`);
  renderBattleStatus();

  if(isLastSelectableAlly()){
    updateFooterButtons();
  } else {
    autoConfirmCurrent();
  }
}

// 点确定 → 播放回合
function battleConfirm(){
  if(!BATTLE.active || BATTLE.phase !== 'select') return;
  const unit = BATTLE.pendingUnit;
  const skill = BATTLE.pendingSkill;
  if(!unit || !skill) return;
  if(skill.target === 'one' && !BATTLE.pendingTarget) return;
  unit.action = { skill: skill, target: BATTLE.pendingTarget };
  unit.stardust -= (skill.cost || 0);
  executePhase();
}

// 点返回
function battleReturn(){
  if(!BATTLE.active || BATTLE.phase !== 'select') return;

  if(BATTLE.pendingSkill || BATTLE.selectingTarget || BATTLE.pendingTarget){
    BATTLE.pendingSkill = null;
    BATTLE.pendingTarget = null;
    BATTLE.selectingTarget = false;
    showSkillOptions(BATTLE.pendingUnit);
    renderBattleStatus();
    updateFooterButtons();
    return;
  }

  if(BATTLE.selectIndex > 0){
    BATTLE.selectIndex--;
    const prev = BATTLE.allies[BATTLE.selectIndex];
    if(prev && prev.action){
      prev.stardust += (prev.action.skill.cost || 0);
      prev.action = null;
    }
    BATTLE.pendingUnit = null;
    selectNextAlly();
  }
}

// ============================================================
//  渲染
// ============================================================
function renderBattleStatus(){
  const roundEl = document.getElementById('battleRound');
  if(roundEl) roundEl.textContent = '回合 ' + BATTLE.round;

  const fieldEl = document.getElementById('battleField');
  if(fieldEl){
    if(BATTLE.field && BATTLE.field.fog){
      fieldEl.textContent = '场地：迷雾';
      fieldEl.style.color = '#a78bfa';
    } else {
      fieldEl.textContent = '场地：无';
      fieldEl.style.color = '#8b949e';
    }
  }

  const speedBar = document.getElementById('battleSpeedBar');
  if(speedBar){
    let units = [];
    if(BATTLE.phase === 'execute' && BATTLE.order.length){
      units = BATTLE.order;
    } else {
      units = BATTLE.allies.filter(u => u.hp > 0);
    }
    speedBar.innerHTML = units.map((u, i) => {
      let cls = 'speed-item';
      if(u.side === 'enemy') cls += ' enemy';
      if(BATTLE.phase === 'execute' && i === BATTLE.turnIndex) cls += ' active';
      return `<div class="${cls}">${escapeHtml(u.name)}</div>`;
    }).join('');
  }

  const alliesEl = document.getElementById('battleAllies');
  if(alliesEl){
    alliesEl.innerHTML = BATTLE.allies.map((u, i) => {
      const dead = u.hp <= 0 ? 'dead' : '';
      const acting = (BATTLE.phase === 'select' && i === BATTLE.selectIndex) ? 'current-acting' : '';
      const selected = (BATTLE.pendingTarget === u) ? 'selected-target' : '';
      let selectable = '';
      if(BATTLE.selectingTarget && u.hp > 0 && !isHostileSkill(BATTLE.pendingSkill)){
        selectable = 'selectable';
      }
      const avatar = u.avatar ? `<img src="${u.avatar}">` : escapeHtml(u.name.charAt(0));
      const dustLine = (u.maxStardust > 0) ? `<div class="unit-dust">✦ ${u.stardust}/${u.maxStardust}</div>` : '';
      return `<div class="battle-unit ${dead} ${acting} ${selected} ${selectable}" onclick="clickAllyTarget(${i})">
        <div class="unit-avatar">${avatar}</div>
        <div class="unit-info">
          <div class="unit-name-box">${escapeHtml(u.name)}</div>
          <div class="unit-hp">${u.hp}/${u.maxHp}</div>
          ${dustLine}
        </div>
      </div>`;
    }).join('');
  }

  const enemiesEl = document.getElementById('battleEnemies');
  if(enemiesEl){
    enemiesEl.innerHTML = BATTLE.enemies.map((u, i) => {
      const dead = u.hp <= 0 ? 'dead' : '';
      const selected = (BATTLE.pendingTarget === u) ? 'selected-target' : '';
      let selectable = '';
      if(BATTLE.selectingTarget && u.hp > 0 && isHostileSkill(BATTLE.pendingSkill)){
        selectable = 'selectable';
      }
      const dustLine = (u.maxStardust > 0) ? `<div class="unit-dust">✦ ${u.stardust}/${u.maxStardust}</div>` : '';
      return `<div class="battle-unit enemy ${dead} ${selected} ${selectable}" onclick="clickEnemyTarget(${i})">
        <div class="unit-avatar">?</div>
        <div class="unit-info">
          <div class="unit-name-box">${escapeHtml(u.name)}</div>
          <div class="unit-hp">${u.hp}/${u.maxHp}</div>
          ${dustLine}
        </div>
      </div>`;
    }).join('');
  }
}

// ============================================================
//  执行阶段
// ============================================================
function executePhase(){
  BATTLE.phase = 'execute';
  BATTLE.waiting = false;
  const area = document.getElementById('battleSkillArea');
  if(area) area.innerHTML = '';
  const returnBtn = document.getElementById('battleReturnBtn');
  if(returnBtn) returnBtn.classList.add('hidden');
  const confirmBtn = document.getElementById('battleConfirmBtn');
  if(confirmBtn) confirmBtn.classList.add('hidden');

  BATTLE.enemies.forEach(u => {
    if(u.hp <= 0) return;
    const skill = pickSkill(u);
    let target = null;
    if(skill && skill.target === 'one'){
      const candidates = BATTLE.allies.filter(a => a.hp > 0);
      if(candidates.length) target = candidates[Math.floor(Math.random() * candidates.length)];
    }
    u.action = { skill: skill, target: target };
  });

  computeOrder();
  BATTLE.turnIndex = 0;
  renderBattleStatus();
  nextAction();
}

function computeOrder(){
  const order = [];
  const maxLen = Math.max(BATTLE.allies.length, BATTLE.enemies.length);
  for(let i = 0; i < maxLen; i++){
    const ally = BATTLE.allies[i];
    const enemy = BATTLE.enemies[i];
    const aAlive = ally && ally.hp > 0;
    const eAlive = enemy && enemy.hp > 0;
    if(aAlive && eAlive){
      const aSpd = getCurrentStat(ally, 'speed');
      const eSpd = getCurrentStat(enemy, 'speed');
      if(aSpd >= eSpd){
        order.push(ally); order.push(enemy);
      } else {
        order.push(enemy); order.push(ally);
      }
    } else if(aAlive){
      order.push(ally);
    } else if(eAlive){
      order.push(enemy);
    }
  }
  BATTLE.order = order;
}

function nextAction(){
  if(!BATTLE.active) return;
  if(checkEnd()) return;

  while(BATTLE.turnIndex < BATTLE.order.length && BATTLE.order[BATTLE.turnIndex].hp <= 0){
    BATTLE.turnIndex++;
  }

  if(BATTLE.turnIndex >= BATTLE.order.length){
    endRound();
    BATTLE.round++;
    if(BATTLE.round > BATTLE.maxRounds){ endBattle('timeout'); return; }
    startSelectPhase();
    return;
  }

  const unit = BATTLE.order[BATTLE.turnIndex];
  renderBattleStatus();

  if(unit.stun > 0){
    battleLog(`${unit.name} 被眩晕，跳过行动`);
    BATTLE.turnIndex++;
    setTimeout(nextAction, 600);
    return;
  }

  const act = unit.action;
  if(!act || !act.skill){
    BATTLE.turnIndex++;
    setTimeout(nextAction, 400);
    return;
  }

  doSkill(unit, act.skill, act.target);
  BATTLE.turnIndex++;
  setTimeout(nextAction, 800);
}

function doSkill(unit, skill, target){
  if(!skill) return;
  battleLog(`✦ ${unit.name} 使用「${skill.name}」`);

  if(skill.effect === 'dispelFog'){
    if(BATTLE.field && BATTLE.field.fog){
      BATTLE.field.fog = false;
      battleLog('  🌤 迷雾散去，命中恢复');
    } else {
      battleLog('  但没有迷雾可散');
    }
    return;
  }

  let targets = [];
  if(skill.target === 'all'){
    const opposite = unit.side === 'ally' ? BATTLE.enemies : BATTLE.allies;
    targets = opposite.filter(u => u.hp > 0);
  } else if(skill.target === 'self'){
    targets = [unit];
  } else {
    if(target && target.hp > 0){
      targets = [target];
    } else {
      const opposite = unit.side === 'ally' ? BATTLE.enemies : BATTLE.allies;
      const alive = opposite.filter(u => u.hp > 0);
      if(alive.length) targets = [alive[Math.floor(Math.random() * alive.length)]];
    }
  }
  if(targets.length === 0){
    battleLog('  但没有可作用的目标');
    return;
  }

  targets.forEach(t => {
    const isHostile = unit.side !== t.side;

    if(isHostile){
      if(!rollHit(unit)){
        battleLog(`  ${t.name} 闪开了（未命中）`);
        return;
      }
    }

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
}

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

function pickSkill(unit){
  const usable = unit.skills.filter(s => (s.cost||0) <= unit.stardust);
  if(usable.length === 0) return unit.skills[0] || null;
  return usable[Math.floor(Math.random()*usable.length)];
}

function endRound(){
  const all = [...BATTLE.allies, ...BATTLE.enemies];
  all.forEach(u => {
    if(!u.buffs || u.buffs.length === 0) return;
    u.buffs.forEach(b => { b.turns--; });
    u.buffs = u.buffs.filter(b => b.turns > 0);
  });
}

// ============================================================
//  胜负 / 逃跑
// ============================================================
function checkEnd(){
  const alliesAlive = BATTLE.allies.some(u => u.hp > 0);
  const enemiesAlive = BATTLE.enemies.some(u => u.hp > 0);
  if(!alliesAlive || !enemiesAlive){
    endBattle(!enemiesAlive ? 'win' : 'lose');
    return true;
  }
  return false;
}

function battleFlee(){
  if(!BATTLE.active) return;
  if(BATTLE.phase !== 'select') return;
  if(!confirm('确定要逃跑吗？失败会放弃本回合行动。')) return;
  const success = Math.random() < 0.5;
  if(success){
    battleLog('你成功逃跑了！');
    endBattle('flee');
  } else {
    battleLog('逃跑失败！本回合放弃行动。');
    BATTLE.waiting = false;
    BATTLE.phase = 'execute';
    BATTLE.allies.forEach(u => u.action = null);
    executePhase();
  }
}

function endBattle(result){
  if(!BATTLE.active) return;
  BATTLE.active = false;
  BATTLE.waiting = false;
  BATTLE.phase = 'idle';

  const skillArea = document.getElementById('battleSkillArea');
  if(skillArea) skillArea.innerHTML = '';
  const returnBtn = document.getElementById('battleReturnBtn');
  if(returnBtn) returnBtn.classList.add('hidden');
  const confirmBtn = document.getElementById('battleConfirmBtn');
  if(confirmBtn) confirmBtn.classList.add('hidden');

  let text = '';
  if(result === 'win') text = '★ 战斗胜利';
  else if(result === 'lose') text = '✕ 战斗失败';
  else if(result === 'flee') text = '→ 逃跑成功';
  else {
    const allyPct = BATTLE.allies.reduce((s,u)=>s+u.hp,0) / Math.max(1, BATTLE.allies.reduce((s,u)=>s+u.maxHp,0));
    const enemyPct = BATTLE.enemies.reduce((s,u)=>s+u.hp,0) / Math.max(1, BATTLE.enemies.reduce((s,u)=>s+u.maxHp,0));
    result = allyPct >= enemyPct ? 'win' : 'lose';
    text = `回合上限 · ${allyPct >= enemyPct ? '我方占优' : '敌方占优'}`;
  }
  battleLog(`—— ${text} ——`, result === 'win' ? 'battle-win' : 'battle-lose');

  const _me = BATTLE.allies.find(u => u.isPlayer);
  if(_me && typeof CORE !== 'undefined' && CORE.battle){
    CORE.battle.stardust = _me.stardust;
    if(typeof saveToPhone === 'function') saveToPhone();
  }

  if(typeof BATTLE.onEnd === 'function') BATTLE.onEnd(result);

  setTimeout(() => {
    if(!BATTLE.active) closeModal('battleModal');
  }, 1800);
}