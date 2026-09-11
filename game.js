// ============================================================
//  工具函数
// ============================================================
function escapeHtml(text){
  if(text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
// ============================================================
//  图标库
// ============================================================
const SVG_ICONS={
name:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
soul:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>',
power:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
stage:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20h4v-8H3v8zm5 0h4V8H8v12zm5 0h4V4h-4v16zm5 0h4V12h-4v8z"/></svg>',
time:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/></svg>',
ring:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/></svg>',
skill:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l2.5 7.5L22 11l-7.5 2.5L12 21l-2.5-7.5L2 11l7.5-2.5z"/></svg>',
item:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>',
trait:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.2 5.6.8-4 4 1 5.8L12 15l-5 2.8 1-5.8-4-4 5.6-.8z"/></svg>',
npc:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
age:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
consume:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>'
};

// ============================================================
//  素材库（仅保留世界观资料加载）
// ============================================================
const MEDIA={worldbook:{}};
function loadDefaultMedia(){
fetch('./media.json').then(r=>r.json()).then(def=>{
if(def.worldbook){for(const k in def.worldbook){if(!MEDIA.worldbook[k])MEDIA.worldbook[k]=def.worldbook[k]}}
}).catch(e=>console.warn('默认素材加载失败',e));
}

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
//  设置
// ============================================================
const SETTINGS={useIcons:true,useRingsVisual:true,useSceneBg:true,useTokenStats:false,chatTheme:'default'};
const TOKEN_STATS={input:0,output:0,session:0};
function saveSettings(){try{localStorage.setItem('douro2Settings',JSON.stringify(SETTINGS))}catch(e){}}
function loadSettings(){
try{const raw=localStorage.getItem('douro2Settings');if(raw)Object.assign(SETTINGS,JSON.parse(raw))}catch(e){}
document.getElementById('setIcons').checked=SETTINGS.useIcons;
document.getElementById('setRingsVisual').checked=SETTINGS.useRingsVisual;
document.getElementById('setSceneBg').checked=SETTINGS.useSceneBg;
if(document.getElementById('setTokenStats'))document.getElementById('setTokenStats').checked=SETTINGS.useTokenStats;
const themeSelect = document.getElementById('setChatTheme');
if(themeSelect) themeSelect.value = SETTINGS.chatTheme || 'default';
applyThemeClass();
updateTokenDisplay();
}
function toggleSetting(key,value){
SETTINGS[key]=value;saveSettings();updateStatus();
if(key==='useSceneBg'&&!value){const cb=document.getElementById('chat-box');cb.className=cb.className.split(' ').filter(c=>!c.startsWith('scene-')).join(' ')}
if(key==='chatTheme'){applyThemeClass()}
}
function applyThemeClass(){
document.body.className = document.body.className.split(' ').filter(c => c !== 'theme-cute').join(' ');
if(SETTINGS.chatTheme === 'cute') document.body.classList.add('theme-cute');
}
function toggleMinimalMode(on){if(on){SETTINGS.useIcons=false;SETTINGS.useRingsVisual=false;SETTINGS.useSceneBg=false}else{SETTINGS.useIcons=true;SETTINGS.useRingsVisual=true;SETTINGS.useSceneBg=true}document.getElementById('setIcons').checked=SETTINGS.useIcons;document.getElementById('setRingsVisual').checked=SETTINGS.useRingsVisual;document.getElementById('setSceneBg').checked=SETTINGS.useSceneBg;if(document.getElementById('setTokenStats'))document.getElementById('setTokenStats').checked=SETTINGS.useTokenStats;updateTokenDisplay();saveSettings();updateStatus();if(!SETTINGS.useSceneBg){const cb=document.getElementById('chat-box');cb.className=cb.className.split(' ').filter(c=>!c.startsWith('scene-')).join(' ')}}
function updateTokenDisplay(){const el=document.getElementById('s-token');const box=document.getElementById('token-stat');if(!el||!box)return;if(!SETTINGS.useTokenStats){box.classList.add('hidden');return}box.classList.remove('hidden');el.textContent=TOKEN_STATS.session}
function openSettings(){loadSettings();openModal('settingsModal')}
function openMore(){openModal('moreModal')}
function icon(name,color){if(!SETTINGS.useIcons)return '';const svg=SVG_ICONS[name]||'';if(!svg)return '';if(color)return svg.replace('class="icon"',`class="icon" style="color:${color};"`);return svg}

function avatarHTML(name){
if(!name)name='?';
const first=name.charAt(0);
let hash=0;for(let i=0;i<name.length;i++)hash=(hash*31+name.charCodeAt(i))%360;
return `<div class="avatar-initial" style="background:linear-gradient(135deg,hsl(${hash},60%,45%),hsl(${(hash+40)%360},60%,35%));">${escapeHtml(first)}</div>`;
}
function getRingColorHex(name){if(name.includes('百万年'))return '#fbbf24';if(name.includes('十万年'))return '#ef4444';if(name.includes('万年'))return '#4b5563';if(name.includes('千年'))return '#a855f7';if(name.includes('百年'))return '#facc15';return '#f0f0f0'}
function renderRingsVisual(rings){if(rings.length===0)return '<div style="text-align:center;padding:24px;color:#8b949e;">暂无魂环</div>';const total=Math.min(rings.length,9);const cx=100,cy=100;let svg=`<svg viewBox="0 0 200 200">`;for(let i=0;i<total;i++){const r=92-i*9;const color=getRingColorHex(rings[i].name);const isGold=rings[i].name.includes('百万年');svg+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="5" opacity="0.95"${isGold?' filter="url(#goldGlow)"':''}/>`}svg+=`<defs><filter id="goldGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;svg+=`<circle cx="${cx}" cy="${cy}" r="22" fill="#161b22" stroke="#30363d"/>`;svg+=`<text x="${cx}" y="${cy+5}" text-anchor="middle" fill="#f0f6fc" font-size="14" font-weight="bold">${total}环</text></svg>`;let legend='<div class="rings-legend">';rings.forEach((r,i)=>{const color=getRingColorHex(r.name);legend+=`<span class="rings-legend-item" style="color:${color};">第${i+1}环 · ${escapeHtml(r.name)}${r.count>1?'×'+r.count:''}</span>`});legend+='</div>';return `<div class="rings-visual-container">${svg}${legend}</div>`}
function detectScene(text){if(!SETTINGS.useSceneBg)return null;if(/星斗大森林|森林|树林|密林|林中/.test(text))return 'forest';if(/史莱克|学院|教室|课堂|训练场/.test(text))return 'academy';if(/皇宫|帝国|王城|宫廷|御书房/.test(text))return 'palace';if(/夜晚|月色|深夜|星空|月光/.test(text))return 'night';if(/战斗|厮杀|危险|袭击|混战/.test(text))return 'battle';if(/洞穴|地下|遗迹|古墓|深处/.test(text))return 'cave';if(/海洋|湖边|水边|河流|湖畔|海面/.test(text))return 'water';if(/城|镇|街|铺|市集|街道/.test(text))return 'city';return null}
function applyScene(text){const cb=document.getElementById('chat-box');cb.className=cb.className.split(' ').filter(c=>!c.startsWith('scene-')).join(' ');if(!SETTINGS.useSceneBg)return;const scene=detectScene(text);if(scene)cb.classList.add('scene-'+scene)}

// ============================================================
//  游戏核心
// ============================================================
const FIXED_WORLD=`斗罗大陆 · 绝世唐门时代（一万年后）。
魂导器文明高度发达，城市有魂导灯、柏油路、魂导列车、魂导飞艇；乡村相对原始。
三大势力：日月帝国（魂导器最强）、天斗帝国、星罗帝国。史莱克学院为大陆第一学院。唐门衰落。
魂师体系：魂士→魂师→大魂师→魂尊→魂宗→魂王→魂帝→魂圣→魂斗罗→封号斗罗。
货币：金/银/铜魂币（1金=10银=100铜）。
具体设定见资料库，优先参考资料库。`;

const CORE={name:'',gender:'女',age:0,roleDesc:'',martialSoul:'未觉醒',martialSoulDesc:'',innatePower:5,soulPower:1,rings:[],skills:[],inventory:[],traits:[],npcs:[],flags:{},summary:'',time:'觉醒武魂当天'};
const PLOT={history:[],turn:0,isFirst:true,summaryCounter:0};
let isGenerating=false;

function getStage(power){if(power<=10)return"魂士";if(power<=20)return"魂师";if(power<=30)return"大魂师";if(power<=40)return"魂尊";if(power<=50)return"魂宗";if(power<=60)return"魂王";if(power<=70)return"魂帝";if(power<=80)return"魂圣";if(power<=90)return"魂斗罗";return"封号斗罗"}
function getSpeedFactor(){return 1+(CORE.innatePower-1)*0.15}
function getRingColorClass(ringName){if(ringName.includes('百万年'))return'ring-gold';if(ringName.includes('十万年'))return'ring-red';if(ringName.includes('万年'))return'ring-black';if(ringName.includes('千年'))return'ring-purple';if(ringName.includes('百年'))return'ring-yellow';return'ring-white'}

const chatBox=document.getElementById('chat-box');
const optionsArea=document.getElementById('options-area');
const userInput=document.getElementById('userInput');
const configPanel=document.getElementById('config-panel');
const gameArea=document.getElementById('game-area');
const sendBtn=document.getElementById('sendBtn');

document.querySelectorAll('input[name="soulChoice"]').forEach(radio=>{radio.addEventListener('change',function(){document.getElementById('customSoulDiv').classList.toggle('hidden',this.value!=='custom')})});

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
delete CORE.hp;delete CORE.maxHp;
Object.assign(PLOT,data.plot);return true}}catch(e){console.error('读档失败',e)}
return false;
}
function resetSave(){if(confirm("清空所有本地存档？")){localStorage.removeItem('douro2Save');document.getElementById('config-inputs').classList.remove('hidden');location.reload()}}
function goHome(){if(isGenerating){alert("正在生成，请等待完成");return}if(confirm("返回主界面？")){saveToPhone();gameArea.style.display='none';configPanel.style.display='block';initApp()}}
function selectMode(mode){if(mode!=='rpg'){alert('模拟器模式尚未开放，敬请期待');return}document.getElementById('mode-select').classList.add('hidden');document.getElementById('config-panel').classList.remove('hidden');initApp().catch(e=>console.error(e))}

async function initApp(){
isGenerating = false;
loadSettings();
loadDefaultMedia();
let hasSave=loadSave();

// 修复：如果存档是废弃的（没有名字或未觉醒），彻底清理
if(hasSave && (!CORE.name || CORE.martialSoul === '未觉醒')){
    localStorage.removeItem('douro2Save');
    hasSave = false;
    Object.assign(CORE, {name:'',gender:'女',age:0,roleDesc:'',martialSoul:'未觉醒',martialSoulDesc:'',innatePower:5,soulPower:1,rings:[],skills:[],inventory:[],traits:[],npcs:[],flags:{},summary:'',time:'觉醒武魂当天'});
    Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});
}

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

