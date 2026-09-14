// ============================================================
//  rpg-core.js - 星辉学院核心数据、世界观、存档、初始化
//  依赖 shared.js（必须先加载）
//  加载顺序：core → ui → save → story → awaken
// ============================================================

// ============================================================
//  固定世界观
// ============================================================
const FIXED_WORLD=`人类迁到这颗行星之后，只剩一座城。

城被迷雾罩着。迷雾是这颗行星本来就有的东西——它挡在外面，让外面看不见这座城。雾里有外星生物，它们从更远的地方来，被雾拦着，也被雾喂着。

城正中立着一座灯塔。灯塔亮着，灯照到的地方，是人能住的地方。灯照不到的地方，全是雾。往外推一寸，城就大一寸——这是这座城活着的方式。

星辉学院建在灯塔之下。学院为守灯而建。学生进来，学的是怎么让灯亮着；术式就是守灯的本事。这件事，学生不知道。他们只知道，自己收到了一封星辉信，来到一所没有教师的学校，学着一种叫「术式」的能力。

学院共六个年级，12 岁入学，18 岁毕业，每届 6 名学生。没有教师，学生自治，课程由学生开设。戴上手环，校服自动生成。

星辉塔就在学院正中——塔顶那盏灯，就是灯塔。塔顶只发任务，不解释、不接触、不参与管理。

术式是本命能力，随成长演化出「形态」——觉醒、成长、关键、稀有、传说。形态是成长的唯一体现。

18 岁毕业可以离开学院，也可以留校。未修满的学生走不掉——这是学院唯一的强制。

氛围：秩序由学生自己维持。礼貌但不多话，每个人身上都有不想被问的事。日常明亮，但安静的地方特别安静。

具体设定见资料库。`;

// ============================================================
//  核心数据
// ============================================================
const CORE={
  name:'', avatar:'', gender:'女', age:12, roleDesc:'',
  arcane:'未觉醒', arcaneDesc:'',
  forms:[],
  selfProfile:null,
  npcs:[], flags:{}, summary:'',
  time:'入学第一天', term:'一年级上学期', weather:'',
  chapterNum:0, chapterTitle:'',
  day:1, slot:0,
  battle:{ hp:1000, maxHp:1000, atk:0, def:0, speed:0, stardust:100, maxStardust:100, skills:[] }
};

// ============================================================
//  角色库（从 character.json 加载）
// ============================================================
const CHARACTERS = { loaded: false, classmates: [], seniors: [], juniors: [] };

async function loadCharacters(){
  try {
    const r = await fetch('./character.json');
    const data = await r.json();
    if(Array.isArray(data.classmates)) CHARACTERS.classmates = data.classmates;
    if(Array.isArray(data.seniors))   CHARACTERS.seniors   = data.seniors;
    if(Array.isArray(data.juniors))   CHARACTERS.juniors   = data.juniors;
    CHARACTERS.loaded = true;
  } catch(e) {
    console.warn('角色库加载失败', e);
  }
}

function getAvailableClassmates(){
  const g = CORE.gender;
  return CHARACTERS.classmates.filter(c => {
    if(c.optionalFor === 'female' && g === '女') return false;
    if(c.optionalFor === 'male'   && g === '男') return false;
    return true;
  });
}

