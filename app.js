
const app = document.getElementById("app");
const state = {
  view:"home", blockId:1, tab:"esquema", search:"",
  unlocked: JSON.parse(localStorage.getItem("lm_unlocked") || "{}"),
  quizResults: JSON.parse(localStorage.getItem("lm_quiz_results") || "{}"),
  finalAnswers: JSON.parse(localStorage.getItem("lm_final_answers") || "{}"),
  finalSubmitted: JSON.parse(localStorage.getItem("lm_final_submitted") || "false")
};
function saveState(){
  localStorage.setItem("lm_unlocked", JSON.stringify(state.unlocked));
  localStorage.setItem("lm_quiz_results", JSON.stringify(state.quizResults));
  localStorage.setItem("lm_final_answers", JSON.stringify(state.finalAnswers));
  localStorage.setItem("lm_final_submitted", JSON.stringify(state.finalSubmitted));
}
function getBlock(id){ return APP_DATA.blocks.find(b => b.id === id); }
function getQuizResults(blockId){ return state.quizResults[blockId] || {}; }
function getCorrectCount(blockId){
  const block = getBlock(blockId), results = getQuizResults(blockId);
  let count = 0; block.quiz.forEach((q, idx) => { if(results[idx] !== undefined && Number(results[idx]) === q.answer) count++; });
  return count;
}
function getMistakes(blockId){
  const block = getBlock(blockId), results = getQuizResults(blockId);
  return block.quiz.map((q, idx) => ({q, idx, chosen: results[idx]})).filter(item => item.chosen !== undefined && Number(item.chosen) !== item.q.answer);
}
function setView(view, blockId=null){ state.view=view; if(blockId) state.blockId=blockId; render(); }