function updateStatus(){
const avatarEl=document.getElementById('s-avatar');
if(avatarEl){
avatarEl.innerHTML=`<div style="width:28px;height:28px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:12px;color:#9ca3af;">${escapeHtml((CORE.name||'?').charAt(0))}</div>`;
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

function openModal(id){document.getElementById(id).classList.add('active')}
function closeModal(id){document.getElementById(id).classList.remove('active')}
function renderExpandableList(container,items,options={}){if(items.length===0){container.innerHTML=options.emptyText||'无';return}let html='';items.forEach((item,idx)=>{const count=item.count?` ×${item.count}`:'';const nameClass=options.nameClassFn?options.nameClassFn(item):'';const typeTag=(options.showType&&item.type)?`<span style="color:#8b949e;font-size:12px;margin-right:8px;">${escapeHtml(item.type)}</span>`:'';const avatar=options.avatarFn?options.avatarFn(item):'';html+=`<div class="expandable-item" onclick="toggleExpand(this)"><div class="expandable-header">${avatar}<span class="name ${nameClass}">${escapeHtml(item.name)}${count}</span><span>${typeTag}<span class="del-item" onclick="event.stopPropagation();${options.removeFn}(${idx})">✕</span></span></div><div class="expandable-detail">${escapeHtml(item.desc||'暂无详细描述')}</div></div>`});container.innerHTML=html}
function toggleExpand(el){el.classList.toggle('open')}
function openBag(){renderExpandableList(document.getElementById('bagContent'),CORE.inventory,{emptyText:'空',removeFn:'removeBagItem'});openModal('bagModal')}
function removeBagItem(idx){CORE.inventory.splice(idx,1);updateStatus();openBag()}
function openRings(){const container=document.getElementById('ringsContent');if(SETTINGS.useRingsVisual&&CORE.rings.length>0){container.innerHTML=renderRingsVisual(CORE.rings)}else{renderExpandableList(container,CORE.rings,{emptyText:'无魂环',nameClassFn:(r)=>getRingColorClass(r.name),removeFn:'removeRingItem'})}openModal('ringsModal')}
function removeRingItem(idx){CORE.rings.splice(idx,1);updateStatus();openRings()}
function openSkills(){renderExpandableList(document.getElementById('skillsContent'),CORE.skills,{emptyText:'无魂技',removeFn:'removeSkillItem'});openModal('skillsModal')}
function removeSkillItem(idx){CORE.skills.splice(idx,1);updateStatus();openSkills()}
function openTraits(){renderExpandableList(document.getElementById('traitsContent'),CORE.traits,{emptyText:'无特质',showType:true,removeFn:'removeTraitItem'});openModal('traitsModal')}
function removeTraitItem(idx){CORE.traits.splice(idx,1);updateStatus();openTraits()}
function openNPCs(){renderExpandableList(document.getElementById('npcsContent'),CORE.npcs,{emptyText:'暂无重要人物',avatarFn:(n)=>avatarHTML(n.name),removeFn:'removeNPCItem'});openModal('npcsModal')}
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
function appendOptions(aiOptions){
optionsArea.innerHTML='';
const container=document.createElement('div');
container.className='options-container';
if(aiOptions&&aiOptions.length>0){
aiOptions.forEach(text=>{
const btn=document.createElement('button');
btn.className='option-btn';
btn.textContent=text;
btn.onclick=()=>{if(isGenerating)return;sendAction(text)};
container.appendChild(btn);
});
}else{
const btn=document.createElement('button');
btn.className='option-btn';
btn.textContent='继续剧情';
btn.onclick=()=>{if(isGenerating)return;sendAction('继续')};
container.appendChild(btn);
}
optionsArea.appendChild(container);
optionsArea.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ============================================================
//  API 调用
// ============================================================
async function callDeepSeekStream(messages,onChunk){
const apiKey=document.getElementById('apiKey').value.trim();
if(!apiKey)throw new Error("请填入 DeepSeek API Key");

// 加超时保护：60秒无响应自动中断，防止永久卡死
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000);

let resp;
try {
  resp = await fetch("https://api.deepseek.com/v1/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body:JSON.stringify({model:"deepseek-chat",messages,temperature:0.85,stream:true,stream_options:{include_usage:true}}),
    signal: controller.signal
  });
} catch(err) {
  clearTimeout(timeoutId);
  if(err.name === 'AbortError') throw new Error('请求超时（60秒），请检查网络或 API Key');
  throw err;
}

if(!resp.ok){clearTimeout(timeoutId);const errText=await resp.text();throw new Error(`HTTP ${resp.status}: ${errText.substring(0,200)}`)}

const reader=resp.body.getReader();
const decoder=new TextDecoder();
let fullContent="";let buffer="";
try {
  while(true){
    const{done,value}=await reader.read();
    if(done)break;
    buffer+=decoder.decode(value,{stream:true});
    const lines=buffer.split('\n');
    buffer=lines.pop();
    for(const line of lines){
      const trimmed=line.trim();
      if(!trimmed||!trimmed.startsWith('data:'))continue;
      const data=trimmed.slice(5).trim();
      if(data==='[DONE]')continue;
      try{
        const json=JSON.parse(data);
        if(json.usage){
          TOKEN_STATS.input+=json.usage.prompt_tokens||0;
          TOKEN_STATS.output+=json.usage.completion_tokens||0;
          TOKEN_STATS.session+=json.usage.total_tokens||0;
          updateTokenDisplay();
        }
        const delta=json.choices?.[0]?.delta?.content||"";
        if(delta){fullContent+=delta;onChunk(delta,fullContent)}
      }catch(e){}
    }
  }
} finally {
  clearTimeout(timeoutId);
}
return fullContent;
}

const STATUS_LINE_RE=/^(年龄[：:]|魂力\s*[+\-：:]|魂力\s*(提升|增加|提高|升至|达到|变为)|获得物品[：:]|消耗物品[：:]|使用物品[：:]|删除物品[：:]|获得魂技[：:]|删除魂技[：:]|获得魂环[：:]|删除魂环[：:]|获得特质[：:]|删除特质[：:]|人物[：:]|重要人物[：:]|新人物[：:]|删除人物[：:]|时间[：:])/;
function stripStatus(text){let result=text.replace(/【状态更新】[\s\S]*?(?=【选项】|$)/g,'');result=result.replace(/【选项】[\s\S]*/g,'');const lines=result.split('\n');const kept=lines.filter(line=>{const t=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();if(!t)return true;if(STATUS_LINE_RE.test(t))return false;return true});return kept.join('\n').trim()}
function smartSplit(text){const result=[];let current='';let depth=0;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='（'||ch==='(')depth++;else if(ch==='）'||ch===')')depth=Math.max(0,depth-1);if(depth===0&&/[,，、;；]/.test(ch)){if(current.trim())result.push(current.trim());current=''}else current+=ch}if(current.trim())result.push(current.trim());return result}
function parseSeg(seg){let name=seg,count=1,desc='';const descM=seg.match(/^(.+?)[（(](.+?)[）)]\s*$/);if(descM){name=descM[1].trim();desc=descM[2].trim()}const cntM=name.match(/[×xX*](\d+)\s*(个|枚|颗|件|本|张|块|份)?\s*$/);if(cntM){count=parseInt(cntM[1])||1;name=name.replace(/[×xX*]\d+\s*(个|枚|颗|件|本|张|块|份)?\s*$/,'').trim()}const cnM=name.match(/^(.+?)([一二三四五六七八九十百千万]+)(个|枚|颗|件|本|张|块|份)\s*$/);if(cnM){count=chineseToNumber(cnM[2]);name=cnM[1].trim()}return{name,count,desc}}
function chineseToNumber(s){if(!s)return 1;if(/^\d+$/.test(s))return parseInt(s);const digits={'零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};const units={'十':10,'百':100,'千':1000,'万':10000};let result=0,section=0,number=0;for(let ch of s){if(digits[ch]!==undefined)number=digits[ch];else if(units[ch]){if(number===0)number=1;if(ch==='万'){section=(section+number)*units[ch];result+=section;section=0}else section+=number*units[ch];number=0}}return result+section+number}

// ============================================================
//  属性操作
// ============================================================
function addItem(name,count,desc){const existing=CORE.inventory.find(i=>i.name===name);if(existing){existing.count+=count;if(desc&&!existing.desc)existing.desc=desc}else CORE.inventory.push({name,count,desc:desc||''});chatBox.innerHTML+=`<div class="msg-gain">${icon('item','#4ade80')}获得：${escapeHtml(name)}${count>1?` ×${count}`:''}</div>`}
function consumeItem(name,count){let idx=CORE.inventory.findIndex(i=>i.name===name);if(idx===-1){const cleanName=name.replace(/\s+/g,'');idx=CORE.inventory.findIndex(i=>{const itemClean=i.name.replace(/\s+/g,'');return itemClean===cleanName||itemClean.includes(cleanName)||cleanName.includes(itemClean)})}if(idx===-1)return false;if(CORE.inventory[idx].count<count)count=CORE.inventory[idx].count;CORE.inventory[idx].count-=count;const itemName=CORE.inventory[idx].name;if(CORE.inventory[idx].count<=0)CORE.inventory.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">${icon('consume','#f87171')}消耗：${escapeHtml(itemName)} ×${count}</div>`;return true}
function deleteItem(name){const idx=CORE.inventory.findIndex(i=>i.name===name);if(idx!==-1){const n=CORE.inventory[idx].name;CORE.inventory.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除物品：${escapeHtml(n)}</div>`}}
function addRing(name,desc){const existing=CORE.rings.find(r=>r.name===name);if(existing)existing.count=(existing.count||1)+1;else CORE.rings.push({name,count:1,desc:desc||''});chatBox.innerHTML+=`<div class="msg-ring">${icon('ring','#c084fc')}魂环：${escapeHtml(name)}</div>`}
function deleteRing(name){const idx=CORE.rings.findIndex(r=>r.name===name);if(idx!==-1){CORE.rings.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除魂环：${escapeHtml(name)}</div>`}}
function addSkill(name,desc){if(CORE.skills.find(s=>s.name===name))return;CORE.skills.push({name,desc:desc||''});chatBox.innerHTML+=`<div class="msg-skill">${icon('skill','#60a5fa')}魂技：${escapeHtml(name)}</div>`}
function deleteSkill(name){const idx=CORE.skills.findIndex(s=>s.name===name);if(idx!==-1){CORE.skills.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除魂技：${escapeHtml(name)}</div>`}}
function addTrait(name,type,desc){if(CORE.traits.find(t=>t.name===name))return;CORE.traits.push({name,type,desc:desc||''});chatBox.innerHTML+=`<div class="msg-trait">${icon('trait','#fbbf24')}特质：${escapeHtml(name)}（${escapeHtml(type)}）</div>`}
function deleteTrait(name){const idx=CORE.traits.findIndex(t=>t.name===name);if(idx!==-1){CORE.traits.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除特质：${escapeHtml(name)}</div>`}}
function addNPC(name,gender,soul,relation,desc){const existing=CORE.npcs.find(n=>n.name===name);if(existing){existing.gender=gender||existing.gender;existing.soul=soul||existing.soul;existing.relation=relation||existing.relation;if(desc)existing.desc=desc;chatBox.innerHTML+=`<div class="msg-npc">${icon('npc','#38bdf8')}人物更新：${escapeHtml(name)}</div>`}else{CORE.npcs.push({name,gender:gender||'未知',soul:soul||'未知',relation:relation||'中立',desc:desc||''});if(CORE.npcs.length>30)CORE.npcs.shift();chatBox.innerHTML+=`<div class="msg-npc">${icon('npc','#38bdf8')}新人物：${escapeHtml(name)}（${escapeHtml(gender||'?')}·${escapeHtml(soul||'?')}）</div>`}}
function deleteNPC(name){const idx=CORE.npcs.findIndex(n=>n.name===name);if(idx!==-1){CORE.npcs.splice(idx,1);chatBox.innerHTML+=`<div class="msg-lose">已移除人物：${escapeHtml(name)}</div>`}}

// ============================================================
//  状态解析
// ============================================================
function parseStatusUpdate(text){
const update={age:null,soulPowerBase:0,soulPowerAbsolute:null,items:[],consumed:[],delItems:[],skills:[],delSkills:[],rings:[],delRings:[],traits:[],delTraits:[],npcs:[],delNpcs:[],time:null};
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
const km=line.match(/^(获得物品|消耗物品|使用物品|删除物品|获得魂技|删除魂技|获得魂环|删除魂环|获得特质|删除特质|人物|重要人物|新人物|删除人物|时间)[：:]\s*(.+)$/);
if(!km)continue;
const kw=km[1];const content=km[2].trim();
if(kw==='获得物品')smartSplit(content).forEach(seg=>update.items.push(parseSeg(seg)));
else if(kw==='消耗物品'||kw==='使用物品')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);update.consumed.push({name:p.name,count:p.count})});
else if(kw==='删除物品')smartSplit(content).forEach(seg=>update.delItems.push(seg.split(/[（(]/)[0].trim()));
else if(kw==='获得魂技')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);update.skills.push({name:p.name,desc:p.desc})});
else if(kw==='删除魂技')smartSplit(content).forEach(seg=>update.delSkills.push(seg.trim()));
else if(kw==='获得魂环')smartSplit(content).forEach(seg=>{const p=parseSeg(seg);update.rings.push({name:p.name,desc:p.desc})});
else if(kw==='删除魂环')smartSplit(content).forEach(seg=>update.delRings.push(seg.trim()));
else if(kw==='获得特质')smartSplit(content).forEach(seg=>{let name=seg,type='后天',desc='';const typeM=seg.match(/^(.+?)[（(](先天|后天)[）)]/);if(typeM){name=typeM[1].trim();type=typeM[2]}const restM=name.match(/^(.+?)[（(](.+?)[）)]/);if(restM){name=restM[1].trim();desc=restM[2].trim()}if(name)update.traits.push({name,type,desc})});
else if(kw==='删除特质')smartSplit(content).forEach(seg=>update.delTraits.push(seg.split(/[（(]/)[0].trim()));
else if(kw==='人物'||kw==='重要人物'||kw==='新人物'){smartSplit(content).forEach(seg=>{const parts=seg.split('/').map(s=>s.trim());if(parts.length>=2&&parts[0]&&parts[0].length<=15)update.npcs.push({name:parts[0],gender:parts[1]||'未知',soul:parts[2]||'未知',relation:parts[3]||'中立',desc:parts[4]||''})})}
else if(kw==='删除人物')smartSplit(content).forEach(seg=>update.delNpcs.push(seg.trim()));
else if(kw==='时间')update.time=content;
}
return update;
}

