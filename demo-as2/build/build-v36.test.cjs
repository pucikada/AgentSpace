const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function app(){
  const context=vm.createContext({console,Date,Math,JSON,Set,Map,window:{addEventListener(){}},CSS:{escape:x=>x},document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return []},getElementById(){return null},activeElement:null},s:{view:'personal',prototypeRole:'admin',tasks:[],installations:[],workflowDrafts:[]},projectNames:['Project'],DIRECTORY:[],bx2ScopeNow:()=> '个人',bx2Items:()=>[],asset:()=>null,bfAction:()=>false,render(){},save(){},notify(){},modal(){},closeModal(){},btn(){return '';},ico(){return '';},esc:x=>String(x),buildItems:()=>[]});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'as2-build.js'),'utf8'),context);
  vm.runInContext(`function testDependencies(d){const env={id:'test-env',type:'env',scope:d.scope,name:'Runtime',version:1,visibility:'public',config:abDefaults(),history:[]};const preset={id:'test-preset',type:'agentPreset',scope:d.scope,name:'Preset',version:1,visibility:'public',config:abCopy(d.config),history:[]};abEnsure().assets.push(env,preset);Object.assign(d,{envId:env.id,envVersion:1,presetId:preset.id,presetVersion:1});abResolveComposition(d);}`,context);
  return source=>vm.runInContext(source,context);
}
test('environment templates version snapshots and duplicate-name validation',()=>{
  const run=app();
  assert.equal(run(`abNew('env');let d=abEnsure().editor;d.name='Node';d.config.image='node:20';abStore(d);const e=abItems('env')[0];abOpen(e.id);abEnsure().editor.config.image='python:3.11';abStore(abEnsure().editor);abItems('env')[0].version`),2);
  assert.equal(run(`abSnapshot(abItems('env')[0],1).config.image`),'node:20');
  assert.equal(run(`abNew('env');abEnsure().editor.name='Node';abValidate(abEnsure().editor).length>0`),true);
});
test('direct local instances require runtime, path and public-access confirmation',()=>{
  const run=app();
  assert.equal(run(`abNew('instance');let d=abEnsure().editor;d.name='Local';d.config.location='本地';d.config.zone='黄区';abValidate(d).some(e=>e.includes('离线'))`),true);
  assert.equal(run(`d.config.zone='绿区';d.folderMode='existing';d.existingFolder='relative';abValidate(d).some(e=>e.includes('绝对路径'))`),true);
  assert.equal(run(`d.existingFolder='/work/repo';d.visibility='public';abValidate(d).some(e=>e.includes('访问范围'))`),true);
  assert.equal(run(`d.publicConfirmed=true;d.config.repos=[{name:'repo',branch:'main'}];abStore(d);const i=abItems('instance')[0];i.templateId===''&&i.templateVersion===0&&i.workingDirectory==='/work/repo'&&i.config.repos.length===0`),true);
});
test('template-based instance captures independent config and source version',()=>{
  const run=app();
  assert.equal(run(`abNew('env');let d=abEnsure().editor;d.name='Base';abStore(d);const e=abItems('env')[0];abNew('instance');d=abEnsure().editor;d.name='From base';d.sourceMode='template';d.templateId=e.id;d.templateVersion=e.version;d.config=abCopy(e.config);d.config.init='npm ci';abStore(d);const i=abItems('instance')[0];i.templateId===e.id&&i.templateVersion===1&&e.config.init===''&&i.config.init==='npm ci'`),true);
});
test('public atomic templates reject private instances and incompatible local engines',()=>{
  const run=app();
  assert.equal(run(`abNew('instance');let d=abEnsure().editor;d.name='Private';abStore(d);const i=abItems('instance')[0];abNew('task');d=abEnsure().editor;d.name='Atomic';d.config.environment={mode:'instance',instanceId:i.id};abValidate(d).some(e=>e.includes('私密'))`),true);
  assert.equal(run(`d.visibility='private';abValidateConfig(d.config,d.scope,d.visibility).length`),0);
  assert.equal(run(`i.config.location='本地';d.config.agentType='zero';abValidate(d).some(e=>e.includes('codeagent'))`),true);
});
test('empty optional prompts, extensions and gates remain empty after saving',()=>{
  const run=app();
  assert.equal(run(`abNew('task');let d=abEnsure().editor;d.name='Empty';d.description='human description';testDependencies(d);abStore(d);const t=abItems('task')[0];t.config.presetPrompt===''&&t.config.inputPromptTemplate===''&&t.config.extensions.length===0&&t.config.gates.length===0`),true);
});
test('series drafts allow incomplete steps; publish validates every input and gate',()=>{
  const run=app();
  assert.equal(run(`abNew('workflow');let d=abEnsure().editor;d.name='Series';abValidate(d,false).length`),0);
  assert.equal(run(`abValidate(d,true).length>0`),true);
  assert.equal(run(`const st=d.stages[0].steps[0];st.name='Step';st.input='Do it';st.source='inline';st.config.gates=[{type:'artifact',value:''}];abValidate(d,true).some(e=>e.includes('准出'))`),true);
  assert.equal(run(`st.config.gates[0].value='result.md';abValidate(d,true).length`),0);
});
test('series retains atomic version snapshot and only prefills inputPromptTemplate',()=>{
  const run=app();
  assert.equal(run(`abNew('task');let d=abEnsure().editor;d.name='Atom';d.config.presetPrompt='Preset';d.description='Description';testDependencies(d);abStore(d);const a=abItems('task')[0];abNew('workflow');d=abEnsure().editor;abChange({dataset:{abField:'stages.0.steps.0.atomicId'},type:'select-one',tagName:'SELECT',value:a.id});const st=d.stages[0].steps[0];st.input===''&&st.atomicVersion===1&&st.atomicSnapshot.config.presetPrompt==='Preset'`),true);
  assert.equal(run(`a.config.presetPrompt='Changed';st.atomicSnapshot.config.presetPrompt`),'Preset');
});
test('reuse uses stable earlier step IDs and rejects reordered or deleted sources',()=>{
  const run=app();
  assert.equal(run(`abNew('env');let d=abEnsure().editor;d.name='Base';abStore(d);const e=abItems('env')[0];abNew('workflow');d=abEnsure().editor;const first=d.stages[0].steps[0];first.source='inline';first.name='First';first.input='one';first.config.environment={mode:'template',templateId:e.id,version:1};const second=abStep();second.source='inline';second.name='Second';second.input='two';second.config=abCopy(first.config);second.reuseStepId=first.id;d.stages[0].steps.push(second);abReuseOptions(d,second)[0].id===first.id`),true);
  assert.equal(run(`abMove(d.stages[0].steps,0,1);abReuseOptions(d,second).length`),0);
  assert.equal(run(`abValidate({...d,name:'Flow'}).some(e=>e.includes('复用来源失效'))`),true);
});
test('extensions are isolated per application scope and disabled installs are excluded',()=>{
  const run=app();
  assert.equal(run(`asset=id=>({id,type:'MCP'});s.installations=[{assetId:'personal',source:'AgentCenter',scope:'global',enabled:true},{assetId:'project',source:'AgentCenter',scope:'project',project:'Project',enabled:true},{assetId:'off',source:'AgentCenter',scope:'project',project:'Project',enabled:false}];abExts('Project').map(i=>i.assetId).join(',')`),'project');
});
test('ordinary project members default to private and cannot publish public templates',()=>{
  const run=app();
  assert.equal(run(`s.prototypeRole='member';bx2ScopeNow=()=> 'Project';s.bxScope='Project';abNew('task');abEnsure().editor.visibility`),'private');
  assert.equal(run(`const d=abEnsure().editor;d.name='Private';d.visibility='public';abValidate(d).some(e=>e.includes('普通项目成员'))`),true);
});

test('atomic composition requires both dependencies and retains preset version snapshot',()=>{
 const run=app();
 assert.equal(run(`abNew('task');let d=abEnsure().editor;d.name='Composed';abValidate(d).some(e=>e.includes('Agent 预设'))`),true);
 assert.equal(run(`testDependencies(d);const preset=abGet(d.presetId);d.config.model='resolved';abStore(d);preset.config.model='changed';abItems('task')[0].presetSnapshot.config.model===''`),true);
});
