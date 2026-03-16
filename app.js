
let examQuestions=[]

function startExam(){
const num=parseInt(document.getElementById("numQuestions").value)
const all=[...APP_DATA.questions]
examQuestions=all.sort(()=>0.5-Math.random()).slice(0,num)

const examDiv=document.getElementById("exam")
examDiv.innerHTML=""

examQuestions.forEach((q,i)=>{
let div=document.createElement("div")
div.className="question"
div.innerHTML="<b>"+(i+1)+". "+q.q+"</b>"

q.options.forEach((opt,j)=>{
let btn=document.createElement("div")
btn.className="option"
btn.innerText=opt

btn.onclick=()=>{
div.querySelectorAll(".option").forEach(o=>o.classList.remove("selected"))
btn.classList.add("selected")
btn.dataset.selected=j
}

div.appendChild(btn)
})

examDiv.appendChild(div)
})
}

function gradeExam(){
let correct=0
const questions=document.querySelectorAll(".question")

questions.forEach((div,i)=>{
const selected=div.querySelector(".selected")
if(!selected) return

const index=parseInt(selected.dataset.selected)
const correctIndex=examQuestions[i].answer

if(index===correctIndex){
selected.classList.add("correct")
correct++
}else{
selected.classList.add("wrong")
div.querySelectorAll(".option")[correctIndex].classList.add("correct")
}
})

document.getElementById("score").innerHTML="Nota: "+correct+" / "+questions.length
}

function resetExam(){
document.getElementById("exam").innerHTML=""
document.getElementById("score").innerHTML=""
}