function findNpcAt(placeId){
  const list = getAvailableClassmates();
  const candidates = list.filter(c =>
    Array.isArray(c.commonPlaces) && c.commonPlaces.some(p => p.indexOf(placeId) !== -1)
  );
  if(candidates.length === 0) return null;
  if(Math.random() > 0.6) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// 把角色库里的 NPC 写进人物面板（首次注册，已存在则更新）
function registerNpcFromLibrary(npc){
  if(!npc || !npc.name) return null;
  if(!CORE.npcs) CORE.npcs = [];
  const exist = CORE.npcs.find(n => n.name === npc.name);
  const gradeKey = getCurrentGradeKey();
  const evo = (npc.evolve && npc.evolve[gradeKey]) || {};
  const m = Object.assign({}, npc, evo);

  if(exist){
    if(CORE.term) exist.term = CORE.term;
    if(m.grade) exist.grade = m.grade;
    if(m.relation) exist.relation = m.relation;
    return exist;
  }

  const parts = [];
  if(Array.isArray(m.personality) && m.personality.length) parts.push(m.personality.join('、'));
  if(m.roleInGroup) parts.push(m.roleInGroup);
  if(m.attitude) parts.push(m.attitude);

  const entry = {
    name: m.name,
    gender: m.gender || '未知',
    arcane: m.arcane || '未知',
    relation: m.relation || '同届生',
    grade: m.grade || '一年级上',
    dept: m.dept || '无',
    desc: parts.join('。') || '',
    term: CORE.term || '一年级上学期',
    status: 'active',
    affinity: typeof m.initialAffinity === 'number' ? m.initialAffinity : 0,
    archTime: '',
    snapshot: null
  };
  CORE.npcs.push(entry);
  return entry;
}

// 当前学期对应的年级 key（'1' ~ '6'）
function getCurrentGradeKey(){
  const t = String(CORE.term || '一年级上学期');
  const m = t.match(/([一二三四五六])年级/);
  const map = {'一':'1','二':'2','三':'3','四':'4','五':'5','六':'6'};
  return m ? (map[m[1]] || '1') : '1';
}

// 把 NPC 档案拼成 prompt 块
function buildNpcBlock(npc){
  if(!npc) return '';

  // 合并 base + 当前年级 evolve
  const evo = (npc.evolve && npc.evolve[getCurrentGradeKey()]) || {};
  const m = Object.assign({}, npc, evo);

  let s = '\n## 本场景出场人物\n';
  s += `姓名：${m.name}（${m.gender}，${m.age||12}岁）\n`;
  s += `年级：${m.grade||'一年级上'}\n`;

  if(m.appearance){
    if(typeof m.appearance === 'object'){
      const a = m.appearance;
      if(a.hair)   s += `发色/发型：${a.hair}\n`;
      if(a.eyes)   s += `眼睛：${a.eyes}\n`;
      if(a.face)   s += `脸与五官：${a.face}\n`;
      if(a.height) s += `身高：${a.height}cm\n`;
      if(a.build)  s += `体型：${a.build}\n`;
      if(a.style)  s += `穿搭/细节：${a.style}\n`;
    } else {
      s += `外貌：${m.appearance}\n`;
    }
  }

  if(Array.isArray(m.personality)) s += `性格：${m.personality.join('、')}\n`;
  if(m.habits) s += `惯用动作：${m.habits}\n`;
  if(Array.isArray(m.likes))    s += `喜欢：${m.likes.join('、')}\n`;
  if(Array.isArray(m.dislikes)) s += `不喜欢：${m.dislikes.join('、')}\n`;
  if(m.attitude) s += `对人的态度：${m.attitude}\n`;
  if(m.arcane) s += `术式：${m.arcane}（${m.arcaneImage||''}）\n`;
  if(m.speech) s += `说话方式：${m.speech}\n`;
  if(m.roleInGroup) s += `群体定位：${m.roleInGroup}\n`;
  if(m.aloneBehavior) s += `独处时的样子：${m.aloneBehavior}\n`;
  s += `（秘密：${m.secret||'无'}，不要直接说出，只做暗示）\n`;
  s += `写作要求：让 TA 的言行符合以上惯用动作、喜好、态度、独处习惯，自然地说 1-2 句话。\n`;
  return s;
}

const PLOT={history:[],turn:0,isFirst:true,summaryCounter:0};
let isGenerating=false;

// ============================================================
//  工具函数
// ============================================================
function getFormColorHex(type){
  if(type==='传说') return '#ef4444';
  if(type==='稀有') return '#fbbf24';
  if(type==='关键') return '#a855f7';
  if(type==='成长') return '#60a5fa';
  return '#a8d8ee';
}
function getFormColorClass(type){
  if(type==='传说') return 'ring-red';
  if(type==='稀有') return 'ring-gold';
  if(type==='关键') return 'ring-purple';
  if(type==='成长') return 'ring-yellow';
  return 'ring-white';
}

// ============================================================
//  DOM 引用
// ============================================================
const chatBox=document.getElementById('chat-box');
const optionsArea=document.getElementById('options-area');
const userInput=document.getElementById('userInput');
const configPanel=document.getElementById('config-panel');
const gameArea=document.getElementById('game-area');
const sendBtn=document.getElementById('sendBtn');

document.querySelectorAll('input[name="soulChoice"]').forEach(radio=>{
  radio.addEventListener('change',function(){
    document.getElementById('customSoulDiv').classList.toggle('hidden',this.value!=='custom');
  });
});

// ============================================================
//  存档
// ============================================================
let CURRENT_SLOT = 1;
function slotKey(s){ return 'douro2Save_' + (s||CURRENT_SLOT); }
function loadCurrentSlot(){
  try{
    const s = parseInt(localStorage.getItem('douro2CurrentSlot'));
    if(s >= 1 && s <= 3) CURRENT_SLOT = s;
  }catch(e){}
}
function saveToPhone(){
try{
  const apiKey=document.getElementById('apiKey').value.trim();
  if(apiKey)localStorage.setItem('douro2ApiKey',apiKey);
  localStorage.setItem('douro2CurrentSlot', String(CURRENT_SLOT));
  const hist = PLOT.history.slice(-100);
  localStorage.setItem(slotKey(), JSON.stringify({
    core: CORE,
    plot: { history: hist, turn: PLOT.turn, isFirst: PLOT.isFirst, summaryCounter: PLOT.summaryCounter },
    saveTime: Date.now()
  }));
}catch(e){console.error('存档失败',e)}
}
function switchSlot(n){
  n = parseInt(n);
  if(n < 1 || n > 3) n = 1;
  if(n === CURRENT_SLOT) return;
  if(!confirm('切换到存档 ' + n + '？未保存的进度会先保存。')) return;
  saveToPhone();
  CURRENT_SLOT = n;
  localStorage.setItem('douro2CurrentSlot', String(n));
  location.reload();
}
function slotInfo(n){
  try{
    const raw = localStorage.getItem('douro2Save_' + n);
    if(!raw) return { empty: true, slot: n };
    const d = JSON.parse(raw);
    return { empty: false, slot: n, name: (d.core&&d.core.name) || '未命名', soul: (d.core&&d.core.arcane) || '?' };
  }catch(e){ return { empty: true, slot: n }; }
}
function renderSlotSelector(){
  const el = document.getElementById('slotSelector');
  if(!el) return;
  let html = '';
  for(let i=1;i<=3;i++){
    const info = slotInfo(i);
    const active = (i === CURRENT_SLOT) ? ' active' : '';
    const label = info.empty ? '空存档' : `${escapeHtml(info.name)} · ${escapeHtml(info.soul)}`;
    html += `<div class="slot-item${active}" onclick="switchSlot(${i})"><div class="slot-num">存档 ${i}</div><div class="slot-info">${label}</div></div>`;
  }
  el.innerHTML = html;
}
function loadSave(){
try{
  const savedKey=localStorage.getItem('douro2ApiKey');
  if(savedKey)document.getElementById('apiKey').value=savedKey;
  const legacy = localStorage.getItem('douro2Save');
  if(legacy && !localStorage.getItem('douro2Save_1')){
    localStorage.setItem('douro2Save_1', legacy);
    localStorage.removeItem('douro2Save');
  }
  loadCurrentSlot();
  const raw=localStorage.getItem(slotKey());
  if(raw){
    const data=JSON.parse(raw);
    Object.assign(CORE,data.core);
    if(!CORE.gender)CORE.gender='女';
    if(!CORE.age)CORE.age=12;
    if(!CORE.arcaneDesc)CORE.arcaneDesc='';
    if(CORE.selfProfile===undefined)CORE.selfProfile=null;
    if(!CORE.forms){
      CORE.forms = [];
      if(Array.isArray(CORE.marks)){
        CORE.marks.forEach(m=>{
          const name = typeof m === 'string' ? m : (m.name||'');
          if(name) CORE.forms.push({name, type:'觉醒', desc:(m.desc||'')});
        });
      }
      delete CORE.marks;
    }
    delete CORE.arts;
    if(!CORE.npcs)CORE.npcs=[];
    if(!CORE.time)CORE.time='入学第一天';
    if(!CORE.term)CORE.term='一年级上学期';
    if(CORE.avatar===undefined)CORE.avatar='';
    if(CORE.weather===undefined)CORE.weather='';
    if(CORE.chapterNum===undefined)CORE.chapterNum=0;
    if(CORE.chapterTitle===undefined)CORE.chapterTitle='';
    if(typeof CORE.day !== 'number') CORE.day = 1;
    if(typeof CORE.slot !== 'number') CORE.slot = 0;
    if(!CORE.battle) CORE.battle = { hp:1000, maxHp:1000, atk:0, def:0, speed:0, stardust:100, maxStardust:100, skills:[] };
    if(typeof CORE.battle.hp !== 'number') CORE.battle.hp = CORE.battle.maxHp || 1000;
    if(typeof CORE.battle.maxHp !== 'number') CORE.battle.maxHp = 1000;
    if(typeof CORE.battle.stardust !== 'number') CORE.battle.stardust = CORE.battle.maxStardust || 100;
    if(typeof CORE.battle.maxStardust !== 'number') CORE.battle.maxStardust = 100;
    if(!Array.isArray(CORE.battle.skills)) CORE.battle.skills = [];
    CORE.npcs.forEach(n=>{
      if(!n.status)n.status='active';
      if(n.term===undefined)n.term='一年级上学期';
      if(n.affinity===undefined)n.affinity=0;
      if(n.archTime===undefined)n.archTime='';
      if(n.snapshot===undefined)n.snapshot=null;
      if(n.arcane===undefined)n.arcane='';
      if(n.grade===undefined)n.grade=n.term||'一年级上学期';
      if(n.dept===undefined)n.dept='无';
    });
    delete CORE.inventory;
    delete CORE.traits;
    delete CORE.aptitude;delete CORE.mana;
    CORE.npcs.forEach(n=>{ delete n.mana; });
    Object.assign(PLOT,data.plot);
    return true;
  }
}catch(e){console.error('读档失败',e)}
return false;
}
function resetSave(){if(confirm("清空当前存档？")){localStorage.removeItem(slotKey());document.getElementById('config-inputs').classList.remove('hidden');location.reload()}}

// ============================================================
//  导航
// ============================================================
function goHome(){
  if(isGenerating){alert("正在生成，请等待完成");return}
  if(confirm("返回主界面？")){
    saveToPhone();
    if(typeof soundStopAmbient==='function')soundStopAmbient();
    if(typeof soundStopBgm==='function')soundStopBgm();
    gameArea.style.display='none';
    configPanel.style.display='block';
    initApp();
  }
}
function selectMode(mode){
  if(mode!=='rpg'){alert('模拟器模式尚未开放，敬请期待');return}
  document.getElementById('mode-select').classList.add('hidden');
  document.getElementById('config-panel').classList.remove('hidden');
  initApp().catch(e=>console.error(e));
}

// ============================================================
//  初始化
// ============================================================
async function initApp(){
isGenerating = false;
loadSettings();
loadDefaultMedia();
loadCharacters();
let hasSave=loadSave();

if(hasSave && (!CORE.name || CORE.arcane === '未觉醒')){
    localStorage.removeItem(slotKey());
    hasSave = false;
    const _keepAvatar2 = CORE.avatar || '';
    Object.assign(CORE, {name:'',avatar:_keepAvatar2,gender:'女',age:12,roleDesc:'',arcane:'未觉醒',arcaneDesc:'',forms:[],selfProfile:null,npcs:[],flags:{},summary:'',time:'入学第一天',term:'一年级上学期',weather:'',chapterNum:0,chapterTitle:'',day:1,slot:0,battle:{hp:1000,maxHp:1000,atk:0,def:0,speed:0,stardust:100,maxStardust:100,skills:[]}});
    Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});
}

