(()=>{
 const backup=abCopy(s),checks=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 try{
  s.newTask=null;action('studio','@home');s.bxScope='个人';
  check('Agent 示例按范围隔离',abItems('agentPreset','个人').length>=3&&abItems('agentPreset','个人').every(a=>a.scope==='个人'));
  abNew('agentPreset');let d=abEnsure().editor;d.name='预设字段验证';d.config.agentUnit='QA Agent';d.config.presetPrompt='核验来源';
  check('预设字段包含执行单元',!!document.querySelector('[data-ab-field="config.agentUnit"]'));
  check('预设不展示环境或准出',!document.querySelector('[data-ab-field="config.environment.mode"],[data-ab-field="config.ownerMode"]'));
  check('预设可保存',abStore(d));const preset=abItems('agentPreset','个人').find(x=>x.name==='预设字段验证');
  check('预设版本快照保留字段',preset.history[0].snapshot.config.agentUnit==='QA Agent'&&preset.config.presetPrompt==='核验来源');
  abNew('env');d=abEnsure().editor;d.name='环境字段验证';d.config.image='test:20';d.config.path='/workspace/demo';d.config.init='npm ci';
  check('环境不展示工具字段',!document.querySelector('[data-ab-set="config.tools"],[data-ab-set="config.toolsets"]'));
  check('环境可保存',abStore(d));const env=abItems('env','个人').find(x=>x.name==='环境字段验证');
  abNew('instance');d=abEnsure().editor;d.name='实例字段验证';d.sourceMode='template';d.templateId=env.id;d.templateVersion=env.version;d.config=abCopy(env.config);
  check('实例可创建',abStore(d));const instance=abItems('instance','个人').find(x=>x.name==='实例字段验证');
  check('实例有状态时间与来源',instance.status==='运行中'&&!!instance.createdAt&&instance.templateId===env.id&&instance.config.path==='/workspace/demo');
  env.config.path='/changed';check('实例配置独立于模板',instance.config.path==='/workspace/demo');
  abAction('ab-instance-stop',instance.id);check('停止实例保留快照',instance.status==='已停止'&&instance.config.image==='test:20');
  abNew('graph');d=abEnsure().editor;d.name='图资源验证';const atom=abItems('task','个人').find(a=>!a.draft),original=JSON.stringify(atom);
  check('图编辑器不再编排阶段',!document.querySelector('.ab-stage-track')&&document.querySelectorAll('[data-ab-graph-resource]').length>0);
  check('空资源池阻止发布',abValidate(d).some(e=>e.includes('至少一个')));
  abGraphToggle(d,atom.id,true);const ref=d.resources[0];check('选择固定原子版本快照',ref.version===atom.version&&ref.snapshot.id===atom.id);
  check('图资源可发布',abStore(d));const graph=abItems('graph','个人').find(x=>x.name==='图资源验证');
  check('图版本保存资源池',graph.history[0].snapshot.resources.length===1);
  abUseForm(graph);check('使用图模板打开输入页',newTaskDraft().executorType==='graph'&&newTaskDraft().ntc.id===graph.id);
  check('预览展示 Master Agent',ntcSummary(ntcEnsure()).includes('Master Agent')&&!ntcSummary(ntcEnsure()).includes('前置节点'));
  ntcOpen();check('图抽屉展示资源池',!!document.querySelector('[data-ntc-graph-resource]')&&!document.querySelector('.ntc-stage'));
  ntcClose();newTaskDraft().goal='核验一次变更';newTaskCreate();const task=s.tasks.at(-1);
  check('图任务由 Master Agent 负责',task.executor==='Master Agent'&&task.executorType==='graph');
  check('运行前不预创建原子实例',task.environmentIds.length===0&&task.graphRun.dispatches.length===0&&task.seriesDefinition.resources.length===1);
  check('任务配置不修改原子模板',JSON.stringify(atom)===original);
  action('nav-personal','spaces');check('个人空间顺序与移除环境变量',spxTabs(true).map(x=>x[0]).join('|')==='templates|environment|knowledge');
  assetAction('spx-tab','environment');check('任务依赖包含预设',document.querySelector('.asset-subtabs').textContent.includes('Agent 预设模板'));
  assetAction('spx-environment','templates');check('模板卡片有代码仓与启动路径',[...document.querySelectorAll('.spx-env-card')].every(e=>e.textContent.includes('启动路径')&&e.textContent.includes('代码仓')));
  assetAction('spx-environment','instances');check('实例列表有状态创建时间',document.querySelector('.spx-page thead').textContent.includes('创建时间'));
  s.view='team';s.project=projectNames[0];action('project-assets');check('项目空间顺序',spxTabs(false).map(x=>x[0]).join('|')==='templates|environment|knowledge|repos');
  assetAction('spx-tab','environment');check('项目依赖正常渲染',!!document.querySelector('.spx-page'));
  return {passed:checks.length,checks};
 }finally{ntcClose();closeModal();closeExtMenu();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();render();}
})()
