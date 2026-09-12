// ============================================================
//  rpg.js - 角色扮演模式专属逻辑
//  依赖 shared.js（必须先加载）
//  本版本移除：物品/背包/货币系统
//  新增：编辑角色档案；两阶段生成（叙事 + JSON状态）；模型切换
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
  g('pfAge').value = CORE.age || 6;
  g('pfSoul').value = (CORE.martialSoul && CORE.martialSoul !== '未觉醒') ? CORE.martialSoul : '';
  g('pfSoulDesc').value = CORE.martialSoulDesc || '';
  g('pfInnate').value = CORE.innatePower || 1;
  g('pfPower').value = CORE.soulPower || 1;
  openModal('profileModal');
}
function saveProfileEdit(){
  const g = id => document.getElementById(id);
  const name = g('pfName').value.trim();
  const age = parseInt(g('pfAge').value) || CORE.age || 6;
  const soul = g('pfSoul').value.trim();
  const soulDesc = g('pfSoulDesc').value.trim();
  const innate = Math.min(Math.max(parseInt(g('pfInnate').value)||1, 1), 10);
  const power = Math.min(Math.max(parseInt(g('pfPower').value)||1, 1), 100);
  if(name) CORE.name = name;
  CORE.age = age;
  if(soul) CORE.martialSoul = soul;
  CORE.martialSoulDesc = soulDesc;
  CORE.innatePower = innate;
  CORE.soulPower = power;
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
//  游戏核心数据
// ============================================================
const FIXED_WORLD=`斗罗大陆 · 绝世唐门时代（一万年后）。

【文明本质】
魂力驱动的工业文明。魂力不只存在于魂师体内，也能被提取、引导、储存，通过雕刻在稀有金属与宝石上的核心法阵，转化为驱动机器运转的能量。照明、交通、通讯、医疗、军事，全部建立在这套技术之上。

【世界格局】
四千年前日月大陆与斗罗大陆碰撞，日月帝国凭借魂导器压制原斗罗联军。战后史莱克学院召集近六十位封号斗罗扭转战局，从此学院独立于所有国家。如今四大帝国并立：日月帝国（魂导器最强）、天魂帝国、斗灵帝国、星罗帝国。

【三大势力】
史莱克学院（大陆第一魂师学院，最高权力机构为海神阁）、本体宗（天魂帝国护国宗门）、明德堂（日月帝国首席魂导器研究所）。

【魂师与魂导师】
魂师以武魂和魂环战斗，魂士到封号斗罗，魂力1-100级。
魂导师不靠武魂战斗，靠技术和知识研究制造魂导器，分10级，是工业文明的中坚。一级魂导师对应魂师（10-19级），十级魂导师对应极限斗罗（99级）。

【魂环与魂灵】
魂环分白、黄、紫、黑、红、金六色，对应十年到百万年年限。魂灵是替代猎杀魂兽的新体系，由霍雨浩和伊莱克斯开创，魂兽以灵魂形态与魂师签订平等契约。

【货币】
金/银/铜魂币（1金=10银=100铜）。

具体设定见资料库，优先参考资料库。`;

const CORE={name:'',avatar:'',gender:'女',age:0,roleDesc:'',martialSoul:'未觉醒',martialSoulDesc:'',innatePower:5,soulPower:1,rings:[],skills:[],traits:[],npcs:[],flags:{},summary:'',time:'觉醒武魂当天',era:'初始',weather:'',chapterNum:0,chapterTitle:''};
const PLOT={history:[],turn:0,isFirst:true,summaryCounter:0};
let isGenerating=false;

function getStage(power){if(power<=10)return"魂士";if(power<=20)return"魂师";if(power<=30)return"大魂师";if(power<=40)return"魂尊";if(power<=50)return"魂宗";if(power<=60)return"魂王";if(power<=70)return"魂帝";if(power<=80)return"魂圣";if(power<=90)return"魂斗罗";return"封号斗罗"}
function getSpeedFactor(){return 1+(CORE.innatePower-1)*0.15}
function getRingColorClass(ringName){if(ringName.includes('百万年'))return'ring-gold';if(ringName.includes('十万年'))return'ring-red';if(ringName.includes('万年'))return'ring-black';if(ringName.includes('千年'))return'ring-purple';if(ringName.includes('百年'))return'ring-yellow';return'ring-white'}
function getRingColorHex(name){if(name.includes('百万年'))return '#fbbf24';if(name.includes('十万年'))return '#ef4444';if(name.includes('万年'))return '#4b5563';if(name.includes('千年'))return '#a855f7';if(name.includes('百年'))return '#facc15';return '#f0f0f0'}

const chatBox=document.getElementById('chat-box');
const optionsArea=document.getElementById('options-area');
const userInput=document.getElementById('userInput');
const configPanel=document.getElementById('config-panel');
const gameArea=document.getElementById('game-area');
const sendBtn=document.getElementById('sendBtn');

document.querySelectorAll('input[name="soulChoice"]').forEach(radio=>{radio.addEventListener('change',function(){document.getElementById('customSoulDiv').classList.toggle('hidden',this.value!=='custom')})});

// ============================================================
//  魂环可视化
// ============================================================
function renderRingsVisual(rings){
if(rings.length===0)return '<div style="text-align:center;padding:24px;color:#8b949e;">暂无魂环</div>';
const total=Math.min(rings.length,9);const cx=100,cy=100;
let svg=`<svg viewBox="0 0 200 200">`;
for(let i=0;i<total;i++){
  const r=92-i*9;const color=getRingColorHex(rings[i].name);const isGold=rings[i].name.includes('百万年');
  svg+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="5" opacity="0.95"${isGold?' filter="url(#goldGlow)"':''}/>`;
}
svg+=`<defs><filter id="goldGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
svg+=`<circle cx="${cx}" cy="${cy}" r="22" fill="#161b22" stroke="#30363d"/>`;
svg+=`<text x="${cx}" y="${cy+5}" text-anchor="middle" fill="#f0f6fc" font-size="14" font-weight="bold">${total}环</text></svg>`;
let legend='<div class="rings-legend">';
rings.forEach((r,i)=>{const color=getRingColorHex(r.name);legend+=`<span class="rings-legend-item" style="color:${color};">第${i+1}环 · ${escapeHtml(r.name)}${r.count>1?'×'+r.count:''}</span>`});
legend+='</div>';
return `<div class="rings-visual-container">${svg}${legend}</div>`;
}

// ============================================================
//  场景氛围 + 时间/天气
// ============================================================
const SCENE_PLACES = [
  {re:/星斗大森林/, name:'星斗大森林', type:'forest', emoji:'🌲'},
  {re:/海神湖|海神岛/, name:'海神湖', type:'water', emoji:'💧'},
  {re:/史莱克学院/, name:'史莱克学院', type:'academy', emoji:'🏛'},
  {re:/史莱克城/, name:'史莱克城', type:'city', emoji:'🏙'},
  {re:/索托城/, name:'索托城', type:'city', emoji:'🏙'},
  {re:/天斗城/, name:'天斗城', type:'city', emoji:'🏙'},
  {re:/星罗城/, name:'星罗城', type:'city', emoji:'🏙'},
  {re:/昊天堡/, name:'昊天堡', type:'palace', emoji:'🏰'},
  {re:/唐门/, name:'唐门', type:'palace', emoji:'🏯'},
  {re:/白虎公爵府/, name:'白虎公爵府', type:'palace', emoji:'🏰'},
  {re:/日月帝国/, name:'日月帝国', type:'city', emoji:'🏙'},
];
const SCENE_TYPES = [
  {re:/森林|树林|密林|林中|林间/, name:'森林', type:'forest', emoji:'🌲'},
  {re:/学院|教室|课堂|训练场|操场/, name:'学院', type:'academy', emoji:'🏛'},
  {re:/皇宫|宫廷|御书房|大殿|王宫/, name:'宫殿', type:'palace', emoji:'👑'},
  {re:/夜晚|月色|深夜|星空|月光|夜幕/, name:'夜色', type:'night', emoji:'🌙'},
  {re:/战斗|厮杀|危险|袭击|混战|对决/, name:'战斗', type:'battle', emoji:'⚔'},
  {re:/洞穴|地下|遗迹|古墓|深处|地宫/, name:'遗迹', type:'cave', emoji:'🕳'},
  {re:/海洋|湖边|水边|河流|湖畔|海面|江边/, name:'水畔', type:'water', emoji:'💧'},
  {re:/城|镇|街|铺|市集|街道|广场/, name:'城镇', type:'city', emoji:'🏙'},
];

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
function saveToPhone(){
try{const apiKey=document.getElementById('apiKey').value.trim();if(apiKey)localStorage.setItem('douro2ApiKey',apiKey);
localStorage.setItem('douro2Save',JSON.stringify({core:CORE,plot:{history:PLOT.history.slice(-20),turn:PLOT.turn,isFirst:PLOT.isFirst,summaryCounter:PLOT.summaryCounter}}));
}catch(e){console.error('存档失败',e)}
}
function loadSave(){
try{const savedKey=localStorage.getItem('douro2ApiKey');if(savedKey)document.getElementById('apiKey').value=savedKey;
const raw=localStorage.getItem('douro2Save');
if(raw){const data=JSON.parse(raw);Object.assign(CORE,data.core);
if(!CORE.gender)CORE.gender='女';
if(!CORE.age)CORE.age=0;
if(!CORE.martialSoulDesc)CORE.martialSoulDesc='';
if(CORE.rings.length>0&&typeof CORE.rings[0]==='string')CORE.rings=CORE.rings.map(r=>({name:r,count:1,desc:''}));
if(CORE.skills.length>0&&typeof CORE.skills[0]==='string')CORE.skills=CORE.skills.map(s=>({name:s,desc:''}));
if(CORE.traits.length>0&&typeof CORE.traits[0]==='string')CORE.traits=CORE.traits.map(t=>({name:t,type:'先天',desc:''}));
if(!CORE.npcs)CORE.npcs=[];
if(!CORE.time)CORE.time='觉醒武魂当天';
if(!CORE.era)CORE.era='初始';
if(CORE.avatar===undefined)CORE.avatar='';
if(CORE.weather===undefined)CORE.weather='';
if(CORE.chapterNum===undefined)CORE.chapterNum=0;
if(CORE.chapterTitle===undefined)CORE.chapterTitle='';
CORE.npcs.forEach(n=>{
  if(!n.status)n.status='active';
  if(n.era===undefined)n.era='初始';
  if(n.archTime===undefined)n.archTime='';
  if(n.snapshot===undefined)n.snapshot=null;
  if(n.soulPower===undefined)n.soulPower='';
});
delete CORE.hp;delete CORE.maxHp;delete CORE.inventory;
Object.assign(PLOT,data.plot);return true}}catch(e){console.error('读档失败',e)}
return false;
}
function resetSave(){if(confirm("清空所有本地存档？")){localStorage.removeItem('douro2Save');document.getElementById('config-inputs').classList.remove('hidden');location.reload()}}
function goHome(){if(isGenerating){alert("正在生成，请等待完成");return}if(confirm("返回主界面？")){saveToPhone();if(typeof soundStopAmbient==='function')soundStopAmbient();gameArea.style.display='none';configPanel.style.display='block';initApp()}}
function selectMode(mode){if(mode!=='rpg'){alert('模拟器模式尚未开放，敬请期待');return}document.getElementById('mode-select').classList.add('hidden');document.getElementById('config-panel').classList.remove('hidden');initApp().catch(e=>console.error(e))}

// ============================================================
//  初始化
// ============================================================
async function initApp(){
isGenerating = false;
loadSettings();
loadDefaultMedia();
let hasSave=loadSave();

if(hasSave && (!CORE.name || CORE.martialSoul === '未觉醒')){
    localStorage.removeItem('douro2Save');
    hasSave = false;
    const _keepAvatar2 = CORE.avatar || '';
Object.assign(CORE, {name:'',avatar:_keepAvatar2,gender:'女',age:0,roleDesc:'',martialSoul:'未觉醒',martialSoulDesc:'',innatePower:5,soulPower:1,rings:[],skills:[],traits:[],npcs:[],flags:{},summary:'',time:'觉醒武魂当天',era:'初始',weather:'',chapterNum:0,chapterTitle:''});
    Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});
}

updateAvatarPreview();

if(hasSave){
    document.getElementById('continueBtn').classList.remove('hidden');
    document.getElementById('config-inputs').classList.add('hidden');
    const infoBox=document.getElementById('saveInfoBox');
    infoBox.classList.remove('hidden');
    infoBox.innerHTML=`存档：<b style="color:#f0f6fc;">${escapeHtml(CORE.name)}</b> · ${escapeHtml(CORE.martialSoul)} · 魂力${CORE.soulPower}级<br><span style="color:#6b7280;">时间：${escapeHtml(CORE.time)}</span>`;
    document.getElementById('roleName').value=CORE.name;
    document.getElementById('roleDesc').value=CORE.roleDesc||'';
    document.getElementById('innatePower').value=CORE.innatePower||5;
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

const soulText = CORE.martialSoul || "未觉醒";
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

document.getElementById('s-soulpower').innerHTML=icon('power','#f0f6fc')+(CORE.soulPower||0);
document.getElementById('s-stage').innerHTML=icon('stage','#8b949e')+getStage(CORE.soulPower);
document.getElementById('s-time').innerHTML=icon('time','#8b949e')+escapeHtml(CORE.time||"未知");
saveToPhone();
}

function showSoulDesc() {
    const soulText = CORE.martialSoul || "未觉醒";
    let html = `<div style="font-size:16px;font-weight:bold;color:#f0883e;margin-bottom:8px;">${escapeHtml(soulText)}</div>`;
    if (CORE.martialSoulDesc) {
        html += `<div style="font-size:14px;line-height:1.6;">${escapeHtml(CORE.martialSoulDesc)}</div>`;
    } else {
        html += `<div style="font-size:14px;color:#8b949e;">暂无详细描述</div>`;
    }
    document.getElementById('soulDescContent').innerHTML = html;
    openModal('soulModal');
}

// ============================================================
//  业务弹窗
// ============================================================
function openRings(){const container=document.getElementById('ringsContent');if(SETTINGS.useRingsVisual&&CORE.rings.length>0){container.innerHTML=renderRingsVisual(CORE.rings)}else{renderExpandableList(container,CORE.rings,{emptyText:'无魂环',nameClassFn:(r)=>getRingColorClass(r.name),removeFn:'removeRingItem'})}openModal('ringsModal')}
function removeRingItem(idx){CORE.rings.splice(idx,1);updateStatus();openRings()}
function openSkills(){renderExpandableList(document.getElementById('skillsContent'),CORE.skills,{emptyText:'无魂技',removeFn:'removeSkillItem'});openModal('skillsModal')}
function removeSkillItem(idx){CORE.skills.splice(idx,1);updateStatus();openSkills()}
function openTraits(){renderExpandableList(document.getElementById('traitsContent'),CORE.traits,{emptyText:'无特质',showType:true,removeFn:'removeTraitItem'});openModal('traitsModal')}
function removeTraitItem(idx){CORE.traits.splice(idx,1);updateStatus();openTraits()}
function openNPCs(){
  renderExpandableList(document.getElementById('npcsContent'),CORE.npcs,{
    emptyText:'暂无重要人物',
    avatarFn:(n)=>avatarHTML(n.name),
    removeFn:'removeNPCItem',
    nameClassFn:(n)=>n.status==='archived'?'npc-archived':'',
    detailFn:(n)=>{
      const tag = n.status==='archived' ? `<span style="color:#a78bfa;">【已归档 · 定格于「${escapeHtml(n.archTime||'')}」】</span>` : `<span style="color:#4ade80;">【现役 · ${escapeHtml(n.era||'初始')}】</span>`;
      return `${tag}<div style="margin-top:6px;">性别：${escapeHtml(n.gender||'?')}</div><div>武魂：${escapeHtml(n.soul||'?')}</div><div>魂力：${escapeHtml(n.soulPower||'未知')}</div><div>关系：${escapeHtml(n.relation||'?')}</div><div style="margin-top:6px;color:#c9d1d9;">${escapeHtml(n.desc||'')}</div>`;
    }
  });
  openModal('npcsModal');
}
function removeNPCItem(idx){CORE.npcs.splice(idx,1);updateStatus();openNPCs()}

// ============================================================
//  选项渲染
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
//  状态解析（传统文本解析，保留作为 fallback）
// ============================================================
const STATUS_LINE_RE=/^(年龄[：:]|魂力\s*[+\-：:]|魂力\s*(提升|增加|提高|升至|达到|变为)|获得魂技[：:]|删除魂技[：:]|获得魂环[：:]|删除魂环[：:]|获得特质[：:]|删除特质[：:]|人物[：:]|重要人物[：:]|新人物[：:]|删除人物[：:]|时间[：:]|天气[：:]|时期[：:]|归档时期[：:])/;
function stripStatus(text){let result=text.replace(/【状态更新】[\s\S]*?(?=【选项】|$)/g,'');result=result.replace(/【选项】[\s\S]*/g,'');const lines=result.split('\n');const kept=lines.filter(line=>{const t=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();if(!t)return true;if(STATUS_LINE_RE.test(t))return false;return true});return kept.join('\n').trim()}
function parseSeg(seg){let name=seg,count=1,desc='';const descM=seg.match(/^(.+?)[（(](.+?)[）)]\s*$/);if(descM){name=descM[1].trim();desc=descM[2].trim()}const cntM=name.match(/[×xX*](\d+)\s*(个|枚|颗|件|本|张|块|份)?\s*$/);if(cntM){count=parseInt(cntM[1])||1;name=name.replace(/[×xX*]\d+\s*(个|枚|颗|件|本|张|块|份)?\s*$/,'').trim()}const cnM=name.match(/^(.+?)([一二三四五六七八九十百千万]+)(个|枚|颗|件|本|张|块|份)\s*$/);if(cnM){count=chineseToNumber(cnM[2]);name=cnM[1].trim()}return{name,count,desc}}

// ============================================================
//  JSON mode 结构化状态解析
// ============================================================
async function parseStructuredUpdate(narrative, userAction){
  const schemaExample = JSON.stringify({
    age: null,
    soulPowerDelta: 0,
    soulPowerAbsolute: null,
    time: "描述",
    weather: null,
    skills: [],
    delSkills: [],
    rings: [],
    delRings: [],
    traits: [],
    delTraits: [],
    npcs: [],
    delNpcs: [],
    era: null,
    archiveEra: null,
    options: ["行动1", "行动2", "行动3"]
  });

  const prompt = `你是斗罗大陆2（绝世唐门时代）游戏的状态解析器。
请阅读以下剧情叙事和玩家行动，提取本轮的状态更新和选项。

当前主角状态：
- 年龄：${CORE.age}
- 魂力：${CORE.soulPower}级
- 时间：${CORE.time}
- 天气：${CORE.weather || '未知'}
- 时期：${CORE.era}
- 已有魂环：${CORE.rings.map(r=>r.name).join('、') || '无'}
- 已有魂技：${CORE.skills.map(s=>s.name).join('、') || '无'}
- 已有特质：${CORE.traits.map(t=>t.name).join('、') || '无'}
- 现役人物：${CORE.npcs.filter(n=>n.status!=='archived').map(n=>n.name).join('、') || '无'}

【本轮剧情】
${narrative}

【玩家行动】
${userAction || '（继续）'}

请输出一个 JSON 对象，严格遵循以下格式：
${schemaExample}

字段说明：
- age：如果剧情中主角年龄变化，填新年龄（数字）；否则 null。
- soulPowerDelta：如果魂力有增减，填增量（正数或负数）；否则 0。
- soulPowerAbsolute：如果魂力提升到具体等级，填该等级（数字）；否则 null。
- time：本轮剧情的时间描述，必须填。
- weather：如果天气变化，填新天气（晴/阴/雨/雪/雾/雷/风）；否则 null。
- skills：本轮获得的魂技列表，每项 {"name":"名称","desc":"描述"}。
- delSkills：本轮删除的魂技名称列表（字符串数组）。
- rings：本轮获得的魂环列表，每项 {"name":"年限+颜色（如百年黄）","desc":"描述"}。
- delRings：本轮删除的魂环名称列表。
- traits：本轮获得的特质列表，每项 {"name":"名称","type":"先天/后天","desc":"描述"}。
- delTraits：本轮删除的特质名称列表。
- npcs：本轮新增或更新的人物列表，每项 {"name":"姓名","gender":"性别","soul":"武魂","soulPower":"魂力","relation":"关系","desc":"描述"}。
- delNpcs：本轮删除的人物名称列表。
- era：如果进入新时期，填时期名；否则 null。
- archiveEra：如果归档某个时期，填时期名；否则 null。
- options：给玩家的 2-3 个可执行行动，每项是一个字符串。

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
      soulPowerBase: parseInt(obj.soulPowerDelta) || 0,
      soulPowerAbsolute: (obj.soulPowerAbsolute !== null && obj.soulPowerAbsolute !== undefined) ? parseInt(obj.soulPowerAbsolute) : null,
      skills: Array.isArray(obj.skills) ? obj.skills.filter(s=>s && s.name) : [],
      delSkills: Array.isArray(obj.delSkills) ? obj.delSkills : [],
      rings: Array.isArray(obj.rings) ? obj.rings.filter(r=>r && r.name) : [],
      delRings: Array.isArray(obj.delRings) ? obj.delRings : [],
      traits: Array.isArray(obj.traits) ? obj.traits.filter(t=>t && t.name) : [],
      delTraits: Array.isArray(obj.delTraits) ? obj.delTraits : [],
      npcs: Array.isArray(obj.npcs) ? obj.npcs.filter(n=>n && n.name) : [],
      delNpcs: Array.isArray(obj.delNpcs) ? obj.delNpcs : [],
      time: obj.time || null,
      weather: obj.weather || null,
      era: obj.era || null,
      archiveEra: obj.archiveEra || null
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

// 保留原来的 parseStatusUpdate 作为 fallback
function parseStatusUpdate(text){
const update={age:null,soulPowerBase:0,soulPowerAbsolute:null,skills:[],delSkills:[],rings:[],delRings:[],traits:[],delTraits:[],npcs:[],delNpcs:[],time:null,era:null,archiveEra:null,weather:null};
let block='';
const m=text.match(/【状态更新】([\s\S]*?)(?=【选项】|$)/);
if(m){block=m[1]}else{const lines=text.split('\n');const statusLines=[];for(const line of lines){const t=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();if(STATUS_LINE_RE.test(t))statusLines.push(t)}block=statusLines.join('\n')}
if(!block)return update;
let mm=block.match(/年龄\s*[：:]\s*(\d+)/);
if(mm)update.age=parseInt(mm[1])||null;
mm=block.match(/魂力\s*(?:提升|增加|提高|升至|达到|变为|变成)(?:至|到)?\s*(\d+)/i);
if(mm){const v=parseInt(mm[1]);if(v>0)update.soulPowerAbsolute=v}else{mm=block.match(/魂力\s*[：:]?\s*([+-]\d+)/);if(mm){const v=parseInt(mm[1]);if(v!==0)update.soulPowerBase=v}}
const lines=block.split('\n').map(l=>l.trim()).filter(Boolean);
for(let line of lines){
line=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();
if(!line)continue;
const km=line.match(/^(获得魂技|删除魂技|获得魂环|删除魂环|获得特质|删除特质|人物|重要人物|新人物|删除人物|时间|天气|时期|归档时期)[：:]\s*(.+)$/);
if(!km)continue;
const kw=km[1];const content=km[2].trim();
if(kw==='获得魂技')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);if(!isPlaceholder(p.name))update.skills.push({name:p.name,desc:p.desc})});
else if(kw==='删除魂技')smartSplit(content).forEach(seg=>{const n=seg.trim();if(!isPlaceholder(n))update.delSkills.push(n)});
else if(kw==='获得魂环')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);if(!isPlaceholder(p.name))update.rings.push({name:p.name,desc:p.desc})});
else if(kw==='删除魂环')smartSplit(content).forEach(seg=>{const n=seg.trim();if(!isPlaceholder(n))update.delRings.push(n)});
else if(kw==='获得特质')smartSplit(content).forEach(seg=>{let name=seg,type='后天',desc='';const typeM=seg.match(/^(.+?)[（(](先天|后天)[）)]/);if(typeM){name=typeM[1].trim();type=typeM[2]}const restM=name.match(/^(.+?)[（(](.+?)[）)]/);if(restM){name=restM[1].trim();desc=restM[2].trim()}if(name&&!isPlaceholder(name))update.traits.push({name,type,desc})});
else if(kw==='删除特质')smartSplit(content).forEach(seg=>{const n=seg.split(/[（(]/)[0].trim();if(!isPlaceholder(n))update.delTraits.push(n)});
else if(kw==='人物'||kw==='重要人物'||kw==='新人物'){
  smartSplit(content).forEach(seg=>{
    const parts=seg.split('/').map(s=>s.trim());
    if(parts.length<2||!parts[0]||isPlaceholder(parts[0])||parts[0].length>15)return;
    let soulPower='',relation='中立',desc='';
    if(parts.length>=6){
      soulPower=parts[3]||'';
      relation=parts[4]||'中立';
      desc=parts.slice(5).join('/')||'';
    }else{
      relation=parts[3]||'中立';
      desc=parts[4]||'';
    }
    update.npcs.push({name:parts[0],gender:parts[1]||'未知',soul:parts[2]||'未知',soulPower,relation,desc});
  });
}
else if(kw==='删除人物')smartSplit(content).forEach(seg=>{const n=seg.trim();if(!isPlaceholder(n))update.delNpcs.push(n)});
else if(kw==='时间'){if(!isPlaceholder(content))update.time=content}
else if(kw==='天气'){if(!isPlaceholder(content))update.weather=content.trim()}
else if(kw==='时期'){if(!isPlaceholder(content))update.era=content.trim()}
else if(kw==='归档时期'){if(!isPlaceholder(content))update.archiveEra=content.trim()}
}
return update;
}

// ============================================================
//  applyUpdate
// ============================================================
function applyUpdate(update){
if(update.age!==null&&update.age>0)CORE.age=update.age;
const oldSP=CORE.soulPower,oldStage=getStage(oldSP);
if(update.soulPowerAbsolute!==null&&update.soulPowerAbsolute>0)CORE.soulPower=Math.min(Math.max(update.soulPowerAbsolute,1),100);
else if(update.soulPowerBase!==0){let base=update.soulPowerBase;if(base>20)base=20;if(base<-20)base=-20;let factor=(base>0)?getSpeedFactor():1;CORE.soulPower=Math.min(Math.max(CORE.soulPower+Math.round(base*factor),1),100)}
if(CORE.soulPower!==oldSP){
  const newStage=getStage(CORE.soulPower);
  const diff=CORE.soulPower-oldSP;
  let txt=`魂力 ${oldSP} → ${CORE.soulPower}（${diff>0?'+':''}${diff}）`;
  if(newStage!==oldStage)txt+=` · 晋阶 ${oldStage} → ${newStage}`;
  chatBox.innerHTML+=`<div class="msg-power">${icon('power','#fbbf24')}${escapeHtml(txt)}</div>`;
  triggerStatPowerPulse();
  if(typeof soundPower==='function') soundPower();
  if(newStage!==oldStage) triggerStageUpgrade(oldStage,newStage);
}
if(update.era)setEra(update.era);
if(update.archiveEra)archiveEra(update.archiveEra);
(update.skills||[]).forEach(s=>addSkill(s.name,s.desc));
(update.delSkills||[]).forEach(n=>deleteSkill(n));
(update.rings||[]).forEach(r=>addRing(r.name,r.desc));
(update.delRings||[]).forEach(n=>deleteRing(n));
(update.traits||[]).forEach(t=>addTrait(t.name,t.type,t.desc));
(update.delTraits||[]).forEach(n=>deleteTrait(n));
(update.npcs||[]).forEach(n=>addNPC(n.name,n.gender,n.soul,n.soulPower,n.relation,n.desc));
(update.delNpcs||[]).forEach(n=>deleteNPC(n));
if(update.time){CORE.time=update.time;chatBox.innerHTML+=`<div class="msg-time">${icon('time','#94a3b8')}${escapeHtml(update.time)}</div>`}
if(update.weather){CORE.weather=update.weather;}
if(update.time || update.weather){
  if(_currentSceneKey){
    const type = _currentSceneKey;
    const found = SCENE_TYPES.find(t => t.type === type) || SCENE_PLACES.find(p => p.type === type);
    if(found) updateSceneBanner({name:found.name, type:found.type, emoji:found.emoji});
  }
}
updateStatus();
}

// ============================================================
//  叙事嗅探兜底
// ============================================================
function sniffNarrativeUpdates(fullReply, update){
  const narrative = stripStatus(fullReply);
  if(!narrative) return;

  if(update.rings.length === 0){
    const yearRe = /([一二三四五六七八九十百千万\d]{1,8})\s*年/g;
    const colorRe = /(白色|黄色|紫色|黑色|红色|金色|橙色|蓝色)/;
    const contextRe = /(魂环|吸收|炼化|猎杀|魂兽)/;
    let m;
    while((m = yearRe.exec(narrative)) !== null){
      const start = Math.max(0, m.index - 40);
      const end = Math.min(narrative.length, m.index + m[0].length + 40);
      const ctx = narrative.slice(start, end);
      if(!contextRe.test(ctx)) continue;
      const cm = ctx.match(colorRe);
      if(!cm) continue;
      const yearStr = m[1];
      const colorName = cm[1];
      const ringName = `${yearStr}年${colorName}`;
      const exists = CORE.rings.some(r => r.name.includes(yearStr) || r.name.includes(colorName));
      if(exists) continue;
      update.rings.push({ name: ringName, desc: '' });
      chatBox.innerHTML += `<div class="msg-sys" style="font-size:12px;color:#a78bfa;">⚠️ 正文检测到魂环但状态块未写，已自动补录：${escapeHtml(ringName)}</div>`;
      break;
    }
  }

  if(update.soulPowerBase === 0 && update.soulPowerAbsolute === null){
    const lvlRe = /魂力(?:提升|突破|达到|升至|涨到|到达)\s*(?:到|至)?\s*(\d+)\s*级/g;
    let m;
    while((m = lvlRe.exec(narrative)) !== null){
      const v = parseInt(m[1]);
      if(v > CORE.soulPower && v <= 100){
        update.soulPowerAbsolute = v;
        chatBox.innerHTML += `<div class="msg-sys" style="font-size:12px;color:#a78bfa;">⚠️ 正文检测到魂力提升但状态块未写，已自动补录：${CORE.soulPower} → ${v}</div>`;
        break;
      }
    }
  }
}

// ============================================================
//  主角档案 + 动态世界书
// ============================================================
function buildCoreSummary(playerInput){
let s='';
s+=`姓名：${CORE.name}（${CORE.gender}），${CORE.age||'?'}岁。\n`;
s+=`设定：${CORE.roleDesc}\n`;
s+=`武魂：${CORE.martialSoul}（先天魂力${CORE.innatePower}级）\n`;
if(CORE.martialSoulDesc) s+=`武魂描述：${CORE.martialSoulDesc}\n`;
s+=`魂力：${CORE.soulPower}级（${getStage(CORE.soulPower)}）\n`;
s+=`时间：${CORE.time}\n`;
if(CORE.weather) s+=`天气：${CORE.weather}\n`;
s+=`当前时期：${CORE.era}\n`;
s+=`魂环：${CORE.rings.map(r=>r.name).join('、')||'无'}\n`;
s+=`魂技：${CORE.skills.map(x=>x.name).join('、')||'无'}\n`;
s+=`特质：${CORE.traits.map(t=>t.name).join('、')||'无'}\n`;
const activeNPCs=CORE.npcs.filter(n=>n.status!=='archived');
const archivedNPCs=CORE.npcs.filter(n=>n.status==='archived');
if(activeNPCs.length>0)s+=`【现役人物】\n${activeNPCs.map(n=>`- ${n.name}（${n.gender}·${n.soul}·魂力${n.soulPower||'?'}·${n.relation}）：${n.desc||''}`).join('\n')}\n`;
if(archivedNPCs.length>0){
  s+=`【归档人物】（玩家过去时期的故人，再遇时须体现时间差并重新激活）\n`;
  s+=archivedNPCs.map(n=>{
    const snap=n.snapshot||{};
    return `- ${n.name}（${n.gender}·${snap.soul||n.soul}·魂力${snap.soulPower||'?'}·${snap.relation||n.relation}·归档于「${n.archTime}」）：${snap.desc||n.desc||''}`;
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

// ============================================================
//  SillyTavern 式辅助：当前处境 + 最近事件
// ============================================================
function buildCurrentSituation(){
  const parts = [];
  if(CORE.time) parts.push(CORE.time);
  if(CORE.era && CORE.era !== '初始') parts.push(CORE.era);
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

// ============================================================
//  流式处理（叙事阶段）
// ============================================================
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
  twPush(displayContent);
}, opts);
tw.done = true;
if(tw.timer){ clearTimeout(tw.timer); tw.timer = null; }
tw.shown = tw.pending.length;
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
if(!text){chatBox.innerHTML+=`<div class="msg-debug">用法：/调试 获得魂环 百年</div>`;return}
text=normalizeDebugText(text);
const pseudo=`【状态更新】\n${text}\n`;
const update=parseStatusUpdate(pseudo);
const hasAny=update.skills.length>0||update.delSkills.length>0||update.rings.length>0||update.delRings.length>0||update.traits.length>0||update.delTraits.length>0||update.npcs.length>0||update.delNpcs.length>0||update.time!==null||update.era!==null||update.archiveEra!==null||update.weather!==null||update.soulPowerAbsolute!==null||update.soulPowerBase!==0||update.age!==null;
if(!hasAny){chatBox.innerHTML+=`<div class="msg-debug">无法识别，请用：/调试 获得魂环 百年</div>`;return}
applyUpdate(update);
chatBox.innerHTML+=`<div class="msg-debug">调试已应用</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
}
function handleLoreTest(testInput){
  const recentText = PLOT.history.slice(-3).map(m=>stripStatus(m.content)).join('\n');
  const result = triggerLorebook(testInput || '', recentText, 5);
  if(!result){
    chatBox.innerHTML += `<div class="msg-debug">未命中任何资料条目。试试：/测 我去史莱克学院</div>`;
  }else{
    chatBox.innerHTML += `<div class="msg-debug" style="text-align:left;white-space:pre-wrap;">${escapeHtml(result)}</div>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

function normalizeDebugText(text){
if(/^(获得魂技|删除魂技|获得魂环|删除魂环|获得特质|删除特质|人物|重要人物|新人物|删除人物|时间|天气|魂力|年龄|时期|归档时期)[：:]/.test(text))return text;
let m;
if((m=text.match(/^年龄\s*(\d+)\s*$/)))return `年龄：${m[1]}`;
if((m=text.match(/^魂力\s*([+-]?\d+)\s*$/)))return `魂力 ${m[1]}`;
if((m=text.match(/^魂力\s*(?:提升至|提升到|达到|变为)\s*(\d+)\s*$/)))return `魂力 提升至${m[1]}`;
if((m=text.match(/^(?:认识|遇见|遇到|结识|加入|新增)\s*(?:人物|npc|NPC)?\s*(.+?)\s*$/))){const n=m[1].trim();if(n)return `人物：${n}/未知/未知/未知/相识/`}
if((m=text.match(/^删除人物\s+(.+?)\s*$/)))return `删除人物：${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*魂环\s*$/)))return `获得魂环：${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*魂技\s*$/)))return `获得魂技：${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*特质\s*$/)))return `获得特质：${m[1]}(先天)`;
return '';
}