updateAvatarPreview();
renderSlotSelector();

if(hasSave){
    document.getElementById('continueBtn').classList.remove('hidden');
    document.getElementById('config-inputs').classList.add('hidden');
    const infoBox=document.getElementById('saveInfoBox');
    infoBox.classList.remove('hidden');
    infoBox.innerHTML=`存档：<b style="color:#f0f6fc;">${escapeHtml(CORE.name)}</b> · ${escapeHtml(CORE.arcane)}<br><span style="color:#6b7280;">第 ${CORE.day} 天</span>`;
    document.getElementById('roleName').value=CORE.name;
    document.getElementById('roleDesc').value=CORE.roleDesc||'';
}
}

// ============================================================
//  开始 / 继续
// ============================================================
function startNewGame(){
isGenerating = false;
const key=document.getElementById('apiKey').value.trim();
if(!key){alert("请填入 DeepSeek API Key");return}

const roleName = document.getElementById('roleName').value.trim();
if(!roleName){
    chatBox.innerHTML+=`<div class="msg-lose">请先在配置面板填写角色名，再开始游戏。</div>`;
    chatBox.scrollTop=chatBox.scrollHeight;
    return;
}

const hasValidSave = localStorage.getItem(slotKey()) && CORE.name && CORE.arcane !== '未觉醒';
if(hasValidSave && !confirm("已有存档，开始新游戏会覆盖。确定？")) return;

localStorage.removeItem(slotKey());
const _keepAvatar = CORE.avatar || '';
Object.assign(CORE, {name:roleName,avatar:_keepAvatar,gender:'女',age:12,roleDesc:'',arcane:'未觉醒',arcaneDesc:'',forms:[],selfProfile:null,npcs:[],flags:{},summary:'',time:'入学第一天',term:'一年级上学期',weather:'',chapterNum:0,chapterTitle:'',day:1,slot:0,battle:{hp:1000,maxHp:1000,atk:0,def:0,speed:0,stardust:100,maxStardust:100,skills:[]}});
Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});

