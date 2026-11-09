(()=>{
 const backup=abCopy(s),checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 const select=(id,value)=>{const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));};
 try{
  const p=joinedProjects()[0],p2=joinedProjects()[1];
  const task=(id,scope,owner='我',more={})=>({id:'QA-MY-'+id,title:'聚合验证 '+id,scope,owner,triggeredBy:'其他人',type:'temp',trigger:'manual',status:'pending',kind:'board',executor:'CodeAgent',goal:'验证任务汇聚',rev:1,...more});
  const fixtures=[task('personal','个人'),task('owned',p),task('triggered',p2,'其他人',{triggeredBy:'我'}),task('unrelated',p,'其他人'),task('forbidden','未加入的项目'),task('thread',p,'我',{origin:'thread',threadKey:'qa-thread'}),task('archive',p,'我',{archived:true})];s.tasks.push(...fixtures);
  s.newTask=null;s.taskDetail=null;s.personalBoard=newBoardState(true);action('nav-personal','tasks');
  const ids=()=>boardTasks().map(t=>t.id);
  check('汇聚个人任务',ids().includes('QA-MY-personal'));
  check('汇聚跨项目负责和触发任务',ids().includes('QA-MY-owned')&&ids().includes('QA-MY-triggered'));
  check('排除无关和无权限项目任务',!ids().includes('QA-MY-unrelated')&&!ids().includes('QA-MY-forbidden'));
  check('汇聚卡片显示项目归属',document.querySelector('[data-task-id="QA-MY-owned"] .tk-project-origin')?.textContent.includes(p));
  check('我的任务一级四个tab',[...document.querySelectorAll('.board-main-tabs button')].map(e=>e.dataset.v).join(',')==='runs,schedule,event,archive');
  check('触发筛选包含线程任务',!!document.querySelector('#boardTrigger option[value=thread]'));
  select('boardProject','personal');check('个人筛选仅个人任务',boardTasks().every(t=>t.scope==='个人'));
  select('boardProject','projects');check('项目筛选仅相关项目任务',boardTasks().length>0&&boardTasks().every(t=>t.scope!=='个人'&&personallyRelatedTask(t)));
  select('boardProject',p2);check('具体项目筛选',boardTasks().length>0&&boardTasks().every(t=>t.scope===p2));
  select('boardProject','all');select('boardRelation','triggered');check('与我关系筛选',ids().includes('QA-MY-triggered')&&!ids().includes('QA-MY-owned'));
  action('board-reset');select('boardTrigger','thread');check('线程筛选仅线程任务',ids().includes('QA-MY-thread')&&boardTasks().every(isCollaborationTask));
  select('boardTrigger','manual');check('手动筛选排除线程任务',ids().includes('QA-MY-owned')&&!ids().includes('QA-MY-thread'));
  action('board-reset');action('board-tab','archive');check('归档汇聚项目任务',ids().includes('QA-MY-archive'));
  delete s.personalTaskScope;render();
  const sideIds=()=>[...document.querySelectorAll('.side-sec[data-sec=mine] .side-task')].map(e=>e.dataset.v);
  check('侧栏统一为个人任务分区',!document.querySelector('.side-sec[data-sec=projects]')&&!!document.querySelector('[data-personal-task-scope]'));
  check('默认仅显示个人临时任务',document.querySelector('[data-personal-task-scope]').value==='personal'&&sideIds().includes('QA-MY-personal')&&sideIds().every(id=>{const t=s.tasks.find(t=>t.id===id);return t.scope==='个人'&&taskTrigger(t)==='manual'&&!isCollaborationTask(t);}));
  const sideScope=value=>{const el=document.querySelector('[data-personal-task-scope]');el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
  sideScope('all');check('个人和项目任务平铺',sideIds().includes('QA-MY-personal')&&sideIds().includes('QA-MY-owned')&&sideIds().includes('QA-MY-triggered')&&!document.querySelector('.side-task-project'));
  check('侧栏排除无关及归档任务',!sideIds().includes('QA-MY-unrelated')&&!sideIds().includes('QA-MY-archive'));
  sideScope(p);check('侧栏支持按项目筛选',sideIds().includes('QA-MY-owned')&&sideIds().every(id=>s.tasks.find(t=>t.id===id).scope===p));
  document.querySelector('.side-sec[data-sec=mine] [data-v="QA-MY-owned"]').click();check('平铺项目任务可打开详情',s.taskDetail==='QA-MY-owned'&&s.view==='personal');
  check('详情打开保留侧栏筛选',document.querySelector('[data-personal-task-scope]').value===p);s.taskDetail=null;
  sideScope('projects');check('全部项目筛选排除个人任务',sideIds().includes('QA-MY-owned')&&sideIds().includes('QA-MY-triggered')&&!sideIds().includes('QA-MY-personal'));
  sideScope('personal');check('可以切回个人临时任务',sideIds().includes('QA-MY-personal')&&!sideIds().includes('QA-MY-owned'));
  s.personalBoard.tab='collaboration';render();check('旧线程tab迁移到运行看板筛选',boardState().tab==='runs'&&boardState().trigger==='thread');
  s.view='team';s.page='board';s.project=p;render();check('项目任务统一四个tab',document.querySelectorAll('.board-main-tabs button').length===4);check('项目看板仍限定当前项目',boardTasks().every(t=>t.scope===p));select('boardTrigger','thread');check('项目运行看板支持线程筛选',boardTasks().length>0&&boardTasks().every(isCollaborationTask));select('boardTrigger','manual');check('项目临时筛选排除线程',boardTasks().length>0&&boardTasks().every(t=>!isCollaborationTask(t)&&taskTrigger(t)==='manual'));s.projectBoard.tab='collaboration';render();check('项目旧线程tab迁移到筛选',boardState().tab==='runs'&&boardState().trigger==='thread');
  action('nav-personal','benches');s.personalTab='overview';s.benchFilter='recent';render();check('主页工作台三个筛选',[...document.querySelectorAll('[data-a="bench-filter"]')].map(e=>e.textContent.trim()).join(',')==='全部,已收藏,已归档'&&s.benchFilter==='all');
  action('bench-filter','favorites');check('收藏筛选保留原有状态',!!document.querySelector('[data-a="bench-filter"][data-v=favorites].active'));
  action('personal-tab','extensions');check('主页扩展只读无导入开关菜单',!document.querySelector('.demoarea [data-a="ext-import"],.demoarea [data-a="ext-toggle"],.demoarea [data-a="ext-menu"]'));
  const card=document.querySelector('.demoarea [data-a="personal-ext-view"]');check('扩展可以查看详情',!!card);card.click();check('详情只读无可编辑配置',!!document.querySelector('.modal')&&!document.querySelector('.modal input,.modal select,.modal [data-a="ext-save-config"]'));
  document.querySelector('.modal [data-a="personal-ext-manage"]').click();check('管理入口跳转扩展页面',s.view==='extensions'&&s.extensionPage==='installed'&&s.extensionScope==='personal');
  const a=asset(s.installations[0].assetId);openImport(a.id);check('导入范围仅个人和指定项目',[...document.querySelectorAll('[name=importScope]')].map(e=>e.value).join(',')==='personal,project'&&importDraft.scope==='personal');
  action('ext-import-next');check('个人确认信息正确',document.querySelector('.ac-summary').textContent.includes('个人'));commitImport();check('个人导入成功',s.installations.some(i=>i.assetId===a.id&&i.scope==='personal'));
  openImport(a.id);importDraft.scope='project';importDraft.project=p;showImportWizard();action('ext-import-next');commitImport();check('项目导入成功',s.installations.some(i=>i.assetId===a.id&&i.scope==='project'&&i.project===p));
  openImport(a.id);importDraft.scope='global';const before=JSON.stringify(s.installations);commitImport();check('拒绝遗留全局导入草稿',JSON.stringify(s.installations)===before);closeModal();
  const legacy=document.querySelector('.legacy-version-link');check('Header旧版本入口指向1.0',legacy?.getAttribute('href')==='../demo-classic.html');
  return {passed:checks.length,checks};
 }finally{closeModal();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();render();}
})()