// ============================================================
//  主行动（两阶段生成：叙事 → JSON状态）
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
if(PLOT.isFirst){await awakenSoul();return}
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
每 2~3 轮让一个 NPC 主动说话或行动（送信、求助、挑衅、提议、打断）。NPC 有自己的目标，世界是"活"的。`
  : '';

const systemPrompt = `## 你是谁
你是斗罗大陆2（绝世唐门时代）背景的小说叙事者。玩家就是主角"你"。

## 世界观
${FIXED_WORLD}

## 主角档案
${coreSummary}

## 当前处境
${currentSituation}
${recentEvents ? `\n## 最近关键事件\n${recentEvents}` : ''}

## 叙事范例（模仿此密度、节奏与用语）
魂导列车汽笛撕开晨雾，*你攥着车票的手心沁出薄汗*。窗外，柏油路两侧的魂导灯次第熄灭。
（这就是天斗城……和村里完全不一样。）
一个穿灰呢制服的检票员敲了敲车厢门："小朋友，终点站到了。"

【状态更新】
时间：次日·清晨
人物：检票员/男/未知/未知/陌生人/灰呢制服，语气里藏着一点关切

【选项】
• 跟着人流下车，寻找出站口
• 先向检票员打听天斗城的魂师学院
• 在座位上再坐一会儿，整理包袱

