// Build V3.6: configuration-only prototype, persisted with the existing app state.
const abTypes=['task','workflow','env','instance'];
const abLabels={task:'原子任务模板',workflow:'串联任务模板',env:'运行环境模板',instance:'运行环境实例'};
const abCopy=x=>JSON.parse(JSON.stringify(x));
const abId=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const abUser=()=>s.prototypeUser?.name||'我';
const abScope=()=>bx2ScopeNow();
const abAdmin=scope=>scope==='个人'||['owner','admin'].includes(s.projectRoles?.[scope]||s.prototypeRole||'admin');
const abShared=x=>['team','public'].includes(x.visibility);
const abOwn=x=>(x.templateOwner||x.owner||x.createdBy||'我')===abUser();
const abVisible=x=>x.type==='env'||abOwn(x)||abShared(x)||x.type!=='instance'&&abAdmin(x.scope);
const abUsable=x=>x&&(x.type==='env'||abOwn(x)||abShared(x));
const abIcon=t=>t==='workflow'?'workflow':t==='task'?'task':'cloud';
function abDefaults(){return {location:'云端',zone:'绿区',image:'',toolsets:[],tools:[],repos:[],path:'',init:''};}
function abConfig(){return {agentType:'codeagent',presetPrompt:'',inputPromptTemplate:'',model:'',extensions:[],gates:[],ownerMode:'follow',owner:'',environment:{mode:'default',templateId:'',version:0,instanceId:''}};}
function abStep(){return {id:abId('step'),name:'',source:'template',atomicId:'',atomicVersion:0,atomicSnapshot:null,input:'',config:abConfig(),reuseStepId:'',manualConfirm:false,maxRetries:2};}
function abEnsure(){
  if(!s.build36){
    const assets=[];
    for(const type of ['env','task'])for(const i of bx2Items(type,'all')){
      const scope=i._scope,local=i.location==='本地'||/本地|用户设备/.test(i.image||'');
      const base={id:i.id,type,scope,name:i.name,description:i.desc||'',version:Number(i.ver)||1,visibility:type==='env'?'public':i.visibility||'public',templateOwner:i.templateOwner||i.createdBy||'我',createdBy:i.createdBy||'我',history:[],legacy:i._t==='role',legacyType:i._t};
      if(type==='env')base.config={...abDefaults(),location:local?'本地':'云端',zone:i.zone||'绿区',image:local?'':i.image||'',path:i.path||'',init:i.init||'',repos:(i.repos||[]).map(r=>typeof r==='string'?{name:r,branch:'main'}:r)};
      else base.config={...abConfig(),agentType:/zero/i.test(i.agent||'')?'zero':'codeagent',presetPrompt:i.instructions||i.goal||'',inputPromptTemplate:i.inputPromptTemplate||'',model:i.model||'',extensions:i.extensions||[],environment:i.envMode==='reuse'?{mode:'instance',instanceId:i.instanceId||''}:i.envId?{mode:'template',templateId:i.envId,version:Number(i.envVersion)||1}:{mode:'default'}};
      base.history=[{version:base.version,at:'迁移版本',snapshot:abCopy({...base,history:undefined})}];assets.push(base);
    }
    // Preserve existing series definitions; legacy graph drafts stay explicitly editable drafts.
    for(const w of s.workflowDrafts||[]){
      const scope=w.scope==='global'||!w.scope?'个人':w.scope,series=w.series;
      const stages=(series?.stages||[{id:abId('stage'),name:'初始阶段',steps:[abStep()]}]).map(g=>({...g,id:g.id||abId('stage'),steps:(g.steps||[]).map(st=>{
        const id=String(st.atomic||'').replace(/^(task|role):/,''),a=assets.find(x=>x.type==='task'&&x.id===id&&x.scope===scope);
        return {...abStep(),...st,source:'template',atomicId:id,atomicVersion:a?.version||0,atomicSnapshot:a?abCopy(a):null,config:a?abCopy(a.config):abConfig(),manualConfirm:!!st.manualConfirm};
      })}));
      assets.push({id:w.id||abId('series'),type:'workflow',scope,name:w.label||series?.name||'未命名串联模板',description:'',goal:series?.goal||'',stages,version:0,visibility:abAdmin(scope)?'public':'private',templateOwner:abUser(),createdBy:abUser(),history:[],draft:true,legacyGraph:abCopy(w.nodes||[])});
    }
    s.build36={schema:1,assets,type:'task',query:'',editor:null};
  }
  return s.build36;
}
function abItems(type,scope=abScope()){return abEnsure().assets.filter(x=>x.type===type&&(scope==='all'||x.scope===scope)&&!x.deleted&&!x.temporary&&abVisible(x));}
function abGet(id,scope){return abEnsure().assets.find(x=>x.id===id&&!x.deleted&&(!scope||x.scope===scope));}
function abRuntimes(scope,owner=abUser(),zone='绿区'){
  const rows=Array.isArray(s.localRuntimes)&&s.localRuntimes.length?s.localRuntimes:[{id:'rt-mac',name:'开发工作站 · 示例',owner:abUser(),zone:'绿区',status:'online',defaultPath:'/Users/me/AgentSpace'},{id:'rt-linux',name:'联调工作站 · 示例',owner:abUser(),zone:'绿区',status:'online',defaultPath:'/home/me/AgentSpace'},{id:'rt-win',name:'黄区开发机 · 示例',owner:abUser(),zone:'黄区',status:'offline',defaultPath:'C:/AgentSpace'}];
  return rows.filter(r=>(r.owner||r.user||abUser())===owner&&(r.zone||'绿区')===zone);
}
function abMembers(scope){return [abUser(),...DIRECTORY.filter(p=>p.type==='person'&&scope!=='个人'&&p.projects.includes(scope)).map(p=>p.name)];}
function abExts(scope){return (s.installations||[]).filter(i=>i.enabled&&i.source==='AgentCenter'&&(scope==='个人'?['personal','global'].includes(i.scope):i.scope==='project'&&i.project===scope)).filter(i=>asset(i.assetId));}
function abExtType(a){return a?.type==='Plugin'?'Extension':a?.type;}
function abSnapshot(a,version){return Number(version)===a?.version?a:(a?.history||[]).find(h=>h.version===Number(version))?.snapshot;}
function abEnvironment(binding,scope){
  const b=binding||{mode:'default'};
  if(b.mode==='default')return {ok:true,config:abDefaults()};
  const a=abGet(b.mode==='instance'?b.instanceId:b.templateId,scope);
  if(!a||!abUsable(a))return {ok:false,message:'运行环境引用已失效或无权访问，请重新选择。'};
  const snap=b.mode==='template'?abSnapshot(a,b.version):a;
  if(!snap)return {ok:false,message:'引用的运行环境模板版本不可用。'};
  return {ok:true,config:snap.config,asset:a};
}
function abEnvLabel(b,scope){const r=abEnvironment(b,scope);return !r.ok?r.message:b?.mode==='template'?r.asset.name+' · V'+b.version:b?.mode==='instance'?'复用实例 · '+r.asset.name:'平台默认 · 云端 / 绿区';}
function abButton(label,a,v='',cls='sm'){return btn(label,'ab-'+a,v,cls);}
function abField(label,key,value,{options=null,hint='',disabled=false,textarea=false,type='text'}={}){
  const attrs=`data-ab-field="${key}" ${disabled?'disabled':''}`;
  const control=options?`<select ${attrs}>${options.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(String(v))}" ${String(v)===String(value)?'selected':''}>${esc(String(l))}</option>`;}).join('')}</select>`:textarea?`<textarea ${attrs} rows="3">${esc(value||'')}</textarea>`:`<input ${attrs} type="${type}" value="${esc(String(value??''))}">`;
  return `<label class="ab-field">${label}${control}${hint?`<small>${hint}</small>`:''}</label>`;
}
function abCheck(label,key,on,disabled=false){return `<label class="ab-switch"><input type="checkbox" data-ab-field="${key}" ${on?'checked':''} ${disabled?'disabled':''}>${label}</label>`;}
function abScopeField(d){return abField('应用范围 *','scope',d.scope,{options:['个人',...projectNames],disabled:!!d.id,hint:d.id?'创建后保留原应用范围。':'选择个人或一个具体项目。'});}
function abVisibility(d){return d.type==='env'?'<div class="ab-note">运行环境模板统一公开，在当前应用范围内共享。</div>':abField('共享类型','visibility',d.visibility,{disabled:d.readOnly,options:abAdmin(d.scope)||d.type==='instance'?[['public','公开'],['private','私密']]:[['private','私密']],hint:d.type==='instance'?'默认私密；公开后当前范围成员可复用。':'公开表示在当前应用范围内共享；发布不改变归属人。'});}
function abEnvFields(c,prefix='config',instance=false){
  const d=abEnsure().editor,local=c.location==='本地',existing=instance&&d.sourceMode!=='template'&&local&&d.folderMode==='existing';
  const repos=bfRepos(d.scope);
  return `<div class="ab-two">${abField('安全区域',prefix+'.zone',c.zone,{options:['绿区','黄区']})}${abField('运行位置',prefix+'.location',c.location,{options:['云端','本地']})}</div>${local?`${instance?abField('本地运行时 *',prefix+'.runtimeId',c.runtimeId||'',{options:[['','使用本人当前安全区域首个运行时'],...abRuntimes(d.scope,abUser(),c.zone).map(r=>[r.id,r.name+' · '+(r.status==='online'?'在线':'离线')])],hint:'不会跳过首个离线设备；设备不可用时阻止创建。'}):'<div class="ab-note">模板不绑定设备。创建任务时按责任人及安全区域选择本地运行时。</div>'}${instance&&d.sourceMode!=='template'?abField('本地目录方式','folderMode',d.folderMode||'new',{options:[['new','新建工作目录'],['existing','使用已有文件夹']]}):''}`:`${abField('镜像 · 可选',prefix+'.image',c.image,{options:[['','平台默认镜像'],...['node:20','node:20 · pnpm 9','node:20 · 只读凭证','python:3.11',...(c.image&&!['node:20','node:20 · pnpm 9','node:20 · 只读凭证','python:3.11'].includes(c.image)?[c.image]:[])] ]})}${abSetFields('工具集 · 可选',prefix+'.toolsets',c.toolsets,['基础开发','数据分析','容器工具'])}${abSetFields('工具 · 可选',prefix+'.tools',c.tools,['Git','Python','Node.js','kubectl','Playwright'])}`}
    ${existing?abField('已有文件夹路径 *','existingFolder',d.existingFolder||'',{hint:'填写所选设备上已存在的绝对路径；本原型只演示路径校验，不读取真实目录。'}):`${abSetFields('代码仓 · 可选',prefix+'.repos',c.repos.map(r=>typeof r==='string'?r:r.name),repos.map(r=>r.name))}${c.repos.map((r,i)=>abField('分支 · '+esc(r.name),prefix+'.repos.'+i+'.branch',r.branch||'main')).join('')}${abField('启动路径 · 可选',prefix+'.path',c.path,{hint:local?'在运行时默认路径下创建唯一文件夹；启动路径在工作目录内解析。':'留空由运行环境解析默认工作目录。'})}`}${abField('初始化命令 · 可选',prefix+'.init',c.init,{textarea:true,hint:'留空不执行；仅归运行环境，不拼入任务提示词。'})}`;
}
function abSetFields(label,key,values=[],options=[]){return `<div class="ab-field">${label}</div><div class="ab-checks">${options.map(v=>`<label><input type="checkbox" data-ab-set="${key}" value="${esc(v)}" ${values.includes(v)?'checked':''}>${esc(v)}</label>`).join('')||'<small>当前范围没有可选项。</small>'}</div>`;}
function abReadonly(c,a){return `<div class="ab-readonly">${[['运行位置 / 安全区域',c.location+' / '+c.zone],['镜像',c.location==='本地'?'本地运行时':c.image||'平台默认'],['工具集 / 工具',[...(c.toolsets||[]),...(c.tools||[])].join('、')||'无额外工具'],['代码仓',(c.repos||[]).map(r=>(r.name||r)+' @ '+(r.branch||'main')).join('、')||'无'],['工作目录 / 启动路径',a?.workingDirectory||c.path||'创建时解析'],['初始化命令',c.init||'空 · 不执行'],...(c.location==='本地'?[['本地运行时',a?.runtimeSnapshot?.name||c.runtimeId||'任务创建时按责任人选择']]:[])].map(([k,v])=>`<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div>`;}
function abBindingFields(c,prefix,scope,visibility){
  const b=c.environment||{mode:'default'},r=abEnvironment(b,scope),shared=visibility==='public',envs=abItems('env',scope),instances=abItems('instance',scope).filter(i=>abUsable(i)&&(!shared||abShared(i)));
  const options=[['default','平台默认 · 每次新建工作目录'],['template','运行环境模板 · 按版本新建实例'],['instance','已有运行环境实例 · 复用工作目录']];
  return `<section class="ab-section"><h2>运行环境</h2>${abField('环境绑定',prefix+'.environment.mode',b.mode,{options})}${b.mode==='template'?`${abField('运行环境模板 *',prefix+'.environment.templateId',b.templateId,{options:[['','请选择模板'],...envs.map(e=>[e.id,e.name+' · V'+e.version])]})}${b.templateId?abField('固定版本',prefix+'.environment.version',b.version,{options:(abGet(b.templateId,scope)?.history||[]).map(h=>[h.version,'V'+h.version])}):''}`:b.mode==='instance'?abField('已有运行环境实例 *',prefix+'.environment.instanceId',b.instanceId,{options:[['','请选择实例'],...instances.map(i=>[i.id,i.name+' · '+i.workingDirectory])],hint:shared?'公开模板仅可绑定公开实例。':'候选仅包含当前用户有权使用的实例。'}):''}${!r.ok?`<div class="ab-error">${esc(r.message)}</div>`:b.mode==='instance'&&shared&&!abShared(r.asset)?'<div class="ab-error">公开模板不能绑定私密运行环境实例，请修正绑定。</div>':abReadonly(r.config,r.asset)}<div class="ab-note">${b.mode==='instance'?'复用实例的全部运行配置只读。需要更改时，请在构建中新建实例。':'配置保留模板 ID、版本和快照；任务启动时创建独立工作目录。'}</div></section>`;
}
function abGateFields(c,prefix){return `<section class="ab-section"><h2>任务准出机制 · 可选</h2><div class="ab-note">启用多条规则时，全部通过才准出。产物清单本身不等于已通过校验。</div>${(c.gates||[]).map((g,i)=>`<div class="ab-rule">${abField('类型',prefix+'.gates.'+i+'.type',g.type,{options:[['prompt','Prompt'],['artifact','产物存在性'],['command','自定义命令']]})}${abField(g.type==='artifact'?'产物路径 · 每行一条 *':g.type==='command'?'校验命令 *':'校验 Prompt *',prefix+'.gates.'+i+'.value',g.value,{textarea:true})}${abButton('×','gate-remove',prefix+'|'+i,'link sm')}</div>`).join('')}${abButton('＋ 添加准出规则','gate-add',prefix,'link sm')}</section>`;}
function abAtomicFields(c,prefix,scope,visibility){
  const local=abEnvironment(c.environment,scope).config?.location==='本地',available=abExts(scope);
  return `${abField('Agent类型',prefix+'.agentType',c.agentType,{options:['codeagent',...(!local||c.agentType==='zero'?['zero']:[])],hint:local?'本地仅支持 codeagent。':'云端支持 codeagent、zero。'})}${local&&c.agentType==='zero'?'<div class="ab-error">zero 与本地运行环境不兼容，请明确改为 codeagent。</div>':''}${abField('预置提示词 · 可选',prefix+'.presetPrompt',c.presetPrompt,{textarea:true,hint:'通用指引，启动时放在本次实际输入之前；描述不会拼入提示词。'})}${abField('输入提示词模板 · 可选',prefix+'.inputPromptTemplate',c.inputPromptTemplate,{textarea:true,hint:'仅用于预填本次输入或串联步骤输入，可以留空。'})}${abField('推荐使用模型 · 可选',prefix+'.model',c.model,{hint:'留空交给平台默认规则解析。'})}<section class="ab-section"><h2>扩展 · 可选</h2>${['Skill','Extension','MCP','CLI'].map(type=>{const rows=available.filter(i=>abExtType(asset(i.assetId))===type);return `<div class="ab-field">${type}</div><div class="ab-checks">${rows.map(i=>`<label><input type="checkbox" data-ab-set="${prefix}.extensions" value="${esc(i.assetId)}" ${(c.extensions||[]).includes(i.assetId)?'checked':''}>${esc(asset(i.assetId).name)} <small>v${esc(i.version)}</small></label>`).join('')||'<small>当前范围没有已安装并启用的 '+type+'。</small>'}</div>`;}).join('')}${(c.extensions||[]).filter(id=>!available.some(i=>i.assetId===id)).map(id=>`<div class="ab-error">扩展 ${esc(asset(id)?.name||id)} 在当前范围不可用。${abButton('移除此引用','ext-remove',prefix+'|'+id,'link sm')}</div>`).join('')}<div class="ab-note">仅使用当前应用范围安装并启用的扩展；项目不继承个人安装。各分组独立选择、独立清空。</div></section>${abGateFields(c,prefix)}<section class="ab-section"><h2>任务责任人</h2>${abField('责任人模式',prefix+'.ownerMode',c.ownerMode,{options:[['follow','跟随触发场景'],['fixed','固定责任人']]})}${c.ownerMode==='fixed'?abField('固定责任人 *',prefix+'.owner',c.owner,{options:[['','请选择成员'],...abMembers(scope)]}):''}</section>${abBindingFields(c,prefix,scope,visibility)}`;
}
function abNew(type){
  const scope=abScope()==='all'?'个人':abScope();
  abEnsure().editor={type,scope,name:'',description:'',visibility:type==='env'?'public':type==='instance'?'private':abAdmin(scope)?'public':'private',templateOwner:abUser(),createdBy:abUser(),version:0,history:[],config:type==='task'?abConfig():abDefaults(),sourceMode:'direct',folderMode:'new',goal:'',stages:type==='workflow'?[{id:abId('stage'),name:'初始阶段',steps:[abStep()]}]:[],errors:[]};
  const d=abEnsure().editor;if(type==='workflow')d.selectedStep=d.stages[0].steps[0].id;
  s.view='studio';s.newTask=null;s.taskDetail=null;s.buildSel=null;s.studioPage='';abEnsure().type=type;abRender(true);
}
function abOpen(id){const x=abGet(id);if(!x||!abVisible(x))return;abEnsure().editor={...abCopy(x),errors:[],readOnly:x.type==='instance'||!abOwn(x)&&!(abAdmin(x.scope)&&abShared(x))};if(x.type==='workflow')abEnsure().editor.selectedStep=x.stages[0]?.steps[0]?.id;s.view='studio';abEnsure().type=x.type;abRender(true);}
function abRender(reset=false){
  const old=document.querySelector('.ab-page'),top=reset?0:old?.scrollTop||0,sideTop=document.querySelector('[data-ab-sidebar]')?.scrollTop||0,active=document.activeElement,key=reset?null:active?.dataset?.abField,pos=active?.selectionStart;
  render();const next=document.querySelector('.ab-page');if(next)next.scrollTop=top;
  const side=document.querySelector('[data-ab-sidebar]');if(side)side.scrollTop=sideTop;
  if(key){const field=document.querySelector(`[data-ab-field="${CSS.escape(key)}"]`);if(field){field.focus({preventScroll:true});if(typeof pos==='number'&&field.setSelectionRange&&field.type!=='number')try{field.setSelectionRange(pos,pos);}catch(e){}}}
}
function abHeading(title,subtitle,actions=''){return `<header class="ab-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="ab-actions">${actions}</div></header>`;}
function abScopeControls(){const scope=abScope(),mode=scope==='all'?'all':scope==='个人'?'personal':'project';return `<nav class="dtabs ab-scope-tabs" role="tablist" data-ab-tablist aria-label="应用范围">${[['personal','个人'],['project','项目'],['all','全部']].map(([v,l])=>`<button role="tab" data-a="ab-scope" data-v="${v}" class="${mode===v?'active':''}" aria-selected="${mode===v}" tabindex="${mode===v?0:-1}">${l}</button>`).join('')}</nav>${mode==='project'?`<label class="ab-field">当前项目<select data-ab-project>${projectNames.map(p=>`<option ${p===scope?'selected':''}>${esc(p)}</option>`).join('')}</select></label>`:''}`;}
function abSidebar(){
  const state=abEnsure(),type=abTypes.includes(state.type)?state.type:'task',query=state.query.trim().toLowerCase(),rows=abItems(type).filter(x=>(x.name+' '+x.description+' '+x.scope).toLowerCase().includes(query));
  const tabs=`<nav class="bd-seg as2-seg ab-type-tabs" role="tablist" data-ab-tablist aria-label="构建资产类型">${abTypes.map(t=>`<button id="ab-tab-${t}" title="${abLabels[t]}" aria-label="${abLabels[t]}" role="tab" data-a="ab-type" data-v="${t}" class="${type===t?'active':''}" aria-selected="${type===t}" aria-controls="ab-asset-panel" tabindex="${type===t?0:-1}">${{task:"原子模板",workflow:"串联模板",env:"环境模板",instance:"环境实例"}[t]}<small>${abItems(t).length}</small></button>`).join('')}</nav>`;
  return `<div class="sidehead"><h3>构建</h3><p>把工作能力，构建成可复用资产</p></div><div class="sidebody bd-body ab-sidebody" data-ab-sidebar>${abScopeControls()}${tabs}<label class="ab-side-search bd-search">${ico('search')}<input data-ab-search value="${esc(state.query)}" placeholder="搜索当前分类资产" aria-label="搜索构建资产" type="search" autocomplete="off"></label><div class="ab-side-list bd-list" id="ab-asset-panel" role="tabpanel" aria-labelledby="ab-tab-${type}">${rows.map(abSideCard).join('')||`<div class="ab-side-empty">${query?'没有匹配的资产':'暂无'+abLabels[type]}</div>`}</div></div>`;
}
function abSideCard(x){
  const selected=abEnsure().editor?.id===x.id,version=x.draft?'草稿':'V'+x.version,description=x.description||(x.type==='workflow'?`${x.stages.length} 个阶段 · ${abAllSteps(x).length} 个步骤`:x.type==='instance'?(x.templateId?'基于 '+(abGet(x.templateId)?.name||'已删除模板')+' · V'+x.templateVersion:'直接创建 · 无来源模板'):'可复用的运行环境配置');
  const detail=x.type==='task'?x.config.agentType:x.type==='workflow'?'按步骤配置环境':x.config.location+' / '+x.config.zone;
  return `<button class="bd-card ab-side-card ${selected?'active':''}" data-a="ab-open" data-v="${esc(x.id)}" aria-pressed="${selected}"><span class="bd-card-top"><b>${esc(x.name)}</b><span class="ab-side-version">${version}</span></span><span class="bd-card-desc">${esc(description)}</span><span class="ab-side-meta"><span>${esc(abScope()==='all'?x.scope:detail)}</span><span>${abShared(x)?'公开':'私密'}</span></span></button>`;
}
function abReferences(asset){
  const rows={task:[],workflow:[],total:[],running:[]},seen=new Set(),target=asset.id;
  const matches=b=>b&&(asset.type==='env'?(b.templateId===target||b.mode==='instance'&&abGet(b.instanceId)?.templateId===target):b.instanceId===target);
  for(const x of abEnsure().assets.filter(x=>!x.deleted&&x.scope===asset.scope&&abVisible(x))){
    if(x.type==='task'&&matches(x.config.environment))rows.task.push(x);
    if(x.type==='workflow'&&x.stages.some(g=>g.steps.some(st=>matches(st.config.environment)||asset.type==='task'&&st.atomicId===target)))rows.workflow.push(x);
  }
  for(const t of [...(s.tasks||[]),...(s.build36.runs||[])]){
    const scope=t.scope||t.project||'个人';if(scope!==asset.scope||seen.has(t.id))continue;
    const bound=t.build36Snapshot,bindings=[t.environment,t.config?.environment,...(bound?.stages||[]).flatMap(g=>g.steps.map(st=>st.config.environment)),bound?.config?.environment];
    const hit=bindings.some(matches)||bound?.id===target||asset.type==='task'&&bound?.stages?.some(g=>g.steps.some(st=>st.atomicId===target))||t.environments?.some(i=>asset.type==='env'?i.templateId===target:i.id===target)||t.asxEnvId===target||t.asxReuseInstanceId===target||asset.type==='env'&&t.environmentTemplateId===target||asset.type==='instance'&&t.environmentInstanceId===target;
    if(!hit)continue;seen.add(t.id);rows.total.push(t);if(['running','执行中','运行中'].includes(t.status))rows.running.push(t);
  }
  return rows;
}
function abStats(x){const refs=abReferences(x);return `<div class="ab-stats">${[['task','原子模板'],['workflow','串联模板'],['total','总任务'],['running','运行中任务']].map(([k,l])=>`<button data-a="ab-refs" data-v="${esc(x.id+'|'+k)}"><strong>${refs[k].length}</strong><small>${l}</small></button>`).join('')}</div>`;}
function abCard(x){
  return `<article class="ab-asset"><div class="ab-cardtop">${ico(abIcon(x.type))}<span class="ab-badge">${x.draft?'草稿 · 不可执行':'V'+x.version+' · '+(abShared(x)?'公开':'私密')}</span></div><h3>${esc(x.name)}</h3><div class="ab-meta">${esc(x.scope)} · 归属 ${esc(x.templateOwner||x.owner)}</div><p>${esc(x.description||(x.type==='workflow'?`${x.stages.length} 个阶段 · ${x.stages.reduce((n,g)=>n+g.steps.length,0)} 个步骤`:x.type==='instance'?'独立工作目录，可在任务中复用。':'可在当前应用范围内复用。'))}</p>${x.type==='env'?`<div class="ab-meta">${esc(x.config.location)} / ${esc(x.config.zone)} · ${esc(x.config.location==='本地'?'按责任人选择设备':x.config.image||'平台默认镜像')}</div>${abStats(x)}`:x.type==='instance'?`<div class="ab-meta">${esc(x.templateId?'来源：'+(abGet(x.templateId)?.name||'来源模板已删除')+' · V'+x.templateVersion:'直接创建 · 无来源模板')}<br>${esc(x.workingDirectory)}</div>${abStats(x)}`:x.type==='task'?`<div class="ab-meta">${esc(x.config.agentType)} · ${esc(abEnvLabel(x.config.environment,x.scope))}${x.legacy?'<br>由 1.0 角色迁移，保留原 ID 与提示词。':''}</div>`:`<div class="ab-meta">${esc(x.goal||'总体目标未预设')}<br>逐步配置环境与责任人</div>`}<footer>${abButton(x.type==='instance'?'查看详情':!abOwn(x)&&!abShared(x)?'管理详情':'详情 / 编辑','open',x.id)}${['task','workflow'].includes(x.type)&&!x.draft&&abUsable(x)?abButton('使用模板','use',x.id,'primary sm'):''}${x.type==='instance'&&abOwn(x)&&!abShared(x)?abButton('发布为公开','instance-public',x.id):''}${!abOwn(x)&&abAdmin(x.scope)&&!abShared(x)&&['task','workflow'].includes(x.type)?abButton('提升为公开','promote',x.id):''}</footer></article>`;
}
function abHome(){
  return `<div class="demopage ab-page ab-home">${abHeading('构建','选择要新建的内容，或从左侧选择已有资产继续编辑。')}<div class="ab-create">${abTypes.map(t=>`<button data-a="ab-new" data-v="${t}">${ico(abIcon(t))}<b>新建${abLabels[t]}</b><small>${{task:'配置 Agent、提示词、扩展与准出机制',workflow:'按阶段与步骤串联任务，逐步绑定环境',env:'保存云端或本地的通用运行配置',instance:'基于模板或直接创建独立工作目录'}[t]}</small><span>开始构建 →</span></button>`).join('')}</div></div>`;
}
function abErrors(d){return d.errors?.length?`<div class="ab-error" role="alert">${d.errors.map(e=>`<p>${esc(e)}</p>`).join('')}</div>`:'';}
function abTemplateUseAction(d){return d.id&&!d.draft&&['task','workflow'].includes(d.type)&&abUsable(abGet(d.id))?abButton('使用模板','use',d.id,'sm'):'';}
function abEditor(){
  const d=abEnsure().editor;if(d.type==='workflow')return abSeriesEditor(d);
  const instance=d.type==='instance',read=d.readOnly;
  const actions=abTemplateUseAction(d)+abButton('返回构建','home')+(d.id?abButton('历史版本','history',d.id)+abButton('引用与统计','inspect',d.id):'')+(d.id&&abOwn(d)?abButton('删除','delete',d.id,'link sm'):'')+(!read?abButton(instance?'创建实例':'保存'+abLabels[d.type],'save','','primary sm'):instance&&abOwn(d)?abButton(abShared(d)?'改为私密':'发布为公开','instance-share',d.id,'primary sm'):'');
  const body=read?`<h2 class="ab-detail-name">${esc(d.name)}</h2><p class="ab-meta">${esc(d.scope)} · ${abShared(d)?'公开':'私密'} · 归属 ${esc(d.templateOwner||d.owner)}</p>${instance?`<div class="ab-note">${esc(d.templateId?'来源：'+(abGet(d.templateId)?.name||'来源模板已删除')+' · '+d.templateId+' · V'+d.templateVersion:'直接创建 · 无来源模板')}<br>实例 ID：${esc(d.id)}<br>工作目录：${esc(d.workingDirectory)}</div>${abReadonly(d.config,d)}${abStats(d)}`:`<div class="ab-note">${esc(d.description)}</div>${abReadonly(abEnvironment(d.config.environment,d.scope).config||abDefaults())}<pre>${esc(JSON.stringify(d.config,null,2))}</pre>`}`:
    `${abScopeField(d)}${abField((instance?'实例名称':'模板名称')+' *','name',d.name)}${!instance?abField('描述 · 可选','description',d.description,{hint:'供人识别用途，不自动作为执行提示词。'}):''}${abVisibility(d)}${d.type==='task'?abAtomicFields(d.config,'config',d.scope,d.visibility):`${instance?`${abField('创建方式','sourceMode',d.sourceMode,{options:[['direct','直接创建'],['template','基于运行环境模板创建']]})}${d.sourceMode==='template'?abField('来源模板及版本 *','templateId',d.templateId||'',{options:[['','请选择运行环境模板'],...abItems('env',d.scope).map(e=>[e.id,e.name+' · V'+e.version])]}):''}${d.sourceMode==='template'&&d.templateId?abField('来源版本','templateVersion',d.templateVersion,{options:(abGet(d.templateId,d.scope)?.history||[]).map(h=>[h.version,'V'+h.version])}):''}`:''}${abEnvFields(d.config,'config',instance)}${instance&&d.visibility==='public'&&d.config.location==='本地'?`<div class="ab-note">公开本地实例后，当前范围成员可通过所选本地运行时访问工作目录，并按该实例的权限操作目录内容。</div>${abCheck('我已了解本地运行时与工作目录的访问范围','publicConfirmed',d.publicConfirmed)}`:''}`}`;
  return `<div class="demopage ab-page">${abHeading(read?'查看'+abLabels[d.type]:d.id?'编辑'+abLabels[d.type]:'新建'+abLabels[d.type],d.id?'版本 V'+d.version+' · 原有实例与任务保留各自快照。':'配置保存在本地浏览器，可保存后继续编辑。',actions)}<div class="ab-form">${abErrors(d)}${body}</div></div>`;
}
function abAllSteps(d){return d.stages.flatMap(g=>g.steps);}
function abStepAt(d,id){for(let gi=0;gi<d.stages.length;gi++){const g=d.stages[gi],i=g.steps.findIndex(st=>st.id===id);if(i>=0)return {g,gi,i,step:g.steps[i],prefix:`stages.${gi}.steps.${i}`};}return null;}
function abReuseOptions(d,st){
  const all=abAllSteps(d),b=st.config.environment,r=abEnvironment(b,d.scope);
  if(b.mode!=='template'||!r.ok)return [];
  return all.slice(0,all.indexOf(st)).filter(x=>!x.reuseStepId&&x.config.environment.mode==='template'&&x.config.environment.templateId===b.templateId&&Number(x.config.environment.version)===Number(b.version)&&JSON.stringify(abEnvironment(x.config.environment,d.scope).config)===JSON.stringify(r.config)&&x.config.ownerMode===st.config.ownerMode&&x.config.owner===st.config.owner);
}
function abSeriesEditor(d){
  const all=abAllSteps(d),found=abStepAt(d,d.selectedStep)||abStepAt(d,all[0]?.id),st=found?.step,p=found?.prefix,atoms=abItems('task',d.scope).filter(abUsable),read=d.readOnly;
  return `<div class="demopage ab-page">${abHeading(d.id?'编辑串联任务模板':'新建串联任务模板','阶段与步骤依次执行，每步保留固定配置与版本快照。',abTemplateUseAction(d)+abButton('返回构建','home')+(d.id?abButton('历史版本','history',d.id)+abButton('引用与统计','inspect',d.id)+abButton('删除','delete',d.id,'link sm'):'')+(read?'':abButton('保存草稿','draft')+abButton('发布版本','publish','','primary sm')))}${abErrors(d)}<div class="ab-panel"><div class="ab-two">${abField('模板名称 *','name',d.name,{disabled:read})}${abScopeField(d)}${abVisibility(d)}${abField('总体目标 · 可选','goal',d.goal,{textarea:true,disabled:read,hint:'作为各步骤共有上下文传递，每步仍保留各自实际输入。'})}</div></div><div class="ab-series-layout"><aside>${d.stages.map((g,gi)=>`<section class="ab-stage"><header><b>${gi+1}. ${esc(g.name||'未命名阶段')}</b><div class="ab-stage-actions">${!read?`<button data-a="ab-stage-move" data-v="${g.id}|-1" ${gi===0?'disabled':''} aria-label="阶段前移">←</button><button data-a="ab-stage-move" data-v="${g.id}|1" ${gi===d.stages.length-1?'disabled':''} aria-label="阶段后移">→</button><button data-a="ab-stage-remove" data-v="${g.id}" ${d.stages.length===1?'disabled':''} aria-label="删除阶段">×</button>`:''}</div></header>${g.steps.map((x,i)=>`<button class="ab-step ${st?.id===x.id?'active':''}" data-a="ab-step-select" data-v="${x.id}"><b>${gi+1}.${i+1} ${esc(x.name||'未命名步骤')}</b><small>${esc(x.source==='inline'?'现场配置':x.atomicSnapshot?x.atomicSnapshot.name+' · V'+x.atomicVersion:'请选择原子模板')}<br>${esc(abEnvLabel(x.config.environment,d.scope))}${x.manualConfirm?'<br>需要人工确认准出':''}</small></button>`).join('')}${!read?abButton('＋ 添加步骤','step-add',g.id,'link sm'):''}</section>`).join('')}${!read?abButton('＋ 添加阶段','stage-add','','sm'):''}</aside><div class="ab-panel">${st?`${read?'<div class="ab-note">仅管理查看，无法使用他人的私密模板。</div>':''}<div class="ab-inline" style="justify-content:space-between;margin-bottom:20px"><h2>步骤配置 · ${found.gi+1}.${found.i+1}</h2>${!read?`<div>${abButton('前移','step-move',st.id+'|-1','link sm')}${abButton('后移','step-move',st.id+'|1','link sm')}${abButton('删除','step-remove',st.id,'link sm')}</div>`:''}</div>${abField('阶段名称 *',`stages.${found.gi}.name`,found.g.name,{disabled:read})}${abField('步骤名称 *',p+'.name',st.name,{disabled:read})}${abField('步骤来源',p+'.source',st.source,{options:[['template','引用原子任务模板'],['inline','现场配置']],disabled:read})}${st.source==='template'?`${abField('原子任务模板 *',p+'.atomicId',st.atomicId,{options:[['','请选择原子任务模板'],...atoms.map(a=>[a.id,a.name+' · V'+a.version])],disabled:read})}${st.atomicSnapshot?`<div class="ab-note">固定引用 ${esc(st.atomicSnapshot.name)} · V${st.atomicVersion}。修改源模板不会改变本步骤。${!read?abButton('恢复模板配置','restore-step',st.id,'link sm'):''}</div>`:''}`:''}${abField('步骤输入 *',p+'.input',st.input,{textarea:true,disabled:read,hint:'仅从原子模板的“输入提示词模板”预填。不会从描述或预置提示词补回。'})}${!read?abAtomicFields(st.config,p+'.config',d.scope,d.visibility):`<pre>${esc(JSON.stringify(st.config,null,2))}</pre>`}${abField('复用前序步骤的新实例 · 可选',p+'.reuseStepId',st.reuseStepId,{options:[['','每步创建独立实例'],...abReuseOptions(d,st).map(x=>[x.id,x.name||'未命名步骤']),...(st.reuseStepId&&!abReuseOptions(d,st).some(x=>x.id===st.reuseStepId)?[[st.reuseStepId,'失效的来源步骤 · 请修正']]:[])],disabled:read,hint:'仅能复用前序直接基于相同模板版本、有效配置及责任人设备创建的实例。'})}${abCheck('人工确认准出 · 自动规则全部通过后等待确认',p+'.manualConfirm',st.manualConfirm,read)}${abField('失败后最大重试次数',p+'.maxRetries',st.maxRetries,{type:'number',disabled:read,hint:'耗尽后停止自动推进并提醒人工介入。'})}`:'<div class="ab-empty">选择或添加一个步骤。</div>'}</div></div></div>`;
}
function abValidateConfig(c,scope,visibility){
  const errors=[],r=abEnvironment(c.environment,scope);
  if(!['codeagent','zero'].includes(c.agentType))errors.push('请选择有效的 Agent类型。');
  if(!r.ok)errors.push(r.message);
  if(r.config?.location==='本地'&&c.agentType!=='codeagent')errors.push('本地运行环境仅支持 codeagent。');
  if(c.environment.mode==='instance'&&visibility==='public'&&r.asset&&!abShared(r.asset))errors.push('公开模板不能绑定私密运行环境实例。');
  if(c.ownerMode==='fixed'&&!abMembers(scope).includes(c.owner))errors.push('请选择当前范围有效的固定责任人。');
  for(const id of c.extensions||[])if(!abExts(scope).some(i=>i.assetId===id))errors.push('扩展 '+(asset(id)?.name||id)+' 未在当前范围安装并启用。');
  for(const g of c.gates||[])if(!['prompt','artifact','command'].includes(g.type)||!g.value?.trim())errors.push('请补齐每条任务准出规则的内容。');
  return errors;
}
function abValidate(d,publish=true){
  const errors=[];if(!d.name.trim())errors.push('请填写非空名称。');
  if(!['个人',...projectNames].includes(d.scope))errors.push('请选择有效应用范围。');
  if(['task','workflow'].includes(d.type)&&!abAdmin(d.scope)&&d.visibility!=='private')errors.push('普通项目成员只能创建私密任务模板。');
  if(d.type==='task')errors.push(...abValidateConfig(d.config,d.scope,d.visibility));
  if(d.type==='workflow'&&publish){
    if(!d.stages.length)errors.push('至少需要一个阶段。');
    d.stages.forEach((g,gi)=>{if(!g.name.trim()||!g.steps.length)errors.push(`阶段 ${gi+1} 须填写名称并包含可执行步骤。`);g.steps.forEach((st,i)=>{
      const label=`步骤 ${gi+1}.${i+1}：`;
      if(!st.name.trim()||!st.input.trim())errors.push(label+'名称与步骤输入必填。');
      if(st.source==='template'){
        const atom=abGet(st.atomicId,d.scope);if(!atom||!abUsable(atom)||!st.atomicSnapshot||!st.atomicVersion)errors.push(label+'原子模板或固定版本不可用。');
        if(d.visibility==='public'&&atom&&!abShared(atom))errors.push(label+'公开串联模板不能引用私密原子模板。');
      }
      errors.push(...abValidateConfig(st.config,d.scope,d.visibility).map(e=>label+e));
      if(st.reuseStepId&&!abReuseOptions(d,st).some(x=>x.id===st.reuseStepId))errors.push(label+'前序复用来源失效，请修正顺序、环境或责任人配置。');
      if(!Number.isInteger(Number(st.maxRetries))||Number(st.maxRetries)<0)errors.push(label+'重试次数必须为非负整数。');
    });});
  }
  if(['env','instance'].includes(d.type)){
    if(d.type==='env'&&abItems('env',d.scope).some(x=>x.id!==d.id&&x.name===d.name.trim()))errors.push('当前应用范围已存在同名运行环境模板。');
    if(!['云端','本地'].includes(d.config.location)||!['绿区','黄区'].includes(d.config.zone))errors.push('运行位置或安全区域无效。');
    if(d.type==='instance'){
      if(d.sourceMode==='template'&&!abSnapshot(abGet(d.templateId,d.scope),d.templateVersion))errors.push('请选择有效来源模板与版本。');
      if(d.config.location==='本地'){
        const list=abRuntimes(d.scope,abUser(),d.config.zone),r=d.config.runtimeId?list.find(x=>x.id===d.config.runtimeId):list[0];
        if(!r)errors.push('当前责任人在此安全区域没有可用的本地运行时。');
        else if(r.status!=='online')errors.push('所选本地运行时离线，请上线或明确选择其他设备。');
        else if(!r.defaultPath&&d.folderMode!=='existing')errors.push('请先为所选本地运行时配置默认路径。');
        if(d.folderMode==='existing'&&(!d.existingFolder?.trim()||!/^\/|^[A-Za-z]:[\\/]/.test(d.existingFolder)))errors.push('请填写已有文件夹的有效绝对路径。');
        if(d.visibility==='public'&&!d.publicConfirmed)errors.push('请确认公开本地运行时和工作目录的访问范围。');
      }
    }
  }
  return [...new Set(errors)];
}
function abStore(d,{draft=false}={}){
  d.errors=abValidate(d,!draft);if(d.errors.length){abRender();return false;}
  const state=abEnsure(),old=d.id?abGet(d.id):null,x=abCopy(d),newId=x.id||abId(x.type);
  x.id=newId;x.name=x.name.trim();x.templateOwner=old?.templateOwner||abUser();x.createdBy=old?.createdBy||abUser();x.updatedAt=new Date().toISOString();x.draft=draft;
  delete x.errors;delete x.readOnly;delete x.selectedStep;
  if(x.type==='env'){x.visibility='public';delete x.config.runtimeId;delete x.config.runtimeSnapshot;}
  if(['env','instance'].includes(x.type)&&x.config.location==='本地'){x.config.image='';x.config.tools=[];x.config.toolsets=[];}
  if(x.type==='instance'){
    x.owner=abUser();x.templateId=x.sourceMode==='template'?x.templateId:'';x.templateVersion=x.templateId?Number(x.templateVersion):0;
    const r=abRuntimes(x.scope,abUser(),x.config.zone).find(r=>r.id===x.config.runtimeId)||abRuntimes(x.scope,abUser(),x.config.zone)[0];
    if(x.config.location==='本地'){x.runtimeSnapshot=abCopy(r);x.config.runtimeId=r.id;x.workingDirectory=x.folderMode==='existing'?x.existingFolder.trim():r.defaultPath.replace(/[\\/]$/,'')+'/'+x.id;}
    else x.workingDirectory='/workspace/'+x.id;
    if(x.folderMode==='existing'){x.config.repos=[];x.config.path='';}
  }
  const publishedVersion=draft?(old?.version||0):(old?.version||0)+1;x.version=publishedVersion;
  x.history=old?.history?abCopy(old.history):[];
  if(!draft){const snap=abCopy(x);delete snap.history;x.history.push({version:x.version,at:x.updatedAt,snapshot:snap});}
  if(old)state.assets[state.assets.indexOf(old)]=x;else state.assets.push(x);
  abSyncLegacy(x);state.editor=null;state.query='';state.type=x.type;save();notify(draft?'草稿已保存，发布前仍需完整校验。':'已保存「'+x.name+'」'+(x.type==='instance'?'':' · V'+x.version));abRender();return true;
}
function abSyncLegacy(x){
  if(!['env','task'].includes(x.type))return;
  const type=x.legacyType||x.type,patch=x.type==='task'?{name:x.name,desc:x.description,agent:x.config.agentType,unit:x.config.agentType,instructions:x.config.presetPrompt,goal:x.config.presetPrompt,inputPromptTemplate:x.config.inputPromptTemplate,model:x.config.model,extensions:x.config.extensions,envMode:x.config.environment.mode==='instance'?'reuse':'new',envId:x.config.environment.templateId||'',envVersion:x.config.environment.version||0,instanceId:x.config.environment.instanceId||'',build36Config:abCopy(x.config)}:{name:x.name,desc:x.description,...abCopy(x.config),ver:x.version,build36Config:abCopy(x.config)};
  s.buildExtra=s.buildExtra||{};s.buildEdits=s.buildEdits||{};
  if(!buildItems(type).some(i=>i.id===x.id))(s.buildExtra[type]=s.buildExtra[type]||[]).push({id:x.id,...patch});else s.buildEdits[x.id]={...(s.buildEdits[x.id]||{}),...patch};
  s.bdScopes=s.bdScopes||{};s.bdProjects=s.bdProjects||{};s.bdScopes[type+':'+x.id]=x.scope==='个人'?'personal':'project';if(x.scope!=='个人')s.bdProjects[type+':'+x.id]=x.scope;
}
function abSet(obj,path,value){const parts=path.split('.');let at=obj;for(const k of parts.slice(0,-1))at=at[k];at[parts.at(-1)]=value;}
function abAt(obj,path){return path.split('.').reduce((o,k)=>o?.[k],obj);}
function abChange(t){
  const d=abEnsure().editor;if(!d||d.readOnly)return;const key=t.dataset.abField;
  if(!key)return;let value=t.type==='checkbox'?t.checked:t.type==='number'?Number(t.value):t.value;
  if(['version','templateVersion'].includes(key.split('.').at(-1)))value=Number(value);
  abSet(d,key,value);d.errors=[];d.dirty=true;
  if(key==='scope'){
    if(!abAdmin(d.scope)&&d.type!=='instance')d.visibility='private';
    if(d.type==='task')d.config.environment={mode:'default'};
    if(d.type==='workflow')for(const st of abAllSteps(d)){st.atomicId='';st.atomicSnapshot=null;st.config.environment={mode:'default'};st.config.extensions=[];}
    if(d.type==='task')d.config.extensions=[];if(['env','instance'].includes(d.type)){d.config.repos=[];d.templateId='';d.templateVersion=0;d.config.runtimeId='';}
  }
  if(key==='sourceMode'){d.templateId='';d.templateVersion=0;d.folderMode='new';d.config=abDefaults();}
  if(['templateId','templateVersion'].includes(key)&&d.type==='instance'&&d.sourceMode==='template'){
    const a=abGet(d.templateId,d.scope);if(key==='templateId')d.templateVersion=a?.version||0;const snap=abSnapshot(a,d.templateVersion);if(snap)d.config=abCopy(snap.config);d.folderMode='new';
  }
  if(key.endsWith('.environment.templateId')){const p=key.slice(0,-11),b=abAt(d,p);b.version=abGet(value,d.scope)?.version||0;}
  if(key.endsWith('.environment.mode')){const p=key.slice(0,-5),b=abAt(d,p);b.templateId='';b.version=0;b.instanceId='';}
  if(key.endsWith('.location')||key.endsWith('.zone')){d.config.runtimeId='';d.publicConfirmed=false;}
  if(key==='folderMode'&&value==='existing'){d.config.repos=[];d.config.path='';}
  if(key.endsWith('.ownerMode')&&value==='follow')abSet(d,key.replace(/ownerMode$/,'owner'),'');
  if(key.endsWith('.atomicId')){
    const st=abAt(d,key.slice(0,-9)),a=abGet(value,d.scope);st.atomicVersion=a?.version||0;st.atomicSnapshot=a?abCopy(a):null;st.config=a?abCopy(a.config):abConfig();st.input=a?.config.inputPromptTemplate||'';if(a&&!st.name.trim())st.name=a.name;
  }
  if(key.endsWith('.source')){const st=abAt(d,key.slice(0,-7));if(value==='inline'){st.atomicId='';st.atomicVersion=0;st.atomicSnapshot=null;}else{st.atomicId='';st.atomicSnapshot=null;}}
  if(key==='visibility')d.publicConfirmed=false;
  save();if(t.tagName==='SELECT'||t.type==='checkbox')abRender();
}
function abHistory(x){modal('历史版本 · '+esc(x.name),`<div class="ab-history">${(x.history||[]).slice().reverse().map(h=>`<article><b>V${h.version}</b><small> · ${esc(h.at)}</small><details><summary>查看固定配置快照</summary><pre>${esc(JSON.stringify(h.snapshot,null,2))}</pre></details></article>`).join('')||'<div class="ab-empty">尚未发布版本。</div>'}</div>`,abButton('关闭','close'))}
function abInspect(x){
  const refs=abReferences(x),dependencies=[];
  const configs=x.type==='task'?[x.config]:x.type==='workflow'?abAllSteps(x).map(st=>st.config):[];
  for(const c of configs){const r=abEnvironment(c.environment,x.scope);dependencies.push({label:abEnvLabel(c.environment,x.scope),valid:r.ok});for(const id of c.extensions||[])dependencies.push({label:'扩展 · '+(asset(id)?.name||id),valid:abExts(x.scope).some(i=>i.assetId===id)});}
  if(x.type==='workflow')for(const st of abAllSteps(x))if(st.source==='template')dependencies.push({label:'原子模板 · '+(st.atomicSnapshot?.name||st.atomicId)+' · V'+st.atomicVersion,valid:abUsable(abGet(st.atomicId,x.scope))});
  modal('引用与统计 · '+esc(x.name),`<h4>配置依赖</h4>${dependencies.map(r=>`<p>${esc(r.label)} · ${r.valid?'有效':'已失效 / 无权使用'}</p>`).join('')||'<p>没有额外依赖。</p>'}<h4>当前可见关联</h4><p>${refs.task.length} 个原子模板 · ${refs.workflow.length} 个串联模板 · ${refs.total.length} 个总任务 · ${refs.running.length} 个运行中任务</p>${[...refs.task,...refs.workflow,...refs.total].map(r=>`<p>${esc(r.name||r.title||r.id)}</p>`).join('')}`,abButton('关闭','close'));
}
function abDelete(x){
  if(!abOwn(x)&&!abAdmin(x.scope))return;const refs=abReferences(x),templateTasks=(s.tasks||[]).filter(t=>t.build36Snapshot?.id===x.id),unfinished=[...refs.total,...templateTasks].filter(t=>!['done','completed','已完成','已取消','cancelled','failed','失败','已归档'].includes(t.status));
  const body=`<p>当前引用：${refs.task.length} 个原子模板、${refs.workflow.length} 个串联模板、${refs.total.length} 个关联任务。</p><p>删除保留历史配置快照；非运行引用将显示失效依赖，后续执行前须修正。</p>${unfinished.length?'<div class="ab-error">存在尚未结束的关联任务（含待验收 / 待确认），无法删除。</div>':''}`;
  modal('删除「'+esc(x.name)+'」',body,abButton('取消','close')+(unfinished.length?'':abButton('确认删除','delete-confirm',x.id,'primary sm')));
}
function abPromote(x){const d={...abCopy(x),visibility:'public'},errors=abValidate(d);if(errors.length){modal('公开前请修正依赖',`<div class="ab-error">${errors.map(e=>`<p>${esc(e)}</p>`).join('')}</div>`,abButton('关闭','close'));return;}const state=abEnsure();state.editor=d;abStore(d);}
function abInstanceShare(x){
  if(!abOwn(x))return;const makePublic=!abShared(x),local=x.config.location==='本地';
  modal(makePublic?'发布为公开':'改为私密',`<p>${makePublic?'当前应用范围内的成员将可复用此实例，所有者保持不变。':'仅实例权限允许的用户可使用；现有公开模板引用将失效，须在后续执行前修正。'}</p>${local&&makePublic?`<div class="ab-note">本地运行时：${esc(x.runtimeSnapshot?.name||x.config.runtimeId)}<br>工作目录：${esc(x.workingDirectory)}<br>当前范围成员可通过此运行时访问该目录并按实例权限操作内容。</div>`:''}`,abButton('取消','close')+abButton(local&&makePublic?'了解访问范围并公开':'确认','share-confirm',x.id,'primary sm'));
}
function abMove(list,index,dir){const target=index+Number(dir);if(index<0||target<0||target>=list.length)return;const [x]=list.splice(index,1);list.splice(target,0,x);}
function abAction(a,v){
  if(!a.startsWith('ab-'))return false;
  const state=abEnsure(),d=state.editor;
  switch(a.slice(3)){
    case 'close':closeModal();return true;
    case 'home':state.editor=null;s.buildSel=null;state.query='';s.studioPage='';break;
    case 'scope':s.bxScope=v==='personal'?'个人':v==='all'?'all':s.bx2LastProject||s.project||projectNames[0];state.editor=null;state.query='';break;
    case 'new':abNew(v);return true;
    case 'list':state.type=v;state.query='';state.sourceFilter='';state.editor=null;s.buildSel=null;break;
    case 'type':if(abTypes.includes(v)){state.type=v;state.query='';save();abRender();document.getElementById('ab-tab-'+v)?.focus({preventScroll:true});}return true;
    case 'open':abOpen(v);return true;
    case 'save':if(d&&!d.readOnly)abStore(d);return true;
    case 'draft':if(d&&!d.readOnly)abStore(d,{draft:true});return true;
    case 'publish':if(d&&!d.readOnly)abStore(d);return true;
    case 'history':abHistory(abGet(v));return true;
    case 'inspect':abInspect(abGet(v));return true;
    case 'delete':abDelete(abGet(v));return true;
    case 'delete-confirm':{const x=abGet(v);if(x){const refs=abReferences(x);if(refs.total.some(t=>!['done','completed','已完成','已取消','cancelled','failed','失败','已归档'].includes(t.status))){notify('存在尚未结束的关联任务，无法删除。');return true;}x.deleted=true;s.buildDeleted=[...(s.buildDeleted||[]),x.id];}state.editor=null;closeModal();notify('已删除，历史快照保留。');break;}
    case 'promote':if(abAdmin(abGet(v)?.scope))abPromote(abGet(v));return true;
    case 'instance-public':case 'instance-share':abInstanceShare(abGet(v));return true;
    case 'share-confirm':{const x=abGet(v);if(x&&abOwn(x)){x.visibility=abShared(x)?'private':'public';if(state.editor?.id===x.id)state.editor.visibility=x.visibility;save();}closeModal();break;}
    case 'refs':{const [id,k]=v.split('|'),refs=abReferences(abGet(id))[k];modal('关联内容',refs.map(x=>`<p>${esc(x.name||x.title||x.id)}${x.status?' · '+esc(x.status):''}</p>`).join('')||'<div class="ab-empty">暂无可见关联。</div>',abButton('关闭','close'));return true;}
    case 'gate-add':if(!d||d.readOnly)return true;abAt(d,v).gates.push({type:'prompt',value:''});break;
    case 'gate-remove':{if(!d||d.readOnly)return true;const [p,i]=v.split('|');abAt(d,p).gates.splice(Number(i),1);break;}
    case 'ext-remove':{if(!d||d.readOnly)return true;const [p,id]=v.split('|');abAt(d,p).extensions=abAt(d,p).extensions.filter(x=>x!==id);break;}
    case 'step-select':d.selectedStep=v;break;
    case 'stage-add':{if(d.readOnly)return true;const st=abStep();d.stages.push({id:abId('stage'),name:'阶段 '+(d.stages.length+1),steps:[st]});d.selectedStep=st.id;break;}
    case 'stage-remove':if(d.readOnly)return true;if(d.stages.length>1)d.stages=d.stages.filter(g=>g.id!==v);break;
    case 'stage-move':{if(d.readOnly)return true;const [id,dir]=v.split('|');abMove(d.stages,d.stages.findIndex(g=>g.id===id),dir);break;}
    case 'step-add':{if(d.readOnly)return true;const st=abStep();d.stages.find(g=>g.id===v).steps.push(st);d.selectedStep=st.id;break;}
    case 'step-remove':{if(d.readOnly)return true;const f=abStepAt(d,v);if(f&&abAllSteps(d).length>1)f.g.steps.splice(f.i,1);break;}
    case 'step-move':{if(d.readOnly)return true;const [id,dir]=v.split('|'),f=abStepAt(d,id);if(f)abMove(f.g.steps,f.i,dir);break;}
    case 'restore-step':{if(d.readOnly)return true;const st=abStepAt(d,v)?.step;if(st?.atomicSnapshot){st.config=abCopy(st.atomicSnapshot.config);st.input=st.config.inputPromptTemplate||'';}break;}
    case 'use':abUseForm(abGet(v));return true;
    case 'run-create':abCreateTask();return true;
    default:return true;
  }
  save();abRender();return true;
}
// Template instantiation shares the complete atomic/series configuration and explicit empty values.
function abUseForm(x){
  if(!abUsable(x)||x.draft)return;const errors=abValidate(x);if(errors.length){modal('模板暂不可执行',`<div class="ab-error">${errors.map(e=>`<p>${esc(e)}</p>`).join('')}</div>`,abButton('关闭','close'));return;}
  s.build36Use={snapshot:abCopy(x)};
  const steps=x.type==='workflow'?abAllSteps(x):[];
  modal('使用'+abLabels[x.type],`<p class="ab-meta">${esc(x.name)} · V${x.version} · ${esc(x.scope)}</p><label class="ab-field">任务名称 *<input id="abRunName" value="${esc(x.name)}"></label>${x.type==='task'?`<label class="ab-field">输入提示词 *<textarea id="abRunInput">${esc(x.config.inputPromptTemplate||'')}</textarea></label>`:`<label class="ab-field">总体目标 · 可选<textarea id="abRunGoal">${esc(x.goal||'')}</textarea></label>${steps.map((st,i)=>`<section class="ab-section"><h2>${i+1}. ${esc(st.name)}</h2><div class="ab-meta">${esc(st.source==='template'?st.atomicSnapshot.name+' · V'+st.atomicVersion:'现场配置')} · ${esc(st.config.agentType)}<br>${esc(abEnvLabel(st.config.environment,x.scope))}<br>${st.config.gates.length} 条自动准出规则 · ${st.manualConfirm?'需要人工确认':'无需人工确认'}</div><label class="ab-field">步骤输入 *<textarea data-ab-run-input="${st.id}">${esc(st.input)}</textarea></label>${abRunOwnerField(st.config,x.scope,st.id)}</section>`).join('')}`}${x.type==='task'?abRunOwnerField(x.config,x.scope,'atomic'):''}<details class="ab-section"><summary>查看本次配置快照</summary><pre style="white-space:pre-wrap;font-size:11px">${esc(JSON.stringify(x,null,2))}</pre></details><div id="abRunErrors"></div>`,abButton('取消','close')+abButton('创建任务','run-create','','primary sm'));
}
function abRunOwnerField(c,scope,id){return `<label class="ab-field">任务责任人 *<select data-ab-run-owner="${id}">${abMembers(scope).map(name=>`<option ${name===(c.ownerMode==='fixed'?c.owner:abUser())?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`;}
function abCreateTask(){
  const x=abCopy(s.build36Use?.snapshot);if(!x)return;const name=$('#abRunName')?.value.trim(),errors=abValidate(x);if(!abUsable(abGet(x.id,x.scope)))errors.push('来源模板已失效或无权使用。');if(!name)errors.push('请填写任务名称。');
  const steps=x.type==='workflow'?abAllSteps(x):[{id:'atomic',config:x.config,input:$('#abRunInput')?.value||''}],created=[],byStep=new Map();
  if(x.type==='workflow'){x.goal=$('#abRunGoal')?.value||'';for(const st of steps)st.input=document.querySelector(`[data-ab-run-input="${CSS.escape(st.id)}"]`)?.value||'';}
  for(const st of steps){
    const owner=document.querySelector(`[data-ab-run-owner="${CSS.escape(st.id)}"]`)?.value||abUser();st.resolvedOwner=owner;st.finalPrompt=[st.config.presetPrompt,st.input].filter(v=>v?.trim()).join('\n\n---\n\n');
    if(!st.input.trim())errors.push((st.name||'任务')+'：输入必填。');
    const r=abEnvironment(st.config.environment,x.scope);if(!r.ok){errors.push(r.message);continue;}
    st.effectiveEnvironment=abCopy(r.config);
    if(st.reuseStepId){const prev=byStep.get(st.reuseStepId);if(!prev)errors.push('前序复用来源不存在。');else if(prev.owner!==owner)errors.push('复用来源与当前步骤的实际责任人 / 运行时不一致。');else{st.environmentInstanceId=prev.id;byStep.set(st.id,prev);}continue;}
    if(st.config.environment.mode==='instance'){
      const i=r.asset;if(r.config.location==='本地'){const rt=abRuntimes(x.scope,i.owner,r.config.zone).find(rt=>rt.id===i.config.runtimeId);if(!rt||rt.status!=='online')errors.push('复用实例的本地运行时离线或无权访问。');}st.environmentInstanceId=i.id;byStep.set(st.id,i);continue;
    }
    const id=abId('runenv'),c=abCopy(r.config),runtime=c.location==='本地'?abRuntimes(x.scope,owner,c.zone)[0]:null;
    if(c.location==='本地'&&(!runtime||runtime.status!=='online'||!runtime.defaultPath)){errors.push('责任人 '+owner+' 的首个本地运行时不可用或缺少默认路径。');continue;}
    const i={id,type:'instance',scope:x.scope,owner,config:c,temporary:true,templateId:st.config.environment.mode==='template'?st.config.environment.templateId:'',templateVersion:st.config.environment.version||0,workingDirectory:runtime?runtime.defaultPath+'/'+id:'/workspace/'+id,runtimeSnapshot:runtime?abCopy(runtime):null};
    if(runtime)i.config.runtimeId=runtime.id;created.push(i);st.environmentInstanceId=id;byStep.set(st.id,i);st.finalPrompt=[st.config.presetPrompt,st.input].filter(v=>v?.trim()).join('\n\n---\n\n');
  }
  if(errors.length){$('#abRunErrors').innerHTML=`<div class="ab-error">${[...new Set(errors)].map(e=>`<p>${esc(e)}</p>`).join('')}</div>`;return;}
  const id=nextTaskId(),t={id,title:name,type:'temp',trigger:'manual',kind:'board',status:'pending',source:'构建 / '+x.name,triggeredBy:abUser(),run:0,spaceIds:[],knowledgeSnapshot:[],owner:steps[0].resolvedOwner,project:x.scope==='个人'?'':x.scope,scope:x.scope,rev:1,executor:x.type==='workflow'?x.name:steps[0].config.agentType,agent:steps[0].config.agentType,goal:steps[0].input,created:new Date().toISOString(),build36Snapshot:x,environmentIds:steps.map(st=>st.environmentInstanceId),environments:abCopy([...new Map([...byStep.values()].map(i=>[i.id,i])).values()]),config:x.type==='task'?x.config:undefined,environment:x.type==='task'?x.config.environment:undefined};
  if(x.type==='task'){t.finalPrompt=steps[0].finalPrompt||[x.config.presetPrompt,steps[0].input].filter(v=>v?.trim()).join('\n\n---\n\n');t.actualInput=steps[0].input;}
  s.tasks.push(t);save();closeModal();notify('已创建待处理任务「'+name+'」，配置快照已保存。');abRender();
}
// Route existing entry points into this build surface while preserving the rest of the demo.
const abPreviousBfAction=bfAction;
bfAction=function(a,v){
  if(a.startsWith('ab-'))return abAction(a,v);
  if(a==='studio'&&(!v||v==='@home')||a==='build-home'){if(a==='build-home')abEnsure().editor=null;s.view='studio';s.buildSel=null;s.taskDetail=null;s.newTask=null;s.studioPage='';abRender();return true;}
  if(['build-new','go-build'].includes(a)){const type=v==='templates'?'task':v;if(abTypes.includes(type)){if(s.view==='team')s.bxScope=s.project;else if(s.view==='personal')s.bxScope='个人';abNew(type);return true;}}
  if(a==='asset-use-template'){const x=abGet(v);if(x&&x.type==='task'){abUseForm(x);return true;}}
  if(a==='build-open'){const id=String(v).slice(String(v).indexOf(':')+1),x=abGet(id);if(x){abOpen(id);return true;}}
  return abPreviousBfAction(a,v);
};
studioSidebar=abSidebar;
renderStudioMain=function(){return abEnsure().editor?abEditor():abHome();};
// Project/personal spaces browse the same assets and link back to Build for creation.
if(typeof assetTabs==='function'){
  const previousTabs=assetTabs;
  assetTabs=function(...args){return previousTabs(...args).filter(t=>t[0]!=='role').map(t=>t[0]==='env'?['env','运行环境','cloud']:t[0]==='workflow'?['workflow','串联任务模板','workflow']:t[0]==='templates'?['templates','原子任务模板','task']:t);};
  const previousBody=assetTabBody;
  assetTabBody=function(tab,data){
    if(!['env','workflow','templates','role'].includes(tab))return previousBody(tab,data);
    const scope=s.view==='personal'?'个人':s.project,type=tab==='env'?(s.envTab==='templates'?'env':'instance'):tab==='workflow'?'workflow':'task';
    const tabs=tab==='env'?`<nav class="ab-tabs" aria-label="运行环境类型">${[['templates','运行环境模板'],['instances','运行环境实例']].map(([id,label])=>`<button data-a="asset-env-tab" data-v="${id}" class="${(s.envTab==='templates'?'templates':'instances')===id?'active':''}">${label}</button>`).join('')}</nav>`:'';
    return `${tabs}<div class="ab-grid" style="margin-top:18px">${abItems(type,scope).map(abCard).join('')||'<div class="ab-empty">当前范围尚无此类资产，前往构建创建。</div>'}</div>`;
  };
  for(const name of ['renderProjectAssets','renderPersonalAssets']){
    const original=window[name];
    window[name]=function(...args){return original(...args).replace('知识库、代码仓、环境配置、Workflow、Agent 角色与任务模板','知识库、代码仓、运行环境与任务模板').replaceAll('环境配置','运行环境');};
  }
}
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.matches('[data-ab-field]')&&t.tagName!=='SELECT'&&t.type!=='checkbox')abChange(t);
  if(t.matches('[data-ab-search]')){const pos=t.selectionStart;abEnsure().query=t.value;abRender();const field=document.querySelector('[data-ab-search]');field?.focus();field?.setSelectionRange(pos,pos);}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.matches('[data-ab-field]')&&(t.tagName==='SELECT'||t.type==='checkbox'))abChange(t);
  if(t.matches('[data-ab-project]')){s.bxScope=t.value;s.bx2LastProject=t.value;abEnsure().editor=null;abRender();}
  if(t.dataset.abSet){const d=abEnsure().editor;if(!d||d.readOnly)return;const key=t.dataset.abSet,values=abAt(d,key)||[],isRepo=key.endsWith('.repos'),id=t.value;const next=values.filter(v=>(isRepo?v.name:v)!==id);if(t.checked)next.push(isRepo?{name:id,branch:'main'}:id);abSet(d,key,next);save();if(isRepo)abRender();}
});
// The app has already performed its initial render before the inline modules load.
if(s.view==='studio')abRender();

document.addEventListener('keydown',e=>{
  const tab=e.target.closest?.('[data-ab-tablist] [role="tab"]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const tabs=[...tab.parentElement.querySelectorAll('[role="tab"]')],index=tabs.indexOf(tab),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  const action=tabs[next].dataset.a,value=tabs[next].dataset.v;abAction(action,value);document.querySelector(`[data-a="${action}"][data-v="${CSS.escape(value)}"]`)?.focus({preventScroll:true});
});