function applyUpdate(update){
if(update.age!==null&&update.age>0)CORE.age=update.age;
if(update.soulPowerAbsolute!==null&&update.soulPowerAbsolute>0)CORE.soulPower=Math.min(Math.max(update.soulPowerAbsolute,1),100);
else if(update.soulPowerBase!==0){let base=update.soulPowerBase;if(base>20)base=20;if(base<-20)base=-20;let factor=(base>0)?getSpeedFactor():1;CORE.soulPower=Math.min(Math.max(CORE.soulPower+Math.round(base*factor),1),100)}
update.items.forEach(i=>addItem(i.name,i.count,i.desc));
update.consumed.forEach(c=>consumeItem(c.name,c.count));
update.delItems.forEach(n=>deleteItem(n));
update.skills.forEach(s=>addSkill(s.name,s.desc));
update.delSkills.forEach(n=>deleteSkill(n));
update.rings.forEach(r=>addRing(r.name,r.desc));
update.delRings.forEach(n=>deleteRing(n));
update.traits.forEach(t=>addTrait(t.name,t.type,t.desc));
update.delTraits.forEach(n=>deleteTrait(n));
update.npcs.forEach(n=>addNPC(n.name,n.gender,n.soul,n.relation,n.desc));
update.delNpcs.forEach(n=>deleteNPC(n));
if(update.time){CORE.time=update.time;chatBox.innerHTML+=`<div class="msg-time">${icon('time','#94a3b8')}${escapeHtml(update.time)}</div>`}
updateStatus();
}

