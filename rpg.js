// ============================================================
//  rpg.js - 星辉学院模式
//  依赖 shared.js（必须先加载）
// ============================================================

// ============================================================
//  摘要编辑
// ============================================================
function openSummaryEditor(){
document.getElementById('summaryTextarea').value=CORE.summary||'';
openModal('summaryModal');
}
function saveSummaryEdit(){
const t=document.getElementById('summaryTextarea').value.trim();
CORE.summary=t;
saveToPhone();
closeModal('summaryModal');
chatBox.innerHTML+=`<div class="msg-sys">已更新剧情摘要（${t.length}字）</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
}

// ============================================================
//  角色档案手动编辑
// ============================================================
function openProfileEditor(){
  const g = id => document.getElementById(id);
  if(!g('profileModal')) return;
  g('pfName').value = CORE.name || '';
  g('pfAge').value = CORE.age || 12;
  g('pfSoul').value = (CORE.arcane && CORE.arcane !== '未觉醒') ? CORE.arcane : '';
  g('pfSoulDesc').value = CORE.arcaneDesc || '';
  g('pfInnate').value = CORE.aptitude || 1;
  g('pfPower').value = CORE.mana || 1;
  openModal('profileModal');
}
function saveProfileEdit(){
  const g = id => document.getElementById(id);
  const name = g('pfName').value.trim();
  const age = Math.min(Math.max(parseInt(g('pfAge').value) || CORE.age || 12, 12), 18);
  const soul = g('pfSoul').value.trim();
  const soulDesc = g('pfSoulDesc').value.trim();
  const innate = Math.min(Math.max(parseInt(g('pfInnate').value)||1, 1), 10);
  const power = Math.min(Math.max(parseInt(g('pfPower').value)||1, 1), 100);
  if(name) CORE.name = name;
  CORE.age = age;
  if(soul) CORE.arcane = soul;
  CORE.arcaneDesc = soulDesc;
  CORE.aptitude = innate;
  CORE.mana = power;
  updateStatus();
  saveToPhone();
  closeModal('profileModal');
  chatBox.innerHTML += `<div class="msg-sys">角色档案已更新</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ============================================================
//  头像
// ============================================================
function handleAvatarUpload(e){
  const file=e.target.files[0];
  if(!file)return;
  if(file.size>500*1024){alert('头像不能超过 500KB，请先压缩');e.target.value='';return;}
  const reader=new FileReader();
  reader.onload=function(){
    CORE.avatar=reader.result;
    updateAvatarPreview();
    updateStatus();
    saveToPhone();
  };
  reader.readAsDataURL(file);
}
function clearAvatar(){
  CORE.avatar='';
  const up=document.getElementById('avatarUpload');
  if(up)up.value='';
  updateAvatarPreview();
  updateStatus();
  saveToPhone();
}
function updateAvatarPreview(){
  const el=document.getElementById('avatarPreview');
  if(!el)return;
  if(CORE.avatar){
    el.innerHTML=`<img src="${CORE.avatar}" alt="avatar">`;
  }else{
    el.textContent=(CORE.name||'?').charAt(0);
  }
}
function playerAvatarHtml(){
  if(CORE.avatar)return `<img src="${CORE.avatar}" alt="avatar">`;
  const name=CORE.name||'?';
  const first=name.charAt(0);
  let hash=0;for(let i=0;i<name.length;i++)hash=(hash*31+name.charCodeAt(i))%360;
  return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,hsl(${hash},60%,45%),hsl(${(hash+40)%360},60%,35%));color:#fff;font-weight:bold;">${escapeHtml(first)}</div>`;
}
function userMsgHtml(text,isDebug){
  const cls=isDebug?'msg-user debug':'msg-user';
  return `<div class="msg-row msg-row-user"><div class="msg-avatar">${playerAvatarHtml()}</div><div class="${cls}">${escapeHtml(text)}</div></div>`;
}

// ============================================================
//  固定世界观
// ============================================================
const FIXED_WORLD=`现代都市 · 星辉学院时代。

【世界本质】
魔法是公开的，但只有拿到「星辉资格」的人才能看见城市的第二层。普通人只能看见一栋废弃老楼，收到星辉信的人才能看见真正的校门。第二层有结界、魔物、术式商店、深夜地铁的隐藏站台。

【星辉学院】
建在城市第二层的术式师学院。六个年级，12岁入学，18岁毕业。校内分教学区、宿舍区、训练场、图书馆、学生会馆、星辉塔。最高机构为教师会，院长神秘，不常出现。学生会负责实习任务分配、社团管理、排名赛。

【星辉信】
12至18岁之间寄出的神秘信件。信封深蓝色，微微发烫。里面只有一行字和一个地址，那行字是收件人自己的名字，但笔迹不是自己的。信的背面有一枚星辉印记，会慢慢发光。寄件人不明。

【术式与刻印】
每个人都有独特的本命术式，形似具象化的概念。术式有强弱（S/A/B/C/D），适性1-10。适性高成长快，适性低成长慢。术式随魔力提升解锁「刻印」，每个刻印带一个术式技。刻印颜色：白初刻、黄浅刻、紫深刻、黑夜刻、红血刻、金星刻。

【迷雾街区】
星辉学院的校外实习区，第二层和第一层最接近的地方。终年薄雾，魔物从裂隙渗入。分安全区、中层、深层。低年级在安全区边缘实习，高年级深入深层。学生在此清理魔物、采集材料、完成实习任务，换取积分。

【术式师等级】
见习（1-10）、初级（11-25）、中级（26-40）、高级（41-55）、精英（56-70）、首席（71-85）、大导师（86-100）。

【物件质感】
城市有高楼、地铁、便利店、学校、商圈。第二层有发光的法阵铭牌、晶体玻璃、金属镶边的术式商店。术式刻印手环显示持有者的最高刻印色。深夜地铁有隐藏站台，通往第二层。

【货币】
现代货币，同时术式师之间有「实习积分」可兑换资源。

具体设定见资料库，优先参考资料库。`;

const CORE={name:'',avatar:'',gender:'女',age:12,roleDesc:'',arcane:'未觉醒',arcaneDesc:'',aptitude:5,mana:1,marks:[],arts:[],npcs:[],flags:{},summary:'',time:'收到星辉信当天',term:'一年级上学期',weather:'',chapterNum:0,chapterTitle:''};
const PLOT={history:[],turn:0,isFirst:true,summaryCounter:0};
let isGenerating=false;

function getStage(power){if(power<=10)return"见习";if(power<=25)return"初级";if(power<=40)return"中级";if(power<=55)return"高级";if(power<=70)return"精英";if(power<=85)return"首席";return"大导师"}
function getSpeedFactor(){return 1+(CORE.aptitude-1)*0.15}
function getMarkColorClass(name){
  if(name.includes('星刻'))return'ring-gold';
  if(name.includes('血刻'))return'ring-red';
  if(name.includes('夜刻'))return'ring-black';
  if(name.includes('深刻'))return'ring-purple';
  if(name.includes('浅刻'))return'ring-yellow';
  return'ring-white';
}
function getMarkColorHex(name){
  if(name.includes('星刻'))return '#fbbf24';
  if(name.includes('血刻'))return '#ef4444';
  if(name.includes('夜刻'))return '#4b5563';
  if(name.includes('深刻'))return '#a855f7';
  if(name.includes('浅刻'))return '#facc15';
  return '#f0f0f0';
}

const chatBox=document.getElementById('chat-box');
const optionsArea=document.getElementById('options-area');
const userInput=document.getElementById('userInput');
const configPanel=document.getElementById('config-panel');
const gameArea=document.getElementById('game-area');
const sendBtn=document.getElementById('sendBtn');

document.querySelectorAll('input[name="soulChoice"]').forEach(radio=>{radio.addEventListener('change',function(){document.getElementById('customSoulDiv').classList.toggle('hidden',this.value!=='custom')})});

