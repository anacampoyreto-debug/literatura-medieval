
const app = document.getElementById("app");
const state = {
  view:"home",
  blockId:1,
  tab:"esquema",
  search:"",
  unlocked: JSON.parse(localStorage.getItem("lmv6_unlocked") || "{}"),
  quizResults: JSON.parse(localStorage.getItem("lmv6_quiz_results") || "{}"),
  finalAnswers: JSON.parse(localStorage.getItem("lmv6_final_answers") || "{}"),
  finalSubmitted: JSON.parse(localStorage.getItem("lmv6_final_submitted") || "false"),
  examCount: Number(localStorage.getItem("lmv6_exam_count") || 20),
  smartReviewQueue: JSON.parse(localStorage.getItem("lmv6_review_queue") || "[]")
};

function saveState(){
  localStorage.setItem("lmv6_unlocked", JSON.stringify(state.unlocked));
  localStorage.setItem("lmv6_quiz_results", JSON.stringify(state.quizResults));
  localStorage.setItem("lmv6_final_answers", JSON.stringify(state.finalAnswers));
  localStorage.setItem("lmv6_final_submitted", JSON.stringify(state.finalSubmitted));
  localStorage.setItem("lmv6_exam_count", String(state.examCount));
  localStorage.setItem("lmv6_review_queue", JSON.stringify(state.smartReviewQueue));
}
function getBlock(id){ return APP_DATA.blocks.find(b => b.id === id); }
function getQuizResults(blockId){ return state.quizResults[blockId] || {}; }
function getCorrectCount(blockId){
  const block = getBlock(blockId), results = getQuizResults(blockId);
  let count = 0;
  block.quiz.forEach((q, idx) => { if(results[idx] !== undefined && Number(results[idx]) === q.answer) count++; });
  return count;
}
function getMistakes(blockId){
  const block = getBlock(blockId), results = getQuizResults(blockId);
  return block.quiz.map((q, idx) => ({q, idx, chosen: results[idx], blockId:block.id, blockTitle:block.title}))
    .filter(item => item.chosen !== undefined && Number(item.chosen) !== item.q.answer);
}
function getAllMistakes(){ return APP_DATA.blocks.flatMap(b => getMistakes(b.id)); }
function totalQuestions(){ return APP_DATA.blocks.reduce((acc,b)=>acc+b.quiz.length,0); }
function totalCorrect(){ return APP_DATA.blocks.reduce((acc,b)=>acc+getCorrectCount(b.id),0); }
function completedBlocks(){ return APP_DATA.blocks.filter(b => getCorrectCount(b.id) === b.quiz.length).length; }
function accuracy(){
  const answered = APP_DATA.blocks.reduce((acc,b)=>acc+Object.keys(getQuizResults(b.id)).length,0);
  return answered ? Math.round((totalCorrect()/answered)*100) : 0;
}
function updateSmartReviewQueue(){
  state.smartReviewQueue = getAllMistakes().map(m => ({
    blockId:m.blockId, blockTitle:m.blockTitle, q:m.q.q, options:m.q.options, answer:m.q.answer, explanation:m.q.explanation
  }));
  saveState();
}
function iconFor(section){
  const map = {"POESÍA":"🪶","PROSA":"📜","TEATRO":"🎭","TÉCNICA LITERARIA":"🛡️"};
  return map[section] || "📚";
}
function examQuestions(){ return APP_DATA.final_quiz.slice(0, state.examCount); }

