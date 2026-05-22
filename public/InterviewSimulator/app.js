// app.js

const questions = [
  "Tell me about yourself.",
  "Why should we hire you?",
  "What are your strengths and weaknesses?",
  "Explain a challenging project you worked on.",
  "Where do you see yourself in 5 years?"
];

let currentQuestion = 0;
let stress = 0;
let timeLeft = 60;
const totalTime = 60;
let timer;
let performanceData = [];

// DOM Elements
const questionText = document.getElementById("question");
const questionCount = document.getElementById("question-count");
const stressLevel = document.getElementById("stress-level");
const timerText = document.getElementById("timer");
const answerBox = document.getElementById("answer");

const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");

// New DOM elements for results
const resultsContainer = document.getElementById("results-container");
const interviewBox = document.getElementById("interview-box");
const mainTopBar = document.getElementById("main-top-bar");

const resultsAttempted = document.getElementById("results-attempted");
const resultsAccuracy = document.getElementById("results-accuracy");
const resultsCorrect = document.getElementById("results-correct");
const resultsIncorrect = document.getElementById("results-incorrect");
const resultsAvgTime = document.getElementById("results-avg-time");

const questionsBreakdown = document.getElementById("questions-breakdown");
const feedbackSummary = document.getElementById("feedback-summary");
const suggestionsList = document.getElementById("suggestions-list");
const resultsRestartBtn = document.getElementById("results-restart-btn");

// Progress bars
const questionProgress = document.getElementById("question-progress");
const stressProgress = document.getElementById("stress-progress");
const timerProgress = document.getElementById("timer-progress");

function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Voice Control Elements
const micBtn = document.getElementById("mic-btn");
const micStatus = document.getElementById("mic-status");
const recordingIndicator = document.getElementById("recording-indicator");

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecording = false;
let finalTranscriptState = '';

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add("recording");
    micStatus.innerText = "Listening...";
    recordingIndicator.classList.remove("hidden");
    answerBox.focus();
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let currentFinal = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        currentFinal += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    finalTranscriptState += currentFinal;
    answerBox.value = finalTranscriptState + interimTranscript;
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
    stopRecording();
    if(event.error === 'not-allowed') {
      micStatus.innerText = "Microphone access denied";
    } else if (event.error === 'network') {
      micStatus.innerText = "Network/Security error";
      alert("Speech Recognition failed with a 'network' error. This usually happens if you are accessing the site via an IP address (like 192.168.x.x) over HTTP instead of localhost or HTTPS. The Web Speech API requires a secure context (HTTPS or localhost) to function.");
    } else {
      micStatus.innerText = `Error: ${event.error}`;
    }
  };

  recognition.onend = () => {
    stopRecording();
  };
}

function stopRecording() {
  if (isRecording && recognition) {
    recognition.stop();
  }
  isRecording = false;
  micBtn.classList.remove("recording");
  micStatus.innerText = "Click mic to speak";
  recordingIndicator.classList.add("hidden");
}

micBtn.addEventListener("click", () => {
  if (!SpeechRecognition) {
    alert("Speech Recognition API is not supported in this browser. Please use Chrome or Edge.");
    return;
  }

  if (isRecording) {
    stopRecording();
  } else {
    // Save current text area content so we append to it
    finalTranscriptState = answerBox.value;
    if (finalTranscriptState.length > 0 && !finalTranscriptState.endsWith(' ')) {
      finalTranscriptState += ' ';
    }
    try {
      recognition.start();
    } catch(e) {
      console.log("Recognition already started or error:", e);
    }
  }
});

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    timerText.innerText = `${timeLeft}s`;

    // Update progress bar
    let timePercent = (timeLeft / totalTime) * 100;
    timerProgress.style.width = `${timePercent}%`;
    
    timerProgress.className = "progress-fill";
    if (timeLeft > 15) {
      timerProgress.classList.add("success");
    } else if (timeLeft > 5) {
      timerProgress.classList.add("warning");
    } else {
      timerProgress.classList.add("danger");
    }

    if (timeLeft <= 10) {
      stress += 2;
      updateStress();
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      stopRecording();
      
      let answerLength = answerBox.value.trim().length;
      if (answerLength < 20) {
        alert("Time's up! The interviewer looks disappointed with your short answer.");
      } else {
        alert("Time's up! Moving to the next question.");
      }
      
      nextQuestion(true);
    }

  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = totalTime;
  timerText.innerText = `${timeLeft}s`;
  timerProgress.style.width = "100%";
  timerProgress.className = "progress-fill success";
  startTimer();
}