// ============================================================
//  刻印可视化
// ============================================================
function renderRingsVisual(marks){
if(marks.length===0)return '<div style="text-align:center;padding:24px;color:#8b949e;">暂无刻印</div>';
const total=Math.min(marks.length,9);const cx=100,cy=100;
let svg=`<svg viewBox="0 0 200 200">`;
for(let i=0;i<total;i++){
  const r=92-i*9;const color=getMarkColorHex(marks[i].name);const isGold=marks[i].name.includes('星刻');
  svg+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="5" opacity="0.95"${isGold?' filter="url(#goldGlow)"':''}/>`;
}
svg+=`<defs><filter id="goldGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
svg+=`<circle cx="${cx}" cy="${cy}" r="22" fill="#161b22" stroke="#30363d"/>`;
svg+=`<text x="${cx}" y="${cy+5}" text-anchor="middle" fill="#f0f6fc" font-size="14" font-weight="bold">${total}印</text></svg>`;
let legend='<div class="rings-legend">';
marks.forEach((m,i)=>{const color=getMarkColorHex(m.name);legend+=`<span class="rings-legend-item" style="color:${color};">第${i+1}印 · ${escapeHtml(m.name)}${m.count>1?'×'+m.count:''}</span>`});
legend+='</div>';
return `<div class="rings-visual-container">${svg}${legend}</div>`;
}

// ============================================================
//  场景氛围
// ============================================================
const SCENE_PLACES = [
  {re:/星辉学院/, name:'星辉学院', type:'academy', emoji:'🏛'},
  {re:/星辉塔/, name:'星辉塔', type:'palace', emoji:'🗼'},
  {re:/迷雾街区/, name:'迷雾街区', type:'cave', emoji:'🌫'},
  {re:/教学楼|教室|课堂/, name:'教学楼', type:'academy', emoji:'🏫'},
  {re:/图书馆/, name:'图书馆', type:'academy', emoji:'📚'},
  {re:/训练场/, name:'训练场', type:'battle', emoji:'⚔'},
  {re:/食堂/, name:'食堂', type:'city', emoji:'🍱'},
  {re:/宿舍/, name:'宿舍', type:'night', emoji:'🛏'},
  {re:/天台/, name:'天台', type:'night', emoji:'🌙'},
  {re:/学生会馆|学生会/, name:'学生会馆', type:'academy', emoji:'📋'},
  {re:/樱花道/, name:'樱花道', type:'forest', emoji:'🌸'},
  {re:/便利店/, name:'便利店', type:'city', emoji:'🏪'},
  {re:/地铁|站台/, name:'地铁', type:'city', emoji:'🚇'},
  {re:/城市|街道|商圈/, name:'城市', type:'city', emoji:'🏙'},
];
const SCENE_TYPES = [
  {re:/森林|树林|樱花道|林间/, name:'林间', type:'forest', emoji:'🌲'},
  {re:/学院|教室|课堂|训练场|操场|图书馆/, name:'学院', type:'academy', emoji:'🏛'},
  {re:/宫殿|宫廷|塔顶|星辉塔/, name:'高塔', type:'palace', emoji:'🗼'},
  {re:/夜晚|月色|深夜|星空|月光|夜幕/, name:'夜色', type:'night', emoji:'🌙'},
  {re:/战斗|厮杀|危险|袭击|魔物|裂隙/, name:'战斗', type:'battle', emoji:'⚔'},
  {re:/迷雾|洞穴|地下|深处|街区/, name:'迷雾', type:'cave', emoji:'🌫'},
  {re:/湖边|水边|河流|湖畔|海面|江边/, name:'水畔', type:'water', emoji:'💧'},
  {re:/城|镇|街|铺|市集|街道|广场|便利店|地铁/, name:'城镇', type:'city', emoji:'🏙'},
];

// ============================================================
//  天气本地随机（符合季节）
// ============================================================
function getSeason(term){
  const t = String(term||'');
  if(/一年级上|二年级上|三年级上|四年级上|五年级上|六年级上/.test(t)){
    const m = t.match(/[一二三四五六]年级上/);
    if(m) return '秋';
  }
  if(/一年级下|二年级下|三年级下|四年级下|五年级下|六年级下/.test(t)){
    return '春';
  }
  return '秋';
}
function rollWeather(term){
  const season = getSeason(term);
  const pools = {
    '春': ['晴','阴','小雨','多云','风'],
    '夏': ['晴','雷阵雨','多云','闷热'],
    '秋': ['晴','阴','小雨','风','薄雾'],
    '冬': ['晴','阴','小雪','霜','寒风']
  };
  const pool = pools[season] || pools['秋'];
  return pool[Math.floor(Math.random()*pool.length)];
}

function detectTimeOfDay(timeStr){
  if(!timeStr) return '';
  if(/清晨|黎明|天亮|早上|早晨/.test(timeStr)) return '清晨';
  if(/上午/.test(timeStr)) return '上午';
  if(/中午|正午/.test(timeStr)) return '正午';
  if(/下午|午后/.test(timeStr)) return '下午';
  if(/黄昏|傍晚|日落/.test(timeStr)) return '黄昏';
  if(/深夜|午夜|凌晨/.test(timeStr)) return '深夜';
  if(/夜晚|夜里|晚上/.test(timeStr)) return '夜晚';
  return '';
}
function getTimeEmoji(t){
  if(!t) return '';
  return {'清晨':'🌅','上午':'🌤','正午':'☀️','午后':'🌞','黄昏':'🌇','夜晚':'🌙','深夜':'🌃'}[t] || '';
}
function getWeatherEmoji(w){
  if(!w) return '';
  if(/晴/.test(w)) return '☀️';
  if(/阴|多云/.test(w)) return '☁️';
  if(/雨/.test(w)) return '🌧';
  if(/雪/.test(w)) return '❄️';
  if(/雾|霾/.test(w)) return '🌫';
  if(/风/.test(w)) return '💨';
  if(/雷/.test(w)) return '⛈';
  return '';
}

function detectSceneFull(text){
  if(!SETTINGS.useSceneBg) return null;
  for(const p of SCENE_PLACES){
    if(p.re.test(text)) return { name:p.name, type:p.type, emoji:p.emoji };
  }
  for(const t of SCENE_TYPES){
    if(t.re.test(text)) return { name:t.name, type:t.type, emoji:t.emoji };
  }
  return null;
}

let _currentSceneKey = '';
function updateSceneBanner(sceneInfo){
  const el = document.getElementById('scene-banner');
  if(!el) return;
  if(!sceneInfo){
    el.classList.add('hidden');
    document.body.removeAttribute('data-scene');
    return;
  }
  const timePart = detectTimeOfDay(CORE.time);
  const timeEmoji = getTimeEmoji(timePart);
  const weatherEmoji = getWeatherEmoji(CORE.weather);
  let txt = sceneInfo.emoji + ' ' + sceneInfo.name;
  if(timePart) txt += ' · ' + (timeEmoji ? timeEmoji + ' ' : '') + timePart;
  if(weatherEmoji) txt += ' ' + weatherEmoji;
  el.textContent = txt;
  el.classList.remove('hidden');
  el.classList.remove('scene-banner-fade');
  void el.offsetWidth;
  el.classList.add('scene-banner-fade');
  document.body.setAttribute('data-scene', sceneInfo.type);
}

function applyScene(text){
  const cb = document.getElementById('chat-box');
  if(!SETTINGS.useSceneBg){
    cb.className = cb.className.split(' ').filter(c=>!c.startsWith('scene-')).join(' ');
    _currentSceneKey = '';
    updateSceneBanner(null);
    if(typeof soundStopAmbient==='function') soundStopAmbient();
    return;
  }
  const sceneInfo = detectSceneFull(text);
  if(!sceneInfo) return;
  const key = sceneInfo.type;
  if(key === _currentSceneKey) return;
  _currentSceneKey = key;
  cb.className = cb.className.split(' ').filter(c=>!c.startsWith('scene-')).join(' ');
  cb.classList.add('scene-' + sceneInfo.type);
  updateSceneBanner(sceneInfo);
  if(typeof soundSceneShift==='function') soundSceneShift();
  if(typeof soundAmbient==='function') soundAmbient(sceneInfo.type);
}

function resetScene(){
  const cb=document.getElementById('chat-box');
  if(cb) cb.className = cb.className.split(' ').filter(c=>!c.startsWith('scene-')).join(' ');
  _currentSceneKey='';
  updateSceneBanner(null);
  if(typeof soundStopAmbient==='function') soundStopAmbient();
}

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
try{const savedKey=localStorage.getItem('douro2ApiKey');if(savedKey)document.getElementById('apiKey').value=savedKey;
const legacy = localStorage.getItem('douro2Save');
if(legacy && !localStorage.getItem('douro2Save_1')){
  localStorage.setItem('douro2Save_1', legacy);
  localStorage.removeItem('douro2Save');
}
loadCurrentSlot();
const raw=localStorage.getItem(slotKey());
if(raw){const data=JSON.parse(raw);Object.assign(CORE,data.core);
if(!CORE.gender)CORE.gender='女';
if(!CORE.age)CORE.age=12;
if(!CORE.arcaneDesc)CORE.arcaneDesc='';
if(CORE.marks&&CORE.marks.length>0&&typeof CORE.marks[0]==='string')CORE.marks=CORE.marks.map(r=>({name:r,count:1,desc:''}));
if(CORE.arts&&CORE.arts.length>0&&typeof CORE.arts[0]==='string')CORE.arts=CORE.arts.map(s=>({name:s,desc:''}));
if(!CORE.npcs)CORE.npcs=[];
if(!CORE.time)CORE.time='收到星辉信当天';
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
Object.assign(PLOT,data.plot);return true}}catch(e){console.error('读档失败',e)}
return false;
}
function resetSave(){if(confirm("清空当前存档？")){localStorage.removeItem(slotKey());document.getElementById('config-inputs').classList.remove('hidden');location.reload()}}

// ============================================================
//  剧情回放
// ============================================================
function openReplay(){
  const el = document.getElementById('replayModal');
  if(!el) return;
  el.innerHTML = '<div class="modal-box"><h3>剧情回放</h3>'
    + '<input id="replaySearch" placeholder="搜索关键词..." oninput="renderReplayList(this.value)" style="width:100%;padding:8px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#f0f6fc;margin-bottom:10px;">'
    + '<div id="replayList" class="replay-list"></div>'
    + '<div class="btn-row"><button class="btn-close" onclick="closeModal(\'replayModal\')">关闭</button></div></div>';
  openModal('replayModal');
  renderReplayList('');
}
function renderReplayList(keyword){
  const list = document.getElementById('replayList');
  if(!list) return;
  const kw = String(keyword||'').trim();
  const items = PLOT.history.filter(m => m.role === 'assistant').map((m, i) => {
    const t = stripStatus(m.content);
    return { idx: i, text: t };
  }).filter(x => !kw || x.text.includes(kw));
  if(items.length === 0){ list.innerHTML = '<div style="text-align:center;color:#8b949e;padding:20px;">无匹配记录</div>'; return; }
  list.innerHTML = items.slice(-50).reverse().map(x =>
    '<div class="replay-item" onclick="scrollToReply(' + x.idx + ')">' + escapeHtml(x.text.slice(0,80)) + (x.text.length>80?'…':'') + '</div>'
  ).join('');
}
function scrollToReply(idx){
  const allMsg = chatBox.querySelectorAll('.msg-ai');
  if(allMsg[idx]){ allMsg[idx].scrollIntoView({behavior:'smooth', block:'center'}); allMsg[idx].style.background='rgba(88,166,255,0.15)'; setTimeout(function(){ allMsg[idx].style.background=''; },1500); }
  closeModal('replayModal');
}

