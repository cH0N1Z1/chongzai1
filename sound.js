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
};

// 首次用户交互时初始化（浏览器要求）
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
  if(!on) soundStopAmbient();
}

function soundSetVolume(v){
  SOUND.volume = Math.max(0, Math.min(1, v));
  if(SOUND.master && SOUND.enabled) SOUND.master.gain.value = SOUND.volume;
}

// ---- 具体音效 ----

// 打字声：短促白噪音
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

// 叮声（获得物品、按钮）
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

// 魂力提升：双音
function soundPower(){
  if(!SOUND.enabled || !SOUND.ctx) return;
  soundDing(660, 0.15);
  setTimeout(()=>soundDing(880, 0.25), 100);
}

// 晋阶：上升和弦
function soundUpgrade(){
  if(!SOUND.enabled || !SOUND.ctx) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(()=>soundDing(f, 0.5), i * 110);
  });
}

// 战斗：低频鼓点
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

// 场景切换：柔和的滑音
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

// 按钮点击：短促清响
function soundClick(){
  soundDing(1200, 0.08);
}

// ---- 环境音（循环） ----

function soundStopAmbient(){
  if(SOUND.ambientNode){
    try { SOUND.ambientNode.stop(); } catch(e){}
    SOUND.ambientNode = null;
    SOUND.ambientGain = null;
  }
}

function soundAmbient(sceneType){
  if(!SOUND.enabled || !SOUND.ctx) return;
  // 已经在该场景里就不重复
  if(SOUND._lastAmbient === sceneType) return;
  SOUND._lastAmbient = sceneType;
  soundStopAmbient();
  // 只有部分场景有环境音
  if(sceneType !== 'forest' && sceneType !== 'water' && sceneType !== 'battle') return;
  const ctx = SOUND.ctx;
  // 2 秒白噪音循环
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