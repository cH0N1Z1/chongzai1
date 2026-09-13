// ============================================================
//  rpg-awaken.js - 星辉学院开场觉醒 + 角色生成
//  依赖：shared.js → rpg-core.js → rpg-ui.js → rpg-story.js
//  开场是固定文本，点击推进。
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
//  点击推进系统
// ============================================================
let _awaitingClick = null;
let _clickHintTimer = null;
let _clickHintEverShown = false;

function showClickHint(){
  const hint = document.getElementById('click-hint');
  if(hint) hint.classList.add('show');
}
function hideClickHint(){
  const hint = document.getElementById('click-hint');
  if(hint) hint.classList.remove('show');
}

function awaitClick(){
  return new Promise(resolve => {
    _awaitingClick = () => {
      hideClickHint();
      if(_clickHintTimer){ clearTimeout(_clickHintTimer); _clickHintTimer = null; }
      resolve();
    };
    if(!_clickHintEverShown){
      _clickHintEverShown = true;
      showClickHint();
    } else {
      _clickHintTimer = setTimeout(showClickHint, 2500);
    }
  });
}

function triggerClick(){
  if(_awaitingClick){
    const fn = _awaitingClick;
    _awaitingClick = null;
    fn();
  }
}

function setupClickToContinue(){
  const area = document.getElementById('chat-box');
  if(!area) return;
  if(area._clickBound) return;
  area._clickBound = true;
  area.addEventListener('click', triggerClick);
}

// ============================================================
//  开场播放工具
// ============================================================
async function playSegment(html, speaker){
  const div = document.createElement('div');
  div.className = 'msg-ai';
  div.style.animation = 'msgSlideIn .32s ease-out';
  if(speaker){
    div.innerHTML = `<div class="speaker-tag">${escapeHtml(speaker)}</div>${html}`;
  } else {
    div.innerHTML = html;
  }
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  await awaitClick();
}

async function playNarrative(text){
  return playSegment(formatNarrative(escapeHtml(text)));
}

