
// ---- Sidebar motion (Kobra Sidebar: active line · highlight · press · collapse · team switch).
// render() rebuilds #demo, so sidebar affordances are (re)attached by a MutationObserver after each render.
function sidebarState(){return window.__asSidebar||(window.__asSidebar={line:null,collapsed:(()=>{try{return localStorage.getItem('as2-side-collapsed')==='1';}catch(e){return false;}})()});}
function sidebarApplyCollapsed(){document.documentElement.dataset.side=sidebarState().collapsed?'collapsed':'open';}
function sidebarToggle(){const st=sidebarState();st.collapsed=!st.collapsed;try{localStorage.setItem('as2-side-collapsed',st.collapsed?'1':'0');}catch(e){}sidebarApplyCollapsed();}
const SIDEBAR_TOGGLE_ICON=ico('panelLeft');
// Row position in the sidebody's padding box (what an absolutely positioned child is placed against).
function sidebarRowTop(row,body){return Math.round(row.getBoundingClientRect().top-body.getBoundingClientRect().top-body.clientTop+body.scrollTop);}
function sidebarSyncLine(){const body=document.querySelector('#demo .demoside .sidebody'),a=body?.querySelector('.sidenav.active'),line=body?.querySelector(':scope > .as2-nav-line');if(!a||!line)return;const top=sidebarRowTop(a,body);line.style.transform=`translateY(${top}px)`;line.style.height=a.offsetHeight+'px';const st=sidebarState();if(st.line)st.line.top=top;}
function sidebarDecorate(){
  const side=document.querySelector('#demo .demoside'),body=side?.querySelector('.sidebody'),head=side?.querySelector('.sidehead');
  // Collapse toggles: one in the sidebar header, one at the start of the breadcrumb (visible while collapsed).
  if(head&&!head.querySelector('.as2-side-toggle'))head.insertAdjacentHTML('beforeend',`<button class="as2-side-toggle" data-a="side-toggle" aria-label="收起侧栏" title="收起侧栏">${SIDEBAR_TOGGLE_ICON}</button>`);
  const crumb=document.querySelector('#demo .democrumb');
  if(crumb&&side?.children.length&&!crumb.querySelector('.as2-side-toggle'))crumb.insertAdjacentHTML('afterbegin',`<button class="as2-side-toggle as2-side-toggle--crumb" data-a="side-toggle" aria-label="展开侧栏" title="展开侧栏">${SIDEBAR_TOGGLE_ICON}</button>`);
  if(side&&side.children.length&&!side.querySelector(':scope > .as2-side-resizer'))side.insertAdjacentHTML('beforeend','<div class="as2-resizer as2-side-resizer" role="separator" aria-orientation="vertical" aria-label="调整侧栏宽度" tabindex="0" title="拖动调整宽度 · 双击恢复默认"></div>');
  if(!body)return;
  // Active line: slides from the previously active row within the same sidebar.
  const active=body.querySelector('.sidenav.active'),key=head?.textContent.trim().slice(0,12)||'';
  let line=body.querySelector(':scope > .as2-nav-line');
  if(active){
    const fresh=!line;
    if(fresh){line=document.createElement('i');line.className='as2-nav-line';line.setAttribute('aria-hidden','true');body.prepend(line);}
    const top=sidebarRowTop(active,body),h=active.offsetHeight,prev=sidebarState().line;
    // A rebuilt sidebar starts from where the line was (same sidebar) or lands in place — never slides in from the top.
    if(fresh&&!(prev&&prev.key===key&&prev.top!==top)){line.style.transition='none';line.style.transform=`translateY(${top}px)`;line.style.height=h+'px';line.getBoundingClientRect();line.style.transition='';}
    else if(prev&&prev.key===key&&prev.top!==top){line.style.transition='none';line.style.transform=`translateY(${prev.top}px)`;line.style.height=prev.h+'px';line.getBoundingClientRect();line.style.transition='';}
    line.style.transform=`translateY(${top}px)`;line.style.height=h+'px';line.style.left=Math.max(0,active.offsetLeft-6)+'px';
    sidebarState().line={key,top,h};
    requestAnimationFrame(()=>requestAnimationFrame(sidebarSyncLine));
  }else if(line)line.remove();
  // Highlight: one hover block that follows the pointer between rows.
  if(!body.querySelector(':scope > .as2-nav-hover')){const hv=document.createElement('i');hv.className='as2-nav-hover';hv.setAttribute('aria-hidden','true');body.prepend(hv);}
}
document.addEventListener('pointerover',e=>{
  const row=e.target.closest('#demo .demoside .sidenav'),body=row?.closest('.sidebody'),hv=body?.querySelector(':scope > .as2-nav-hover');
  if(!hv)return;
  const fresh=hv.dataset.on!=='1';if(fresh){hv.style.transition='none';}
  hv.style.transform=`translateY(${sidebarRowTop(row,body)}px)`;hv.style.height=row.offsetHeight+'px';hv.style.left=row.offsetLeft+'px';hv.style.width=row.offsetWidth+'px';hv.dataset.on='1';
  if(fresh){hv.getBoundingClientRect();hv.style.transition='';}
});
document.addEventListener('pointerout',e=>{
  const body=e.target.closest?.('#demo .demoside .sidebody');if(!body)return;
  if(e.relatedTarget&&e.relatedTarget.closest?.('.sidenav')&&body.contains(e.relatedTarget))return;
  const hv=body.querySelector(':scope > .as2-nav-hover');if(hv)hv.dataset.on='0';
});

