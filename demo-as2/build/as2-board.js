
// ---- 任务看板 · 运行看板：卡片字段（类别｜标题 · 环境 / 执行方式 / 任务类型 / 区域 · 参与者 / 时间），hover 显示操作。
function boardHash(str){let h=0;for(const ch of String(str))h=(h*31+ch.codePointAt(0))>>>0;return h;}
function boardFields(t){
  const h=boardHash(t.id),trig=taskTrigger(t);
  const workflow=t.executorType==='workflow'||/SpecX|Workflow|流程/.test((t.source||'')+(t.title||''));
  const cat={spec:'需求开发',performance:'问题排查',automation:'质量巡检',review:'代码检视',doc:'文档更新',fixed:'需求开发'}[t.kind]||(trig==='schedule'?'定时巡检':trig==='event'?'事件响应':'协作任务');
  const agent=t.executor||'CodeAgent',agentKey={'CodeAgent':'C','QA Agent':'Q','OfficeACE':'O'}[agent]||'C';
  const people=[...new Set([t.owner||'我',taskTriggeredBy(t)].map(n=>String(n||'我').trim()[0]))].slice(0,2);
  const hh=String(8+h%10).padStart(2,'0'),mm=String(h%60).padStart(2,'0');
  return {cat,env:t.env||(h%3===0?'本地':'云端'),mode:workflow?'Workflow':'Agent',type:trig==='schedule'?'定时任务':trig==='event'?'事件任务':'临时任务',
    typeIcon:trig==='schedule'?'clock':trig==='event'?'zap':'file',zone:h%2?'黄区':'绿区',people,agentKey,more:(h%4)+1,time:t.time||`10月${20+h%8}日 ${hh}:${mm}`};
}
// A function, not a const: the first render can run before this module's consts are initialised (TDZ).
function boardCols(){return [
  ['pending','待开始','dashed','待人工启动的临时任务与事件任务',t=>t.status==='pending'],
  ['running','运行中','running','正在由 Agent 或 Workflow 执行的任务',t=>t.status==='running'],
  ['wait','待输入','needInput','等待用户输入或人工确认后才能继续的任务',t=>t.status==='wait'],
  ['review','待验收','review','执行完成、等待负责人验收产物的任务',t=>t.status==='review'],
  ['done','已完成','checkCircle','已验收的任务',t=>t.status==='done'],
  ['failed','失败 / 已取消','xCircle','校验失败、系统执行失败或被人工取消的任务',t=>['failed','cancelled'].includes(t.status)]];}
