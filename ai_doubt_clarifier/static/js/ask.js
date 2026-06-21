/* =========================================================
   ask.js — chat interface, API integration, quiz modal
   ========================================================= */

// ── DOM refs ─────────────────────────────────────────────
const questionInput    = document.getElementById('questionInput');
const sendBtn          = document.getElementById('sendBtn');
const chatThread       = document.getElementById('chatThread');
const chatEmpty        = document.getElementById('chatEmpty');
const typingIndicator  = document.getElementById('typingIndicator');
const charCount        = document.getElementById('charCount');
const sidebarCount     = document.getElementById('sidebarCount');
const topicList        = document.getElementById('topicList');
const subjectSection   = document.getElementById('subjectSection');
const subjectTags      = document.getElementById('subjectTags');
const clearChatBtn     = document.getElementById('clearChat');
const quizOverlay      = document.getElementById('quizOverlay');
const quizBody         = document.getElementById('quizBody');
const quizClose        = document.getElementById('quizClose');
const quizClose2       = document.getElementById('quizClose2');
const submitQuiz       = document.getElementById('submitQuiz');

// ── State ─────────────────────────────────────────────────
let doubtsCount  = 0;
let subjectMap   = {};
let lastAnswer   = null;   // { topic, summary } for quiz generation
let quizData     = [];     // current quiz questions

// ── Pre-fill from URL query param ─────────────────────────
const urlQ = new URLSearchParams(window.location.search).get('q');
if (urlQ && questionInput) {
  questionInput.value = urlQ;
  autoResizeTextarea();
  updateSendBtn();
}

// ── Textarea auto-resize & character counter ─────────────
function autoResizeTextarea() {
  questionInput.style.height = 'auto';
  questionInput.style.height = Math.min(questionInput.scrollHeight, 180) + 'px';
}

function updateSendBtn() {
  const val = questionInput.value.trim();
  sendBtn.disabled = val.length === 0;
  if (charCount) charCount.textContent = `${questionInput.value.length} / 1000`;
}

questionInput.addEventListener('input', () => {
  autoResizeTextarea();
  updateSendBtn();
});

questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendQuestion();
  }
});

// ── Suggestion chips ──────────────────────────────────────
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    questionInput.value = chip.dataset.q;
    autoResizeTextarea();
    updateSendBtn();
    questionInput.focus();
  });
});

// ── Send button ───────────────────────────────────────────
sendBtn.addEventListener('click', sendQuestion);

async function sendQuestion() {
  const question = questionInput.value.trim();
  if (!question) return;

  // Hide empty state, show thread
  chatEmpty.style.display = 'none';

  // Append user bubble
  appendUserMessage(question);
  questionInput.value = '';
  autoResizeTextarea();
  updateSendBtn();

  // Show typing indicator
  showTyping(true);

  try {
    const res  = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const json = await res.json();

    showTyping(false);

    if (json.success) {
      appendAIMessage(question, json.data);
      updateSidebar(json.data.subject, question);
    } else {
      appendErrorMessage(json.error || 'Something went wrong. Try again.');
    }
  } catch (err) {
    showTyping(false);
    appendErrorMessage('Network error — please check your connection.');
  }
}

// ── DOM helpers ───────────────────────────────────────────
function appendUserMessage(text) {
  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap user-wrap';
  wrap.innerHTML = `
    <div class="msg-avatar user-avatar">U</div>
    <div class="msg-bubble user-bubble">${escHtml(text)}</div>
  `;
  chatThread.appendChild(wrap);
  scrollToBottom();
}

function appendAIMessage(question, data) {
  const { subject, explanation, confidence_score, summary } = data;
  const score = parseInt(confidence_score, 10) || 88;
  const topic = question.slice(0, 80);

  // Store for quiz generation
  lastAnswer = { topic, summary };

  const kpHtml = (explanation.key_points || [])
    .map(kp => `<li>${escHtml(kp)}</li>`)
    .join('');

  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap ai-wrap';
  wrap.innerHTML = `
    <div class="msg-avatar ai-avatar">⬡</div>
    <div class="msg-bubble ai-bubble">
      <span class="answer-subject">${escHtml(subject || 'General')}</span>

      <div class="answer-section">
        <div class="answer-section-label">Definition</div>
        <div class="answer-section-content">${escHtml(explanation.definition || '')}</div>
      </div>

      <div class="answer-section">
        <div class="answer-section-label">Simple Explanation</div>
        <div class="answer-section-content">${escHtml(explanation.simple_explanation || '')}</div>
      </div>

      <div class="answer-section">
        <div class="answer-section-label">Real-Life Example</div>
        <div class="answer-section-content">${escHtml(explanation.real_life_example || '')}</div>
      </div>

      <div class="answer-section">
        <div class="answer-section-label">Key Points</div>
        <ul class="key-points">${kpHtml}</ul>
      </div>

      <div class="answer-summary">${escHtml(summary || '')}</div>

      <div class="confidence-row">
        <span class="confidence-label">Confidence</span>
        <div class="confidence-track">
          <div class="confidence-fill" data-target="${score}%"></div>
        </div>
        <span class="confidence-num">${score}%</span>
      </div>

      <button class="quiz-trigger" data-topic="${escHtml(topic)}" data-summary="${escHtml(summary || '')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        Generate Quick Quiz
      </button>
    </div>
  `;

  chatThread.appendChild(wrap);

  // Animate confidence bar
  const fill = wrap.querySelector('.confidence-fill');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { fill.style.width = fill.dataset.target; });
  });

  // Quiz trigger
  wrap.querySelector('.quiz-trigger').addEventListener('click', (e) => {
    openQuiz(e.currentTarget.dataset.topic, e.currentTarget.dataset.summary);
  });

  scrollToBottom();
}

