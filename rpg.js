// ============================================================
//  rpg.js - 角色扮演模式专属逻辑
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
魂导器文明高度发达，城市有魂导灯、柏油路、魂导列车、魂导飞艇；乡村相对原始。
三大势力：日月帝国（魂导器最强）、天斗帝国、星罗帝国。史莱克学院为大陆第一学院。唐门衰落。
魂师体系：魂士→魂师→大魂师→魂尊→魂宗→魂王→魂帝→魂圣→魂斗罗→封号斗罗。
货币：金/银/铜魂币（1金=10银=100铜）。
具体设定见资料库，优先参考资料库。`;

const CORE={name:'',avatar:'',gender:'女',age:0,roleDesc:'',martialSoul:'未觉醒',martialSoulDesc:'',innatePower:5,soulPower:1,rings:[],skills:[],inventory:[],traits:[],npcs:[],flags:{},summary:'',time:'觉醒武魂当天',era:'初始',weather:'',chapterNum:0,chapterTitle:''};
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
//  场景氛围 + 时间/天气（模块 12 + 16）
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
  if(/下午|午后/.test(timeStr)) return '午后';
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
if(CORE.inventory.length>0&&typeof CORE.inventory[0]==='string')CORE.inventory=CORE.inventory.map(i=>({name:i,count:1,desc:''}));
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
delete CORE.hp;delete CORE.maxHp;
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
Object.assign(CORE, {name:'',avatar:_keepAvatar2,gender:'女',age:0,roleDesc:'',martialSoul:'未觉醒',martialSoulDesc:'',innatePower:5,soulPower:1,rings:[],skills:[],inventory:[],traits:[],npcs:[],flags:{},summary:'',time:'觉醒武魂当天',era:'初始',weather:'',chapterNum:0,chapterTitle:''});
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
function openBag(){renderExpandableList(document.getElementById('bagContent'),CORE.inventory,{emptyText:'空',removeFn:'removeBagItem'});openModal('bagModal')}
function removeBagItem(idx){CORE.inventory.splice(idx,1);updateStatus();openBag()}
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
optionsArea.innerHTML='';
const container=document.createElement('div');
container.className='options-container';
if(aiOptions&&aiOptions.length>0){
aiOptions.forEach(text=>{
const cls = classifyOption(text);
const btn=document.createElement('button');
btn.className='option-btn';
btn.dataset.type = cls.label;
btn.innerHTML = `<span class="opt-icon">${cls.icon}</span><span class="opt-text">${escapeHtml(text)}</span>`;
btn.onclick=()=>{if(isGenerating)return;sendAction(text)};
container.appendChild(btn);
});
}else{
const btn=document.createElement('button');
btn.className='option-btn';
btn.dataset.type = '行动';
btn.innerHTML = `<span class="opt-icon">▶️</span><span class="opt-text">继续剧情</span>`;
btn.onclick=()=>{if(isGenerating)return;sendAction('继续')};
container.appendChild(btn);
}
optionsArea.appendChild(container);
optionsArea.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ============================================================
//  状态解析
// ============================================================
const STATUS_LINE_RE=/^(年龄[：:]|魂力\s*[+\-：:]|魂力\s*(提升|增加|提高|升至|达到|变为)|获得物品[：:]|消耗物品[：:]|使用物品[：:]|删除物品[：:]|获得魂技[：:]|删除魂技[：:]|获得魂环[：:]|删除魂环[：:]|获得特质[：:]|删除特质[：:]|人物[：:]|重要人物[：:]|新人物[：:]|删除人物[：:]|时间[：:]|天气[：:]|时期[：:]|归档时期[：:])/;
function stripStatus(text){let result=text.replace(/【状态更新】[\s\S]*?(?=【选项】|$)/g,'');result=result.replace(/【选项】[\s\S]*/g,'');const lines=result.split('\n');const kept=lines.filter(line=>{const t=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();if(!t)return true;if(STATUS_LINE_RE.test(t))return false;return true});return kept.join('\n').trim()}
function parseSeg(seg){let name=seg,count=1,desc='';const descM=seg.match(/^(.+?)[（(](.+?)[）)]\s*$/);if(descM){name=descM[1].trim();desc=descM[2].trim()}const cntM=name.match(/[×xX*](\d+)\s*(个|枚|颗|件|本|张|块|份)?\s*$/);if(cntM){count=parseInt(cntM[1])||1;name=name.replace(/[×xX*]\d+\s*(个|枚|颗|件|本|张|块|份)?\s*$/,'').trim()}const cnM=name.match(/^(.+?)([一二三四五六七八九十百千万]+)(个|枚|颗|件|本|张|块|份)\s*$/);if(cnM){count=chineseToNumber(cnM[2]);name=cnM[1].trim()}return{name,count,desc}}

// ============================================================
//  属性操作
// ============================================================
function addItem(name,count,desc){const existing=CORE.inventory.find(i=>i.name===name);if(existing){existing.count+=count;if(desc&&!existing.desc)existing.desc=desc}else CORE.inventory.push({name,count,desc:desc||''});chatBox.innerHTML+=`<div class="msg-gain">${icon('item','#4ade80')}获得：${escapeHtml(name)}${count>1?` ×${count}`:''}</div>`;if(typeof soundDing==='function')soundDing(880,0.35)}
function consumeItem(name,count){let idx=CORE.inventory.findIndex(i=>i.name===name);if(idx===-1){const cleanName=name.replace(/\s+/g,'');idx=CORE.inventory.findIndex(i=>{const itemClean=i.name.replace(/\s+/g,'');return itemClean===cleanName||itemClean.includes(cleanName)||cleanName.includes(itemClean)})}if(idx===-1)return false;if(CORE.inventory[idx].count<count)count=CORE.inventory[idx].count;CORE.inventory[idx].count-=count;const itemName=CORE.inventory[idx].name;if(CORE.inventory[idx].count<=0)CORE.inventory.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">${icon('consume','#f87171')}消耗：${escapeHtml(itemName)} ×${count}</div>`;if(typeof soundDing==='function')soundDing(560,0.25,0.35);return true}
function deleteItem(name){const idx=CORE.inventory.findIndex(i=>i.name===name);if(idx!==-1){const n=CORE.inventory[idx].name;CORE.inventory.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除物品：${escapeHtml(n)}</div>`}}
function addRing(name,desc){const existing=CORE.rings.find(r=>r.name===name);if(existing)existing.count=(existing.count||1)+1;else CORE.rings.push({name,count:1,desc:desc||''});chatBox.innerHTML+=`<div class="msg-ring">${icon('ring','#c084fc')}魂环：${escapeHtml(name)}</div>`;triggerBtnDot('openRings');if(typeof soundDing==='function')soundDing(988,0.45,0.5)}
function deleteRing(name){const idx=CORE.rings.findIndex(r=>r.name===name);if(idx!==-1){CORE.rings.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除魂环：${escapeHtml(name)}</div>`}}
function addSkill(name,desc){if(CORE.skills.find(s=>s.name===name))return;CORE.skills.push({name,desc:desc||''});chatBox.innerHTML+=`<div class="msg-skill">${icon('skill','#60a5fa')}魂技：${escapeHtml(name)}</div>`;if(typeof soundDing==='function')soundDing(784,0.4,0.45)}
function deleteSkill(name){const idx=CORE.skills.findIndex(s=>s.name===name);if(idx!==-1){CORE.skills.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除魂技：${escapeHtml(name)}</div>`}}
function addTrait(name,type,desc){if(CORE.traits.find(t=>t.name===name))return;CORE.traits.push({name,type,desc:desc||''});chatBox.innerHTML+=`<div class="msg-trait">${icon('trait','#fbbf24')}特质：${escapeHtml(name)}（${escapeHtml(type)}）</div>`;if(typeof soundDing==='function')soundDing(740,0.4,0.45)}
function deleteTrait(name){const idx=CORE.traits.findIndex(t=>t.name===name);if(idx!==-1){CORE.traits.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除特质：${escapeHtml(name)}</div>`}}

