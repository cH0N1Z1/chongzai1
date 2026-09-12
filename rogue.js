// ============================================================
//  rogue.js - 魂兽猎杀 Roguelike 模式（增强版）
//  纯本地逻辑，不调用 API
//  新增：商人/诅咒宝箱/迷雾岔路/魂兽巢穴；魂兽图鉴；永久升级
// ============================================================

const ROGUE_DATA = {
  monsters: [
    [1, 3, '森林兔', 3, 15, [1, 3], '草药', '风'],
    [1, 3, '幼年灰狼', 5, 22, [2, 5], '兽皮', '土'],
    [2, 5, '毒蛛', 7, 26, [3, 6], '蛛丝', '毒'],
    [3, 6, '赤虎', 10, 38, [5, 10], '虎骨', '火'],
    [4, 7, '铁背熊', 12, 55, [6, 12], '熊胆', '土'],
    [5, 9, '雷纹豹', 16, 48, [8, 15], '雷晶', '雷'],
    [6, 10, '冰蟒', 18, 70, [10, 18], '冰魄', '冰'],
    [7, 12, '暗影狼王', 24, 90, [15, 25], '暗晶', '暗'],
    [9, 14, '烈焰狮', 30, 120, [20, 35], '炎石', '火'],
    [11, 16, '雷霆巨鹰', 38, 140, [28, 45], '雷羽', '雷'],
  ],
  elites: [
    [5, 10, '千年树精', 28, 180, [40, 70], '千年木心', '木'],
    [8, 14, '万年龟王', 35, 280, [60, 100], '龟甲', '水'],
    [10, 18, '幽冥虎王', 55, 320, [80, 150], '幽冥虎魂', '暗'],
  ],
  elements: {
    '火': { strong: '木', weak: '水' },
    '水': { strong: '火', weak: '土' },
    '木': { strong: '土', weak: '火' },
    '土': { strong: '水', weak: '木' },
  },
  events: [
    { type: 'battle', weight: 42 },
    { type: 'treasure', weight: 12 },
    { type: 'shrine', weight: 8 },
    { type: 'elite', weight: 10 },
    { type: 'spring', weight: 8 },
    { type: 'merchant', weight: 8 },
    { type: 'curseBox', weight: 6 },
    { type: 'fork', weight: 4 },
    { type: 'nest', weight: 2 },
  ],
  skills: {
    '十年': [{ name: '基础冲击', dmg: 15, cost: 5 }],
    '百年': [{ name: '魂力爆发', dmg: 25, cost: 10 }],
    '千年': [{ name: '元素斩', dmg: 40, cost: 18 }],
    '万年': [{ name: '魂环共鸣', dmg: 65, cost: 25 }],
    '十万年': [{ name: '天雷破', dmg: 100, cost: 40 }],
  },
  upgrades: [
    { id: 'hp',     name: '体魄淬炼', desc: '初始生命 +20',   cost: 80,  value: 20 },
    { id: 'atk',    name: '魂力凝锋', desc: '初始攻击 +3',    cost: 120, value: 3 },
    { id: 'potion', name: '药囊扩充', desc: '初始药水 +1',    cost: 60,  value: 1 },
    { id: 'soul',   name: '魂力积淀', desc: '初始魂力 +10',   cost: 100, value: 10 },
  ]
};

const ROGUE = { state: null, meta: null, running: false, codex: {}, upgrades: {} };