function updateStress() {
  if (stress > 100) stress = 100;
  if (stress < 0) stress = 0;

  stressLevel.innerText = `${stress}%`;
  stressProgress.style.width = `${stress}%`;

  // Change color based on stress
  stressProgress.className = "progress-fill";
  if (stress < 40) {
    stressProgress.classList.add("success");
  } else if (stress < 70) {
    stressProgress.classList.add("warning");
  } else {
    stressProgress.classList.add("danger");
  }

  // Visual background feedback
  if (stress >= 70) {
    document.body.style.background = "linear-gradient(135deg, #450a0a, #0f172a)";
  } else {
    document.body.style.background = "var(--bg-color)";
  }
}

function loadQuestion() {
  questionText.innerText = questions[currentQuestion];
  questionCount.innerText = `${currentQuestion + 1}/${questions.length}`;
  
  let qPercent = ((currentQuestion + 1) / questions.length) * 100;
  questionProgress.style.width = `${qPercent}%`;

  answerBox.value = "";
  finalTranscriptState = "";
  stopRecording();
  resetTimer();
}

function nextQuestion(isTimeout = false) {
  const timeoutOccurred = (isTimeout === true);
  const answerText = answerBox.value.trim();
  const answerLength = answerText.length;
  let timeTaken = totalTime - timeLeft;

  // Determine status
  let status = "Correct";
  if (timeoutOccurred) {
    status = "Timed Out";
    timeTaken = totalTime;
  } else if (answerLength < 30) {
    status = "Weak";
  }

  // Record performance data
  performanceData.push({
    question: questions[currentQuestion],
    answer: timeoutOccurred ? "" : answerText,
    timeTaken: timeTaken,
    status: status,
    stressLevel: stress
  });

  // Adjust stress
  if (timeoutOccurred || answerLength < 20) {
    stress += 15;
  } else {
    stress -= 5;
  }

  if (stress < 0) {
    stress = 0;
  }
  if (stress > 100) {
    stress = 100;
  }
  updateStress();

  currentQuestion++;

  if (currentQuestion >= questions.length) {
    clearInterval(timer);
    stopRecording();
    showResults();
    return;
  }

  loadQuestion();
}

