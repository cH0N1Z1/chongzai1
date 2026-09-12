// ============================================================
//  rpg-awaken.js - 星辉学院开场觉醒 + 角色生成
//  依赖：shared.js → rpg-core.js → rpg-ui.js → rpg-story.js
// ============================================================

// ============================================================
//  AI 处理中的浮动提示条
// ============================================================
function showAiLoading(text){
  let el = document.getElementById('aiLoadingToast');
  if(!el){
    el = document.createElement('div');
    el.id = 'aiLoadingToast';
    el.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#238636,#2ea043);color:#fff;padding:14px 26px;border-radius:30px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 6px 28px rgba(35,134,54,0.55);display:flex;align-items:center;gap:10px;pointer-events:none;opacity:0;transition:opacity .2s ease;';
    document.body.appendChild(el);
  }
  el.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:aiSpin 0.8s linear infinite;flex-shrink:0;"></span><span>' + (text || 'AI 正在处理，请稍等…') + '</span>';
  el.style.display = 'flex';
  requestAnimationFrame(()=>{ el.style.opacity = '1'; });
  if(!document.getElementById('aiSpinStyle')){
    const style = document.createElement('style');
    style.id = 'aiSpinStyle';
    style.textContent = '@keyframes aiSpin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }
}
function hideAiLoading(){
  const el = document.getElementById('aiLoadingToast');
  if(el){ el.style.opacity = '0'; setTimeout(()=>{ el.style.display = 'none'; }, 200); }
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
const btn = document.querySelector('button[onclick="generateCharacter()"]');
const oldText = btn ? btn.textContent : '';
if(btn){ btn.disabled = true; btn.textContent = '生成中...'; }
showAiLoading('鱼鱼正在生成角色设定，请稍等…');
const prompt=`为现代魔法学院「星辉学院」的学生角色"${name}"（${gender}）生成一份角色设定，术式适性${innate}级。包含：年龄、外貌、性格、出身背景、一个小癖好。约100-150字。直接输出描述。`;
try{
const reply=await callDeepSeekStream([{role:"user",content:prompt}],()=>{});
document.getElementById('roleDesc').value=reply.trim();
}catch(e){alert("生成失败："+e.message)}
finally{
  hideAiLoading();
  if(btn){ btn.disabled = false; btn.textContent = oldText || 'AI生成角色设定'; }
}
}

async function refineCharacter(){
  const desc = document.getElementById('roleDesc').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  if(!desc){alert("角色设定为空，请先填写或点击上方「AI生成角色设定」");return}
  if(!apiKey){alert("请先填写API Key");return}
  const btn = document.querySelector('button[onclick="refineCharacter()"]');
  const oldText = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = '优化中...'; }
  showAiLoading('鱼鱼正在优化角色设定，请稍等…');
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
    hideAiLoading();
    if(btn){ btn.disabled = false; btn.textContent = oldText || 'AI优化当前设定'; }
  }
}

// ============================================================
//  术式觉醒（小说式开场，不分幕）
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
CORE.forms=[];
CORE.npcs=[];
CORE.time='入学第一天';
CORE.term='一年级上学期';
CORE.weather=rollWeather(CORE.term);
CORE.chapterNum=0;
CORE.chapterTitle='';
updateAvatarPreview();
const soulChoice=document.querySelector('input[name="soulChoice"]:checked').value;
let customSoul='';
if(soulChoice==='custom')customSoul=document.getElementById('customSoul').value.trim()||'未知术式';

const systemPrompt=`## 你的角色
你是「星辉学院」入学开场的叙事者。玩家就是主角"你"，用第二人称叙述。
像轻小说那样自然展开，不要分幕。

## 世界观
${FIXED_WORLD}

## 本轮信息
新生：${name}（${gender}，12岁）
设定：${CORE.roleDesc}
术式适性：${innate}级（初始魔力=${CORE.mana}级）
${customSoul?'指定术式：'+customSoul:'请为角色设计一个独特的本命术式，给出名称与特性。'}

## 开场叙事（写成一段连贯的小说，700-1000字）
按以下情节自然展开，不要分幕、不要用【第X幕】标注：
1. 主角在邮箱或手机里收到一封没有署名的信，信上只有一行字和一个地址。
2. 主角按地址找过去，看见一栋白色的、安静的、从没见过的建筑。
3. 推门进去，里面站着几个同龄人，手里都攥着信。踏进学院的瞬间，术式自动觉醒。
4. 一个高年级学生从楼梯上下来，自我介绍是学生会的。他/她用简短的话说明学院规则：
   - 没有教师，完全学生自治
   - 课程由高年级学生开设
   - 每届12名学生
5. 学生会成员递来一枚手环，让主角戴上。戴上的瞬间，校服自动变出来，自动合身。
6. 术式在踏进学院的瞬间就已觉醒。
7. 结尾让学生会成员说一句方向性的话，告诉主角接下来去哪（去宿舍 / 去教室 / 去学生会报到 / 去食堂吃点东西 / 去训练场看看）。

## 输出结构（严格按此顺序）
1) 小说正文（700-1000字，连贯叙事，不分幕）
2) 【状态更新】块
3) 【选项】块（2-3 个，每项以"•"开头）

## 状态更新格式
年龄：12
时间：入学第一天·上午
学期：一年级上学期
获得形态：<术式名>·初 | 觉醒 | <描述>
人物：学生会成员姓名/性别/术式/魔力/学生会/描述/好感:20

## 硬约束
- 学生会成员姓名请你自由发挥，每次新游戏都换一个新名字，名字要有现代感（如：苏晚、江晴、温言、洛宁、沈舟…）。
- 人物行必须严格七段，用 / 分隔。第 3 段是术式名，绝不能填人名。第 7 段是好感度，格式"好感:N"。
- 术式形态必须写入【状态更新】块，格式：「获得形态：霜织·初 | 觉醒 | 掌心凝出细霜」
- 术式形态名字通常是「术式名·一个字或一个词」，如「霜织·初」「回声·听」「断章·锋」。
- 对话用引号，心理用括号，关键动作用 *……* 包裹。
- 结尾必须给出明确去向。
- 【选项】里必须包含 2-3 个具体可执行的下一步方向。
- 每次新游戏的开场场景都从零构想：信的内容、地址、白色建筑的样子、在场的新生、学生会成员，全部全新设计。`;

isGenerating=true;sendBtn.disabled=true;userInput.disabled=true;
try{
const reply=await streamAndProcess([{role:"user",content:systemPrompt}], {model:'deepseek-v4-flash'});
applyScene(stripStatus(reply));

const parsed = await parseStructuredUpdate(stripStatus(reply), '术式觉醒');
const update=parsed.update;
update.soulPowerBase=0;update.soulPowerAbsolute=null;

// 提取术式名和描述
let soulName = customSoul;
let soulDesc = '';
if(!soulName){
    const patterns = [
      /术式[：:]\s*([^\n【]{2,15}?)(?=\s*术式描述|【|$)/,
      /术式(?:名[为叫]?|是|叫做?)[：:：]?\s*[「“"]?([^\n【，。、"」]{2,12})[」”"]?/,
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