// Space content follows the MVP resource model; appearance stays with shared AS2 components.
function spxScope(){return s.view==='team'?s.project:'个人';}
function spxState(scope=spxScope()){
  s.spxSpaces=s.spxSpaces||{};
  if(!s.spxSpaces[scope]){
    const old=scope==='个人'?s.pAssetTab:s.assetTab;
    const base=scope==='AgentSpace 2.0'?'agentspace':scope.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'project';
    s.spxSpaces[scope]={tab:({env:'environment',workflow:'templates',role:'templates'})[old]||old||'knowledge',kind:old==='workflow'?'workflow':'task',environment:'templates',source:'',filter:'',repos:['web','service'].map(x=>({id:'r-'+x,name:base+'-'+x,url:'https://code.example.com/'+base+'/'+base+'-'+x,branch:'main',status:'已授权'}))};
  }
  return s.spxSpaces[scope];
}
function spxBtn(label,a,v='',cls='sm'){return btn(label,'spx-'+a,v,cls);}
function spxTabs(personal){return [['knowledge','知识库','book'],...personal?[]:[['repos','代码仓','code']],['environment','运行环境','cloud'],['variables','环境变量','settings'],['templates','任务模板','task']];}
function spxFacts(rows){return `<dl class="spx-facts">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v??'—')}</dd></div>`).join('')}</dl>`;}
function spxRuntime(c){return c.location==='本地'?(abRuntimes(spxScope()).find(r=>r.id===c.runtimeId)?.name||'本地运行时'):c.image||'平台默认镜像';}
function spxRepoNames(c){return (c.repos||[]).map(r=>r.name||spxState().repos.find(x=>x.id===r)?.name||r).join('、')||'无';}
function spxSection(title,desc,actions=''){return `<header class="spx-section"><div><h2>${title}</h2><p>${desc}</p></div><div class="row wrap">${actions}</div></header>`;}
function spxKnowledge(personal){
  const spaces=s.knowledgeSpaces.filter(x=>x.scope==='personal'),sp=personal?knowledgeSpace(s.personalSpaceId):projectKnowledge();
  if(personal&&!spaces.includes(sp))return spxSection('知识库','收录资料、记录思考，在空间内提问；把需要的知识带进个人任务。',btn(ico('plus')+'新建知识库','space-create','','primary sm'))+`<div class="knowledge-space-grid">${spaces.map(x=>`<article class="knowledge-space-card"><span class="space-symbol">${ico('book')}</span><div class="row between"><h3>${esc(x.name)}</h3>${tag('个人','gray')}</div><p>${esc(x.description)}</p><div class="space-stats"><span>${x.docs.length} 份资料</span><span>${x.chats.length} 条问答</span><span>独立上下文</span></div>${btn('打开空间 '+ico('arrow'),'space-open',x.id,'sm')}</article>`).join('')||'<div class="empty">还没有知识库，先新建一个。</div>'}</div>`;
  if(!sp)return '<div class="empty">当前项目还没有知识库。</div>';
  const actions=(personal?btn(ico('back')+'全部知识库','space-list','','link sm'):'')+btn('空间内提问','space-tab','chat','sm')+btn(ico('plus')+'添加资料','space-add',sp.id,'primary sm');
  let html=renderKnowledgeDetail(sp).replace('知识库问答','空间问答').replace('知识库设置','空间设置');
  return spxSection(esc(sp.name),esc(sp.description),actions)+`<div class="asset-knowledge">${html}</div>`;
}
function spxEnvironment(){
  const st=spxState(),scope=spxScope(),envs=abItems('env',scope),instances=abItems('instance',scope),part=st.environment;
  const tabs=`<div class="dtabs asset-subtabs">${[['templates','运行环境模板',envs.length],['instances','运行环境实例',instances.length]].map(([k,l,n])=>`<button class="${part===k?'active':''}" data-a="spx-environment" data-v="${k}">${l} <span>${n}</span></button>`).join('')}</div>`;
  const head=spxSection('运行环境','模板定义运行配置；实例独立保留工作目录与任务关联，也可直接创建。',spxBtn('前往构建','build',part==='templates'?'env':'instance','primary sm'));
  if(part==='instances'){
    const rows=instances.filter(i=>!st.source||(st.source==='__direct'?!i.templateId:i.templateId===st.source));
    return head+tabs+`<div class="spx-list-tools"><select data-spx-source aria-label="来源运行环境模板"><option value="">全部来源</option><option value="__direct" ${st.source==='__direct'?'selected':''}>直接创建 · 无来源模板</option>${envs.map(e=>`<option value="${esc(e.id)}" ${st.source===e.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select><small>${rows.length} 个可见实例 · 不含任务临时运行环境</small></div><div class="tablewrap"><table class="demotable"><thead><tr><th>运行环境实例</th><th>来源</th><th>共享类型</th><th>关联统计</th><th>操作</th></tr></thead><tbody>${rows.map(i=>`<tr><td><b>${esc(i.name)}</b><small>${esc(i.workingDirectory||'')}</small><small>${esc(scope)}</small></td><td>${esc(i.templateId?(abGet(i.templateId,scope)?.name||'来源模板已删除')+' · V'+i.templateVersion:'直接创建 · 无来源模板')}</td><td>${abShared(i)?'公开':'私密'}<small>${esc(i.owner||i.templateOwner||'我')}</small></td><td>${abStats(i)}</td><td><div class="row wrap">${spxBtn('查看详情','detail',i.id)}${abOwn(i)&&!abShared(i)?spxBtn('发布为公开','share',i.id):''}</div></td></tr>`).join('')||'<tr><td colspan="5"><div class="empty">暂无符合条件的运行环境实例</div></td></tr>'}</tbody></table></div>`;
  }
  return head+tabs+`<div class="asset-grid">${envs.map(e=>{const c=e.config,refs=abReferences(e).task.length,n=instances.filter(i=>i.templateId===e.id).length;return `<article class="asset-card spx-resource"><div class="row between"><span class="asset-ic">${ico(c.location==='本地'?'monitor':'cloud')}</span>${tag('V'+e.version,'gray')}</div><h3>${esc(e.name)}</h3><p>${esc(c.location)} · ${esc(c.zone)} · ${esc(spxRuntime(c))}</p>${spxFacts([['代码仓',spxRepoNames(c)],['工作目录',c.location==='本地'?'本地运行时默认路径下新建':'每次创建独立目录']])}<div class="spx-links">${spxBtn(refs+' 个原子任务模板引用','env-tasks',e.id,'link sm')}${spxBtn(n+' 个可见实例 →','env-instances',e.id,'link sm')}</div><footer>${spxBtn('查看详情','detail',e.id)}${spxBtn('编辑','edit',e.id)}</footer></article>`;}).join('')||'<div class="empty">还没有运行环境模板，可前往构建创建。</div>'}</div>`;
}
function spxTemplates(){
  const st=spxState(),scope=spxScope(),type=st.kind||'task';
  const all=abItems(type,scope),items=all.filter(x=>!st.filter||x.config?.environment?.templateId===st.filter);
  const tabs=`<div class="dtabs asset-subtabs">${['task','workflow'].map(t=>`<button class="${type===t?'active':''}" data-a="spx-kind" data-v="${t}">${abLabels[t]} <span>${abItems(t,scope).length}</span></button>`).join('')}</div>`;
  return spxSection('任务模板','汇集本空间的原子任务与串联任务模板，按需选择和复用。',spxBtn('前往构建','build',type,'primary sm'))+tabs+`<p class="spx-caption">${type==='task'?'原子任务模板：组合环境、扩展与 Agent 类型，可独立使用，也可串联为串联任务。':'串联任务模板：按顺序串联多个原子任务，每个步骤沿用各自的环境配置。'}</p>${st.filter?`<div class="note">已筛选关联环境：${esc(abGet(st.filter)?.name||'已删除模板')}${spxBtn('查看全部','clear-filter','','link sm')}</div>`:''}<div class="asset-grid">${items.map(x=>{const env=x.type==='task'?abEnvironment(x.config.environment,scope):null;return `<article class="asset-card spx-resource"><div class="row between"><span class="asset-ic">${ico(abIcon(type))}</span>${tag(x.draft?'草稿':'V'+x.version,'gray')}</div><h3>${esc(x.name)}</h3><p>${esc(x.description||x.goal||'')}</p>${spxFacts(type==='task'?[['环境',abEnvLabel(x.config.environment,scope)],['Agent类型',x.config.agentType],['代码与路径',(env?.config?.repos?.length?'已关联代码仓':'无代码仓')+' · '+(env?.config?.path||'默认目录')]]:[['阶段',(x.stages||[]).length+' 个'],['原子任务',abAllSteps(x).length+' 个'],['状态',x.draft?'草稿':'已发布 / 可编辑']])}<footer>${spxBtn('查看 / 编辑','edit',x.id)}${!x.draft&&abUsable(x)?spxBtn('使用模板','use',x.id,'primary sm'):''}</footer></article>`;}).join('')||'<div class="empty">本空间暂无此类任务模板，可前往构建创建。</div>'}</div>`;
}
function spxRepos(){
  const scope=spxScope(),envs=abItems('env',scope);
  return spxSection('代码仓','关联项目工程资产，供运行环境模板选择使用。',spxBtn(ico('plus')+'关联代码仓','repo-edit','','primary sm'))+`<div class="tablewrap"><table class="demotable"><thead><tr><th>代码仓</th><th>默认分支</th><th>访问状态</th><th>关联环境</th><th></th></tr></thead><tbody>${spxState().repos.map(r=>`<tr><td><b>${esc(r.name)}</b><small>${esc(r.url)}</small></td><td>${esc(r.branch)}</td><td>${tag(r.status,r.status==='已授权'?'green':'gold')}</td><td>${envs.filter(e=>(e.config.repos||[]).some(x=>x===r.id||x.name===r.name||x.url===r.url)).length} 个模板</td><td>${spxBtn('详情 / 编辑','repo-edit',r.id)}</td></tr>`).join('')||'<tr><td colspan="5"><div class="empty">尚未关联代码仓。</div></td></tr>'}</tbody></table></div>`;
}
function spxPage(personal){
  const st=spxState(),tabs=spxTabs(personal);if(!tabs.some(([k])=>k===st.tab))st.tab='knowledge';
  const heading=`<div class="demohead"><div><h1>${personal?'个人空间':'项目空间'}</h1><p>${personal?'个人知识与可复用的执行资源。':'项目共享的知识、代码、环境与任务能力 · '+esc(s.project)}</p></div>${spxBtn(ico('workflow')+'前往构建','build','','primary sm')}</div>`;
  const nav=`<div class="dtabs asset-tabs" role="tablist" aria-label="${personal?'个人':'项目'}空间资源">${tabs.map(([k,l,i])=>`<button role="tab" aria-selected="${st.tab===k}" class="${st.tab===k?'active':''}" data-a="spx-tab" data-v="${k}">${ico(i)}${l}</button>`).join('')}</div>`;
  const body=st.tab==='knowledge'?spxKnowledge(personal):st.tab==='repos'?spxRepos():st.tab==='environment'?spxEnvironment():st.tab==='templates'?spxTemplates():`<section class="empty spx-variables">${ico('settings')}<h2>环境变量</h2><p>应用范围：${esc(spxScope())}</p><p>环境变量配置将在这里提供，具体交互待补充。</p>${tag('功能占位','gray')}</section>`;
  return `<div class="spx-page">${heading}${nav}${body}</div>`;
}
renderProjectAssets=()=>spxPage(false);
renderPersonalAssets=()=>spxPage(true);
const spxPreviousAssetAction=assetAction;
assetAction=function(a,v){
  if(!a.startsWith('spx-'))return spxPreviousAssetAction(a,v);
  const st=spxState(),scope=spxScope(),x=abGet(v,scope);
  switch(a.slice(4)){
    case 'tab':st.tab=v;break;
    case 'environment':st.environment=v;break;
    case 'kind':st.kind=v;st.filter='';break;
    case 'env-tasks':st.tab='templates';st.kind='task';st.filter=v;break;
    case 'env-instances':st.tab='environment';st.environment='instances';st.source=v;break;
    case 'clear-filter':st.filter='';break;
    case 'build':s.bxScope=scope;abEnsure().editor=null;abEnsure().overviewType=v||'all';s.view='studio';s.studioPage='';abRender();return true;
    case 'edit':closeModal();if(x)abOpen(x.id);return true;
    case 'use':if(x)abUseForm(x);return true;
    case 'detail':if(x){modal(esc(x.name),`<div class="row wrap">${tag(x.type==='env'?'V'+x.version:abShared(x)?'公开':'私密','gray')}</div>${x.type==='instance'?spxFacts([['所有者',x.owner||'我'],['实例ID',x.id],['来源',x.templateId?(abGet(x.templateId)?.name||'来源模板已删除')+' · V'+x.templateVersion:'直接创建 · 无来源模板']]):''}${abReadonly(x.config,x)}<h3>${x.type==='env'?'历史版本':'关联统计'}</h3>${x.type==='env'?`<p>${[...new Set([...(x.history||[]).map(h=>h.version),x.version])].map(v=>'V'+v).join(' · ')}</p>`:abStats(x)}`,spxBtn('关闭','close')+(x.type==='env'?spxBtn('编辑模板','edit',x.id,'primary sm'):abOwn(x)?spxBtn(abShared(x)?'设为私密':'发布为公开','share',x.id,'primary sm'):''));}return true;
    case 'share':if(x){abInstanceShare(x);document.querySelector('[data-a="ab-share-confirm"]')?.setAttribute('data-a','spx-share-confirm');}return true;
    case 'share-confirm':if(x&&abOwn(x))x.visibility=abShared(x)?'private':'public';closeModal();break;
    case 'repo-edit':{const r=st.repos.find(r=>r.id===v)||{name:'',url:'',branch:'main',status:'待授权'};modal(v?'编辑代码仓':'关联代码仓',`<p class="muted">项目：${esc(scope)} · 代码仓可被多个运行环境模板引用。</p><label class="field">仓库名称 *<input id="spxRepoName" value="${esc(r.name)}"></label><label class="field">仓库地址 *<input id="spxRepoUrl" value="${esc(r.url)}" placeholder="https://code.example.com/project/repo"></label><label class="field">默认分支<input id="spxRepoBranch" value="${esc(r.branch)}"></label><label class="field">访问状态<select id="spxRepoStatus">${['已授权','待授权'].map(t=>`<option ${r.status===t?'selected':''}>${t}</option>`).join('')}</select></label><p id="spxRepoError" role="alert"></p>`,spxBtn('取消','close')+spxBtn('保存代码仓','repo-save',v,'primary sm'));return true;}
    case 'repo-save':{const name=document.getElementById('spxRepoName').value.trim(),url=document.getElementById('spxRepoUrl').value.trim();if(!name||!url){document.getElementById('spxRepoError').textContent='请填写仓库名称和地址。';return true;}const r=st.repos.find(r=>r.id===v)||{id:abId('repo')};Object.assign(r,{name,url,branch:document.getElementById('spxRepoBranch').value.trim()||'main',status:document.getElementById('spxRepoStatus').value});if(!st.repos.includes(r))st.repos.push(r);closeModal();break;}
    case 'close':closeModal();return true;
  }
  save();render();return true;
};
document.addEventListener('change',e=>{if(e.target.matches('[data-spx-source]')){spxState().source=e.target.value;save();render();}});