## 输出结构（严格按此顺序）
1) 叙事正文（第二人称，含分层标记）
2) 【状态更新】块（只在有变化时写该行）
3) 【选项】块（2-3 个，每项以"•"开头）

## 状态更新格式
年龄:N / 魂力+N 或 魂力提升至N / 时间:xxx / 天气:晴阴雨雪雾雷风
获得|删除魂技：名（描述）
获得|删除魂环：百年
获得|删除特质：名(先天)（描述）
人物：姓名/性别/武魂/魂力/关系/描述（六段，/分隔）
删除人物：名 / 时期:名 / 归档时期:名

## 硬约束
- 时间每轮必写；其他字段仅在有变化时写，绝不写"无"。
- 只有写进【状态更新】的才生效，叙事里提"魂力提升"不算。
- 人物行第 3 段是武魂名（不是人名）；无信息填"未知"。
- 主角性别为 ${CORE.gender}，据此调整称呼、外貌、心理与社交描写。

## 叙事要求
- 日常 100-200 字，关键剧情 250-350 字，不超过 400 字。
- 用"你"指代玩家，禁止用"他/她/角色名"指代玩家。
- ${isContinue ? '玩家选择"继续"：自然推进剧情，可让 NPC 主动说话，不替玩家做重大决定。' : '根据玩家输入推进剧情。'}

