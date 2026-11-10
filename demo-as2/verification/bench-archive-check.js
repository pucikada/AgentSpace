(()=>{
  const backup=abCopy(s),checks=[];
  const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
  const click=(a,id)=>document.querySelector(`[data-a="${a}"][data-v="${id}"]`).click();
  try{
    closeExtMenu();s.newTask=null;s.personalTab='overview';s.benchFilter='all';s.benchList=false;action('nav-personal','benches');
    const b={...abCopy(s.benches.find(b=>!b.isDefault)),id:'qa-bench-archive',title:'归档联调工作台',favorite:false,archived:false};s.benches.push(b);render();
    check('空心与实心收藏均常显',[...document.querySelectorAll('.bench-feature-card>.star')].every(e=>getComputedStyle(e).opacity==='1'));
    homeBenchAction('bench-card-menu',b.id);
    check('未归档菜单无删除',!document.querySelector('.bench-card-menu [data-a="bench-card-delete"]'));
    check('未归档菜单含归档',!!document.querySelector('.bench-card-menu [data-a="bench-card-archive"]'));
    homeBenchAction('bench-card-delete-do',b.id);check('未归档不能直接删除',s.benches.includes(b));
    click('bench-card-archive',b.id);
    check('归档从全部隐藏',b.archived&&!document.querySelector(`.bench-thumbnail[data-v="${b.id}"]`));
    action('bench-filter','archived');check('已归档卡片可见',!!document.querySelector(`.bench-thumbnail[data-v="${b.id}"]`));
    __persistNow();check('归档状态持久化',JSON.parse(localStorage.getItem('agentspace-mvp-workbench-history-v28')).benches.find(x=>x.id===b.id).archived);
    homeBenchAction('bench-card-menu',b.id);
    check('归档菜单仅恢复和删除',[...document.querySelectorAll('.bench-card-menu [role="menuitem"]')].map(e=>e.textContent).join('|')==='取消归档|删除');
    click('bench-card-archive',b.id);check('取消归档移出归档列表',!b.archived&&!document.querySelector(`.bench-thumbnail[data-v="${b.id}"]`));
    action('bench-filter','all');action('bench-view-set','list');
    check('列表未归档无删除',!document.querySelector(`.bench-list-actions [data-a="bench-card-delete"][data-v="${b.id}"]`));
    click('bench-card-archive',b.id);action('bench-filter','archived');
    check('列表已归档支持删除',!!document.querySelector(`.bench-list-actions [data-a="bench-card-delete"][data-v="${b.id}"]`));
    click('bench-card-delete',b.id);check('删除先确认',s.benches.includes(b)&&!!document.querySelector('[data-a="bench-card-delete-do"]'));
    action('close-modal','');check('取消保留归档项',s.benches.includes(b)&&b.archived);
    click('bench-card-delete',b.id);click('bench-card-delete-do',b.id);
    check('确认后删除记录',!s.benches.some(x=>x.id===b.id));
    const builtin=s.benches.find(x=>x.isDefault);
    homeBenchAction('bench-card-archive',builtin.id);homeBenchAction('bench-card-delete',builtin.id);click('bench-card-delete-do',builtin.id);
    check('默认工作台同样需先归档再确认删除',!s.benches.some(x=>x.id===builtin.id)&&s.defaultBenchDeleted);
    defaultBenchSeed();check('已明确删除的默认工作台不自动重建',!s.benches.some(x=>x.id===builtin.id));
    return {passed:checks.length,checks};
  }finally{closeExtMenu();closeModal();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);save();__persistNow();render();}
})()
