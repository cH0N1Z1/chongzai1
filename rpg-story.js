// ============================================================
//  rpg-story.js - 星辉学院剧情主循环（地点 + 时段版）
//  依赖：shared.js → rpg-core.js → rpg-ui.js
// ============================================================

// ============================================================
//  地点 & 时段
// ============================================================
const PLACES = [
  { id:'宿舍',   name:'宿舍',   emoji:'🛏' },
  { id:'教室',   name:'教室',   emoji:'🏫' },
  { id:'食堂',   name:'食堂',   emoji:'🍱' },
  { id:'图书馆', name:'图书馆', emoji:'📚' },
  { id:'训练场', name:'训练场', emoji:'⚔' },
  { id:'天台',   name:'天台',   emoji:'🌙' },
  { id:'樱花道', name:'樱花道', emoji:'🌸' },
  { id:'便利店', name:'便利店', emoji:'🏪' },
];

const SLOTS = ['早晨', '上午', '下午', '晚上'];

let _currentPlace = null;   // 这个时段已经去过的地方（防止重复选）

// ============================================================
//  文本处理
// ============================================================
function stripStatus(text){
  let result = String(text || '');
  result = result.replace(/【选项】[\s\S]*/g, '');
  result = result.replace(/【状态更新】[\s\S]*?(?=【|$)/g, '');
  return result.trim();
}

function extractOptions(text){
  const opts = [];
  const m = String(text||'').match(/【选项】([\s\S]*)$/);
  if(!m) return opts;
  const lines = m[1].split('\n');
  for(const line of lines){
    const t = line.replace(/^[•\-*·\s]+/,'').replace(/^\d+[\.、]\s*/,'').trim();
    if(t.length > 0 && t.length < 80) opts.push(t);
    if(opts.length >= 3) break;
  }
  return opts;
}

// ============================================================
//  主角档案
// ============================================================
function buildCoreSummary(){
  let s = '';
  s += `姓名：${CORE.name}（${CORE.gender}），${CORE.age||12}岁。\n`;
  s += `设定：${CORE.roleDesc}\n`;
  s += `本命术式：${CORE.arcane}\n`;
  if(CORE.arcaneDesc) s += `术式描述：${CORE.arcaneDesc}\n`;
  s += `学期：${CORE.term}\n`;
  if(CORE.summary) s += `【前情】${CORE.summary}\n`;
  return s;
}