## 文本分层标记
- 对话：用中文引号 “……” 或 「……」
- 心理：（……）
- 关键动作/戏剧性瞬间：*……*（每段最多 1 处）

## 人物档案
- 现役：人物：姓名/性别/武魂/魂力/关系/描述
- 归档：离开时期时用"归档时期：时期名"，该时期所有现役自动定格
- 唤醒：再遇归档人物用"人物："激活，须体现时间差的成长
- 切换时期：时期：时期名

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
//  Token 用量面板
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
    <div style="font-size:11px;color:#6b7280;margin-top:12px;line-height:1.5;">* 按 ${modelLabel} 空闲时段均价估算，实际以 DeepSeek 账单为准。高峰时段（9:00-12:00 / 14:00-18:00）翻倍。</div>
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
//  摘要 + 章节生成
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
不要把新对话里的每个事件都列一遍，只提炼对后续剧情有影响的。
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
const prompt=`为斗罗大陆2绝世唐门时代角色"${name}"（${gender}）生成一份角色设定，先天魂力${innate}级。包含：年龄、外貌、性格、出身背景、一个小癖好。约100-150字。直接输出描述。`;
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
      content: `你是斗罗大陆2（绝世唐门时代）的角色设定编辑。
把下面的角色设定重写为 150 字左右（120-180 字）的精炼版本。

铁律：
1) 严格保留原文的一切事实（姓名、年龄、外貌、性格、出身、特长、癖好），不得删改、不得凭空新增设定。
2) 优化信息密度：用最少的字传达最多的关键信息，去掉排比、重复、抒情、废话。
3) 若原文过短（<80字）：不改变原设定、不新增背景，围绕已有事实合理展开细节（例如把"温柔"写成具体行为），补到 120-180 字。
4) 若原文过长（>200字）：压缩到 120-180 字，优先保留可复用的具体细节。
5) 若原文已经合适（80-200字）：只做润色，字数保持在范围内。
6) 输出：第三人称设定文，不是叙事。直接输出文本，无前缀、无标题、无引号。

【原文】
${desc}`
    }], ()=>{});
    if(refined && refined.trim().length >= 30){
      const finalDesc = refined.trim();
      document.getElementById('roleDesc').value = finalDesc;
      alert(`已优化：${oldLen} 字 → ${finalDesc.length} 字`);
    }else{
      alert('优化结果异常，请重试');
    }
  }catch(e){
    alert('优化失败：' + e.message);
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = oldText || 'AI优化当前设定'; }
  }
}

