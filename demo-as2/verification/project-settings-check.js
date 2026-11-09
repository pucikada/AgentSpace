(async()=>{
 const backup=abCopy(s),draft=psDraftColor,checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);},pause=()=>new Promise(r=>setTimeout(r,180));
 try{
  closeModal();closeExtMenu();s.newTask=null;s.taskDetail=null;s.view='team';s.page='project';s.projectTab='members';render();await pause();
  check('成员与设置使用平铺分区',!!document.querySelector('.project-settings-flat')&&!document.querySelector('.project-settings-flat .card,.project-settings-flat .ps-card'));
  check('平铺分区无底色圆角阴影',[...document.querySelectorAll('.project-settings-flat>.ps-section')].every(e=>{const c=getComputedStyle(e);return c.backgroundColor==='rgba(0, 0, 0, 0)'&&c.borderRadius==='0px'&&c.boxShadow==='none';}));
  check('成员列表完整',document.querySelectorAll('.ps-members .sourceitem').length===6);
  check('保存按钮默认可见',getComputedStyle(document.querySelector('[data-a=ps-save]')).opacity==='1');
  document.querySelector('#psDesc').value='项目设置平铺验证';document.querySelector('#psLetter').value='QA';action('ps-save');check('原有项目配置仍可保存',psMeta().desc==='项目设置平铺验证'&&psMeta().letter==='QA');
  const before=JSON.stringify(s.projectMeta);document.querySelector('[data-a=ps-template-import]').click();check('模板导入仅为示意入口',!document.querySelector('.modal')&&JSON.stringify(s.projectMeta)===before);document.querySelector('[data-a=ps-template-export]').click();check('模板导出仅为示意入口',!document.querySelector('.modal')&&JSON.stringify(s.projectMeta)===before);
  check('旧版本入口有图标和文案',!!document.querySelector('.legacy-version-link>.icon')&&document.querySelector('.legacy-version-link>span').textContent==='切换到旧版本');
  for(const style of ['classic','aurora','liquid','pixel','bento'])for(const tab of ['members','overview']){
   s.appearance.style=style;s.projectTab=tab;render();await pause();const page=document.querySelector('.demoarea>.demopage');page.scrollTop=250;await pause();const header=document.querySelector('.project-home-sticky'),r=header.getBoundingClientRect(),p=page.getBoundingClientRect(),c=getComputedStyle(header),hit=document.elementFromPoint(p.left+p.width/2,p.top+3);
   check(style+tab+'吸顶覆盖内容顶边',Math.abs(r.top-p.top)<2&&r.left<=p.left+2&&r.right>=p.right-2&&!!hit?.closest('.project-home-sticky'));
   check(style+tab+'吸顶背景不透字',c.backgroundColor!=='transparent'&&c.backgroundColor!=='rgba(0, 0, 0, 0)'&&!/rgba\([^)]*,\s*0\./.test(c.backgroundColor));
  }
  return {passed:checks.length,checks};
 }finally{psDraftColor=draft;closeModal();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();render();}
})()
