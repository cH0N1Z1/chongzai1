// ============================================================
//  rpg-ui.js - 星辉学院 UI 层
//  依赖：shared.js → rpg-core.js
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
  g('pfAge').value = CORE.age || 15;
  g('pfSoul').value = (CORE.arcane && CORE.arcane !== '未觉醒') ? CORE.arcane : '';
  g('pfSoulDesc').value = CORE.arcaneDesc || '';
  openModal('profileModal');
}
function saveProfileEdit(){
  const g = id => document.getElementById(id);
  const name = g('pfName').value.trim();
  const age = Math.min(Math.max(parseInt(g('pfAge').value) || CORE.age || 15, 15), 18);
  const soul = g('pfSoul').value.trim();
  const soulDesc = g('pfSoulDesc').value.trim();
  if(name) CORE.name = name;
  CORE.age = age;
  if(soul) CORE.arcane = soul;
  CORE.arcaneDesc = soulDesc;
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
//  术式星图
// ============================================================
let _starSelectedIdx = null;

function openArcane(){
  _starSelectedIdx = null;
  renderArcanePanel();
  openModal('arcaneModal');
}

function renderArcanePanel(){
  const container = document.getElementById('arcaneContent');
  if(!container) return;
  const unlocked = (CORE.forms || []).filter(f => f && f.unlocked !== false);
  container.innerHTML = renderStarMap(unlocked, CORE.arcane || '未觉醒');
}

function renderStarMap(forms, arcaneName){
  const cx = 150, cy = 150;
  const orbitR = 100;
  const centerR = 36;
  const nodeR = 14;
  const total = forms.length;

  let html = '<div class="star-map">';

  html += '<svg class="star-map-svg" viewBox="0 0 300 300">';
  html += `<circle cx="${cx}" cy="${cy}" r="${orbitR}" fill="none" stroke="rgba(168,216,238,0.22)" stroke-width="1" stroke-dasharray="2 6"/>`;
  forms.forEach((_, i) => {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * orbitR;
    const y = cy + Math.sin(angle) * orbitR;
    html += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="star-line"/>`;
  });
  html += '</svg>';

  html += `<div class="star-center" style="left:${cx - centerR}px;top:${cy - centerR}px;width:${centerR*2}px;height:${centerR*2}px;">${escapeHtml(arcaneName)}</div>`;

  if(forms.length === 0){
    html += `<div class="star-empty">尚未获得任何术式形态</div>`;
  }
  forms.forEach((f, i) => {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * orbitR;
    const y = cy + Math.sin(angle) * orbitR;
    const color = getFormColorHex(f.type);
    const isSel = _starSelectedIdx === i;
    html += `<div class="star-node${isSel?' selected':''}" style="left:${x - nodeR}px;top:${y - nodeR}px;width:${nodeR*2}px;height:${nodeR*2}px;--node-color:${color};" onclick="handleStarClick(${i})">`;
    if(isSel){
      html += `<div class="star-label">${escapeHtml(f.name)}</div>`;
    }
    html += `</div>`;
  });

  html += '</div>';
  return html;
}

function handleStarClick(idx){
  if(_starSelectedIdx === idx){
    openFormDetail(idx);
  } else {
    _starSelectedIdx = idx;
    renderArcanePanel();
  }
}

function openFormDetail(idx){
  const f = CORE.forms[idx];
  if(!f) return;
  const color = getFormColorHex(f.type);
  const html = `
    <div class="form-detail">
      <div class="form-detail-name" style="color:${color}">${escapeHtml(f.name)}</div>
      <div class="form-detail-type">${escapeHtml(f.type || '觉醒')}</div>
      <div class="form-detail-desc">${escapeHtml(f.desc || '暂无描述')}</div>
    </div>
  `;
  const el = document.getElementById('formDetailContent');
  if(el){
    el.innerHTML = html;
    openModal('formDetailModal');
  }
}

// ============================================================
//  技能查看
// ============================================================
let _SKILL_DATA_CACHE = null;

async function loadSkillData(){
  if(_SKILL_DATA_CACHE) return _SKILL_DATA_CACHE;
  try {
    const r = await fetch('./battle.json');
    _SKILL_DATA_CACHE = await r.json();
  } catch(e){
    _SKILL_DATA_CACHE = { skills:{} };
  }
  return _SKILL_DATA_CACHE;
}

function describeSkill(s){
  if(!s) return '暂无描述';
  const parts = [];

  if(s.power > 0){
    const tgt = s.target === 'all' ? '全体' : '单体';
    parts.push(`${tgt}伤害 ${s.power}`);
  }

  const pct = (s.effectChance != null) ? Math.round(s.effectChance * 100) + '% 概率 ' : '';
  const v = s.effectValue || 0;
  const d = s.effectDuration || 0;

  switch(s.effect){
    case 'dispelFog': parts.push('驱散场地迷雾'); break;
    case 'heal':      parts.push(`回复 ${v} 生命`); break;
    case 'stun':      parts.push(`${pct}降命中 ${v}%（${d}回合）`); break;
    case 'slow':      parts.push(`${pct}降速 ${v}%（${d}回合）`); break;
    case 'atkUp':     parts.push(`加攻 +${v}%（${d}回合）`); break;
    case 'defUp':     parts.push(`加防 +${v}%（${d}回合）`); break;
    case 'speedUp':   parts.push(`加速 +${v}%（${d}回合）`); break;
    case 'critUp':    parts.push(`加暴击 +${v}%（${d}回合）`); break;
  }

  return parts.length ? parts.join(' · ') : '暂无效果';
}

function skillTargetLabel(t){
  if(t === 'all') return '全体';
  if(t === 'self') return '自身';
  return '单体';
}

async function openSkillDetail(skillNames, ownerName){
  const data = await loadSkillData();
  const skills = data.skills || {};
  const container = document.getElementById('skillModalContent');
  if(!container) return;

  if(!skillNames || skillNames.length === 0){
    container.innerHTML = '<div style="text-align:center;color:#8b949e;padding:20px;font-size:13px;">暂无技能</div>';
    openModal('skillModal');
    return;
  }

  let html = '';
  if(ownerName){
    html += `<div style="font-size:12px;color:#8b949e;margin-bottom:10px;">${escapeHtml(ownerName)} 的技能</div>`;
  }

  skillNames.forEach(name => {
    const s = skills[name];
    if(!s){
      html += `<div class="skill-item">
        <div class="skill-item-name">${escapeHtml(name)}</div>
        <div class="skill-item-effect">（数据缺失）</div>
      </div>`;
      return;
    }
    const typeStr = Array.isArray(s.type) ? s.type.join('·') : (s.type || '');
    const cost = (s.cost > 0) ? `消耗 ${s.cost} 星尘` : '消耗 0';
    html += `<div class="skill-item">
      <div class="skill-item-name">${escapeHtml(s.name || name)}</div>
      <div class="skill-item-meta">${escapeHtml(typeStr)} · ${skillTargetLabel(s.target)} · ${cost}</div>
      <div class="skill-item-effect">${escapeHtml(describeSkill(s))}</div>
    </div>`;
  });

  container.innerHTML = html;
  openModal('skillModal');
}

function openSkillDetailFromBtn(btn){
  let skills = [];
  try { skills = JSON.parse(btn.dataset.skills || '[]'); } catch(e){}
  const owner = btn.dataset.owner || '';
  openSkillDetail(skills, owner);
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
//  天气本地随机
// ============================================================
function getSeason(term){
  const t = String(term||'');
  if(/一年级上|二年级上|三年级上/.test(t)){ return '秋'; }
  if(/一年级下|二年级下|三年级下/.test(t)){ return '春'; }
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
//  属性变化（形态获得动画保留）
// ============================================================
function triggerStageUpgrade(bannerText){
  const banner = document.createElement('div');
  banner.className = 'stage-banner';
  banner.textContent = bannerText;
  document.body.appendChild(banner);
  setTimeout(()=>banner.remove(), 2200);
}

function addForm(name, type, desc){
  if(!CORE.forms) CORE.forms=[];
  const exist = CORE.forms.find(f=>f.name === name);
  if(exist){
    if(desc) exist.desc = desc;
    if(type) exist.type = type;
    return;
  }
  CORE.forms.push({name, type: type || '觉醒', desc: desc || ''});
  chatBox.innerHTML += `<div class="msg-ring">获得形态：${escapeHtml(name)}</div>`;
  if(typeof soundRing==='function') soundRing(type);
  if(type === '关键' || type === '稀有' || type === '传说'){
    triggerStageUpgrade(name);
  }
}

function deleteForm(name){ CORE.forms = CORE.forms.filter(f => f.name !== name); }

// 解锁一个术式形态：亮星图 + 进战斗技能
function unlockForm(name){
  if(!name) return false;
  if(!CORE.forms) CORE.forms = [];
  const f = CORE.forms.find(x => x && x.name === name);
  if(!f) return false;
  if(f.unlocked !== false) return false;
  f.unlocked = true;

  if(!CORE.battle) CORE.battle = {};
  if(!Array.isArray(CORE.battle.skills)) CORE.battle.skills = [];
  if(!CORE.battle.skills.includes(name)) CORE.battle.skills.push(name);

  chatBox.innerHTML += `<div class="msg-ring">解锁形态：${escapeHtml(name)}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
  if(typeof soundRing==='function') soundRing('关键');
  if(typeof saveToPhone==='function') saveToPhone();
  return true;
}

function addNPC(name, gender, arcane, relation, grade, dept, desc, affinity){
  if(!CORE.npcs) CORE.npcs=[];
  const exist = CORE.npcs.find(n=>n.name === name);
  if(exist){
    if(gender) exist.gender = gender;
    if(arcane) exist.arcane = arcane;
    if(relation) exist.relation = relation;
    if(grade) exist.grade = grade;
    if(dept) exist.dept = dept;
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
    relation: relation || '中立',
    grade: grade || '一年级上学期', dept: dept || '无',
    desc: desc || '', term: CORE.term, status: 'active',
    affinity: typeof affinity === 'number' ? affinity : 0,
    archTime: '', snapshot: null
  });
  chatBox.innerHTML += `<div class="msg-npc">新人物：${escapeHtml(name)}</div>`;
}

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
      n.snapshot = { arcane: n.arcane, relation: n.relation, grade: n.grade, dept: n.dept, desc: n.desc, affinity: n.affinity };
      count++;
    }
  });
  if(count > 0){
    chatBox.innerHTML += `<div class="msg-sys">学期归档：${escapeHtml(term)}（${count}人）</div>`;
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

// 学期
const termEl = document.getElementById('s-term');
if(termEl){
  let shortTerm = CORE.term || "一年级上学期";
  if(shortTerm.length > 12) shortTerm = shortTerm.slice(0, 12) + '…';
  termEl.innerHTML = icon('stage','#8b949e') + escapeHtml(shortTerm);
}

let shortTime = CORE.time || "未知";
if(shortTime.length > 12) shortTime = shortTime.slice(0, 12) + '…';
document.getElementById('s-time').innerHTML=icon('time','#8b949e')+escapeHtml(shortTime);
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
//  人物面板（列表 + 详情弹窗）
// ============================================================
function normName(s){ return String(s||'').replace(/\s+/g,''); }

function findLibraryNpc(name){
  if(!CHARACTERS || !CHARACTERS.loaded) return null;
  const target = normName(name);
  const all = [
    ...(CHARACTERS.classmates || []),
    ...(CHARACTERS.seniors || []),
    ...(CHARACTERS.juniors || [])
  ];
  return all.find(c => normName(c.name) === target) || null;
}

function getNpcOwnGradeKey(lib){
  if(!lib) return '1';
  const t = String(lib.grade || '');
  const m = t.match(/([一二三])年级/);
  const map = {'一':'1','二':'2','三':'3'};
  return m ? (map[m[1]] || '1') : '1';
}

function pickNpcBattleData(lib){
  if(!lib || !lib.battle) return null;
  const gk = getNpcOwnGradeKey(lib);
  if(lib.battle[gk]) return lib.battle[gk];
  const keys = Object.keys(lib.battle);
  return keys.length ? lib.battle[keys[0]] : null;
}

function affinityColor(v){
  if(v>=81) return '#f472b6';
  if(v>=61) return '#4ade80';
  if(v>=41) return '#60a5fa';
  if(v>=21) return '#fbbf24';
  return '#8b949e';
}

function renderNpcListItem(opts){
  const { key, name, sub, tag, isSelf, archived } = opts;
  const cls = 'npc-list-item' + (isSelf?' self':'') + (archived?' archived':'');
  return `<div class="${cls}" onclick="openNpcDetail('${key}')">
    <div class="npc-list-avatar">${avatarHTML(name)}</div>
    <div class="npc-list-info">
      <div class="npc-list-name">${escapeHtml(name)}</div>
      <div class="npc-list-sub">${escapeHtml(sub||'')}</div>
    </div>
    <div class="npc-list-tag">${escapeHtml(tag||'')}</div>
  </div>`;
}

function openNPCs(){
  const container = document.getElementById('npcsContent');
  if(!container) return;
  let html = '';
  if(CORE.selfProfile){
    html += renderNpcListItem({
      key: 'self',
      name: CORE.name,
      sub: (CORE.arcane && CORE.arcane !== '未觉醒') ? CORE.arcane : '术式未觉醒',
      tag: '主角',
      isSelf: true
    });
  }
  (CORE.npcs||[]).forEach((n, i) => {
    const archived = n.status === 'archived';
    html += renderNpcListItem({
      key: 'npc:' + i,
      name: n.name,
      sub: (n.arcane && n.arcane !== '未知') ? n.arcane : '术式未知',
      tag: archived ? '归档' : (n.relation || '同届生'),
      isSelf: false,
      archived
    });
  });
  if(!html){
    html = '<div style="text-align:center;color:#8b949e;padding:22px;font-size:13px;">暂无重要人物</div>';
  }
  container.innerHTML = html;
  openModal('npcsModal');
}

function openNpcDetail(key){
  const container = document.getElementById('npcDetailContent');
  if(!container) return;
  if(key === 'self'){
    container.innerHTML = renderSelfDetail();
  } else if(key.startsWith('npc:')){
    const i = parseInt(key.slice(4));
    const n = CORE.npcs[i];
    if(!n) return;
    container.innerHTML = renderNpcDetail(n, i);
  }
  openModal('npcDetailModal');
}

function renderSelfDetail(){
  const sp = CORE.selfProfile || {};
  const name = CORE.name || '未命名';
  const gender = sp.gender || CORE.gender || '?';
  const age = sp.age || CORE.age || 15;
  const arcane = CORE.arcane || '未觉醒';
  const arcaneDesc = CORE.arcaneDesc || '';

  const app = (sp.appearance && typeof sp.appearance === 'object') ? sp.appearance : null;
  const appRows = [];
  if(app){
    if(app.hair) appRows.push(`<div class="kv"><span class="k">发</span><span class="v">${escapeHtml(app.hair)}</span></div>`);
    if(app.eyes) appRows.push(`<div class="kv"><span class="k">眼</span><span class="v">${escapeHtml(app.eyes)}</span></div>`);
    if(app.face) appRows.push(`<div class="kv"><span class="k">脸</span><span class="v">${escapeHtml(app.face)}</span></div>`);
    if(app.height) appRows.push(`<div class="kv"><span class="k">身高</span><span class="v">${escapeHtml(String(app.height))}cm</span></div>`);
    if(app.build) appRows.push(`<div class="kv"><span class="k">体型</span><span class="v">${escapeHtml(app.build)}</span></div>`);
    if(app.style) appRows.push(`<div class="kv"><span class="k">穿搭</span><span class="v">${escapeHtml(app.style)}</span></div>`);
  } else if(sp.appearance && typeof sp.appearance === 'string'){
    appRows.push(`<div class="kv"><span class="v">${escapeHtml(sp.appearance)}</span></div>`);
  }

  // 主角技能按钮
  const skillNames = (CORE.battle && Array.isArray(CORE.battle.skills)) ? CORE.battle.skills : [];
  const skillBtn = `<div class="npc-detail-actions" style="margin-top:10px;padding-top:10px;">
    <button class="btn-skill" data-skills='${escapeHtml(JSON.stringify(skillNames))}' data-owner='${escapeHtml(name)}' onclick="openSkillDetailFromBtn(this)">查看技能</button>
  </div>`;

  return buildDetailHTML({
    name, gender, age,
    tags: [
      { text: gender, cls: '' },
      { text: age + '岁', cls: '' },
      { text: CORE.term || '一年级上', cls: '' },
      { text: '106', cls: '' },
      { text: '主角', cls: 'self' }
    ],
    isSelf: true,
    arcane, arcaneDesc,
    affinity: null,
    sections: buildSelfSections(sp, appRows),
    extraHtml: skillBtn
  });
}

function buildSelfSections(sp, appRows){
  const s = [];
  if(appRows.length){
    s.push({
      title: '外貌',
      body: appRows.join('')
    });
  }
  const personality = Array.isArray(sp.personality) ? sp.personality : [];
  const habits = sp.habits || '';
  if(personality.length || habits){
    let body = '';
    if(personality.length){
      body += `<div class="npc-chip-row">${personality.map(p=>`<span class="npc-chip">${escapeHtml(p)}</span>`).join('')}</div>`;
    }
    if(habits) body += `<div style="margin-top:8px;">${escapeHtml(habits)}</div>`;
    s.push({ title: '性格与习惯', body });
  }
  const likes = Array.isArray(sp.likes) ? sp.likes : [];
  const dislikes = Array.isArray(sp.dislikes) ? sp.dislikes : [];
  if(likes.length || dislikes.length){
    let body = '';
    if(likes.length) body += `<div style="margin-bottom:6px;"><span style="color:#8b949e;font-size:12px;margin-right:6px;">喜欢</span><div class="npc-chip-row" style="display:inline-flex;">${likes.map(x=>`<span class="npc-chip like">${escapeHtml(x)}</span>`).join('')}</div></div>`;
    if(dislikes.length) body += `<div><span style="color:#8b949e;font-size:12px;margin-right:6px;">不喜欢</span><div class="npc-chip-row" style="display:inline-flex;">${dislikes.map(x=>`<span class="npc-chip dislike">${escapeHtml(x)}</span>`).join('')}</div></div>`;
    s.push({ title: '喜好', body });
  }
  const kvRows = [];
  if(sp.attitude) kvRows.push(`<div class="kv"><span class="k">态度</span><span class="v">${escapeHtml(sp.attitude)}</span></div>`);
  if(sp.speech) kvRows.push(`<div class="kv"><span class="k">说话</span><span class="v">${escapeHtml(sp.speech)}</span></div>`);
  if(sp.origin) kvRows.push(`<div class="kv"><span class="k">出身</span><span class="v">${escapeHtml(sp.origin)}</span></div>`);
  if(sp.hiddenTalent) kvRows.push(`<div class="kv"><span class="k">特长</span><span class="v">${escapeHtml(sp.hiddenTalent)}</span></div>`);
  if(sp.aloneBehavior) kvRows.push(`<div class="kv"><span class="k">独处</span><span class="v">${escapeHtml(sp.aloneBehavior)}</span></div>`);
  if(kvRows.length){
    s.push({ title: '其他', body: kvRows.join('') });
  }
  if(sp._raw && !appRows.length && !personality.length){
    s.push({ title: '原始设定', body: escapeHtml(sp._raw) });
  }
  return s;
}

function renderNpcDetail(n, idx){
  const lib = findLibraryNpc(n.name);
  const gender = n.gender || (lib && lib.gender) || '?';
  const age = (lib && lib.age) || 15;
  const grade = n.grade || (lib && lib.grade) || '一年级上';
  const dept = n.dept || (lib && lib.dept) || '无';
  const room = (lib && lib.room) || '';
  const arcane = n.arcane || (lib && lib.arcane) || '未知';
  const arcaneImage = (lib && lib.arcaneImage) || '';
  const affinity = typeof n.affinity === 'number' ? n.affinity : 0;

  const tags = [];
  tags.push({ text: gender, cls: '' });
  tags.push({ text: age + '岁', cls: '' });
  if(grade) tags.push({ text: grade, cls: '' });
  if(room) tags.push({ text: '房 ' + room, cls: '' });
  if(n.relation && n.relation !== '同届生') tags.push({ text: n.relation, cls: 'accent' });
  if(n.status === 'archived') tags.push({ text: '已归档', cls: 'archived' });

  // NPC 技能按钮
  let skillBtn = '';
  const bd = pickNpcBattleData(lib);
  if(bd && Array.isArray(bd.skills) && bd.skills.length > 0){
    skillBtn = `<div class="npc-detail-actions" style="margin-top:10px;padding-top:10px;border-top:none;">
      <button class="btn-skill" data-skills='${escapeHtml(JSON.stringify(bd.skills))}' data-owner='${escapeHtml(n.name)}' onclick="openSkillDetailFromBtn(this)">查看技能</button>
    </div>`;
  }

  return buildDetailHTML({
    name: n.name,
    gender, age,
    tags,
    isSelf: false,
    isArchived: n.status === 'archived',
    arcane, arcaneDesc: arcaneImage ? arcaneImage : (n.desc || ''),
    affinity,
    sections: buildNpcSections(n, lib),
    deleteIdx: idx,
    extraHtml: skillBtn
  });
}

function buildNpcSections(n, lib){
  const s = [];
  if(lib && lib.appearance && typeof lib.appearance === 'object'){
    const a = lib.appearance;
    const rows = [];
    if(a.hair) rows.push(`<div class="kv"><span class="k">发</span><span class="v">${escapeHtml(a.hair)}</span></div>`);
    if(a.eyes) rows.push(`<div class="kv"><span class="k">眼</span><span class="v">${escapeHtml(a.eyes)}</span></div>`);
    if(a.face) rows.push(`<div class="kv"><span class="k">脸</span><span class="v">${escapeHtml(a.face)}</span></div>`);
    if(a.height) rows.push(`<div class="kv"><span class="k">身高</span><span class="v">${escapeHtml(String(a.height))}cm</span></div>`);
    if(a.build) rows.push(`<div class="kv"><span class="k">体型</span><span class="v">${escapeHtml(a.build)}</span></div>`);
    if(a.style) rows.push(`<div class="kv"><span class="k">穿搭</span><span class="v">${escapeHtml(a.style)}</span></div>`);
    if(rows.length) s.push({ title: '外貌', body: rows.join('') });
  }

  const personality = (lib && Array.isArray(lib.personality)) ? lib.personality : [];
  const habits = (lib && lib.habits) || '';
  if(personality.length || habits){
    let body = '';
    if(personality.length){
      body += `<div class="npc-chip-row">${personality.map(p=>`<span class="npc-chip">${escapeHtml(p)}</span>`).join('')}</div>`;
    }
    if(habits) body += `<div style="margin-top:8px;">${escapeHtml(habits)}</div>`;
    s.push({ title: '性格与习惯', body });
  }

  const likes = (lib && Array.isArray(lib.likes)) ? lib.likes : [];
  const dislikes = (lib && Array.isArray(lib.dislikes)) ? lib.dislikes : [];
  if(likes.length || dislikes.length){
    let body = '';
    if(likes.length) body += `<div style="margin-bottom:6px;"><span style="color:#8b949e;font-size:12px;margin-right:6px;">喜欢</span><div class="npc-chip-row" style="display:inline-flex;">${likes.map(x=>`<span class="npc-chip like">${escapeHtml(x)}</span>`).join('')}</div></div>`;
    if(dislikes.length) body += `<div><span style="color:#8b949e;font-size:12px;margin-right:6px;">不喜欢</span><div class="npc-chip-row" style="display:inline-flex;">${dislikes.map(x=>`<span class="npc-chip dislike">${escapeHtml(x)}</span>`).join('')}</div></div>`;
    s.push({ title: '喜好', body });
  }

  const kv = [];
  if(lib && lib.speech) kv.push(`<div class="kv"><span class="k">说话</span><span class="v">${escapeHtml(lib.speech)}</span></div>`);
  if(lib && lib.attitude) kv.push(`<div class="kv"><span class="k">态度</span><span class="v">${escapeHtml(lib.attitude)}</span></div>`);
  if(lib && lib.roleInGroup) kv.push(`<div class="kv"><span class="k">定位</span><span class="v">${escapeHtml(lib.roleInGroup)}</span></div>`);
  if(lib && lib.origin) kv.push(`<div class="kv"><span class="k">出身</span><span class="v">${escapeHtml(lib.origin)}</span></div>`);
  if(lib && lib.hiddenTalent) kv.push(`<div class="kv"><span class="k">特长</span><span class="v">${escapeHtml(lib.hiddenTalent)}</span></div>`);
  if(lib && lib.aloneBehavior) kv.push(`<div class="kv"><span class="k">独处</span><span class="v">${escapeHtml(lib.aloneBehavior)}</span></div>`);
  if(kv.length) s.push({ title: '其他', body: kv.join('') });

  if(n.desc && !(lib && lib.attitude)){
    s.push({ title: '简介', body: escapeHtml(n.desc) });
  }
  return s;
}

function buildDetailHTML(o){
  const nameCls = 'npc-detail-name' + (o.isSelf ? ' is-self' : '') + (o.isArchived ? ' is-archived' : '');
  let html = '<div class="npc-detail">';

  html += '<div class="npc-detail-top">';
  html += `<div class="npc-detail-avatar">${avatarHTML(o.name)}</div>`;
  html += `<div class="${nameCls}">${escapeHtml(o.name)}</div>`;
  if(o.tags && o.tags.length){
    html += '<div class="npc-detail-tags">';
    o.tags.forEach(t => {
      html += `<span class="npc-detail-tag ${t.cls||''}">${escapeHtml(t.text)}</span>`;
    });
    html += '</div>';
  }
  html += '</div>';

  if(o.arcane && o.arcane !== '未觉醒' && o.arcane !== '未知'){
    html += '<div class="npc-detail-section">';
    html += '<div class="npc-section-title">术式</div>';
    html += `<div class="npc-section-body"><div class="kv"><span class="k">本命</span><span class="v" style="color:#f0883e;font-weight:600;">${escapeHtml(o.arcane)}</span></div>`;
    if(o.arcaneDesc) html += `<div class="kv"><span class="k">意象</span><span class="v">${escapeHtml(o.arcaneDesc)}</span></div>`;
    html += '</div></div>';
  }

  if(o.extraHtml){
    html += o.extraHtml;
  }

  if(typeof o.affinity === 'number'){
    const col = affinityColor(o.affinity);
    html += '<div class="npc-affinity">';
    html += `<div class="npc-affinity-label"><span>好感度</span><span class="npc-affinity-value" style="color:${col}">${o.affinity} / 100</span></div>`;
    html += `<div class="npc-affinity-bar"><div class="npc-affinity-fill" style="background:linear-gradient(90deg,${col},${col}cc);" data-w="${o.affinity}"></div></div>`;
    html += '</div>';
  }

  if(o.sections && o.sections.length){
    o.sections.forEach(sec => {
      html += '<div class="npc-detail-section">';
      html += `<div class="npc-section-title">${escapeHtml(sec.title)}</div>`;
      html += `<div class="npc-section-body">${sec.body}</div>`;
      html += '</div>';
    });
  }

  if(typeof o.deleteIdx === 'number'){
    html += `<div class="npc-detail-actions"><button class="btn-del" onclick="removeNPCItemFromDetail(${o.deleteIdx})">移出人物面板</button></div>`;
  }

  html += '</div>';

  // 好感度动画：延迟设置宽度
  setTimeout(() => {
    const fill = document.querySelector('#npcDetailContent .npc-affinity-fill');
    if(fill){
      const w = parseInt(fill.dataset.w || '0');
      fill.style.width = Math.max(0, Math.min(100, w)) + '%';
    }
  }, 60);

  return html;
}

function removeNPCItem(idx){
  CORE.npcs.splice(idx, 1);
  updateStatus();
  openNPCs();
}

function removeNPCItemFromDetail(idx){
  if(!confirm('从人物面板移出？')) return;
  CORE.npcs.splice(idx, 1);
  saveToPhone();
  closeModal('npcDetailModal');
  openNPCs();
}

// ============================================================
//  选项
// ============================================================
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
      aiOptions.forEach(opt=>{
        const text = typeof opt === 'string' ? opt : opt.text;
        const callback = (typeof opt === 'object' && typeof opt.onClick === 'function') ? opt.onClick : null;
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
          if(callback){
            setTimeout(callback, 360);
          } else {
            setTimeout(()=>sendAction(text), 360);
          }
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
//  地点面板
// ============================================================
function renderPlacePanel(show){
  let panel = document.getElementById('place-panel');
  if(!panel){
    panel = document.createElement('div');
    panel.id = 'place-panel';
    panel.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:8px 0;';
    optionsArea.parentNode.insertBefore(panel, optionsArea);
  }
  if(!show){
    panel.innerHTML = '';
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'flex';
  const slotName = (typeof SLOTS !== 'undefined') ? SLOTS[CORE.slot] : '';
  let html = `<div style="width:100%;font-size:12px;color:#8b949e;padding:2px 4px;margin-bottom:4px;">第 ${CORE.day} 天 · ${slotName} · 选择去处</div>`;
  (typeof PLACES !== 'undefined' ? PLACES : []).forEach(p => {
    html += `<button class="option-btn" style="flex:1 1 calc(25% - 6px);min-width:70px;justify-content:center;" onclick="enterPlace('${p.id}')"><span class="opt-icon">${p.emoji}</span><span class="opt-text" style="flex:0;">${p.name}</span></button>`;
  });
  panel.innerHTML = html;
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