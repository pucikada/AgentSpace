// Full-page settings reuse the app's settings controls and current theme.
const spsWeLinkEvents=[
  ['waitingInput','任务待输入','任务等待用户输入时通知，点击链接跳转处理任务'],
  ['failed','任务失败','任务执行失败时通知，点击链接跳转处理任务，包含失败原因'],
  ['pendingStart','新增待人工启动的任务','新增需要手动启动的任务时通知，点击链接打开确认启动弹窗'],
  ['scheduleStart','定时任务自动启动','定时任务到点自动启动时通知（人工启动的不通知）'],
  ['eventStart','事件任务自动启动','事件任务满足触发条件自动启动时通知（人工启动的不通知）'],
  ['queued','任务进入排队','任务进入排队等待时通知'],
  ['completed','任务完成','任务执行完成时通知，包含任务输出']
];
const spsUser=()=>abUser();
function spsRuntimes(){
  if(!Array.isArray(s.localRuntimes))s.localRuntimes=[
    {id:'rt-mac',name:'开发工作站',host:'dev-macbook-01',os:'macOS',zone:'绿区',status:'online',version:'1.0',defaultPath:'/Users/me/AgentSpace',owner:spsUser(),example:true},
    {id:'rt-linux',name:'本地联调环境',host:'dev-linux-02',os:'Linux',zone:'绿区',status:'online',version:'1.0',defaultPath:'/home/me/AgentSpace',owner:spsUser(),example:true},
    {id:'rt-win',name:'黄区开发机',host:'dev-windows-03',os:'Windows',zone:'黄区',status:'offline',version:'1.0',defaultPath:'C:/AgentSpace',owner:spsUser(),example:true}
  ];
  for(const r of s.localRuntimes){r.owner=r.owner||r.createdBy||spsUser();r.owner=DIRECTORY.find(p=>p.type==='person'&&p.id===r.owner)?.name||r.owner;}
  if(!['绿区','黄区'].includes(s.runtimeZone))s.runtimeZone='绿区';
  return s.localRuntimes.filter(r=>r.owner===spsUser());
}
function spsRuntimePath(r){return r.defaultPath||(r.os==='Windows'?'C:/AgentSpace':r.os==='Linux'?'/home/me/AgentSpace':'/Users/me/AgentSpace');}
function spsRuntimeRefs(id){return abEnsure().assets.filter(x=>!x.deleted&&!x.temporary&&(x.config?.runtimeId===id||x.runtimeSnapshot?.id===id)).map(x=>({name:x.name,scope:x.scope}));}
function spsBtn(label,a,v='',cls='sm'){const name={return:'返回工作空间',copy:'复制命令',dismiss:'关闭提示'}[a],html=btn(label,'sps-'+a,v,cls);return name?html.replace('<button ',`<button aria-label="${name}" title="${name}" `):html;}
function spsNotice(text,key,tone='info'){return `<div class="sps-notice ${tone}">${ico('info')}<span>${text}</span>${spsBtn(ico('close'),'dismiss',key,'iconbtn')}</div>`;}
function spsCommand(command){return `<div class="sps-command"><code>${esc(command)}</code>${spsBtn(ico('copy'),'copy',command,'iconbtn')}</div>`;}
function spsGuide(){return settingsGroup('部署教程',`<div class="sps-guide"><h4>一、启动命令</h4><p>支持全局安装；新老用户部署后均需重新 install + login。</p>${['npm install -g @agent-service/agent-runner-pro','agent-runner login','agent-runner daemon restart'].map(spsCommand).join('')}<p>如需指定内部软件源，请使用 1.0 部署文档提供的 registry 地址。</p><h4>二、常用命令（按需使用）</h4>${[['登录','agent-runner login'],['启动 daemon 实例','agent-runner daemon start'],['停止 daemon 实例','agent-runner daemon stop'],['查看版本','agent-runner version']].map(([label,command])=>`<p>${label}</p>${spsCommand(command)}`).join('')}<p>登录时会登记网络安全区域。绿区 / 黄区属性更新后，请重新登录。</p></div>`);}
function spsRuntimeEditor(){
  const draft=s.spsRuntimeDraft;
  return `<div class="sps-runtime-editor">${spsBtn(ico('back')+'返回本地运行时','runtime-cancel','','link sm')}<h2>${draft.id?'管理':'添加'}本地运行时</h2><p class="settings-note">个人运行时 · 可登记多个实例，按安全区域分别排序。</p>${settingsGroup('运行时配置',`<div class="sps-form"><label class="field">名称 *<input data-sps-runtime="name" value="${esc(draft.name)}" placeholder="例如：我的开发工作站"></label><label class="field">设备名称 *<input data-sps-runtime="host" value="${esc(draft.host)}" placeholder="例如：dev-workstation-01"></label><div class="sps-form-grid"><label class="field">网络安全区域<select data-sps-runtime="zone">${['绿区','黄区'].map(v=>`<option ${draft.zone===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="field">系统<select data-sps-runtime="os">${['macOS','Linux','Windows'].map(v=>`<option ${draft.os===v?'selected':''}>${v}</option>`).join('')}</select></label></div><label class="field">默认工作路径<input data-sps-runtime="defaultPath" value="${esc(draft.defaultPath)}"><small>使用此运行时的新实例会在该路径下创建独立文件夹。</small></label><label class="field">运行状态 · 原型示例<select data-sps-runtime="status"><option value="online" ${draft.status==='online'?'selected':''}>在线</option><option value="offline" ${draft.status==='offline'?'selected':''}>离线</option></select></label><p class="settings-note">真实运行时通过 agent-runner login 自动登记，在线状态由服务心跳上报。本页仅保存配置样例。</p>${draft.id?`<p class="settings-note">引用此运行时的环境：${spsRuntimeRefs(draft.id).map(x=>esc(x.scope+' / '+x.name)).join('、')||'暂无'}</p>`:''}<p class="sps-error" role="alert">${esc(draft.error||'')}</p><div class="sps-form-actions">${draft.id?spsBtn('移除运行时','runtime-remove',draft.id,'link sm'):''}<span class="spacer"></span>${spsBtn('取消','runtime-cancel')}${spsBtn('保存配置','runtime-save','','primary sm')}</div></div>`)}</div>`;
}
function spsRuntimePane(){
  const own=spsRuntimes();if(s.spsRuntimeDraft)return spsRuntimeEditor();
  const zone=s.runtimeZone,rows=own.filter(r=>r.zone===zone);
  const intro=`<p class="sps-intro">管理个人本地运行时实例。当前安全区域列表中的第一个运行时作为默认；离线时会提示，不会自动跳到其他设备。可拖拽列表调整调用顺序。</p><div class="sps-toolbar"><div class="as-seg" role="tablist" aria-label="网络安全区域">${['绿区','黄区'].map(z=>`<button role="tab" aria-selected="${zone===z}" aria-checked="${zone===z}" data-a="sps-runtime-zone" data-v="${z}">${z} <small>${own.filter(r=>r.zone===z).length}</small></button>`).join('')}</div><span class="spacer"></span>${spsBtn('刷新列表','runtime-refresh')}${spsBtn(ico('plus')+'添加运行时','runtime-edit','','primary sm')}</div>`;
  const list=rows.map((r,i)=>`<article class="sps-runtime-row" draggable="true" data-sps-runtime-id="${esc(r.id)}"><span class="sps-runtime-grip" aria-hidden="true">⠿</span><span class="sps-runtime-device">${ico('terminal')}</span><div class="sps-runtime-copy"><div class="row wrap"><b>${esc(r.name)}</b>${i===0?tag('默认','gray'):''}${r.example?tag('示例','gray'):''}</div><p>${esc(r.host||r.name)} · ${esc(r.os||'—')}</p><small>${esc(r.id)} · Agent Runner ${esc(r.version||'—')} · ${esc(r.zone)}</small></div><span class="sps-runtime-status ${r.status}"><i></i>${r.status==='online'?'在线':'离线'}</span><div class="sps-runtime-actions"><button class="iconbtn" data-a="sps-runtime-move" data-v="${esc(r.id)}|-1" ${i===0?'disabled':''} aria-label="上移 ${esc(r.name)}">${ico('up')}</button><button class="iconbtn" data-a="sps-runtime-move" data-v="${esc(r.id)}|1" ${i===rows.length-1?'disabled':''} aria-label="下移 ${esc(r.name)}">${ico('down')}</button>${spsBtn('管理','runtime-edit',r.id,'link sm')}</div></article>`).join('');
  return intro+(!s.runtimeNoticeDismissed?spsNotice('如果您已在本地部署运行时，但页面未显示，可能是旧版本运行时未注册网络安全区域信息，请参考部署教程。','runtimeNoticeDismissed'):'')+`<div class="sps-runtime-layout"><div>${settingsGroup('本地运行时',`<div class="sps-runtime-summary"><span>${rows.length} 个运行时 · ${rows.filter(r=>r.status==='online').length} 个在线</span><span>${rows[0]?'默认：'+esc(rows[0].name):'当前安全区域暂无运行时'}</span></div>${list||`<div class="sps-empty">${ico('terminal')}<h3>暂无${zone}运行时</h3><p>在本地完成安装与登录后，运行时将在这里展示。</p>${spsBtn('添加运行时','runtime-edit')}</div>`}`,'当前为交互原型，不会连接或控制真实设备。')}</div><aside>${spsGuide()}</aside></div>`;
}
function spsWeLinkConfig(){
  if(!s.weLinkConfig){const old=settingsConfig();s.weLinkConfig={enabled:!!old.welinkOn,...Object.fromEntries(spsWeLinkEvents.map(([id])=>[id,true]))};for(const [id,key]of [['waitingInput','wlNeed'],['failed','wlFail'],['completed','wlDone']])if(typeof old[key]==='boolean')s.weLinkConfig[id]=old[key];}
  for(const [id]of spsWeLinkEvents)if(typeof s.weLinkConfig[id]!=='boolean')s.weLinkConfig[id]=true;
  return s.weLinkDraft||s.weLinkConfig;
}
function spsWeLinkSwitch(id,on,disabled=false,label=''){return `<button class="as2-switch" role="switch" aria-label="${esc(label)}" aria-checked="${!!on}" data-a="sps-wl-toggle" data-v="${id}" ${disabled?'disabled':''}><i></i></button>`;}
function spsWeLinkPane(){
  const c=spsWeLinkConfig(),dirty=JSON.stringify(c)!==JSON.stringify(s.weLinkConfig);
  return `<p class="sps-intro">为任务状态变化配置通知，及时接续需要处理的工作。</p>${!s.weLinkInfoDismissed?spsNotice('开启后，当任务状态发生变化时，将通过 WeLink 向您发送通知消息。','weLinkInfoDismissed'):''}${!s.weLinkWarningDismissed?spsNotice('老版本 WeLink 不支持查看 Markdown 格式消息，若遇到无法查看消息内容的情况，请升级至最新 WeLink 版本。','weLinkWarningDismissed','warning'):''}${settingsGroup('通知内容配置',settingsRow('总开关','开启/关闭 WeLink 通知（关闭后所有子开关置灰且不发送任何通知）',spsWeLinkSwitch('enabled',c.enabled,false,'WeLink 通知总开关'))+`<div class="sps-welink-events ${c.enabled?'':'is-disabled'}">${spsWeLinkEvents.map(([id,title,desc])=>settingsRow(title,desc,spsWeLinkSwitch(id,c[id],!c.enabled,title))).join('')}</div><div class="sps-form-actions"><small>${dirty?'有未保存的修改':'通知设置仅对本人有效。'}</small><span class="spacer"></span>${spsBtn('查看消息预览','wl-preview','','link sm')}${spsBtn('保存配置','wl-save','','primary sm')}</div>`,'原型仅保存配置，预览不会发送真实 WeLink 消息。')}`;
}
function spsWeLinkPreview(){
  const id=s.weLinkPreviewKind||'waitingInput',event=spsWeLinkEvents.find(x=>x[0]===id)||spsWeLinkEvents[0],task=s.tasks.find(t=>t.status==='wait'||t.status==='review')||s.tasks[0];
  modal('WeLink 消息预览',`<label class="field">通知类型<select data-sps-preview>${spsWeLinkEvents.map(([id,title])=>`<option value="${id}" ${id===event[0]?'selected':''}>${title}</option>`).join('')}</select></label><div class="sps-welink-message"><header><span>W</span><div><b>AgentSpace</b><small>任务通知 · 消息预览</small></div></header><h3>${event[1]}</h3><p><b>${esc(task?.title||'任务名称')}</b></p><p>${event[0]==='failed'?'执行失败：运行环境连接超时，请检查运行时状态后重试。':event[0]==='completed'?'任务执行已完成，任务输出与产物已准备就绪。':event[2]}</p><small>${esc(task?.scope||s.project)} · ${esc(task?.id||'TASK-ID')}</small><p class="sps-preview-link">${event[0]==='pendingStart'?'确认并启动任务':'查看并处理任务'} ↗</p></div><p class="settings-note">预览不会发送真实 WeLink 消息。</p>`,btn('关闭','close-modal','','sm'));
}
const spsPreviousSettingsPane=settingsPane;
settingsPane=function(sec){return sec==='runtime'?spsRuntimePane():sec==='welink'?spsWeLinkPane():spsPreviousSettingsPane(sec);};
function spsNavItems(){
  const q=(s.spsSettingsQuery||'').trim().toLowerCase(),keywords={runtime:'运行时 设备 网络 安全区域 工作路径 部署',welink:'welink 通知 消息 提醒 排队 失败 完成'};
  return SETTINGS_GROUPS.map(([group,ids])=>{const rows=ids.map(id=>SETTINGS_SECTIONS.find(x=>x[0]===id)).filter(Boolean).filter(([id,label])=>!q||(label+' '+(keywords[id]||'')).toLowerCase().includes(q));return rows.length?`<div class="sps-nav-group">${group}</div>${rows.map(([id,label,icon])=>`<button class="sidenav ${s.settingsSection===id?'active':''}" data-a="settings-section" data-v="${id}" ${s.settingsSection===id?'aria-current="page"':''}>${ico(icon)}<span>${label}</span></button>`).join('')}`:'';}).join('')||'<p class="sps-search-empty">没有匹配的设置分类</p>';
}
function spsSidebar(){return `<div class="sidehead"><h3>设置</h3>${spsBtn(ico('back'),'return','','iconbtn')}</div><div class="sidebody sps-sidebar"><label class="sps-settings-search">${ico('search')}<input data-sps-search aria-label="搜索设置" placeholder="搜索设置" value="${esc(s.spsSettingsQuery||'')}" style="background:transparent!important;border:0!important;box-shadow:none!important;border-radius:0!important;padding:0!important"></label><nav data-sps-nav aria-label="设置分类">${spsNavItems()}</nav></div>`;}
function spsPage(){const sec=s.settingsSection||'general',label=SETTINGS_SECTIONS.find(x=>x[0]===sec)?.[1]||'通用';return `<div class="demopage sps-settings-page"><main class="sps-settings-content ${sec==='runtime'?'is-runtime':''}"><header class="demohead"><div><h1>${label}</h1></div></header>${settingsPane(sec)}</main></div>`;}
const spsPreviousRenderSide=renderSide,spsPreviousRenderPersonal=renderPersonal;
renderSide=function(){return s.view==='settings'?spsSidebar():spsPreviousRenderSide();};
renderPersonal=function(){return s.view==='settings'?spsPage():spsPreviousRenderPersonal();};
openSettings=function(section){
  const scroll=s.view==='settings'&&(!section||section===s.settingsSection)?document.querySelector('.sps-settings-page')?.scrollTop||0:0;
  if(s.view!=='settings')s.spsSettingsReturn={view:s.view,page:s.page,newTask:s.newTask,taskDetail:s.taskDetail,sidebarCollapsed:sidebarState().collapsed};
  s.settingsSection=SETTINGS_SECTIONS.some(x=>x[0]===section)?section:s.settingsSection||'general';s.view='settings';s.page='settings';s.newTask=null;s.taskDetail=null;
  abRevealSidebar();closeExtMenu();closeModal();save();render();document.querySelector('.sps-settings-page').scrollTop=scroll;
};
const spsPreviousSettingsAction=settingsAction;
settingsAction=function(a,v){
  if(a==='appearance-style'&&s.view==='settings'){appearanceSelect('style',v);openSettings('appearance');return true;}
  if(!a.startsWith('sps-')){const section=s.settingsSection,scroll=document.querySelector('.sps-settings-page')?.scrollTop||0,handled=spsPreviousSettingsAction(a,v);if(handled&&s.view==='settings'&&s.settingsSection===section)document.querySelector('.sps-settings-page').scrollTop=scroll;return handled;}
  switch(a.slice(4)){
    case 'return':{const back=s.spsSettingsReturn||{view:'personal',page:'benches'};Object.assign(s,{view:back.view,page:back.page,newTask:back.newTask||null,taskDetail:back.taskDetail||null});sidebarState().collapsed=!!back.sidebarCollapsed;sidebarApplyCollapsed();delete s.spsSettingsReturn;save();render();return true;}
    case 'dismiss':s[v]=true;break;
    case 'runtime-zone':s.runtimeZone=v;break;
    case 'runtime-refresh':notify('已刷新运行时列表（示例数据）。');break;
    case 'runtime-edit':{const r=spsRuntimes().find(r=>r.id===v);s.spsRuntimeDraft=r?{...abCopy(r),defaultPath:spsRuntimePath(r)}:{name:'',host:'',os:'macOS',zone:s.runtimeZone,status:'offline',defaultPath:'/Users/me/AgentSpace'};break;}
    case 'runtime-cancel':delete s.spsRuntimeDraft;break;
    case 'runtime-save':{const d=s.spsRuntimeDraft;if(!d)return true;d.error=!d.name.trim()||!d.host.trim()?'请填写运行时名称与设备名称。':!/^(\/|[A-Za-z]:[\\/])/.test(d.defaultPath.trim())?'请填写默认工作路径的绝对路径。':'';if(d.error)break;let r=spsRuntimes().find(r=>r.id===d.id);const data={...d,name:d.name.trim(),host:d.host.trim(),defaultPath:d.defaultPath.trim(),owner:spsUser(),example:true};delete data.error;if(r)Object.assign(r,data);else s.localRuntimes.push({...data,id:abId('runtime'),version:'1.0'});s.runtimeZone=d.zone;delete s.spsRuntimeDraft;notify('本地运行时配置已保存。');break;}
    case 'runtime-move':{const [id,delta]=v.split('|'),r=spsRuntimes().find(r=>r.id===id);if(!r)return true;const rows=spsRuntimes().filter(x=>x.zone===r.zone),target=rows[rows.indexOf(r)+Number(delta)];if(target){const a=s.localRuntimes.indexOf(r),b=s.localRuntimes.indexOf(target);[s.localRuntimes[a],s.localRuntimes[b]]=[s.localRuntimes[b],s.localRuntimes[a]];}break;}
    case 'runtime-remove':{if(spsRuntimeRefs(v).length){notify('该运行时仍被运行环境引用，请先修改对应环境。');return true;}s.localRuntimes=s.localRuntimes.filter(r=>r.id!==v||r.owner!==spsUser());delete s.spsRuntimeDraft;break;}
    case 'copy':Promise.resolve().then(()=>navigator.clipboard.writeText(v)).then(()=>notify('命令已复制。'),()=>modal('复制部署命令',`<input value="${esc(v)}" readonly>`,btn('关闭','close-modal')));return true;
    case 'wl-toggle':{const c=spsWeLinkConfig();if(v!=='enabled'&&!c.enabled)return true;s.weLinkDraft={...c,[v]:!c[v]};break;}
    case 'wl-save':s.weLinkConfig={...spsWeLinkConfig()};delete s.weLinkDraft;settingsConfig().welinkOn=s.weLinkConfig.enabled;notify('WeLink 通知配置已保存。');break;
    case 'wl-preview':spsWeLinkPreview();return true;
  }
  save();openSettings();return true;
};
document.addEventListener('input',e=>{
  if(e.target.matches('[data-sps-search]')){s.spsSettingsQuery=e.target.value;document.querySelector('[data-sps-nav]').innerHTML=spsNavItems();}
  if(e.target.dataset.spsRuntime&&s.spsRuntimeDraft)s.spsRuntimeDraft[e.target.dataset.spsRuntime]=e.target.value;
});
document.addEventListener('change',e=>{
  if(e.target.matches('.sps-settings-page [data-setting]'))settingsSet(e.target.dataset.setting,e.target.value);
  if(e.target.dataset.spsRuntime&&s.spsRuntimeDraft){s.spsRuntimeDraft[e.target.dataset.spsRuntime]=e.target.value;if(e.target.dataset.spsRuntime==='os'){s.spsRuntimeDraft.defaultPath=spsRuntimePath({os:e.target.value});openSettings();}}
  if(e.target.matches('[data-sps-preview]')){s.weLinkPreviewKind=e.target.value;spsWeLinkPreview();}
});
let spsRuntimeDrag='';
document.addEventListener('dragstart',e=>{const r=e.target.closest('[data-sps-runtime-id]');if(r){spsRuntimeDrag=r.dataset.spsRuntimeId;e.dataTransfer?.setData('text/plain',spsRuntimeDrag);}});
document.addEventListener('dragover',e=>{if(spsRuntimeDrag&&e.target.closest('[data-sps-runtime-id]'))e.preventDefault();});
document.addEventListener('drop',e=>{const row=e.target.closest('[data-sps-runtime-id]');if(!row||!spsRuntimeDrag)return;e.preventDefault();const own=spsRuntimes(),a=own.find(r=>r.id===spsRuntimeDrag),b=own.find(r=>r.id===row.dataset.spsRuntimeId);if(a&&b&&a!==b&&a.zone===b.zone){s.localRuntimes.splice(s.localRuntimes.indexOf(a),1);s.localRuntimes.splice(s.localRuntimes.indexOf(b),0,a);save();openSettings();}spsRuntimeDrag='';});
document.addEventListener('dragend',()=>{spsRuntimeDrag='';});