function rogueRoll(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function roguePick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rogueWeighted(events) {
  const total = events.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of events) { r -= e.weight; if (r <= 0) return e; }
  return events[0];
}
function rogueLoadMeta() {
  try {
    const raw = localStorage.getItem('douro2RogueMeta');
    ROGUE.meta = raw ? JSON.parse(raw) : { gold: 0, bestDepth: 0, runs: 0, wins: 0 };
  } catch (e) { ROGUE.meta = { gold: 0, bestDepth: 0, runs: 0, wins: 0 }; }
  try { const c = localStorage.getItem('douro2RogueCodex'); ROGUE.codex = c ? JSON.parse(c) : {}; } catch (e) { ROGUE.codex = {}; }
  try { const u = localStorage.getItem('douro2RogueUpgrade'); ROGUE.upgrades = u ? JSON.parse(u) : {}; } catch (e) { ROGUE.upgrades = {}; }
}
function rogueSaveMeta() { try { localStorage.setItem('douro2RogueMeta', JSON.stringify(ROGUE.meta)); } catch (e) {} }
function rogueSaveCodex() { try { localStorage.setItem('douro2RogueCodex', JSON.stringify(ROGUE.codex)); } catch (e) {} }
function rogueSaveUpgrades() { try { localStorage.setItem('douro2RogueUpgrade', JSON.stringify(ROGUE.upgrades)); } catch (e) {} }

function rogueEnter() {
  document.getElementById('mode-select').classList.add('hidden');
  const area = document.getElementById('rogue-area');
  area.classList.remove('hidden');
  area.style.display = 'flex';
  rogueLoadMeta();
  rogueShowLobby();
}
function rogueExit() {
  if (ROGUE.running && !confirm('离开会放弃本局收获，确定？')) return;
  ROGUE.running = false;
  ROGUE.state = null;
  document.getElementById('rogue-area').style.display = 'none';
  document.getElementById('mode-select').classList.remove('hidden');
}
function rogueShowLobby() {
  const m = ROGUE.meta;
  const el = document.getElementById('rogue-content');
  el.innerHTML = `
    <div class="rogue-lobby">
      <h2>魂兽猎杀</h2>
      <p class="rogue-sub">深入魂兽森林，猎杀魂兽，满载而归或是横死荒野。</p>
      <div class="rogue-meta">
        <div><span class="rogue-meta-label">金币</span><span class="rogue-meta-value">${m.gold}</span></div>
        <div><span class="rogue-meta-label">最深层数</span><span class="rogue-meta-value">${m.bestDepth}</span></div>
        <div><span class="rogue-meta-label">总场次</span><span class="rogue-meta-value">${m.runs}</span></div>
      </div>
      <button class="rogue-btn-primary" onclick="rogueStartRun()">开始狩猎</button>
      <button class="rogue-btn-ghost" onclick="rogueOpenCodex()">魂兽图鉴</button>
      <button class="rogue-btn-ghost" onclick="rogueOpenUpgrades()">永久升级</button>
      <button class="rogue-btn-ghost" onclick="rogueExit()">返回主界面</button>
      <div class="rogue-rules">
        <h4>玩法</h4>
        <ul>
          <li>每深入一层，魂兽更强，掉落更好</li>
          <li>随时可以「撤退」，保留收获</li>
          <li>阵亡 = 本局收获清零</li>
          <li>属性克制：火→木→土→水→火（+50%伤害）</li>
          <li>金币可在「永久升级」处消费，跨局生效</li>
        </ul>
      </div>
    </div>`;
}
function rogueOpenCodex(){
  const el = document.getElementById('rogue-content');
  const all = [...ROGUE_DATA.monsters, ...ROGUE_DATA.elites];
  const rows = all.map(m => {
    const key = m[2];
    const known = ROGUE.codex[key];
    const isElite = ROGUE_DATA.elites.includes(m);
    if(known){
      return `<div class="codex-item known${isElite?' elite':''}">
        <div class="codex-name">${escapeHtml(m[2])}${isElite?' ★':''}</div>
        <div class="codex-info">层级 ${m[0]}-${m[1]} · 属性 ${m[7]} · 掉落 ${escapeHtml(m[6])}</div>
        <div class="codex-count">遇到 ${known.seen} 次 · 击杀 ${known.kills} 次</div>
      </div>`;
    }
    return `<div class="codex-item"><div class="codex-name">？？？${isElite?' ★':''}</div><div class="codex-info">未记录</div></div>`;
  }).join('');
  el.innerHTML = `<div class="rogue-lobby"><h2>魂兽图鉴</h2><p class="rogue-sub">记录你遇到过的魂兽</p><div class="codex-list">${rows}</div><button class="rogue-btn-ghost" onclick="rogueShowLobby()">返回大厅</button></div>`;
}
function rogueOpenUpgrades(){
  const el = document.getElementById('rogue-content');
  const gold = ROGUE.meta.gold;
  const rows = ROGUE_DATA.upgrades.map(u => {
    const lv = ROGUE.upgrades[u.id] || 0;
    const cost = u.cost * (lv + 1);
    const can = gold >= cost;
    return `<div class="upgrade-item">
      <div><div class="upgrade-name">${u.name} <span class="upgrade-lv">Lv.${lv}</span></div>
      <div class="upgrade-desc">${u.desc} · 升级需 ${cost} 金币</div></div>
      <button class="upgrade-btn${can?'':' disabled'}" ${can?'':'disabled'} onclick="rogueBuyUpgrade('${u.id}')">升级</button>
    </div>`;
  }).join('');
  el.innerHTML = `<div class="rogue-lobby"><h2>永久升级</h2><p class="rogue-sub">当前金币：<b>${gold}</b>（跨局累积）</p><div class="upgrade-list">${rows}</div><button class="rogue-btn-ghost" onclick="rogueShowLobby()">返回大厅</button></div>`;
}
function rogueBuyUpgrade(id){
  const u = ROGUE_DATA.upgrades.find(x => x.id === id);
  if(!u) return;
  const lv = ROGUE.upgrades[id] || 0;
  const cost = u.cost * (lv + 1);
  if(ROGUE.meta.gold < cost) return alert('金币不足');
  ROGUE.meta.gold -= cost;
  ROGUE.upgrades[id] = lv + 1;
  rogueSaveMeta(); rogueSaveUpgrades();
  rogueOpenUpgrades();
}

