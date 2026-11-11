// Keep page history separate from task, asset and preference data.
function secondaryNavDefs(){return {
 personal:[['nav:benches','我的主页','bench'],['nav:new-task','新建任务','plus'],['nav:tasks','我的任务','task'],['nav:spaces','我的空间','book'],['nav:discover','发现与订阅','discover'],['nav:assistant','个人助理','spark']],
 project:[['nav:project','项目主页','home'],['nav:new-task','新建任务','plus'],['nav:board','项目任务','task'],['nav:assets','项目空间','folderOpen']]
};}
function secondaryNavConfig(scope){
 const ids=secondaryNavDefs()[scope].map(([id])=>id),saved=s.settings?.secondaryNav?.[scope]||{};
 const order=[...(saved.order||[]).filter(id=>ids.includes(id))];
 ids.forEach(id=>{if(!order.includes(id))order.push(id)});
 return {order,hidden:(saved.hidden||[]).filter(id=>id!==ids[0]&&ids.includes(id))};
}
function secondaryNavItems(scope,items){
 const cfg=secondaryNavConfig(scope),byId=new Map(items.map(item=>[item.key,item]));
 return cfg.order.filter(id=>!cfg.hidden.includes(id)&&byId.has(id)).map(id=>byId.get(id));
}
function secondaryNavSettingsHtml(){
 const pane=scope=>{
  const cfg=secondaryNavConfig(scope),defs=new Map(secondaryNavDefs()[scope].map(([id,label,icon])=>[id,{label,icon}]));
  return `<section class="sps-secondary-card" data-snav-scope="${scope}"><header><h5>${scope==='personal'?'个人面板':'项目面板'}</h5><small>${scope==='personal'?'仅影响「个人」侧栏':'应用于所有项目侧栏'}</small></header><div class="sps-secondary-list">${cfg.order.map((id,i)=>{const {label,icon}=defs.get(id),home=id===secondaryNavDefs()[scope][0][0],visible=!cfg.hidden.includes(id);return `<div class="sps-secondary-row ${visible?'':'is-hidden'}" data-snav-id="${id}" draggable="true"><span class="sps-secondary-grip" aria-hidden="true">⠿</span>${ico(icon)}<b>${label}</b><button class="iconbtn" data-a="secondary-nav-up" data-v="${scope}|${id}" aria-label="上移${label}" ${i===0?'disabled':''}>${ico('up')}</button><button class="iconbtn" data-a="secondary-nav-down" data-v="${scope}|${id}" aria-label="下移${label}" ${i===cfg.order.length-1?'disabled':''}>${ico('down')}</button>${home?'<small>始终显示</small>':`<button class="as2-switch" role="switch" aria-checked="${visible}" aria-label="显示${label}" data-a="secondary-nav-toggle" data-v="${scope}|${id}"><i></i></button>`}</div>`}).join('')}</div></section>`;
 };
 return `<div class="settings-group sps-secondary-settings"><h4>二级导航 · 面板栏目</h4><p class="settings-note">按个人和项目分别调整顶部栏目。拖动或使用上下按钮排序，关闭开关可隐藏栏目；主页始终显示，也可调整位置。</p><div class="sps-secondary-grid">${pane('personal')}${pane('project')}</div></div>`;
}
const secondaryPreviousSettingsAction=settingsAction;
settingsAction=function(a,v){
 if(!a.startsWith('secondary-nav-'))return secondaryPreviousSettingsAction(a,v);
 const [scope,id]=v.split('|');if(!secondaryNavDefs()[scope]?.some(([key])=>key===id))return true;
 const cfg=secondaryNavConfig(scope),i=cfg.order.indexOf(id);
 if(a==='secondary-nav-toggle'){if(id===secondaryNavDefs()[scope][0][0])return true;cfg.hidden=cfg.hidden.includes(id)?cfg.hidden.filter(key=>key!==id):[...cfg.hidden,id];}
 else{const next=i+(a==='secondary-nav-up'?-1:1);if(i>=0&&next>=0&&next<cfg.order.length)[cfg.order[i],cfg.order[next]]=[cfg.order[next],cfg.order[i]];}
 s.settings.secondaryNav={...(s.settings.secondaryNav||{}),[scope]:cfg};save();openSettings('nav');return true;
};
let secondaryNavDrag=null;
document.addEventListener('dragstart',e=>{const row=e.target.closest?.('.sps-secondary-row[draggable="true"]');if(!row)return;secondaryNavDrag={scope:row.closest('[data-snav-scope]').dataset.snavScope,id:row.dataset.snavId};e.dataTransfer?.setData('text/plain',row.dataset.snavId);});
document.addEventListener('dragover',e=>{const row=e.target.closest?.('.sps-secondary-row');if(secondaryNavDrag&&row?.closest('[data-snav-scope]').dataset.snavScope===secondaryNavDrag.scope&&row.dataset.snavId!==secondaryNavDrag.id)e.preventDefault();});
document.addEventListener('drop',e=>{const row=e.target.closest?.('.sps-secondary-row');if(!secondaryNavDrag||!row||row.closest('[data-snav-scope]').dataset.snavScope!==secondaryNavDrag.scope)return;e.preventDefault();const {scope,id}=secondaryNavDrag;secondaryNavDrag=null;const cfg=secondaryNavConfig(scope),from=cfg.order.indexOf(id),to=cfg.order.indexOf(row.dataset.snavId);if(from<0||to<0||from===to)return;cfg.order.splice(from,1);cfg.order.splice(to,0,id);s.settings.secondaryNav={...(s.settings.secondaryNav||{}),[scope]:cfg};save();openSettings('nav');});
document.addEventListener('dragend',()=>{secondaryNavDrag=null;});