// Project switcher popover: anchored under the header switch, Kobra team-switch layout.
function closeProjectSwitcher(){const p=document.querySelector('.as2-switcher');if(!p)return;p.remove();document.querySelector('#demo .projectswitch')?.setAttribute('aria-expanded','false');}
function projectSwitcherItems(q=''){
  const names=orderedProjectNames().filter(n=>n.toLowerCase().includes(q.trim().toLowerCase()));
  return names.map(n=>`<button class="as2-switcher-item" role="option" aria-selected="${n===s.project}" data-a="select-project" data-v="${esc(n)}"><span class="projecticon">${esc(n[0])}</span><span class="as2-switcher-name">${esc(n)}</span>${n===s.project?`<span class="as2-switcher-check">${ico('check')}</span>`:''}</button>`).join('')||'<p class="as2-switcher-empty">没有匹配的项目</p>';
}
function openProjectSwitcher(){
  const btn=document.querySelector('#demo .projectswitch');if(!btn)return false;
  if(document.querySelector('.as2-switcher')){closeProjectSwitcher();return true;}
  const r=btn.getBoundingClientRect();
  document.body.insertAdjacentHTML('beforeend',`<div class="as2-switcher" role="dialog" aria-label="切换项目" style="left:${Math.round(r.left-4)}px;top:${Math.round(r.bottom+4)}px">
    <div class="as2-switcher-search">${ico('search')}<input id="as2SwitcherQuery" placeholder="查找项目" aria-label="查找项目" autocomplete="off"><kbd>Esc</kbd></div>
    <div class="as2-switcher-list" role="listbox">${projectSwitcherItems()}</div>
    <div class="as2-switcher-sep"></div>
    <button class="as2-switcher-item as2-switcher-create" data-a="switcher-create"><span class="as2-switcher-plus">${ico('plus')}</span><span><b>加入或新建项目</b><small>按项目隔离频道、任务、空间与扩展</small></span></button>
  </div>`);
  btn.setAttribute('aria-expanded','true');
  requestAnimationFrame(()=>document.getElementById('as2SwitcherQuery')?.focus({preventScroll:true}));
  return true;
}
document.addEventListener('input',e=>{if(e.target.id==='as2SwitcherQuery'){const list=document.querySelector('.as2-switcher-list');if(list)list.innerHTML=projectSwitcherItems(e.target.value);}});
document.addEventListener('keydown',e=>{
  const pop=document.querySelector('.as2-switcher');if(!pop)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeProjectSwitcher();document.querySelector('#demo .projectswitch')?.focus();return;}
  if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const items=[...pop.querySelectorAll('.as2-switcher-item')],i=items.indexOf(document.activeElement);const next=items[(i+(e.key==='ArrowDown'?1:-1)+items.length+(i<0&&e.key==='ArrowUp'?1:0))%items.length];next?.focus();}
  if(e.key==='Enter'&&document.activeElement?.id==='as2SwitcherQuery'){e.preventDefault();pop.querySelector('.as2-switcher-list .as2-switcher-item')?.click();}
},true);
document.addEventListener('pointerdown',e=>{const pop=document.querySelector('.as2-switcher');if(pop&&!pop.contains(e.target)&&!e.target.closest('.projectswitch'))closeProjectSwitcher();},true);
window.addEventListener('resize',closeProjectSwitcher);