window.appSetView = function(view, blockId=null){
  state.view = view;
  if(blockId !== null) state.blockId = Number(blockId);
  render();
  window.scrollTo({top:0, behavior:"smooth"});
}
window.appSetTab = function(tab){
  state.tab = tab;
  render();
}
window.appUnlock = function(blockId){
  state.unlocked[Number(blockId)] = true;
  saveState();
  state.tab = "quiz";
  render();
}
window.appAnswerBlock = function(blockId, qIdx, optIdx){
  blockId = Number(blockId); qIdx = String(qIdx); optIdx = Number(optIdx);
  if(!state.quizResults[blockId]) state.quizResults[blockId] = {};
  state.quizResults[blockId][qIdx] = optIdx;
  saveState();
  render();
}
window.appAnswerExam = function(qIdx, optIdx){
  state.finalAnswers[Number(qIdx)] = Number(optIdx);
  saveState();
  render();
}
window.appApplyExamCount = function(){
  const n = Number(document.getElementById("examCount")?.value || 20);
  state.examCount = Math.max(10, Math.min(50, n));
  state.finalAnswers = {};
  state.finalSubmitted = false;
  saveState();
  render();
}
window.appSubmitExam = function(){
  state.finalSubmitted = true;
  saveState();
  render();
}
window.appResetExam = function(){
  state.finalAnswers = {};
  state.finalSubmitted = false;
  saveState();
  render();
}
window.appToggleModel = function(){
  const model = document.getElementById("analysisModel");
  if(model) model.style.display = model.style.display === "block" ? "none" : "block";
}
window.appCheckAnalysis = function(blockId){
  const b = getBlock(Number(blockId));
  const value = (document.getElementById("analysisInput")?.value || "").toLowerCase();
  const ok = b.analysis_keywords.some(k => value.includes(k.toLowerCase()));
  const result = document.getElementById("analysisResult");
  if(result){
    result.className = "result " + (ok ? "ok":"bad");
    result.innerHTML = ok ? "✔ RESPUESTA BIEN ENCAMINADA." : "✖ RESPUESTA MEJORABLE. Revisa el modelo.";
  }
}
window.appReviewAnswer = function(idx, opt){
  idx = Number(idx); opt = Number(opt);
  const q = state.smartReviewQueue[idx];
  if(q && opt === q.answer){
    state.smartReviewQueue.splice(idx,1);
    saveState();
    render();
  }
}
window.appSearch = function(value){
  state.search = value;
  render();
}

