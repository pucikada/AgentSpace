(async()=>{
 const backup=abCopy(s),checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);},pause=()=>new Promise(r=>setTimeout(r,220));
 try{
  s.newTask=null;s.taskDetail=null;s.automationDetail=null;closeModal();
  for(const personal of [true,false]){
   const scope=personal?'个人':'项目';
   if(personal)action('nav-personal','spaces');else{s.view='team';s.project='AgentSpace 2.0';action('project-assets');}
   assetAction('spx-tab','environment');assetAction('spx-environment','templates');await pause();
   const card=document.querySelector('.spx-env-card'),footer=card?.querySelector('footer');
   check(scope+'环境模板可查看',!!card);
   check(scope+'卡片只提供查看详情',footer.querySelectorAll('button').length===1&&footer.querySelector('button').dataset.a==='spx-detail'&&footer.textContent==='查看详情'&&!card.querySelector('[data-a=spx-edit]'));
   check(scope+'卡片间距由自身控制',getComputedStyle(card).padding==='20px'&&getComputedStyle(card).gap==='0px');
   check(scope+'标题与元信息有分组间距',card.querySelector('.spx-env-summary').getBoundingClientRect().top-card.querySelector('.spx-env-card-head').getBoundingClientRect().bottom>=15);
   check(scope+'操作按钮不占默认布局空间',getComputedStyle(footer).position==='absolute');
   const id=card.dataset.v;footer.querySelector('button').click();
   check(scope+'详情为只读',!!document.querySelector('#modalHost .modal')&&!document.querySelector('#modalHost input,#modalHost textarea,#modalHost select'));
   const edit=document.querySelector('#modalHost [data-a=spx-edit]');
   check(scope+'编辑引导到构建页',edit?.textContent.includes('前往构建编辑'));
   edit.click();check(scope+'构建页编辑对应模板',s.view==='studio'&&abEnsure().editor?.id===id&&!document.querySelector('#modalHost .modal'));
   abEnsure().editor=null;
  }
  return {passed:checks.length,checks};
 }finally{Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);render();save();}
})()