function sidebarAction(a,v){
  if(a==='side-toggle'){sidebarToggle();return true;}
  if(a==='switcher-create'){closeProjectSwitcher();notify('示例：新建项目需由组织管理员开通；加入项目请联系项目 Owner。');return true;}
  if(a==='select-project'){closeProjectSwitcher();requestAnimationFrame(()=>{const area=document.querySelector('#demo .demoarea');if(area){area.classList.remove('as2-switch-in');void area.offsetWidth;area.classList.add('as2-switch-in');}});return false;}
  return false;
}
// 二级菜单在很多下钻页被 CSS 隐藏但仍在 DOM 里；按是否被隐藏标记 #demo[data-solo]（收起不算隐藏），内容面板据此恢复四角圆角。
function sidebarSoloSync(){const d=document.getElementById('demo'),side=d?.querySelector(':scope > .demoside');const shown=!!side&&side.children.length>0&&getComputedStyle(side).display!=='none';d?.toggleAttribute('data-solo',!shown);}
sidebarApplyCollapsed();
new MutationObserver(()=>{sidebarDecorate();sidebarSoloSync();}).observe(document.getElementById('demo'),{childList:true});
new MutationObserver(sidebarSoloSync).observe(document.body,{attributes:true,attributeFilter:['data-view','data-page','data-taskdetail']});
window.addEventListener('resize',sidebarSoloSync);
sidebarDecorate();sidebarSoloSync();