const anhEntries=[];
let anhIndex=-1,anhRestoring=false;
function anhRoute(){
  const keys=['view','page','newTask','taskDetail','automationDetail'],groups={personal:['personalPage','personalTab','personalSpaceId','spaceTab','selectedBench','benchTab'],team:['teamPage','project','channel','projectTab','channelTab','threadOpen','threadKey','threadTab','assetTab'],messages:['messageTab','activeConversation'],settings:['settingsSection'],extensions:['extensionPage','extensionType'],studio:['studioPage']};
  const route=Object.fromEntries([...keys,...(groups[s.view]||[])].map(k=>[k,s[k]]));
  if(s.view==='studio')route.buildEditor=abEnsure().editor;
  return route;
}
function anhKey(r){
  return JSON.stringify({...r,newTask:!!r.newTask,buildEditor:r.buildEditor?`${r.buildEditor.id||'new'}:${r.buildEditor.type}`:null});
}
function anhControls(){
  const search=document.querySelector('.appbar .appsearch');if(!search)return;
  let group=search.closest('.anh-search-group');if(!group){group=document.createElement('div');group.className='anh-search-group';search.before(group);group.appendChild(search);}
  if(!group.querySelector('.anh-history'))group.insertAdjacentHTML('afterbegin',`<nav class="anh-history" aria-label="页面导航"><button class="iconbtn" data-a="anh-back" title="上一步" aria-label="上一步">${ico('back')}</button><button class="iconbtn" data-a="anh-forward" title="下一步" aria-label="下一步">${ico('back')}</button></nav>`);
  group.querySelector('[data-a="anh-back"]').disabled=anhIndex<=0;
  group.querySelector('[data-a="anh-forward"]').disabled=anhIndex>=anhEntries.length-1;
}
function anhRecord(){
  const route=anhRoute(),key=anhKey(route);
  if(!anhRestoring&&key!==anhEntries[anhIndex]?.key){anhEntries.splice(anhIndex+1);anhEntries.push({key,route});anhIndex=anhEntries.length-1;}
  else if(anhIndex>=0)anhEntries[anhIndex]={key,route};
  anhControls();
}
function anhGo(delta){
  const next=anhIndex+delta;if(next<0||next>=anhEntries.length)return;
  anhIndex=next;const {buildEditor,...route}=anhEntries[next].route;
  anhRestoring=true;
  try{closeModal();closeExtMenu();if(typeof ntcClose==='function')ntcClose();Object.assign(s,route);if(s.view==='studio'){abEnsure().editor=buildEditor||null;if(buildEditor)abRevealSidebar();abRender();}else render();}finally{anhRestoring=false;}
}
// Keep each page's title, tabs and filters in one sticky region.
function anhStickyHeaders(){
 document.querySelectorAll('.demoarea .demopage,.sps-settings-content').forEach(page=>{
  const surface=page.querySelector(':scope>.spx-page')||page;
  if(surface.querySelector(':scope>.as-page-header'))return;
  const nodes=[...surface.children];let first=nodes.findIndex(n=>n.matches('.demohead,.proj-sticky,.ab-heading'));
  if(first<0)return;
  const group=[];
  for(let i=first;i<nodes.length;i++){
   const n=nodes[i];if(i!==first&&!n.matches('.dtabs,.dtoolbar,.aggregate-filters,.ab-overview-types,.ab-overview-toolbar, .spx-tabs,.spx-toolbar,.spx-section,.spx-list-tools'))break;
   group.push(n);
  }
  const header=document.createElement('div');header.className='as-page-header';group[0].before(header);group.forEach(n=>header.appendChild(n));
  const style=getComputedStyle(page);header.style.setProperty('--page-inset-x',style.paddingLeft);header.style.setProperty('--page-inset-y',style.paddingTop);
  let backdrop=page;while(backdrop){const color=getComputedStyle(backdrop).backgroundColor;if(color!==asColor('--as-color-transparent')&&color!==asColor('--as-color-rgba-0-0-0-0')){header.style.setProperty('--page-header-bg',color);break;}backdrop=backdrop.parentElement;}
 });
}
const anhPreviousRender=render,anhPreviousAction=action;
render=function(){const result=anhPreviousRender();anhStickyHeaders();anhRecord();return result;};
action=function(a,v){if(a==='anh-back'||a==='anh-forward'){anhGo(a==='anh-back'?-1:1);return;}return anhPreviousAction(a,v);};
// Apply the newly requested default once; later theme choices remain saved.
if(!s.auroraLightBlueDefault){s.appearance={...appearanceConfig(),style:'aurora',color:'blue'};Object.assign(settingsConfig(),{auroraMode:'light',auroraAccent:asColor('--as-color-aurora-blue')});s.auroraLightBlueDefault=true;save();}
// Each visit starts at My Home; navigation within the session remains unchanged.
Object.assign(s,{view:'personal',page:'benches',personalPage:'benches',newTask:null,taskDetail:null,automationDetail:null});

render();
