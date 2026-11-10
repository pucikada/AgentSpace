(async()=>{
 const backup=abCopy(s),checks=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 try{
  s.newTask=null;action('nav-personal','tasks');
  check('个人任务显示新建入口',!!document.querySelector('[data-a="task-create-menu"]'));
  action('task-create-menu');check('新建菜单提供三种任务',document.querySelectorAll('.task-create-menu button').length===3);
  action('task-create-rule','schedule');check('个人定时任务弹窗归属个人',!!document.querySelector('#autoName')&&automationDraft.project==='个人');closeModal();
  s.view='team';s.page='board';s.project=projectNames[0];render();
  check('项目任务显示新建入口',!!document.querySelector('[data-a="task-create-menu"]'));
  action('task-create-rule','event');check('项目事件任务弹窗归属当前项目',automationDraft.project===s.project&&!!document.querySelector('#autoEventSource'));closeModal();
  newTaskOpen();check('移除默认提示词入口',!document.querySelector('.nt-shortcut'));
  check('规则入口为紧凑横向比例',[...document.querySelectorAll('.nt-create-options button')].every(e=>e.offsetHeight<85&&e.offsetWidth>e.offsetHeight*2));
  check('托盘移除独立配置按钮',!document.querySelector('.nt-tray [data-a="ntc-edit"]'));
  check('输入框下两类规则入口',document.querySelectorAll('.nt-create-options button').length===2);
  check('三类执行方式',document.querySelectorAll('.nt-mode button').length===3);
  action('nt-mode','graph');check('图任务独立配置',ntcEnsure().type==='workflow'&&ntcEnsure().taskShape==='graph');
  action('nt-mode','workflow');check('链式配置与图配置分开',ntcEnsure().taskShape!=='graph');
  action('nt-mode','graph');ntcOpen();check('图任务配置抽屉',document.querySelector('#ntcDrawer h2').textContent==='图任务配置');ntcClose();
  const project=newTaskDraft().project;action('task-create-rule','schedule');check('输入页可打开定时弹窗并保留归属',automationDraft.project===project&&!!document.querySelector('#autoFrequency'));closeModal();
  s.newTask=null;action('studio','@home');action('ab-section','start');
  check('构建默认侧栏可见',getComputedStyle(document.querySelector('.demoside')).display!=='none'&&!document.querySelector('#demo').hasAttribute('data-solo'));
  check('侧栏包含开始构建和两个资产子菜单',document.querySelectorAll('.ab-navigation button').length===3&&!!document.querySelector('.ab-assets-children'));
  const buildWidth=document.querySelector('.demoside').offsetWidth;action('nav-personal','benches');check('构建侧栏与个人页同宽',document.querySelector('.demoside').offsetWidth===buildWidth);action('studio','@home');action('ab-section','start');
  check('开始构建六个入口',document.querySelectorAll('.ab-start-card').length===6);
  action('ab-section','assets');action('ab-catalog-group','templates');check('任务模板展示三类',document.querySelectorAll('.ab-overview-types button').length===3&&document.querySelector('.ab-heading h1').textContent==='任务模板');
  check('去掉顶部统一创建',!document.querySelector('.ab-heading [data-a="ab-create-menu"]'));
  check('各分类有对应创建入口',document.querySelector('.ab-catalog-actions button').dataset.v===abEnsure().overviewType);
  check('资产二级范围保留',document.querySelectorAll('.ab-overview-scopes [role="tab"]').length===3);
  action('ab-catalog-group','dependencies');check('任务依赖展示三类',document.querySelectorAll('.ab-overview-types button').length===3&&document.querySelector('.ab-heading h1').textContent==='任务依赖');action('ab-overview-type','env');check('运行环境模板独立列表',document.querySelectorAll('.ab-overview-grid>.ab-side-card').length===abItems('env').length);
  action('ab-overview-type','instance');check('运行环境实例独立列表',document.querySelectorAll('.ab-overview-grid>.ab-side-card').length===abItems('instance').length);check('实例分类对应新建入口',document.querySelector('.ab-catalog-actions button').dataset.v==='instance');
  action('ab-new','env');check('新建运行环境模板',document.querySelector('.ab-heading h1').textContent==='新建运行环境模板');action('ab-new','instance');check('新建运行环境实例',document.querySelector('.ab-heading h1').textContent==='新建运行环境实例');
  action('ab-new','graph');const d=abEnsure().editor;d.name='依赖检查';const a=d.stages[0].steps[0];Object.assign(a,{name:'入口',source:'inline',input:'读取资料'});
  const b={...abStep(),name:'汇总',source:'inline',input:'生成结果',dependsOn:[a.id]};d.stages[0].steps.push(b);
  check('合法图依赖可发布',abValidate(d).length===0);
  b.dependsOn=['deleted-node'];check('删除依赖后阻止发布',abValidate(d).some(e=>e.includes('依赖节点')));b.dependsOn=[a.id];
  abStore(d,{draft:true});check('图模板独立归类',abItems('graph').some(x=>x.name==='依赖检查')&&!abItems('workflow').some(x=>x.name==='依赖检查'));
  s.view='team';s.page='channel';s.channel='IM能力构建';s.newTask=null;render();check('频道头部移除创建频道按钮',!document.querySelector('.co-heading-people [data-a="project-channel-new"]'));
  return {passed:checks.length,checks};
 }finally{ntcClose();closeModal();closeExtMenu();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();render();}
})()