// Resizable sidebar width (Kobra: 200–360px). Stored per viewer; double-click resets.
const SIDE_MIN=200,SIDE_MAX=360,SIDE_DEFAULT=240;
function sideWidthApply(w){const v=Math.max(SIDE_MIN,Math.min(SIDE_MAX,Math.round(w)));document.documentElement.style.setProperty('--agentspace-side-width',v+'px');return v;}
function sideWidthSave(v){try{localStorage.setItem('as2-side-w',String(v));}catch(e){}}
(()=>{let w=SIDE_DEFAULT;try{w=Number(localStorage.getItem('as2-side-w'))||SIDE_DEFAULT;}catch(e){}sideWidthApply(w);})();
document.addEventListener('pointerdown',e=>{
  const h=e.target.closest('.as2-side-resizer');if(!h)return;
  e.preventDefault();const side=h.parentElement,left=side.getBoundingClientRect().left;let v=side.getBoundingClientRect().width;
  document.documentElement.dataset.resizing='side';h.setPointerCapture(e.pointerId);
  const move=ev=>{v=sideWidthApply(ev.clientX-left);};
  const up=()=>{h.removeEventListener('pointermove',move);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up);delete document.documentElement.dataset.resizing;sideWidthSave(v);sidebarSyncLine();};
  h.addEventListener('pointermove',move);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
});
document.addEventListener('dblclick',e=>{if(e.target.closest('.as2-side-resizer')){sideWidthSave(sideWidthApply(SIDE_DEFAULT));sidebarSyncLine();}});
document.addEventListener('keydown',e=>{
  const h=e.target.closest?.('.as2-side-resizer');if(!h||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const cur=h.parentElement.getBoundingClientRect().width;
  const v=sideWidthApply(e.key==='Home'?SIDE_MIN:e.key==='End'?SIDE_MAX:cur+(e.key==='ArrowRight'?8:-8));sideWidthSave(v);
});

// Resizable Thread panel: drag the divider on its left edge; stored per viewer; double-click resets.
const THREAD_MIN=320,CHANNEL_MIN=360;
function threadWidthApply(px){if(px==null){document.documentElement.style.removeProperty('--agentspace-thread-width');return null;}document.documentElement.style.setProperty('--agentspace-thread-width',Math.round(px)+'px');return Math.round(px);}
function threadWidthSave(v){try{v==null?localStorage.removeItem('as2-thread-w'):localStorage.setItem('as2-thread-w',String(v));}catch(e){}}
(()=>{try{const w=Number(localStorage.getItem('as2-thread-w'));if(w)threadWidthApply(w);}catch(e){}})();
function threadClamp(wrap,px){const r=wrap.getBoundingClientRect();return Math.max(THREAD_MIN,Math.min(r.width-CHANNEL_MIN,px));}
function threadDecorate(){document.querySelectorAll('#demo .colink-channel > .threadpanel').forEach(tp=>{if(!tp.querySelector(':scope > .as2-thread-resizer'))tp.insertAdjacentHTML('afterbegin','<div class="as2-resizer as2-thread-resizer" role="separator" aria-orientation="vertical" aria-label="调整 Thread 宽度" tabindex="0" title="拖动调整宽度 · 双击恢复默认"></div>');});}
new MutationObserver(threadDecorate).observe(document.getElementById('demo'),{childList:true,subtree:true});
threadDecorate();
document.addEventListener('pointerdown',e=>{
  const h=e.target.closest('.as2-thread-resizer');if(!h)return;
  e.preventDefault();const tp=h.parentElement,wrap=tp.parentElement;let v=tp.getBoundingClientRect().width;
  document.documentElement.dataset.resizing='thread';h.setPointerCapture(e.pointerId);
  const move=ev=>{v=threadWidthApply(threadClamp(wrap,wrap.getBoundingClientRect().right-ev.clientX));};
  const up=()=>{h.removeEventListener('pointermove',move);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up);delete document.documentElement.dataset.resizing;threadWidthSave(v);};
  h.addEventListener('pointermove',move);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
});
document.addEventListener('dblclick',e=>{if(e.target.closest('.as2-thread-resizer')){threadWidthApply(null);threadWidthSave(null);}});
document.addEventListener('keydown',e=>{
  const h=e.target.closest?.('.as2-thread-resizer');if(!h||!['ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();const tp=h.parentElement;threadWidthSave(threadWidthApply(threadClamp(tp.parentElement,tp.getBoundingClientRect().width+(e.key==='ArrowLeft'?16:-16))));
});

// Project icons get a stable color per project name, so projects sharing an initial stay distinguishable.
function projectTone(name){const i=(typeof projectNames!=='undefined'?projectNames:[]).indexOf(name);if(i>=0)return i%6;let h=0;for(const ch of String(name))h=(h*31+ch.codePointAt(0))>>>0;return h%6;}  // known projects: by list order, so they never collide
function projectIconsDecorate(){document.querySelectorAll('.projecticon:not([data-tone])').forEach(el=>{
  const name=el.closest('[data-v]')?.dataset.v||(el.closest('.projectswitch, .sidehead')?s.project:'')||el.parentElement?.textContent.trim()||el.textContent;
  el.dataset.tone=projectTone(name);});}
let projectIconsQueued=false;
new MutationObserver(()=>{if(projectIconsQueued)return;projectIconsQueued=true;queueMicrotask(()=>{projectIconsQueued=false;projectIconsDecorate();});}).observe(document.body,{childList:true,subtree:true});
projectIconsDecorate();