function showResults() {
  clearInterval(timer);
  
  // Set body background to default dark theme for cleaner results view
  document.body.style.background = "#0d1117";

  // Hide main view
  mainTopBar.classList.add("hidden");
  interviewBox.classList.add("hidden");

  // Show results
  resultsContainer.classList.remove("hidden");

  // Stats calculation
  const totalQuestions = questions.length;
  const correctCount = performanceData.filter(d => d.status === "Correct").length;
  const incorrectCount = performanceData.filter(d => d.status === "Weak" || d.status === "Timed Out").length;
  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  let totalSecondsTaken = 0;
  performanceData.forEach(d => totalSecondsTaken += d.timeTaken);
  const avgTime = Math.round(totalSecondsTaken / totalQuestions);

  // Update stats DOM
  resultsAttempted.innerText = `${performanceData.length}/${totalQuestions}`;
  resultsAccuracy.innerText = `${accuracy}%`;
  resultsCorrect.innerText = correctCount;
  resultsIncorrect.innerText = incorrectCount;
  resultsAvgTime.innerText = `${avgTime}s`;

  // Populate breakdown
  questionsBreakdown.innerHTML = "";
  performanceData.forEach((data, index) => {
    const item = document.createElement("div");
    item.className = "breakdown-item";

    let statusClass = "correct";
    let statusLabel = "Detailed Response";
    if (data.status === "Timed Out") {
      statusClass = "timeout";
      statusLabel = "Timed Out";
    } else if (data.status === "Weak") {
      statusClass = "weak";
      statusLabel = "Weak Response";
    }

    item.innerHTML = `
      <div class="breakdown-header">
        <h4>Question ${index + 1}</h4>
        <span class="status-badge status-${statusClass}">${statusLabel}</span>
      </div>
      <div class="question-text">${escapeHTML(data.question)}</div>
      <div class="user-answer">${data.answer ? escapeHTML(data.answer) : "<i>No answer provided.</i>"}</div>
      <div class="time-meta">
        <span>Time taken: <strong>${data.timeTaken}s</strong></span>
        <span>Stress level: <strong>${data.stressLevel}%</strong></span>
      </div>
    `;
    questionsBreakdown.appendChild(item);
  });

  // Generate feedback
  let summary = "";
  let suggestions = [];

  // Composure/Stress feedback
  if (stress >= 70) {
    summary += "Your stress level was high by the end of the interview. Managing pressure is critical for clear communication. ";
    suggestions.push("<strong>Manage Stress:</strong> Take a deep breath before you start speaking. Pause for 2-3 seconds to outline your answer mentally.");
    suggestions.push("<strong>Mock Interviews:</strong> Practice mock sessions or record yourself to build familiarity with high-pressure interview environments.");
  } else if (stress >= 30) {
    summary += "You managed your stress reasonably well, though the timer and questions put some pressure on you. ";
    suggestions.push("<strong>Pacing:</strong> Monitor the timer but do not rush. Summarize your thoughts cleanly rather than trailing off.");
  } else {
    summary += "Great job! You stayed calm and composed throughout the simulator session. ";
    suggestions.push("<strong>Confidence:</strong> Maintaining this composure in real-world interviews makes a highly professional impression.");
  }

  // Quality of responses feedback
  const weakCount = performanceData.filter(d => d.status === "Weak").length;
  const timeoutCount = performanceData.filter(d => d.status === "Timed Out").length;

  if (weakCount > 0) {
    summary += "A few of your answers were brief. Expanding your responses with concrete details is key. ";
    suggestions.push("<strong>Use STAR Method:</strong> For behavioral prompts, structure your answers as: Situation, Task, Action, and Result.");
    suggestions.push("<strong>Add Detail:</strong> Don't just list skills; share real-world stories or instances of how you successfully resolved challenges.");
  }

  if (timeoutCount > 0) {
    summary += "You ran out of time on some questions. ";
    suggestions.push("<strong>Time Budgeting:</strong> Keep your answers structured and to the point. Focus on delivering the core value in the first 20 seconds.");
  }

  if (correctCount === totalQuestions) {
    summary += "Every single answer was detailed and submitted within the time limit. Outstanding performance!";
  }

  feedbackSummary.innerText = summary;

  // Render suggestions
  suggestionsList.innerHTML = "";
  suggestions.forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = s;
    suggestionsList.appendChild(li);
  });
}

function restartInterview() {
  currentQuestion = 0;
  stress = 0;
  performanceData = [];

  updateStress();

  mainTopBar.classList.remove("hidden");
  interviewBox.classList.remove("hidden");
  resultsContainer.classList.add("hidden");

  loadQuestion();
}

nextBtn.addEventListener("click", () => nextQuestion(false));
restartBtn.addEventListener("click", restartInterview);
resultsRestartBtn.addEventListener("click", restartInterview);

// Initialize
updateStress();
loadQuestion();