function boardActions(t){
  const a=[];const b=(act,icon,label)=>`<button class="tk-act" data-a="${act}" data-v="${t.id}">${label}</button>`;
  if(t.status==='pending')a.push(b('board-start','play','启动'),b('board-archive','archive','归档'));
  else if(t.status==='running')a.push(b('board-sleep','moon','休眠'),b('board-stop','stop','停止'));
  else if(t.status==='wait')a.push(b('open-task','inputWait','去处理'));
  else if(t.status==='review')a.push(b('open-task','check','验收'),b('board-archive','archive','归档'));
  else a.push(b('board-archive','archive','归档'));
  return a.join('');
}
function boardCard(t){const f=boardFields(t);return `<article class="kanban-card tk-card" data-task-id="${t.id}" data-status="${t.status}">
  <button class="tk-title" data-a="open-task" data-v="${t.id}"><span class="tk-cat">${esc(f.cat)}｜</span>${esc(t.title)}${t.status==='failed'?' '+tag('异常','red'):t.status==='cancelled'?' '+tag('已取消','gray'):''}</button>
  <div class="tk-meta"><span data-env="${f.env}">${ico(f.env==='本地'?'monitor':'cloud')}${f.env}</span><span>${ico(f.mode==='Workflow'?'workflow':'agent')}${f.mode}</span><span>${ico(f.typeIcon)}${f.type}</span><span data-zone="${f.zone}">${ico('shield')}${f.zone}</span></div>
  <div class="tk-foot"><span class="tk-people">${f.people.map(p=>`<span class="as-avatar">${esc(p)}</span>`).join('')}<span class="as-avatar agent" data-kind="agent">${f.agentKey}</span>${f.more>1?`<em>+${f.more}</em>`:''}</span><time>${esc(f.time)}</time><span class="tk-actions">${boardActions(t)}</span></div>
</article>`;}
function renderKanbanBoard(ts){
  return `<div class="task-kanban tk-board">${boardCols().map(([key,title,icon,hint,match])=>{const rows=ts.filter(match);
    return `<section class="kanban-column tk-col" data-col="${key}"><header><span class="tk-col-icon">${ico(icon)}</span><b>${title}</b><small>${rows.length}</small>${as2Hint(hint,title+'说明')}</header><div class="kanban-cards">${rows.map(boardCard).join('')||`<div class="tk-empty">${ico('archive')}<span>暂无相关任务</span></div>`}</div></section>`;}).join('')}</div>`;
}
function boardAction(a,v){
  if(a==='ac-menu'){acMenu(v);return true;}
  if(a==='ac-delete'){const r=s.automations?.find(x=>x.id===v);modal('删除自动化',`<p class="tk-confirm">删除后，「${esc(r?.name||v)}」将不再按计划或事件生成任务；已生成的任务实例与执行记录保留。</p><p class="tk-confirm">请确认是否删除？</p>`,btn('取消','close-modal')+btn('删除','ac-delete-confirm',v,'danger'));return true;}
  if(a==='ac-delete-confirm'){closeModal();notify('示例：已删除该自动化规则');return true;}
  if(a==='board-layout-set'){if((boardState().layout==='list')!==(v==='list'))action('board-layout','');return true;}
  const t=s.tasks?.find(x=>x.id===v);
  if(a==='board-start'&&t){modal('启动任务',`<p class="tk-confirm">任务：<b>${esc(t.title)}</b></p><p class="tk-confirm muted">${esc(t.goal||'按任务目标启动执行。')}</p><p class="tk-confirm">请确认是否启动该任务？</p>`,btn('取消','close-modal')+btn('启动','board-start-confirm',t.id,'primary'));return true;}
  if(a==='board-start-confirm'&&t){closeModal();startTask(t.id);notify('已启动：'+t.title);return true;}
  if(a==='board-archive'&&t){modal('归档任务',`<p class="tk-confirm">如若归档，任务将无法恢复继续执行，云上执行任务的沙箱和文件存储将被销毁。可以进入「设置 · 已归档任务」查看执行历史。</p><p class="tk-confirm">请确认是否归档该任务？</p>`,btn('取消','close-modal')+btn('确定','board-archive-confirm',t.id,'primary'));return true;}
  if(a==='board-archive-confirm'&&t){closeModal();notify('示例：已归档「'+t.title+'」');return true;}
  if(a==='board-sleep'&&t){notify('示例：任务已休眠，释放云上资源；恢复后重新进入排队。');return true;}
  if(a==='board-stop'&&t){action('cancel-task',t.id);return true;}
  return false;
}

