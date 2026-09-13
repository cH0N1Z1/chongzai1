// ============================================================
//  rpg-scene.js - 固定剧情引擎
//  依赖：shared.js → rpg-core.js
//  读取 story.json，按节点播放。
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
    _awaitingClick = () => {
      hideClickHint();
      if(_clickHintTimer){ clearTimeout(_clickHintTimer); _clickHintTimer = null; }
      resolve();
    };
    if(!_clickHintEverShown){
      _clickHintEverShown = true;
      showClickHint();
    } else {
      _clickHintTimer = setTimeout(showClickHint, 2500);
    }
  });
}

function triggerClick(){
  if(_awaitingClick){
    const fn = _awaitingClick;
    _awaitingClick = null;
    fn();
  }
}

function setupClickToContinue(){
  const area = document.getElementById('chat-box');
  if(!area) return;
  if(area._clickBound) return;
  area._clickBound = true;
  area.addEventListener('click', triggerClick);
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
//  播放一个场景
// ============================================================
async function playScene(sceneId, vars){
  await loadStory();
  const scene = STORY.scenes[sceneId];
  if(!scene){
    console.warn('剧情不存在：' + sceneId);
    return false;
  }
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
    }
  }
  return true;
}