// ============================================================
//  流式处理
// ============================================================
async function streamAndProcess(messages, opts){
  const aiMsgDiv = document.createElement('div');
  aiMsgDiv.className = 'msg-ai streaming';
  aiMsgDiv.textContent = '...';
  chatBox.appendChild(aiMsgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

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

  let displayContent = "";
  try {
    const fullReply = await callDeepSeekStream(messages, (delta, full) => {
      displayContent = stripStatus(full);
      if(!displayContent && full) displayContent = full;
      twPush(displayContent);
    }, opts);
    tw.done = true;
    if(tw.timer){ clearTimeout(tw.timer); tw.timer = null; }
    tw.shown = tw.pending.length;
    if(!tw.pending && fullReply){
      tw.pending = stripStatus(fullReply) || '（本轮 AI 未返回叙事，请继续）';
      tw.shown = tw.pending.length;
    }
    if(!tw.pending){
      tw.pending = '（本轮 AI 未返回叙事，请继续）';
      tw.shown = tw.pending.length;
    }
    aiMsgDiv.innerHTML = formatNarrative(escapeHtml(tw.pending));
    aiMsgDiv.classList.remove('streaming');
    chatBox.removeEventListener('scroll', onStreamScroll);
    return fullReply;
  } catch(e) {
    if(tw.timer) clearTimeout(tw.timer);
    chatBox.removeEventListener('scroll', onStreamScroll);
    aiMsgDiv.classList.remove('streaming');
    aiMsgDiv.textContent = '生成失败：' + e.message;
    throw e;
  }
}

// ============================================================
//  调试命令
// ============================================================
function handleLoreTest(testInput){
  const recentText = PLOT.history.slice(-3).map(m => stripStatus(m.content)).join('\n');
  const result = triggerLorebook(testInput || '', recentText, 5);
  if(!result){
    chatBox.innerHTML += `<div class="msg-debug">未命中任何资料条目。试试：/测 我去迷雾街区</div>`;
  } else {
    chatBox.innerHTML += `<div class="msg-debug" style="text-align:left;white-space:pre-wrap;">${escapeHtml(result)}</div>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ============================================================
//  时段 · 玩家点地点
// ============================================================
async function enterPlace(placeId){
  if(isGenerating) return;
  if(_currentPlace) return;

  _currentPlace = placeId;
  renderPlacePanel(false);   // 隐藏地点按钮

  const place = PLACES.find(p => p.id === placeId);
  const npc = findNpcAt(placeId);
  const slotName = SLOTS[CORE.slot];

  chatBox.innerHTML += `<div class="msg-sys">${slotName} · ${place.emoji} 你去了${place.name}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  isGenerating = true; sendBtn.disabled = true; userInput.disabled = true;
  try {
    const coreSummary = buildCoreSummary();
    const npcBlock = buildNpcBlock(npc);

    const systemPrompt = `## 你是谁
你是现代都市魔法学院「星辉学院」的小说叙事者。玩家是主角"你"。

## 世界观
${FIXED_WORLD}

## 主角档案
${coreSummary}
${npcBlock}
## 当前场景
时间：第 ${CORE.day} 天 · ${slotName}
地点：${place.name}

## 输出要求
写一段剧情（第二人称），然后给出 2-3 个下一步行动选项。严格按以下结构输出：

[剧情正文]

【选项】
• 选项1
• 选项2
• 选项3

## 硬约束
- 只输出剧情和选项，不要输出任何状态、数值、时间、人物字段。
- 剧情 80-300 字。像轻小说那样，一句一段，节奏轻快。
- 用"你"指代玩家。
- 对话用中文引号 “……” 或 「……」，心理用（……），关键动作用 *……*（每段最多 1 处）。
- 不写"你的魔力提升了""你变强了"这类抽象句。
- 不写"温馨互助""大家相亲相爱"这类热闹场景。
- 如果本场景有出场人物，让 TA 自然地说 1-2 句话。如果没出场人物，就写主角自己的观察和感受。
- 【选项】必须是"读完这段后你接下来做什么"，而不是"接下来去哪里"。`;

    const messages = [{role:"system", content: systemPrompt}];
    const recent = PLOT.history.slice(-3);
    recent.forEach(m => messages.push({role:m.role, content: stripStatus(m.content)}));
    messages.push({role:"user", content: `（进入 ${place.name}）`});

    const reply = await streamAndProcess(messages);
    const options = extractOptions(reply);

    PLOT.history.push({role:"user", content:`（${slotName}去了${place.name}）`});
    PLOT.history.push({role:"assistant", content:reply});
    if(PLOT.history.length > 30) PLOT.history = PLOT.history.slice(-30);

    // 选项：点了就结束本时段
    const optsWithCb = options.map(t => ({ text: t, onClick: finishSlot }));
    appendOptions(optsWithCb);
  } catch(e) {
    console.error(e);
    chatBox.innerHTML += `<div class="msg-lose">生成失败：${escapeHtml(e.message)}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    // 出错也要能继续
    _currentPlace = null;
    renderPlacePanel(true);
  } finally {
    isGenerating = false; sendBtn.disabled = false; userInput.disabled = false; userInput.focus();
  }
}

// ============================================================
//  时段结束 → 推进
// ============================================================
function finishSlot(){
  CORE.slot++;
  if(CORE.slot >= 4){
    CORE.slot = 0;
    CORE.day++;
    chatBox.innerHTML += `<div class="msg-sys">—— 第 ${CORE.day} 天 ——</div>`;
  } else {
    chatBox.innerHTML += `<div class="msg-sys">—— ${SLOTS[CORE.slot]} ——</div>`;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
  _currentPlace = null;
  updateStatus();
  saveToPhone();
  renderPlacePanel(true);
  if(PLOT.summaryCounter >= 3) generateSummary();
  PLOT.summaryCounter = (PLOT.summaryCounter + 1) % 3;
}

// ============================================================
//  主行动（保留给手动输入用，不推荐）
// ============================================================
async function sendAction(forcedAction){
  if(isGenerating) return;
  const input = document.getElementById('userInput');
  let action = forcedAction || input.value.trim();
  if(!action) return;
  if(!forcedAction) input.value = '';

  if(action.startsWith('/测')){
    chatBox.innerHTML += userMsgHtml(action, true);
    chatBox.scrollTop = chatBox.scrollHeight;
    handleLoreTest(action.replace(/^\/测\s*/, ''));
    userInput.focus();
    return;
  }

  // 手动输入不消耗时段，只让 AI 写一段自由行动
  chatBox.innerHTML += userMsgHtml(action, false);
  chatBox.scrollTop = chatBox.scrollHeight;

  isGenerating = true; sendBtn.disabled = true; userInput.disabled = true;
  try {
    const coreSummary = buildCoreSummary();
    const slotName = SLOTS[CORE.slot];

    const systemPrompt = `## 你是谁
你是现代都市魔法学院「星辉学院」的小说叙事者。玩家是主角"你"。

## 世界观
${FIXED_WORLD}

## 主角档案
${coreSummary}

## 当前
第 ${CORE.day} 天 · ${slotName}

## 输出要求
写一段剧情（第二人称），然后给出 2-3 个下一步行动选项。严格按以下结构输出：

[剧情正文]

【选项】
• 选项1
• 选项2
• 选项3

## 硬约束
- 只输出剧情和选项，不要输出状态、数值。
- 剧情 80-300 字。
- 用"你"指代玩家。`;

    const messages = [{role:"system", content: systemPrompt}];
    const recent = PLOT.history.slice(-3);
    recent.forEach(m => messages.push({role:m.role, content: stripStatus(m.content)}));
    messages.push({role:"user", content: action});

    const reply = await streamAndProcess(messages);
    const options = extractOptions(reply);
    PLOT.history.push({role:"user", content:action});
    PLOT.history.push({role:"assistant", content:reply});
    if(PLOT.history.length > 30) PLOT.history = PLOT.history.slice(-30);
    appendOptions(options);
  } catch(e) {
    console.error(e);
    chatBox.innerHTML += `<div class="msg-lose">生成失败：${escapeHtml(e.message)}</div>`;
  } finally {
    isGenerating = false; sendBtn.disabled = false; userInput.disabled = false; userInput.focus();
  }
}

// ============================================================
//  记忆精炼
// ============================================================
async function generateSummary(force=false){
  if(!force && PLOT.summaryCounter < 3) return;
  if(PLOT.history.length < 4) return;
  const recent = PLOT.history.slice(-8);
  const historyText = recent.map(m => `${m.role==='user'?'玩家':'叙事者'}：${stripStatus(m.content)}`).join('\n');
  const oldSummary = CORE.summary || '';
  const oldLen = oldSummary.length;
  const START = 200, STEP = 20, MAX = 500;
  const targetLen = oldLen === 0 ? START : Math.min(oldLen + STEP, MAX);
  const prompt = `把「旧摘要」和「新对话」融合成一份新摘要。
第三人称，保留有后续影响的内容（人物、地点、目标、承诺、身份、能力），丢弃琐事。

【硬性要求】
输出必须严格控制在 ${targetLen} 字以内（±30字）。宁可丢掉细节，也不要超字数。
直接输出正文，不要任何前缀、不要小标题。

【旧摘要】${oldSummary||'（开头）'}
【新对话】
${historyText}`;
  try {
    const summary = await callDeepSeekStream([{role:'user', content:prompt}], ()=>{});
    if(summary && summary.trim().length > 20){
      let finalSummary = summary.trim();
      if(finalSummary.length > MAX + 50){
        let cut = finalSummary.slice(0, MAX);
        const lastPunc = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('？'), cut.lastIndexOf('；'));
        if(lastPunc > MAX * 0.6) cut = cut.slice(0, lastPunc + 1);
        finalSummary = cut;
      }
      CORE.summary = finalSummary;
      PLOT.summaryCounter = 0;
      chatBox.innerHTML += `<div class="msg-summary">记忆精炼 · 摘要 ${finalSummary.length} 字</div>`;
      chatBox.scrollTop = chatBox.scrollHeight;
      saveToPhone();
    }
  } catch(e){ PLOT.summaryCounter = 0; }
}