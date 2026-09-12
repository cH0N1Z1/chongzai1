// ============================================================
//  rpg-core.js - 星辉学院核心数据、世界观、存档、初始化
//  依赖 shared.js（必须先加载）
//  加载顺序：core → ui → save → story → awaken
// ============================================================

// ============================================================
//  固定世界观
// ============================================================
const FIXED_WORLD=`现代都市 · 星辉学院时代。

城市被迷雾包围。城市内部偶尔形成「迷雾街区」。城市分第一层和第二层，普通人看不见第二层。

星辉学院在第二层，是这座城市最前沿的地方。只有收到「星辉信」的人才能看见校门。每届 6 名学生，6 个年级，12 岁入学，18 岁毕业。没有教师，学生自治，课程由学生开设。戴上手环，校服自动生成。

学院正中是星辉塔。塔顶只发任务，不解释、不接触、不参与管理。

学院没有任命制度，靠学生之间的认可。学生会只是习惯性称呼。

18 岁毕业可以离开学院，也可以选择留校。未修满的学生走不掉——这是学院唯一的强制。

学院集中了外面拿不到的东西：术式形态的演化、迷雾街区实习、塔顶任务、第二层的真相。资源、权力、真相、神秘，外面都没有。

氛围：秩序由学生自己维持。礼貌但不多话，每个人身上都有不想被问的事。日常明亮，但安静的地方特别安静。

术式是本命能力，随成长演化出「形态」——觉醒、成长、关键、稀有、传说。形态是成长的唯一体现。

塔顶发布学院任务和个人任务。个人任务未完成则重修回一年级。学期按上下学期推进。

具体设定见资料库。`;

// ============================================================
//  核心数据
// ============================================================
const CORE={
  name:'', avatar:'', gender:'女', age:12, roleDesc:'',
  arcane:'未觉醒', arcaneDesc:'',
  forms:[],
  npcs:[], flags:{}, summary:'',
  time:'入学第一天', term:'一年级上学期', weather:'',
  chapterNum:0, chapterTitle:''
};
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
    // 清除已废弃字段
    delete CORE.hp;delete CORE.maxHp;delete CORE.inventory;
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
let hasSave=loadSave();

if(hasSave && (!CORE.name || CORE.arcane === '未觉醒')){
    localStorage.removeItem(slotKey());
    hasSave = false;
    const _keepAvatar2 = CORE.avatar || '';
    Object.assign(CORE, {name:'',avatar:_keepAvatar2,gender:'女',age:12,roleDesc:'',arcane:'未觉醒',arcaneDesc:'',forms:[],npcs:[],flags:{},summary:'',time:'入学第一天',term:'一年级上学期',weather:'',chapterNum:0,chapterTitle:''});
    Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});
}

updateAvatarPreview();
renderSlotSelector();

if(hasSave){
    document.getElementById('continueBtn').classList.remove('hidden');
    document.getElementById('config-inputs').classList.add('hidden');
    const infoBox=document.getElementById('saveInfoBox');
    infoBox.classList.remove('hidden');
    infoBox.innerHTML=`存档：<b style="color:#f0f6fc;">${escapeHtml(CORE.name)}</b> · ${escapeHtml(CORE.arcane)}<br><span style="color:#6b7280;">时间：${escapeHtml(CORE.time)}</span>`;
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
Object.assign(CORE, {name:roleName,avatar:_keepAvatar,gender:'女',age:12,roleDesc:'',arcane:'未觉醒',arcaneDesc:'',forms:[],npcs:[],flags:{},summary:'',time:'入学第一天',term:'一年级上学期',weather:'',chapterNum:0,chapterTitle:''});
Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});

resetScene();

configPanel.style.display='none';
gameArea.style.display='flex';
try {
  chatBox.innerHTML=`<div class="msg-sys">欢迎，${escapeHtml(document.getElementById('roleName').value||'旅者')}。准备收到星辉信...</div>`;
  setTimeout(()=>sendAction("术式觉醒"),400);
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
appendOptions(["继续剧情"]);
userInput.focus();
}