resetScene();

configPanel.style.display='none';
gameArea.style.display='flex';
try {
  chatBox.innerHTML=`<div class="msg-sys">欢迎，${escapeHtml(roleName)}。准备收到星辉信...</div>`;
  setTimeout(()=>awakenArcane(), 400);
} catch(e) {
  console.error('[startNewGame]', e);
  chatBox.innerHTML += `<div class="msg-lose">启动失败：${escapeHtml(e.message)}</div>`;
}
}

function continueGame(){
isGenerating = false;
const key=document.getElementById('apiKey').value.trim();
if(!key){alert("请填入 DeepSeek API Key");return}
configPanel.style.display='none';
gameArea.style.display='flex';
chatBox.innerHTML=`<div class="msg-sys">继续游戏，${escapeHtml(CORE.name)}。</div>`;
const recent=PLOT.history.slice(-6);
recent.forEach(item=>{
if(item.role==='user')chatBox.innerHTML+=userMsgHtml(item.content,false);
else if(item.role==='assistant')chatBox.innerHTML+=`<div class="msg-ai">${escapeHtml(stripStatus(item.content))}</div>`;
});
if(CORE.summary)chatBox.innerHTML+=`<div class="msg-summary">${escapeHtml(CORE.summary)}</div>`;
updateStatus();
renderPlacePanel(true);
userInput.focus();
}