// ============================================================
//  觉醒（用 Pro 模型，两阶段：叙事 + JSON角色识别）
// ============================================================
async function awakenSoul(){
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
CORE.age=6;
CORE.roleDesc=roleDesc||"无详细设定";
CORE.innatePower=Math.min(Math.max(innate,1),10);
CORE.soulPower=CORE.innatePower;
CORE.summary='';
CORE.rings=[];CORE.skills=[];CORE.traits=[];CORE.npcs=[];
CORE.time='觉醒武魂当天';
CORE.era='初始';
CORE.weather='';
CORE.chapterNum=0;
CORE.chapterTitle='';
updateAvatarPreview();
const soulChoice=document.querySelector('input[name="soulChoice"]:checked').value;
let customSoul='';
if(soulChoice==='custom')customSoul=document.getElementById('customSoul').value.trim()||'未知武魂';

const systemPrompt=`## 你的角色
你是斗罗大陆2（绝世唐门时代）的武魂觉醒仪式引导者。玩家就是主角"你"，用第二人称叙述。

## 世界观
${FIXED_WORLD}

## 本轮信息
角色：${name}（${gender}，6岁）
设定：${CORE.roleDesc}
先天魂力：${innate}级（初始魂力=${CORE.soulPower}级）
${customSoul?'指定武魂：'+customSoul:'请为角色设计一个独特武魂，给出名称与特性。'}

## 叙事范例（只学密度、节奏与用语，具体内容每次全新构想）
觉醒室的门推开，一位穿魂师制服的成年人走进来，掌心的魂导器泛着微光。
"放松。"他把魂导器贴近你的额头，"别怕，就像被灯照了一下。"
你闭上眼睛，感觉到一股暖流顺着经脉游走，*在胸口汇聚成一个光点*。
"呵——"对方眼神一亮，魂导器上的刻度亮了一格，"有意思。"

【状态更新】
年龄：6
时间：觉醒武魂当天·上午
天气：晴
获得特质：敏锐灵觉(先天)（对魂力波动感知较常人敏锐）
人物：<你自己为觉醒师起一个2-3字的中文姓名>/男/<觉醒师的武魂名，2-6字，不是人名>/30级/觉醒引导者/天斗帝国魂师协会派驻觉醒师

【选项】
• 仔细感受体内的魂力流动
• 向觉醒师询问武魂的来历
• 看向院长，想告诉她结果

## 输出结构（严格按顺序）
1) 叙事正文 400-600 字（第二人称）
2) 【状态更新】块（必须含上面示例中的所有字段）
3) 【选项】块（2-3 个，每项以"•"开头）

## 硬约束
- 觉醒师姓名请你自由发挥，每次新游戏都换一个新名字，名字要有斗罗大陆风格（如：苏牧、江晨、温良、洛青、沈岳…）。
- 人物行必须严格六段，用 / 分隔。第 3 段是武魂名，绝不能填人名。
- 叙事正文中必须用独立一行明确写出「武魂：xxx」和「武魂描述：xxx」两行，缺一不可。这两行写在正文结尾，不写进【状态更新】块。
- 对话用引号，心理用括号，关键动作用 *……* 包裹。
- 结尾给出明确去向：让觉醒师或在场长辈说一句方向性的话，告诉孩子接下来去哪。方向句换着用（去某学院报名 / 你这武魂偏某系，更适合某学院，回头写封信 / 先回家跟父母说一声，过几天再来 / 去魂师协会登记，那边会安排启蒙课）。
- 【选项】里必须包含 2-3 个具体可执行的下一步方向（去某处报名 / 回家告诉父母 / 去魂师协会 / 拜访某位长辈），让玩家清楚知道该往哪走。
- 每次新游戏的觉醒场景都从零构想：房间形制、觉醒师（性别/年龄/外貌/武魂）、使用的器材、开场动作、在场者，全部全新设计。范例只用来感受叙事密度和节奏，不提供可复用的具体元素。`;

isGenerating=true;sendBtn.disabled=true;userInput.disabled=true;
try{
const reply=await streamAndProcess([{role:"user",content:systemPrompt}], {model:'deepseek-v4-pro'});
applyScene(stripStatus(reply));

const parsed = await parseStructuredUpdate(stripStatus(reply), '觉醒武魂');
const update=parsed.update;
update.soulPowerBase=0;update.soulPowerAbsolute=null;

let soulName = customSoul;
let soulDesc = '';
if(!soulName){
    const patterns = [
      /武魂[：:]\s*([^\n【]{2,15}?)(?=\s*武魂描述|【|$)/,
      /武魂(?:名[为叫]?|是|叫做?)[：:：]?\s*[「“"]?([^\n【，。、"」]{2,12})[」”"]?/,
      /觉醒(?:出了?|的武魂[是为])[：:：]?\s*[「“"]?([^\n【，。、"」]{2,12})[」”"]?/,
      /【武魂[：:]\s*([^\n】]+)】/,
    ];
    for(const re of patterns){
      const nm = reply.match(re);
      if(nm){ soulName = nm[1].trim().replace(/[。，,.]$/,''); break; }
    }
    const descMatch = reply.match(/武魂描述[：:]\s*([^\n【]+)/);
    if(descMatch) soulDesc = descMatch[1].trim();
    if(!soulName) soulName = '未知武魂';
    if(soulName.length > 15) soulName = soulName.slice(0, 15);
}
CORE.martialSoul = soulName;
CORE.martialSoulDesc = soulDesc;

applyUpdate(update);
CORE.soulPower=CORE.innatePower;
PLOT.history=[];PLOT.turn=0;PLOT.isFirst=false;PLOT.summaryCounter=0;
PLOT.history.push({role:"assistant",content:reply});
updateStatus();saveToPhone();
appendOptions(parsed.options);

if(!soulName || soulName === '未知武魂' || soulName === '未觉醒'){
  chatBox.innerHTML += `<div class="msg-sys" style="color:#fbbf24;font-size:12px;">⚠️ 未能从觉醒叙事中识别武魂，可点「⋯ → 编辑角色档案」手动补上。</div>`;
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

const hasValidSave = localStorage.getItem('douro2Save') && CORE.name && CORE.martialSoul !== '未觉醒';
if(hasValidSave && !confirm("已有存档，开始新游戏会覆盖。确定？")) return;

localStorage.removeItem('douro2Save');
const _keepAvatar = CORE.avatar || '';
Object.assign(CORE, {name:roleName,avatar:_keepAvatar,gender:'女',age:0,roleDesc:'',martialSoul:'未觉醒',martialSoulDesc:'',innatePower:5,soulPower:1,rings:[],skills:[],traits:[],npcs:[],flags:{},summary:'',time:'觉醒武魂当天',era:'初始',weather:'',chapterNum:0,chapterTitle:''});
Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});

resetScene();

document.getElementById('config-inputs').classList.remove('hidden');
configPanel.style.display='none';
gameArea.style.display='flex';
try {
  chatBox.innerHTML=`<div class="msg-sys">欢迎，${escapeHtml(document.getElementById('roleName').value||'旅者')}。准备觉醒武魂...</div>`;
  setTimeout(()=>sendAction("觉醒武魂"),400);
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