function rogueStartRun() {
  const up = ROGUE.upgrades;
  let player = {
    name: '无名猎手',
    hp: 100 + (up.hp||0)*20, maxHp: 100 + (up.hp||0)*20,
    atk: 12 + (up.atk||0)*3,
    soulPower: 10 + (up.soul||0)*10,
    element: '火',
    skills: [{ name: '基础冲击', dmg: 15, cost: 5 }],
    potions: 2 + (up.potion||0),
    inventory: [], gold: 0,
  };
  try {
    const raw = localStorage.getItem(typeof slotKey==='function' ? slotKey() : 'douro2Save_1');
    if (raw) {
      const data = JSON.parse(raw);
      const c = data.core || {};
      if (c.name) player.name = c.name;
      const sp = c.soulPower || 10;
      player.soulPower = sp + (up.soul||0)*10;
      player.maxHp = 40 + sp * 8 + (up.hp||0)*20;
      player.hp = player.maxHp;
      player.atk = 8 + Math.floor(sp * 0.8) + (up.atk||0)*3;
      const soul = c.martialSoul || '';
      if (/火|炎|焰|凤/.test(soul)) player.element = '火';
      else if (/冰|水|海|雪/.test(soul)) player.element = '水';
      else if (/木|草|花|藤|莲/.test(soul)) player.element = '木';
      else if (/土|石|岩|龟/.test(soul)) player.element = '土';
      const rings = c.rings || [];
      const skillList = [];
      for (const tier of ['十年','百年','千年','万年','十万年']) {
        if (rings.some(r => (r.name || r || '').includes(tier))) {
          (ROGUE_DATA.skills[tier] || []).forEach(s => skillList.push({ ...s }));
        }
      }
      if (skillList.length === 0) skillList.push({ name: '基础冲击', dmg: 15, cost: 5 });
      player.skills = skillList;
    }
  } catch (e) {}
  ROGUE.state = { depth: 1, maxDepth: 1, player, loot: { gold: 0, materials: [] }, log: [], current: null, phase: 'idle', nestRemaining: 0 };
  ROGUE.running = true;
  ROGUE.meta.runs++;
  rogueSaveMeta();
  rogueRender();
  rogueNextFloor();
}

