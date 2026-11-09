// Keep page history separate from task, asset and preference data.
const anhEntries=[];
let anhIndex=-1,anhRestoring=false;
function anhRoute(){
  const keys=['view','page','newTask','taskDetail'],groups={personal:['personalPage','personalTab','personalSpaceId','spaceTab','selectedBench','benchTab'],team:['teamPage','project','channel','projectTab','channelTab','threadOpen','threadKey','threadTab','assetTab'],messages:['messageTab','activeConversation'],settings:['settingsSection'],extensions:['extensionPage','extensionType'],studio:['studioPage']};
  const route=Object.fromEntries([...keys,...(groups[s.view]||[])].map(k=>[k,s[k]]));
  if(s.view==='studio')route.buildEditor=abEnsure().editor;
  return route;
}
function anhKey(r){
  return JSON.stringify({...r,newTask:!!r.newTask,buildEditor:r.buildEditor?`${r.buildEditor.id||'new'}:${r.buildEditor.type}`:null});
}
function anhControls(){
  const brand=document.querySelector('.appbar .appbrand');if(!brand)return;
  if(!brand.querySelector('.anh-history'))brand.insertAdjacentHTML('beforeend',`<nav class="anh-history" aria-label="页面导航"><button class="iconbtn" data-a="anh-back" title="上一步" aria-label="上一步">${ico('back')}</button><button class="iconbtn" data-a="anh-forward" title="下一步" aria-label="下一步">${ico('back')}</button></nav>`);
  brand.querySelector('[data-a="anh-back"]').disabled=anhIndex<=0;
  brand.querySelector('[data-a="anh-forward"]').disabled=anhIndex>=anhEntries.length-1;
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
const anhPreviousRender=render,anhPreviousAction=action;
render=function(){const result=anhPreviousRender();anhRecord();return result;};
action=function(a,v){if(a==='anh-back'||a==='anh-forward'){anhGo(a==='anh-back'?-1:1);return;}return anhPreviousAction(a,v);};
// Apply the newly requested default once; later theme choices remain saved.
if(!s.auroraLightBlueDefault){s.appearance={...appearanceConfig(),style:'aurora',color:'blue'};Object.assign(settingsConfig(),{auroraMode:'light',auroraAccent:'#3F6BFF'});s.auroraLightBlueDefault=true;save();}
render();
