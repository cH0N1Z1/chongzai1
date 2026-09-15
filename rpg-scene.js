// ============================================================
//  rpg-scene.js - 固定剧情引擎
//  依赖：shared.js → rpg-core.js
//  读取 story.json，按节点播放。
//  支持「自动」与「跳过」。
// ============================================================

// ============================================================
//  剧情库
// ============================================================
const STORY = { loaded: false, scenes: {} };

async function loadStory(){
  if(STORY.loaded) return;
  try {
    const r = await fetch('./story.json');
    const data = await r.json();
    if(data && data.scenes) STORY.scenes = data.scenes;
    STORY.loaded = true;
  } catch(e) {
    console.warn('剧情库加载失败', e);
  }
}

// ============================================================
//  占位符替换
// ============================================================
function fillVars(text, vars){
  return String(text == null ? '' : text).replace(/\{(\w+)\}/g, function(m, k){
    return (vars && vars[k] !== undefined && vars[k] !== null) ? String(vars[k]) : m;
  });
}

// ============================================================
//  播放控制：自动 / 跳过
// ============================================================
let _skipRequested = false;
let _autoMode = false;
let _autoTimer = null;
let _playingScene = false;

function showPlayControls(){
  const el = document.getElementById('play-controls');
  if(el) el.classList.remove('hidden');
}
function hidePlayControls(){
  const el = document.getElementById('play-controls');
  if(el) el.classList.add('hidden');
}
function updatePlayControls(){
  const autoBtn = document.getElementById('btnAuto');
  const skipBtn = document.getElementById('btnSkip');
  if(autoBtn) autoBtn.classList.toggle('active', _autoMode);
  if(skipBtn) skipBtn.classList.toggle('active', _skipRequested);
}

function toggleAuto(){
  _autoMode = !_autoMode;
  updatePlayControls();
  if(_autoMode){
    if(_awaitingClick){
      const fn = _awaitingClick;
      _awaitingClick = null;
      if(_autoTimer){ clearTimeout(_autoTimer); _autoTimer = null; }
      fn();
    }
  } else {
    if(_autoTimer){ clearTimeout(_autoTimer); _autoTimer = null; }
  }
}

function toggleSkip(){
  _skipRequested = true;
  updatePlayControls();
  if(_awaitingClick){
    const fn = _awaitingClick;
    _awaitingClick = null;
    if(_autoTimer){ clearTimeout(_autoTimer); _autoTimer = null; }
    fn();
  }
}

// ============================================================
//  点击推进
// ============================================================
let _awaitingClick = null;
let _clickHintTimer = null;
let _clickHintEverShown = false;

function showClickHint(){
  const hint = document.getElementById('click-hint');
  if(hint) hint.classList.add('show');
}
function hideClickHint(){
  const hint = document.getElementById('click-hint');
  if(hint) hint.classList.remove('show');
}
function resetClickHint(){ _clickHintEverShown = false; }

function awaitClick(){
  return new Promise(resolve => {
    if(_skipRequested){ resolve(); return; }

    let done = false;
    const finish = () => {
      if(done) return;
      done = true;
      if(_autoTimer){ clearTimeout(_autoTimer); _autoTimer = null; }
      if(_clickHintTimer){ clearTimeout(_clickHintTimer); _clickHintTimer = null; }
      if(_awaitingClick === finish) _awaitingClick = null;
      hideClickHint();
      resolve();
    };

    _awaitingClick = finish;

    if(_autoMode){
      _autoTimer = setTimeout(finish, 2200);
    } else {
      if(!_clickHintEverShown){
        _clickHintEverShown = true;
        showClickHint();
      } else {
        _clickHintTimer = setTimeout(showClickHint, 2500);
      }
    }
  });
}

function triggerClick(){
  if(_awaitingClick){
    const fn = _awaitingClick;
    _awaitingClick = null;
    if(_autoTimer){ clearTimeout(_autoTimer); _autoTimer = null; }
    fn();
  }
}

