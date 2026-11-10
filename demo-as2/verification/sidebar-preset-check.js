(()=>{
 const backup=abCopy(s),checks=[],check=(n,v)=>{if(!v)throw Error(n);checks.push(n)};
 try{
  s.newTask=null;action('nav-personal','benches');s.personalTaskScope='all';
  const f=sideTaskFilterState();Object.assign(f,{status:'all',order:'todo'});
  check('待办优先排序',sideTaskFilterRows([{id:'old',status:'done',updatedAt:'2026-11-10T01:00:00Z'},{id:'todo',status:'wait',updatedAt:'2026-11-09T01:00:00Z'}])[0].id==='todo');
  f.order='updated';check('按更新时间倒序',sideTaskFilterRows([{id:'old',status:'wait',updatedAt:'2026-11-09T01:00:00Z'},{id:'new',status:'done',updatedAt:'2026-11-10T01:00:00Z'}])[0].id==='new');
  for(const status of ['running','wait','pending','done','failed','cancelled']){f.status=status;check('筛选 '+status,sideTaskFilterRows([{id:'target',status},{id:'other',status:'unknown'}]).length===1)}
  f.status='all';render();action('side-task-filter','mine');action('side-task-submenu','mine|status');
  check('不使用原生下拉',!document.querySelector('.side-task-scope-menu select'));
  check('状态二级面板在右侧',document.querySelector('.side-task-submenu').getBoundingClientRect().left>document.querySelector('.side-task-scope-menu').getBoundingClientRect().right);
  action('side-task-option','mine|status|pending');check('选项更新筛选状态',sideTaskFilterState().status==='pending');
  s.view='team';s.page='project';s.project=projectNames[0];render();action('side-task-filter','temp');action('side-task-submenu','temp|status');action('side-task-option','temp|status|wait');
  check('项目分区独立设置',sideTaskFilterState('temp').status==='wait'&&sideTaskFilterState('event').status==='all');
  action('side-task-filter','temp');check('项目内无跨项目范围筛选',!document.querySelector('[data-side-submenu=scope]'));closeExtMenu();
  s.bxScope='个人';action('studio','@home');action('ab-section','start');check('六个构建入口',document.querySelectorAll('.ab-start-card').length===6);
  action('ab-new','agentPreset');const d=abEnsure().editor;d.name='测试 Agent 预设';d.config.presetPrompt='先核对来源，再给结论';d.config.model='测试模型';check('可保存 Agent 预设',abStore(d));
  const x=abItems('agentPreset','个人').find(x=>x.name==='测试 Agent 预设');check('独立资产分类与快照',x&&x.history.length===1&&x.config.presetPrompt==='先核对来源，再给结论');
  check('预设对应资产 Tab',abEnsure().overviewType==='agentPreset');abOpen(x.id);check('预设重新编辑保留配置',document.querySelector('[data-ab-field="config.model"]').value==='测试模型');
  return {passed:checks.length,checks};
 }finally{closeExtMenu();closeModal();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();render()}
})()
