// Keep page history separate from task, asset and preference data.
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
  let backdrop=page;while(backdrop){const color=getComputedStyle(backdrop).backgroundColor;if(color!=='transparent'&&color!=='rgba(0, 0, 0, 0)'){header.style.setProperty('--page-header-bg',color);break;}backdrop=backdrop.parentElement;}
 });
}
const anhPreviousRender=render,anhPreviousAction=action;
render=function(){const result=anhPreviousRender();anhStickyHeaders();anhRecord();return result;};
action=function(a,v){if(a==='anh-back'||a==='anh-forward'){anhGo(a==='anh-back'?-1:1);return;}return anhPreviousAction(a,v);};
// Apply the newly requested default once; later theme choices remain saved.
if(!s.auroraLightBlueDefault){s.appearance={...appearanceConfig(),style:'aurora',color:'blue'};Object.assign(settingsConfig(),{auroraMode:'light',auroraAccent:'#3F6BFF'});s.auroraLightBlueDefault=true;save();}
// Each visit starts at My Home; navigation within the session remains unchanged.
Object.assign(s,{view:'personal',page:'benches',personalPage:'benches',newTask:null,taskDetail:null,automationDetail:null});

render();
