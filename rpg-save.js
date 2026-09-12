// ============================================================
//  rpg-save.js - 星辉学院存档扩展：剧情回放、导出、导入
//  依赖：shared.js → rpg-core.js
//  注：rpg-core.js 已含同名函数（内容一致）。
//      同名函数会以「后加载者生效」，两份内容一样，不影响运行。
// ============================================================

// ============================================================
//  剧情回放
// ============================================================
function openReplay(){
  const el = document.getElementById('replayModal');
  if(!el) return;
  el.innerHTML = '<div class="modal-box"><h3>剧情回放</h3>'
    + '<input id="replaySearch" placeholder="搜索关键词..." oninput="renderReplayList(this.value)" style="width:100%;padding:8px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#f0f6fc;margin-bottom:10px;">'
    + '<div id="replayList" class="replay-list"></div>'
    + '<div class="btn-row"><button class="btn-close" onclick="closeModal(\'replayModal\')">关闭</button></div></div>';
  openModal('replayModal');
  renderReplayList('');
}
function renderReplayList(keyword){
  const list = document.getElementById('replayList');
  if(!list) return;
  const kw = String(keyword||'').trim();
  const items = PLOT.history.filter(m => m.role === 'assistant').map((m, i) => {
    const t = stripStatus(m.content);
    return { idx: i, text: t };
  }).filter(x => !kw || x.text.includes(kw));
  if(items.length === 0){ list.innerHTML = '<div style="text-align:center;color:#8b949e;padding:20px;">无匹配记录</div>'; return; }
  list.innerHTML = items.slice(-50).reverse().map(x =>
    '<div class="replay-item" onclick="scrollToReply(' + x.idx + ')">' + escapeHtml(x.text.slice(0,80)) + (x.text.length>80?'…':'') + '</div>'
  ).join('');
}
function scrollToReply(idx){
  const allMsg = chatBox.querySelectorAll('.msg-ai');
  if(allMsg[idx]){ allMsg[idx].scrollIntoView({behavior:'smooth', block:'center'}); allMsg[idx].style.background='rgba(88,166,255,0.15)'; setTimeout(function(){ allMsg[idx].style.background=''; },1500); }
  closeModal('replayModal');
}

// ============================================================
//  导出 / 导入存档
// ============================================================
function openExport(){
  const raw = localStorage.getItem(slotKey()) || '{}';
  const code = btoa(unescape(encodeURIComponent(raw)));
  const el = document.getElementById('exportModal');
  el.innerHTML = '<div class="modal-box"><h3>导出存档 ' + CURRENT_SLOT + '</h3>'
    + '<p style="font-size:12px;color:#8b949e;margin-bottom:8px;">复制下面全部文字，即可在别的设备导入。</p>'
    + '<textarea readonly style="width:100%;height:180px;padding:10px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#f0f6fc;font-size:12px;font-family:monospace;line-height:1.5;">' + code + '</textarea>'
    + '<div class="btn-row"><button class="btn-close" onclick="closeModal(\'exportModal\')">关闭</button>'
    + '<button class="btn-save" onclick="copyExport()">复制</button></div></div>';
  openModal('exportModal');
}
function copyExport(){
  const ta = document.querySelector('#exportModal textarea');
  if(ta){ ta.select(); document.execCommand('copy'); alert('已复制到剪贴板'); }
}
function openImport(){
  const el = document.getElementById('importModal');
  el.innerHTML = '<div class="modal-box"><h3>导入存档到槽 ' + CURRENT_SLOT + '</h3>'
    + '<p style="font-size:12px;color:#8b949e;margin-bottom:8px;">把之前导出的文字粘贴到下面，会覆盖当前槽。</p>'
    + '<textarea id="importText" placeholder="粘贴存档字符串..." style="width:100%;height:180px;padding:10px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#f0f6fc;font-size:12px;font-family:monospace;line-height:1.5;"></textarea>'
    + '<div class="btn-row"><button class="btn-close" onclick="closeModal(\'importModal\')">取消</button>'
    + '<button class="btn-save" onclick="doImport()">导入</button></div></div>';
  openModal('importModal');
}
function doImport(){
  const t = document.getElementById('importText').value.trim();
  if(!t) return alert('请先粘贴内容');
  try{
    const raw = decodeURIComponent(escape(atob(t)));
    JSON.parse(raw);
    localStorage.setItem(slotKey(), raw);
    alert('导入成功，即将刷新');
    location.reload();
  }catch(e){ alert('导入失败：' + e.message); }
}