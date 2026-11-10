(async()=>{
 const backup=abCopy(s),checks=[];const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 try{
  s.newTask=null;s.view='personal';s.page='tasks';render();
  let page=document.querySelector('.demopage'),head=page.querySelector('.as-page-header');page.scrollTop=400;
  check('任务标题Tab筛选整体吸顶',head.children.length===3&&Math.abs(head.getBoundingClientRect().top-page.getBoundingClientRect().top)<2);
  s.view='team';s.page='board';render();page=document.querySelector('.demopage');head=page.querySelector('.as-page-header');page.scrollTop=400;
  check('项目任务整体吸顶',head.contains(page.querySelector('.board-main-tabs'))&&Math.abs(head.getBoundingClientRect().top-page.getBoundingClientRect().top)<2);
  s.bxScope='个人';abNew('task');page=document.querySelector('.ab-page');head=page.querySelector('.as-page-header');page.scrollTop=700;
  check('构建保存按钮吸顶',!!head.querySelector('[data-a="ab-save"]')&&Math.abs(head.getBoundingClientRect().top-page.getBoundingClientRect().top)<2);
  const labels=[...document.querySelectorAll('.ab-checks label')].filter(l=>l.querySelector('[data-ab-set$=".extensions"]'));
  check('扩展选项都有彩色图标',labels.length>0&&labels.every(l=>l.querySelector('.ab-extension-icon .icon')));
  const graph=abItems('graph','个人').find(x=>!x.draft);abUseForm(graph);
  check('默认图模板至少三项',ntcTemplates(newTaskDraft()).length>=3);
  newTaskMenu('executor');ntcPreview(graph.id);
  check('悬停详情显示资源池',!!document.querySelector('.ntc-template-preview .ab-graph-resources')||document.querySelector('.ntc-template-preview')?.textContent.includes('Master Agent'));
  ntcSelect('custom');ntcOpen();
  check('自定义图任务从空白开始',!ntcEditing.snapshot.id&&abGraphResources(ntcEditing.snapshot).length===0);
  ntcClose();
  return {passed:checks.length,checks};
 }finally{ntcClose();closeExtMenu();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);render();}
})()