function rogueNextFloor() {
  if (!ROGUE.running) return;
  const s = ROGUE.state;
  if(s.nestRemaining > 0){
    s.nestRemaining--;
    s.phase = 'battle';
    s.current = rogueCreateEvent('battle');
    s.current.isNest = true;
    if(s.current && s.current.name){
      if(!ROGUE.codex[s.current.name]) ROGUE.codex[s.current.name] = { seen: 0, kills: 0 };
      ROGUE.codex[s.current.name].seen++;
      rogueSaveCodex();
    }
    rogueRender();
    return;
  }
  const ev = rogueWeighted(ROGUE_DATA.events);
  s.phase = ev.type;
  s.current = rogueCreateEvent(ev.type);
  if(s.current && s.current.kind === 'battle' && s.current.name){
    if(!ROGUE.codex[s.current.name]) ROGUE.codex[s.current.name] = { seen: 0, kills: 0 };
    ROGUE.codex[s.current.name].seen++;
    rogueSaveCodex();
  }
  rogueRender();
}

function rogueCreateEvent(type) {
  const s = ROGUE.state;
  const d = s.depth;
  if (type === 'battle' || type === 'elite') {
    const pool = type === 'elite' ? ROGUE_DATA.elites : ROGUE_DATA.monsters;
    const candidates = pool.filter(m => d >= m[0] && d <= m[1]);
    const m = candidates.length ? roguePick(candidates) : pool[0];
    const scale = 1 + (d - m[0]) * 0.08;
    return { kind: 'battle', isElite: type === 'elite', name: m[2],
      hp: Math.round(m[4] * scale), maxHp: Math.round(m[4] * scale), atk: Math.round(m[3] * scale),
      gold: [m[5][0], m[5][1]], material: m[6], element: m[7], turn: 1 };
  }
  if (type === 'treasure') return { kind: 'treasure', gold: rogueRoll(5 + d * 3, 12 + d * 6) };
  if (type === 'spring') return { kind: 'spring' };
  if (type === 'shrine') {
    const bonuses = [
      { type: 'atk', value: 2, name: '力量神龛' },
      { type: 'maxHp', value: 15, name: '生命神龛' },
      { type: 'potion', value: 1, name: '药水神龛' },
    ];
    return { kind: 'shrine', ...roguePick(bonuses) };
  }
  if (type === 'merchant') {
    const pool = [
      { name:'药水', desc:'恢复 40 HP', cost: 15, kind:'potion' },
      { name:'魂力药剂', desc:'+30 魂力', cost: 25, kind:'soul', value:30 },
      { name:'磨刀石', desc:'攻击 +2', cost: 30, kind:'atk', value:2 },
      { name:'护心甲', desc:'最大生命 +20', cost: 35, kind:'maxHp', value:20 },
      { name:'魂技卷轴', desc:'随机魂技', cost: 50, kind:'skill' },
    ];
    const chosen = []; const cp = [...pool];
    for(let i=0;i<3 && cp.length;i++){
      chosen.push(cp.splice(Math.floor(Math.random()*cp.length),1)[0]);
    }
    return { kind: 'merchant', items: chosen };
  }
  if (type === 'curseBox') {
    return { kind: 'curseBox', gold: rogueRoll(20 + d*5, 40 + d*10), dmg: Math.round(s.player.maxHp * 0.3) };
  }
  if (type === 'fork') return { kind: 'fork' };
  if (type === 'nest') return { kind: 'nest', remaining: 3 };
  return { kind: 'empty' };
}

function rogueElementMult(attackerEl, defenderEl) {
  const e = ROGUE_DATA.elements[attackerEl];
  if (!e) return 1;
  if (e.strong === defenderEl) return 1.5;
  if (e.weak === defenderEl) return 0.7;
  return 1;
}

