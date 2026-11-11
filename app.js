(()=>{
const langs=[['kk','🇰🇿','Қазақ тілі','Kazakh','kk-KZ'],['ru','🇷🇺','Орыс тілі','Russian','ru-RU'],['en','🇬🇧','Ағылшын тілі','English','en-US'],['zh','🇨🇳','Қытай тілі','Chinese','zh-CN']];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={page:'home',lang:'kk',test:null};
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem('tilpro_'+k))??d}catch{return d}};
const save=(k,v)=>localStorage.setItem('tilpro_'+k,JSON.stringify(v));
let stats=read('stats',{seen:0,tests:[],best:0});
const words=window.TILPRO_WORDS;
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2600)}
function fillSelect(id){$(id).innerHTML=langs.map(l=>`<option value="${l[0]}">${l[1]} ${l[2]}</option>`).join('')}
['#lessonLanguage','#dictionaryLanguage','#testLanguage'].forEach(fillSelect);
function showPage(p){state.page=p;$$('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+p));$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===p));$('#pageTitle').textContent=({home:'Басты бет',lesson:'Оқулық',test:'Тест',results:'Нәтижелер',dictionary:'Сөздік',account:'Аккаунт'})[p];$('#sidebar').classList.remove('open');if(p==='results')renderResults()}
$$('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));$$('[data-go]').forEach(b=>b.onclick=()=>showPage(b.dataset.go));$('#menuToggle').onclick=()=>$('#sidebar').classList.toggle('open');
function langCards(){$('#languageGrid').innerHTML=langs.map(l=>`<article class="language-card" data-lang="${l[0]}"><div class="lang-flag">${l[1]}</div><h3>${l[2]}</h3><p>${words[l[0]].length} сөз • Оқулық және тест</p></article>`).join('');$$('.language-card').forEach(c=>c.onclick=()=>{state.lang=c.dataset.lang;$('#lessonLanguage').value=state.lang;showPage('lesson');renderLesson()})}
function wordCard(w,code){const term=w[0],translation=w[1];return `<article class="word-card"><div class="word-main">${term}</div>${code==='zh'?`<div class="pinyin">${w[4]||''}</div>`:''}<div class="word-translation">${translation}</div><div class="word-actions"><small class="muted">${w[2]}</small><button class="listen-btn" data-say="${encodeURIComponent(term)}" data-lang="${code}">▶ Тыңдау</button></div></article>`}
function renderLesson(){const code=$('#lessonLanguage').value;state.lang=code;const list=words[code];$('#lessonCount').textContent=`${list.length} сөз`;$('#lessonWords').innerHTML=list.map(w=>wordCard(w,code)).join('');wireSpeech()}
function renderDictionary(){const code=$('#dictionaryLanguage').value;const q=$('#wordSearch').value.trim().toLowerCase();const list=words[code].filter(w=>w.join(' ').toLowerCase().includes(q));$('#dictionaryWords').innerHTML=list.map(w=>wordCard(w,code)).join('')||'<p class="muted">Сөз табылмады.</p>';wireSpeech()}
function wireSpeech(){$$('[data-say]').forEach(b=>b.onclick=()=>speak(decodeURIComponent(b.dataset.say),b.dataset.lang))}
function kazakhFallback(text){return text.replace(/[ӘәҒғҢңҚқӨөҰұҮүҺһІі]/g,ch=>({'Ә':'А','ә':'а','Ғ':'Г','ғ':'г','Ң':'НГ','ң':'нг','Қ':'К','қ':'к','Ө':'О','ө':'о','Ұ':'У','ұ':'у','Ү':'У','ү':'у','Һ':'Х','һ':'х','І':'И','і':'и'}[ch]||ch))}
function speak(text,code){
 stats.seen++;save('stats',stats);updateStats();
 if(!('speechSynthesis'in window)){toast('Бұл браузерде дыбыстау қолжетімсіз.');return}
 speechSynthesis.cancel();
 const l=langs.find(x=>x[0]===code);const voices=speechSynthesis.getVoices();
 const u=new SpeechSynthesisUtterance(text);u.rate=.86;
 let voice=voices.find(x=>x.lang.toLowerCase()===l[4].toLowerCase())||voices.find(x=>x.lang.toLowerCase().startsWith(code+'-'));
 if(code==='kk'&&!voice){
   // Қазақша дауыс жоқ болса, сөздің фонетикалық жеңілдетілген түрін орысша жүйелік дауыспен оқиды.
   u.text=kazakhFallback(text);u.lang='ru-RU';
   voice=voices.find(x=>x.lang.toLowerCase().startsWith('ru-'));
   toast('Қазақша дауыс табылмады. Жақындатылған дыбыстау қолданылды.');
 }else{u.lang=l[4]}
 if(voice)u.voice=voice;
 speechSynthesis.speak(u)
}
$('#lessonLanguage').onchange=renderLesson;$('#dictionaryLanguage').onchange=renderDictionary;$('#wordSearch').oninput=renderDictionary;
function startTest(){const code=$('#testLanguage').value;const list=[...words[code]];if(list.length<20){toast('Тестке кемінде 20 сөз керек.');return}const qs=list.slice(0,20).map((w,i)=>{const pool=list.filter((x,j)=>j!==i&&x[1]!==w[1]).map(x=>x[1]);const distractors=[];while(distractors.length<3&&pool.length){const k=Math.floor(Math.random()*pool.length);const v=pool.splice(k,1)[0];if(!distractors.includes(v))distractors.push(v)}const opts=[w[1],...distractors].sort(()=>Math.random()-.5);return {w,opts}});state.test={code,qs,index:0,score:0,locked:false};renderQuestion()}
function renderQuestion(){const t=state.test,q=t.qs[t.index];$('#testPanel').innerHTML=`<div class="toolbar"><b>${langs.find(l=>l[0]===t.code)[2]}</b><span class="muted">${t.index+1} / 20</span></div><div class="progress-track"><div class="progress-fill" style="width:${(t.index+1)*5}%"></div></div><div class="test-question">${q.w[0]} ${t.code==='zh'?`<small class="pinyin">${q.w[4]}</small>`:''}</div><div class="answers">${q.opts.map(o=>`<button class="answer-btn" data-answer="${o.replaceAll('"','&quot;')}">${o}</button>`).join('')}</div><p id="feedback" class="muted"></p><button class="primary-btn" id="nextQuestion" disabled style="margin-top:16px">${t.index===19?'Нәтижені көру':'Келесі сұрақ →'}</button>`;$$('[data-answer]').forEach(b=>b.onclick=()=>{if(t.locked)return;t.locked=true;const ok=b.dataset.answer===q.w[1];if(ok)t.score++;b.classList.add(ok?'correct':'wrong');$$('[data-answer]').forEach(x=>{x.disabled=true;if(x.dataset.answer===q.w[1])x.classList.add('correct')});$('#feedback').textContent=ok?'Дұрыс жауап!':'Дұрыс жауап: '+q.w[1];$('#nextQuestion').disabled=false});$('#nextQuestion').onclick=()=>{if(t.index<19){t.index++;t.locked=false;renderQuestion()}else finishTest()}}
function finishTest(){const t=state.test;const pct=Math.round(t.score/20*100);stats.tests.unshift({lang:t.code,score:t.score,pct,date:new Date().toLocaleDateString('kk-KZ')});stats.best=Math.max(stats.best,pct);save('stats',stats);$('#testPanel').innerHTML=`<h2>Тест аяқталды!</h2><div class="stat-value">${pct}%</div><p class="muted">20 сұрақтың ${t.score}-іне дұрыс жауап бердің.</p><button class="primary-btn" id="again">Қайта тапсыру</button>`;$('#again').onclick=startTest;state.test=null;updateStats()}
$('#startTest').onclick=startTest;
function renderResults(){const r=stats.tests;$('#resultsList').innerHTML=r.length?r.map(x=>`<article class="result-card"><div><b>${langs.find(l=>l[0]===x.lang)[2]}</b><div class="muted">${x.date} • ${x.score}/20 дұрыс</div></div><strong>${x.pct}%</strong></article>`).join(''):'<p class="muted">Әзірге тест нәтижесі жоқ.</p>'}
function updateStats(){$('#statWords').textContent=stats.seen;$('#statTests').textContent=stats.tests.length;$('#statBest').textContent=stats.tests.length?stats.best+'%':'—'}
$('#resetProgress').onclick=()=>{if(confirm('Барлық прогресс пен нәтижені өшіресің бе?')){localStorage.removeItem('tilpro_stats');stats={seen:0,tests:[],best:0};updateStats();renderResults();toast('Прогресс тазартылды.')}};
const theme=read('theme','light');document.documentElement.dataset.theme=theme;function themeLabel(){$('#themeToggle').textContent=document.documentElement.dataset.theme==='dark'?'☀ Ашық режим':'◐ Қара-көк режим'}
$('#themeToggle').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;save('theme',next);themeLabel()};
langCards();renderLesson();renderDictionary();updateStats();themeLabel();
})();