function buildCoreSummary(){
let s='';
s+=`主角：${CORE.name}（${CORE.gender}），${CORE.age||'?'}岁。\n`;
s+=`设定：${CORE.roleDesc}\n`;
s+=`武魂：${CORE.martialSoul}（先天魂力${CORE.innatePower}级，速度系数×${getSpeedFactor().toFixed(2)}）\n`;
if(CORE.martialSoulDesc) s+=`武魂描述：${CORE.martialSoulDesc}\n`;
s+=`魂力：${CORE.soulPower}级（${getStage(CORE.soulPower)}）\n`;
s+=`时间：${CORE.time}\n`;
s+=`魂环：${CORE.rings.map(r=>r.name).join('、')||'无'}\n`;
s+=`魂技：${CORE.skills.map(x=>x.name).join('、')||'无'}\n`;
s+=`特质：${CORE.traits.map(t=>t.name).join('、')||'无'}\n`;
s+=`背包：${CORE.inventory.map(i=>i.name+'×'+i.count).join('、')||'空'}\n`;
if(CORE.npcs.length>0)s+=`人物：${CORE.npcs.map(n=>`${n.name}(${n.relation})`).join('；')}\n`;
if(CORE.summary)s+=`前情：${CORE.summary}\n`;
if(Object.keys(MEDIA.worldbook).length>0){
const recentText=(CORE.summary||'')+(PLOT.history.slice(-3).map(m=>m.content).join(''));
const related=[];
for(const kw in MEDIA.worldbook){
if(recentText.includes(kw))related.push(`【${kw}】${MEDIA.worldbook[kw]}`);
if(related.length>=3)break;
}
if(related.length>0)s+=`【资料库】\n${related.join('\n')}\n`;
}
return s;
}

