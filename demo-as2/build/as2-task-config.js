// Per-task configuration snapshots: editing here never writes back to a template.
let ntcEditing=null,ntcHoverTimer=null;
const ntcType=d=>d.executorType==='workflow'?'workflow':'task';
const ntcTemplates=d=>abItems(ntcType(d),d.project).filter(x=>!x.draft&&abUsable(x));
function ntcCustom(type,scope){return {type,scope,name:'自定义配置',visibility:'private',version:0,config:abConfig(),stages:[{id:abId('stage'),name:'阶段 1',steps:[{...abStep(),name:'步骤 1',source:'inline'}]}]};}
function ntcEnsure(){
  const d=newTaskDraft();if(!d)return null;
  const type=ntcType(d);d.ntcCache=d.ntcCache||{};
  if(!d.ntc||d.ntc.type!==type||d.ntc.scope!==d.project){
    d.ntc=d.ntcCache[d.project+'|'+type]||ntcCustom(type,d.project);
    d.ntcCache[d.project+'|'+type]=d.ntc;
  }
  return d.ntc;
}
function ntcBtn(label,a,v='',cls='sm'){return btn(label,'ntc-'+a,v,cls);}
function ntcSummary(x){
  if(x.type==='workflow')return `<div class="ntc-preview-steps">${(x.stages||[]).map((g,i)=>`<section><b>${i+1}. ${esc(g.name)}</b>${g.steps.map((st,j)=>`<div><strong>${i+1}.${j+1} ${esc(st.name)}</strong><p>${esc(st.input||'尚未填写步骤输入')}</p><small>${st.manualConfirm?'人工确认':'自动流转'} · 最大重试 ${st.maxRetries} 次</small>${ntcSummary({type:'task',scope:x.scope,config:st.config})}</div>`).join('')}</section>`).join('')}</div>`;
  const c=x.config;
  const environment=abEnvironment(c.environment,x.scope);
  return spxFacts([['Agent类型',c.agentType],['模型',c.model||'平台默认模型'],['运行环境',abEnvLabel(c.environment,x.scope)],['责任人',c.ownerMode==='fixed'?c.owner:'跟随本次触发人'],['扩展',(c.extensions||[]).map(id=>asset(id)?.name||id).join('、')||'未选择'],['准出规则',(c.gates||[]).map(g=>({prompt:'Prompt',artifact:'产物存在性',command:'自定义命令'})[g.type]+': '+g.value).join('；')||'未配置']])+`<h4>预置提示词</h4><p class="ntc-preview-prompt">${esc(c.presetPrompt||'未设置')}</p><h4>输入提示词模板</h4><p class="ntc-preview-prompt">${esc(c.inputPromptTemplate||'未设置')}</p><h4>运行配置</h4>${environment.ok?abReadonly(c.environment.mode==='instance'?environment.config:c.environmentOverride||environment.config,environment.asset):`<p>${esc(environment.message)}</p>`}`;
}
const ntcPreviousRenderNewTask=renderNewTaskPage;
renderNewTaskPage=function(){
  const x=ntcEnsure(),d=newTaskDraft();if(!x)return ntcPreviousRenderNewTask();
  const name=x.id?x.name:'自定义配置';d.executor=name;
  let html=ntcPreviousRenderNewTask();d.executor=name;
  const label=(x.type==='workflow'?'串联任务 · ':'原子任务 · ')+name;
  const pill=`<button class="nt-pill" data-a="nt-pick" data-v="executor" aria-haspopup="menu">${ico(x.type==='workflow'?'workflow':'task')}<span>${esc(label)}</span>${ico('down')}</button>${ntcBtn(ico('settings')+'配置'+(x.modified?' · 已修改':''),'edit','','nt-pill')}`;
  return html.replace(/<button class="nt-pill" data-a="nt-pick" data-v="executor"[\s\S]*?<\/button>/,pill).replace(/系列任务/g,'串联任务');
};
const ntcPreviousMenu=newTaskMenu;
newTaskMenu=function(key){
  if(key!=='executor')return ntcPreviousMenu(key);
  const d=newTaskDraft(),x=ntcEnsure();if(!d)return;
  const same=document.querySelector('.ntc-menu');closeExtMenu();if(same)return;
  const trigger=document.querySelector('.nt-tray [data-v="executor"]');if(!trigger)return;
  const r=trigger.getBoundingClientRect(),rows=ntcTemplates(d);
  document.body.insertAdjacentHTML('beforeend',`<div class="as2-menu ntc-menu" role="menu" data-for="nt" aria-label="选择任务模板"><div class="as2-menu-label">${abLabels[ntcType(d)]}</div>${rows.map(t=>`<button role="menuitem" data-a="ntc-select" data-v="${esc(t.id)}" data-ntc-preview="${esc(t.id)}">${x.id===t.id?ico('check'):'<i class="nt-menu-gap"></i>'}<span>${esc(t.name)}</span><small>V${t.version}</small></button>`).join('')||'<div class="as2-menu-label">当前范围暂无可用模板</div>'}<div class="as2-menu-sep"></div><button role="menuitem" data-a="ntc-custom" data-ntc-preview="custom">${ico('settings')}<span>不使用模板 · 自定义配置</span></button></div>`);
  const menu=document.querySelector('.ntc-menu');menu.style.left=Math.max(8,Math.min(r.left,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,r.bottom+menu.offsetHeight+6>innerHeight?r.top-menu.offsetHeight-6:r.bottom+6)+'px';
};
function ntcPreview(id){
  const menu=document.querySelector('.ntc-menu');if(!menu)return;
  const current=ntcEnsure(),x=id==='custom'?(current.id?ntcCustom(ntcType(newTaskDraft()),newTaskDraft().project):current):current.id===id?current:abGet(id,newTaskDraft().project);if(!x)return;
  menu.querySelector('.ntc-template-preview')?.remove();
  menu.insertAdjacentHTML('beforeend',`<aside class="ntc-template-preview" aria-label="${esc(x.name)}的配置预览"><header><b>${esc(x.name)}</b><small>${x.id?'V'+x.version:'从空白开始'}</small></header><div class="ntc-template-preview-body">${ntcSummary(x)}</div><footer>${ntcBtn('编辑本次配置','edit',id,'primary sm')}</footer></aside>`);
  const p=menu.querySelector('aside'),r=menu.getBoundingClientRect(),w=Math.min(380,innerWidth-24);p.style.width=w+'px';p.style.left=Math.max(8-r.left,r.right+w+8>innerWidth?-w-8:r.width+8)+'px';p.style.top=Math.max(8-r.top,Math.min(0,innerHeight-r.top-p.offsetHeight-8))+'px';
}
function ntcSelect(id){
  const d=newTaskDraft(),x=id==='custom'?ntcCustom(ntcType(d),d.project):abGet(id,d.project);if(!x||x.draft||!abUsable(x))return;
  d.ntc=abCopy(x);d.ntcCache[d.project+'|'+ntcType(d)]=d.ntc;d.executor=x.id?x.name:'自定义配置';
  if(!d.goal.trim()&&x.type==='task')d.goal=x.config.inputPromptTemplate||'';
  closeExtMenu();render();
}
function ntcFields(c,prefix,scope){
  let html=abAtomicFields(c,prefix,scope,'private');
  const at=html.lastIndexOf('<section class="ab-section"><h2>运行环境');
  html=html.slice(0,at)+ntcEnvironmentFields(c,prefix,scope);
  return html.replace(/data-ab-/g,'data-ntc-').replace(/data-a="ab-/g,'data-a="ntc-');
}
function ntcEnvironmentFields(c,p,scope){
  const b=c.environment,r=abEnvironment(b,scope),envs=abItems('env',scope),ins=abItems('instance',scope).filter(abUsable);
  if(b.mode!=='instance'&&!c.environmentOverride)c.environmentOverride=abCopy(r.config||abDefaults());
  let html=`<section class="ab-section"><h2>运行环境</h2>${abField('运行环境来源',p+'.environment.mode',b.mode,{options:[['default','系统默认 · 云端 / 绿区'],['template','运行环境模板'],['instance','复用运行环境实例']]})}`;
  if(b.mode==='template')html+=abField('运行环境模板 *',p+'.environment.templateId',b.templateId,{options:[['','请选择模板'],...envs.map(e=>[e.id,e.name+' · V'+e.version])]})+(b.templateId?abField('模板版本',p+'.environment.version',b.version,{options:(abGet(b.templateId,scope)?.history||[]).map(h=>[h.version,'V'+h.version])}):'');
  if(b.mode==='instance')return html+abField('运行环境实例 *',p+'.environment.instanceId',b.instanceId,{options:[['','请选择实例'],...ins.map(i=>[i.id,i.name+' · '+i.workingDirectory])]})+(r.ok?abReadonly(r.config,r.asset):`<div class="ab-error">${esc(r.message)}</div>`)+`<p class="ab-note">复用已有工作目录，实例的运行配置只读。</p></section>`;
  const e=c.environmentOverride,ep=p+'.environmentOverride',local=e.location==='本地';
  html+=`<p class="ab-note">本次可调整运行配置，启动时创建独立的私密工作目录。不会覆盖来源模板，也不会出现在长期实例列表中。</p><div class="ab-two">${abField('运行位置',ep+'.location',e.location,{options:['云端','本地']})}${abField('安全区域',ep+'.zone',e.zone,{options:['绿区','黄区']})}</div>`;
  html+=local?abField('本地运行时',ep+'.runtimeId',e.runtimeId||'',{options:[['','按责任人使用当前安全区域首个运行时'],...abRuntimes(scope,abUser(),e.zone).map(r=>[r.id,r.name+' · '+(r.status==='online'?'在线':'离线')])]}):abField('镜像 · 可选',ep+'.image',e.image,{options:[...new Set(['',e.image,'node:20','python:3.11'])].map(v=>[v,v||'平台默认镜像'])})+abSetFields('工具集',ep+'.toolsets',e.toolsets||[],['基础开发','数据分析','容器工具'])+abSetFields('工具',ep+'.tools',e.tools||[],['Git','Python','Node.js','kubectl','Playwright']);
  const repos=scope==='个人'?bfRepos(scope):spxState(scope).repos;
  html+=abSetFields('代码仓 · 可选',ep+'.repos',(e.repos||[]).map(r=>r.name||r),repos.map(r=>r.name));
  html+=(e.repos||[]).map((r,i)=>abField('分支 · '+esc(r.name||r),ep+'.repos.'+i+'.branch',r.branch||'main')).join('');
  return html+abField('启动路径 · 可选',ep+'.path',e.path)+abField('初始化命令 · 可选',ep+'.init',e.init,{textarea:true})+'</section>';
}
function ntcOpen(id=''){
  const current=ntcEnsure(),d=newTaskDraft();if(!current)return;
  const x=id==='custom'?(current.id?ntcCustom(ntcType(d),d.project):current):id&&id!==current.id?abGet(id,d.project):current;if(!x)return;
  closeExtMenu();ntcEditing={snapshot:abCopy(x),selectedStep:x.type==='workflow'?abAllSteps(x)[0]?.id:null,errors:[]};ntcRenderDrawer();
}
function ntcRenderDrawer(){
  if(!ntcEditing)return;const x=ntcEditing.snapshot,st=x.type==='workflow'?abAllSteps(x).find(s=>s.id===ntcEditing.selectedStep):null;
  let host=document.getElementById('ntcDrawer');if(!host){document.body.insertAdjacentHTML('beforeend','<div id="ntcDrawer" class="ntc-drawer-backdrop"></div>');host=document.getElementById('ntcDrawer');}
  const series=x.type==='workflow';
  const steps=series?`<section class="ntc-series"><label class="ab-field">总体目标 · 可选<textarea data-ntc-field="goal">${esc(x.goal||'')}</textarea></label>${x.stages.map((g,gi)=>`<div class="ntc-stage"><div class="row"><input aria-label="阶段名称" data-ntc-field="stages.${gi}.name" value="${esc(g.name)}">${ntcBtn(ico('plus'),'step-add',g.id,'iconbtn')}</div><nav>${g.steps.map((s,i)=>`<button class="${s.id===st?.id?'active':''}" data-a="ntc-step" data-v="${s.id}">${gi+1}.${i+1} ${esc(s.name||'未命名步骤')}</button>`).join('')}</nav></div>`).join('')}${ntcBtn('添加阶段','stage-add')}</section>`:'';
  const prefix=series?'step.config':'config';
  const input=series&&st?`${abField('步骤名称 *','step.name',st.name)}${abField('步骤来源','step.source',st.source,{options:[['inline','自定义配置'],['template','引用原子任务模板']]})}${st.source==='template'?abField('原子任务模板 *','step.atomicId',st.atomicId,{options:[['','请选择模板'],...abItems('task',x.scope).filter(a=>!a.draft&&abUsable(a)).map(a=>[a.id,a.name+' · V'+a.version])]}):''}${abField('步骤输入 *','step.input',st.input,{textarea:true})}${abCheck('完成后需要人工确认','step.manualConfirm',st.manualConfirm)}${abField('最大重试次数','step.maxRetries',st.maxRetries,{type:'number'})}${abField('复用前序步骤环境','step.reuseStepId',st.reuseStepId||'',{options:[['','不复用'],...abReuseOptions(x,st).map(s=>[s.id,s.name])]})}<div class="row">${ntcBtn('前移','step-move',st.id+'|-1','link sm')}${ntcBtn('后移','step-move',st.id+'|1','link sm')}${abAllSteps(x).length>1?ntcBtn('删除步骤','step-remove',st.id,'link sm'):''}</div>`:'';
  const fields=series?(st?input+ntcFields(st.config,prefix,x.scope):'<div class="empty">添加步骤开始配置。</div>'):ntcFields(x.config,prefix,x.scope);
  const replaced=fields.replace(/data-ab-/g,'data-ntc-');
  host.innerHTML=`<section class="ntc-drawer" role="dialog" aria-modal="true" aria-labelledby="ntcDrawerTitle"><header><div><h2 id="ntcDrawerTitle">${series?'串联任务':'原子任务'}配置</h2><p>${esc(x.id?x.name+' · V'+x.version:'自定义配置')} · 仅对当前任务生效</p></div>${ntcBtn(ico('close'),'cancel','','iconbtn')}</header><div class="ntc-drawer-body"><p class="ab-note">本次配置以独立快照保存，原模板保持不变。</p>${ntcEditing.errors.length?`<div class="ab-error" role="alert">${ntcEditing.errors.map(e=>`<p>${esc(e)}</p>`).join('')}</div>`:''}${steps}${replaced}</div><footer>${ntcBtn('取消','cancel')}${ntcBtn('应用本次配置','apply','','primary sm')}</footer></section>`;
  if(!host.dataset.focused){host.dataset.focused='true';requestAnimationFrame(()=>host.querySelector('[data-a="ntc-cancel"]')?.focus({preventScroll:true}));}
}
function ntcPath(path){const x=ntcEditing?.snapshot;if(!x)return null;return path.startsWith('step.')?{root:abAllSteps(x).find(s=>s.id===ntcEditing.selectedStep),path:path.slice(5)}:{root:x,path};}
function ntcChange(e){
  const t=e.target;if(!ntcEditing||!t.closest('#ntcDrawer'))return;
  if(e.type==='input'&&(t.type==='checkbox'||t.tagName==='SELECT'))return;
  if(e.type==='change'&&t.type!=='checkbox'&&t.tagName!=='SELECT')return;
  const key=t.dataset.ntcField||t.dataset.ntcSet;if(!key)return;
  const loc=ntcPath(key);if(!loc?.root)return;
  let value=t.type==='checkbox'?t.checked:t.type==='number'?Number(t.value):t.value;
  if(t.dataset.ntcSet){const list=abAt(loc.root,loc.path)||[],isRepos=key.endsWith('.repos'),has=isRepos?list.some(r=>(r.name||r)===t.value):list.includes(t.value);value=has?list.filter(r=>(isRepos?r.name||r:r)!==t.value):[...list,isRepos?{name:t.value,branch:'main'}:t.value];}
  if(key.endsWith('.version'))value=Number(value);
  abSet(loc.root,loc.path,value);ntcEditing.errors=[];
  if(key.endsWith('.atomicId')){const st=loc.root,a=abGet(value,ntcEditing.snapshot.scope);if(a){st.atomicVersion=a.version;st.atomicSnapshot=abCopy(a);st.config=abCopy(a.config);st.name=a.name;if(!st.input)st.input=a.config.inputPromptTemplate||'';}}
  if(/\.environment\.(mode|templateId|version|instanceId)$/.test(key)){
    const config=key.startsWith('step.')?loc.root.config:ntcEditing.snapshot.config;
    if(key.endsWith('.templateId'))config.environment.version=abGet(value,ntcEditing.snapshot.scope)?.version||0;
    config.environmentOverride=null;
  }
  if(e.type==='change'&&(t.tagName==='SELECT'||t.type==='checkbox'))ntcRenderDrawer();
}
document.addEventListener('input',ntcChange);document.addEventListener('change',ntcChange);
function ntcValidate(x){
  const validation=abCopy(x),configs=validation.type==='workflow'?abAllSteps(validation).map(st=>st.config):[validation.config];
  for(const c of configs)if(c.environmentOverride&&c.environment.mode!=='instance')c.environment={mode:'default'};
  const errors=x.type==='workflow'?abValidate({...validation,name:x.name||'自定义串联任务',visibility:'private'}):abValidateConfig(validation.config,x.scope,'private');
  const steps=x.type==='workflow'?abAllSteps(x):[{config:x.config}];
  for(const st of steps){const c=st.config,r=abEnvironment(c.environment,x.scope),env=c.environment.mode==='instance'?r.config:c.environmentOverride||r.config;
    if(!r.ok)errors.push(r.message);
    if(env?.location==='本地'&&c.agentType!=='codeagent')errors.push('本地运行环境仅支持 codeagent。');
    if(env?.location==='本地'&&c.environment.mode!=='instance'){const owner=c.ownerMode==='fixed'?c.owner:newTaskDraft()?.owner||abUser(),list=abRuntimes(x.scope,owner,env.zone),rt=env.runtimeId?list.find(r=>r.id===env.runtimeId):list[0];if(!rt||rt.status!=='online'||!rt.defaultPath)errors.push('本地运行时不可用或未配置默认路径。');}
    if(st.reuseStepId){const prev=steps.find(s=>s.id===st.reuseStepId),pc=prev?.config,pr=pc?abEnvironment(pc.environment,x.scope):null,pe=pc?(pc.environment.mode==='instance'?pr.config:pc.environmentOverride||pr.config):null;if(!prev||JSON.stringify(env)!==JSON.stringify(pe)||(c.ownerMode==='fixed'?c.owner:'follow')!==(pc.ownerMode==='fixed'?pc.owner:'follow'))errors.push('复用前序环境时，运行配置与责任人必须一致。');}
  }
  return [...new Set(errors)];
}
const ntcPreviousAction=newTaskAction;
newTaskAction=function(a,v){
  if(!a.startsWith('ntc-')){if(a==='nt-mode'&&newTaskDraft())ntcClose();if(a==='nt-set'&&String(v).startsWith('project|')&&newTaskDraft())ntcClose();return ntcPreviousAction(a,v);}
  const d=newTaskDraft();if(!d)return true;const x=ntcEditing?.snapshot,st=x?.type==='workflow'?abAllSteps(x).find(s=>s.id===ntcEditing.selectedStep):null;
  switch(a.slice(4)){
    case 'select':ntcSelect(v);return true;
    case 'custom':ntcSelect('custom');ntcOpen();return true;
    case 'edit':ntcOpen(v);return true;
    case 'cancel':ntcClose();return true;
    case 'apply':{const errors=ntcValidate(x);if(errors.length){ntcEditing.errors=errors;ntcRenderDrawer();document.querySelector('.ntc-drawer-body').scrollTop=0;return true;}x.modified=true;d.ntc=abCopy(x);d.ntcCache[d.project+'|'+ntcType(d)]=d.ntc;d.executor=x.id?x.name:'自定义配置';if(!d.goal.trim()&&x.type==='task')d.goal=x.config.inputPromptTemplate||'';ntcClose();save();render();return true;}
    case 'step':ntcEditing.selectedStep=v;break;
    case 'stage-add':{const step={...abStep(),name:'步骤 1',source:'inline'};x.stages.push({id:abId('stage'),name:'阶段 '+(x.stages.length+1),steps:[step]});ntcEditing.selectedStep=step.id;break;}
    case 'step-add':{const g=x.stages.find(g=>g.id===v),step={...abStep(),name:'步骤 '+(g.steps.length+1),source:'inline'};g.steps.push(step);ntcEditing.selectedStep=step.id;break;}
    case 'step-remove':if(abAllSteps(x).length>1){for(const g of x.stages)g.steps=g.steps.filter(s=>s.id!==v);x.stages=x.stages.filter(g=>g.steps.length);ntcEditing.selectedStep=abAllSteps(x)[0].id;}break;
    case 'step-move':{const [id,dir]=v.split('|'),g=x.stages.find(g=>g.steps.some(s=>s.id===id));abMove(g.steps,g.steps.findIndex(s=>s.id===id),dir);break;}
    case 'gate-add':{const loc=ntcPath(v);abAt(loc.root,loc.path).gates.push({type:'prompt',value:''});break;}
    case 'gate-remove':{const [path,i]=v.split('|'),loc=ntcPath(path);abAt(loc.root,loc.path).gates.splice(Number(i),1);break;}
    case 'ext-remove':{const [path,id]=v.split('|'),loc=ntcPath(path),c=abAt(loc.root,loc.path);c.extensions=c.extensions.filter(v=>v!==id);break;}
  }
  ntcRenderDrawer();return true;
};
function ntcClose(){document.getElementById('ntcDrawer')?.remove();ntcEditing=null;document.querySelector('[data-a="ntc-edit"]')?.focus({preventScroll:true});}
document.addEventListener('pointerover',e=>{const row=e.target.closest?.('[data-ntc-preview]');if(row&&row.closest('.ntc-menu')){if(!row.contains(e.relatedTarget))ntcPreview(row.dataset.ntcPreview);return;}const pill=e.target.closest?.('.nt-tray [data-v="executor"]');if(pill&&!pill.contains(e.relatedTarget)){clearTimeout(ntcHoverTimer);ntcHoverTimer=setTimeout(()=>{if(newTaskDraft()&&!document.querySelector('.as2-menu'))newTaskMenu('executor');},180);}});
document.addEventListener('pointerout',e=>{if(e.target.closest?.('.nt-tray [data-v="executor"]'))clearTimeout(ntcHoverTimer);});
document.addEventListener('focusin',e=>{if(e.target.matches?.('[data-ntc-preview]'))ntcPreview(e.target.dataset.ntcPreview);});
document.addEventListener('keydown',e=>{if(!ntcEditing)return;if(e.key==='Escape'){e.preventDefault();ntcClose();}else if(e.key==='Tab'){const items=[...document.querySelectorAll('#ntcDrawer button:not(:disabled),#ntcDrawer input:not(:disabled),#ntcDrawer textarea:not(:disabled),#ntcDrawer select:not(:disabled)')].filter(e=>e.getClientRects().length),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
document.addEventListener('click',e=>{if(e.target.id==='ntcDrawer')ntcClose();});
newTaskCreate=function(){
  const d=newTaskDraft(),x=abCopy(ntcEnsure());if(!d||!x)return;
  const goal=d.goal.trim(),errors=ntcValidate(x);if(!goal)errors.unshift('请先写清楚任务目标与验收。');
  if(x.id&&!abUsable(abGet(x.id,x.scope)))errors.push('来源模板已失效或无权使用。');
  if(errors.length){ntcOpen();ntcEditing.errors=[...new Set(errors)];ntcRenderDrawer();return;}
  const title=(d.title.trim()||goal.split(/[\n。；;]/).find(Boolean)||'未命名任务').slice(0,50),steps=x.type==='workflow'?abAllSteps(x):[{id:'atomic',config:x.config,input:goal}],instances=[],byStep=new Map();
  for(const step of steps){const c=step.config,owner=c.ownerMode==='fixed'?c.owner:d.owner,r=abEnvironment(c.environment,x.scope);let env;
    if(step.reuseStepId)env=byStep.get(step.reuseStepId);
    else if(c.environment.mode==='instance')env=r.asset;
    else{const config=abCopy(c.environmentOverride||r.config),id=abId('runenv'),runtime=config.location==='本地'?(config.runtimeId?abRuntimes(x.scope,owner,config.zone).find(r=>r.id===config.runtimeId):abRuntimes(x.scope,owner,config.zone)[0]):null;env={id,type:'instance',scope:x.scope,owner,temporary:true,visibility:'private',config,templateId:c.environment.templateId||'',templateVersion:c.environment.version||0,workingDirectory:runtime?runtime.defaultPath+'/'+id:'/workspace/'+id,runtimeSnapshot:runtime?abCopy(runtime):null};instances.push(env);}
    if(!env){notify('前序复用来源不可用，请检查步骤顺序。');return;}byStep.set(step.id,env);step.environmentInstanceId=env.id;step.resolvedOwner=owner;step.finalPrompt=[c.presetPrompt,step.input].filter(v=>v?.trim()).join('\n\n---\n\n');
  }
  const task={id:nextTaskId(),title,scope:d.project,project:d.project==='个人'?'':d.project,type:'temp',trigger:'manual',status:'pending',source:x.id?'任务模板 / '+x.name:'自定义配置 / 临时任务',owner:steps[0].resolvedOwner,triggeredBy:abUser(),rev:1,run:0,kind:'board',goal,executor:x.type==='workflow'?(x.id?x.name:'自定义串联任务'):x.config.agentType,executorType:x.type==='workflow'?'workflow':'agent',spaceIds:[...d.spaceIds],knowledgeSnapshot:contextSnapshot(d.spaceIds),configVersion:3,config:x.type==='task'?abCopy(x.config):undefined,seriesDefinition:x.type==='workflow'?abCopy(x):undefined,build36Snapshot:x,templateId:x.id||'',templateName:x.id?x.name:'',templateVersion:x.version||0,environmentIds:steps.map(s=>s.environmentInstanceId),environments:abCopy([...new Map([...byStep.values()].map(i=>[i.id,i])).values()]),finalPrompt:x.type==='task'?steps[0].finalPrompt:undefined,created:new Date().toISOString()};
  abEnsure().assets.push(...instances);s.tasks.push(task);s.newTask=null;
  if(d.personal){s.view='personal';s.page='tasks';s.personalBoard=newBoardState(true);}else{s.view='team';s.page='board';s.project=d.project;s.projectBoard=newBoardState();}
  closeExtMenu();ntcClose();save();render();notify('任务已加入看板，本次配置快照已保存。');
};
