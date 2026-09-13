// ============================================================
//  rpg-awaken.js - 星辉学院开场觉醒 + 角色生成
//  依赖：shared.js → rpg-core.js → rpg-ui.js → rpg-story.js
//  开场是固定文本，不走 AI。
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
//  开场播放工具
// ============================================================
function playSegment(html, delay){
  return new Promise(resolve => {
    const div = document.createElement('div');
    div.className = 'msg-ai';
    div.style.animation = 'msgSlideIn .32s ease-out';
    div.innerHTML = html;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    setTimeout(resolve, delay || 420);
  });
}

function playNarrative(text, delay){
  return playSegment(formatNarrative(escapeHtml(text)), delay);
}

// ============================================================
//  术式觉醒（固定开场，不走 AI）
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

  // 初始化 CORE
  CORE.name = name;
  CORE.gender = gender;
  CORE.age = 12;
  CORE.roleDesc = roleDesc || "无详细设定";
  CORE.summary = '';
  CORE.forms = [];
  CORE.npcs = [];
  CORE.time = '入学第一天';
  CORE.term = '一年级上学期';
  CORE.weather = rollWeather(CORE.term);
  CORE.chapterNum = 0;
  CORE.chapterTitle = '';
  CORE.day = 1;
  CORE.slot = 0;
  updateAvatarPreview();

  // 术式：自选 or 随机
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

  // 同届 5 人名单（按性别筛选）
  const list = (typeof getAvailableClassmates === 'function') ? getAvailableClassmates() : [];
  const sorted = ['宫守琴', '燕无咎', '神代 彻', '闻 昼', '凯·伊森', '薇尔伦蒂·凯尔'];
  const five = [];
  for(const nm of sorted){
    const c = list.find(x => x.name === nm);
    if(c && five.length < 5) five.push(c);
  }
  // 兜底：如果角色库没加载完，就用硬编码名单
  const fallbackNames = gender === '女'
    ? ['宫守琴', '燕无咎', '神代 彻', '闻 昼', '凯·伊森']
    : ['宫守琴', '燕无咎', '薇尔伦蒂·凯尔', '神代 彻', '闻 昼'];

  // 校服描述
  const uniform = gender === '女'
    ? '藏青色的短外套，白衬衫，深蓝色的细丝带，下面是一条灰色的百褶裙'
    : '藏青色的短外套，白衬衫，深蓝色的细丝带，下面是一条灰色的长裤';

  isGenerating = true;
  sendBtn.disabled = true;
  userInput.disabled = true;
  chatBox.innerHTML = '';

  try {
    await playNarrative('信到的时候，是晚上。');
    await playNarrative('你像平常一样打开手机，收件箱里多了一封没有署名的邮件。');
    await playNarrative('点开。');
    await playNarrative('深蓝色的封面，只写着一行字，和一个地址。');
    await playSegment(`<div style="text-align:center;margin:12px 0;padding:14px;border:1px dashed #30363d;border-radius:8px;color:#f0f6fc;"><div style="font-weight:bold;font-size:15px;">${escapeHtml(name)}</div><div style="color:#8b949e;font-size:13px;margin-top:6px;">梧桐街 47 号</div></div>`, 600);
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

    // 五人描写（按性别不同）
    if(gender === '女'){
      await playNarrative('宫守琴靠着墙，戴着一只耳机，眼睛扫过你，没停。手指很长，慢慢转着手里的笔。');
      await playNarrative('燕无咎坐在长椅上，低着头，腿上摊着一本书。她抬眼看你一下，很快又低回去。');
      await playNarrative('神代彻站在窗边，背着旧帆布包，正看着外面。他没回头。');
      await playNarrative('闻昼坐在角落的地上，袖子扣到最上面一颗扣子，安静地看着自己摊开的手掌。');
      await playNarrative('凯·伊森靠在楼梯扶手上，外套搭在肩上，左眉有一道旧疤。他看到你，冲你点了点头。');
    } else {
      await playNarrative('宫守琴靠着墙，戴着一只耳机，眼睛扫过你，没停。手指很长，慢慢转着手里的笔。');
      await playNarrative('燕无咎坐在长椅上，低着头，腿上摊着一本书。她抬眼看你一下，很快又低回去。');
      await playNarrative('薇尔伦蒂·凯尔站在窗边，浅金色的卷发披在肩上，制服穿得一丝不苟。她看了你一眼，礼貌地移开了视线。');
      await playNarrative('神代彻坐在角落的地上，背着旧帆布包，安静地看着自己摊开的手掌。');
      await playNarrative('闻昼靠在楼梯扶手上，黑发中分，袖子扣到最上面一颗扣子。他看到你，没说话。');
    }

    await playNarrative('谁都没说话。门厅里只有你脚步声的回音。');
    await playNarrative('你踏进门的那一刻——');
    await playSegment(`<div style="text-align:center;font-weight:bold;color:#fbbf24;font-size:16px;margin:10px 0;">术式醒了。</div>`, 700);
    await playNarrative('不是从外面来的力量。是它本来就在你身体里，一直在，只是从来没人点亮它。');
    await playNarrative('踏进这扇门的那一刻，像有什么东西在心里"咔"了一声。');
    await playNarrative('一个词落在你脑子里。');
    await playSegment(`<div style="text-align:center;font-weight:bold;color:#a855f7;font-size:18px;margin:10px 0;letter-spacing:2px;">${escapeHtml(arcane.name)}</div>`, 800);
    await playNarrative('你低头看自己的手，指尖有一点点凉。');

    await playNarrative('——');
    await playSegment(`<div class="hl-speak" style="font-size:16px;">「哟——！」</div>`, 500);
    await playNarrative('声音从楼梯上响起来。');
    await playNarrative('一个女生从二楼跑下来。短发，亮眼睛，笑得很大。');
    await playSegment(`<div class="hl-speak">「又到啦！」</div>`, 400);
    await playNarrative('她停在你面前，上下看了你一眼。');
    await playSegment(`<div class="hl-speak">「你是最后一个。」</div>`, 500);
    await playNarrative('她伸出手，非常自然地握了握你的。');
    await playSegment(`<div class="hl-speak">「我叫时雨。四年级。学生会接待。今天专门等你们的。」</div>`, 600);
    await playNarrative('她语速很快，像是一整天终于有人可以说话了。');
    await playSegment(`<div class="hl-speak">「别紧张——虽然我第一天来的时候也紧张得不行。」</div>`, 500);

    await playNarrative('——');
    await playNarrative('然后她开始点名。');
    await playNarrative('她转向那个靠墙的女孩。');
    await playSegment(`<div class="hl-speak">「宫守琴。」</div>`, 450);
    await playNarrative('女孩的手指停了半秒，抬眼。');
    await playNarrative('她又转向长椅上的女孩。');
    await playSegment(`<div class="hl-speak">「燕无咎。」</div>`, 450);
    await playNarrative('那个女孩慢慢合上书，抬起头看她。');

    if(gender === '女'){
      await playNarrative('她走向窗边。');
      await playSegment(`<div class="hl-speak">「神代彻。」</div>`, 450);
      await playNarrative('窗边的男生回过头，看了她一眼。');
      await playNarrative('她又转向角落。');
      await playSegment(`<div class="hl-speak">「闻昼。」</div>`, 450);
      await playNarrative('坐在地上的男生，终于把视线从自己的掌心移开。');
      await playNarrative('最后看向扶手边的男生。');
      await playSegment(`<div class="hl-speak">「凯·伊森。」</div>`, 450);
      await playNarrative('那个带疤的男生笑了一下。');
    } else {
      await playNarrative('她走向窗边。');
      await playSegment(`<div class="hl-speak">「薇尔伦蒂。」</div>`, 450);
      await playNarrative('那个浅金色卷发的女生微微颔首。');
      await playNarrative('她又转向角落。');
      await playSegment(`<div class="hl-speak">「神代彻。」</div>`, 450);
      await playNarrative('坐在地上的男生抬起头。');
      await playNarrative('最后看向扶手边的男生。');
      await playSegment(`<div class="hl-speak">「闻昼。」</div>`, 450);
      await playNarrative('黑发中分的男生没说话，只点了一下头。');
    }

    await playNarrative('然后她转回你面前。');
    await playSegment(`<div class="hl-speak">「还有你——」</div>`, 600);
    await playNarrative('她顿了一下，念出你的名字。');
    await playSegment(`<div class="hl-speak" style="font-weight:bold;">「${escapeHtml(name)}。」</div>`, 700);

    await playNarrative('——');
    await playNarrative('门厅里安静了两秒。');

    if(gender === '女'){
      await playNarrative('然后闻昼开口了。他的声音很低，很平。');
    } else {
      await playNarrative('然后闻昼开口了。他的声音很低，很平。');
    }
    await playSegment(`<div class="hl-speak">「你怎么知道我们叫什么。」</div>`, 550);
    await playNarrative('不是质问。就是问。');
    await playNarrative('时雨眨眨眼。');
    await playNarrative('然后她笑了。');
    await playNarrative('笑得像偷到什么好东西。');
    await playSegment(`<div class="hl-speak">「嘿嘿——」</div>`, 500);
    await playSegment(`<div class="hl-speak">「这个嘛——」</div>`, 500);
    await playNarrative('她把一根手指竖在唇前。');
    await playSegment(`<div class="hl-speak">「你们以后就知道啦~」</div>`, 700);

    await playNarrative('——');
    await playNarrative('她不再解释，伸手在口袋里摸了摸，掏出六枚手环。');
    await playSegment(`<div class="hl-speak">「来，一人一个。」</div>`, 500);
    await playNarrative('一枚落在你掌心。银白色，很轻，内侧刻着细小的纹路。');
    await playSegment(`<div class="hl-speak">「戴上之后，校服就出来了。」</div>`, 500);
    await playNarrative('你戴上去。');
    await playNarrative('手腕一凉。');
    await playNarrative(`再低头——一套校服已经贴在你身上了。${uniform}。自动合身，好像它本来就是你穿的。`);
    await playSegment(`<div class="hl-speak">「手环颜色对应当前术式的最高形态色，」</div>`, 400);
    await playNarrative('时雨说。');
    await playSegment(`<div class="hl-speak">「所以看你的颜色，我就知道你走到哪一步了。」</div>`, 500);
    await playNarrative('她朝你眨眨眼。');

    await playNarrative('——');
    await playSegment(`<div class="hl-speak">「现在——」</div>`, 450);
    await playNarrative('她环视了一圈。');
    await playSegment(`<div class="hl-speak">「你们几个刚觉醒。别急着想做什么大事。」</div>`, 550);
    await playSegment(`<div class="hl-speak">「先去宿舍把东西放下。走廊很长，中间那间是你们的。」</div>`, 550);
    await playNarrative('她比了个方向。');
    await playSegment(`<div class="hl-speak">「教室明天早上再找。开课的是高年级，看课表就行。」</div>`, 550);
    await playSegment(`<div class="hl-speak">「剩下的——自己慢慢摸。」</div>`, 650);

    // 收尾：设置状态
    PLOT.history = [];
    PLOT.turn = 0;
    PLOT.isFirst = false;
    PLOT.summaryCounter = 0;

    // 把这一段的玩家输入 & AI 文本记进 history（用于后续上下文）
    PLOT.history.push({role:"user", content:"（入学）"});
    PLOT.history.push({role:"assistant", content:`你收到星辉信，来到梧桐街 47 号。在门厅里和宫守琴、燕无咎、神代彻、闻昼${gender==='女'?'、凯·伊森':'、薇尔伦蒂'}初次见面。术式觉醒——${arcane.name}。学姐时雨接待了你们，逐个叫出了所有人的名字，没有解释。她发给每人一枚手环，戴上手环，校服自动生成。她说先去宿舍。`});

    updateStatus();
    saveToPhone();

    // 显示地点面板
    if(typeof renderPlacePanel === 'function') renderPlacePanel(true);

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