function rogueAttack() {
  const s = ROGUE.state;
  if (!s.current || s.current.kind !== 'battle' || s.phase === 'dead') return;
  const p = s.player; const m = s.current;
  const dmg = Math.max(1, Math.round((p.atk + rogueRoll(-2, 3)) * rogueElementMult(p.element, m.element)));
  m.hp -= dmg;
  s.log.unshift(`你发动攻击，造成 ${dmg} 点伤害。`);
  if (m.hp <= 0) { rogueVictory(); return; }
  rogueEnemyTurn();
}
function rogueUseSkill(idx) {
  const s = ROGUE.state; const p = s.player;
  if (!s.current || s.current.kind !== 'battle' || s.phase === 'dead') return;
  const sk = p.skills[idx]; if (!sk) return;
  if (p.soulPower < sk.cost) { alert('魂力不足'); return; }
  p.soulPower -= sk.cost;
  const m = s.current;
  const dmg = Math.max(1, Math.round((sk.dmg + rogueRoll(-3, 5)) * rogueElementMult(p.element, m.element)));
  m.hp -= dmg;
  s.log.unshift(`你使用【${sk.name}】，造成 ${dmg} 点伤害。`);
  if (m.hp <= 0) { rogueVictory(); return; }
  rogueEnemyTurn();
}
function rogueUsePotion() {
  const s = ROGUE.state; const p = s.player;
  if (p.potions <= 0) { alert('没有药水了'); return; }
  p.potions--; p.hp = Math.min(p.maxHp, p.hp + 40);
  s.log.unshift('你喝下药水，恢复 40 点生命。');
  rogueEnemyTurn();
}
function rogueFlee() {
  const s = ROGUE.state;
  if (Math.random() < 0.6) {
    s.log.unshift('你成功脱离了战斗。');
    s.phase = 'retreat'; s.current = { kind: 'retreat' };
    rogueRender();
  } else { s.log.unshift('逃跑失败！'); rogueEnemyTurn(); }
}
function rogueEnemyTurn() {
  const s = ROGUE.state; const m = s.current; const p = s.player;
  if (m.hp <= 0) return;
  const dmg = Math.max(1, Math.round((m.atk + rogueRoll(-2, 3)) * rogueElementMult(m.element, p.element)));
  p.hp -= dmg;
  s.log.unshift(`【${m.name}】攻击你，造成 ${dmg} 点伤害。`);
  if (p.hp <= 0) { rogueDeath(); return; }
  m.turn++;
  rogueRender();
}
function rogueVictory() {
  const s = ROGUE.state; const m = s.current;
  let g = rogueRoll(m.gold[0], m.gold[1]);
  if(m.isNest) g = Math.round(g * 2);
  s.loot.gold += g;
  s.loot.materials.push(m.material);
  if(m.name && ROGUE.codex[m.name]){ ROGUE.codex[m.name].kills++; rogueSaveCodex(); }
  s.log.unshift(`击败【${m.name}】！获得 ${g} 金币 和 ${m.material} ×1。`);
  s.phase = 'reward'; s.current = null;
  rogueRender();
}
function rogueDeath() {
  const s = ROGUE.state;
  s.phase = 'dead';
  s.log.unshift('你倒下了……');
  ROGUE.running = false;
  rogueRender();
}
function rogueOpenTreasure() {
  const s = ROGUE.state;
  s.loot.gold += s.current.gold;
  s.log.unshift(`打开宝箱，获得 ${s.current.gold} 金币。`);
  s.phase = 'reward'; s.current = null; rogueRender();
}
function rogueDrinkSpring() {
  const s = ROGUE.state;
  s.player.hp = s.player.maxHp;
  s.log.unshift('你饮下泉水，生命全满。');
  s.phase = 'reward'; s.current = null; rogueRender();
}
function rogueUseShrine() {
  const s = ROGUE.state; const c = s.current; const p = s.player;
  if (c.type === 'atk') { p.atk += c.value; s.log.unshift(`你触摸${c.name}，攻击力 +${c.value}。`); }
  if (c.type === 'maxHp') { p.maxHp += c.value; p.hp += c.value; s.log.unshift(`你触摸${c.name}，最大生命 +${c.value}。`); }
  if (c.type === 'potion') { p.potions += c.value; s.log.unshift(`你获得 ${c.value} 瓶药水。`); }
  s.phase = 'reward'; s.current = null; rogueRender();
}
function rogueBuyMerchant(idx){
  const s = ROGUE.state; const c = s.current;
  if(!c || c.kind !== 'merchant') return;
  const it = c.items[idx]; if(!it) return;
  if(s.loot.gold < it.cost) return alert('本局金币不足');
  s.loot.gold -= it.cost;
  const p = s.player;
  if(it.kind === 'potion'){ p.potions += 1; s.log.unshift('购买药水 ×1。'); }
  else if(it.kind === 'soul'){ p.soulPower += it.value; s.log.unshift(`购买魂力药剂，魂力 +${it.value}。`); }
  else if(it.kind === 'atk'){ p.atk += it.value; s.log.unshift(`购买磨刀石，攻击 +${it.value}。`); }
  else if(it.kind === 'maxHp'){ p.maxHp += it.value; p.hp += it.value; s.log.unshift(`购买护心甲，最大生命 +${it.value}。`); }
  else if(it.kind === 'skill'){
    const pool = Object.values(ROGUE_DATA.skills).flat();
    const sk = roguePick(pool);
    p.skills.push({...sk});
    s.log.unshift(`购买魂技卷轴，学会【${sk.name}】。`);
  }
  c.items.splice(idx,1);
  rogueRender();
}
function rogueLeaveMerchant(){
  const s = ROGUE.state;
  s.phase = 'reward'; s.current = null; rogueRender();
}
function rogueOpenCurse(){
  const s = ROGUE.state; const c = s.current;
  s.loot.gold += c.gold;
  s.player.hp = Math.max(1, s.player.hp - c.dmg);
  s.log.unshift(`宝箱有诅咒！失去 ${c.dmg} 生命，获得 ${c.gold} 金币。`);
  s.phase = 'reward'; s.current = null; rogueRender();
}
function rogueForkChoice(choice){
  const s = ROGUE.state; s.current = null;
  if(choice === 'left'){
    s.log.unshift('你走入迷雾左侧，空气骤然变冷……');
    s.phase = 'battle';
    s.current = rogueCreateEvent('battle');
    s.current.isNest = true;
    if(s.current.name){
      if(!ROGUE.codex[s.current.name]) ROGUE.codex[s.current.name] = { seen: 0, kills: 0 };
      ROGUE.codex[s.current.name].seen++;
      rogueSaveCodex();
    }
  } else {
    const g = rogueRoll(5 + s.depth * 2, 12 + s.depth * 3);
    s.loot.gold += g;
    s.log.unshift(`你走右侧平坦小路，捡到 ${g} 金币。`);
    s.phase = 'reward';
  }
  rogueRender();
}
function rogueEnterNest(){
  const s = ROGUE.state;
  s.nestRemaining = s.current.remaining;
  s.log.unshift(`你踏入魂兽巢穴，共 ${s.nestRemaining} 波魂兽来袭！`);
  s.phase = 'battle';
  s.current = rogueCreateEvent('battle');
  s.current.isNest = true;
  if(s.current.name){
    if(!ROGUE.codex[s.current.name]) ROGUE.codex[s.current.name] = { seen: 0, kills: 0 };
    ROGUE.codex[s.current.name].seen++;
    rogueSaveCodex();
  }
  rogueRender();
}
function rogueSkipNest(){
  const s = ROGUE.state;
  const g = rogueRoll(10 + s.depth * 3, 20 + s.depth * 5);
  s.loot.gold += g;
  s.log.unshift(`你绕开巢穴，获得 ${g} 金币。`);
  s.phase = 'reward'; s.current = null; rogueRender();
}

