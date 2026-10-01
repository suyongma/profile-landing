import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../public/personality-results.js', import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const summary = (title = '마지막 결과', id = 'a') => ({authenticated:true,user:{id},tests:{
  stri:{lastResult:{title}},ipip:{lastResult:null},ipc:{lastResult:null,status:'in_progress',answered:7},
}});
function setup(origin = 'https://mashong.com') {
  const listeners = new Map();
  const observers = [];
  const node = () => ({textContent:'',hidden:true,dataset:{},addEventListener(event,fn){this[event]=fn;}});
  const panels = ['stri','ipip','ipc'].map(id => {
    const label=node(), title=node();
    return {...node(),dataset:{personalityResult:id},label,title,querySelector:sel=>sel==='[data-result-label]'?label:title};
  });
  const notice=node(), retry=node(), login=node();
  const account={...node(),user:null,shadowRoot:{},trigger:{getAttribute:()=>account.label},label:'로그인'};
  const nodes={'#mashong-account':account,'[data-personality-notice]':notice,'[data-personality-retry]':retry,'[data-personality-login]':login};
  const requests=[];
  const document={readyState:'complete',visibilityState:'visible',querySelectorAll:()=>panels,querySelector:sel=>nodes[sel],addEventListener:(event,fn)=>listeners.set(event,fn)};
  const context = vm.createContext({document,location:{origin},customElements:{whenDefined:()=>Promise.resolve()},MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}},AbortController,
    setTimeout:()=>1,clearTimeout:()=>{},window:{addEventListener:(event,fn)=>listeners.set(event,fn),setInterval:()=>{}},
    fetch:(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve:data=>resolve({ok:true,json:async()=>data}),reject})),
  });
  vm.runInContext(source,context);
  return {panels,notice,retry,login,account,requests,focus:()=>listeners.get('focus')(),changeUser(user){account.user=user;observers.forEach(fn=>fn());},hide(){document.visibilityState='hidden';listeners.get('visibilitychange')();},show(){document.visibilityState='visible';listeners.get('visibilitychange')();}};
}
test('members see final titles as text; an unfinished draft still says exactly 아직 미검사',async()=>{
  const t=setup();await settle();t.requests[0].resolve(summary('<img src=x onerror=alert(1)>'));await settle();
  assert.equal(t.panels[0].label.textContent,'나의 마지막 결과');assert.equal(t.panels[0].title.textContent,'<img src=x onerror=alert(1)>');
  assert.equal(t.panels[1].label.textContent,'아직 미검사');assert.equal(t.panels[2].label.textContent,'아직 미검사');assert.equal(t.login.hidden,true);
  assert.equal(t.requests[0].options.credentials,'include');assert.equal(t.requests[0].options.cache,'no-store');assert.equal(t.requests[0].options.redirect,'error');
});
test('guest response removes all previous results and preserves a login invitation',async()=>{
  const t=setup();await settle();t.requests[0].resolve(summary());await settle();t.focus();assert.equal(t.panels[0].title.textContent,'');
  t.requests[1].resolve({authenticated:false});await settle();assert.equal(t.login.hidden,false);assert.equal(t.retry.hidden,true);
  assert.equal(t.panels[0].label.textContent,'로그인 후 결과 확인');
});
test('account switch immediately clears A; late A response cannot replace B',async()=>{
  const t=setup();await settle();t.requests[0].resolve(summary('A result'));await settle();t.focus();const stale=t.requests[1];
  t.changeUser({name:'B'});assert.equal(t.panels[0].title.textContent,'');assert.equal(stale.options.signal.aborted,true);
  t.requests[2].resolve(summary('B result','b'));await settle();stale.resolve(summary('late A'));await settle();assert.equal(t.panels[0].title.textContent,'B result');
});
test('network errors never show guest or untested, and retry recovers',async()=>{
  const t=setup();await settle();t.requests[0].resolve(summary());await settle();t.focus();t.requests[1].reject(Error('503'));await settle();
  assert.match(t.notice.textContent,/결과를 불러오지 못했어요/);assert.equal(t.retry.hidden,false);assert.equal(t.login.hidden,true);assert.equal(t.panels[0].title.textContent,'');assert.equal(t.panels[1].label.textContent,'결과 조회 실패');
  t.retry.click();t.requests[2].resolve(summary('Recovered'));await settle();assert.equal(t.panels[0].title.textContent,'Recovered');
});
test('malformed successful response is an error rather than fabricated untested data',async()=>{
  const t=setup();await settle();t.requests[0].resolve({authenticated:true,user:{id:'a'},tests:{stri:{lastResult:null}}});await settle();
  assert.equal(t.retry.hidden,false);assert.ok(t.panels.every(p=>p.label.textContent==='결과 조회 실패'));
});
test('hidden tabs discard in-flight data and refetch when visible',async()=>{
  const t=setup();await settle();const stale=t.requests[0];t.hide();stale.resolve(summary('Hidden result'));await settle();assert.equal(t.panels[0].title.textContent,'');
  t.show();t.requests[1].resolve(summary('Fresh result'));await settle();assert.equal(t.panels[0].title.textContent,'Fresh result');
});
test('localhost does not widen Auth access or request real member data',async()=>{
  const t=setup('http://localhost:8787');await settle();assert.equal(t.requests.length,0);assert.match(t.notice.textContent,/https:\/\/mashong.com/);
});
