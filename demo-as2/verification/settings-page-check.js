(()=>{
  const backup=abCopy(s),checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
  const field=(key,value)=>{const e=document.querySelector(`[data-sps-runtime="${key}"]`);e.value=value;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
  try{
    s.newTask=null;action('nav-personal','benches');s.personalTab='overview';render();action('nt-open');newTaskDraft().goal='设置返回后保留的任务';
    openSettings('runtime');check('设置进入全页面',s.view==='settings'&&!!document.querySelector('.sps-settings-page')&&!document.querySelector('.settings-modal'));
    check('左侧全部分类',document.querySelectorAll('[data-sps-nav] button').length===SETTINGS_SECTIONS.length);
    const search=document.querySelector('[data-sps-search]');search.value='运行时';search.dispatchEvent(new Event('input',{bubbles:true}));check('设置搜索筛选分类',document.querySelectorAll('[data-sps-nav] button').length===1);search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
    settingsAction('sps-return','');check('返回保留新建任务草稿',newTaskDraft()?.goal==='设置返回后保留的任务');
    openSettings('general');const p=joinedProjects().find(p=>p!==s.project)||joinedProjects()[0],select=document.querySelector('[data-setting="defaultProject"]');select.value=p;select.dispatchEvent(new Event('change',{bubbles:true}));check('原有设置选择器仍保存',s.project===p);settingsAction('sps-return','');check('返回不会撤销默认项目选择',s.project===p);
    openSettings('runtime');const other={id:'qa-other-runtime',owner:'其他用户',name:'其他用户设备',zone:'绿区',status:'online'};s.localRuntimes.push(other);check('只显示当前用户运行时',!spsRuntimes().includes(other));
    settingsAction('sps-runtime-edit','');settingsAction('sps-runtime-save','');check('运行时必填校验',!!s.spsRuntimeDraft.error);
    field('name','设置联调运行时');field('host','qa-device');field('os','Linux');check('系统联动默认路径',s.spsRuntimeDraft.defaultPath==='/home/me/AgentSpace');field('defaultPath','relative/path');settingsAction('sps-runtime-save','');check('默认路径必须为绝对路径',!!s.spsRuntimeDraft.error);
    field('defaultPath','/tmp/settings-qa');field('status','online');settingsAction('sps-runtime-save','');let runtime=spsRuntimes().find(r=>r.name==='设置联调运行时');check('运行时字段保存',runtime.host==='qa-device'&&runtime.os==='Linux'&&runtime.defaultPath==='/tmp/settings-qa');
    const own=spsRuntimes().filter(r=>r.zone==='绿区');for(let i=0;i<own.length;i++)settingsAction('sps-runtime-move',runtime.id+'|-1');check('排序决定任务默认运行时',abRuntimes('个人')[0].id===runtime.id);
    settingsAction('sps-runtime-edit',runtime.id);field('status','offline');settingsAction('sps-runtime-save','');check('不自动跳过首个离线设备',abRuntimes('个人')[0].id===runtime.id&&abRuntimes('个人')[0].status==='offline');
    settingsAction('sps-runtime-edit',runtime.id);field('name','取消的修改');settingsAction('sps-runtime-cancel','');check('取消编辑不覆盖保存记录',runtime.name==='设置联调运行时');
    settingsAction('sps-runtime-zone','黄区');check('安全区域过滤',[...document.querySelectorAll('[data-sps-runtime-id]')].every(e=>spsRuntimes().find(r=>r.id===e.dataset.spsRuntimeId).zone==='黄区'));
    settingsAction('sps-runtime-zone','绿区');const dependency={id:'qa-runtime-instance',name:'依赖运行时的实例',type:'instance',scope:'个人',owner:abUser(),config:{...abDefaults(),location:'本地',runtimeId:runtime.id},visibility:'private'};abEnsure().assets.push(dependency);settingsAction('sps-runtime-remove',runtime.id);check('被环境引用的运行时阻止移除',s.localRuntimes.includes(runtime));abEnsure().assets=abEnsure().assets.filter(x=>x!==dependency);settingsAction('sps-runtime-remove',runtime.id);check('无引用运行时可以移除',!s.localRuntimes.includes(runtime));
    s.localRuntimes=[];openSettings('runtime');check('空运行时列表不回填示例',abRuntimes('个人').length===0&&!!document.querySelector('.sps-empty'));
    s.weLinkConfig={enabled:false,...Object.fromEntries(spsWeLinkEvents.map(([id])=>[id,true]))};delete s.weLinkDraft;openSettings('welink');check('七种通知字段',document.querySelectorAll('.sps-welink-events [role="switch"]').length===7);check('总开关关闭时子开关禁用',[...document.querySelectorAll('.sps-welink-events button')].every(b=>b.disabled));
    settingsAction('sps-wl-toggle','failed');check('禁用状态不可修改子项',!s.weLinkDraft);settingsAction('sps-wl-toggle','enabled');check('总开关联动启用子项',[...document.querySelectorAll('.sps-welink-events button')].every(b=>!b.disabled));settingsAction('sps-wl-toggle','failed');check('修改先进入未保存草稿',s.weLinkConfig.failed===true&&s.weLinkDraft.failed===false);settingsAction('sps-wl-save','');check('保存通知配置',s.weLinkConfig.enabled&&!s.weLinkConfig.failed&&!s.weLinkDraft);
    const scroll=document.querySelector('.sps-settings-page');scroll.scrollTop=120;const top=scroll.scrollTop;settingsAction('sps-wl-toggle','queued');check('切换开关保留滚动位置',document.querySelector('.sps-settings-page').scrollTop===top);
    settingsAction('sps-wl-preview','');check('预览不离开设置页面',!!document.querySelector('.sps-welink-message')&&s.view==='settings');const preview=document.querySelector('[data-sps-preview]');preview.value='pendingStart';preview.dispatchEvent(new Event('change',{bubbles:true}));check('七种通知预览可切换',document.querySelector('.sps-preview-link').textContent.includes('确认并启动'));action('close-modal','');
    settingsAction('sps-dismiss','weLinkInfoDismissed');check('通知提示可关闭',s.weLinkInfoDismissed===true);__persistNow();check('运行时和通知配置持久化',JSON.parse(localStorage.getItem('agentspace-mvp-workbench-history-v28')).weLinkConfig.failed===false);
    return {passed:checks.length,checks};
  }finally{closeModal();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();__persistNow();render();}
})()