// ============================================================
//  导出 / 导入存档
// ============================================================
function openExport(){
  const raw = localStorage.getItem(slotKey()) || '{}';
  const code = btoa(unescape(encodeURIComponent(raw)));
  const el = document.getElementById('exportModal');
  el.innerHTML = '<div class="modal-box"><h3>导出存档 ' + CURRENT_SLOT + '</h3>'
    + '<p style="font-size:12px;color:#8b949e;margin-bottom:8px;">复制下面全部文字，即可在别的设备导入。</p>'
    + '<textarea readonly style="width:100%;height:180px;padding:10px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#f0f6fc;font-size:12px;font-family:monospace;line-height:1.5;">' + code + '</textarea>'
    + '<div class="btn-row"><button class="btn-close" onclick="closeModal(\'exportModal\')">关闭</button>'
    + '<button class="btn-save" onclick="copyExport()">复制</button></div></div>';
  openModal('exportModal');
}
function copyExport(){
  const ta = document.querySelector('#exportModal textarea');
  if(ta){ ta.select(); document.execCommand('copy'); alert('已复制到剪贴板'); }
}
function openImport(){
  const el = document.getElementById('importModal');
  el.innerHTML = '<div class="modal-box"><h3>导入存档到槽 ' + CURRENT_SLOT + '</h3>'
    + '<p style="font-size:12px;color:#8b949e;margin-bottom:8px;">把之前导出的文字粘贴到下面，会覆盖当前槽。</p>'
    + '<textarea id="importText" placeholder="粘贴存档字符串..." style="width:100%;height:180px;padding:10px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#f0f6fc;font-size:12px;font-family:monospace;line-height:1.5;"></textarea>'
    + '<div class="btn-row"><button class="btn-close" onclick="closeModal(\'importModal\')">取消</button>'
    + '<button class="btn-save" onclick="doImport()">导入</button></div></div>';
  openModal('importModal');
}
function doImport(){
  const t = document.getElementById('importText').value.trim();
  if(!t) return alert('请先粘贴内容');
  try{
    const raw = decodeURIComponent(escape(atob(t)));
    JSON.parse(raw);
    localStorage.setItem(slotKey(), raw);
    alert('导入成功，即将刷新');
    location.reload();
  }catch(e){ alert('导入失败：' + e.message); }
}

function goHome(){if(isGenerating){alert("正在生成，请等待完成");return}if(confirm("返回主界面？")){saveToPhone();if(typeof soundStopAmbient==='function')soundStopAmbient();if(typeof soundStopBgm==='function')soundStopBgm();gameArea.style.display='none';configPanel.style.display='block';initApp()}}
function selectMode(mode){if(mode!=='rpg'){alert('模拟器模式尚未开放，敬请期待');return}document.getElementById('mode-select').classList.add('hidden');document.getElementById('config-panel').classList.remove('hidden');initApp().catch(e=>console.error(e))}

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
    Object.assign(CORE, {name:'',avatar:_keepAvatar2,gender:'女',age:12,roleDesc:'',arcane:'未觉醒',arcaneDesc:'',aptitude:5,mana:1,marks:[],arts:[],npcs:[],flags:{},summary:'',time:'收到星辉信当天',term:'一年级上学期',weather:'',chapterNum:0,chapterTitle:''});
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
//  属性变化
// ============================================================
function triggerStatPowerPulse(){
  const el = document.getElementById('status-bar');
  if(!el) return;
  el.classList.remove('stat-power-pulse');
  void el.offsetWidth;
  el.classList.add('stat-power-pulse');
  setTimeout(()=>el.classList.remove('stat-power-pulse'), 1200);
}

function triggerStageUpgrade(oldStage, newStage){
  const el = document.getElementById('status-bar');
  if(el){
    el.classList.remove('stage-upgrade');
    void el.offsetWidth;
    el.classList.add('stage-upgrade');
    setTimeout(()=>el.classList.remove('stage-upgrade'), 1600);
  }
  const banner = document.createElement('div');
  banner.className = 'stage-banner';
  banner.textContent = `${oldStage} → ${newStage}`;
  document.body.appendChild(banner);
  setTimeout(()=>banner.remove(), 2200);
}

function addSkill(name, desc){
  if(!CORE.arts) CORE.arts=[];
  const exist = CORE.arts.find(s=>s.name === name);
  if(exist){
    if(desc) exist.desc = desc;
    return;
  }
  CORE.arts.push({name, desc});
  chatBox.innerHTML += `<div class="msg-skill">获得术式技：${escapeHtml(name)}</div>`;
}

function addRing(name, desc){
  if(!CORE.marks) CORE.marks=[];
  const exist = CORE.marks.find(r=>r.name === name);
  if(exist){
    exist.count = (exist.count||1) + 1;
    if(desc) exist.desc = desc;
    return;
  }
  CORE.marks.push({name, count:1, desc});
  chatBox.innerHTML += `<div class="msg-ring">获得刻印：${escapeHtml(name)}</div>`;
  if(typeof soundRing==='function') soundRing(name);
}

function addNPC(name, gender, arcane, mana, relation, desc, affinity){
  if(!CORE.npcs) CORE.npcs=[];
  const exist = CORE.npcs.find(n=>n.name === name);
  if(exist){
    if(gender) exist.gender = gender;
    if(arcane) exist.arcane = arcane;
    if(mana) exist.mana = mana;
    if(relation) exist.relation = relation;
    if(desc) exist.desc = desc;
    if(typeof affinity === 'number') exist.affinity = affinity;
    if(exist.status === 'archived'){
      exist.status = 'active';
      exist.term = CORE.term;
      delete exist.archTime;
      delete exist.snapshot;
      chatBox.innerHTML += `<div class="msg-npc">再遇人物：${escapeHtml(name)}</div>`;
    } else {
      chatBox.innerHTML += `<div class="msg-npc">人物更新：${escapeHtml(name)}</div>`;
    }
    return;
  }
  CORE.npcs.push({
    name, gender: gender || '未知', arcane: arcane || '未知',
    mana: mana || '', relation: relation || '中立',
    desc: desc || '', term: CORE.term, status: 'active',
    affinity: typeof affinity === 'number' ? affinity : 0,
    archTime: '', snapshot: null
  });
  chatBox.innerHTML += `<div class="msg-npc">新人物：${escapeHtml(name)}</div>`;
}

function deleteSkill(name){ CORE.arts = CORE.arts.filter(s => s.name !== name); }
function deleteRing(name){ CORE.marks = CORE.marks.filter(r => r.name !== name); }
function deleteNPC(name){ CORE.npcs = CORE.npcs.filter(n => n.name !== name); }

