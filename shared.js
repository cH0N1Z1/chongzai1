// ============================================================
//  shared.js - 公共工具、图标、设置、API 调用、通用 UI
//  由 RPG 模式和模拟器模式共同使用
// ============================================================

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
function isPlaceholder(s){
  if(!s) return true;
  const t = String(s).trim().replace(/[（(].*?[）)]/g,'').trim();
  return /^(无|暂无|没有|空|未|未知|无变化|没有变化|—|-)$/.test(t);
}
function chineseToNumber(s){
  if(!s)return 1;
  if(/^\d+$/.test(s))return parseInt(s);
  const digits={'零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
  const units={'十':10,'百':100,'千':1000,'万':10000};
  let result=0,section=0,number=0;
  for(let ch of s){
    if(digits[ch]!==undefined)number=digits[ch];
    else if(units[ch]){
      if(number===0)number=1;
      if(ch==='万'){section=(section+number)*units[ch];result+=section;section=0}
      else section+=number*units[ch];
      number=0;
    }
  }
  return result+section+number;
}
function formatNarrative(escapedText){
  return escapedText
    .replace(/\*([^*\n]+)\*/g, '<span class="hl-action">$1</span>')
    .replace(/（([^（）\n]+)）/g, '<span class="hl-inner">（$1）</span>')
    .replace(/“([^”\n]+)”/g, '<span class="hl-speak">“$1”</span>')
    .replace(/「([^「」\n]+)」/g, '<span class="hl-speak">「$1」</span>');
}
function smartSplit(text){
  const result=[];let current='';let depth=0;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='（'||ch==='(')depth++;
    else if(ch==='）'||ch===')')depth=Math.max(0,depth-1);
    if(depth===0&&/[,，、;；]/.test(ch)){
      if(current.trim())result.push(current.trim());
      current='';
    }else current+=ch;
  }
  if(current.trim())result.push(current.trim());
  return result;
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
function icon(name,color){
  if(!SETTINGS.useIcons)return '';
  const svg=SVG_ICONS[name]||'';
  if(!svg)return '';
  if(color)return svg.replace('class="icon"',`class="icon" style="color:${color};"`);
  return svg;
}

// ============================================================
//  素材库 + 动态世界书
// ============================================================
const MEDIA={worldbook:{}};
function loadDefaultMedia(){
fetch('./media.json').then(r=>r.json()).then(def=>{
if(def.worldbook){for(const k in def.worldbook){if(!MEDIA.worldbook[k])MEDIA.worldbook[k]=def.worldbook[k]}}
}).catch(e=>console.warn('默认素材加载失败',e));
}

function normalizeWorldbookEntry(key, value){
  if(typeof value === 'string'){
    return { key: key, content: value, keywords: [key], priority: 5, type: 'selective' };
  }
  return {
    key: key,
    content: value.content || '',
    keywords: Array.isArray(value.keywords) ? value.keywords : [key],
    priority: typeof value.priority === 'number' ? value.priority : 5,
    type: value.type === 'constant' ? 'constant' : 'selective'
  };
}

