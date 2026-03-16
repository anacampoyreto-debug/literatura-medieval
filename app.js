
let examQuestions = [];

function shuffle(array){
  return [...array].sort(() => 0.5 - Math.random());
}

function renderExam(){
  const examDiv = document.getElementById("exam");
  examDiv.innerHTML = "";

  examQuestions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question";

    const title = document.createElement("div");
    title.innerHTML = `<strong>${i + 1}. ${q.q}</strong>`;
    div.appendChild(title);

    q.options.forEach((opt, j) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.textContent = `${String.fromCharCode(65 + j)}. ${opt}`;

      btn.addEventListener("click", () => {
        if (div.dataset.graded === "true") return;
        div.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
        btn.classList.add("selected");
        div.dataset.selected = String(j);
      });

      div.appendChild(btn);
    });

    examDiv.appendChild(div);
  });
}

function startExam(){
  const n = parseInt(document.getElementById("numQuestions").value, 10) || 10;
  examQuestions = shuffle(APP_DATA.questions).slice(0, Math.min(n, APP_DATA.questions.length));
  document.getElementById("score").textContent = "";
  renderExam();
}

function gradeExam(){
  const questionDivs = document.querySelectorAll(".question");
  let correct = 0;

  questionDivs.forEach((div, i) => {
    div.dataset.graded = "true";
    const selectedIndex = div.dataset.selected !== undefined ? parseInt(div.dataset.selected, 10) : -1;
    const correctIndex = examQuestions[i].answer;
    const options = div.querySelectorAll(".option");

    options.forEach((opt, idx) => {
      opt.disabled = true;
      if (idx === correctIndex) opt.classList.add("correct");
      if (idx === selectedIndex && idx !== correctIndex) opt.classList.add("wrong");
    });

    const oldFeedback = div.querySelector(".feedback");
    if (oldFeedback) oldFeedback.remove();

    const feedback = document.createElement("div");
    feedback.className = "feedback";

    if (selectedIndex === correctIndex) {
      correct++;
      feedback.innerHTML = `✔ Correcta. ${examQuestions[i].explanation}`;
    } else if (selectedIndex === -1) {
      feedback.innerHTML = `✖ Sin responder. Respuesta correcta: ${String.fromCharCode(65 + correctIndex)}. ${examQuestions[i].options[correctIndex]}. ${examQuestions[i].explanation}`;
    } else {
      feedback.innerHTML = `✖ Incorrecta. Respuesta correcta: ${String.fromCharCode(65 + correctIndex)}. ${examQuestions[i].options[correctIndex]}. ${examQuestions[i].explanation}`;
    }

    div.appendChild(feedback);
  });

  document.getElementById("score").textContent = `Nota: ${correct} / ${questionDivs.length}`;
}

function resetExam(){
  document.getElementById("exam").innerHTML = "";
  document.getElementById("score").textContent = "";
}

document.getElementById("applyBtn").addEventListener("click", startExam);
document.getElementById("gradeBtn").addEventListener("click", gradeExam);
document.getElementById("resetBtn").addEventListener("click", resetExam);

document.addEventListener("DOMContentLoaded", startExam);
startExam();
