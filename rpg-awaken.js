// ============================================================
//  rpg-awaken.js - 星辉学院开场觉醒 + 角色生成
//  依赖：shared.js → rpg-core.js → rpg-ui.js → rpg-story.js
// ============================================================

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
const prompt=`为现代魔法学院「星辉学院」的学生角色"${name}"（${gender}）生成一份角色设定，术式适性${innate}级。包含：年龄、外貌、性格、出身背景、一个小癖好。约100-150字。直接输出描述。`;
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
    if(btn){ btn.disabled = false; btn.textContent = oldText || 'AI优化当前设定'; }
  }
}

// ============================================================
//  术式觉醒（弹丸论破式开场）
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
CORE.marks=[];CORE.arts=[];CORE.npcs=[];
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
风格参考弹丸论破式开场：仪式感、悬疑感、节奏感。但不要照抄。

## 世界观
${FIXED_WORLD}

## 本轮信息
新生：${name}（${gender}，12岁）
设定：${CORE.roleDesc}
术式适性：${innate}级（初始魔力=${CORE.mana}级）
${customSoul?'指定术式：'+customSoul:'请为角色设计一个独特的本命术式，给出名称与特性。'}

## 开场结构（严格按顺序，用【第X幕】标注）
【第一幕 · 信】80字以内
  某天，主角在邮箱或手机里收到一封没有署名的信。
  信上只有一行字和一个地址。
  地址请你自由发挥，要具体、有生活感（如"城南旧书店三楼"、"地铁七号线末班车终点"、"老图书馆后巷"）。

【第二幕 · 抵达】100字以内
  主角按地址找过去。
  看见一栋白色的、安静的、从没见过的建筑。
  门口没有招牌，但主角知道"就是这里"。

【第三幕 · 相遇】120字以内
  推门进去。里面站着几个同龄人，手里都攥着信。
  没人说话。空气有点紧。
  可以写一个细节：有人抬头看了主角一眼，又低下头。

【第四幕 · 学生会登场】150字以内
  一个高年级学生从楼梯上下来，自我介绍是学生会的。
  他/她用简短的话说明学院规则：
  - 没有教师，完全学生自治
  - 课程由高年级学生开设
  - 入学后术式自动觉醒
  语气随意但认真，不啰嗦。

【第五幕 · 手环与校服】120字以内
  学生会成员递来一枚手环，让主角戴上。
  戴上的瞬间，校服自动变出来，自动合身。
  *主角低头看着自己身上的藏青短外套*。
  "这是你的校服。从今天起，你就是星辉的学生了。"

【第六幕 · 术式觉醒】150字以内
  踏进学院的瞬间，术式自动觉醒。
  在正文结尾用独立一行写出：
  术式：xxx
  术式描述：xxx

【第七幕 · 一年级开始】80字以内
  学生会成员说一句方向性的话，告诉主角接下来去哪
  （去宿舍 / 去教室 / 去学生会报到 / 去食堂吃点东西 / 去训练场看看）。
  结尾给出明确方向。

## 输出结构（严格按顺序）
1) 叙事正文（七幕，每幕用【第X幕】标注）
2) 【状态更新】块
3) 【选项】块（2-3 个，每项以"•"开头）

## 状态更新格式
年龄：12
时间：入学第一天·上午
学期：一年级上学期
人物：学生会成员姓名/性别/术式/魔力/学生会/描述/好感:20

## 硬约束
- 学生会成员姓名请你自由发挥，每次新游戏都换一个新名字，名字要有现代感（如：苏晚、江晴、温言、洛宁、沈舟…）。
- 人物行必须严格七段，用 / 分隔。第 3 段是术式名，绝不能填人名。第 7 段是好感度，格式"好感:N"。
- 叙事正文中必须用独立一行明确写出「术式：xxx」和「术式描述：xxx」两行，缺一不可。这两行写在正文结尾，不写进【状态更新】块。
- 对话用引号，心理用括号，关键动作用 *……* 包裹。
- 每幕用【第X幕】标注，节奏轻快，不要拖沓。
- 第七幕结尾必须给出明确去向，让玩家知道接下来往哪走。
- 【选项】里必须包含 2-3 个具体可执行的下一步方向。
- 每次新游戏的开场场景都从零构想：信的内容、地址、白色建筑的样子、在场的新生、学生会成员（性别/年龄/外貌/术式），全部全新设计。`;

isGenerating=true;sendBtn.disabled=true;userInput.disabled=true;
try{
const reply=await streamAndProcess([{role:"user",content:systemPrompt}], {model:'deepseek-v4-flash'});
applyScene(stripStatus(reply));

const parsed = await parseStructuredUpdate(stripStatus(reply), '术式觉醒');
const update=parsed.update;
update.soulPowerBase=0;update.soulPowerAbsolute=null;

let soulName = customSoul;
let soulDesc = '';
if(!soulName){
    const patterns = [
      /术式[：:]\s*([^\n【]{2,15}?)(?=\s*术式描述|【|$)/,
      /术式(?:名[为叫]?|是|叫做?)[：:：]?\s*[「“"]?([^\n【，。、"」]{2,12})[」”"]?/,
      /觉醒(?:出了?|的术式[是为])[：:：]?\s*[「“"]?([^\n【，。、"」]{2,12})[」”"]?/,
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