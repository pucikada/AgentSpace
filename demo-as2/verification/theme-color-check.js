// Run in the isolated demo browser: agent-browser --session as2-color-audit eval --stdin < this-file
(async()=>{
 const backup=JSON.parse(JSON.stringify(s)),root=document.documentElement;
 const variants=[['classic','light'],['dark','dark'],['bento','light'],['bento','dark'],['aurora','light'],['aurora','mixed'],['aurora','dark'],['liquid','light'],['pixel','dark'],['pixel','light']];
 const css=document.querySelector('style').textContent.replace(/\/\*[\s\S]*?\*\//g,''),names=[...new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(x=>x[1]))].sort();
 const checks=[],themes=[];
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 const probe=document.createElement('i');document.body.appendChild(probe);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const rgba=value=>{probe.style.color=value;const c=getComputedStyle(probe).color;ctx.clearRect(0,0,1,1);ctx.fillStyle=c;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);};
 const over=(fg,bg)=>{const a=fg[3]+bg[3]*(1-fg[3]);return [...fg.slice(0,3).map((v,i)=>(v*fg[3]+bg[i]*bg[3]*(1-fg[3]))/a),a];};
 const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const contrast=(f,b)=>{const x=lum(f),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 try{
  for(const [style,mode]of variants){
   const st=settingsConfig();Object.assign(st,{auroraMode:style==='aurora'?mode:'light',bentoMode:style==='bento'?mode:'light',pixelMode:style==='pixel'?mode:'light',reduceMotion:true});pixelInkNormalize(st);appearanceSelect('style',style);appearanceApply();settingsApply();
   const key=style+'/'+mode,cs=getComputedStyle(root),tokens=Object.fromEntries(names.map(n=>[n,cs.getPropertyValue(n).trim()]));
   check(key+' theme attributes',root.dataset.theme===(mode==='dark'?'dark':'light'));
   for(const n of ['--as-bg','--as-card','--as-text','--as-brand','--as-btn-ink','--as-wait','--as-tone-blue','--as-muted'])check(key+' '+n,!!tokens[n]);
   check(key+' color input data',liquidPalettes().every(x=>/^#[\da-f]{6}$/i.test(x[2])&&/^#[\da-f]{6}$/i.test(x[3]))&&pixelInks().every(x=>/^#[\da-f]{6}$/i.test(x[0]))&&auroraAccents().every(x=>/^#[\da-f]{6}$/i.test(x[0])));
   const bg=over(rgba(tokens['--as-card']),over(rgba(tokens['--as-bg']),[255,255,255,1]));
   const ratios={};
   for(const [f,b]of [['--as-text','--as-card'],['--as-text-2','--as-card'],['--as-text-muted','--as-card'],['--as-text-subtle','--as-card'],['--as-brand','--as-card'],['--as-wait','--as-card'],['--as-fail','--as-card'],['--as-done','--as-card'],['--as-btn-ink','--as-btn-top'],['--as-btn-ink','--as-btn-bottom'],['--as-selected-ink','--as-selected']]){
    const backing=b==='--as-card'?bg:over(rgba(tokens[b]),bg);ratios[f+'/'+b]=contrast(over(rgba(tokens[f]),backing),backing);
   }
   const routes=[];
   for(const route of ['home','board','studio','settings']){
    closeModal();s.newTask=null;s.taskDetail=null;s.automationDetail=null;
    if(route==='home')action('nav-personal','benches');else if(route==='board'){s.view='team';s.page='board';s.teamPage='board';s.projectBoard=newBoardState();render();}else if(route==='studio')action('studio','@home');else openSettings('appearance');
    check(key+' '+route+' rendered',!!document.querySelector(route==='settings'?'.sps-settings-page':'#demo'));
    if(route==='board'){for(const col of document.querySelectorAll('.tk-col[data-col="wait"]'))check(key+' waiting column uses semantic color',getComputedStyle(col).getPropertyValue('--tk-accent').trim()===getComputedStyle(col).getPropertyValue('--as-wait').trim());}
    routes.push(route);
   }
   themes.push({style,mode,tokens,ratios,routes});
  }
  // Exercise persisted preset values through the same event path as the user menu.
  for(const [style,fn]of [['aurora',auroraAccents],['bento',bentoAccents]])for(const [color]of fn()){
   userColorApply((style==='bento'?'minimal':'aurora')+'|accent:'+color);check(style+' preset '+color,asColor(style==='bento'?'--bn':'--au').toUpperCase()===color.toUpperCase());
  }
  for(const [id,,a,b]of liquidPalettes()){userColorApply('liquid|preset:'+id);check('liquid '+id,asColor('--lq-a')===a&&asColor('--lq-b')===b);}
  for(const mode of ['light','dark']){
   userColorApply('pixel|mode:'+mode);
   for(const [ink,,text,on]of pixelInks(mode)){userColorApply('pixel|ink:'+ink);check('pixel '+mode+' '+ink,asColor('--px-ink')===ink&&asColor('--px-ink-text')===text&&asColor('--px-on-ink')===on);}
  }
  appearanceSelect('style','liquid');const custom=settingsConfig();custom.liquidPreset='custom';custom.liquidA=asColor('--as-color-liquid-orange');custom.liquidB=asColor('--as-color-liquid-blue');appearanceApply();settingsApply();
  check('custom liquid input remains hex',asColor('--lq-a')===custom.liquidA&&/^#[\da-f]{6}$/i.test(custom.liquidA));
  const inventory=[];
  const walk=(rules,context=[])=>{for(const rule of rules){if(rule.style){const declarations=[...rule.style].filter(n=>n.startsWith('--')).map(name=>({name,value:rule.style.getPropertyValue(name).trim(),important:rule.style.getPropertyPriority(name)==='important'}));if(declarations.length)inventory.push({selector:rule.selectorText||rule.cssText.split('{')[0],context,declarations});}else if(rule.cssRules)walk(rule.cssRules,[...context,rule.conditionText||rule.name||rule.cssText.split('{')[0]]);}};
  for(const sheet of document.styleSheets){try{walk(sheet.cssRules);}catch{}}
  return {checks:checks.length,themes,inventory};
 }finally{probe.remove();Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,backup);render();appearanceApply();settingsApply();save();}
})()