function setTerm(term){
  if(!term || CORE.term === term) return;
  CORE.term = term;
  chatBox.innerHTML += `<div class="msg-sys">学期推进：${escapeHtml(term)}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function archiveTerm(term){
  if(!term) return;
  let count = 0;
  CORE.npcs.forEach(n => {
    if(n.term === term && n.status !== 'archived'){
      n.status = 'archived';
      n.archTime = CORE.time;
      n.snapshot = { arcane: n.arcane, mana: n.mana, relation: n.relation, desc: n.desc, affinity: n.affinity };
      count++;
    }
  });
  if(count > 0){
    chatBox.innerHTML += `<div class="msg-sys">学期归档：${escapeHtml(term)}（${count}人）</div>`;
  }
}

function insertChapterDivider(num, title){
  chatBox.innerHTML += `<div class="msg-chapter">第${num}章 · ${escapeHtml(title)}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function generateChapterTitle(){
  try{
    const recent = PLOT.history.slice(-6).map(m => stripStatus(m.content)).join('\n');
    if(!recent) return '';
    const prompt = `根据以下剧情，为这一章起一个 4-8 字的标题。只输出标题，无标点，无前缀。\n\n${recent}`;
    const title = await callDeepSeekStream([{role:'user', content:prompt}], ()=>{});
    return String(title).replace(/[《》【】\n]/g,'').trim().slice(0, 10);
  } catch(e){
    return '';
  }
}

// ============================================================
//  状态栏刷新
// ============================================================
function updateStatus(){
const avatarEl=document.getElementById('s-avatar');
if(avatarEl){
  if(CORE.avatar){
    avatarEl.innerHTML=`<img src="${CORE.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;display:block;" alt="avatar">`;
  }else{
    avatarEl.innerHTML=`<div style="width:28px;height:28px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:12px;color:#9ca3af;">${escapeHtml((CORE.name||'?').charAt(0))}</div>`;
  }
}
const nameColor = CORE.gender === '女' ? '#f472b6' : (CORE.gender === '男' ? '#60a5fa' : '#f0f6fc');
document.getElementById('s-name').innerHTML=icon('name','#8b949e')+`<span style="color:${nameColor}">${escapeHtml(CORE.name||"未命名")}</span>`;

if(document.getElementById('s-age'))document.getElementById('s-age').innerHTML=icon('age','#8b949e')+escapeHtml((CORE.age||'?')+'岁');

const soulText = CORE.arcane || "未觉醒";
const shortSoul = soulText.length > 8 ? soulText.substring(0, 8) + '...' : soulText;
const soulEl = document.getElementById('s-soul');
soulEl.innerHTML = icon('soul','#f0883e') + escapeHtml(shortSoul);
if (soulText.length > 8) {
    soulEl.classList.add('soul-clickable');
    soulEl.onclick = showSoulDesc;
} else {
    soulEl.classList.remove('soul-clickable');
    soulEl.onclick = null;
}

document.getElementById('s-soulpower').innerHTML=icon('power','#f0f6fc')+(CORE.mana||0);
document.getElementById('s-stage').innerHTML=icon('stage','#8b949e')+getStage(CORE.mana);
document.getElementById('s-time').innerHTML=icon('time','#8b949e')+escapeHtml(CORE.time||"未知");
saveToPhone();
}

function showSoulDesc() {
    const soulText = CORE.arcane || "未觉醒";
    let html = `<div style="font-size:16px;font-weight:bold;color:#f0883e;margin-bottom:8px;">${escapeHtml(soulText)}</div>`;
    if (CORE.arcaneDesc) {
        html += `<div style="font-size:14px;line-height:1.6;">${escapeHtml(CORE.arcaneDesc)}</div>`;
    } else {
        html += `<div style="font-size:14px;color:#8b949e;">暂无详细描述</div>`;
    }
    document.getElementById('soulDescContent').innerHTML = html;
    openModal('soulModal');
}

// ============================================================
//  业务弹窗
// ============================================================
function openRings(){const container=document.getElementById('ringsContent');if(SETTINGS.useRingsVisual&&CORE.marks.length>0){container.innerHTML=renderRingsVisual(CORE.marks)}else{renderExpandableList(container,CORE.marks,{emptyText:'无刻印',nameClassFn:(r)=>getMarkColorClass(r.name),removeFn:'removeRingItem'})}openModal('ringsModal')}
function removeRingItem(idx){CORE.marks.splice(idx,1);updateStatus();openRings()}
function openSkills(){renderExpandableList(document.getElementById('skillsContent'),CORE.arts,{emptyText:'无术式技',removeFn:'removeSkillItem'});openModal('skillsModal')}
function removeSkillItem(idx){CORE.arts.splice(idx,1);updateStatus();openSkills()}
function openNPCs(){
  renderExpandableList(document.getElementById('npcsContent'),CORE.npcs,{
    emptyText:'暂无重要人物',
    avatarFn:(n)=>avatarHTML(n.name),
    removeFn:'removeNPCItem',
    nameClassFn:(n)=>n.status==='archived'?'npc-archived':'',
    detailFn:(n)=>{
      const tag = n.status==='archived' ? `<span style="color:#a78bfa;">【已归档 · 定格于「${escapeHtml(n.archTime||'')}」】</span>` : `<span style="color:#4ade80;">【现役 · ${escapeHtml(n.term||'一年级上学期')}】</span>`;
      const aff = typeof n.affinity === 'number' ? `<div>好感：<span style="color:${affinityColor(n.affinity)}">${n.affinity}</span> / 100</div>` : '';
      return `${tag}<div style="margin-top:6px;">性别：${escapeHtml(n.gender||'?')}</div><div>术式：${escapeHtml(n.arcane||'?')}</div><div>魔力：${escapeHtml(n.mana||'未知')}</div>${aff}<div>关系：${escapeHtml(n.relation||'?')}</div><div style="margin-top:6px;color:#c9d1d9;">${escapeHtml(n.desc||'')}</div>`;
    }
  });
  openModal('npcsModal');
}
function affinityColor(v){
  if(v>=81) return '#f472b6';
  if(v>=61) return '#4ade80';
  if(v>=41) return '#60a5fa';
  if(v>=21) return '#fbbf24';
  return '#8b949e';
}
function removeNPCItem(idx){CORE.npcs.splice(idx,1);updateStatus();openNPCs()}

// ============================================================
//  选项
// ============================================================
function extractOptions(text){
const opts=[];
const lines=text.split('\n');
let inOptions=false;
for(const line of lines){
if(/【选项】/.test(line)){inOptions=true;continue}
if(inOptions){
const trimmed=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();
if(trimmed.length>0&&trimmed.length<60)opts.push(trimmed);
if(opts.length>=3)break;
}
}
return opts.slice(0,3);
}
function classifyOption(text){
  const t = String(text||'').trim();
  if(/^(攻击|战斗|出手|拔|挥|击|挑战|应战|偷袭|反手|抢先|冲上去|打|轰|砸|催动|施展)/.test(t)) return {icon:'⚔️', label:'战斗'};
  if(/^(说|问|回答|交谈|询问|告诉|开口|聊|喊|招呼|打招呼|回头|低声|高声|回应)/.test(t)) return {icon:'💬', label:'对话'};
  if(/^(想|回忆|思考|审视|琢磨|推测|沉思|观察|打量|注意|冷静|深吸|凝神)/.test(t)) return {icon:'💭', label:'思考'};
  if(/^(用|使|吃|喝|拿|取|掏出|动用|服用|吞下|拉开|点燃)/.test(t)) return {icon:'🎒', label:'使用'};
  if(/^(去|走|进入|前往|探索|查看|搜寻|寻找|翻找|推门|离开|赶到|溜出|跟随|转身)/.test(t)) return {icon:'🔍', label:'探索'};
  return {icon:'✨', label:'行动'};
}
function appendOptions(aiOptions){
  const old = optionsArea.querySelector('.options-container');
  const doRender = () => {
    const container=document.createElement('div');
    container.className='options-container opt-enter';
    if(aiOptions&&aiOptions.length>0){
      aiOptions.forEach(text=>{
        const cls = classifyOption(text);
        const btn=document.createElement('button');
        btn.className='option-btn';
        btn.dataset.type = cls.label;
        btn.innerHTML = `<span class="opt-icon">${cls.icon}</span><span class="opt-text">${escapeHtml(text)}</span>`;
        btn.onclick=()=>{
          if(isGenerating)return;
          if(btn.disabled)return;
          btn.disabled=true;
          btn.classList.add('opt-picked');
          container.querySelectorAll('.option-btn').forEach(b=>{
            if(b!==btn) b.classList.add('opt-dim');
          });
          setTimeout(()=>container.classList.add('opt-exit'), 180);
          setTimeout(()=>sendAction(text), 360);
        };
        container.appendChild(btn);
      });
    }else{
      const btn=document.createElement('button');
      btn.className='option-btn';
      btn.dataset.type = '行动';
      btn.innerHTML = `<span class="opt-icon">▶️</span><span class="opt-text">继续剧情</span>`;
      btn.onclick=()=>{
        if(isGenerating)return;
        if(btn.disabled)return;
        btn.disabled=true;
        btn.classList.add('opt-picked');
        setTimeout(()=>container.classList.add('opt-exit'), 180);
        setTimeout(()=>sendAction('继续'), 360);
      };
      container.appendChild(btn);
    }
    optionsArea.appendChild(container);
    optionsArea.scrollIntoView({behavior:'smooth',block:'nearest'});
  };

  if(old && old.parentNode){
    old.classList.add('opt-exit');
    let finished = false;
    const finish = () => {
      if(finished) return;
      finished = true;
      if(old.parentNode) old.remove();
      doRender();
    };
    old.addEventListener('animationend', finish, {once:true});
    setTimeout(finish, 350);
  } else {
    if(old) old.remove();
    doRender();
  }
}

// ============================================================
//  状态解析
// ============================================================
const STATUS_LINE_RE=/^(年龄[：:]|魔力\s*[+\-：:]|魔力\s*(提升|增加|提高|升至|达到|变为)|获得术式技[：:]|删除术式技[：:]|获得刻印[：:]|删除刻印[：:]|人物[：:]|重要人物[：:]|新人物[：:]|删除人物[：:]|时间[：:]|学期[：:]|归档学期[：:])/;
function stripStatus(text){let result=text.replace(/【状态更新】[\s\S]*?(?=【选项】|$)/g,'');result=result.replace(/【选项】[\s\S]*/g,'');const lines=result.split('\n');const kept=lines.filter(line=>{const t=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();if(!t)return true;if(STATUS_LINE_RE.test(t))return false;return true});return kept.join('\n').trim()}
function parseSeg(seg){let name=seg,count=1,desc='';const descM=seg.match(/^(.+?)[（(](.+?)[）)]\s*$/);if(descM){name=descM[1].trim();desc=descM[2].trim()}const cntM=name.match(/[×xX*](\d+)\s*(个|枚|颗|件|本|张|块|份)?\s*$/);if(cntM){count=parseInt(cntM[1])||1;name=name.replace(/[×xX*]\d+\s*(个|枚|颗|件|本|张|块|份)?\s*$/,'').trim()}const cnM=name.match(/^(.+?)([一二三四五六七八九十百千万]+)(个|枚|颗|件|本|张|块|份)\s*$/);if(cnM){count=chineseToNumber(cnM[2]);name=cnM[1].trim()}return{name,count,desc}}

async function parseStructuredUpdate(narrative, userAction){
  const schemaExample = JSON.stringify({
    age: null,
    manaDelta: 0,
    manaAbsolute: null,
    time: "描述",
    skills: [],
    delSkills: [],
    rings: [],
    delRings: [],
    npcs: [],
    delNpcs: [],
    term: null,
    archiveTerm: null,
    options: ["行动1", "行动2", "行动3"]
  });

  const prompt = `你是星辉学院游戏的状态解析器。
请阅读以下剧情叙事和玩家行动，提取本轮的状态更新和选项。

当前主角状态：
- 年龄：${CORE.age}
- 魔力：${CORE.mana}级
- 时间：${CORE.time}
- 学期：${CORE.term}
- 已有刻印：${CORE.marks.map(r=>r.name).join('、') || '无'}
- 已有术式技：${CORE.arts.map(s=>s.name).join('、') || '无'}
- 现役人物：${CORE.npcs.filter(n=>n.status!=='archived').map(n=>n.name).join('、') || '无'}

【本轮剧情】
${narrative}

【玩家行动】
${userAction || '（继续）'}

请输出一个 JSON 对象，严格遵循以下格式：
${schemaExample}

字段说明：
- age：如果剧情中主角年龄变化，填新年龄（12-18）；否则 null。
- manaDelta：如果魔力有增减，填增量；否则 0。
- manaAbsolute：如果魔力提升到具体等级，填该等级；否则 null。
- time：本轮剧情的时间描述，必须填。
- skills：本轮获得的术式技列表，每项 {"name":"名称","desc":"描述"}。
- delSkills：本轮删除的术式技名称列表。
- rings：本轮获得的刻印列表，每项 {"name":"颜色+名称（如白初刻、黄浅刻）","desc":"描述"}。
- delRings：本轮删除的刻印名称列表。
- npcs：本轮新增或更新的人物列表，每项 {"name":"姓名","gender":"性别","arcane":"术式","mana":"魔力","relation":"关系","desc":"描述","affinity":0-100}。
- delNpcs：本轮删除的人物名称列表。
- term：如果进入新学期，填学期名；否则 null。
- archiveTerm：如果归档某个学期，填学期名；否则 null。
- options：给玩家的 2-3 个可执行行动。

注意：
- 只填有变化的字段，没有变化就填 null 或 0 或 空数组。
- options 必须包含 2-3 个具体行动。
- 直接输出 JSON，不要任何前缀说明。`;

  const messages = [{role:'user', content: prompt}];
  let raw = '';
  try {
    raw = await callDeepSeekStream(messages, null, {jsonMode: true});
    let clean = raw.trim();
    if(clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    const obj = JSON.parse(clean);

    const update = {
      age: (obj.age !== null && obj.age !== undefined) ? parseInt(obj.age) : null,
      soulPowerBase: parseInt(obj.manaDelta) || 0,
      soulPowerAbsolute: (obj.manaAbsolute !== null && obj.manaAbsolute !== undefined) ? parseInt(obj.manaAbsolute) : null,
      skills: Array.isArray(obj.skills) ? obj.skills.filter(s=>s && s.name) : [],
      delSkills: Array.isArray(obj.delSkills) ? obj.delSkills : [],
      rings: Array.isArray(obj.rings) ? obj.rings.filter(r=>r && r.name) : [],
      delRings: Array.isArray(obj.delRings) ? obj.delRings : [],
      npcs: Array.isArray(obj.npcs) ? obj.npcs.filter(n=>n && n.name) : [],
      delNpcs: Array.isArray(obj.delNpcs) ? obj.delNpcs : [],
      time: obj.time || null,
      term: obj.term || null,
      archiveTerm: obj.archiveTerm || null
    };
    const options = Array.isArray(obj.options) ? obj.options.filter(o=>typeof o === 'string' && o.trim()).slice(0,3) : [];
    return {update, options};
  } catch(e) {
    console.warn('JSON 状态解析失败，回退到文本解析', e);
    const update = parseStatusUpdate(narrative + '\n' + userAction);
    sniffNarrativeUpdates(narrative + '\n' + userAction, update);
    const options = extractOptions(narrative);
    return {update, options, fallback: true};
  }
}

function parseStatusUpdate(text){
const update={age:null,soulPowerBase:0,soulPowerAbsolute:null,skills:[],delSkills:[],rings:[],delRings:[],npcs:[],delNpcs:[],time:null,term:null,archiveTerm:null};
let block='';
const m=text.match(/【状态更新】([\s\S]*?)(?=【选项】|$)/);
if(m){block=m[1]}else{const lines=text.split('\n');const statusLines=[];for(const line of lines){const t=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();if(STATUS_LINE_RE.test(t))statusLines.push(t)}block=statusLines.join('\n')}
if(!block)return update;
let mm=block.match(/年龄\s*[：:]\s*(\d+)/);
if(mm)update.age=parseInt(mm[1])||null;
mm=block.match(/魔力\s*(?:提升|增加|提高|升至|达到|变为|变成)(?:至|到)?\s*(\d+)/i);
if(mm){const v=parseInt(mm[1]);if(v>0)update.soulPowerAbsolute=v}else{mm=block.match(/魔力\s*[：:]?\s*([+-]\d+)/);if(mm){const v=parseInt(mm[1]);if(v!==0)update.soulPowerBase=v}}
const lines=block.split('\n').map(l=>l.trim()).filter(Boolean);
for(let line of lines){
line=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();
if(!line)continue;
const km=line.match(/^(获得术式技|删除术式技|获得刻印|删除刻印|人物|重要人物|新人物|删除人物|时间|学期|归档学期)[：:]\s*(.+)$/);
if(!km)continue;
const kw=km[1];const content=km[2].trim();
if(kw==='获得术式技')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);if(!isPlaceholder(p.name))update.skills.push({name:p.name,desc:p.desc})});
else if(kw==='删除术式技')smartSplit(content).forEach(seg=>{const n=seg.trim();if(!isPlaceholder(n))update.delSkills.push(n)});
else if(kw==='获得刻印')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);if(!isPlaceholder(p.name))update.rings.push({name:p.name,desc:p.desc})});
else if(kw==='删除刻印')smartSplit(content).forEach(seg=>{const n=seg.trim();if(!isPlaceholder(n))update.delRings.push(n)});
else if(kw==='人物'||kw==='重要人物'||kw==='新人物'){
  smartSplit(content).forEach(seg=>{
    const parts=seg.split('/').map(s=>s.trim());
    if(parts.length<2||!parts[0]||isPlaceholder(parts[0])||parts[0].length>15)return;
    let mana='',relation='中立',desc='',affinity=0;
    if(parts.length>=6){
      mana=parts[3]||'';
      relation=parts[4]||'中立';
      desc=parts.slice(5).join('/')||'';
    }else{
      relation=parts[3]||'中立';
      desc=parts[4]||'';
    }
    const affM = desc.match(/好感[:：]?\s*(\d+)/);
    if(affM) affinity = parseInt(affM[1]);
    update.npcs.push({name:parts[0],gender:parts[1]||'未知',arcane:parts[2]||'未知',mana,relation,desc,affinity});
  });
}
else if(kw==='删除人物')smartSplit(content).forEach(seg=>{const n=seg.trim();if(!isPlaceholder(n))update.delNpcs.push(n)});
else if(kw==='时间'){if(!isPlaceholder(content))update.time=content}
else if(kw==='学期'){if(!isPlaceholder(content))update.term=content.trim()}
else if(kw==='归档学期'){if(!isPlaceholder(content))update.archiveTerm=content.trim()}
}
return update;
}

