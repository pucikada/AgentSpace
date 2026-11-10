(()=>{
  const backup=abCopy(s),checks=[];
  const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
  const field=(key,value)=>{const e=document.querySelector(`[data-ntc-field="${key}"]`);e.value=value;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
  try{
    s.newTask=null;action('nav-personal','spaces');
    check('个人空间三个资源分类',document.querySelectorAll('.spx-page>.asset-tabs button').length===3);
    for(const tab of ['knowledge','environment','templates']){assetAction('spx-tab',tab);check('个人 '+tab,!!document.querySelector('.spx-page'));}
    check('任务模板复用构建数据',document.querySelectorAll('.spx-resource').length===abItems(spxState().kind,'个人').length);
    s.view='team';s.project=projectNames[0];action('project-assets');
    check('项目空间四个资源分类',document.querySelectorAll('.spx-page>.asset-tabs button').length===4);
    assetAction('spx-tab','repos');check('代码仓字段',document.querySelector('.spx-page th').textContent==='代码仓');
    assetAction('spx-repo-edit','');assetAction('spx-repo-save','');check('代码仓必填校验',!!document.querySelector('#spxRepoError').textContent);
    document.querySelector('#spxRepoName').value='联调仓库';document.querySelector('#spxRepoUrl').value='https://code.example.com/qa';assetAction('spx-repo-save','');
    check('代码仓可保存',spxState().repos.some(r=>r.name==='联调仓库'));
    assetAction('spx-tab','environment');assetAction('spx-environment','instances');
    check('实例字段', [...document.querySelectorAll('.spx-page th')].map(e=>e.textContent).join('|')==='运行环境实例|来源模板|关联任务|状态|创建时间|操作');
    action('nav-personal','benches');action('nt-open');const atom=ntcTemplates(newTaskDraft())[0],original=JSON.stringify(atom);
    check('候选按当前范围过滤',ntcTemplates(newTaskDraft()).every(x=>x.scope==='个人'));
    ntcSelect(atom.id);ntcOpen();field('config.presetPrompt','取消测试');ntcClose();check('取消保持原快照',newTaskDraft().ntc.config.presetPrompt===atom.config.presetPrompt);
    ntcOpen();field('config.presetPrompt','独立任务提示词');
    const box=document.querySelector('[data-ntc-set="config.extensions"]');
    if(box){const id=box.value,old=ntcEditing.snapshot.config.extensions.includes(id);box.checked=!old;box.dispatchEvent(new Event('input',{bubbles:true}));box.dispatchEvent(new Event('change',{bubbles:true}));check('扩展勾选只切换一次',ntcEditing.snapshot.config.extensions.includes(id)!==old);}
    newTaskAction('ntc-apply','');check('应用独立配置',newTaskDraft().ntc.config.presetPrompt==='独立任务提示词'&&!ntcEditing);
    check('未改原模板',JSON.stringify(abGet(atom.id))===original);
    newTaskDraft().goal='联调原子任务';newTaskCreate();let t=s.tasks.find(t=>t.title==='联调原子任务');
    check('模板来源固定',t.templateId===atom.id&&t.templateVersion===atom.version);
    check('提示词拼接',t.finalPrompt==='独立任务提示词\n\n---\n\n联调原子任务');
    check('临时环境不进入空间列表',t.environments.every(e=>e.temporary&&!abItems('instance','个人').some(i=>i.id===e.id)));
    action('nt-open');ntcSelect('custom');ntcOpen();field('config.model','联调模型');newTaskAction('ntc-apply','');newTaskDraft().goal='联调自定义任务';newTaskCreate();t=s.tasks.find(t=>t.title==='联调自定义任务');
    check('不使用模板也能创建',!t.templateId&&t.config.model==='联调模型');
    action('nt-open');newTaskAction('nt-mode','workflow');ntcSelect('custom');ntcOpen();abAllSteps(ntcEditing.snapshot)[0].input='分析输入';
    newTaskAction('ntc-step-add',ntcEditing.snapshot.stages[0].id);abAllSteps(ntcEditing.snapshot)[1].input='形成结果';
    newTaskAction('ntc-apply','');check('自定义串联配置',!ntcEditing&&abAllSteps(newTaskDraft().ntc).length===2);
    const series=abCopy(newTaskDraft().ntc);series.id='qa-series-template';series.version=1;series.name='联调串联模板';series.templateOwner=abUser();series.draft=false;abEnsure().assets.push(series);
    ntcSelect(series.id);newTaskMenu('executor');ntcPreview(series.id);check('串联模板可预览',document.querySelectorAll('.ntc-preview-steps section').length===1);
    ntcOpen(series.id);field('step.name','本次步骤名称');newTaskAction('ntc-apply','');newTaskDraft().goal='联调串联任务';newTaskCreate();t=s.tasks.find(t=>t.title==='联调串联任务');
    check('串联模板独立快照',t.templateId===series.id&&t.seriesDefinition.stages[0].steps[0].name==='本次步骤名称');
    check('串联不覆盖模板',abGet(series.id).stages[0].steps[0].name==='步骤 1');
    action('nt-open');ntcSelect('custom');const invalid=abCopy(ntcEnsure());invalid.config.agentType='zero';invalid.config.environmentOverride={...abDefaults(),location:'本地'};
    check('本地不兼容校验',ntcValidate(invalid).some(e=>e.includes('codeagent')));
    s.newTask=null;s.personalTab='overview';s.benchList=false;action('nav-personal','benches');homeBenchAction('bench-card-menu',s.benches.find(b=>!b.isDefault).id);
    check('工作台菜单去重',document.querySelectorAll('.bench-card-menu [role=menuitem]').length===3);closeExtMenu();
    check('打开工作台主按钮',document.querySelector('.bench-card-actions>.btn').classList.contains('primary'));
    const more=document.querySelector('.bench-card-actions>.iconbtn');
    check('更多按钮有底色',getComputedStyle(more).backgroundColor!=='rgba(0, 0, 0, 0)');
    check('收藏黄色填充',getComputedStyle(document.querySelector('.star.on svg')).fill==='rgb(233, 172, 19)');
    check('侧栏工作台图标',!!document.querySelector('.side-bench-icon svg'));
    action('bench-view-set','list');check('图标 Tab 切换列表',!!document.querySelector('#benchResults table')&&document.querySelector('[data-a="bench-view-set"][data-v="list"]').getAttribute('aria-selected')==='true');
    action('bench-view-set','card');check('图标 Tab 切换卡片',!!document.querySelector('.bench-preview-card'));
    action('nav-personal','spaces');assetAction('spx-tab','templates');assetAction('spx-kind','task');
    const card=document.querySelector('.spx-resource'),footer=card.querySelector('footer'),height=card.getBoundingClientRect().height;
    check('操作区不占排版空间',getComputedStyle(footer).position==='absolute');
    footer.querySelector('button').focus();check('聚焦不改变卡片高度',card.getBoundingClientRect().height===height);
    return {passed:checks.length,checks};
  }finally{closeExtMenu();ntcClose();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();render();}
})()