function renderHero(){
  return `<section class="hero">
    <div class="hero-badges">
      <span class="badge">VERSIÓN 6</span>
      <span class="badge">BOTONES DIRECTOS</span>
      <span class="badge">EXAMEN ARREGLADO</span>
      <span class="badge">REPASO INTELIGENTE</span>
    </div>
    <div class="hero-title">
      <div class="hero-icon">📜</div>
      <div>
        <h1>${APP_DATA.title}</h1>
        <p>${APP_DATA.subtitle}</p>
      </div>
    </div>
    <div class="hero-actions">
      <button class="btn btn-primary" onclick="appSetView('scheme')">ESQUEMA GENERAL</button>
      <button class="btn btn-secondary" onclick="appSetView('block', 1)">IR AL BLOQUE 1</button>
      <button class="btn btn-secondary" onclick="appSetView('exam')">MODO EXAMEN</button>
      <button class="btn btn-gold" onclick="appSetView('review')">REPASO INTELIGENTE</button>
    </div>
  </section>`;
}
function renderSidebar(){
  const sections=["POESÍA","PROSA","TEATRO","TÉCNICA LITERARIA"];
  const filtered = APP_DATA.blocks.filter(b => (`${b.title} ${b.author} ${b.work} ${b.section}`).toLowerCase().includes(state.search.toLowerCase()));
  return `<aside class="sidebar">
    <h3>🏰 MENÚ</h3>
    <div class="logic"><strong>RUTA:</strong><br>ESQUEMA → CUADERNO → ANÁLISIS → QUIZ → ERRORES → EXAMEN → REPASO</div>
    <input class="search" id="searchBlocks" placeholder="Buscar bloque, autor u obra" value="${(state.search||"").replace(/"/g,'&quot;')}" oninput="appSearch(this.value)">
    <button class="menu-btn ${state.view==="home"?"active":""}" onclick="appSetView('home')">🏠 INICIO</button>
    <button class="menu-btn ${state.view==="scheme"?"active":""}" onclick="appSetView('scheme')">🗺️ ESQUEMA GENERAL</button>
    <button class="menu-btn ${state.view==="stats"?"active":""}" onclick="appSetView('stats')">📊 ESTADÍSTICAS</button>
    <button class="menu-btn ${state.view==="exam"?"active":""}" onclick="appSetView('exam')">📝 MODO EXAMEN</button>
    <button class="menu-btn ${state.view==="review"?"active":""}" onclick="appSetView('review')">🔁 REPASO INTELIGENTE</button>
    <button class="menu-btn ${state.view==="errors"?"active":""}" onclick="appSetView('errors')">❌ REPASO DE ERRORES</button>
    ${sections.map(section => `
      <div class="section-title">${iconFor(section)} ${section}</div>
      <div class="menu-list">
        ${filtered.filter(b => b.section===section).map(b => `
          <button class="menu-btn ${state.view==="block" && state.blockId===b.id ? "active":""}" onclick="appSetView('block', ${b.id})">
            <strong>BLOQUE ${b.id}</strong><br>${b.title}
            <small>${b.author || b.work || b.section}</small>
          </button>
        `).join("")}
      </div>
    `).join("")}
  </aside>`;
}
function renderStats(){
  const answered = APP_DATA.blocks.reduce((acc,b)=>acc+Object.keys(getQuizResults(b.id)).length,0);
  return `<section class="panel"><h2>📊 ESTADÍSTICAS DE APRENDIZAJE</h2><div class="stats-grid">
    <div class="card"><div class="footer-note">ACIERTOS TOTALES</div><div class="big-stat">${totalCorrect()}</div></div>
    <div class="card"><div class="footer-note">RESPONDIDAS</div><div class="big-stat">${answered}/${totalQuestions()}</div></div>
    <div class="card"><div class="footer-note">PRECISIÓN</div><div class="big-stat">${accuracy()}%</div></div>
    <div class="card"><div class="footer-note">BLOQUES COMPLETOS</div><div class="big-stat">${completedBlocks()}/${APP_DATA.blocks.length}</div></div>
  </div></section>`;
}
function renderHome(){
  return `<section class="panel"><h2>✨ PORTADA DE ESTUDIO</h2><div class="overview-grid">
    <div class="card"><h3>📜 ESQUEMA GENERAL</h3><p>Mira el mapa completo del tema antes de empezar.</p></div>
    <div class="card"><h3>🖍️ CUADERNO DEL MEDIEVO</h3><p>Para desbloquear el quiz hay que escribir en papel.</p></div>
    <div class="card"><h3>📝 MODO EXAMEN</h3><p>Ahora marca la opción elegida y corrige con feedback claro.</p></div>
    <div class="card"><h3>🔁 REPASO INTELIGENTE</h3><p>Repite automáticamente las preguntas falladas.</p></div>
  </div></section>${renderStats()}`;
}
function renderScheme(){
  return `<section class="panel"><h2>🗺️ ESQUEMA GENERAL DEL TEMA</h2><div class="scheme-grid">
    ${Object.entries(APP_DATA.theme_scheme).map(([section, items]) => `<div class="card"><h3>${iconFor(section)} ${section}</h3><ul>${items.map(i => `<li>${i}</li>`).join("")}</ul></div>`).join("")}
  </div></section>`;
}
function renderBlock(){
  const b = getBlock(state.blockId), correct = getCorrectCount(b.id), total = b.quiz.length, unlocked = !!state.unlocked[b.id];
  return `<section class="panel"><div class="block-header"><div>
    <div class="footer-note">${iconFor(b.section)} ${b.section}</div>
    <h2>BLOQUE ${b.id} — ${b.title}</h2>
    ${b.author ? `<div class="footer-note">AUTOR: <strong>${b.author}</strong></div>` : ""}
    ${b.work ? `<div class="footer-note">OBRA: <strong>${b.work}</strong></div>` : ""}
    <p>${b.explanation}</p>
  </div><div class="progress-card"><div class="footer-note">PROGRESO DEL BLOQUE</div><div style="font-size:2rem;font-weight:800">${correct}/${total}</div><div class="progress-bar"><div style="width:${(correct/total)*100}%"></div></div></div></div>
  <div class="tabs">
    <button class="tab-btn ${state.tab==="esquema"?"active":""}" onclick="appSetTab('esquema')">📌 ESQUEMA</button>
    <button class="tab-btn ${state.tab==="cuaderno"?"active":""}" onclick="appSetTab('cuaderno')">🖍️ CUADERNO</button>
    <button class="tab-btn ${state.tab==="analisis"?"active":""}" onclick="appSetTab('analisis')">🔍 ANALIZA EL TEXTO</button>
    <button class="tab-btn ${state.tab==="quiz"?"active":""}" onclick="appSetTab('quiz')">✅ QUIZ</button>
    <button class="tab-btn ${state.tab==="errores"?"active":""}" onclick="appSetTab('errores')">❌ ERRORES</button>
  </div>${renderBlockTab(b, unlocked)}</section>`;
}
function renderBlockTab(b, unlocked){
  if(state.tab==="esquema") return `<div class="tab-content"><div class="tab-label">ESTÁS EN: ESQUEMA</div><ul>${b.scheme.map(item => `<li>${item}</li>`).join("")}</ul><div class="card" style="margin-top:12px"><strong>📜 TEXTO O EJEMPLO:</strong><p>${b.fragment}</p></div></div>`;
  if(state.tab==="cuaderno") return `<div class="tab-content"><div class="tab-label">ESTÁS EN: CUADERNO</div><div class="notice">SIN CUADERNO NO HAY QUIZ. Primero copia, subraya y resume.</div><div class="notebook-list">${b.notebook.map(item => `<div class="notebook-item">✏️ ${item}</div>`).join("")}</div><div class="hint"><strong>CÓMO RESPONDER:</strong> ${b.writing_prompt}</div><div class="actions"><button class="btn btn-primary" onclick="appUnlock(${b.id})">${unlocked ? "✔ CUADERNO REGISTRADO" : "YA LO HE HECHO"}</button></div></div>`;
  if(state.tab==="analisis") return `<div class="tab-content"><div class="tab-label">ESTÁS EN: ANALIZA EL TEXTO</div><div class="card"><strong>📜 TEXTO:</strong><p>${b.fragment}</p></div><p><strong>PREGUNTA:</strong> ${b.analysis_question}</p><div class="hint">${b.writing_prompt}</div><textarea id="analysisInput" placeholder="Escribe tu respuesta aquí..."></textarea><div class="actions"><button class="btn btn-primary" onclick="appCheckAnalysis(${b.id})">COMPROBAR</button><button class="btn btn-secondary" onclick="appToggleModel()">VER MODELO</button></div><div id="analysisResult"></div><div class="model" id="analysisModel"><strong>MODELO:</strong> ${b.analysis_model}</div><div class="feedback"><strong>MODELO PARA ESCRIBIR:</strong> ${b.writing_model}</div></div>`;
  if(state.tab==="quiz"){
    if(!unlocked) return `<div class="tab-content"><div class="tab-label">ESTÁS EN: QUIZ</div><div class="notice">Primero completa el paso CUADERNO.</div></div>`;
    const results = getQuizResults(b.id);
    return `<div class="tab-content"><div class="tab-label">ESTÁS EN: QUIZ</div><div class="quiz-list">
      ${b.quiz.map((q, idx) => {
        const chosen = results[idx];
        return `<div class="quiz-card"><h4>${idx+1}. ${q.q}</h4><div class="options">
          ${q.options.map((opt, optIdx) => {
            let cls = "option-btn";
            if(chosen !== undefined && Number(chosen) === optIdx) cls += " selected";
            if(chosen !== undefined){
              if(optIdx === q.answer) cls += " good";
              else if(Number(chosen) === optIdx && Number(chosen) !== q.answer) cls += " bad";
            }
            return `<button class="${cls}" onclick="appAnswerBlock(${b.id}, ${idx}, ${optIdx})"><strong>${String.fromCharCode(65+optIdx)}.</strong> ${opt}</button>`;
          }).join("")}
        </div>${chosen !== undefined ? `<div class="feedback"><strong>${Number(chosen)===q.answer ? "✔ Correcta" : "✖ Incorrecta"}</strong><br>${q.explanation}</div>` : ""}</div>`;
      }).join("")}
    </div></div>`;
  }
  if(state.tab==="errores"){
    const mistakes = getMistakes(b.id);
    return `<div class="tab-content"><div class="tab-label">ESTÁS EN: ERRORES</div>${mistakes.length ? mistakes.map(item => `<div class="mistake-card"><strong>Pregunta ${item.idx+1}</strong><p>${item.q.q}</p><p><strong>Correcta:</strong> ${String.fromCharCode(65+item.q.answer)}. ${item.q.options[item.q.answer]}</p><p>${item.q.explanation}</p></div>`).join("") : `<div class="card">Todavía no hay errores en este bloque.</div>`}</div>`;
  }
  return "";
}
function renderErrors(){
  const all = getAllMistakes();
  return `<section class="panel"><h2>❌ REPASO DE ERRORES</h2>${all.length ? all.map(item => `<div class="mistake-card" style="margin-bottom:12px"><div class="footer-note">BLOQUE ${item.blockId} — ${item.blockTitle}</div><p><strong>${item.q.q}</strong></p><p>Respuesta correcta: ${String.fromCharCode(65+item.q.answer)}. ${item.q.options[item.q.answer]}</p><p>${item.q.explanation}</p></div>`).join("") : `<div class="card">No hay errores guardados todavía.</div>`}</section>`;
}
function renderReview(){
  const queue = state.smartReviewQueue;
  return `<section class="panel"><h2>🔁 REPASO INTELIGENTE</h2><p>Las preguntas falladas aparecen aquí hasta que las aciertes.</p>${queue.length ? `<div class="review-list">${queue.slice(0, 12).map((q, idx) => `<div class="quiz-card"><div class="footer-note">BLOQUE ${q.blockId} — ${q.blockTitle}</div><h4>${idx+1}. ${q.q}</h4><div class="options">${q.options.map((opt, optIdx) => `<button class="option-btn" onclick="appReviewAnswer(${idx}, ${optIdx})"><strong>${String.fromCharCode(65+optIdx)}.</strong> ${opt}</button>`).join("")}</div></div>`).join("")}</div>` : `<div class="card">No hay preguntas pendientes de repaso. ¡Magnífico!</div>`}</section>`;
}
function renderExam(){
  const questions = examQuestions();
  const score = state.finalSubmitted ? questions.reduce((acc,q,idx)=>acc + (Number(state.finalAnswers[idx])===q.answer ? 1 : 0),0) : 0;
  return `<section class="panel"><h2>📝 MODO EXAMEN</h2><div class="exam-setup"><div class="card"><div class="footer-note">PREGUNTAS</div><input type="number" id="examCount" min="10" max="50" value="${state.examCount}"></div><div class="card"><div class="footer-note">EXAMEN REAL</div><p>Configura cuántas preguntas quieres.</p></div><div class="card"><div class="footer-note">NOTA</div><div class="big-stat">${state.finalSubmitted ? score + "/" + questions.length : "--"}</div></div></div><div class="actions"><button class="btn btn-gold" onclick="appApplyExamCount()">APLICAR</button><button class="btn btn-primary" onclick="appSubmitExam()">CORREGIR EXAMEN</button><button class="btn btn-secondary" onclick="appResetExam()">REINICIAR</button></div><div class="quiz-list" style="margin-top:16px">${questions.map((q, idx) => {
    const chosen = state.finalAnswers[idx];
    return `<div class="quiz-card"><div class="footer-note">BLOQUE ${q.blockId} — ${q.blockTitle}</div><h4>${idx+1}. ${q.q}</h4><div class="options">${q.options.map((opt, optIdx) => {
      let cls = "option-btn";
      if(chosen !== undefined && Number(chosen) === optIdx) cls += " selected";
      if(state.finalSubmitted){
        if(optIdx === q.answer) cls += " good";
        else if(Number(chosen) === optIdx && Number(chosen) !== q.answer) cls += " bad";
      }
      return `<button class="${cls}" onclick="appAnswerExam(${idx}, ${optIdx})" ${state.finalSubmitted ? "disabled" : ""}><strong>${String.fromCharCode(65+optIdx)}.</strong> ${opt}</button>`;
    }).join("")}</div>${state.finalSubmitted ? `<div class="feedback"><strong>${Number(chosen)===q.answer ? "✔ Correcta" : "✖ Incorrecta"}</strong><br>${q.explanation}</div>` : ""}</div>`;
  }).join("")}</div></section>`;
}

function renderMain(){
  if(state.view==="home") return renderHome();
  if(state.view==="scheme") return renderScheme();
  if(state.view==="block") return renderBlock();
  if(state.view==="errors") return renderErrors();
  if(state.view==="review") return renderReview();
  if(state.view==="exam") return renderExam();
  if(state.view==="stats") return renderStats();
  return renderHome();
}

render();