function setupClickToContinue(){
  const area = document.getElementById('chat-wrap') || document.getElementById('chat-box');
  if(!area) return;
  if(area._clickBound) return;
  area._clickBound = true;
  area.addEventListener('click', function(e){
    const t = e.target;
    if(t && t.closest && t.closest('button, input, textarea, select, a, .option-btn')) return;

    if(_autoMode){
      _autoMode = false;
      if(_autoTimer){ clearTimeout(_autoTimer); _autoTimer = null; }
      updatePlayControls();
    }

    if(_awaitingClick) triggerClick();
  });
}

// ============================================================
//  播放段落
// ============================================================
async function playSegment(html, speaker){
  const div = document.createElement('div');
  div.className = 'msg-ai';
  div.style.animation = 'msgSlideIn .32s ease-out';
  if(speaker){
    div.innerHTML = `<div class="speaker-tag">${escapeHtml(speaker)}</div>${html}`;
  } else {
    div.innerHTML = html;
  }
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  await awaitClick();
}

async function playNarrative(text){
  return playSegment(formatNarrative(escapeHtml(text)));
}

async function playSpeak(text, speaker){
  return playSegment(`<div class="hl-speak">${escapeHtml(text)}</div>`, speaker);
}

// ============================================================
//  特殊样式
// ============================================================
function buildCardHtml(title, sub){
  return `<div style="text-align:center;margin:12px 0;padding:14px;border:1px dashed #30363d;border-radius:8px;color:#f0f6fc;">`
    + `<div style="font-weight:bold;font-size:15px;">${escapeHtml(title||'')}</div>`
    + (sub ? `<div style="color:#8b949e;font-size:13px;margin-top:6px;">${escapeHtml(sub)}</div>` : '')
    + `</div>`;
}

function buildFxHtml(style, text){
  const t = escapeHtml(text||'');
  if(style === 'purple'){
    return `<div style="text-align:center;font-weight:bold;color:#a855f7;font-size:18px;margin:10px 0;letter-spacing:2px;">${t}</div>`;
  }
  return `<div style="text-align:center;font-weight:bold;color:#fbbf24;font-size:16px;margin:10px 0;">${t}</div>`;
}

// ============================================================
//  战斗 · 组装配置
// ============================================================
async function buildBattleConfig(enemyName, count, field){
  await loadBattleData();
  const data = BATTLE_DATA || { skills:{}, enemies:{} };
  const tpl = data.enemies && data.enemies[enemyName];
  if(!tpl) return null;

  const enemies = [];
  const n = Math.max(1, count || 1);
  for(let i = 0; i < n; i++){
    enemies.push(Object.assign({}, tpl, {
      side: 'enemy',
      name: n > 1 ? (enemyName + ' ' + (i+1)) : enemyName
    }));
  }

  const cb = CORE.battle || {};
  const skills = [];
  (cb.skills || []).forEach(name => {
    // 优先从 battle.json 找
    const s = data.skills && data.skills[name];
    if(s){ skills.push(Object.assign({}, s)); return; }
    // 找不到就从 CORE.forms 找（AI 生成的形态）
    const f = (CORE.forms || []).find(x => x && x.name === name && x.unlocked !== false);
    if(f){
      const out = {
        name: f.name,
        type: f.type || ['攻击'],
        cost: f.cost || 0,
        power: f.power || 0,
        target: f.target || 'one'
      };
      if(f.effect) out.effect = f.effect;
      if(typeof f.effectValue === 'number') out.effectValue = f.effectValue;
      if(typeof f.effectChance === 'number') out.effectChance = f.effectChance;
      if(typeof f.effectDuration === 'number') out.effectDuration = f.effectDuration;
      skills.push(out);
    }
  });
  if(skills.length === 0){
    skills.push({ name: '普通攻击', type: ['攻击'], cost: 0, power: 50, target: 'one' });
  }

  const player = {
    name: CORE.name || '你',
    side: 'ally',
    isPlayer: true,
    hp: cb.maxHp || 1000,
    maxHp: cb.maxHp || 1000,
    atk: cb.atk || 50,
    def: cb.def || 30,
    speed: cb.speed || 100,
    stardust: (typeof cb.stardust === 'number') ? cb.stardust : (cb.maxStardust || 100),
    maxStardust: cb.maxStardust || 100,
    skills: skills,
    avatar: CORE.avatar || ''
  };

  const allies = [player];

  // 宫守琴固定入队（测试用）
  if(typeof CHARACTERS !== 'undefined' && Array.isArray(CHARACTERS.classmates)){
    const qin = CHARACTERS.classmates.find(c => c.name === '宫守琴');
    if(qin && qin.battle && qin.battle['1']){
      const bd = qin.battle['1'];
      const qinSkills = [];
      (bd.skills || []).forEach(name => {
        const s = data.skills && data.skills[name];
        if(s) qinSkills.push(Object.assign({}, s));
      });
      if(qinSkills.length === 0){
        qinSkills.push({ name: '普通攻击', type: ['攻击'], cost: 0, power: 50, target: 'one' });
      }
      allies.push({
        name: qin.name,
        side: 'ally',
        isPlayer: false,
        hp: bd.hp,
        maxHp: bd.hp,
        atk: bd.atk,
        def: bd.def,
        speed: bd.speed,
        stardust: bd.maxStardust || 60,
        maxStardust: bd.maxStardust || 60,
        skills: qinSkills,
        avatar: ''
      });
    }
  }

  return { allies: allies, enemies: enemies, field: field || null };
}

