(async()=>{
 const backup=abCopy(s),checks=[],check=(n,ok)=>{if(!ok)throw Error(n);checks.push(n)},pause=()=>new Promise(r=>setTimeout(r,250));
 try{
  closeModal();closeExtMenu();s.newTask=null;s.taskDetail=null;s.automationDetail=null;userColorApply('aurora|mode:dark');s.personalTab='overview';s.benchList=false;action('nav-personal','benches');await pause();
  const card=document.querySelector('.bench-feature-card'),star=card.querySelector('.star'),r=card.getBoundingClientRect(),sr=star.getBoundingClientRect();
  check('收藏常显且位于整卡右上角',getComputedStyle(star).opacity==='1'&&r.right-sr.right<30&&sr.top-r.top<30);
  check('操作默认隐藏',getComputedStyle(card.querySelector('.bench-card-actions')).opacity==='0');
  check('快照保留并置于页面容器',!!card.querySelector('.bench-preview-canvas')&&!!card.querySelector('.bench-page-back')&&getComputedStyle(card.querySelector('.bench-cover-wrap')).backgroundImage.includes('radial-gradient'));
  s.view='team';s.page='project';s.projectTab='overview';render();const badge=document.querySelector('.co-mgroup>b');check('深色数字徽标深灰底浅色字',getComputedStyle(badge).backgroundColor==='rgb(61, 61, 67)'&&getComputedStyle(badge).color==='rgb(244, 244, 245)');
  action('nav-personal','spaces');assetAction('spx-tab','environment');assetAction('spx-environment','templates');const tab=document.querySelector('.asset-subtabs>.active');check('深色二级Tab选中底色明确',getComputedStyle(tab).backgroundColor==='rgb(66, 66, 72)');
  action('nt-open');await pause();const input=document.querySelector('.nt-card'),shortcuts=document.querySelector('.nt-shortcuts'),wrap=document.querySelector('.wc-composer-wrap');check('深色输入框中性底色',getComputedStyle(input).backgroundColor==='rgb(29, 29, 32)');check('快捷入口紧邻输入框',Math.abs(shortcuts.getBoundingClientRect().top-wrap.getBoundingClientRect().bottom-22)<1);
  ntcSelect('custom');newTaskMenu('executor');const custom=document.querySelector('.ntc-custom-option');check('自定义配置默认无选中背景',custom.dataset.selected==='true'&&getComputedStyle(custom).backgroundColor==='rgba(0, 0, 0, 0)');
  return {passed:checks.length,checks};
 }finally{closeExtMenu();closeModal();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);render();save()}
})()