// ---- 定时 / 事件 / 协作任务卡片：开关 + 更多菜单 · 标题与状态词 · 两行描述 · 虚线分隔 · 触发 / 执行方式胶囊
function automationCard(a,kind){
  const trigger=kind==='schedule'?scheduleDescription(a):a.eventSource+' / '+a.eventType;
  return `<article class="automation-card ac-card" data-rule-id="${a.id}">
    <div class="ac-top"><button class="as2-switch" role="switch" aria-checked="${a.enabled}" data-a="automation-toggle" data-v="${a.id}" aria-label="${a.enabled?'停用':'启用'}「${esc(a.name)}」" title="${a.enabled?'已启用 · 点击停用':'已停用 · 点击启用'}"><i></i></button><button class="iconbtn ac-more" data-a="ac-menu" data-v="${kind}|${a.id}" aria-label="更多操作" aria-haspopup="menu" aria-expanded="false">${ico('more')}</button></div>
    <button class="ac-title" data-a="automation-edit" data-v="${a.id}"><b>${esc(a.name)}</b>${a.lastStatus==='failed'?'<em class="ac-st ac-st--fail">失败</em>':''}${a.enabled?'':'<em class="ac-st">已停用</em>'}</button>
    <p class="ac-desc">${esc(a.prompt||'按所选 Agent 默认指引执行。')}</p>
    <div class="ac-foot"><span class="ac-chip" title="${esc(trigger)}">${ico(kind==='schedule'?'clock':'zap')}<span>${esc(trigger)}</span></span><span class="ac-meta">${ico(a.executorType==='workflow'?'workflow':'agent')}<span>${esc(a.executor)} · ${a.lastRun?'最近 '+esc(a.lastRun):'暂无执行'}</span></span></div>
  </article>`;
}
function renderAutomationCards(kind){const rules=boardRules(kind);return `<div class="automation-list ac-grid">${rules.map(a=>automationCard(a,kind)).join('')||'<div class="tk-empty">'+ico('archive')+'<span>当前筛选下暂无此类规则</span></div>'}</div>`;}
function collaborationCard(t){
  const ref=collaborationThreadRef(t),wf=collaborationMode(t)==='workflow';
  return `<article class="collaboration-task-card ac-card" data-collaboration-id="${t.id}">
    <div class="ac-top">${tag(collaborationLabel(t),wf?'':'green')}<span class="spacer"></span>${taskChip(t)}<button class="iconbtn ac-more" data-a="ac-menu" data-v="collab|${t.id}" aria-label="更多操作" aria-haspopup="menu" aria-expanded="false">${ico('more')}</button></div>
    <button class="ac-title" data-a="open-task" data-v="${t.id}"><b>${esc(t.title)}</b></button>
    <p class="ac-desc">${esc(t.goal||'')}</p>
    <div class="ac-foot"><span class="ac-chip">${ico(wf?'workflow':'agent')}<span>${esc(t.workflowName||t.executor||'CodeAgent')}${t.workflowVersion?' · v'+esc(t.workflowVersion):''}</span></span><span class="ac-meta">${ico('chat')}<span># ${esc(ref.channel)} · ${esc(t.owner)}</span></span></div>
    <div class="ac-hover">${collaborationTaskActions(t)}</div>
  </article>`;
}
function acMenu(v){
  const [kind,id]=String(v).split('|'),open=document.querySelector('.as2-menu[data-for="ac"]');closeExtMenu();if(open&&open.dataset.id===id)return;
  const btn=document.querySelector(`[data-a="ac-menu"][data-v="${v}"]`);if(!btn)return;const r=btn.getBoundingClientRect();
  const item=(a,val,icon,label,cls='')=>`<button role="menuitem" class="${cls}" data-a="${a}" data-v="${esc(val)}">${ico(icon)}<span>${label}</span></button>`;
  const items=kind==='collab'?item('open-task',id,'file','查看任务')+item('collaboration-origin',id,'chat','打开原始线程')
    :item('automation-edit',id,'edit','编辑')+item('automation-run',id,'play',kind==='schedule'?'立即运行':'模拟事件')+item('automation-instances',id,'clock','查看执行记录')+'<div class="as2-menu-sep"></div>'+item('ac-delete',id,'archive','删除','is-danger');
  document.body.insertAdjacentHTML('beforeend',`<div class="as2-menu" role="menu" data-for="ac" data-id="${esc(id)}">${items}</div>`);
  const m=document.querySelector('.as2-menu[data-for="ac"]');m.style.left=Math.round(Math.max(8,r.right-m.offsetWidth))+'px';m.style.top=Math.round(r.bottom+m.offsetHeight+8>innerHeight?r.top-m.offsetHeight-4:r.bottom+4)+'px';btn.setAttribute('aria-expanded','true');
}

// ---- 卡片操作：默认不平铺，hover / 聚焦时在右下角以全圆角悬浮工具栏出现（主操作在最右）。
// 各页卡片的按钮散落在不同容器里，渲染后统一收进 .as2-card-actions。
function cardActionCards(){return '.wfcard, .project-agent-card, .knowledge-space-card, .runcard, .evo-next-item, .project-extension-card, .extension-card:has(> .ext-card-foot), .ct-row';}
function cardActionsDecorate(){
  document.querySelectorAll('#demo .demoarea :is('+cardActionCards()+'):not([data-acts])').forEach(card=>{
    card.dataset.acts='1';
    const btns=[...card.querySelectorAll('.btn')].filter(b=>b.closest(cardActionCards())===card&&!b.closest('.as2-card-actions'));
    if(!btns.length)return;
    const bar=document.createElement('div');bar.className='as2-card-actions';
    btns.sort((a,b)=>a.classList.contains('primary')-b.classList.contains('primary')).forEach(b=>{const from=b.parentElement;bar.appendChild(b);if(from!==card&&!from.children.length&&!from.textContent.trim())from.hidden=true;});
    card.appendChild(bar);card.classList.add('has-card-actions');
  });
}
let cardActionsQueued=false;
new MutationObserver(()=>{if(cardActionsQueued)return;cardActionsQueued=true;queueMicrotask(()=>{cardActionsQueued=false;cardActionsDecorate();});}).observe(document.getElementById('demo'),{childList:true,subtree:true});