async function streamAndProcess(messages){
const aiMsgDiv=document.createElement('div');
aiMsgDiv.className='msg-ai streaming';
aiMsgDiv.textContent='...';
chatBox.appendChild(aiMsgDiv);
chatBox.scrollTop=chatBox.scrollHeight;
let displayContent="";let lastScroll=0;
try{
const fullReply=await callDeepSeekStream(messages,(delta,full)=>{
displayContent=stripStatus(full);
aiMsgDiv.textContent=displayContent||'...';
const now=Date.now();
if(now-lastScroll>80){chatBox.scrollTop=chatBox.scrollHeight;lastScroll=now}
});
aiMsgDiv.classList.remove('streaming');
aiMsgDiv.textContent=displayContent||'...';
chatBox.scrollTop=chatBox.scrollHeight;
applyScene(displayContent);
return fullReply;
}catch(e){
aiMsgDiv.classList.remove('streaming');
aiMsgDiv.textContent='生成失败：'+e.message;
throw e;
}
}

function handleDebugCommand(rawText){
let text=rawText.trim();
if(!text){chatBox.innerHTML+=`<div class="msg-debug">用法：/调试 获得金币50</div>`;return}
text=normalizeDebugText(text);
const pseudo=`【状态更新】\n${text}\n`;
const update=parseStatusUpdate(pseudo);
const hasAny=update.items.length>0||update.consumed.length>0||update.delItems.length>0||update.skills.length>0||update.delSkills.length>0||update.rings.length>0||update.delRings.length>0||update.traits.length>0||update.delTraits.length>0||update.npcs.length>0||update.delNpcs.length>0||update.time!==null||update.soulPowerAbsolute!==null||update.soulPowerBase!==0||update.age!==null;
if(!hasAny){chatBox.innerHTML+=`<div class="msg-debug">无法识别，请用：/调试 获得物品：金币×50</div>`;return}
applyUpdate(update);
chatBox.innerHTML+=`<div class="msg-debug">调试已应用</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
}

function normalizeDebugText(text){
if(/^(获得物品|消耗物品|使用物品|删除物品|获得魂技|删除魂技|获得魂环|删除魂环|获得特质|删除特质|人物|重要人物|新人物|删除人物|时间|魂力|年龄)[：:]/.test(text))return text;
let m;
if((m=text.match(/^年龄\s*(\d+)\s*$/)))return `年龄：${m[1]}`;
if((m=text.match(/^魂力\s*([+-]?\d+)\s*$/)))return `魂力 ${m[1]}`;
if((m=text.match(/^魂力\s*(?:提升至|提升到|达到|变为)\s*(\d+)\s*$/)))return `魂力 提升至${m[1]}`;
if((m=text.match(/^(?:认识|遇见|遇到|结识|加入|新增)\s*(?:人物|npc|NPC)?\s*(.+?)\s*$/))){const n=m[1].trim();if(n)return `人物：${n}/未知/未知/相识`}
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

async function sendAction(forcedAction){
if(isGenerating)return;
const input=document.getElementById('userInput');
let action=forcedAction||input.value.trim();
if(!action)return;
if(!forcedAction)input.value='';
if(action.startsWith('/调试')){chatBox.innerHTML+=`<div class="msg-user debug">${escapeHtml(action)}</div>`;chatBox.scrollTop=chatBox.scrollHeight;handleDebugCommand(action.replace(/^\/调试\s*/,''));userInput.focus();return}
chatBox.innerHTML+=`<div class="msg-user">${escapeHtml(action)}</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
if(PLOT.isFirst){await awakenSoul();return}
isGenerating=true;sendBtn.disabled=true;userInput.disabled=true;
try{
const coreSummary=buildCoreSummary();
const isContinue=action==='继续';
const systemPrompt=`你是一部斗罗大陆2（绝世唐门时代）背景的小说叙事者，玩家就是主角"你"。用第二人称"你"叙述。

【主角档案】
${coreSummary}

【世界观】
${FIXED_WORLD}

【性别设定 - 极重要】
主角性别为：${CORE.gender}。
请根据主角的性别调整称呼、外貌描写、心理活动和社交互动。例如：
- 女性角色要注意少女的细腻情感、时代背景下的社交规范，以及女性魂师在战斗中的独特风格。
- 男性角色则要体现少年的阳刚之气、担当与热血。
- 避免出现与主角性别不符的描写。

【时代词汇规范 - 极重要】
这是魂导器文明时代，不是古代！避免使用以下古代词汇：
❌ 官道、驿站、客栈、铜板、银两、镖局、江湖、衙门
✅ 用：公路/大道、补给站/旅馆、魂导酒店、魂币（金/银/铜）、佣兵行会、城卫队、市政厅

❌ "天色已晚，前不着村后不着店"这类古典桥段
✅ "路灯亮起来"、"魂导路灯的暖光洒在沥青路面"

❌ 走路全靠徒步、骑马路
✅ 短途可以走路，城际应提到"魂导列车"、"魂导飞艇"

【日常道具参考】
- 照明：魂导灯、萤石灯
- 交通：魂导车、魂导列车、魂导飞艇、马车（乡下）
- 通讯：魂导通讯器、信件、口信
- 货币：金魂币、银魂币、铜魂币
- 武器：魂导枪械（日月帝国）、冷兵器（魂师仍以武魂为主）

【叙事要求】
- 日常200-300字，关键剧情400-600字
- 生动描写场景、对话、感官
- 用"你"指代玩家，禁止用"他/她/角色名"指代玩家
- ${isContinue?'玩家选择"继续"，请根据当前情境自然推进剧情，可以让NPC主动说话、事件自然发生，不要替玩家做重大决定。':'根据玩家输入推进剧情。'}

【状态更新 - 极重要】
在叙事末尾必须写一段"【状态更新】"块，格式（每行一个关键词开头）：
年龄：13
魂力 +5        或  魂力 提升至13
时间：xxx
获得物品：物品名×数量（描述）
消耗物品：物品名×数量
删除物品：物品名
获得魂技：名称（描述）
删除魂技：名称
获得魂环：百年
删除魂环：xxx
获得特质：名称(先天)（描述）
删除特质：名称
人物：姓名/性别/武魂/关系/描述
删除人物：姓名

⚠️ 只有写进【状态更新】的属性才会更新，叙事里提到"魂力提升"不算数。
⚠️ 无变化就写"时间：xxx"。
⚠️ 参考：主角是${CORE.age||'未知'}岁，当前魂力${CORE.soulPower}级。若剧情没有明确修炼/战斗/时间跨越，不要随意提升魂力。
⚠️ 每次叙事必须体现"时间"的推进。

【选项 - 必须】
在【状态更新】块之后，必须用【选项】引出2-3个玩家可选的行动，每项用"•"开头。
这些选项要贴合当前剧情，能推进故事，让玩家有真实选择感。`;
const messages=[{role:"system",content:systemPrompt}];
const recent=PLOT.history.slice(-4);
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
if(PLOT.summaryCounter>=4)generateSummary();
}catch(e){
console.error(e);
chatBox.innerHTML+=`<div class="msg-lose">生成失败：${escapeHtml(e.message)}</div>`;
chatBox.scrollTop=chatBox.scrollHeight;
}
finally{isGenerating=false;sendBtn.disabled=false;userInput.disabled=false;userInput.focus()}
}

