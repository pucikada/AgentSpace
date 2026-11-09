(()=>{
  const backup=abCopy(s),entries=anhEntries.slice(),index=anhIndex,checks=[];
  const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
  try{
    check('默认幻彩浅色蓝',appearanceConfig().style==='aurora'&&settingsConfig().auroraMode==='light'&&settingsConfig().auroraAccent==='#3F6BFF');
    s.newTask=null;s.taskDetail=null;action('nav-personal','benches');
    action('nt-open');newTaskDraft().goal='导航后保留任务输入';
    openSettings('runtime');openSettings('welink');
    check('设置标题无返回按钮',!document.querySelector('.sidehead [data-a="sps-return"]'));
    check('搜索框紧凑高度',document.querySelector('.sps-settings-search').getBoundingClientRect().height===36);
    settingsConfig().auroraAccent='#7A4DFF';render();const length=anhEntries.length;
    render();check('重复渲染不增加历史',anhEntries.length===length);
    document.querySelector('[data-a="anh-back"]').click();check('真实点击上一步返回运行时',s.settingsSection==='runtime');
    document.querySelector('[data-a="anh-forward"]').click();check('真实点击下一步返回通知',s.settingsSection==='welink');
    action('anh-back');action('anh-back');check('导航保留任务草稿',newTaskDraft()?.goal==='导航后保留任务输入');
    check('导航不会撤销主题设置',settingsConfig().auroraAccent==='#7A4DFF');
    action('studio','@home');check('分支导航清空下一步',anhIndex===anhEntries.length-1&&document.querySelector('[data-a="anh-forward"]').disabled);
    abNew('workflow');const draft=abEnsure().editor;draft.name='串联草稿';action('anh-back');check('返回构建总览布局',!abEnsure().editor&&document.querySelector('#demo').dataset.buildMode==='overview');
    action('anh-forward');check('前进恢复构建草稿与面板',abEnsure().editor===draft&&draft.name==='串联草稿'&&document.querySelector('#demo').dataset.buildMode==='editor');
    while(anhIndex>0)action('anh-back');check('历史起点禁用上一步',document.querySelector('[data-a="anh-back"]').disabled);
    return {passed:checks.length,checks};
  }finally{Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);anhEntries.splice(0,anhEntries.length,...entries);anhIndex=index;anhRestoring=true;try{render();}finally{anhRestoring=false;}save();}
})()