function applyUpdate(update){
if(update.age!==null&&update.age>0)CORE.age=Math.min(Math.max(update.age,12),18);
const oldSP=CORE.mana,oldStage=getStage(oldSP);
if(update.soulPowerAbsolute!==null&&update.soulPowerAbsolute>0)CORE.mana=Math.min(Math.max(update.soulPowerAbsolute,1),100);
else if(update.soulPowerBase!==0){let base=update.soulPowerBase;if(base>20)base=20;if(base<-20)base=-20;let factor=(base>0)?getSpeedFactor():1;CORE.mana=Math.min(Math.max(CORE.mana+Math.round(base*factor),1),100)}
if(CORE.mana!==oldSP){
  const newStage=getStage(CORE.mana);
  const diff=CORE.mana-oldSP;
  let txt=`魔力 ${oldSP} → ${CORE.mana}（${diff>0?'+':''}${diff}）`;
  if(newStage!==oldStage)txt+=` · 晋阶 ${oldStage} → ${newStage}`;
  chatBox.innerHTML+=`<div class="msg-power">${icon('power','#fbbf24')}${escapeHtml(txt)}</div>`;
  triggerStatPowerPulse();
  if(typeof soundPower==='function') soundPower();
  if(newStage!==oldStage) triggerStageUpgrade(oldStage,newStage);
}
if(update.term)setTerm(update.term);
if(update.archiveTerm)archiveTerm(update.archiveTerm);
(update.skills||[]).forEach(s=>addSkill(s.name,s.desc));
(update.delSkills||[]).forEach(n=>deleteSkill(n));
(update.rings||[]).forEach(r=>addRing(r.name,r.desc));
(update.delRings||[]).forEach(n=>deleteRing(n));
(update.npcs||[]).forEach(n=>addNPC(n.name,n.gender,n.arcane,n.mana,n.relation,n.desc,n.affinity));
(update.delNpcs||[]).forEach(n=>deleteNPC(n));
if(update.time){CORE.time=update.time;chatBox.innerHTML+=`<div class="msg-time">${icon('time','#94a3b8')}${escapeHtml(update.time)}</div>`}
if(update.time){
  if(_currentSceneKey){
    const type = _currentSceneKey;
    const found = SCENE_TYPES.find(t => t.type === type) || SCENE_PLACES.find(p => p.type === type);
    if(found) updateSceneBanner({name:found.name, type:found.type, emoji:found.emoji});
  }
}
updateStatus();
}

function sniffNarrativeUpdates(fullReply, update){
  const narrative = stripStatus(fullReply);
  if(!narrative) return;

  if(update.rings.length === 0){
    const colorRe = /(白初刻|黄浅刻|紫深刻|黑夜刻|红血刻|金星刻)/;
    const contextRe = /(刻印|解锁|获得|觉醒)/;
    const cm = narrative.match(colorRe);
    if(cm && contextRe.test(narrative)){
      const exists = CORE.marks.some(r => r.name.includes(cm[1]));
      if(!exists){
        update.rings.push({ name: cm[1], desc: '' });
        chatBox.innerHTML += `<div class="msg-sys" style="font-size:12px;color:#a78bfa;">⚠️ 正文检测到刻印但状态块未写，已自动补录：${escapeHtml(cm[1])}</div>`;
      }
    }
  }

  if(update.soulPowerBase === 0 && update.soulPowerAbsolute === null){
    const lvlRe = /魔力(?:提升|突破|达到|升至|涨到|到达)\s*(?:到|至)?\s*(\d+)\s*级/g;
    let m;
    while((m = lvlRe.exec(narrative)) !== null){
      const v = parseInt(m[1]);
      if(v > CORE.mana && v <= 100){
        update.soulPowerAbsolute = v;
        chatBox.innerHTML += `<div class="msg-sys" style="font-size:12px;color:#a78bfa;">⚠️ 正文检测到魔力提升但状态块未写，已自动补录：${CORE.mana} → ${v}</div>`;
        break;
      }
    }
  }
}