function appendErrorMessage(text) {
  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap ai-wrap';
  wrap.innerHTML = `
    <div class="msg-avatar ai-avatar">⬡</div>
    <div class="msg-bubble ai-bubble" style="border-color:rgba(244,114,182,0.3);color:var(--accent-3)">
      ⚠ ${escHtml(text)}
    </div>
  `;
  chatThread.appendChild(wrap);
  scrollToBottom();
}

function showTyping(show) {
  typingIndicator.style.display = show ? 'flex' : 'none';
  if (show) scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatThread.scrollTop = chatThread.scrollHeight;
  });
}

// ── Sidebar updates ───────────────────────────────────────
function updateSidebar(subject, question) {
  doubtsCount++;
  if (sidebarCount) sidebarCount.textContent = doubtsCount;

  // Topics list
  if (topicList) {
    const emptyLi = topicList.querySelector('.topic-empty');
    if (emptyLi) emptyLi.remove();
    const li = document.createElement('li');
    li.textContent = question.length > 48 ? question.slice(0, 48) + '…' : question;
    topicList.prepend(li);
  }

  // Subject tags
  if (subject && subjectSection) {
    subjectMap[subject] = (subjectMap[subject] || 0) + 1;
    subjectSection.style.display = 'block';
    if (subjectTags) {
      subjectTags.innerHTML = '';
      Object.keys(subjectMap).forEach(s => {
        const tag = document.createElement('div');
        tag.className = 'subject-tag';
        tag.textContent = s;
        subjectTags.appendChild(tag);
      });
    }
  }
}

// ── Clear chat ────────────────────────────────────────────
if (clearChatBtn) {
  clearChatBtn.addEventListener('click', () => {
    chatThread.innerHTML = '';
    doubtsCount = 0;
    subjectMap  = {};
    lastAnswer  = null;
    if (sidebarCount) sidebarCount.textContent = 0;
    if (topicList) topicList.innerHTML = '<li class="topic-empty">Your questions appear here</li>';
    if (subjectTags) subjectTags.innerHTML = '';
    if (subjectSection) subjectSection.style.display = 'none';
    chatEmpty.style.display = 'flex';
  });
}

// ── Quiz Modal ────────────────────────────────────────────
async function openQuiz(topic, summary) {
  quizBody.innerHTML = `
    <div style="text-align:center;padding:20px;color:var(--text-muted)">
      <div class="typing-dots" style="justify-content:center;margin-bottom:10px">
        <span></span><span></span><span></span>
      </div>
      Generating quiz…
    </div>`;
  quizOverlay.style.display = 'flex';

  try {
    const res  = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, summary }),
    });
    const json = await res.json();

    if (json.success) {
      quizData = json.questions;
      renderQuiz(quizData);
    } else {
      quizBody.innerHTML = `<p style="color:var(--accent-3)">${escHtml(json.error)}</p>`;
    }
  } catch {
    quizBody.innerHTML = `<p style="color:var(--accent-3)">Network error. Please try again.</p>`;
  }
}

function renderQuiz(questions) {
  quizBody.innerHTML = '';
  questions.forEach((q, qi) => {
    const qEl = document.createElement('div');
    qEl.className = 'quiz-q';
    qEl.innerHTML = `
      <div class="quiz-q-text">Q${qi + 1}. ${escHtml(q.question)}</div>
      <div class="quiz-options">
        ${q.options.map((opt, oi) => `
          <div class="quiz-opt" data-qi="${qi}" data-oi="${oi}">
            <span>${String.fromCharCode(65 + oi)}.</span>
            ${escHtml(opt)}
          </div>
        `).join('')}
      </div>
      <div class="quiz-explanation" id="qexp-${qi}">${escHtml(q.explanation)}</div>
    `;
    quizBody.appendChild(qEl);
  });

  // Selection logic
  quizBody.querySelectorAll('.quiz-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const qi = parseInt(opt.dataset.qi);
      // Deselect others in same question
      quizBody.querySelectorAll(`.quiz-opt[data-qi="${qi}"]`).forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  submitQuiz.style.display = 'inline-flex';
}

// Submit quiz — reveal correct/wrong
if (submitQuiz) {
  submitQuiz.addEventListener('click', () => {
    if (!quizData.length) return;

    quizData.forEach((q, qi) => {
      const opts     = quizBody.querySelectorAll(`.quiz-opt[data-qi="${qi}"]`);
      const selected = quizBody.querySelector(`.quiz-opt[data-qi="${qi}"].selected`);
      const expEl    = document.getElementById(`qexp-${qi}`);

      opts.forEach((opt, oi) => {
        if (oi === q.correct) opt.classList.add('correct-ans');
        else if (opt === selected) opt.classList.add('wrong-ans');
      });

      if (expEl) expEl.style.display = 'block';
    });

    submitQuiz.textContent = 'Answers Revealed';
    submitQuiz.disabled    = true;
  });
}

// Close quiz
[quizClose, quizClose2].forEach(btn => {
  if (btn) btn.addEventListener('click', closeQuiz);
});
quizOverlay.addEventListener('click', (e) => {
  if (e.target === quizOverlay) closeQuiz();
});

function closeQuiz() {
  quizOverlay.style.display = 'none';
  quizData = [];
  submitQuiz.textContent = 'Check Answers';
  submitQuiz.disabled    = false;
}

// ── HTML escape helper ────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
