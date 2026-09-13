// ============================================================
//  rpg-awaken.js - 星辉学院开场觉醒 + 角色生成
//  依赖：shared.js → rpg-core.js → rpg-ui.js → rpg-story.js → rpg-scene.js
//  播放逻辑在 rpg-scene.js，这里只负责准备数据、调用引擎。
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
//  角色生成 / 优化（配置面板用）
// ============================================================
async function generateCharacter(){
const name=document.getElementById('roleName').value.trim();
if(!name){alert("请先填写角色名");return}
const gender=document.querySelector('input[name="roleGender"]:checked').value;
const apiKey=document.getElementById('apiKey').value.trim();
if(!apiKey){alert("请先填写API Key");return}
const btn = document.querySelector('button[onclick="generateCharacter()"]');
const oldText = btn ? btn.textContent : '';
if(btn){ btn.disabled = true; btn.textContent = '生成中...'; }
showAiLoading('鱼鱼正在生成角色设定，请稍等…');
const prompt=`为现代魔法学院「星辉学院」的学生角色"${name}"（${gender}）生成一份角色设定。包含：年龄、外貌、性格、出身背景、一个小癖好。约100-150字。直接输出描述。`;
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
//  随机术式池
// ============================================================
const RANDOM_ARCANES = [
  {name:'霜织', desc:'操控冰霜，指尖凝出细霜，随时间凝结成冰棱、雪幕。'},
  {name:'回声', desc:'记录并重放声音，曾经响起过的，都能再响起一次。'},
  {name:'断章', desc:'将事物斩断。手掌划过的地方，会沿着一条看不见的线分开。'},
  {name:'糖霜', desc:'制造甜味与治愈，尝到的东西会变甜，伤口会愈合得更快。'},
  {name:'拾星录', desc:'以旧笔记为媒介记录光。写下的东西会在纸页上发光。'},
  {name:'镜廊', desc:'映像与迷宫。能照出别人的样子，也能照出自己的。'},
  {name:'弦余', desc:'音、共振、残余。弹响过的音会留下一点不散的东西。'},
  {name:'日蚀', desc:'光、遮蔽、临界。能感知到别人术式的临界点。'},
  {name:'余烬', desc:'燃烧、残留、温度。烧过之后剩下的那一点热。'},
  {name:'节理', desc:'结构、纹理、裂缝。看得见事物内部的纹理与薄弱处。'},
  {name:'薄明', desc:'光、边界、微明。让事物在将亮未亮之间露一点真形。'},
  {name:'晦', desc:'暗、薄暮、不可见。让被照到的东西短暂地隐去。'},
  {name:'隙', desc:'缝隙、刹那、突破。在一瞬间里，找到那条最短的路。'},
  {name:'拾遗', desc:'遗忘、拾回、残片。能把丢下的东西捡回来——有时是记忆。'},
  {name:'雾隐', desc:'雾、隐、谜。让一些东西在视线里慢慢淡下去。'},
];

function rollRandomArcane(){
  return RANDOM_ARCANES[Math.floor(Math.random() * RANDOM_ARCANES.length)];
}

// ============================================================
//  主角建档（AI 把自由文本拆成 character.json 风格结构）
// ============================================================
async function buildSelfProfile(){
  const roleDesc = (CORE.roleDesc||'').trim();
  if(!roleDesc) return;
  try{
    const prompt = `把下面的角色设定文本整理成 JSON。缺失字段留空或空数组，不要捏造原文没有的具体数字。

字段结构：
{"name":"","gender":"","age":12,"appearance":{"hair":"","eyes":"","face":"","height":0,"build":"","style":""},"personality":[],"habits":"","likes":[],"dislikes":[],"attitude":"","speech":"","origin":"","hiddenTalent":"","aloneBehavior":""}

原文：
${roleDesc}

只输出 JSON。`;
    const raw = await callDeepSeekStream([{role:'user',content:prompt}], ()=>{}, {jsonMode:true});
    const parsed = JSON.parse(raw);
    parsed.name = parsed.name || CORE.name;
    parsed.gender = parsed.gender || CORE.gender;
    parsed.age = parsed.age || CORE.age || 12;
    CORE.selfProfile = parsed;
    saveToPhone();
  }catch(e){
    console.warn('主角建档失败', e);
    CORE.selfProfile = {
      name: CORE.name, gender: CORE.gender, age: CORE.age || 12,
      personality: [], habits: '', likes: [], dislikes: [],
      attitude: '', speech: '', origin: '', hiddenTalent: '', aloneBehavior: '',
      _raw: roleDesc
    };
    saveToPhone();
  }
}

// ============================================================
//  术式觉醒（调固定剧情引擎播放序幕）
// ============================================================
async function awakenArcane(){
  if(isGenerating) return;
  const name = document.getElementById('roleName').value.trim();
  const gender = document.querySelector('input[name="roleGender"]:checked').value;
  const roleDesc = document.getElementById('roleDesc').value.trim();

  if(!name){
    chatBox.innerHTML += `<div class="msg-lose">请填写角色名！请回到主界面配置面板填写。</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    return;
  }

  CORE.name = name;
  CORE.gender = gender;
  CORE.age = 12;
  CORE.roleDesc = roleDesc || "无详细设定";
  CORE.summary = '';
  CORE.forms = [];
  CORE.npcs = [];
  CORE.selfProfile = null;
  CORE.time = '入学第一天';
  CORE.term = '一年级上学期';
  CORE.weather = rollWeather(CORE.term);
  CORE.chapterNum = 0;
  CORE.chapterTitle = '';
  CORE.day = 1;
  CORE.slot = 0;
  updateAvatarPreview();

  const soulChoice = document.querySelector('input[name="soulChoice"]:checked').value;
  let arcane;
  if(soulChoice === 'custom'){
    const c = document.getElementById('customSoul').value.trim();
    arcane = { name: c || '未知术式', desc: '尚未描述。' };
  } else {
    arcane = rollRandomArcane();
  }
  CORE.arcane = arcane.name;
  CORE.arcaneDesc = arcane.desc;

  const uniform = gender === '女'
    ? '藏青色的短外套，白衬衫，深蓝色的细丝带，下面是一条灰色的百褶裙'
    : '藏青色的短外套，白衬衫，深蓝色的细丝带，下面是一条灰色的长裤';

  isGenerating = true;
  sendBtn.disabled = true;
  userInput.disabled = true;
  chatBox.innerHTML = '';

  resetClickHint();
  setupClickToContinue();

  try {
    await playScene('prologue', { name, uniform, arcane: arcane.name });

    PLOT.history = [];
    PLOT.turn = 0;
    PLOT.isFirst = false;
    PLOT.summaryCounter = 0;

    PLOT.history.push({role:"user", content:"（入学）"});
    PLOT.history.push({role:"assistant", content:`你收到星辉信，来到梧桐街 47 号。在门厅里和宫守琴、顾迟、月见澄、江野、神代灯初次见面。术式觉醒——${arcane.name}。学姐时雨晴接待了你们，逐个叫出了所有人的名字，没有解释。她发给每人一枚手环，戴上手环，校服自动生成。她说先去宿舍。`});

    updateStatus();

    if(typeof getAvailableClassmates === 'function' && typeof registerNpcFromLibrary === 'function'){
      getAvailableClassmates().forEach(n => registerNpcFromLibrary(n));
    }

    if(typeof CHARACTERS !== 'undefined' && Array.isArray(CHARACTERS.seniors) && typeof registerNpcFromLibrary === 'function'){
      const shiyu = CHARACTERS.seniors.find(x => x.name === '时雨晴');
      if(shiyu) registerNpcFromLibrary(shiyu);
    }

    saveToPhone();

    if(typeof renderPlacePanel === 'function') renderPlacePanel(true);

    buildSelfProfile().catch(()=>{});

  } catch(e) {
    console.error(e);
    chatBox.innerHTML += `<div class="msg-lose">开场播放失败：${escapeHtml(e.message)}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  } finally {
    isGenerating = false;
    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();
  }
}