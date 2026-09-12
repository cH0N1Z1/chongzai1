// ============================================================
//  rpg-core.js - 星辉学院核心数据、世界观、存档、初始化
//  依赖 shared.js（必须先加载）
//  加载顺序：core → ui → save → story → awaken
// ============================================================

// ============================================================
//  固定世界观
// ============================================================
const FIXED_WORLD=`现代都市 · 星辉学院时代。

【城市】
一座被迷雾包围的现代都市。地铁、咖啡厅、便利店、学校、商圈，日常如常。迷雾在外面，进不来，也出不去。城市内部偶尔会有迷雾渗透，形成临时的「迷雾街区」。

【星辉学院】
城市的核心，也是唯一能处理迷雾的机构。建在城市里，但普通人看不见——只有收到星辉信的人才能看见真正的校门。
没有教师。完全由学生自治。课程由高年级学生开设，一届传一届。学生会管理日常事务。每届12名学生。
学院正中有座星辉塔，塔顶常年亮着一盏灯。塔顶是学院的最高决策层，从不露面，只发布任务。

【入学】
12至18岁之间，某天会在邮箱或手机里收到一封没有署名的信。信上只有一行字和一个地址。每个人的地址不一样，但到达时看见的是同一栋白色建筑。
推门进去，里面已经站着几个同龄人，手里都攥着信。踏进学院的瞬间，术式自动觉醒。
学生会发下一枚手环，戴上后校服自动变出来，自动合身。手环是星辉学生的标志。
学生很少，在城市里也很少见。穿校服走在街上，会被人多看一眼。

【校服与手环】
手环戴在手腕上，平时可以收起校服穿便装。校服是术式产物，由手环生成。
校服分级：低年级（1-2年级）藏青短外套、白衬衫、深蓝细丝带；中年级（3-4年级）深蓝长外套、白衬衫、深蓝领带、星辉纹腰带；高年级（5-6年级）黑色长大衣、白衬衫、黑领带、右胸刻印徽章。
手环颜色对应当前术式的最高形态色。

【术式与形态】
每个人都有独特的本命术式，形似具象化的概念。术式有强弱（S/A/B/C/D），适性1-10。适性高成长快，适性低成长慢。
术式本身是一个核心，随成长演化出不同的「形态」。每个形态有独立的名字与效果，像一颗星在图谱上亮起。
形态分五类：觉醒（白）、成长（蓝）、关键（紫）、稀有（金）、传说（红）。颜色越靠后越难得。
术式形态的名字通常带有术式本名，如「霜织·初雪」「霜织·冰棱」。

【任务与重修】
塔顶发布任务。分两种：学院任务（一人完成即可，全员无事）、个人任务（每人必做）。
未完成个人任务者重修，回到一年级。校服和徽章降回一年级，但年龄不变。
一年级上学期是适应期，没有任务。下学期塔顶才发布第一个任务。

【迷雾街区】
迷雾渗透形成的临时危险区。可能出现在任何街角、巷子、地铁末班车。不固定。
学生在此清理魔物、采集材料、完成实习任务，换取积分。

【城市外面】
能出去，但很容易迷失在迷雾里。需要星辉学生带队才能安全进出。
星辉灯是塔顶星辉石的粉末，散落在迷雾中会自然凝聚成灯，能驱散迷雾、指引方向。

【术式师等级】
见习（1-10）、初级（11-25）、中级（26-40）、高级（41-55）、精英（56-70）、首席（71-85）、大导师（86-100）。

具体设定见资料库，优先参考资料库。`;

// ============================================================
//  核心数据
// ============================================================
const CORE={
  name:'', avatar:'', gender:'女', age:12, roleDesc:'',
  arcane:'未觉醒', arcaneDesc:'',
  aptitude:5, mana:1,
  forms:[],           // 术式形态
  npcs:[], flags:{}, summary:'',
  time:'入学第一天', term:'一年级上学期', weather:'',
  chapterNum:0, chapterTitle:''
};
const PLOT={history:[],turn:0,isFirst:true,summaryCounter:0};
let isGenerating=false;

// ============================================================
//  工具函数
// ============================================================
function getStage(power){
  if(power<=10)return"见习";
  if(power<=25)return"初级";
  if(power<=40)return"中级";
  if(power<=55)return"高级";
  if(power<=70)return"精英";
  if(power<=85)return"首席";
  return"大导师";
}
function getSpeedFactor(){return 1+(CORE.aptitude-1)*0.15}

// 术式形态颜色（按类型）
function getFormColorHex(type){
  if(type==='传说') return '#ef4444';
  if(type==='稀有') return '#fbbf24';
  if(type==='关键') return '#a855f7';
  if(type==='成长') return '#60a5fa';
  return '#a8d8ee';  // 觉醒
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
    // 兼容旧存档：marks/arts → forms
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
    });
    delete CORE.hp;delete CORE.maxHp;delete CORE.inventory;
    delete CORE.traits;
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
    Object.assign(CORE, {name:'',avatar:_keepAvatar2,gender:'女',age:12,roleDesc:'',arcane:'未觉醒',arcaneDesc:'',aptitude:5,mana:1,forms:[],npcs:[],flags:{},summary:'',time:'入学第一天',term:'一年级上学期',weather:'',chapterNum:0,chapterTitle:''});
    Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});
}

updateAvatarPreview();
renderSlotSelector();

if(hasSave){
    document.getElementById('continueBtn').classList.remove('hidden');
    document.getElementById('config-inputs').classList.add('hidden');
    const infoBox=document.getElementById('saveInfoBox');
    infoBox.classList.remove('hidden');
    infoBox.innerHTML=`存档：<b style="color:#f0f6fc;">${escapeHtml(CORE.name)}</b> · ${escapeHtml(CORE.arcane)} · 魔力${CORE.mana}级<br><span style="color:#6b7280;">时间：${escapeHtml(CORE.time)}</span>`;
    document.getElementById('roleName').value=CORE.name;
    document.getElementById('roleDesc').value=CORE.roleDesc||'';
    document.getElementById('innatePower').value=CORE.aptitude||5;
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
Object.assign(CORE, {name:roleName,avatar:_keepAvatar,gender:'女',age:12,roleDesc:'',arcane:'未觉醒',arcaneDesc:'',aptitude:5,mana:1,forms:[],npcs:[],flags:{},summary:'',time:'入学第一天',term:'一年级上学期',weather:'',chapterNum:0,chapterTitle:''});
Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});

resetScene();

document.getElementById('config-inputs').classList.remove('hidden');
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