function renderHero(){
  return `<section class="hero">
    <h1>${APP_DATA.title}</h1>
    <p>${APP_DATA.subtitle}</p>
    <div class="hero-actions">
      <button class="btn btn-primary" data-go="scheme">ESQUEMA GENERAL DEL TEMA</button>
      <button class="btn btn-secondary" data-go="block" data-block="1">IR AL BLOQUE 1</button>
      <button class="btn btn-secondary" data-go="final">QUIZ FINAL</button>
    </div>
  </section>`;
}
function renderSidebar(){
  const sections = ["POESÍA","PROSA","TEATRO","TÉCNICA LITERARIA"];
  const filtered = APP_DATA.blocks.filter(b => (`${b.title} ${b.author} ${b.work} ${b.section}`).toLowerCase().includes(state.search.toLowerCase()));
  return `<aside class="sidebar">
    <h3>MENÚ</h3>
    <div class="logic">RUTA DE APRENDIZAJE:<br><strong>ESQUEMA → CUADERNO → ANÁLISIS → QUIZ → ERRORES → QUIZ FINAL</strong></div>
    <input class="search" id="searchBlocks" placeholder="Buscar bloque, autor u obra" value="${(state.search||"").replace(/"/g,'&quot;')}">
    <button class="menu-btn ${state.view==="home"?"active":""}" data-view="home">INICIO</button>
    <button class="menu-btn ${state.view==="scheme"?"active":""}" data-view="scheme">ESQUEMA GENERAL</button>
    <button class="menu-btn ${state.view==="errors"?"active":""}" data-view="errors">REPASO DE ERRORES</button>
    <button class="menu-btn ${state.view==="final"?"active":""}" data-view="final">QUIZ FINAL</button>
    ${sections.map(section => `
      <div class="section-title">${section}</div>
      <div class="menu-list">
        ${filtered.filter(b => b.section===section).map(b => `
          <button class="menu-btn ${state.view==="block" && state.blockId===b.id ? "active":""}" data-view="block" data-block="${b.id}">
            <strong>BLOQUE ${b.id}</strong><br>${b.title}
            <small>${b.author || b.work || b.section}</small>
          </button>
        `).join("")}
      </div>
    `).join("")}
  </aside>`;
}
function renderHome(){
  return `<section class="panel">
    <h2>ANTES DE EMPEZAR</h2>
    <p>Esta app está diseñada para que el alumnado estudie, escriba en papel y luego se autocorrija. El quiz de cada bloque se desbloquea cuando se completa el paso <strong>TRABAJA EN TU CUADERNO</strong>.</p>
    <div class="scheme-grid">
      <div class="scheme-card"><h3>1. LEE</h3><p>Primero mira el esquema fácil del bloque.</p></div>
      <div class="scheme-card"><h3>2. ESCRIBE</h3><p>Haz el esquema y el resumen en tu cuaderno con colores.</p></div>
      <div class="scheme-card"><h3>3. ANALIZA</h3><p>Responde al cuadro de análisis con modelo.</p></div>
      <div class="scheme-card"><h3>4. PRACTICA</h3><p>Haz el quiz, repasa errores y termina con el quiz final.</p></div>
    </div>
  </section>`;
}
function renderScheme(){
  return `<section class="panel">
    <h2>ESQUEMA GENERAL DEL TEMA</h2>
    <p class="footer-note">Primero mira este mapa del tema. Después podrás entrar por POESÍA, PROSA, TEATRO o TÉCNICA LITERARIA.</p>
    <div class="scheme-grid">
      ${Object.entries(APP_DATA.theme_scheme).map(([section, items]) => `
        <div class="scheme-card">
          <h3>${section}</h3>
          <ul class="list-clean">${items.map(i => `<li>${i}</li>`).join("")}</ul>
        </div>
      `).join("")}
    </div>
  </section>`;
}
function renderBlockScheme(b){
  return `<section class="panel">
    <h3>ESQUEMA FÁCIL</h3>
    <ul class="list-clean">${b.scheme.map(item => `<li>${item}</li>`).join("")}</ul>
    <div class="mini-card" style="margin-top:14px"><strong>TEXTO O EJEMPLO:</strong><p>${b.fragment}</p></div>
  </section>`;
}
function renderBlockNotebook(b, unlocked){
  return `<section class="panel">
    <h3>TRABAJA EN TU CUADERNO</h3>
    <div class="notice">SIN CUADERNO NO HAY QUIZ. Copia el esquema, usa colores y resume el bloque.</div>
    <div class="notebook-list">${b.notebook.map(item => `<div class="notebook-item">✏️ ${item}</div>`).join("")}</div>
    <div class="hint"><strong>CÓMO RESPONDER:</strong> ${b.writing_prompt}</div>
    <div class="unlock">
      <button class="btn btn-primary" data-unlock="${b.id}">${unlocked ? "✔ CUADERNO REGISTRADO" : "YA LO HE HECHO"}</button>
      <span class="footer-note">Cuando registres el trabajo en cuaderno, el quiz del bloque se desbloqueará.</span>
    </div>
  </section>`;
}
function renderBlockAnalysis(b){
  return `<section class="analysis-card" style="padding:18px">
    <h3>ANALIZA EL TEXTO</h3>
    <div class="mini-card"><strong>TEXTO:</strong><p>${b.fragment}</p></div>
    <p style="margin-top:14px"><strong>PREGUNTA:</strong> ${b.analysis_question}</p>
    <div class="hint">${b.writing_prompt}</div>
    <textarea class="analysis-box" id="analysisInput" placeholder="Escribe tu respuesta aquí..."></textarea>
    <div class="analysis-actions">
      <button class="btn btn-primary" data-check-analysis="${b.id}">COMPROBAR</button>
      <button class="btn btn-secondary" data-toggle-model="${b.id}">VER MODELO</button>
    </div>
    <div id="analysisResult"></div>
    <div class="model" id="analysisModel"><strong>MODELO:</strong> ${b.analysis_model}</div>
    <div class="model" style="display:block;margin-top:12px"><strong>MODELO PARA ESCRIBIR:</strong> ${b.writing_model}</div>
  </section>`;
}
function renderBlockQuiz(b, unlocked){
  if(!unlocked){ return `<section class="panel"><h3>QUIZ DEL BLOQUE</h3><div class="notice">Primero debes completar el paso <strong>TRABAJA EN TU CUADERNO</strong> y pulsar <strong>YA LO HE HECHO</strong>.</div></section>`; }
  const results = getQuizResults(b.id);
  return `<section class="panel"><h3>QUIZ DEL BLOQUE</h3><div class="quiz-list">
    ${b.quiz.map((q, idx) => {
      const chosen = results[idx];
      return `<div class="quiz-card">
        <h4>${idx+1}. ${q.q}</h4>
        <div class="options">
        ${q.options.map((opt, optIdx) => {
          let cls = "option-btn";
          if(chosen !== undefined){
            if(optIdx === q.answer) cls += " good";
            else if(Number(chosen) === optIdx) cls += " bad";
          }
          return `<button class="${cls}" data-answer-block="${b.id}" data-q="${idx}" data-opt="${optIdx}"><strong>${String.fromCharCode(65+optIdx)}.</strong> ${opt}</button>`;
        }).join("")}
        </div>
        ${chosen !== undefined ? `<div class="feedback"><strong>${Number(chosen)===q.answer ? "✔ Correcta" : "✖ Incorrecta"}</strong><br>${q.explanation}</div>` : ""}
      </div>`;
    }).join("")}
  </div></section>`;
}
function renderBlockErrors(b){
  const mistakes = getMistakes(b.id);
  if(!mistakes.length) return `<section class="panel"><h3>ERRORES DEL BLOQUE</h3><div class="mini-card">Todavía no hay errores guardados en este bloque.</div></section>`;
  return `<section class="panel"><h3>ERRORES DEL BLOQUE</h3>
    ${mistakes.map(item => `<div class="mistake-card">
      <strong>Pregunta ${item.idx+1}</strong>
      <p>${item.q.q}</p>
      <p><strong>Respuesta correcta:</strong> ${String.fromCharCode(65+item.q.answer)}. ${item.q.options[item.q.answer]}</p>
      <p><strong>Explicación:</strong> ${item.q.explanation}</p>
    </div>`).join("")}
  </section>`;
}
function renderBlock(){
  const b = getBlock(state.blockId), correct = getCorrectCount(b.id), total = b.quiz.length, unlocked = !!state.unlocked[b.id];
  return `<section class="panel">
    <div class="block-header">
      <div>
        <div class="author-label">${b.section}</div>
        <h2>BLOQUE ${b.id} — ${b.title}</h2>
        ${b.author ? `<div class="author-label">AUTOR: <strong>${b.author}</strong></div>` : ""}
        ${b.work ? `<div class="work-title">OBRA: ${b.work}</div>` : ""}
        <p>${b.explanation}</p>
      </div>
      <div class="progress">
        <div class="footer-note">PROGRESO DEL BLOQUE</div>
        <div style="font-size:2rem;font-weight:800">${correct}/${total}</div>
        <div class="progress-bar"><div style="width:${(correct/total)*100}%"></div></div>
      </div>
    </div>
    <div class="tabs">
      <button class="tab-btn ${state.tab==="esquema"?"active":""}" data-tab="esquema">ESQUEMA</button>
      <button class="tab-btn ${state.tab==="cuaderno"?"active":""}" data-tab="cuaderno">CUADERNO</button>
      <button class="tab-btn ${state.tab==="analisis"?"active":""}" data-tab="analisis">ANALIZA EL TEXTO</button>
      <button class="tab-btn ${state.tab==="quiz"?"active":""}" data-tab="quiz">QUIZ</button>
      <button class="tab-btn ${state.tab==="errores"?"active":""}" data-tab="errores">ERRORES</button>
    </div>
  </section>
  ${state.tab==="esquema" ? renderBlockScheme(b) : ""}
  ${state.tab==="cuaderno" ? renderBlockNotebook(b, unlocked) : ""}
  ${state.tab==="analisis" ? renderBlockAnalysis(b) : ""}
  ${state.tab==="quiz" ? renderBlockQuiz(b, unlocked) : ""}
  ${state.tab==="errores" ? renderBlockErrors(b) : ""}`;
}
function renderErrors(){
  const all = APP_DATA.blocks.map(b => ({block:b, mistakes:getMistakes(b.id)})).filter(x => x.mistakes.length);
  return `<section class="panel"><h2>REPASO DE ERRORES</h2>
    ${!all.length ? `<div class="mini-card">Todavía no hay errores registrados. Haz algunos quizzes para verlos aquí.</div>` : ""}
    ${all.map(group => `<div class="mini-card" style="margin-bottom:14px">
      <h3>BLOQUE ${group.block.id} — ${group.block.title}</h3>
      ${group.mistakes.map(item => `<div style="padding:10px 0;border-top:1px solid var(--line)">
        <strong>${item.idx+1}. ${item.q.q}</strong><br>
        Respuesta correcta: ${String.fromCharCode(65+item.q.answer)}. ${item.q.options[item.q.answer]}<br>
        <span class="footer-note">${item.q.explanation}</span>
      </div>`).join("")}
    </div>`).join("")}
  </section>`;
}
function getFinalQuestions(){ return APP_DATA.blocks.flatMap(b => b.quiz.map(q => ({...q, blockTitle:b.title, blockId:b.id}))).slice(0,20); }
function renderFinalQuiz(){
  const questions = getFinalQuestions();
  const score = state.finalSubmitted ? questions.reduce((acc, q, idx) => acc + (Number(state.finalAnswers[idx]) === q.answer ? 1 : 0), 0) : 0;
  return `<section class="panel"><h2>QUIZ FINAL</h2><p>Preguntas mezcladas de todo el tema. Haz primero los bloques y luego vuelve aquí.</p>
    ${questions.map((q, idx) => `<div class="quiz-card" style="margin-bottom:14px">
      <div class="footer-note">BLOQUE ${q.blockId} — ${q.blockTitle}</div>
      <h4>${idx+1}. ${q.q}</h4>
      <div class="options">
        ${q.options.map((opt, optIdx) => {
          let cls="option-btn"; const chosen = state.finalAnswers[idx];
          if(state.finalSubmitted){ if(optIdx===q.answer) cls+=" good"; else if(Number(chosen)===optIdx) cls+=" bad"; }
          return `<button class="${cls}" data-final-q="${idx}" data-final-opt="${optIdx}" ${state.finalSubmitted ? "disabled" : ""}><strong>${String.fromCharCode(65+optIdx)}.</strong> ${opt}</button>`;
        }).join("")}
      </div>
      ${state.finalSubmitted ? `<div class="feedback">${q.explanation}</div>` : ""}
    </div>`).join("")}
    <div class="quiz-actions">
      <button class="btn btn-primary" id="submitFinal">CORREGIR QUIZ FINAL</button>
      <button class="btn btn-secondary" id="resetFinal">REINICIAR QUIZ FINAL</button>
      ${state.finalSubmitted ? `<div class="notice">PUNTUACIÓN FINAL: <strong>${score}/${questions.length}</strong></div>` : ""}
    </div>
  </section>`;
}
function renderMain(){ if(state.view==="home") return renderHome(); if(state.view==="scheme") return renderScheme(); if(state.view==="block") return renderBlock(); if(state.view==="errors") return renderErrors(); if(state.view==="final") return renderFinalQuiz(); return renderHome(); }
function render(){
  app.innerHTML = `<div class="app-shell">${renderHero()}<div class="main-grid">${renderSidebar()}<div class="content">${renderMain()}</div></div></div>`;
  bindEvents();
}
function bindEvents(){
  document.querySelectorAll("[data-go]").forEach(btn => btn.onclick = () => {
    const go = btn.dataset.go;
    if(go==="scheme") setView("scheme");
    if(go==="final") setView("final");
    if(go==="block") setView("block", Number(btn.dataset.block));
  });
  document.querySelectorAll("[data-view]").forEach(btn => btn.onclick = () => {
    const view = btn.dataset.view;
    if(view==="block") setView("block", Number(btn.dataset.block)); else setView(view);
  });
  const search = document.getElementById("searchBlocks");
  if(search) search.oninput = e => { state.search = e.target.value; render(); };
  document.querySelectorAll("[data-tab]").forEach(btn => btn.onclick = () => { state.tab = btn.dataset.tab; render(); });
  document.querySelectorAll("[data-unlock]").forEach(btn => btn.onclick = () => { state.unlocked[Number(btn.dataset.unlock)] = true; saveState(); state.tab="quiz"; render(); });
  const toggleModel = document.querySelector("[data-toggle-model]");
  if(toggleModel) toggleModel.onclick = () => {
    const model = document.getElementById("analysisModel");
    model.style.display = model.style.display === "block" ? "none" : "block";
  };
  const checkAnalysis = document.querySelector("[data-check-analysis]");
  if(checkAnalysis) checkAnalysis.onclick = () => {
    const b = getBlock(Number(checkAnalysis.dataset.checkAnalysis));
    const value = (document.getElementById("analysisInput").value || "").toLowerCase();
    const ok = b.analysis_keywords.some(k => value.includes(k.toLowerCase()));
    const result = document.getElementById("analysisResult");
    result.className = "result " + (ok ? "ok" : "bad");
    result.innerHTML = ok ? "✔ RESPUESTA BIEN ENCAMINADA. Has incluido una idea clave del análisis." : "✖ RESPUESTA MEJORABLE. Revisa el modelo y usa palabras clave del bloque.";
  };
  document.querySelectorAll("[data-answer-block]").forEach(btn => btn.onclick = () => {
    const blockId = Number(btn.dataset.answerBlock), q = btn.dataset.q, opt = Number(btn.dataset.opt);
    if(!state.quizResults[blockId]) state.quizResults[blockId] = {};
    state.quizResults[blockId][q] = opt;
    saveState(); render();
  });
  document.querySelectorAll("[data-final-q]").forEach(btn => btn.onclick = () => {
    state.finalAnswers[Number(btn.dataset.finalQ)] = Number(btn.dataset.finalOpt);
    saveState(); render();
  });
  const submitFinal = document.getElementById("submitFinal");
  if(submitFinal) submitFinal.onclick = () => { state.finalSubmitted = true; saveState(); render(); };
  const resetFinal = document.getElementById("resetFinal");
  if(resetFinal) resetFinal.onclick = () => { state.finalAnswers = {}; state.finalSubmitted = false; saveState(); render(); };
}
render();