function triggerLorebook(playerInput, recentHistory, maxEntries){
  maxEntries = maxEntries || 5;
  const inputText = String(playerInput || '') + '\n' + String(recentHistory || '');
  if(!inputText.trim()) return '';
  const hits = [];
  for(const key in MEDIA.worldbook){
    const entry = normalizeWorldbookEntry(key, MEDIA.worldbook[key]);
    if(!entry.content) continue;
    if(entry.type === 'constant'){
      hits.push({ entry, score: 999 + entry.priority });
      continue;
    }
    let matched = 0;
    for(const kw of entry.keywords){
      if(kw && inputText.includes(kw)) matched++;
    }
    if(matched > 0){
      hits.push({ entry, score: matched * 10 + entry.priority });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  const selected = hits.slice(0, maxEntries);
  if(selected.length === 0) return '';
  let s = '【资料库 · 命中】\n';
  for(const h of selected){
    s += `【${h.entry.key}】${h.entry.content}\n`;
  }
  return s;
}

// ============================================================
//  设置
// ============================================================
const SETTINGS={useIcons:true,useRingsVisual:true,useSceneBg:true,useTokenStats:false,chatTheme:'default',minimalMode:false,soundOn:true,soundVolume:0.2,narrativeStyle:'standard',npcProactive:true,fontScale:1};
const TOKEN_STATS={input:0,output:0,session:0};
function loadLifetimeTokens(){
  try{
    const raw=localStorage.getItem('douro2TokenLifetime');
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {input:0,output:0,session:0};
}
function saveLifetimeTokens(obj){
  try{localStorage.setItem('douro2TokenLifetime',JSON.stringify(obj));}catch(e){}
}
const LIFETIME=loadLifetimeTokens();

function saveSettings(){try{localStorage.setItem('douro2Settings',JSON.stringify(SETTINGS))}catch(e){}}
function loadSettings(){
try{const raw=localStorage.getItem('douro2Settings');if(raw)Object.assign(SETTINGS,JSON.parse(raw))}catch(e){}
const elIcons=document.getElementById('setIcons');
const elRings=document.getElementById('setRingsVisual');
const elScene=document.getElementById('setSceneBg');
const elToken=document.getElementById('setTokenStats');
const themeSelect=document.getElementById('setChatTheme');
const minSwitch=document.getElementById('setMinimal');
const sndSwitch=document.getElementById('setSound');
const sndVol=document.getElementById('setSoundVolume');
const styleSel=document.getElementById('setNarrativeStyle');
const npcSwitch=document.getElementById('setNpcProactive');
const fontRange=document.getElementById('setFontScale');
if(elIcons)elIcons.checked=SETTINGS.useIcons;
if(elRings)elRings.checked=SETTINGS.useRingsVisual;
if(elScene)elScene.checked=SETTINGS.useSceneBg;
if(elToken)elToken.checked=SETTINGS.useTokenStats;
if(themeSelect)themeSelect.value=SETTINGS.chatTheme||'default';
if(minSwitch)minSwitch.checked=!!SETTINGS.minimalMode;
if(sndSwitch)sndSwitch.checked=SETTINGS.soundOn!==false;
if(sndVol)sndVol.value=Math.round((SETTINGS.soundVolume||0.2)*100);
if(styleSel)styleSel.value=SETTINGS.narrativeStyle||'standard';
if(npcSwitch)npcSwitch.checked=SETTINGS.npcProactive!==false;
if(fontRange)fontRange.value=Math.round((SETTINGS.fontScale||1)*100);
if(typeof soundSetEnabled==='function') soundSetEnabled(SETTINGS.soundOn!==false);
if(typeof soundSetVolume==='function') soundSetVolume(SETTINGS.soundVolume||0.2);
applyFontScale();
document.body.classList.toggle('minimal-mode',!!SETTINGS.minimalMode);
applyThemeClass();
updateTokenDisplay();
}

function toggleNarrativeStyle(v){
  SETTINGS.narrativeStyle = (v==='concise'||v==='ornate') ? v : 'standard';
  saveSettings();
}
function toggleNpcProactive(on){
  SETTINGS.npcProactive = !!on;
  saveSettings();
}
function toggleFontScale(v){
  SETTINGS.fontScale = Math.max(0.8, Math.min(1.5, parseInt(v||'100')/100));
  applyFontScale();
  saveSettings();
}
function applyFontScale(){
  document.documentElement.style.setProperty('--font-scale', SETTINGS.fontScale||1);
}

function toggleSound(on){
  SETTINGS.soundOn = on;
  if(typeof soundEnsure==='function') soundEnsure();
  if(typeof soundSetEnabled==='function') soundSetEnabled(on);
  saveSettings();
}
function toggleSoundVolume(v){
  SETTINGS.soundVolume = Math.max(0, Math.min(1, parseInt(v||'20')/100));
  if(typeof soundSetVolume==='function') soundSetVolume(SETTINGS.soundVolume);
  saveSettings();
}
function toggleSetting(key,value){
SETTINGS[key]=value;saveSettings();
if(typeof updateStatus==='function')updateStatus();
if(key==='useSceneBg'&&!value){
  const cb=document.getElementById('chat-box');
  if(cb)cb.className=cb.className.split(' ').filter(c=>!c.startsWith('scene-')).join(' ');
}
if(key==='chatTheme'){applyThemeClass()}
}
function applyThemeClass(){
document.body.className = document.body.className.split(' ').filter(c => c !== 'theme-cute').join(' ');
if(SETTINGS.chatTheme === 'cute') document.body.classList.add('theme-cute');
}
function toggleMinimalMode(on){
SETTINGS.minimalMode = on;
if(on){SETTINGS.useIcons=false;SETTINGS.useRingsVisual=false;SETTINGS.useSceneBg=false}
else{SETTINGS.useIcons=true;SETTINGS.useRingsVisual=true;SETTINGS.useSceneBg=true}
const elIcons=document.getElementById('setIcons');
const elRings=document.getElementById('setRingsVisual');
const elScene=document.getElementById('setSceneBg');
const elToken=document.getElementById('setTokenStats');
if(elIcons)elIcons.checked=SETTINGS.useIcons;
if(elRings)elRings.checked=SETTINGS.useRingsVisual;
if(elScene)elScene.checked=SETTINGS.useSceneBg;
if(elToken)elToken.checked=SETTINGS.useTokenStats;
document.body.classList.toggle('minimal-mode', on);
updateTokenDisplay();
saveSettings();
if(typeof updateStatus==='function')updateStatus();
if(!SETTINGS.useSceneBg){
  const cb=document.getElementById('chat-box');
  if(cb)cb.className=cb.className.split(' ').filter(c=>!c.startsWith('scene-')).join(' ');
}
}
function updateTokenDisplay(){
const el=document.getElementById('s-token');
const box=document.getElementById('token-stat');
if(!el||!box)return;
if(!SETTINGS.useTokenStats){box.classList.add('hidden');return}
box.classList.remove('hidden');
el.textContent=TOKEN_STATS.session;
}
function openSettings(){loadSettings();openModal('settingsModal')}
function openMore(){openModal('moreModal')}

// ============================================================
//  通用 UI
// ============================================================
function openModal(id){document.getElementById(id).classList.add('active')}
function closeModal(id){document.getElementById(id).classList.remove('active')}
function toggleExpand(el){el.classList.toggle('open')}
function avatarHTML(name){
if(!name)name='?';
const first=name.charAt(0);
let hash=0;for(let i=0;i<name.length;i++)hash=(hash*31+name.charCodeAt(i))%360;
return `<div class="avatar-initial" style="background:linear-gradient(135deg,hsl(${hash},60%,45%),hsl(${(hash+40)%360},60%,35%));">${escapeHtml(first)}</div>`;
}
function renderExpandableList(container,items,options={}){
  if(items.length===0){container.innerHTML=options.emptyText||'无';return}
  let html='';
  items.forEach((item,idx)=>{
    const count=item.count?` ×${item.count}`:'';
    const nameClass=options.nameClassFn?options.nameClassFn(item):'';
    const typeTag=(options.showType&&item.type)?`<span style="color:#8b949e;font-size:12px;margin-right:8px;">${escapeHtml(item.type)}</span>`:'';
    const avatar=options.avatarFn?options.avatarFn(item):'';
    const detail=options.detailFn?options.detailFn(item):escapeHtml(item.desc||'暂无详细描述');
    html+=`<div class="expandable-item" onclick="toggleExpand(this)"><div class="expandable-header">${avatar}<span class="name ${nameClass}">${escapeHtml(item.name)}${count}</span><span>${typeTag}<span class="del-item" onclick="event.stopPropagation();${options.removeFn}(${idx})">✕</span></span></div><div class="expandable-detail">${detail}</div></div>`
  });
  container.innerHTML=html;
}

// ============================================================
//  DeepSeek API 流式调用
// ============================================================
async function callDeepSeekStream(messages,onChunk){
const apiKey=document.getElementById('apiKey').value.trim();
if(!apiKey)throw new Error("请填入 DeepSeek API Key");

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 90000);

let resp;
try {
  resp = await fetch("https://api.deepseek.com/v1/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
    body:JSON.stringify({
      model:"deepseek-chat",
      messages,
      temperature:0.8,
      max_tokens:2000,
      stream:true,
      stream_options:{include_usage:true}
    }),
    signal: controller.signal
  });
} catch(err) {
  clearTimeout(timeoutId);
  if(err.name === 'AbortError') throw new Error('请求超时（90秒），请检查网络或 API Key');
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
          LIFETIME.input+=json.usage.prompt_tokens||0;
          LIFETIME.output+=json.usage.completion_tokens||0;
          LIFETIME.session+=json.usage.total_tokens||0;
          saveLifetimeTokens(LIFETIME);
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