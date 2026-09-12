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
  container.innerHTML = renderStarMap(CORE.forms, CORE.arcane || '未觉醒');
}

function renderStarMap(forms, arcaneName){
  const cx = 150, cy = 150;
  const orbitR = 100;
  const centerR = 36;
  const nodeR = 14;
  const total = forms.length;

  let html = '<div class="star-map">';

  // SVG 连线 + 轨道
  html += '<svg class="star-map-svg" viewBox="0 0 300 300">';
  html += `<circle cx="${cx}" cy="${cy}" r="${orbitR}" fill="none" stroke="rgba(168,216,238,0.22)" stroke-width="1" stroke-dasharray="2 6"/>`;
  forms.forEach((_, i) => {
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * orbitR;
    const y = cy + Math.sin(angle) * orbitR;
    html += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="star-line"/>`;
  });
  html += '</svg>';

  // 中心术式球
  html += `<div class="star-center" style="left:${cx - centerR}px;top:${cy - centerR}px;width:${centerR*2}px;height:${centerR*2}px;">${escapeHtml(arcaneName)}</div>`;

  // 形态星点
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
    // 二次点击 → 打开详情
    openFormDetail(idx);
  } else {
    // 一次点击 → 显示名字
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
  if(/一年级上|二年级上|三年级上|四年级上|五年级上|六年级上/.test(t)){ return '秋'; }
  if(/一年级下|二年级下|三年级下|四年级下|五年级下|六年级下/.test(t)){ return '春'; }
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
  if(typeof soundRing==='function') soundRing();
}

function deleteForm(name){ CORE.forms = CORE.forms.filter(f => f.name !== name); }

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

// ============================================================
//  状态栏刷新（时间限长显示）
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

// 时间截断显示
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
//  人物弹窗
// ============================================================
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