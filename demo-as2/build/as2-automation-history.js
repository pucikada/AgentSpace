// Automation detail reuses the rule and its linked task instances.
const ahrExpanded=new Set();
function ahrRule(){return s.automations.find(a=>a.id===s.automationDetail);}
function ahrParts(date,zone){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
function ahrZoned(year,month,day,hour,minute,zone){const wall=Date.UTC(year,month-1,day,hour,minute);let stamp=wall;for(let i=0;i<3;i++){const p=ahrParts(new Date(stamp),zone);stamp+=wall-Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);}return stamp;}
function ahrTime(stamp,zone){return new Intl.DateTimeFormat('zh-CN',{timeZone:zone,month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(stamp));}
function ahrNext(a,now=Date.now()){
  if(!a.enabled)return '已暂停';if(a.trigger==='event')return '等待匹配事件';if(a.frequency==='cron')return '按 Cron 计划触发';
  const zone=a.zone||'Asia/Shanghai',p=ahrParts(new Date(now),zone),[hour,minute]=String(a.time||'09:00').split(':').map(Number),start=String(a.date||'').split('-').map(Number);
  if(a.frequency==='once'){const stamp=ahrZoned(start[0],start[1],start[2],hour,minute,zone);return Number.isFinite(stamp)&&stamp>now?ahrTime(stamp,zone):'计划已结束';}
  const anchor=new Date(Date.UTC(start[0]||p.year,(start[1]||p.month)-1,start[2]||p.day));
  for(let i=0;i<370;i++){
    const d=new Date(Date.UTC(p.year,p.month-1,p.day+(a.frequency==='hourly'?0:i),a.frequency==='hourly'?p.hour+i:hour,minute));
    if(a.frequency==='weekly'&&d.getUTCDay()!==anchor.getUTCDay())continue;
    if(a.frequency==='monthly'&&d.getUTCDate()!==Math.min(anchor.getUTCDate(),new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()))continue;
    const stamp=ahrZoned(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours(),d.getUTCMinutes(),zone);
    if(stamp>now&&(!a.date||d.toISOString().slice(0,10)>=a.date))return ahrTime(stamp,zone);
  }
  return '按所设计划触发';
}
function ahrStamp(text,a){
  if(typeof text==='number')return text;if(!text)return 0;
  const value=String(text),m=value.match(/(\d+)月(\d+)日?\s*(\d+):(\d+)/);
  if(m)return ahrZoned(Number(a.date?.slice(0,4))||2026,...m.slice(1).map(Number),a.zone||'Asia/Shanghai');
  return Date.parse(value)||0;
}
function ahrRows(a){
  const messages={pending:'任务已创建，等待启动。',running:'执行器正在处理本次任务。',wait:'需要补充输入或确认后继续。',review:'执行结果已返回，等待验收。',done:'任务已完成。',failed:'本次执行失败，请查看任务中的错误与执行记录。',cancelled:'本次执行已取消。'};
  const times=s.automationTaskRunTimes||(s.automationTaskRunTimes={});
  const rows=s.tasks.filter(t=>t.automationId===a.id).map(t=>{
    const stamp=ahrStamp(t.runStartedAt||t.createdAt||t.time||t.title,a)||times[t.id]||ahrStamp(a.lastRun,a);if(stamp)times[t.id]=stamp;
    return {id:t.id,taskId:t.id,status:t.status,stamp,time:t.time||'时间未记录',origin:t.runOrigin||(isMe(taskTriggeredBy(t))?'manual':a.trigger),message:t.error||t.failureReason||messages[t.status]||'查看本次任务的执行进展。',prompt:t.goal||'',executor:t.executor||a.executor,owner:t.owner||a.owner,finished:t.runFinishedAt||null};
  });
  // Original demo rules carry illustrative dispatch history; new rules start empty.
  const examples=s.automationHistoryExamples||(s.automationHistoryExamples={});
  if(!examples[a.id]&&a.trigger==='schedule'&&(automationSeeds().some(x=>x.id===a.id)||['AUTO-P01','AUTO-P02'].includes(a.id))){
    const base=ahrStamp(a.lastRun,a);if(base){const interval=(a.frequency==='weekly'?7:a.frequency==='monthly'?30:1)*86400000,created=ahrStamp((a.created||'')+' 00:00',a);
      examples[a.id]=[['done',1,0,'manual'],['skipped',2,0,'schedule'],['failed',2,7200000,'manual']].map(([status,days,offset,origin],i)=>({id:a.id+'-example-'+i,status,stamp:base-days*interval+offset,origin,sample:true,prompt:a.prompt||'',executor:a.executor,owner:a.owner,message:status==='done'?'执行完成，已生成结果摘要。':status==='skipped'?'触发时本地执行器离线，已跳过本次计划；未创建任务实例。':'运行环境连接中断，执行未完成。请检查设备与网络后重试。'})).filter(r=>!created||r.stamp>=created);
    }
  }
  rows.push(...(examples[a.id]||[]));
  return rows.sort((a,b)=>b.stamp-a.stamp||b.id.localeCompare(a.id));
}
function ahrState(status){return {pending:['待开始','dashed'],running:['运行中','running'],wait:['待输入','needInput'],review:['待验收','review'],done:['已完成','checkCircle'],failed:['失败','xCircle'],skipped:['已跳过','clock'],cancelled:['已取消','xCircle']}[status]||['未知状态','clock'];}
function ahrOrigin(origin){return origin==='manual'?'手动运行':origin==='event'?'事件触发':'计划运行';}
function ahrRow(r,a){
  const [label,icon]=ahrState(r.status),zone=a.zone||'Asia/Shanghai',time=r.stamp?ahrTime(r.stamp,zone):r.time;
  return `<details class="ahr-run" data-ahr-run="${esc(r.id)}" ${ahrExpanded.has(r.id)?'open':''}><summary>${ico('chevron')}<span class="ahr-status" data-status="${esc(r.status)}">${ico(icon)}${label}</span><span class="ahr-run-copy"><b>${ahrOrigin(r.origin)}${r.sample?'<small>示例</small>':''}</b><span>${esc(r.message)}</span></span><time>${esc(time)}</time></summary><div class="ahr-run-body"><dl><div><dt>执行记录</dt><dd>${esc(r.id)}</dd></div><div><dt>执行者</dt><dd>${esc(r.executor||'未指定')}</dd></div><div><dt>责任人</dt><dd>${esc(r.owner||'未指定')}</dd></div><div><dt>触发时间</dt><dd>${esc(time)} · ${esc(zone)}</dd></div>${r.finished?`<div><dt>完成时间</dt><dd>${esc(ahrTime(r.finished,zone))}</dd></div>`:''}</dl><div class="ahr-run-result" data-status="${esc(r.status)}">${esc(r.message)}</div>${r.prompt?`<div class="ahr-run-input"><span>本次输入</span><p>${esc(r.prompt)}</p></div>`:''}${r.taskId?btn('打开任务详情 '+ico('arrow'),'open-task',r.taskId,'sm'):''}</div></details>`;
}
function ahrRender(a){
  const rows=ahrRows(a),filter=s.automationRunFilter||'all',shown=rows.filter(r=>filter==='all'||r.status===filter),last=rows[0],next=ahrNext(a),event=a.trigger==='event';
  const info=(label,value)=>`<div><dt>${label}</dt><dd>${esc(value||'未记录')}</dd></div>`;
  return `<section class="ahr-detail"><div class="ahr-breadcrumb">${btn(ico('back')+(event?'所有事件任务':'所有定时任务'),'ahr-back','','link sm')}<span>/</span><span>${esc(a.name)}</span><span class="ahr-enabled">${tag(a.enabled?'已启用':'已暂停',a.enabled?'green':'gray')}</span></div><div class="ahr-layout"><main class="ahr-main"><header class="ahr-heading"><div><h1>${esc(a.name)}</h1><p>${esc(a.prompt||'按所选执行者的默认指引执行。')}</p></div><div class="ahr-heading-actions">${btn(ico('edit')+'编辑','automation-edit',a.id,'sm')}${btn(ico('play')+(event?'模拟事件':'立即运行'),'automation-run',a.id,'primary sm')}</div></header><section class="ahr-section"><h2>${event?'事件触发器':'触发计划'}</h2><div class="ahr-trigger"><span class="ahr-trigger-icon">${ico(event?'zap':'clock')}</span><div><b>${event?esc(a.eventSource+' · '+a.eventType):'定时运行'}</b><p>${esc(event?'满足事件过滤条件后执行':scheduleDescription(a))}</p><small>${event?'触发状态':'下次运行'}：${esc(next)}</small></div><button class="as2-switch" data-a="automation-toggle" data-v="${esc(a.id)}" role="switch" aria-checked="${a.enabled}" aria-label="${a.enabled?'暂停':'启用'}此规则"><i></i></button><button class="iconbtn" data-a="automation-edit" data-v="${esc(a.id)}" title="编辑触发配置" aria-label="编辑触发配置">${ico('edit')}</button></div></section><section class="ahr-section"><header class="ahr-records-heading"><h2>执行记录 <span>${rows.length}</span></h2><select data-ahr-filter aria-label="筛选执行状态">${[['all','全部状态'],['running','运行中'],['review','待验收'],['done','已完成'],['failed','失败'],['skipped','已跳过']].map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('')}</select></header><div class="ahr-records">${shown.map(r=>ahrRow(r,a)).join('')||`<div class="ahr-empty">${ico('clock')}<h3>${rows.length?'没有匹配的执行记录':'还没有执行记录'}</h3><p>${rows.length?'切换状态查看其他记录。':event?'匹配事件后，执行记录会显示在这里。':'按计划触发或点击「立即运行」后，执行记录会显示在这里。'}</p></div>`}</div></section></main><aside class="ahr-info"><h2>基础信息</h2><dl>${info(a.executorType==='workflow'?'Workflow':'Agent',a.executor)}${info('责任人',a.owner)}${info('归属',a.project)}${info('创建者',a.createdBy)}${info('创建时间',a.created)}${info(event?'触发状态':'下次运行',next)}${info('上次运行',last?ahrState(last.status)[0]+' · '+(last.stamp?ahrTime(last.stamp,a.zone||'Asia/Shanghai'):last.time):'暂无执行')}</dl></aside></div></section>`;
}
const ahrBaseBoard=renderTaskBoard,ahrBaseAction=action,ahrBaseTrigger=triggerAutomation;
renderTaskBoard=function(){const a=ahrRule();return a?ahrRender(a):ahrBaseBoard();};
action=function(a,v){
  if(a==='automation-instances'){
    const rule=s.automations.find(x=>x.id===v);if(!rule)return;
    if(isMyBoard()?!personallyRelatedRule(rule):rule.project!==s.project)return;
    s.automationDetail=v;s.automationRunFilter='all';s.newTask=null;s.taskDetail=null;closeExtMenu();render();save();return;
  }
  if(a==='ahr-back'){s.automationDetail=null;closeExtMenu();render();return;}
  if(a==='automation-save'&&s.automationDetail){const context={view:s.view,page:s.page,project:s.project,personalBoard:abCopy(s.personalBoard),projectBoard:abCopy(s.projectBoard)},result=ahrBaseAction(a,v);if(!document.querySelector('#autoName')){Object.assign(s,context);save();render();}return result;}
  if(['mode','nav-personal','channel','project','task-board','studio','extensions','evolution','messages','open-bench','project-tab','project-assets','nt-open'].includes(a))s.automationDetail=null;
  return ahrBaseAction(a,v);
};
triggerAutomation=function(id,event){
  const inDetail=s.automationDetail===id,context=inDetail?{view:s.view,page:s.page,project:s.project,personalBoard:abCopy(s.personalBoard),projectBoard:abCopy(s.projectBoard)}:null;
  const task=ahrBaseTrigger(id,event);if(!task)return task;
  task.runStartedAt=Date.now();task.runOrigin=event?'event':'manual';if(context)Object.assign(s,context);save();if(inDetail)render();return task;
};
document.addEventListener('change',e=>{if(e.target.matches('[data-ahr-filter]')){s.automationRunFilter=e.target.value;render();}});
document.addEventListener('toggle',e=>{if(!e.target.matches?.('[data-ahr-run]'))return;const id=e.target.dataset.ahrRun;if(e.target.open)ahrExpanded.add(id);else ahrExpanded.delete(id);},true);

// Rule configuration uses the same scoped, versioned assets as Build.
function afTemplateOptions(a){return '<option value="">不引用任务模板</option>'+['task','workflow','graph'].map(type=>`<optgroup label="${abLabels[type]}">${abItems(type,a.project).filter(t=>!t.draft&&abUsable(t)).map(t=>`<option value="${esc(t.id)}" ${a.taskTemplateId===t.id?'selected':''}>${esc(t.name)} · V${t.version}</option>`).join('')}</optgroup>`).join('');}
function afTaskFields(a){
 const c=a.executionConfig||(a.executionConfig=abConfig()),binding=c.environment||{mode:'default'},series=a.taskTemplateSnapshot?.type==='workflow',reuse=binding.mode==='instance';
 const envs=abItems('env',a.project),instances=abItems('instance',a.project).filter(i=>['运行中','已停止',undefined].includes(i.status));
 const selected=abExts(a.project).filter(i=>['MCP','CLI','Skill'].includes(abExtType(asset(i.assetId))));
 return `<section class="af-task-config"><header><h4>任务配置</h4><p class="af-hint">运行环境与 Agent 执行配置</p></header><label class="field">引用任务模板<select id="autoTaskTemplate">${afTemplateOptions(a)}</select></label>${a.taskTemplateSnapshot?`<p class="af-hint">已固定 ${esc(a.taskTemplateSnapshot.name)} · V${a.taskTemplateSnapshot.version}；本次配置不会修改源模板。</p>`:''}${series?`<div class="af-template-summary">${ntcSummary(a.taskTemplateSnapshot)}</div><p class="af-hint">${a.executorType==='graph'?'由 Master Agent 按目标调配资源池中的原子任务。':'按模板的阶段和步骤执行。'}运行环境与扩展分别沿用各原子任务的配置。</p>`:`<h4>运行环境</h4><div class="af-environment-modes" role="radiogroup" aria-label="运行环境使用方式">${[['new','新建运行环境','每次运行创建独立实例'],['reuse','复用已有运行环境','继续使用现有目录与上下文']].map(([mode,label,hint])=>`<label class="af-environment-mode"><input type="radio" name="autoEnvironmentMode" value="${mode}" ${(mode==='reuse')===reuse?'checked':''}><span><b>${label}</b><small>${hint}</small></span></label>`).join('')}</div>${reuse?`<label class="field">选择现有运行环境实例 *<select id="autoEnvironmentInstance"><option value="">请选择运行环境实例</option>${instances.map(i=>`<option value="${esc(i.id)}" ${binding.instanceId===i.id?'selected':''}>${esc(i.name)} · ${esc(i.status||'运行中')}</option>`).join('')}</select></label>`:`<label class="field">选择运行环境模板<select id="autoEnvironmentTemplate" data-version="${binding.version||''}"><option value="">不使用运行环境</option>${envs.map(e=>`<option value="${esc(e.id)}" ${binding.templateId===e.id?'selected':''}>${esc(e.name)} · V${binding.templateId===e.id?binding.version||e.version:e.version} · ${e.config.location==='本地'?'本地':'云上'}</option>`).join('')}</select></label>`}<p class="af-hint">${reuse?'复用所选实例；已停止的实例在执行时恢复后复用。':'保存模板版本快照，执行时创建实例；也可不使用运行环境。'}</p><h4>扩展 · MCP / CLI / Skill</h4><div class="af-extension-options">${selected.map(i=>`<label><input name="autoTaskExtension" type="checkbox" value="${esc(i.assetId)}" ${(c.extensions||[]).includes(i.assetId)?'checked':''}>${abExtensionIcon(i.assetId)}<span>${esc(asset(i.assetId).name)}<small>${esc(abExtType(asset(i.assetId)))} · v${esc(i.version)}</small></span></label>`).join('')||'<p class="af-hint">当前范围暂无可用扩展，可到扩展页配置。</p>'}</div>`}</section>`;
}
const afBaseCapture=captureAutomation;
captureAutomation=function(){
 const a=afBaseCapture();if(!document.querySelector('.af-task-config'))return a;
 if(!a.taskTemplateSnapshot||a.taskTemplateSnapshot.type==='task'){
  const c=a.executionConfig||(a.executionConfig=abConfig()),template=$('#autoEnvironmentTemplate'),instance=$('#autoEnvironmentInstance');
  if(instance){c.environment={mode:'instance',instanceId:instance.value};a.noEnvironment=false;}
  else if(template){const x=abGet(template.value,a.project);a.noEnvironment=!template.value;c.environment=x?{mode:'template',templateId:x.id,version:Number(template.dataset.version)||x.version}:{mode:'default'};}
  c.extensions=$$('input[name="autoTaskExtension"]:checked').map(e=>e.value);
 }
 return a;
};
function afRuleErrors(a){
 const errors=[];const snap=a.taskTemplateSnapshot;
 if(a.executorType==='graph'&&!snap)errors.push('请选择已发布的图任务模板。');
 if(snap){const original=abGet(snap.id,a.project);if(!original||!abUsable(original)||original.draft)errors.push('来源模板已失效或无权使用。');if(snap.type==='workflow')errors.push(...abValidate({...abCopy(snap),visibility:'private'}));}
 if(!snap||snap.type==='task'){
  const c=a.executionConfig||abConfig();if(!a.noEnvironment){const env=abEnvironment(c.environment,a.project);if(!env.ok)errors.push(env.message);}
  for(const id of c.extensions||[])if(!abExts(a.project).some(i=>i.assetId===id))errors.push('所选扩展在当前范围不可用。');
 }
 return [...new Set(errors)];
}
const afBaseSave=saveAutomation;
saveAutomation=function(){const a=captureAutomation(),errors=afRuleErrors(a);if(errors.length){notify(errors.join('；'));return;}return afBaseSave();};
document.addEventListener('change',e=>{
 const t=e.target;if(!automationDraft||!t.closest('.af-split'))return;
 if(!['autoTaskTemplate','autoProject','autoExecutorType','autoEnvironmentTemplate'].includes(t.id)&&t.name!=='autoEnvironmentMode')return;
 e.stopImmediatePropagation();const a=captureAutomation();
 if(t.id==='autoTaskTemplate'){
  const x=abGet(t.value,a.project);a.taskTemplateId=x?.id||'';a.taskTemplateSnapshot=x?abCopy(x):null;
  a.executionConfig=x?.type==='task'?abCopy(x.config):abConfig();a.noEnvironment=!x;
  if(x){a.executorType=x.taskShape==='graph'?'graph':x.type==='workflow'?'workflow':'agent';a.executor=x.type==='task'?({codeagent:'CodeAgent',zero:'zero'}[x.config.agentType]||x.config.agentType):x.taskShape==='graph'?'Master Agent':x.name;}
  else{a.executorType='agent';a.executor='CodeAgent';}
 }else if(t.id==='autoProject'){
  a.taskTemplateId='';a.taskTemplateSnapshot=null;a.executionConfig=abConfig();a.noEnvironment=true;a.executorType='agent';a.executor='CodeAgent';a.spaceIds=defaultTaskKnowledge(a.project);
 }else if(t.id==='autoExecutorType'){
  a.taskTemplateId='';a.taskTemplateSnapshot=null;a.executionConfig=abConfig();a.noEnvironment=true;a.executor=a.executorType==='graph'?'Master Agent':a.executorType==='workflow'?'SpecX · 需求到交付':'CodeAgent';
 }else if(t.id==='autoEnvironmentTemplate'){
  const x=abGet(t.value,a.project);a.executionConfig.environment=x?{mode:'template',templateId:x.id,version:x.version}:{mode:'default'};a.noEnvironment=!x;
 }else{a.executionConfig.environment=t.value==='reuse'?{mode:'instance',instanceId:''}:{mode:'default'};a.noEnvironment=t.value!=='reuse';}
 renderAutomationForm();
},true);

const afBaseTrigger=triggerAutomation;
triggerAutomation=function(id,event){
 const rule=s.automations.find(a=>a.id===id);if(rule?.executionConfig){const errors=afRuleErrors(rule);if(errors.length){notify(errors.join('；'));return;}}
 const task=afBaseTrigger(id,event);if(!task||!rule)return task;
 if(rule.executionConfig){task.executionConfig=abCopy(rule.executionConfig);task.noEnvironment=!!rule.noEnvironment;const binding=task.executionConfig.environment;if(!rule.noEnvironment)task.environmentSnapshot=abCopy(abEnvironment(binding,rule.project).config);}
 if(rule.taskTemplateSnapshot)task.taskTemplateSnapshot=abCopy(rule.taskTemplateSnapshot);
 save();return task;
};

// Field changes update an open rule dialog without replaying its entrance animation.
function afUpdateModal(title,body,footer){
 const dialog=document.querySelector('#modalHost .modal:has(.af-split)');
 if(!dialog){modal(title,body,footer);return;}
 const content=dialog.querySelector('.modalbody'),scrollTop=content.scrollTop,dialogScroll=dialog.scrollTop;
 const focused=document.activeElement,focusId=dialog.contains(focused)?focused.id:'';
 const expanded=[...content.querySelectorAll('details')].map(el=>el.open);
 dialog.querySelector('#modalTitle').textContent=title;content.innerHTML=body;
 dialog.querySelector('.modalfoot').innerHTML=footer;
 content.querySelectorAll('details').forEach((el,i)=>el.open=expanded[i]||false);
 if(focusId){const replacement=document.getElementById(focusId);if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});}
 content.scrollTop=scrollTop;dialog.scrollTop=dialogScroll;
}