function buildCoreSummary(playerInput){
let s='';
s+=`姓名：${CORE.name}（${CORE.gender}），${CORE.age||'?'}岁。\n`;
s+=`设定：${CORE.roleDesc}\n`;
s+=`本命术式：${CORE.arcane}（术式适性${CORE.aptitude}级）\n`;
if(CORE.arcaneDesc) s+=`术式描述：${CORE.arcaneDesc}\n`;
s+=`魔力：${CORE.mana}级（${getStage(CORE.mana)}）\n`;
s+=`时间：${CORE.time}\n`;
s+=`当前学期：${CORE.term}\n`;
s+=`刻印：${CORE.marks.map(r=>r.name).join('、')||'无'}\n`;
s+=`术式技：${CORE.arts.map(x=>x.name).join('、')||'无'}\n`;
const activeNPCs=CORE.npcs.filter(n=>n.status!=='archived');
const archivedNPCs=CORE.npcs.filter(n=>n.status==='archived');
if(activeNPCs.length>0)s+=`【现役人物】\n${activeNPCs.map(n=>`- ${n.name}（${n.gender}·${n.arcane}·魔力${n.mana||'?'}·${n.relation}·好感${n.affinity||0}）：${n.desc||''}`).join('\n')}\n`;
if(archivedNPCs.length>0){
  s+=`【归档人物】（玩家过去时期的故人，再遇时须体现时间差并重新激活）\n`;
  s+=archivedNPCs.map(n=>{
    const snap=n.snapshot||{};
    return `- ${n.name}（${n.gender}·${snap.arcane||n.arcane}·魔力${snap.mana||'?'}·${snap.relation||n.relation}·归档于「${n.archTime}」）：${snap.desc||n.desc||''}`;
  }).join('\n');
  s+='\n';
}
if(CORE.summary)s+=`【前情】${CORE.summary}\n`;
if(Object.keys(MEDIA.worldbook).length>0){
  const recentText = PLOT.history.slice(-3).map(m=>stripStatus(m.content)).join('\n');
  const loreText = triggerLorebook(playerInput || '', recentText, 5);
  if(loreText) s += loreText + '\n';
}
return s;
}

function buildCurrentSituation(){
  const parts = [];
  if(CORE.time) parts.push(CORE.time);
  if(CORE.term && CORE.term !== '一年级上学期') parts.push(CORE.term);
  if(_currentSceneKey){
    const s = SCENE_TYPES.find(t=>t.type===_currentSceneKey) || SCENE_PLACES.find(p=>p.type===_currentSceneKey);
    if(s) parts.push('在'+s.name);
  }
  const lastUser = [...PLOT.history].reverse().find(m=>m.role==='user');
  if(lastUser && lastUser.content){
    const a = String(lastUser.content).trim();
    if(a && a !== '（继续）' && a !== '继续' && a.length < 60){
      parts.push('刚做了：' + a);
    }
  }
  return parts.join(' · ') || '故事开场';
}
function buildRecentEvents(){
  const recent = PLOT.history.slice(-6).filter(m => m.role === 'assistant');
  const events = [];
  recent.forEach(m => {
    const t = stripStatus(m.content);
    const first = t.split(/[。！？\n]/)[0].trim();
    if(first && first.length >= 6 && first.length <= 60){
      events.push(first);
    }
  });
  const unique = [...new Set(events)].slice(-3);
  if(unique.length === 0) return '';
  return unique.map(e => '- ' + e).join('\n');
}

function isNearBottom(threshold){
  threshold = threshold || 100;
  return chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < threshold;
}

async function streamAndProcess(messages, opts){
const aiMsgDiv=document.createElement('div');
aiMsgDiv.className='msg-ai streaming';
aiMsgDiv.textContent='...';
chatBox.appendChild(aiMsgDiv);
chatBox.scrollTop=chatBox.scrollHeight;

let userPinnedUp = false;
let lastTop = chatBox.scrollTop;
function onStreamScroll(){
  const cur = chatBox.scrollTop;
  const atBottom = chatBox.scrollHeight - cur - chatBox.clientHeight < 40;
  if(cur < lastTop - 5 && !atBottom){ userPinnedUp = true; }
  else if(atBottom){ userPinnedUp = false; }
  lastTop = cur;
}
chatBox.addEventListener('scroll', onStreamScroll);

const tw = { pending: '', shown: 0, timer: null, done: false };
function twTick(){
  tw.timer = null;
  if(!aiMsgDiv.parentNode) return;
  if(tw.shown >= tw.pending.length){ if(!tw.done) return; }
  if(tw.shown >= tw.pending.length) return;
  const ch = tw.pending[tw.shown];
  tw.shown++;
  aiMsgDiv.innerHTML = formatNarrative(escapeHtml(tw.pending.slice(0, tw.shown)));
  if(!userPinnedUp) chatBox.scrollTop = chatBox.scrollHeight;
  if(typeof soundType==='function') soundType();
  let delay = 22;
  if('，。？！；、'.includes(ch)) delay = 100;
  else if(ch === '\n') delay = 180;
  tw.timer = setTimeout(twTick, delay);
}
function twPush(newText){
  if(newText.length < tw.shown) tw.shown = newText.length;
  tw.pending = newText;
  if(!tw.timer && tw.shown < tw.pending.length) twTick();
}

let displayContent="";
try{
const fullReply=await callDeepSeekStream(messages,(delta,full)=>{
  displayContent = stripStatus(full);
  if(!displayContent && full) displayContent = full;
  twPush(displayContent);
}, opts);
tw.done = true;
if(tw.timer){ clearTimeout(tw.timer); tw.timer = null; }
tw.shown = tw.pending.length;
if(!tw.pending && fullReply){
  tw.pending = stripStatus(fullReply) || '（AI 未返回叙事，请继续）';
  tw.shown = tw.pending.length;
}
aiMsgDiv.innerHTML = formatNarrative(escapeHtml(tw.pending)) || '...';
aiMsgDiv.classList.remove('streaming');
chatBox.removeEventListener('scroll', onStreamScroll);
applyScene(displayContent);
return fullReply;
}catch(e){
if(tw.timer) clearTimeout(tw.timer);
chatBox.removeEventListener('scroll', onStreamScroll);
aiMsgDiv.classList.remove('streaming');
aiMsgDiv.textContent='生成失败：'+e.message;
throw e;
}
}

// ============================================================
//  调试命令
// ============================================================
function handleDebugCommand(rawText){
let text=rawText.trim();
if(!text){chatBox.innerHTML+=`<div class="msg-debug">用法：/调试 获得刻印 白初刻</div>`;return}
text=normalizeDebugText(text);
const pseudo=`【状态更新】\n${text}\n`;
const update=parseStatusUpdate(pseudo);
const hasAny=update.skills.length>0||update.delSkills.length>0||update.rings.length>0||update.delRings.length>0||update.npcs.length>0||update.delNpcs.length>0||update.time!==null||update.term!==null||update.archiveTerm!==null||update.soulPowerAbsolute!==null||update.soulPowerBase!==0||update.age!==null;
if(!hasAny){chatBox.innerHTML+=`<div class="msg-debug">无法识别，请用：/调试 获得刻印 白初刻</div>`;return}
applyUpdate(update);
chatBox.innerHTML+=`<div class="msg-debug">调试已应用</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
}
function handleLoreTest(testInput){
  const recentText = PLOT.history.slice(-3).map(m=>stripStatus(m.content)).join('\n');
  const result = triggerLorebook(testInput || '', recentText, 5);
  if(!result){
    chatBox.innerHTML += `<div class="msg-debug">未命中任何资料条目。试试：/测 我去迷雾街区</div>`;
  }else{
    chatBox.innerHTML += `<div class="msg-debug" style="text-align:left;white-space:pre-wrap;">${escapeHtml(result)}</div>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

function normalizeDebugText(text){
if(/^(获得术式技|删除术式技|获得刻印|删除刻印|人物|重要人物|新人物|删除人物|时间|魔力|年龄|学期|归档学期)[：:]/.test(text))return text;
let m;
if((m=text.match(/^年龄\s*(\d+)\s*$/)))return `年龄：${m[1]}`;
if((m=text.match(/^魔力\s*([+-]?\d+)\s*$/)))return `魔力 ${m[1]}`;
if((m=text.match(/^魔力\s*(?:提升至|提升到|达到|变为)\s*(\d+)\s*$/)))return `魔力 提升至${m[1]}`;
if((m=text.match(/^(?:认识|遇见|遇到|结识|加入|新增)\s*(?:人物|npc|NPC)?\s*(.+?)\s*$/))){const n=m[1].trim();if(n)return `人物：${n}/未知/未知/未知/相识/`}
if((m=text.match(/^删除人物\s+(.+?)\s*$/)))return `删除人物：${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*刻印\s*$/)))return `获得刻印：${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*术式技\s*$/)))return `获得术式技：${m[1]}`;
return '';
}