async function playSpeak(text, speaker){
  return playSegment(`<div class="hl-speak">${escapeHtml(text)}</div>`, speaker);
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
//  术式觉醒（固定开场，点击推进）
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

  // 重置"点击提示"的状态
  _clickHintEverShown = false;
  setupClickToContinue();

  try {
    await playNarrative('信到的时候，是晚上。');
    await playNarrative('你像平常一样打开手机，收件箱里多了一封没有署名的邮件。');
    await playNarrative('点开。');
    await playNarrative('深蓝色的封面，只写着一行字，和一个地址。');
    await playSegment(`<div style="text-align:center;margin:12px 0;padding:14px;border:1px dashed #30363d;border-radius:8px;color:#f0f6fc;"><div style="font-weight:bold;font-size:15px;">${escapeHtml(name)}</div><div style="color:#8b949e;font-size:13px;margin-top:6px;">梧桐街 47 号</div></div>`);
    await playNarrative('没有寄件人。没有说明。那行字是你的名字——但笔迹不是你的。');

    await playNarrative('——');
    await playNarrative('第二天，你去找了那条街。');
    await playNarrative('梧桐街。你在这个城市住了十二年，从没听说过。');
    await playNarrative('导航上没有。地图上没有。问了便利店老板，问了路边等公交的阿姨，问了午休的上班族——所有人都在摇头。');
    await playNarrative('但你顺着邮件里那个隐形的方向走。');
    await playNarrative('越走越远。');
    await playNarrative('地铁坐过了六站，又走了四条街。城市的老片区。楼在剥落，电线绕在墙上，行人不多。');
    await playNarrative('拐过一个路口，你看见了那栋建筑。');
    await playNarrative('白色的。干净，安静，孤零零地立在街的尽头。');
    await playNarrative('没有招牌，没有门牌号。二楼的一扇窗开着一道缝，窗帘很白。');
    await playNarrative('你走过去，推开那扇深色的门。');

    await playNarrative('——');
    await playNarrative('里面已经有人了。');
    await playNarrative('五个人。都是和你差不多大的年纪。');

    if(gender === '女'){
      await playNarrative('宫守琴靠着墙，戴着一只耳机，眼睛扫过你，没停。手指很长，慢慢转着手里的笔。');
      await playNarrative('顾迟坐在长椅上，低着头，腿上摊着一本书。她抬眼看你一下，很快又低回去。');
      await playNarrative('裴野站在窗边，外套敞着，正看着外面。他没回头。');
      await playNarrative('神代灯坐在角落的地上，安静地看着自己摊开的手掌。');
      await playNarrative('瑞恩·凯靠在楼梯扶手上，浅棕发微卷，左耳一颗小痣。他看到你，冲你点了点头。');
    } else {
      await playNarrative('宫守琴靠着墙，戴着一只耳机，眼睛扫过你，没停。手指很长，慢慢转着手里的笔。');
      await playNarrative('顾迟坐在长椅上，低着头，腿上摊着一本书。她抬眼看你一下，很快又低回去。');
      await playNarrative('月见澄站在窗边，黑长直发披在肩上，校服穿得一丝不苟。她看了你一眼，礼貌地移开了视线。');
      await playNarrative('裴野站在角落，外套敞着，肩膀很宽。他看着你，没说话。');
      await playNarrative('瑞恩·凯靠在楼梯扶手上，浅棕发微卷，左耳一颗小痣。他看到你，冲你点了点头。');
    }

    await playNarrative('谁都没说话。门厅里只有你脚步声的回音。');
    await playNarrative('你踏进门的那一刻——');
    await playSegment(`<div style="text-align:center;font-weight:bold;color:#fbbf24;font-size:16px;margin:10px 0;">术式醒了。</div>`);
    await playNarrative('不是从外面来的力量。是它本来就在你身体里，一直在，只是从来没人点亮它。');
    await playNarrative('踏进这扇门的那一刻，像有什么东西在心里"咔"了一声。');
    await playNarrative('一个词落在你脑子里。');
    await playSegment(`<div style="text-align:center;font-weight:bold;color:#a855f7;font-size:18px;margin:10px 0;letter-spacing:2px;">${escapeHtml(arcane.name)}</div>`);
    await playNarrative('你低头看自己的手，指尖有一点点凉。');

    await playNarrative('——');
    await playSpeak('哟——！', '时雨');
    await playNarrative('声音从楼梯上响起来。');
    await playNarrative('一个女生从二楼跑下来。短发，亮眼睛，笑得很大。');
    await playSpeak('又到啦！', '时雨');
    await playNarrative('她停在你面前，上下看了你一眼。');
    await playSpeak('你是最后一个。', '时雨');
    await playNarrative('她伸出手，非常自然地握了握你的。');
    await playSpeak('我叫时雨。四年级。学生会接待。今天专门等你们的。', '时雨');
    await playNarrative('她语速很快，像是一整天终于有人可以说话了。');
    await playSpeak('别紧张——虽然我第一天来的时候也紧张得不行。', '时雨');

    await playNarrative('——');
    await playNarrative('然后她开始点名。');
    await playNarrative('她转向那个靠墙的女孩。');
    await playSpeak('宫守琴。', '时雨');
    await playNarrative('女孩的手指停了半秒，抬眼。');
    await playNarrative('她又转向长椅上的女孩。');
    await playSpeak('顾迟。', '时雨');
    await playNarrative('那个女孩慢慢合上书，抬起头看她。');

    if(gender === '女'){
      await playNarrative('她走向窗边。');
      await playSpeak('裴野。', '时雨');
      await playNarrative('窗边的男生回过头，看了她一眼。');
      await playNarrative('她又转向角落。');
      await playSpeak('神代灯。', '时雨');
      await playNarrative('坐在地上的男生，终于把视线从自己的掌心移开。');
      await playNarrative('最后看向扶手边的男生。');
      await playSpeak('瑞恩·凯。', '时雨');
      await playNarrative('那个带小痣的男生笑了一下。');
    } else {
      await playNarrative('她走向窗边。');
      await playSpeak('月见澄。', '时雨');
      await playNarrative('那个黑长直的女生微微颔首。');
      await playNarrative('她又转向角落。');
      await playSpeak('裴野。', '时雨');
      await playNarrative('站在角落的男生抬起头。');
      await playNarrative('最后看向扶手边的男生。');
      await playSpeak('瑞恩·凯。', '时雨');
      await playNarrative('浅棕发男生没说话，只点了一下头。');
    }

    await playNarrative('然后她转回你面前。');
    await playSpeak('还有你——', '时雨');
    await playNarrative('她顿了一下，念出你的名字。');
    await playSpeak(name + '。', '时雨');

    await playNarrative('——');
    await playNarrative('门厅里安静了两秒。');
    await playNarrative('然后瑞恩·凯开口了。他的声音很平。');
    await playSpeak('你怎么知道我们叫什么。', '瑞恩·凯');
    await playNarrative('不是质问。就是问。');
    await playNarrative('时雨眨眨眼。');
    await playNarrative('然后她笑了。');
    await playNarrative('笑得像偷到什么好东西。');
    await playSpeak('嘿嘿——', '时雨');
    await playSpeak('这个嘛——', '时雨');
    await playNarrative('她把一根手指竖在唇前。');
    await playSpeak('你们以后就知道啦~', '时雨');

    await playNarrative('——');
    await playNarrative('她不再解释，伸手在口袋里摸了摸，掏出六枚手环。');
    await playSpeak('来，一人一个。', '时雨');
    await playNarrative('一枚落在你掌心。银白色，很轻，内侧刻着细小的纹路。');
    await playSpeak('戴上之后，校服就出来了。', '时雨');
    await playNarrative('你戴上去。');
    await playNarrative('手腕一凉。');
    await playNarrative(`再低头——一套校服已经贴在你身上了。${uniform}。自动合身，好像它本来就是你穿的。`);
    await playSpeak('手环颜色对应当前术式的最高形态色，', '时雨');
    await playNarrative('时雨说。');
    await playSpeak('所以看你的颜色，我就知道你走到哪一步了。', '时雨');
    await playNarrative('她朝你眨眨眼。');

    await playNarrative('——');
    await playSpeak('现在——', '时雨');
    await playNarrative('她环视了一圈。');
    await playSpeak('你们几个刚觉醒。别急着想做什么大事。', '时雨');
    await playSpeak('先去宿舍把东西放下。走廊很长，中间那间是你们的。', '时雨');
    await playNarrative('她比了个方向。');
    await playSpeak('教室明天早上再找。开课的是高年级，看课表就行。', '时雨');
    await playSpeak('剩下的——自己慢慢摸。', '时雨');

    PLOT.history = [];
    PLOT.turn = 0;
    PLOT.isFirst = false;
    PLOT.summaryCounter = 0;

    PLOT.history.push({role:"user", content:"（入学）"});
    PLOT.history.push({role:"assistant", content:`你收到星辉信，来到梧桐街 47 号。在门厅里和宫守琴、顾迟、裴野、神代灯、瑞恩·凯初次见面。术式觉醒——${arcane.name}。学姐时雨接待了你们，逐个叫出了所有人的名字，没有解释。她发给每人一枚手环，戴上手环，校服自动生成。她说先去宿舍。`});

    updateStatus();

    // 把同届生写进人物面板（初始好感来自角色库 initialAffinity）
    if(typeof getAvailableClassmates === 'function' && typeof registerNpcFromLibrary === 'function'){
      getAvailableClassmates().forEach(n => registerNpcFromLibrary(n));
    }

    saveToPhone();

    if(typeof renderPlacePanel === 'function') renderPlacePanel(true);

    // 后台为玩家建档（不阻塞开场）
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