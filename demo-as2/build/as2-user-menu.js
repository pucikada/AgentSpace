// Pointer state owns flyout visibility; fitting runs once per panel, not on every child hover.
(function(){
  if(typeof userMenuOpen!=='function'||typeof userMenuRefresh!=='function')return;
  const closing=new WeakMap();let switchTimer=null,pendingStyle=null;
  const directFly=owner=>owner?.querySelector(':scope > .um-fly');
  function cancel(owner){clearTimeout(closing.get(owner));closing.delete(owner);}
  function cancelSwitch(){clearTimeout(switchTimer);switchTimer=null;pendingStyle=null;}
  function close(owner){if(!owner)return;delete owner.dataset.umOpen;owner.querySelector(':scope > button')?.setAttribute('aria-expanded','false');}
  function later(owner){if(!owner||closing.has(owner))return;closing.set(owner,setTimeout(()=>{close(owner);closing.delete(owner);},240));}
  function fit(owner){
    const fly=directFly(owner);if(!fly||fly.dataset.umFitted||getComputedStyle(fly).display==='none')return;
    fly.style.top='-6px';fly.style.maxHeight=(innerHeight-18)+'px';fly.style.overflowY=fly.classList.contains('um-fly2')?'auto':'visible';fly.style.removeProperty('left');
    let r=fly.getBoundingClientRect();
    if(r.right>innerWidth-8){fly.style.setProperty('left',(-r.width-10)+'px','important');r=fly.getBoundingClientRect();}
    const shift=Math.max(9-r.top,Math.min(0,innerHeight-9-r.bottom));
    if(shift)fly.style.top=(-6+shift)+'px';
    fly.dataset.umFitted='true';
  }
  function activate(owner){
    if(!owner)return;cancel(owner);
    for(const sibling of owner.parentElement.children)if(sibling!==owner&&sibling.matches('.um-item,.um-style')){cancel(sibling);close(sibling);}
    owner.dataset.umOpen='true';owner.querySelector(':scope > button')?.setAttribute('aria-expanded','true');fit(owner);
  }
  function safe(owner,event){
    if(!owner)return false;if(owner.contains(event.target))return true;
    const fly=directFly(owner);if(!fly||!owner.dataset.umOpen)return false;
    const panel=fly.getBoundingClientRect(),row=owner.querySelector(':scope > button').getBoundingClientRect(),x=event.clientX,y=event.clientY;
    if(x>=panel.left&&x<=panel.right&&y>=panel.top&&y<=panel.bottom)return true;
    const left=panel.left>=row.right?row.right:panel.right,right=panel.left>=row.right?panel.left:row.left;
    return x>=left-1&&x<=right+1&&y>=Math.min(row.top,panel.top)&&y<=Math.max(row.bottom,panel.bottom);
  }
  function manage(){const menu=document.querySelector('.user-menu');menu?.classList.add('um-managed');return menu;}
  function pointer(event){
    const menu=manage();if(!menu)return;const target=event.target;
    const group=target.closest?.('.um-item'),currentGroup=menu.querySelector('.um-item[data-um-open]');
    if(group&&menu.contains(group))activate(group);else if(safe(currentGroup,event))cancel(currentGroup);else later(currentGroup);
    const style=target.closest?.('.um-style'),current=menu.querySelector('.um-item[data-um-open] .um-style[data-um-open]');
    if(style&&menu.contains(style)){
      if(!current||style===current){cancelSwitch();activate(style);}
      else if(pendingStyle!==style){cancelSwitch();pendingStyle=style;switchTimer=setTimeout(()=>{if(style.isConnected)activate(style);cancelSwitch();},150);}
    }else{
      cancelSwitch();if(safe(current,event))cancel(current);else later(current);
    }
  }
  const open=userMenuOpen,refresh=userMenuRefresh;
  userMenuOpen=function(){cancelSwitch();open();manage();};
  userMenuRefresh=function(){
    const menu=document.querySelector('.user-menu'),group=menu?.querySelector('.um-item[data-um-open] > button')?.dataset.v,style=menu?.querySelector('.um-style[data-um-open] > button')?.dataset.v;
    cancelSwitch();refresh();const next=manage();if(!next)return;
    if(group)activate(next.querySelector(`[data-a="user-group"][data-v="${CSS.escape(group)}"]`)?.parentElement);
    if(style)activate(next.querySelector(`[data-a="user-style"][data-v="${CSS.escape(style)}"]`)?.parentElement);
  };
  if(typeof userFlyFit==='function')userFlyFit=fit;
  document.addEventListener('pointermove',pointer);
  document.addEventListener('focusin',event=>{
    const menu=manage();if(!menu?.contains(event.target))return;cancelSwitch();activate(event.target.closest('.um-item'));activate(event.target.closest('.um-style'));
  });
  document.addEventListener('pointerdown',event=>{
    if(!event.target.closest?.('.user-menu'))return;activate(event.target.closest('.um-item'));activate(event.target.closest('.um-style'));
  });
})();
