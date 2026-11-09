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