async function generateSummary(force=false){
if(!force&&PLOT.summaryCounter<4)return;
if(PLOT.history.length<4)return;
const recent=PLOT.history.slice(-8);
const historyText=recent.map(m=>`${m.role==='user'?'玩家':'叙事者'}：${stripStatus(m.content)}`).join('\n');
const oldSummary=CORE.summary||'';
const oldLen=oldSummary.length;
const START=200,STEP=20,MAX=800;
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
}
}catch(e){PLOT.summaryCounter=0}
}

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

// 用聊天框替代 alert，防止手机 PWA 卡死
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
4. 末尾必须写【状态更新】块，含：年龄：6，时间：觉醒武魂当天·上午，获得特质：xxx(先天)，人物：觉醒师/男/xxx/觉醒引导者/描述

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

function startNewGame(){
isGenerating = false;
const key=document.getElementById('apiKey').value.trim();
if(!key){alert("请填入 DeepSeek API Key");return}

// 检查角色名，避免卡死
const roleName = document.getElementById('roleName').value.trim();
if(!roleName){
    chatBox.innerHTML+=`<div class="msg-lose">请先在配置面板填写角色名，再开始游戏。</div>`;
    chatBox.scrollTop=chatBox.scrollHeight;
    return;
}

// 只有存在有效存档时才弹窗
const hasValidSave = localStorage.getItem('douro2Save') && CORE.name && CORE.martialSoul !== '未觉醒';
if(hasValidSave && !confirm("已有存档，开始新游戏会覆盖。确定？")) return;

// 彻底清理残留数据，确保觉醒流程正常触发
localStorage.removeItem('douro2Save');
Object.assign(CORE, {name:'',gender:'女',age:0,roleDesc:'',martialSoul:'未觉醒',martialSoulDesc:'',innatePower:5,soulPower:1,rings:[],skills:[],inventory:[],traits:[],npcs:[],flags:{},summary:'',time:'觉醒武魂当天'});
Object.assign(PLOT, {history:[],turn:0,isFirst:true,summaryCounter:0});

document.getElementById('config-inputs').classList.remove('hidden');
configPanel.style.display='none';
gameArea.style.display='flex';
chatBox.innerHTML=`<div class="msg-sys">欢迎，${escapeHtml(document.getElementById('roleName').value||'旅者')}。准备觉醒武魂...</div>`;
setTimeout(()=>sendAction("觉醒武魂"),400);
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
if(item.role==='user')chatBox.innerHTML+=`<div class="msg-user">${escapeHtml(item.content)}</div>`;
else if(item.role==='assistant')chatBox.innerHTML+=`<div class="msg-ai">${escapeHtml(stripStatus(item.content))}</div>`;
});
if(CORE.summary)chatBox.innerHTML+=`<div class="msg-summary">${escapeHtml(CORE.summary)}</div>`;
updateStatus();
appendOptions(["继续剧情"]);
userInput.focus();
}