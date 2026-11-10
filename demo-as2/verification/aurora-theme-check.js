(async()=>{
 const backup=abCopy(s),checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);},pause=()=>new Promise(r=>setTimeout(r,240));
 const dark=e=>{const m=getComputedStyle(e).backgroundColor.match(/^rgb\((\d+), (\d+), (\d+)\)$/);return m&&Math.max(...m.slice(1).map(Number))<100;};
 try{
  closeModal();s.newTask=null;s.taskDetail=null;s.automationDetail=null;
  check('旧深浅布局保留为独立选项',umColorOptions('aurora').includes('mode:mixed'));
  const geometry=()=>{const root=document.documentElement,area=getComputedStyle(document.querySelector('.demoarea')),frame=getComputedStyle(document.querySelector('#demo'),'::before'),stage=document.querySelector('.ms-stage');return JSON.stringify({margin:area.margin,radius:area.borderRadius,border:area.borderWidth,frame:[frame.content,frame.left,frame.right,frame.bottom,frame.borderRadius],stage:stage?[getComputedStyle(stage).margin,getComputedStyle(stage).borderRadius]:null});};
  for(const route of ['personal','project-board','messages','studio']){
   const setup=()=>{s.newTask=null;s.taskDetail=null;s.automationDetail=null;closeModal();if(route==='personal')action('nav-personal','benches');else if(route==='project-board'){s.view='team';s.page='board';s.teamPage='board';s.projectBoard=newBoardState();render();}else if(route==='messages')action('mode','messages');else action('studio','@home');};
   userColorApply('aurora|mode:light');setup();await pause();const light=geometry();
   for(const mode of ['mixed','dark']){userColorApply('aurora|mode:'+mode);setup();await pause();check(route+' '+mode+'保留幻彩半包围几何',geometry()===light);}
  }
  s.view='team';s.page='board';s.teamPage='board';render();await pause();
  check('深色看板无彩色粗顶边',[...document.querySelectorAll('.kanban-column')].every(e=>getComputedStyle(e).boxShadow==='none'));
  check('深色筛选栏底色透明',getComputedStyle(document.querySelector('.aggregate-filters')).backgroundColor==='rgba(0, 0, 0, 0)');
  check('深色看板卡片亮于列底',getComputedStyle(document.querySelector('.kanban-card')).backgroundColor==='rgb(36, 36, 39)'&&getComputedStyle(document.querySelector('.kanban-column')).backgroundColor==='rgb(26, 26, 29)');
  for(const mode of ['light','mixed','dark']){userColorApply('aurora|mode:'+mode);await pause();check(mode+'侧栏头部分割线恢复',getComputedStyle(document.querySelector('.sidehead')).borderBottomColor!=='rgba(0, 0, 0, 0)');}
  for(const mode of ['light','mixed','dark'])for(const density of ['comfortable','compact']){
   settingsConfig().density=density;userColorApply('aurora|mode:'+mode);action('mode','messages');await pause();
   check(mode+' '+density+'消息头部分割线水平对齐',Math.abs(document.querySelector('.ms-list-head').getBoundingClientRect().bottom-document.querySelector('.ms-chat-head').getBoundingClientRect().bottom)<.5);
   check(mode+' '+density+'消息半包围无矩形外层描边',getComputedStyle(document.querySelector('.demoarea')).outlineStyle==='none');
  }
  settingsConfig().density='comfortable';s.view='team';s.page='board';s.teamPage='board';render();
  for(const style of ['classic','dark','liquid','bento','pixel']){appearanceSelect('style',style);await pause();check(style+'侧栏头部分割线保留',getComputedStyle(document.querySelector('.sidehead')).borderBottomColor!=='rgba(0, 0, 0, 0)'&&getComputedStyle(document.querySelector('.sidehead')).borderBottomWidth!=='0px');}

  for(const mode of ['light','mixed','dark']){
   userColorApply('aurora|mode:'+mode);await pause();
   check(mode+'保存并生效',settingsConfig().auroraMode===mode&&document.documentElement.dataset.auMode===mode);
   check(mode+'明暗语义',document.documentElement.dataset.theme===(mode==='dark'?'dark':'light'));
   for(const accent of ['#3F6BFF','#7A4DFF','#00B5CC']){userColorApply('aurora|accent:'+accent);check(mode+'主题色'+accent,getComputedStyle(document.documentElement).getPropertyValue('--au').trim()===accent&&settingsConfig().auroraMode===mode);}
  }
  for(const route of ['personal','team','extensions','studio','settings']){
   if(route==='personal'){s.view='personal';s.page='personal';s.personalPage='benches';}
   else if(route==='team'){s.view='team';s.page='project';s.teamPage='project';s.projectTab='overview';}
   else if(route==='settings'){openSettings('appearance');}
   else if(route==='studio'){action('studio','@home');}
   else action('mode',route);
   render();await pause();
   check(route+'内容底板深色',dark(document.querySelector('.demoarea')));
   const white=[...document.querySelectorAll('#demo *')].filter(e=>{const r=e.getBoundingClientRect(),m=getComputedStyle(e).backgroundColor.match(/^rgb\((\d+), (\d+), (\d+)\)$/);return !e.closest('.sps-mode-art')&&r.width>180&&r.height>60&&m&&Math.min(...m.slice(1).map(Number))>210;});
   check(route+'无大面积浅色残留',white.length===0);
  }
  s.view='team';s.page='project';s.teamPage='project';s.projectTab='overview';render();await pause();
  check('主题切换后吸顶头部同步深色',dark(document.querySelector('.proj-sticky')));
  check('深色外层与顶栏统一',['body','.appbar'].every(q=>getComputedStyle(document.querySelector(q)).backgroundColor==='rgb(16, 16, 18)'));
  check('深色右侧底板与吸顶头部统一',['.demoarea','.proj-sticky'].every(q=>getComputedStyle(document.querySelector(q)).backgroundColor==='rgb(21, 21, 23)'));
  check('深色底板与外框有明度区分',getComputedStyle(document.querySelector('.demoarea')).backgroundColor!==getComputedStyle(document.querySelector('#demo'),'::before').backgroundColor);
  check('深色侧栏沿用中性外框',getComputedStyle(document.querySelector('.demoside')).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(document.querySelector('#demo'),'::before').backgroundColor==='rgb(27, 27, 30)');
  check('深色侧栏不使用彩色渐变',getComputedStyle(document.querySelector('.demoside')).backgroundImage==='none');
  for(const mode of ['light','mixed','dark']){
   userColorApply('aurora|mode:'+mode);s.projectTab='overview';render();await pause();
   const cards=[...document.querySelectorAll('.project-overview-metrics>button,.wb-dash-panel,.threadlink')];
   check(mode+'项目卡片无默认阴影',cards.length>0&&cards.every(e=>getComputedStyle(e).boxShadow==='none'));
  }
  userColorApply('aurora|mode:dark');s.project='AgentSpace 2.0';action('channel','IM能力构建');await pause();
  const actions=[...document.querySelectorAll('.co-message-actions')];
  check('深色频道操作栏无整条底色',actions.length>0&&actions.every(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'));
  userColorApply('aurora|mode:light');s.view='personal';s.page='personal';s.personalPage='benches';render();await pause();
  const primary=getComputedStyle(document.querySelector('.demoside')).getPropertyValue('--as-text').trim();
  check('侧栏默认导航使用主文本色',[...document.querySelectorAll('.sidenav:not(.active),.side-sec-toggle')].every(e=>getComputedStyle(e).color==='rgb(17, 26, 51)'));
  check('保留工作台彩色图标',new Set([...document.querySelectorAll('.side-bench-icon svg')].map(e=>getComputedStyle(e).color)).size>1);
  check('主导航行高36px',document.querySelector('.side-newtask').getBoundingClientRect().height===36);
  check('默认左侧导航宽72px',document.querySelector('.demorail').getBoundingClientRect().width===72);
  glassConfig().wallpaper.kind='mat';appearanceSelect('style','liquid');openSettings('appearance');await pause();
  check('切换玻璃默认蓝橙渐变',glassConfig().wallpaper.kind==='gradient'&&settingsConfig().liquidPreset==='blue-orange');
  check('壁纸选中态同步',document.querySelector('[data-a=wallpaper-set][aria-checked=true]')?.dataset.v==='gradient');
  check('玻璃数字徽标为白字',getComputedStyle(document.querySelector('.rail-unread')).color==='rgb(255, 255, 255)');
  return {passed:checks.length,checks};
 }finally{Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);render();save();}
})()
