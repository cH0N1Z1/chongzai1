// ============================================================
//  rpg-story.js - 星辉学院剧情主循环
//  依赖：shared.js → rpg-core.js → rpg-ui.js
// ============================================================

// ============================================================
//  状态解析
// ============================================================
const STATUS_LINE_RE=/^(年龄[：:]|魔力\s*[+\-：:]|魔力\s*(提升|增加|提高|升至|达到|变为)|获得形态[：:]|删除形态[：:]|人物[：:]|重要人物[：:]|新人物[：:]|删除人物[：:]|时间[：:]|学期[：:]|归档学期[：:])/;

function stripStatus(text){
  let result=text.replace(/【状态更新】[\s\S]*?(?=【选项】|$)/g,'');
  result=result.replace(/【选项】[\s\S]*/g,'');
  const lines=result.split('\n');
  const kept=lines.filter(line=>{
    const t=line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();
    if(!t)return true;
    if(STATUS_LINE_RE.test(t))return false;
    return true;
  });
  return kept.join('\n').trim();
}

async function parseStructuredUpdate(narrative, userAction){
  const schemaExample = JSON.stringify({
    age: null,
    manaDelta: 0,
    manaAbsolute: null,
    time: "描述",
    forms: [],
    delForms: [],
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
- 已有术式形态：${CORE.forms.map(f=>f.name).join('、') || '无'}
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
- time：本轮剧情的时间描述，必须填。请保持简洁（不超过15字），复杂信息放括号里。
- forms：本轮获得的术式形态列表，每项 {"name":"形态名（如霜织·初雪）","type":"觉醒/成长/关键/稀有/传说","desc":"描述"}。
- delForms：本轮删除的术式形态名称列表。
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
      forms: Array.isArray(obj.forms) ? obj.forms.filter(f=>f && f.name) : [],
      delForms: Array.isArray(obj.delForms) ? obj.delForms : [],
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
const update={age:null,soulPowerBase:0,soulPowerAbsolute:null,forms:[],delForms:[],npcs:[],delNpcs:[],time:null,term:null,archiveTerm:null};
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
const km=line.match(/^(获得形态|删除形态|人物|重要人物|新人物|删除人物|时间|学期|归档学期)[：:]\s*(.+)$/);
if(!km)continue;
const kw=km[1];const content=km[2].trim();
if(kw==='获得形态'){
  // 格式：名字 | 类型 | 描述
  smartSplit(content).forEach(seg=>{
    const parts = seg.split('|').map(s=>s.trim());
    const name = parts[0];
    if(!name || isPlaceholder(name)) return;
    const type = parts[1] || '觉醒';
    const desc = parts[2] || '';
    update.forms.push({name, type, desc});
  });
}
else if(kw==='删除形态')smartSplit(content).forEach(seg=>{const n=seg.trim();if(!isPlaceholder(n))update.delForms.push(n)});
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
(update.forms||[]).forEach(f=>addForm(f.name,f.type,f.desc));
(update.delForms||[]).forEach(n=>deleteForm(n));
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
  // 保留兜底逻辑，但不做刻印检测（形态需要明确写入）
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
s+=`术式形态：${CORE.forms.map(f=>`${f.name}（${f.type}）`).join('、')||'无'}\n`;
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

// ============================================================
//  流式处理
// ============================================================
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
if(!text){chatBox.innerHTML+=`<div class="msg-debug">用法：/调试 获得形态 霜织·初雪 | 觉醒 | 描述</div>`;return}
text=normalizeDebugText(text);
const pseudo=`【状态更新】\n${text}\n`;
const update=parseStatusUpdate(pseudo);
const hasAny=update.forms.length>0||update.delForms.length>0||update.npcs.length>0||update.delNpcs.length>0||update.time!==null||update.term!==null||update.archiveTerm!==null||update.soulPowerAbsolute!==null||update.soulPowerBase!==0||update.age!==null;
if(!hasAny){chatBox.innerHTML+=`<div class="msg-debug">无法识别，请用：/调试 获得形态 霜织·初雪 | 觉醒 | 描述</div>`;return}
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
if(/^(获得形态|删除形态|人物|重要人物|新人物|删除人物|时间|魔力|年龄|学期|归档学期)[：:]/.test(text))return text;
let m;
if((m=text.match(/^年龄\s*(\d+)\s*$/)))return `年龄：${m[1]}`;
if((m=text.match(/^魔力\s*([+-]?\d+)\s*$/)))return `魔力 ${m[1]}`;
if((m=text.match(/^魔力\s*(?:提升至|提升到|达到|变为)\s*(\d+)\s*$/)))return `魔力 提升至${m[1]}`;
if((m=text.match(/^(?:认识|遇见|遇到|结识|加入|新增)\s*(?:人物|npc|NPC)?\s*(.+?)\s*$/))){const n=m[1].trim();if(n)return `人物：${n}/未知/未知/未知/相识/`}
if((m=text.match(/^删除人物\s+(.+?)\s*$/)))return `删除人物：${m[1]}`;
if((m=text.match(/^获得\s*(.+?)\s*形态\s*$/)))return `获得形态：${m[1]} | 觉醒 |`;
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

## 输出结构（严格按此顺序）
1) 叙事正文（第二人称，含分层标记）
2) 【状态更新】块（只在有变化时写该行）
3) 【选项】块（2-3 个，每项以"•"开头）

## 状态更新格式
年龄:N / 魔力+N 或 魔力提升至N / 时间:xxx（不超过15字）
获得形态：形态名 | 觉醒/成长/关键/稀有/传说 | 描述
删除形态：形态名
人物：姓名/性别/术式/魔力/关系/描述/好感:N
删除人物：名 / 学期:名 / 归档学期:名

## 术式形态说明
- 术式形态 = 术式的演化阶段，每个形态有独立名字
- 名字通常带术式本名，如「霜织·初雪」「霜织·冰棱」
- 类型分五类：觉醒、成长、关键、稀有、传说
- 觉醒：入学觉醒时获得的初始形态
- 成长：随魔力提升自然演化出的新形态
- 关键：剧情重大节点获得
- 稀有：极难获得，往往有代价
- 传说：几乎没人见过的形态
- 每获得一个新形态，说明术式在这条路上走得更远了

## 硬约束
- 时间每轮必写，且简洁（不超过15字）。
- 只有写进【状态更新】的才生效。
- 人物行第 3 段是术式名（不是人名）；无信息填"未知"。
- 主角性别为 ${CORE.gender}。

## 叙事要求
- 场景优先使用现代都市 + 魔法学院的元素：高楼、地铁、便利店、术式商店、发光的铭牌、晶体玻璃、刻印手环。
- 日常 80-120 字，像轻小说那样，一句一段，节奏轻快。关键剧情 200-300 字。
- 用"你"指代玩家，禁止用"他/她/角色名"指代玩家。
- ${isContinue ? '玩家选择"继续"：自然推进剧情，可让 NPC 主动说话。' : '根据玩家输入推进剧情。'}

## 文本分层标记
- 对话：用中文引号 “……” 或 「……」
- 心理：（……）
- 关键动作：*……*（每段最多 1 处）

## 人物与好感度
- 好感度 0-100。陌生 0-20，认识 21-40，友好 41-60，亲近 61-80，特别 81-100。
- NPC 主动互动随好感度变化。好感度高的 NPC 会主动找你、关心你。
- 叙事要自然，不要刻意刷好感。

${styleBlock}

${proactiveBlock}

## 选项
【状态更新】后写 2-3 个玩家可执行的具体行动。`;

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
}
}catch(e){PLOT.summaryCounter=0}
}