function addNPC(name,gender,soul,soulPower,relation,desc){
  const existing=CORE.npcs.find(n=>n.name===name);
  if(existing){
    existing.gender=gender||existing.gender;
    existing.soul=soul||existing.soul;
    if(soulPower&&!isPlaceholder(soulPower))existing.soulPower=soulPower;
    existing.relation=relation||existing.relation;
    if(desc)existing.desc=desc;
    if(existing.status==='archived'){
      existing.status='active';
      existing.era=CORE.era;
      existing.archTime='';
      existing.snapshot=null;
      chatBox.innerHTML+=`<div class="msg-npc">${icon('npc','#38bdf8')}故人重逢：${escapeHtml(name)}</div>`;
    }else{
      chatBox.innerHTML+=`<div class="msg-npc">${icon('npc','#38bdf8')}人物更新：${escapeHtml(name)}</div>`;
    }
  }else{
    CORE.npcs.push({name,gender:gender||'未知',soul:soul||'未知',soulPower:(soulPower&&!isPlaceholder(soulPower))?soulPower:'',relation:relation||'中立',desc:desc||'',era:CORE.era,status:'active',archTime:'',snapshot:null});
    if(CORE.npcs.length>50)CORE.npcs.shift();
    chatBox.innerHTML+=`<div class="msg-npc">${icon('npc','#38bdf8')}新人物：${escapeHtml(name)}（${escapeHtml(gender||'?')}·${escapeHtml(soul||'?')}）</div>`;
  }
  triggerBtnGlow('openNPCs');
}
function deleteNPC(name){const idx=CORE.npcs.findIndex(n=>n.name===name);if(idx!==-1){CORE.npcs.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除人物：${escapeHtml(name)}</div>`}}
function setEra(eraName){
  if(!eraName||eraName===CORE.era)return;
  CORE.era=eraName;
  chatBox.innerHTML+=`<div class="msg-time">${icon('time','#94a3b8')}进入新时期：${escapeHtml(eraName)}</div>`;
}
function archiveEra(eraName){
  let count=0;
  CORE.npcs.forEach(n=>{
    if(n.era===eraName&&n.status==='active'){
      n.status='archived';
      n.archTime=CORE.time;
      n.snapshot={soul:n.soul,soulPower:n.soulPower||'',relation:n.relation,desc:n.desc};
      count++;
    }
  });
  if(count>0)chatBox.innerHTML+=`<div class="msg-sys">时期归档：${escapeHtml(eraName)} · ${count}人定格于「${escapeHtml(CORE.time)}」</div>`;
}

// ============================================================
//  沉浸感辅助
// ============================================================
function triggerStatPowerPulse(){
  document.querySelectorAll('#status-bar .stat').forEach(el=>{
    if(el.textContent.includes('魂力')){
      el.classList.remove('stat-power-pulse');
      void el.offsetWidth;
      el.classList.add('stat-power-pulse');
      setTimeout(()=>el.classList.remove('stat-power-pulse'), 1500);
    }
  });
}
function triggerStageUpgrade(oldStage,newStage){
  const sb=document.getElementById('status-bar');
  if(sb){
    sb.classList.remove('stage-upgrade');
    void sb.offsetWidth;
    sb.classList.add('stage-upgrade');
    setTimeout(()=>sb.classList.remove('stage-upgrade'), 1700);
  }
  const banner=document.createElement('div');
  banner.className='stage-banner';
  banner.textContent=`晋阶 · ${newStage}`;
  document.body.appendChild(banner);
  setTimeout(()=>banner.remove(), 2300);
  if(typeof soundUpgrade==='function') soundUpgrade();
}
function triggerBtnDot(onclickName){
  const btn=document.querySelector(`#top-bar .ctrl-btn[onclick="${onclickName}()"]`);
  if(!btn) return;
  btn.classList.add('has-dot','btn-shake');
  setTimeout(()=>btn.classList.remove('btn-shake'), 500);
  const clear=()=>{ btn.classList.remove('has-dot'); btn.removeEventListener('click', clear); };
  btn.addEventListener('click', clear);
}
function triggerBtnGlow(onclickName){
  const btn=document.querySelector(`#top-bar .ctrl-btn[onclick="${onclickName}()"]`);
  if(!btn) return;
  btn.classList.remove('btn-glow');
  void btn.offsetWidth;
  btn.classList.add('btn-glow');
  setTimeout(()=>btn.classList.remove('btn-glow'), 3200);
}

// ============================================================
//  章节系统（模块 14）
// ============================================================
function insertChapterDivider(num, title){
  const html = `<div class="msg-chapter">—— 第${num}章 · ${escapeHtml(title)} ——</div>`;
  chatBox.innerHTML += html;
  chatBox.scrollTop = chatBox.scrollHeight;
}
async function generateChapterTitle(){
  if(PLOT.history.length < 3) return;
  const recent = PLOT.history.slice(-6);
  const text = recent.map(m => stripStatus(m.content)).join('\n').slice(0, 800);
  const prompt = `为以下剧情片段取一个5-8字的章节标题。
要求：中文，古典雅致，不含标点，不含引号，不含"第X章"，直接输出标题本身。

【剧情片段】
${text}`;
  try{
    const title = await callDeepSeekStream([{role:'user',content:prompt}], ()=>{});
    if(title){
      const clean = title.trim().replace(/[「」“”"'\s\r\n]/g,'').replace(/^第[一二三四五六七八九十百]+章[·、,，]?/,'').slice(0,12);
      if(clean.length >= 2 && clean.length <= 14){
        return clean;
      }
    }
  }catch(e){}
  return null;
}

// ============================================================
//  状态更新解析
// ============================================================
function parseStatusUpdate(text){
const update={age:null,soulPowerBase:0,soulPowerAbsolute:null,items:[],consumed:[],delItems:[],skills:[],delSkills:[],rings:[],delRings:[],traits:[],delTraits:[],npcs:[],delNpcs:[],time:null,era:null,archiveEra:null,weather:null};
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
const km=line.match(/^(获得物品|消耗物品|使用物品|删除物品|获得魂技|删除魂技|获得魂环|删除魂环|获得特质|删除特质|人物|重要人物|新人物|删除人物|时间|天气|时期|归档时期)[：:]\s*(.+)$/);
if(!km)continue;
const kw=km[1];const content=km[2].trim();
if(kw==='获得物品')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);if(!isPlaceholder(p.name))update.items.push(p)});
else if(kw==='消耗物品'||kw==='使用物品')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);if(!isPlaceholder(p.name))update.consumed.push({name:p.name,count:p.count})});
else if(kw==='删除物品')smartSplit(content).forEach(seg=>{const n=seg.split(/[（(]/)[0].trim();if(!isPlaceholder(n))update.delItems.push(n)});
else if(kw==='获得魂技')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);if(!isPlaceholder(p.name))update.skills.push({name:p.name,desc:p.desc})});
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
update.items.forEach(i=>addItem(i.name,i.count,i.desc));
update.consumed.forEach(c=>consumeItem(c.name,c.count));
update.delItems.forEach(n=>deleteItem(n));
update.skills.forEach(s=>addSkill(s.name,s.desc));
update.delSkills.forEach(n=>deleteSkill(n));
update.rings.forEach(r=>addRing(r.name,r.desc));
update.delRings.forEach(n=>deleteRing(n));
update.traits.forEach(t=>addTrait(t.name,t.type,t.desc));
update.delTraits.forEach(n=>deleteTrait(n));
update.npcs.forEach(n=>addNPC(n.name,n.gender,n.soul,n.soulPower,n.relation,n.desc));
update.delNpcs.forEach(n=>deleteNPC(n));
if(update.time){CORE.time=update.time;chatBox.innerHTML+=`<div class="msg-time">${icon('time','#94a3b8')}${escapeHtml(update.time)}</div>`}
if(update.weather){CORE.weather=update.weather;}
if(update.time || update.weather){
  // 时间或天气变化，刷新场景标签
  if(_currentSceneKey){
    const type = _currentSceneKey;
    const found = SCENE_TYPES.find(t => t.type === type) || SCENE_PLACES.find(p => p.type === type);
    if(found) updateSceneBanner({name:found.name, type:found.type, emoji:found.emoji});
  }
}
updateStatus();
}

