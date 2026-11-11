
// ---- Message hover toolbar: copy a message's text (the toolbar itself is rendered with each message).
let messageActionEl=null;
document.addEventListener('click',e=>{messageActionEl=e.target.closest?.('[data-a]')||null;},true);
function messageAction(a,v){
  if(a==='co-react'&&s.coDislikes?.[v])delete s.coDislikes[v];  // liking clears a dislike; the like itself is handled by the demo
  if(a==='co-dislike'){s.coDislikes=s.coDislikes||{};s.coDislikes[v]=!s.coDislikes[v];if(s.coDislikes[v]&&s.coReactions?.[v])delete s.coReactions[v];save();render();return true;}
  if(a!=='message-copy')return false;
  const msg=messageActionEl?.closest('.co-message, .ms-message');
  const text=msg?.querySelector('.co-message-text, .ms-message-content > p, .ms-message-body > p, p')?.innerText.trim()||'';
  if(!text){notify('这条消息没有可复制的文字。');return true;}
  (navigator.clipboard?.writeText(text)||Promise.reject()).then(()=>notify('已复制消息内容'),()=>{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');notify('已复制消息内容');}catch(e){notify('复制失败，请手动选择文字。');}t.remove();});
  return true;
}

// ---- Chat Input (Kobra): every composer gets a model picker and voice input next to send.
// [id, name, logo (icon name or [letter, color]), badge, cost multiplier, original cost]
function composerModels(){return [
  ['auto','Auto','spark','','0.5×'],
  ['fast','快速','zap','','0.8×'],
  ['qwen-max','Qwen3.8-Max',['Q',asColor('--as-color-615ced')],'','0.5×'],
  ['qwen-flash','Qwen3.8-Flash',['Q',asColor('--as-color-615ced')],'Free','0×','0.1×'],
  ['ds-pro','DeepSeek-V4-Pro',['D',asColor('--as-color-4d6bfe')],'','0.5×'],
  ['ds-flash','DeepSeek-Flash',['D',asColor('--as-color-4d6bfe')],'','0.1×'],
  ['glm','GLM-5.3',['Z',asColor('--as-color-1f1f1f')],'','0.8×'],
  ['glm-flash','GLM-5.3-Flash',['Z',asColor('--as-color-1f1f1f')],'','0.1×'],
  ['pangu','盘古 5.5',['盘',asColor('--as-color-c7000b')],'','0.6×']];}
function composerModel(){let id='auto';try{id=localStorage.getItem('as2-model-id')||'auto';}catch(e){}return composerModels().find(m=>m[0]===id)||composerModels()[0];}
function modelLogo(m){return Array.isArray(m[2])?`<span class="as2-model-logo" style="--c:${m[2][1]}">${m[2][0]}</span>`:`<span class="as2-model-logo as2-model-logo--icon">${ico(m[2])}</span>`;}
function composerTools(){const m=composerModel();return `<span class="as2-composer-tools"><button type="button" class="as2-model" data-a="composer-model" aria-haspopup="menu" aria-expanded="false" title="选择模型">${modelLogo(m)}<span class="as2-model-name">${esc(m[1])}</span>${ico('down')}</button><button type="button" class="co-icon as2-mic" data-a="composer-voice" aria-label="语音输入" title="语音输入">${ico('mic')}</button></span>`;}
function composerDecorate(){
  document.querySelectorAll('#demo [data-a="co-mention-channel"]').forEach(b=>{if(!b.querySelector('svg'))b.innerHTML=ico('at');});
  document.querySelectorAll('#demo :is(.composer > .composerfoot, .ms-compose-toolbar, .wc-compose-foot)').forEach(foot=>{
    // Leading "+" (add): every composer starts with it; the channel's own attach button moves into its menu.
    if(!foot.querySelector(':scope > .as2-add')&&!foot.querySelector(':scope > .wc-plus'))foot.insertAdjacentHTML('afterbegin',`<button type="button" class="co-icon as2-add" data-a="composer-add" aria-haspopup="menu" aria-label="添加" title="添加">${ico('plus')}</button>`);
    if(foot.querySelector(':scope > .as2-composer-tools'))return;
    const send=[...foot.children].reverse().find(b=>b.matches('.btn.primary, .wc-send'));
    send?send.insertAdjacentHTML('beforebegin',composerTools()):foot.insertAdjacentHTML('beforeend',composerTools());
  });
}
let composerQueued=false;
// Microtask, not rAF: rAF pauses in background tabs and would leave freshly rendered composers undecorated.
new MutationObserver(()=>{if(composerQueued)return;composerQueued=true;queueMicrotask(()=>{composerQueued=false;composerDecorate();});}).observe(document.getElementById('demo'),{childList:true,subtree:true});
composerDecorate();
function composerAction(a,v){
  if(a==='composer-model'){
    const btn=messageActionEl,open=document.querySelector('.as2-menu[data-for="model"]');closeExtMenu();if(open||!btn)return true;
    const r=btn.getBoundingClientRect(),cur=composerModel()[0];
    document.body.insertAdjacentHTML('beforeend',`<div class="as2-menu as2-model-menu" role="menu" data-for="model" aria-label="选择模型"><div class="as2-model-list">${composerModels().map(m=>`<button role="menuitemradio" aria-checked="${m[0]===cur}" data-a="composer-model-pick" data-v="${m[0]}">${modelLogo(m)}<span class="as2-model-row-name">${esc(m[1])}</span>${m[3]?`<span class="as2-model-badge">${m[3]}</span>`:''}<span class="as2-model-cost">${m[5]?`<s>${m[5]}</s>`:''}${m[4]}</span></button>`).join('')}</div><div class="as2-menu-sep"></div><button class="as2-model-manage" data-a="composer-model-manage">${ico('settings')}<span>模型管理</span></button></div>`);
    const menu=document.querySelector('.as2-menu[data-for="model"]'),h=menu.offsetHeight;
    menu.style.left=Math.round(Math.min(innerWidth-menu.offsetWidth-8,Math.max(8,r.right-menu.offsetWidth)))+'px';menu.style.top=Math.round(r.top-h-6>8?r.top-h-6:r.bottom+6)+'px';
    btn.setAttribute('aria-expanded','true');menu.querySelector('[aria-checked="true"]')?.scrollIntoView({block:'nearest'});return true;
  }
  if(a==='composer-model-pick'){try{localStorage.setItem('as2-model-id',v);}catch(e){}const m=composerModel();document.querySelectorAll('.as2-model').forEach(b=>{b.outerHTML=composerTools().match(/<button type="button" class="as2-model"[\s\S]*?<\/button>/)[0];});notify('已切换模型：'+m[1]);return true;}
  if(a==='composer-model-manage'){openSettings('agent');return true;}
  if(a==='composer-add'){
    const btn=messageActionEl,open=document.querySelector('.as2-menu[data-for="add"]');closeExtMenu();if(open||!btn)return true;
    const r=btn.getBoundingClientRect();
    document.body.insertAdjacentHTML('beforeend',`<div class="as2-menu" role="menu" data-for="add" aria-label="添加">${[...(btn.closest('.channelcomposer')?[['thread','新建话题','chat'],'-']:[]),['file','上传附件','file'],['space','引用知识库','book'],'-',['skill','添加技能','spark'],['mcp','连接 MCP','mcp'],'-',['mention','提及 Agent','at'],['workflow','使用 Workflow','workflow']].map(x=>x==='-'?'<div class="as2-menu-sep"></div>':`<button role="menuitem" data-a="composer-add-pick" data-v="${x[0]}">${ico(x[2])}<span>${x[1]}</span></button>`).join('')}</div>`);
    const menu=document.querySelector('.as2-menu[data-for="add"]'),h=menu.offsetHeight;menu._composer=btn.closest('.composer, .ms-composer, .wc-composer-card');
    menu.style.left=Math.round(Math.max(8,r.left))+'px';menu.style.top=Math.round(r.top-h-6>8?r.top-h-6:r.bottom+6)+'px';return true;
  }
  if(a==='composer-add-pick'){
    const comp=document.querySelector('.as2-menu[data-for="add"]')?._composer,ta=comp?.querySelector('textarea');
    if(v==='thread'){action('new-thread','');return true;}
    if(comp?.classList.contains('nt-card')&&(v==='space'||v==='workflow')){setTimeout(()=>v==='space'?newTaskMenu('knowledge'):action('nt-mode','workflow'),20);return true;}
    if(v==='mention'&&ta){ta.value=(ta.value&&!/\s$/.test(ta.value)?ta.value+' ':ta.value)+'@CodeAgent ';ta.dispatchEvent(new Event('input',{bubbles:true}));ta.focus();}
    else if(v==='space'&&comp?.querySelector('[data-a="co-channel-attach"]'))comp.querySelector('[data-a="co-channel-attach"]').click();
    else notify({skill:'示例：从已安装的技能中选择，Agent 执行时按技能说明处理。',mcp:'示例：选择已连接的 MCP 服务，让 Agent 读取对应系统的数据。',file:'示例：选择本地文件后作为附件随消息发送。',space:'示例：从项目空间选择资料作为上下文引用。',workflow:'示例：选择已发布的 Workflow，让 Agent 按流程执行。'}[v]);
    return true;
  }
  if(a==='composer-voice'){
    const btn=messageActionEl;if(!btn)return true;
    if(btn.classList.contains('is-listening')){btn.classList.remove('is-listening');clearTimeout(btn._t);return true;}
    btn.classList.add('is-listening');btn.setAttribute('aria-pressed','true');
    btn._t=setTimeout(()=>{btn.classList.remove('is-listening');btn.setAttribute('aria-pressed','false');const ta=btn.closest('.composer, .ms-composer, .wc-composer-card')?.querySelector('textarea');if(ta){ta.value=(ta.value?ta.value+' ':'')+'请帮我总结今天的讨论，并列出待确认事项';ta.dispatchEvent(new Event('input',{bubbles:true}));ta.focus();}notify('语音已转写（演示）');},2200);
    return true;
  }
  return false;
}

// Hover toolbar tooltips: the label comes from aria-label; drop the native title so it doesn't double up.
document.addEventListener('pointerover',e=>{const b=e.target.closest?.('.ms-message-actions button[title]');if(!b)return;if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.title);b.removeAttribute('title');});