// ============================================================
//  主行动
// ============================================================
async function sendAction(forcedAction){
if(isGenerating)return;
const input=document.getElementById('userInput');
let action=forcedAction||input.value.trim();
if(!action)return;
if(!forcedAction)input.value='';
if(action.startsWith('/调试')){chatBox.innerHTML+=userMsgHtml(action,true);chatBox.scrollTop=chatBox.scrollHeight;handleDebugCommand(action.replace(/^\/调试\s*/,''));userInput.focus();return}
if(action.startsWith('/测')){chatBox.innerHTML+=userMsgHtml(action,true);chatBox.scrollTop=chatBox.scrollHeight;handleLoreTest(action.replace(/^\/测\s*/,''));userInput.focus();return}
chatBox.innerHTML+=userMsgHtml(action,false);
chatBox.scrollTop=chatBox.scrollHeight;
if(PLOT.isFirst){await awakenArcane();return}
isGenerating=true;sendBtn.disabled=true;userInput.disabled=true;
try{
const coreSummary=buildCoreSummary(action);
const currentSituation=buildCurrentSituation();
const recentEvents=buildRecentEvents();
const isContinue=action==='继续';

const narrativePrompts = {
  concise: `## 叙事风格 · 简洁
文字精炼，对话为主。场景描写不超过 2 句。`,
  standard: `## 叙事风格 · 标准
平衡描写与对话。场景、感官、心理各一点，不铺陈。`,
  ornate: `## 叙事风格 · 华丽
用丰富的感官和意象。场景描写可铺陈，但不超 6 句，且必须推动剧情。`
};
const styleBlock = narrativePrompts[SETTINGS.narrativeStyle] || narrativePrompts.standard;
const proactiveBlock = SETTINGS.npcProactive !== false
  ? `## NPC 主动性
每 2~3 轮让一个 NPC 主动说话或行动（递纸条、约饭、求助、提议、打断）。NPC 有自己的目标，世界是"活"的。`
  : '';

const systemPrompt = `## 你是谁
你是现代都市魔法学院「星辉学院」背景的小说叙事者。玩家就是主角"你"。

## 世界观
${FIXED_WORLD}

## 主角档案
${coreSummary}

## 当前处境
${currentSituation}
${recentEvents ? `\n## 最近关键事件\n${recentEvents}` : ''}

## 叙事范例（模仿此密度、节奏与用语）
地铁到站的风掀起你的衣角。你按信上的地址走出闸机，*抬头看见一栋废弃老楼*。
（就是这里吗……）
口袋里那封信微微发烫。你把它拿出来，背面那枚星辉印记正在发光。
眼前的老楼像水波一样晃了一下。再定睛看时，一座白色校门安静地立在晨光里。

【状态更新】
时间：入学第一天·上午
学期：一年级上学期
人物：校门口的接待老师/女/镜台/30级/接待老师/穿深蓝长外套，笑容温和/好感:20

【选项】
• 走上前，把信递给接待老师
• 先在校门口站一会儿，看看周围
• 低头检查信上的字迹

## 输出结构（严格按此顺序）
1) 叙事正文（第二人称，含分层标记）
2) 【状态更新】块（只在有变化时写该行）
3) 【选项】块（2-3 个，每项以"•"开头）

## 状态更新格式
年龄:N / 魔力+N 或 魔力提升至N / 时间:xxx
获得|删除术式技：名（描述）
获得|删除刻印：白初刻（描述）
人物：姓名/性别/术式/魔力/关系/描述/好感:N
删除人物：名 / 学期:名 / 归档学期:名

## 硬约束
- 时间每轮必写；其他字段仅在有变化时写，绝不写"无"。
- 只有写进【状态更新】的才生效。
- 人物行第 3 段是术式名（不是人名）；无信息填"未知"。
- 主角性别为 ${CORE.gender}，据此调整称呼、外貌、心理与社交描写。

## 叙事要求
- 场景优先使用现代都市 + 魔法学院的元素：高楼、地铁、便利店、术式商店、发光的铭牌、晶体玻璃、刻印手环。
- 日常 80-150 字，关键剧情 200-300 字，不超过 350 字。
- 用"你"指代玩家，禁止用"他/她/角色名"指代玩家。
- ${isContinue ? '玩家选择"继续"：自然推进剧情，可让 NPC 主动说话，不替玩家做重大决定。' : '根据玩家输入推进剧情。'}

## 文本分层标记
- 对话：用中文引号 “……” 或 「……」
- 心理：（……）
- 关键动作/戏剧性瞬间：*……*（每段最多 1 处）

## 人物档案
- 现役：人物：姓名/性别/术式/魔力/关系/描述/好感:N
- 归档：离开学期时用"归档学期：学期名"，该学期所有现役自动定格
- 唤醒：再遇归档人物用"人物："激活，须体现时间差的成长
- 切换学期：学期：学期名

## 人物与好感度
- 好感度 0-100。陌生 0-20，认识 21-40，友好 41-60，亲近 61-80，特别 81-100。
- NPC 的语气和主动程度随好感度变化。好感度高的 NPC 会主动找你、关心你、在关键时刻帮你。
- 日常互动、共同经历、送小礼物都能提升好感度。
- 叙事要自然，不要刻意刷好感。

${styleBlock}

${proactiveBlock}

## 选项
【状态更新】后写 2-3 个玩家可执行的具体行动，每项以"•"开头。`;

const messages=[{role:"system",content:systemPrompt}];
const recent=PLOT.history.slice(-3);
recent.forEach(m=>messages.push({role:m.role,content:stripStatus(m.content)}));
messages.push({role:"user",content:isContinue?'（继续）':action});

const reply=await streamAndProcess(messages);
applyScene(stripStatus(reply));

const parsed = await parseStructuredUpdate(stripStatus(reply), action);
const updateInfo = parsed.update;
applyUpdate(updateInfo);
appendOptions(parsed.options);

PLOT.history.push({role:"user",content:action});
PLOT.history.push({role:"assistant",content:reply});
if(PLOT.history.length>30)PLOT.history=PLOT.history.slice(-30);
PLOT.turn++;PLOT.summaryCounter++;
if(Math.random()<0.35) CORE.weather = rollWeather(CORE.term);
updateStatus();
if(PLOT.summaryCounter>=3)generateSummary();
}catch(e){
console.error(e);
chatBox.innerHTML+=`<div class="msg-lose">生成失败：${escapeHtml(e.message)}</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
}
finally{isGenerating=false;sendBtn.disabled=false;userInput.disabled=false;userInput.focus()}
}

// ============================================================
//  Token 面板
// ============================================================
function openTokenPanel(){
  const s = TOKEN_STATS;
  const l = LIFETIME;
  const modelName = SETTINGS.aiModel || 'deepseek-v4-flash';
  const price = MODEL_PRICING[modelName] || MODEL_PRICING['deepseek-v4-flash'];
  const IN_PRICE = ((price.inCacheHit + price.inCacheMiss) / 2) / 1000000;
  const OUT_PRICE = price.out / 1000000;
  const sCost = s.input * IN_PRICE + s.output * OUT_PRICE;
  const lCost = l.input * IN_PRICE + l.output * OUT_PRICE;
  const modelLabel = modelName === 'deepseek-v4-pro' ? 'V4 Pro' : 'V4 Flash';
  const html = `
    <div style="font-size:12px;color:#8b949e;margin-bottom:8px;">当前模型：<b style="color:#f0f6fc;">${modelLabel}</b></div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:5px 18px;">
      <div style="color:#8b949e;grid-column:1/3;font-weight:bold;margin:2px 0 6px;">本次会话</div>
      <div style="color:#8b949e;">输入</div><div style="text-align:right;">${s.input.toLocaleString()}</div>
      <div style="color:#8b949e;">输出</div><div style="text-align:right;">${s.output.toLocaleString()}</div>
      <div style="color:#8b949e;">合计</div><div style="text-align:right;font-weight:bold;">${s.session.toLocaleString()}</div>
      <div style="color:#8b949e;">预估费用</div><div style="text-align:right;color:#fbbf24;">¥${sCost.toFixed(4)}</div>
      <div style="color:#8b949e;grid-column:1/3;font-weight:bold;margin:12px 0 6px;border-top:1px dashed #30363d;padding-top:10px;">累计</div>
      <div style="color:#8b949e;">输入</div><div style="text-align:right;">${l.input.toLocaleString()}</div>
      <div style="color:#8b949e;">输出</div><div style="text-align:right;">${l.output.toLocaleString()}</div>
      <div style="color:#8b949e;">合计</div><div style="text-align:right;font-weight:bold;">${l.session.toLocaleString()}</div>
      <div style="color:#8b949e;">预估费用</div><div style="text-align:right;color:#fbbf24;">¥${lCost.toFixed(4)}</div>
    </div>
    <div style="font-size:11px;color:#6b7280;margin-top:12px;line-height:1.5;">* 按 ${modelLabel} 空闲时段均价估算，实际以 DeepSeek 账单为准。</div>
  `;
  document.getElementById('tokenPanelContent').innerHTML = html;
  openModal('tokenModal');
}
function resetTokenStats(){
  if(!confirm('确定要清空累计 Token 数据吗？')) return;
  LIFETIME.input = 0;
  LIFETIME.output = 0;
  LIFETIME.session = 0;
  saveLifetimeTokens(LIFETIME);
  openTokenPanel();
  updateTokenDisplay();
}