// ============================================================
//  主角档案 + 动态世界书
// ============================================================
function buildCoreSummary(playerInput){
let s='';
s+=`主角：${CORE.name}（${CORE.gender}），${CORE.age||'?'}岁。\n`;
s+=`设定：${CORE.roleDesc}\n`;
s+=`武魂：${CORE.martialSoul}（先天魂力${CORE.innatePower}级，速度系数×${getSpeedFactor().toFixed(2)}）\n`;
if(CORE.martialSoulDesc) s+=`武魂描述：${CORE.martialSoulDesc}\n`;
s+=`魂力：${CORE.soulPower}级（${getStage(CORE.soulPower)}）\n`;
s+=`时间：${CORE.time}\n`;
if(CORE.weather) s+=`天气：${CORE.weather}\n`;
s+=`当前时期：${CORE.era}\n`;
s+=`魂环：${CORE.rings.map(r=>r.name).join('、')||'无'}\n`;
s+=`魂技：${CORE.skills.map(x=>x.name).join('、')||'无'}\n`;
s+=`特质：${CORE.traits.map(t=>t.name).join('、')||'无'}\n`;
s+=`背包：${CORE.inventory.map(i=>i.name+'×'+i.count).join('、')||'空'}\n`;
const activeNPCs=CORE.npcs.filter(n=>n.status!=='archived');
const archivedNPCs=CORE.npcs.filter(n=>n.status==='archived');
if(activeNPCs.length>0)s+=`【现役人物】\n${activeNPCs.map(n=>`- ${n.name}（${n.gender}·${n.soul}·魂力${n.soulPower||'?'}·${n.relation}）：${n.desc||''}`).join('\n')}\n`;
if(archivedNPCs.length>0){
  s+=`【归档人物】（玩家过去时期的故人，再次遇到时必须根据时间差描述其成长变化，并用"人物："指令重新激活）\n`;
  s+=archivedNPCs.map(n=>{
    const snap=n.snapshot||{};
    return `- ${n.name}（${n.gender}·${snap.soul||n.soul}·魂力${snap.soulPower||'?'}·${snap.relation||n.relation}·归档于「${n.archTime}」）：${snap.desc||n.desc||''}`;
  }).join('\n');
  s+='\n';
}
if(CORE.summary)s+=`前情：${CORE.summary}\n`;
if(Object.keys(MEDIA.worldbook).length>0){
  const recentText = PLOT.history.slice(-3).map(m=>stripStatus(m.content)).join('\n');
  const loreText = triggerLorebook(playerInput || '', recentText, 5);
  if(loreText) s += loreText + '\n';
}
return s;
}