// 跑一场战斗，等它结束
async function runBattleStep(step, vars){
  const enemyName = fillVars(step.enemy, vars);
  const count = step.count || 1;
  const field = step.field || null;
  const cfg = await buildBattleConfig(enemyName, count, field);
  if(!cfg){
    console.warn('战斗配置生成失败：' + enemyName);
    return null;
  }
  const result = await new Promise(resolve => {
    cfg.onEnd = (r) => resolve(r);
    startBattle(cfg);
  });
  if(vars) vars.battleResult = result;
  return result;
}

// ============================================================
//  播放一个场景
// ============================================================
async function playScene(sceneId, vars){
  await loadStory();
  const scene = STORY.scenes[sceneId];
  if(!scene){
    console.warn('剧情不存在：' + sceneId);
    return false;
  }

  const isRoot = !_playingScene;
  if(isRoot){
    _playingScene = true;
    _skipRequested = false;
    _autoMode = false;
    updatePlayControls();
    showPlayControls();
  }

  try {
    const steps = Array.isArray(scene.steps) ? scene.steps : [];
    for(const step of steps){
      const type = step.type || 'narrate';

      if(type === 'narrate'){
        await playNarrative(fillVars(step.text, vars));
      } else if(type === 'speak'){
        await playSpeak(fillVars(step.text, vars), fillVars(step.speaker, vars));
      } else if(type === 'card'){
        await playSegment(buildCardHtml(fillVars(step.title, vars), fillVars(step.sub, vars)));
      } else if(type === 'fx'){
        await playSegment(buildFxHtml(step.style, fillVars(step.text, vars)));
      } else if(type === 'pause'){
        await awaitClick();
      } else if(type === 'battle'){
        // 战斗不进快速跳过，正常打开战斗窗口
        const wasSkip = _skipRequested;
        _skipRequested = false;
        const result = await runBattleStep(step, vars);
        _skipRequested = wasSkip;
        const branch = result === 'win' ? step.onWin : step.onLose;
        if(branch){
          await playScene(branch, vars);
        }
      }
    }
  } finally {
    if(isRoot){
      _playingScene = false;
      _skipRequested = false;
      _autoMode = false;
      if(_autoTimer){ clearTimeout(_autoTimer); _autoTimer = null; }
      hidePlayControls();
      updatePlayControls();
    }
  }
  return true;
}