// ============================================================
//  摘要
// ============================================================
async function generateSummary(force=false){
if(!force&&PLOT.summaryCounter<3)return;
if(PLOT.history.length<4)return;
const recent=PLOT.history.slice(-8);
const historyText=recent.map(m=>`${m.role==='user'?'玩家':'叙事者'}：${stripStatus(m.content)}`).join('\n');
const oldSummary=CORE.summary||'';
const oldLen=oldSummary.length;
const START=200,STEP=20,MAX=500;
const targetLen=oldLen===0?START:Math.min(oldLen+STEP,MAX);
const prompt=`把「旧摘要」和「新对话」融合成一份新摘要。
第三人称，保留有后续影响的内容（人物、地点、目标、承诺、身份、能力），丢弃琐事。

【硬性要求】
输出必须严格控制在 ${targetLen} 字以内（±30字）。宁可丢掉细节，也不要超字数。
直接输出正文，不要任何前缀、不要小标题。

【旧摘要】${oldSummary||'（开头）'}
【新对话】
${historyText}`;
try{
const summary=await callDeepSeekStream([{role:'user',content:prompt}],()=>{});
if(summary&&summary.trim().length>20){
let finalSummary=summary.trim();
if(finalSummary.length>MAX+50){
  let cut=finalSummary.slice(0,MAX);
  const lastPunc=Math.max(cut.lastIndexOf('。'),cut.lastIndexOf('！'),cut.lastIndexOf('？'),cut.lastIndexOf('；'));
  if(lastPunc>MAX*0.6)cut=cut.slice(0,lastPunc+1);
  finalSummary=cut;
}
CORE.summary=finalSummary;
PLOT.summaryCounter=0;
chatBox.innerHTML+=`<div class="msg-summary">记忆精炼 · 摘要 ${finalSummary.length} 字</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
saveToPhone();
generateChapterTitle().then(title=>{
  if(!title) return;
  CORE.chapterNum = (CORE.chapterNum||0) + 1;
  CORE.chapterTitle = title;
  insertChapterDivider(CORE.chapterNum, title);
  if(typeof soundChapter==='function') soundChapter();
  saveToPhone();
});
}
}catch(e){PLOT.summaryCounter=0}
}

// ============================================================
//  角色生成 / 优化
// ============================================================
async function generateCharacter(){
const name=document.getElementById('roleName').value.trim();
if(!name){alert("请先填写角色名");return}
const gender=document.querySelector('input[name="roleGender"]:checked').value;
const innate=parseInt(document.getElementById('innatePower').value)||5;
const apiKey=document.getElementById('apiKey').value.trim();
if(!apiKey){alert("请先填写API Key");return}
const prompt=`为现代魔法学院「星辉学院」的学生角色"${name}"（${gender}）生成一份角色设定，术式适性${innate}级。包含：年龄、外貌、性格、出身背景、一个小癖好。约100-150字。直接输出描述。`;
try{
const reply=await callDeepSeekStream([{role:"user",content:prompt}],()=>{});
document.getElementById('roleDesc').value=reply.trim();
}catch(e){alert("生成失败："+e.message)}
}

async function refineCharacter(){
  const desc = document.getElementById('roleDesc').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  if(!desc){alert("角色设定为空，请先填写或点击上方「AI生成角色设定」");return}
  if(!apiKey){alert("请先填写API Key");return}
  const btn = document.querySelector('button[onclick="refineCharacter()"]');
  const oldText = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = '优化中...'; }
  const oldLen = desc.length;
  try{
    const refined = await callDeepSeekStream([{
      role:"user",
      content: `你是星辉学院的角色设定编辑。请把下面的角色设定重写为一份 120-180 字的高密度精炼版本。

要求：
- 完整保留原文的所有事实：姓名、年龄、外貌、性格、出身、特长、癖好
- 用最少的字传达最多的关键信息
- 若原文较短（<80字），围绕已有事实合理展开细节，补到 120-180 字
- 若原文较长（>200字），压缩到 120-180 字
- 第三人称设定文，语言简洁具体
- 直接输出优化后的设定文

【原文】
${desc}`
    }], ()=>{});
    const cleaned = String(refined || '').replace(/^```[\s\S]*?\n/, '').replace(/\n?```\s*$/, '').trim();
    if(cleaned.length >= 10){
      document.getElementById('roleDesc').value = cleaned;
      alert(`已优化：${oldLen} 字 → ${cleaned.length} 字`);
    }else{
      alert('AI 未返回有效内容，请再点一次试试～');
    }
  }catch(e){
    alert('优化失败：' + e.message);
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = oldText || 'AI优化当前设定'; }
  }
}

// ============================================================
//  术式觉醒
// ============================================================
async function awakenArcane(){
if(isGenerating)return;
const name=document.getElementById('roleName').value.trim();
const gender=document.querySelector('input[name="roleGender"]:checked').value;
const roleDesc=document.getElementById('roleDesc').value.trim();
const innate=parseInt(document.getElementById('innatePower').value)||1;

if(!name){
    chatBox.innerHTML+=`<div class="msg-lose">请填写角色名！请回到主界面配置面板填写。</div>`;
    chatBox.scrollTop=chatBox.scrollHeight;
    return;
}

CORE.name=name;
CORE.gender=gender;
CORE.age=12;
CORE.roleDesc=roleDesc||"无详细设定";
CORE.aptitude=Math.min(Math.max(innate,1),10);
CORE.mana=CORE.aptitude;
CORE.summary='';
CORE.marks=[];CORE.arts=[];CORE.npcs=[];
CORE.time='收到星辉信当天';
CORE.term='一年级上学期';
CORE.weather=rollWeather(CORE.term);
CORE.chapterNum=0;
CORE.chapterTitle='';
updateAvatarPreview();
const soulChoice=document.querySelector('input[name="soulChoice"]:checked').value;
let customSoul='';
if(soulChoice==='custom')customSoul=document.getElementById('customSoul').value.trim()||'未知术式';

const systemPrompt=`## 你的角色
你是现代魔法学院「星辉学院」的入学觉醒仪式引导者。玩家就是主角"你"，用第二人称叙述。

## 世界观
${FIXED_WORLD}

## 本轮信息
角色：${name}（${gender}，12岁）
设定：${CORE.roleDesc}
术式适性：${innate}级（初始魔力=${CORE.mana}级）
${customSoul?'指定术式：'+customSoul:'请为角色设计一个独特的本命术式，给出名称与特性。'}

## 叙事范例（只学密度、节奏与用语，具体内容每次全新构想）
接待老师领你穿过白色校门。门后是一条铺着青石的路，两侧的树在风里轻轻摇。
"到了。"她推开一扇门，"入学测试，从觉醒术式开始。"
房间里只有一张桌子、一盏灯。桌上一枚晶体正安静地悬着。
*你把手放上去的瞬间，晶体内部亮起一道细小的光*。
"哦？"接待老师微微抬眼，"有意思。"

【状态更新】
年龄：12
时间：入学第一天·上午
学期：一年级上学期
人物：接待老师/女/镜台/30级/接待老师/穿深蓝长外套，笑容温和/好感:20

【选项】
• 仔细感受体内涌动的魔力
• 向接待老师询问术式的来历
• 看看晶体里那道光的形状

## 输出结构（严格按顺序）
1) 叙事正文 300-500 字（第二人称）
2) 【状态更新】块（必须含上面示例中的所有字段）
3) 【选项】块（2-3 个，每项以"•"开头）

## 硬约束
- 接待老师姓名请你自由发挥，每次新游戏都换一个新名字，名字要有现代感（如：苏晚、江晴、温言、洛宁、沈舟…）。
- 人物行必须严格七段，用 / 分隔。第 3 段是术式名，绝不能填人名。第 7 段是好感度，格式"好感:N"。
- 叙事正文中必须用独立一行明确写出「术式：xxx」和「术式描述：xxx」两行，缺一不可。这两行写在正文结尾，不写进【状态更新】块。
- 对话用引号，心理用括号，关键动作用 *……* 包裹。
- 结尾给出明确去向：让接待老师或在场长辈说一句方向性的话，告诉孩子接下来去哪（去宿舍 / 去教室 / 去学生会报到 / 去食堂吃点东西 / 去训练场看看）。
- 【选项】里必须包含 2-3 个具体可执行的下一步方向，让玩家清楚知道该往哪走。
- 每次新游戏的觉醒场景都从零构想：房间形制、接待老师（性别/年龄/外貌/术式）、使用的器材、开场动作、在场者，全部全新设计。范例只用来感受叙事密度和节奏。`;

isGenerating=true;sendBtn.disabled=true;userInput.disabled=true;
try{
const reply=await streamAndProcess([{role:"user",content:systemPrompt}], {model:'deepseek-v4-flash'});
applyScene(stripStatus(reply));

const parsed = await parseStructuredUpdate(stripStatus(reply), '术式觉醒');
const update=parsed.update;
update.soulPowerBase=0;update.soulPowerAbsolute=null;

let soulName = customSoul;
let soulDesc = '';
if(!soulName){
    const patterns = [
      /术式[：:]\s*([^\n【]{2,15}?)(?=\s*术式描述|【|$)/,
      /术式(?:名[为叫]?|是|叫做?)[：:：]?\s*[「“"]?([^\n【，。、"」]{2,12})[」”"]?/,
      /觉醒(?:出了?|的术式[是为])[：:：]?\s*[「“"]?([^\n【，。、"」]{2,12})[」”"]?/,
      /【术式[：:]\s*([^\n】]+)】/,
    ];
    for(const re of patterns){
      const nm = reply.match(re);
      if(nm){ soulName = nm[1].trim().replace(/[。，,.]$/,''); break; }
    }
    const descMatch = reply.match(/术式描述[：:]\s*([^\n【]+)/);
    if(descMatch) soulDesc = descMatch[1].trim();
    if(!soulName) soulName = '未知术式';
    if(soulName.length > 15) soulName = soulName.slice(0, 15);
}
CORE.arcane = soulName;
CORE.arcaneDesc = soulDesc;

applyUpdate(update);
CORE.mana=CORE.aptitude;
PLOT.history=[];PLOT.turn=0;PLOT.isFirst=false;PLOT.summaryCounter=0;
PLOT.history.push({role:"assistant",content:reply});
updateStatus();saveToPhone();
appendOptions(parsed.options);

if(!soulName || soulName === '未知术式' || soulName === '未觉醒'){
  chatBox.innerHTML += `<div class="msg-sys" style="color:#fbbf24;font-size:12px;">⚠️ 未能从觉醒叙事中识别术式，可点「⋯ → 编辑角色档案」手动补上。</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}
}catch(e){
console.error(e);
chatBox.innerHTML+=`<div class="msg-lose">觉醒失败：${escapeHtml(e.message)}</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
}
finally{isGenerating=false;sendBtn.disabled=false;userInput.disabled=false;userInput.focus()}
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
Object.assign(CORE, {name:roleName,avatar:_keepAvatar,gender:'女',age:12,roleDesc:'',arcane:'未觉醒',arcaneDesc:'',aptitude:5,mana:1,marks:[],arts:[],npcs:[],flags:{},summary:'',time:'收到星辉信当天',term:'一年级上学期',weather:'',chapterNum:0,chapterTitle:''});
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