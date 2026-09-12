// ============================================================
//  rpg-story.js - 星辉学院剧情主循环
//  sendAction / 流式处理 / 状态解析 / applyUpdate / 摘要 / 调试
//  依赖：shared.js → rpg-core.js → rpg-ui.js
// ============================================================

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
地铁到站的风掀起你的衣角。你按信上的地址走出闸机，*抬头看见一栋白色的建筑*。
（就是这里吗……）
口袋里那封信微微发烫。你把它拿出来，背面那枚星辉印记正在发光。
眼前的老楼像水波一样晃了一下。再定睛看时，一座白色校门安静地立在晨光里。

【状态更新】
时间：入学第一天·上午
学期：一年级上学期
人物：校门口的学生会成员/女/镜台/30级/学生会/穿深蓝长外套，笑容温和/好感:20

【选项】
• 走上前，把信递过去
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
- 日常 80-120 字，像轻小说那样，一句一段，节奏轻快。关键剧情 200-300 字，但不要堆砌形容词，多用动词和对话。每轮至少有一句对话。
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
- NPC 主动互动的方式：借你笔记、拉你去食堂、放学等你、在训练场递水、发消息问你作业。好感度越高，互动越频繁、越私密。
- 好感度档位对应的互动：
  21-40（认识）：打招呼、借东西
  41-60（友好）：一起吃饭、分享小秘密
  61-80（亲近）：天台独处、主动帮忙、关心你的状态
  81-100（特别）：专属称呼、关键时刻站你这边、会因为你受伤而生气
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