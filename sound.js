// ============================================================
//  sound.js - Web Audio 合成音效系统
//  无需音频文件，全部实时合成
// ============================================================

const SOUND = {
  ctx: null,
  master: null,
  enabled: true,
  volume: 0.2,
  ambientNode: null,
  ambientGain: null,
  _lastTypeTime: 0,
  _lastAmbient: null,
  bgm: { timer: null, current: null, noteIdx: 0 },
};

function soundEnsure(){
  if(SOUND.ctx) {
    if(SOUND.ctx.state === 'suspended') SOUND.ctx.resume();
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    SOUND.ctx = new AC();
    SOUND.master = SOUND.ctx.createGain();
    SOUND.master.gain.value = SOUND.enabled ? SOUND.volume : 0;
    SOUND.master.connect(SOUND.ctx.destination);
  } catch(e){ console.warn('音效不可用', e); }
}

function soundSetEnabled(on){
  SOUND.enabled = on;
  if(SOUND.master) SOUND.master.gain.value = on ? SOUND.volume : 0;
  if(!on){ soundStopAmbient(); soundStopBgm(); }
}

function soundSetVolume(v){
  SOUND.volume = Math.max(0, Math.min(1, v));
  if(SOUND.master && SOUND.enabled) SOUND.master.gain.value = SOUND.volume;
}

// ---- 具体音效 ----

function soundType(){
  if(!SOUND.enabled || !SOUND.ctx) return;
  const now = performance.now();
  if(now - SOUND._lastTypeTime < 60) return;
  SOUND._lastTypeTime = now;
  const ctx = SOUND.ctx;
  const size = Math.floor(ctx.sampleRate * 0.025);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for(let i = 0; i < size; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/size, 3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = 0.35;
  src.connect(g).connect(SOUND.master);
  src.start();
}

function soundDing(freq, dur){
  if(!SOUND.enabled || !SOUND.ctx) return;
  freq = freq || 880;
  dur = dur || 0.4;
  const ctx = SOUND.ctx;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.5, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g).connect(SOUND.master);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

function soundPower(){
  if(!SOUND.enabled || !SOUND.ctx) return;
  soundDing(660, 0.15);
  setTimeout(()=>soundDing(880, 0.25), 100);
}

function soundUpgrade(){
  if(!SOUND.enabled || !SOUND.ctx) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(()=>soundDing(f, 0.5), i * 110);
  });
}

function soundDrum(){
  if(!SOUND.enabled || !SOUND.ctx) return;
  const ctx = SOUND.ctx;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.18);
  g.gain.setValueAtTime(0.55, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
  osc.connect(g).connect(SOUND.master);
  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

function soundSceneShift(){
  if(!SOUND.enabled || !SOUND.ctx) return;
  const ctx = SOUND.ctx;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
  g.gain.setValueAtTime(0.25, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.connect(g).connect(SOUND.master);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

function soundClick(){
  soundDing(1200, 0.08);
}

// ============================================================
//  🎵 BGM 场景音乐
// ============================================================
function soundPlayNote(freq, dur, type, gain){
  if(!SOUND.enabled || !SOUND.ctx) return;
  const ctx = SOUND.ctx;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(gain || 0.05, ctx.currentTime + 0.03);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g).connect(SOUND.master);
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.05);
}

const BGM_PATTERNS = {
  city:     { bpm: 92, type:'triangle', gain:0.045, notes:[262,330,392,523,392,330,294,330] },
  academy:  { bpm: 88, type:'triangle', gain:0.045, notes:[349,440,523,587,523,440,392,440] },
  forest:   { bpm: 68, type:'sine',     gain:0.04,  notes:[330,440,550,660,550,440] },
  night:    { bpm: 58, type:'sine',     gain:0.04,  notes:[220,262,330,392,330,262] },
  battle:   { bpm: 118,type:'sawtooth', gain:0.035, notes:[110,165,220,165,110,147,196,147] },
  water:    { bpm: 74, type:'sine',     gain:0.04,  notes:[294,370,440,587,494,440] },
  cave:     { bpm: 62, type:'sine',     gain:0.04,  notes:[196,233,262,233] },
  palace:   { bpm: 78, type:'triangle', gain:0.04,  notes:[392,466,587,523,466,392] },
};

function soundBgm(sceneType){
  if(!SOUND.enabled || !SOUND.ctx) return;
  if(SOUND.bgm.current === sceneType) return;
  soundStopBgm();
  const p = BGM_PATTERNS[sceneType];
  if(!p) return;
  SOUND.bgm.current = sceneType;
  SOUND.bgm.noteIdx = 0;
  const interval = 60000 / p.bpm;
  function tick(){
    if(!SOUND.enabled || !SOUND.ctx) return;
    if(SOUND.bgm.current !== sceneType) return;
    const note = p.notes[SOUND.bgm.noteIdx % p.notes.length];
    soundPlayNote(note, 0.5, p.type, p.gain);
    SOUND.bgm.noteIdx++;
    SOUND.bgm.timer = setTimeout(tick, interval);
  }
  tick();
}

function soundStopBgm(){
  if(SOUND.bgm.timer){ clearTimeout(SOUND.bgm.timer); SOUND.bgm.timer = null; }
  SOUND.bgm.current = null;
  SOUND.bgm.noteIdx = 0;
}

// ============================================================
//  🔔 术式形态获得音效（按类型分层）
//  觉醒=柔和，成长=明亮，关键=华丽，稀有=璀璨，传说=宏伟
// ============================================================
function soundRing(formType){
  if(!SOUND.enabled || !SOUND.ctx) return;
  let base = 523;
  if(formType){
    if(formType.includes('传说')) base = 1047;
    else if(formType.includes('稀有')) base = 880;
    else if(formType.includes('关键')) base = 784;
    else if(formType.includes('成长')) base = 659;
    else if(formType.includes('觉醒')) base = 523;
  }
  soundDing(base, 0.35);
  setTimeout(()=>soundDing(base * 1.26, 0.4), 90);
  setTimeout(()=>soundDing(base * 1.5, 0.5), 180);
}

// ============================================================
//  🌿 环境音（循环）
// ============================================================
function soundStopAmbient(){
  if(SOUND.ambientNode){
    try { SOUND.ambientNode.stop(); } catch(e){}
    SOUND.ambientNode = null;
    SOUND.ambientGain = null;
  }
}

function soundAmbient(sceneType){
  if(!SOUND.enabled || !SOUND.ctx) return;
  soundBgm(sceneType);
  if(SOUND._lastAmbient === sceneType) return;
  SOUND._lastAmbient = sceneType;
  soundStopAmbient();
  if(sceneType !== 'forest' && sceneType !== 'water' && sceneType !== 'battle') return;
  const ctx = SOUND.ctx;
  const size = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for(let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  if(sceneType === 'forest'){
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    g.gain.value = 0.06;
  } else if(sceneType === 'water'){
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    g.gain.value = 0.05;
  } else if(sceneType === 'battle'){
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    g.gain.value = 0.08;
  }
  src.connect(filter).connect(g).connect(SOUND.master);
  src.start();
  SOUND.ambientNode = src;
  SOUND.ambientGain = g;
}