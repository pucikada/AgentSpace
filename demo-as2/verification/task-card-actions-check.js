(async()=>{
 const backup=abCopy(s),checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);},pause=()=>new Promise(r=>setTimeout(r,180));
 const clean=selector=>{const rows=[...document.querySelectorAll(selector)];return rows.length>0&&rows.every(e=>{const c=getComputedStyle(e);return c.borderTopWidth==='0px'&&c.boxShadow==='none'&&c.backgroundColor==='rgba(0, 0, 0, 0)';});};
 try{
  for(const personal of [true,false])for(const tab of ['schedule','event']){
   s.newTask=null;s.taskDetail=null;s.automationDetail=null;s.view=personal?'personal':'team';s.page=personal?'tasks':'board';s.project='AICS';s[personal?'personalBoard':'projectBoard']=newBoardState(personal);boardState().tab=tab;render();
   const name=(personal?'我的任务':'项目任务')+tab,cards=[...document.querySelectorAll('.automation-card')];check(name+'有规则卡片',cards.length>0);
   check(name+'所有开关默认常显',cards.every(c=>{const b=c.querySelector('.ac-card-switch'),r=c.getBoundingClientRect(),q=b.getBoundingClientRect();return getComputedStyle(b).opacity==='1'&&getComputedStyle(b).pointerEvents==='auto'&&q.top-r.top<20&&r.right-q.right<20;}));
   const card=cards[0],more=card.querySelector('.ac-more'),group=more.parentElement,r=card.getBoundingClientRect(),m=more.getBoundingClientRect();check(name+'更多默认隐藏且位于右下角',getComputedStyle(group).opacity==='0'&&r.right-m.right<20&&r.bottom-m.bottom<20);
   const height=r.height;more.focus();await pause();check(name+'聚焦显示且不改变卡片高度',getComputedStyle(group).opacity==='1'&&card.getBoundingClientRect().height===height);check(name+'操作容器无双层描边',clean('.ac-card-actions'));
   more.click();check(name+'更多菜单可用',!!document.querySelector('.as2-menu[data-for=ac]'));closeExtMenu();
   const rule=s.automations.find(a=>a.id===card.dataset.ruleId),enabled=rule.enabled;document.querySelector(`[data-a="automation-toggle"][data-v="${rule.id}"]`).click();check(name+'开关仍可切换',rule.enabled!==enabled);document.activeElement?.blur();
  }
  for(const style of ['classic','aurora','liquid','pixel','bento']){
   s.appearance.style=style;s.newTask=null;s.taskDetail=null;action('nav-personal','benches');s.personalTab='extensions';render();check(style+'主页扩展操作无外层描边',clean('.ext-item-actions'));
   action('nav-personal','spaces');assetAction('spx-tab','templates');check(style+'空间任务模板操作无外层描边',clean('.spx-resource>footer'));
  }
  return {passed:checks.length,checks};
 }finally{closeExtMenu();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();render();}
})()