// ---- 新建 / 编辑定时任务与事件任务：左右分区弹窗。左侧写「做什么」（标题、提示词、执行者、归属），
// 右侧配「何时触发」（触发器、频率或事件过滤、高级配置、知识范围）。字段 id 不变，沿用 captureAutomation / saveAutomation。
function renderAutomationForm(){
  const a=automationDraft,event=a.trigger==='event',wf=a.executorType==='workflow',canPick=!a.id&&isMyBoard();
  const opt=(list,cur)=>list.map(x=>Array.isArray(x)?`<option value="${x[0]}" ${x[0]===cur?'selected':''}>${x[1]}</option>`:`<option ${x===cur?'selected':''}>${x}</option>`).join('');
  const main=`<section class="af-main">
    <label class="field">标题 *<input id="autoName" maxlength="50" value="${esc(a.name)}" placeholder="${event?'例如：MR 合入后自动检视':'例如：每日质量巡检'}"></label>
    <label class="field af-prompt"><span>任务描述 ${event?'<i>可选</i>':'*'}</span><textarea id="autoPrompt" maxlength="${event?1000:8000}" placeholder="写清任务目标、约束与期望产物，例如：汇总阻塞项与待确认风险，生成验证摘要并推送到项目频道。">${esc(a.prompt)}</textarea></label>
    <div class="form-grid2"><label class="field">执行方式<select id="autoExecutorType">${opt([['agent','单 Agent'],['workflow','Workflow']],a.executorType)}</select></label><label class="field">${wf?'选择 Workflow':'指派给 Agent'} *<select id="autoExecutor">${executorOptions(a.executorType,a.executor)}</select></label></div>
    <div class="form-grid2"><label class="field">所属项目<select id="autoProject" ${canPick?'':'disabled'}>${taskProjectOptions(a.project)}</select></label><label class="field">责任人<select id="autoOwner">${ownerOptions(a.owner||'我')}</select></label></div>
  </section>`;
  const trigger=event?`
      <div class="af-row"><span class="af-label">触发方式</span><span class="af-chip">${ico('zap')}事件触发</span></div>
      <div class="form-grid2"><label class="field">事件源 *<select id="autoEventSource">${opt(['CodeHub','CloudBuild','质量平台'],a.eventSource)}</select></label><label class="field">事件类型 *<select id="autoEventType">${opt(['MR 合入','构建完成','问题单更新'],a.eventType)}</select></label></div>
      <div class="af-sub"><span class="af-label">过滤条件</span>${btn(ico('plus')+'添加','automation-add-filter','','link sm')}</div>
      <div id="autoFilters">${a.filters.map(filterRow).join('')}</div>${a.filters.length?'':'<p class="af-hint">未设置过滤条件时，所有匹配的事件都会生成任务实例。</p>'}`:`
      <div class="af-row"><span class="af-label">触发方式</span><span class="af-chip">${ico('clock')}定时触发</span></div>
      <label class="field">执行频率<select id="autoFrequency">${opt([['once','单次'],['hourly','每小时'],['daily','每天'],['weekly','每周'],['monthly','每月'],['cron','Cron']],a.frequency)}</select></label>
      <div class="form-grid2"><label class="field">执行日期 *<input type="date" id="autoDate" value="${a.date}"></label><label class="field">执行时间 *<input type="time" id="autoTime" value="${a.time}"></label></div>
      <div id="autoCronField" ${a.frequency==='cron'?'':'hidden'}><label class="field">Cron 表达式（5 字段）<input id="autoCron" value="${esc(a.cron)}" placeholder="0 9 * * *"></label></div>
      <div id="schedulePreview" class="af-preview">${esc(scheduleDescription(a))}</div>`;
  const adv=`<details class="af-adv"><summary>高级配置${ico('down')}</summary>
      <label class="field">${event?'任务实例名称':'实例命名规则'}<input id="autoInstance" value="${esc(a.instanceName)}"></label>
      ${event?`<p class="af-hint">可用变量：event.id、event.mr_id、event.build_id、event.branch、event.status、event.repository，用 {{event.id}} 形式引用。</p><label class="hook-check"><input id="autoHook" type="checkbox" ${a.hookValidation?'checked':''}><span>启用 Hook 校验</span><small>正式接入时使用的校验配置</small></label>`
        :`<label class="field">时区<select id="autoZone">${opt(['Asia/Shanghai','UTC'],a.zone)}</select></label>`}
    </details>`;
  const side=`<aside class="af-side">
    <div class="af-sec"><h4>触发器配置</h4>${trigger}${adv}</div>
    <div class="af-sec"><h4>知识范围</h4><p class="af-hint">执行时作为上下文引用，保存输入快照。</p>${knowledgeSelection(a.project,a.spaceIds)}</div>
  </aside>`;
  modal((a.id?'编辑':'新建')+(event?'事件任务':'定时任务'),`<div class="af-split">${main}${side}</div>`,`${btn('取消','close-modal')}${btn(a.id?'保存':'创建任务规则','automation-save','','primary')}`);
}
