(()=>{
 const backup=abCopy(s),checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 try{
  closeModal();closeExtMenu();s.newTask=null;s.taskDetail=null;s.automationDetail=null;s.personalBoard=newBoardState(true);s.personalBoard.project='projects';action('nav-personal','tasks');action('board-tab','schedule');
  const rule=s.automations.find(a=>a.id==='AUTO-101'),beforeFilter=abCopy(boardState());
  const menu=document.querySelector('[data-a="ac-menu"][data-v="schedule|AUTO-101"]');menu.click();document.querySelector('.as2-menu [data-a=automation-instances]').click();
  check('原有执行记录入口打开独立详情',s.automationDetail===rule.id&&!!document.querySelector('.ahr-detail')&&!document.querySelector('.board-main-tabs'));
  check('显示规则信息和触发计划',document.querySelector('.ahr-heading h1').textContent===rule.name&&document.querySelector('.ahr-info').textContent.includes(rule.executor)&&document.querySelector('.ahr-trigger').textContent.includes(scheduleDescription(rule)));
  const first=ahrRows(rule).find(r=>r.taskId),samples=ahrRows(rule).filter(r=>r.sample),initialStamp=first.stamp,sampleInput=samples[0].prompt;
  check('保留现有任务关联',first.taskId==='T-3101');check('示例与实际实例明确区分',samples.length>0&&!!document.querySelector('.ahr-run-copy small'));
  check('失败与跳过显示原因',ahrRows(rule).some(r=>r.status==='failed'&&r.message.includes('连接中断'))&&ahrRows(rule).some(r=>r.status==='skipped'&&r.message.includes('未创建任务')));
  const details=document.querySelector(`[data-ahr-run="${first.id}"]`);if(!details.open)details.querySelector('summary').click();check('展开记录显示本次输入',details.open&&details.querySelector('.ahr-run-input').textContent.includes(first.prompt));
  details.querySelector('[data-a=open-task]').click();check('执行记录能打开任务详情',s.taskDetail===first.taskId);action('task-page-back');check('任务返回执行记录页',!s.taskDetail&&!!document.querySelector('.ahr-detail'));
  const count=s.tasks.length,ruleTasks=s.tasks.filter(t=>t.automationId===rule.id).length;document.querySelector('.ahr-heading-actions [data-a=automation-run]').click();
  const created=s.tasks[s.tasks.length-1];check('立即运行创建单次实例',s.tasks.length===count+1&&created.automationId===rule.id&&created.status==='running'&&created.runOrigin==='manual'&&created.runStartedAt>0);
  check('手动运行停留详情并保留原列表筛选',s.automationDetail===rule.id&&!!document.querySelector('.ahr-detail')&&JSON.stringify(boardState())===JSON.stringify(beforeFilter));
  check('新运行即时出现在记录首位',ahrRows(rule)[0].taskId===created.id&&ahrRows(rule).filter(r=>r.taskId).length===ruleTasks+1);
  check('旧记录时间不会被新运行改写',ahrRows(rule).find(r=>r.id===first.id).stamp===initialStamp&&ahrRows(rule).filter(r=>r.sample).length===samples.length);
  const filter=document.querySelector('[data-ahr-filter]');filter.value='skipped';filter.dispatchEvent(new Event('change',{bubbles:true}));check('运行状态筛选',document.querySelectorAll('.ahr-run').length>0&&[...document.querySelectorAll('.ahr-run summary .ahr-status')].every(e=>e.dataset.status==='skipped'));
  document.querySelector('[data-ahr-filter]').value='all';document.querySelector('[data-ahr-filter]').dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('.ahr-trigger [data-a=automation-toggle]').click();check('启停开关联动状态和下次运行',!rule.enabled&&ahrNext(rule)==='已暂停'&&document.querySelector('.ahr-trigger [role=switch]').getAttribute('aria-checked')==='false');document.querySelector('.ahr-trigger [data-a=automation-toggle]').click();
  document.querySelector('.ahr-heading-actions [data-a=automation-edit]').click();check('编辑沿用原有规则表单',!!document.querySelector('#autoName')&&document.querySelector('#autoName').value===rule.name);document.querySelector('#autoPrompt').value='更新后的巡检目标';action('automation-save');
  const updated=s.automations.find(a=>a.id===rule.id);check('保存配置后仍在执行记录页',updated.prompt==='更新后的巡检目标'&&s.automationDetail===rule.id&&document.querySelector('.ahr-heading p').textContent===updated.prompt);
  check('历史输入不随规则编辑变化',ahrRows(updated).find(r=>r.id===first.id).prompt===first.prompt&&ahrRows(updated).filter(r=>r.sample)[0].prompt===sampleInput);
  action('ahr-back');check('返回原定时列表与筛选',!s.automationDetail&&boardState().tab==='schedule'&&boardState().project==='projects');action('automation-instances',rule.id);action('anh-back');check('Header后退退出详情',!s.automationDetail);action('anh-forward');check('Header前进恢复详情',s.automationDetail===rule.id);
  const fresh={...abCopy(updated),id:'QA-HISTORY-NEW',name:'无执行记录规则',project:'个人',owner:'我',createdBy:'我',lastRun:'暂无执行'};s.automations.push(fresh);action('automation-instances',fresh.id);check('新建规则无虚构历史',ahrRows(fresh).length===0&&!!document.querySelector('.ahr-empty'));
  __persistNow();check('运行时间和示例快照可持久化',!!JSON.parse(localStorage.getItem('agentspace-mvp-workbench-history-v28')).automationTaskRunTimes[first.id]);
  const fixed=Date.parse('2026-11-09T00:00:00Z');check('按规则时区计算下次日程',ahrNext({...fresh,enabled:true,zone:'Asia/Shanghai',frequency:'daily',time:'09:00'},fixed).includes('11月9日')&&ahrNext({...fresh,enabled:true,zone:'America/Los_Angeles',frequency:'daily',time:'09:00'},fixed).includes('11月9日'));
  check('单次过期和Cron计划文案',ahrNext({...fresh,enabled:true,frequency:'once',date:'2026-01-01'},fixed)==='计划已结束'&&ahrNext({...fresh,enabled:true,frequency:'cron'},fixed)==='按 Cron 计划触发');
  s.automationDetail=null;s.view='team';s.page='board';s.project='AICS';s.projectBoard=newBoardState();s.projectBoard.tab='schedule';render();action('automation-instances',rule.id);check('项目任务也可打开执行记录',!!document.querySelector('.ahr-detail')&&s.view==='team');
  action('nav-personal','benches');check('切换导航清理详情状态',!s.automationDetail);
  return {passed:checks.length,checks};
 }finally{closeModal();closeExtMenu();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();render();}
})()