function rogueAdvance() {
  const s = ROGUE.state;
  if(s.nestRemaining > 0){ rogueNextFloor(); return; }
  s.depth++;
  s.maxDepth = Math.max(s.maxDepth, s.depth);
  rogueNextFloor();
}
function rogueRetreat() {
  const s = ROGUE.state;
  ROGUE.running = false;
  ROGUE.meta.gold += s.loot.gold;
  if (s.maxDepth > ROGUE.meta.bestDepth) ROGUE.meta.bestDepth = s.maxDepth;
  ROGUE.meta.wins++;
  rogueSaveMeta();
  s.phase = 'retreat-success';
  rogueRender();
}

function rogueRender() {
  const s = ROGUE.state;
  const el = document.getElementById('rogue-content');
  if (!s) { rogueShowLobby(); return; }
  const p = s.player;
  const hpPct = Math.max(0, p.hp / p.maxHp * 100);
  let body = '';
  if (s.phase === 'dead') {
    body = `<div class="rogue-dead"><h3>☠ 你倒下了</h3>
      <p>本局收获（${s.loot.gold} 金币、${s.loot.materials.length} 件材料）全部丢失。</p>
      <button class="rogue-btn-primary" onclick="rogueShowLobby()">回到大厅</button></div>`;
  } else if (s.phase === 'retreat-success') {
    body = `<div class="rogue-win"><h3>🏆 满载而归</h3>
      <p>最深抵达第 ${s.maxDepth} 层。</p>
      <p>带回金币：<b>${s.loot.gold}</b>；材料：${s.loot.materials.length ? s.loot.materials.join('、') : '无'}</p>
      <button class="rogue-btn-primary" onclick="rogueShowLobby()">回到大厅</button></div>`;
  } else if (s.phase === 'battle' && s.current) {
    const m = s.current;
    const mHpPct = Math.max(0, m.hp / m.maxHp * 100);
    const nestTag = m.isNest ? ` <span class="rogue-el" style="background:#6b21a8;color:#fff;">巢穴 ×${s.nestRemaining + 1}</span>` : '';
    body = `<div class="rogue-battle">
      <div class="rogue-enemy">
        <div class="rogue-enemy-name">${m.isElite ? '★ ' : ''}${m.name} <span class="rogue-el">${m.element}</span>${nestTag}</div>
        <div class="rogue-bar"><div class="rogue-bar-fill rogue-hp-enemy" style="width:${mHpPct}%"></div><span class="rogue-bar-text">${m.hp} / ${m.maxHp}</span></div>
      </div>
      <div class="rogue-log">${s.log.slice(0, 4).map(l => `<div class="rogue-log-line">${escapeHtml(l)}</div>`).join('')}</div>
      <div class="rogue-actions">
        <button class="rogue-btn" onclick="rogueAttack()">普通攻击</button>
        ${p.skills.map((sk, i) => `<button class="rogue-btn rogue-btn-skill" onclick="rogueUseSkill(${i})">${escapeHtml(sk.name)}<small>${sk.cost}魂力</small></button>`).join('')}
        <button class="rogue-btn rogue-btn-potion" onclick="rogueUsePotion()">药水 ×${p.potions}</button>
        <button class="rogue-btn rogue-btn-flee" onclick="rogueFlee()">逃跑</button>
      </div></div>`;
  } else if (s.phase === 'treasure') {
    body = `<div class="rogue-event"><h3>💰 发现宝箱</h3><p>一个古老的魂导宝箱静静躺在树根下。</p><button class="rogue-btn-primary" onclick="rogueOpenTreasure()">打开</button></div>`;
  } else if (s.phase === 'spring') {
    body = `<div class="rogue-event"><h3>💧 生命泉</h3><p>清澈的泉水泛着微光，喝一口感觉浑身舒畅。</p><button class="rogue-btn-primary" onclick="rogueDrinkSpring()">饮下</button></div>`;
  } else if (s.phase === 'shrine') {
    body = `<div class="rogue-event"><h3>⛩ ${s.current.name}</h3><p>一座古老神龛，散发着温和的力量。</p><button class="rogue-btn-primary" onclick="rogueUseShrine()">祈祷</button></div>`;
  } else if (s.phase === 'merchant') {
    const items = s.current.items.map((it, i) =>
      `<button class="rogue-btn merchant-btn" onclick="rogueBuyMerchant(${i})">${escapeHtml(it.name)}<small>${it.desc} · ${it.cost}金</small></button>`
    ).join('');
    body = `<div class="rogue-event"><h3>🧳 神秘商人</h3><p>他递给你一张货单：「看看有什么中意的。」</p>
      <div class="rogue-actions">${items}</div>
      <button class="rogue-btn-ghost" onclick="rogueLeaveMerchant()">离开</button></div>`;
  } else if (s.phase === 'curseBox') {
    body = `<div class="rogue-event"><h3>🩸 诅咒宝箱</h3><p>宝箱表面刻着扭曲的符文，似乎以生命为代价。</p>
      <p style="color:#f87171;font-size:13px;">代价：${s.current.dmg} 生命 · 奖励：${s.current.gold} 金币</p>
      <button class="rogue-btn-primary" onclick="rogueOpenCurse()">打开（承伤）</button>
      <button class="rogue-btn-ghost" onclick="rogueLeaveMerchant()">绕开</button></div>`;
  } else if (s.phase === 'fork') {
    body = `<div class="rogue-event"><h3>🌫 迷雾岔路</h3><p>前方两条路被浓雾笼罩，看不清尽头。</p>
      <div class="rogue-actions">
        <button class="rogue-btn" onclick="rogueForkChoice('left')">走左侧（危险·奖励×2）</button>
        <button class="rogue-btn" onclick="rogueForkChoice('right')">走右侧（安全·少量金币）</button>
      </div></div>`;
  } else if (s.phase === 'nest') {
    body = `<div class="rogue-event"><h3>🕳 魂兽巢穴</h3><p>洞穴深处传来低沉的兽吼，${s.current.remaining} 波魂兽盘踞其间。</p>
      <div class="rogue-actions">
        <button class="rogue-btn-primary" onclick="rogueEnterNest()">闯入（奖励×2）</button>
        <button class="rogue-btn-ghost" onclick="rogueSkipNest()">绕行</button>
      </div></div>`;
  } else if (s.phase === 'retreat') {
    body = `<div class="rogue-event"><h3>成功脱离</h3><p>你暂时摆脱了危险，可以选择继续深入或撤退。</p>
      <div class="rogue-actions">
        <button class="rogue-btn-primary" onclick="rogueAdvance()">继续深入第 ${s.depth + 1} 层</button>
        <button class="rogue-btn-ghost" onclick="rogueRetreat()">撤退，保留收获</button>
      </div></div>`;
  } else if (s.phase === 'reward') {
    const nestAdvance = s.nestRemaining > 0 ? `巢穴剩余 ${s.nestRemaining} 波` : `当前：第 ${s.depth} 层`;
    const advanceBtn = s.nestRemaining > 0
      ? `<button class="rogue-btn-primary" onclick="rogueAdvance()">继续下一波巢穴</button>`
      : `<button class="rogue-btn-primary" onclick="rogueAdvance()">继续深入第 ${s.depth + 1} 层</button>`;
    const retreatBtn = s.nestRemaining > 0 ? '' : `<button class="rogue-btn-ghost" onclick="rogueRetreat()">撤退，保留收获</button>`;
    body = `<div class="rogue-event"><h3>✓ 收获</h3>
      <p>${nestAdvance} · 金币 ${s.loot.gold} · 材料 ${s.loot.materials.length} 件</p>
      <div class="rogue-actions">${advanceBtn}${retreatBtn}</div></div>`;
  }
  el.innerHTML = `
    <div class="rogue-header"><div class="rogue-title">第 ${s.depth} 层</div>
      <button class="rogue-btn-ghost rogue-exit-btn" onclick="rogueExit()">×</button></div>
    <div class="rogue-status">
      <div class="rogue-bar rogue-bar-hp"><div class="rogue-bar-fill rogue-hp-player" style="width:${hpPct}%"></div>
        <span class="rogue-bar-text">❤ ${p.hp} / ${p.maxHp}</span></div>
      <div class="rogue-stats">
        <span>⚔ 攻击 ${p.atk}</span><span>⚡ 魂力 ${p.soulPower}</span>
        <span>💰 ${s.loot.gold}</span><span>🧪 ${p.potions}</span>
      </div>
    </div>
    ${body}
  `;
}