// ============================================================
//  流式处理
// ============================================================
function isNearBottom(threshold){
  threshold = threshold || 100;
  return chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < threshold;
}

async function streamAndProcess(messages){
const aiMsgDiv=document.createElement('div');
aiMsgDiv.className='msg-ai streaming';
aiMsgDiv.textContent='...';
chatBox.appendChild(aiMsgDiv);
chatBox.scrollTop=chatBox.scrollHeight;

// 追踪用户是否主动上滚（一旦上滚，流式期间不再强制跟随）
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
});
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
if(!text){chatBox.innerHTML+=`<div class="msg-debug">用法：/调试 获得金币50</div>`;return}
text=normalizeDebugText(text);
const pseudo=`【状态更新】\n${text}\n`;
const update=parseStatusUpdate(pseudo);
const hasAny=update.items.length>0||update.consumed.length>0||update.delItems.length>0||update.skills.length>0||update.delSkills.length>0||update.rings.length>0||update.delRings.length>0||update.traits.length>0||update.delTraits.length>0||update.npcs.length>0||update.delNpcs.length>0||update.time!==null||update.era!==null||update.archiveEra!==null||update.weather!==null||update.soulPowerAbsolute!==null||update.soulPowerBase!==0||update.age!==null;
if(!hasAny){chatBox.innerHTML+=`<div class="msg-debug">无法识别，请用：/调试 获得物品：金币×50</div>`;return}
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
if(/^(获得物品|消耗物品|使用物品|删除物品|获得魂技|删除魂技|获得魂环|删除魂环|获得特质|删除特质|人物|重要人物|新人物|删除人物|时间|天气|魂力|年龄|时期|归档时期)[：:]/.test(text))return text;
let m;
if((m=text.match(/^年龄\s*(\d+)\s*$/)))return `年龄：${m[1]}`;
if((m=text.match(/^魂力\s*([+-]?\d+)\s*$/)))return `魂力 ${m[1]}`;
if((m=text.match(/^魂力\s*(?:提升至|提升到|达到|变为)\s*(\d+)\s*$/)))return `魂力 提升至${m[1]}`;
if((m=text.match(/^(?:认识|遇见|遇到|结识|加入|新增)\s*(?:人物|npc|NPC)?\s*(.+?)\s*$/))){const n=m[1].trim();if(n)return `人物：${n}/未知/未知/未知/相识/`}
if((m=text.match(/^删除人物\s+(.+?)\s*$/)))return `删除人物：${m[1]}`;
if((m=text.match(/^(?:消耗|使用|吃掉|用掉|花掉|扣除)\s*(\d+)\s*(个|枚|颗|件|本|张|块|份|瓶|袋|把|支|根|条|片|滴)?\s*(.+?)\s*$/)))return `消耗物品：${m[3]}×${m[1]}`;
if((m=text.match(/^(?:消耗|使用|吃掉|用掉|花掉|扣除)\s*(.+?)\s*(\d+)\s*(个|枚|颗|件|本|张|块|份|瓶|袋|把|支|根|条|片|滴)?\s*$/)))return `消耗物品：${m[1]}×${m[2]}`;
if((m=text.match(/^(?:消耗|使用|吃掉|用掉|花掉|扣除)\s*(.+?)\s*$/)))return `消耗物品：${m[1].trim()}×1`;
if((m=text.match(/^删除物品\s*(.+?)\s*$/)))return `删除物品：${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*魂环\s*$/)))return `获得魂环：${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*魂技\s*$/)))return `获得魂技：${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*特质\s*$/)))return `获得特质：${m[1]}(先天)`;
if((m=text.match(/^获得\s*([一二三四五六七八九十百千万]+)\s*(个|枚|颗|件|本|张|块|份|瓶|袋|把|支|根|条|片|滴)?\s*(.+?)\s*$/))){const num=chineseToNumber(m[1]);if(num>0)return `获得物品：${m[3]}×${num}`}
if((m=text.match(/^获得\s*(.+?)\s*(\d+)\s*(个|枚|颗|件|本|张|块|份|瓶|袋|把|支|根|条|片|滴)?\s*$/)))return `获得物品：${m[1]}×${m[2]}`;
if((m=text.match(/^获得\s*(\d+)\s*(个|枚|颗|件|本|张|块|份|瓶|袋|把|支|根|条|片|滴)?\s*(.+?)\s*$/)))return `获得物品：${m[3]}×${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*([一二三四五六七八九十百千万]+)\s*(个|枚|颗|件|本|张|块|份|瓶|袋|把|支|根|条|片|滴)?\s*$/))){const num=chineseToNumber(m[2]);return `获得物品：${m[1]}×${num}`}
return `获得物品：${text}×1`;
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
if(PLOT.isFirst){await awakenSoul();return}
isGenerating=true;sendBtn.disabled=true;userInput.disabled=true;
try{
const coreSummary=buildCoreSummary(action);
const isContinue=action==='继续';
const systemPrompt=`你是一部斗罗大陆2（绝世唐门时代）背景的小说叙事者，玩家就是主角"你"。用第二人称"你"叙述。

【主角档案】
${coreSummary}

【世界观】
${FIXED_WORLD}

【性别设定 - 极重要】
主角性别为：${CORE.gender}。请根据性别调整称呼、外貌描写、心理活动和社交互动，避免出现与主角性别不符的描写。

【时代词汇规范 - 极重要】
这是魂导器文明时代，不是古代！避免使用：官道、驿站、客栈、铜板、银两、镖局、江湖、衙门。
应使用：公路/大道、补给站/旅馆、魂导酒店、魂币（金/银/铜）、佣兵行会、城卫队、市政厅。
短途走路，城际应提到魂导列车、魂导飞艇。
日常道具备选：魂导灯/萤石灯（照明），魂导车/魂导列车/魂导飞艇（交通），魂导通讯器（通讯）。

【叙事要求 - 严格遵守】
- 日常 100-200 字，关键剧情 250-350 字，禁止超过 400 字
- 场景/对话/感官点到为止，不写华丽排比
- 用"你"指代玩家，禁止用"他/她/角色名"指代玩家
- ${isContinue?'玩家选择"继续"，自然推进剧情，可让NPC主动说话，不要替玩家做重大决定。':'根据玩家输入推进剧情。'}

【文本分层标记 - 必须遵守】
- 角色对话：用中文引号 “……” 或 「……」
- 心理活动：用括号 （……）
- 关键动作/戏剧性瞬间：用星号 *……* 包裹（每段最多 1 处）
- 场景描写、普通动作：不加标记

【状态更新 - 极重要】
叙事末尾写一段"【状态更新】"块，每行一个关键词开头，只在有变化时写该行：
年龄：13
魂力 +5  或  魂力 提升至13
时间：xxx
天气：晴/阴/雨/雪/雾/雷/风
获得物品：物品名×数量（描述）
消耗物品：物品名×数量
删除物品：物品名
获得魂技：名称（描述）
删除魂技：名称
获得魂环：百年
删除魂环：xxx
获得特质：名称(先天)（描述）
删除特质：名称
人物：姓名/性别/武魂/魂力/关系/描述
删除人物：姓名
时期：时期名
归档时期：时期名

⚠️ 时间：每轮必写。
⚠️ 天气：只在变化时写。
⚠️ 其他字段：只在有变化时写，无变化省略整行，绝不写"无"。
⚠️ 只有写进【状态更新】的属性才会更新，叙事里提"魂力提升"不算。
⚠️ 参考：主角是${CORE.age||'未知'}岁，当前魂力${CORE.soulPower}级。剧情没有明确修炼/战斗/时间跨越，不要随意提升魂力。
⚠️ 卖/交易/使用物品时写两行：消耗物品：X×N + 获得物品：魂币×N。
⚠️ 人物魂力变化时，用新魂力重写完整人物行（六段式）。
⚠️ 人物行六段：【姓名 / 性别 / 武魂 / 魂力 / 关系 / 描述】。
   - 第1段人名（2-4字），第3段武魂名，绝不能填人名！
   - ❌ 错误：人物：觉醒师/男/林远/30级/觉醒引导者/…
   - ✅ 正确：人物：林远/男/青风狼/30级/觉醒引导者/…
   - 无武魂信息填"未知"，不要编造或把名字塞进来。

【人物档案规则 - 极重要】
人物分"现役"与"归档"两种：
- 现役：当前时期活跃，用"人物：姓名/性别/武魂/魂力/关系/描述"更新（六段式，用 / 分隔；魂力写"XX级"或"未知"）
- 归档：玩家离开某时期时（毕业、远行、换地图），用"归档时期：时期名"指令，该时期所有现役人物自动定格
- 唤醒：多年后再遇归档人物时，必须考虑时间差重新描述其成长（外貌、魂力、性格、关系变化），用"人物："指令激活
- 时期：用"时期：时期名"切换当前时期，如"史莱克学院（外院一年级）"
示例：
离开学院 → "归档时期：史莱克学院（外院一年级）"
数年后再遇 → "人物：苏糖/女/海豚武魂/32级/旧友/（多年未见，她已成为一名气质沉稳的少女）"

【选项 - 必须】
在【状态更新】块之后，必须用【选项】引出2-3个玩家可选的行动，每项用"•"开头。
这些选项要贴合当前剧情，能推进故事，让玩家有真实选择感。`;
const narrativePrompts = {
  concise: `【叙事风格 - 简洁】
- 文字精炼，点到为止，不堆砌形容词
- 对话为主，场景描写不超过 2 句
- 关键信息优先，冗余抒情省略`,
  standard: `【叙事风格 - 标准】
- 平衡描写与对话，节奏舒适
- 场景、感官、心理各一点，不铺陈
- 不写华丽排比`,
  ornate: `【叙事风格 - 华丽】
- 用丰富的感官和意象，营造沉浸感
- 场景描写可以铺陈，但不超过 6 句
- 保留关键情节推进，不要只抒情不推动剧情`
};
const styleBlock = narrativePrompts[SETTINGS.narrativeStyle] || narrativePrompts.standard;
const proactiveBlock = SETTINGS.npcProactive !== false ? `
【NPC 主动性 - 重要】
- 每 2~3 轮至少让一个 NPC 主动说话或采取行动（送信、求助、挑衅、提议、打断等）
- NPC 有自己的目标和情绪，不是玩家提问才存在
- 让世界"活着"，即使玩家发呆也可能有事发生
` : '';
const fullPrompt = systemPrompt + '\n\n' + styleBlock + '\n' + proactiveBlock;
const messages=[{role:"system",content:fullPrompt}];
const recent=PLOT.history.slice(-3);
recent.forEach(m=>messages.push({role:m.role,content:stripStatus(m.content)}));
messages.push({role:"user",content:isContinue?'（继续）':action});
const reply=await streamAndProcess(messages);
const updateInfo=parseStatusUpdate(reply);
applyUpdate(updateInfo);
appendOptions(extractOptions(reply));
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
//  Token 用量面板（模块 43）
// ============================================================
function openTokenPanel(){
  const s = TOKEN_STATS;
  const l = LIFETIME;
  const IN_PRICE = 2 / 1000000;
  const OUT_PRICE = 8 / 1000000;
  const sCost = s.input * IN_PRICE + s.output * OUT_PRICE;
  const lCost = l.input * IN_PRICE + l.output * OUT_PRICE;
  const html = `
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
    <div style="font-size:11px;color:#6b7280;margin-top:12px;line-height:1.5;">* 费用按约 ¥2/百万（输入）+ ¥8/百万（输出）估算，实际以 DeepSeek 账单为准。</div>
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
目标长度约${targetLen}字，第三人称，保留有后续影响的内容（人物、地点、目标、承诺、身份、物品、能力），丢弃琐事。
直接输出正文，不要任何前缀。

【旧摘要】${oldSummary||'（开头）'}
【新对话】
${historyText}`;
try{
const summary=await callDeepSeekStream([{role:'user',content:prompt}],()=>{});
if(summary&&summary.trim().length>20){
CORE.summary=summary.trim();
PLOT.summaryCounter=0;
chatBox.innerHTML+=`<div class="msg-summary">记忆精炼 · 摘要 ${CORE.summary.length} 字</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
saveToPhone();
// 同步生成章节标题
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
//  角色生成 / 觉醒
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
CORE.rings=[];CORE.skills=[];CORE.inventory=[];CORE.traits=[];CORE.npcs=[];
CORE.time='觉醒武魂当天';
CORE.era='初始';
CORE.weather='';
CORE.chapterNum=0;
CORE.chapterTitle='';
updateAvatarPreview();
const soulChoice=document.querySelector('input[name="soulChoice"]:checked').value;
let customSoul='';
if(soulChoice==='custom')customSoul=document.getElementById('customSoul').value.trim()||'未知武魂';
const systemPrompt=`你是斗罗大陆2（绝世唐门时代）的武魂觉醒仪式引导者。玩家就是主角"你"，用第二人称"你"叙述。

【角色】${name}，${gender}，6岁
【设定】${CORE.roleDesc}
【先天魂力】${innate}级（初始魂力=${CORE.soulPower}级）
【世界观】${FIXED_WORLD}
${customSoul?'指定武魂：'+customSoul:'请为角色设计一个独特武魂（避免蓝银草、昊天锤等常见武魂），给出名称和特性。'}

【任务】
1. 用"你"生动描述觉醒场景（400-600字）
2. 初始魂力${CORE.soulPower}级
3. 生成3-5个先天特质
4. 末尾必须写【状态更新】块，含：年龄：6，时间：觉醒武魂当天·上午，天气：（根据场景合理选择晴天/阴天/雨天等），获得特质：xxx(先天)，人物：<觉醒师姓名，如"陈默">/男/<觉醒师的武魂名，如"青风狼"，不是人名！>/30级/觉醒引导者/天斗帝国魂师协会派驻觉醒师

【文本分层标记】
- 对话用 “……” 或 「……」
- 心理活动用 （……）
- 关键动作用 *……* 包裹

【武魂格式 - 极重要】
请在叙事中明确写出：
武魂：xxx
武魂描述：xxx（简短描述这个武魂的外观、来历、特性等）

【选项】
在【状态更新】后，用【选项】给出2-3个觉醒后的行动选项，每项用"•"开头。

格式：叙事 + 【状态更新】 + 【选项】`;
isGenerating=true;sendBtn.disabled=true;userInput.disabled=true;
try{
const reply=await streamAndProcess([{role:"user",content:systemPrompt}]);
const update=parseStatusUpdate(reply);
update.soulPowerBase=0;update.soulPowerAbsolute=null;

let soulName = customSoul;
let soulDesc = '';
if(!soulName){
    const nameMatch = reply.match(/武魂[：:]\s*([^\n]+?)(?=武魂描述|【|$)/);
    if(nameMatch) soulName = nameMatch[1].trim().replace(/[。，,.]$/,'');
    const descMatch = reply.match(/武魂描述[：:]\s*([^\n]+)/);
    if(descMatch) soulDesc = descMatch[1].trim();
    if(!soulName) soulName = '未知武魂';
}
CORE.martialSoul = soulName;
CORE.martialSoulDesc = soulDesc;

applyUpdate(update);
CORE.soulPower=CORE.innatePower;
PLOT.history=[];PLOT.turn=0;PLOT.isFirst=false;PLOT.summaryCounter=0;
PLOT.history.push({role:"assistant",content:reply});
updateStatus();saveToPhone();
appendOptions(extractOptions(reply));
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
Object.assign(CORE, {name:roleName,avatar:_keepAvatar,gender:'女',age:0,roleDesc:'',martialSoul:'未觉醒',martialSoulDesc:'',innatePower:5,soulPower:1,rings:[],skills:[],inventory:[],traits:[],npcs:[],flags:{},summary:'',time:'觉醒武魂当天',era:'初始',weather:'',chapterNum:0,chapterTitle:''});
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