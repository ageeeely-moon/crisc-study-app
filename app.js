(() => {
  const letters = ["A", "B", "C", "D"];
  const builtInSections = [{ id: "home", label: "Upload Files", title: "Upload Files", questions: [], flashcards: [] }];
  const customKey = "crisc-custom-sections";
  const activeKey = "crisc-active-section";
  let sections = loadSections();
  let activeId = localStorage.getItem(activeKey) || sections[0].id;
  if (!sections.some(section => section.id === activeId)) activeId = sections[0].id;

  let state = loadState();
  let questionSet = [];
  let cardSet = [];

  const el = {
    sectionSelect: document.getElementById("sectionSelect"),
    tabs: [...document.querySelectorAll(".tab")],
    views: [...document.querySelectorAll(".view")],
    answeredCount: document.getElementById("answeredCount"),
    correctCount: document.getElementById("correctCount"),
    knownCount: document.getElementById("knownCount"),
    questionTopic: document.getElementById("questionTopic"),
    studyMode: document.getElementById("studyMode"),
    questionLimit: document.getElementById("questionLimit"),
    shuffleQuestions: document.getElementById("shuffleQuestions"),
    resetQuestions: document.getElementById("resetQuestions"),
    questionMeta: document.getElementById("questionMeta"),
    questionTitle: document.getElementById("questionTitle"),
    scenarioText: document.getElementById("scenarioText"),
    questionText: document.getElementById("questionText"),
    answerChoices: document.getElementById("answerChoices"),
    answerFeedback: document.getElementById("answerFeedback"),
    previousQuestion: document.getElementById("previousQuestion"),
    nextQuestion: document.getElementById("nextQuestion"),
    questionPosition: document.getElementById("questionPosition"),
    markQuestion: document.getElementById("markQuestion"),
    cardTopic: document.getElementById("cardTopic"),
    cardLimit: document.getElementById("cardLimit"),
    shuffleCards: document.getElementById("shuffleCards"),
    resetCards: document.getElementById("resetCards"),
    cardMeta: document.getElementById("cardMeta"),
    cardTitle: document.getElementById("cardTitle"),
    cardStatus: document.getElementById("cardStatus"),
    flashcardFace: document.getElementById("flashcardFace"),
    previousCard: document.getElementById("previousCard"),
    nextCard: document.getElementById("nextCard"),
    flipCard: document.getElementById("flipCard"),
    reviewCard: document.getElementById("reviewCard"),
    knowCard: document.getElementById("knowCard"),
    practiceSummary: document.getElementById("practiceSummary"),
    weakTopicList: document.getElementById("weakTopicList"),
    reviewSummary: document.getElementById("reviewSummary"),
    reviewList: document.getElementById("reviewList"),
    librarySearch: document.getElementById("librarySearch"),
    libraryList: document.getElementById("libraryList"),
    saveSession: document.getElementById("saveSession"),
    resumeSession: document.getElementById("resumeSession"),
    questionFileInput: document.getElementById("questionFileInput"),
    flashcardFileInput: document.getElementById("flashcardFileInput"),
    deleteSection: document.getElementById("deleteSection"),
    importStatus: document.getElementById("importStatus")
  };

  function activeSection() { return sections.find(section => section.id === activeId) || sections[0]; }
  function stateKey(id = activeId) { return `crisc-state-${id}`; }
  function sessionKey(id = activeId) { return `crisc-session-${id}`; }
  function loadSections() {
    try {
      const custom = JSON.parse(localStorage.getItem(customKey) || "[]");
      return builtInSections.concat(Array.isArray(custom) ? custom : []);
    } catch {
      return builtInSections;
    }
  }
  function saveCustomSections() { localStorage.setItem(customKey, JSON.stringify(sections.filter(section => section.custom))); }
  function loadState(id = activeId) {
    const fallback = { answers: {}, marked: {}, completedQuestions: [], cardRatings: {}, knownCards: [], questionIndex: 0, cardIndex: 0, questionTopic: "All", cardTopic: "All", questionLimit: "50", cardLimit: "50", questionSetIds: [], cardSetIds: [], activeView: "practiceView", mode: "study", flipped: false };
    try { return Object.assign(fallback, JSON.parse(localStorage.getItem(stateKey(id)) || "{}")); } catch { return fallback; }
  }
  function saveState() { localStorage.setItem(stateKey(), JSON.stringify(state)); }
  function normalizeLimit(value, max) { const number = Number(value); return Math.max(1, Math.min(Math.max(1, max), Number.isFinite(number) ? Math.floor(number) : max || 1)); }
  function topics(items) { return ["All", ...Array.from(new Set(items.map(item => item.topic || "Imported"))).sort()]; }
  function fillSelect(select, values, active) { select.innerHTML = values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join(""); select.value = values.includes(active) ? active : "All"; }
  function shuffle(items) { const copy = items.slice(); for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
  function esc(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function flash(button, text) { if (!button) return; const old = button.textContent; button.textContent = text; setTimeout(() => button.textContent = old, 1300); }

  function renderSectionSelect() {
    el.sectionSelect.innerHTML = sections.map(section => `<option value="${esc(section.id)}">${esc(section.label)}</option>`).join("");
    el.sectionSelect.value = activeId;
  }

  function syncControls() {
    const section = activeSection();
    fillSelect(el.questionTopic, topics(section.questions), state.questionTopic);
    fillSelect(el.cardTopic, topics(section.flashcards), state.cardTopic);
    el.studyMode.value = state.mode;
    el.questionLimit.max = String(Math.max(1, section.questions.length));
    el.cardLimit.max = String(Math.max(1, section.flashcards.length));
    el.questionLimit.value = String(normalizeLimit(state.questionLimit, section.questions.length));
    el.cardLimit.value = String(normalizeLimit(state.cardLimit, section.flashcards.length));
  }

  function makeDueSet(items, completedIds, topic, limit, savedIds, forceNew) {
    const base = items.filter(item => topic === "All" || item.topic === topic);
    if (!base.length) return [];
    const completed = new Set(completedIds.filter(id => items.some(item => item.id === id)));
    if (completed.size >= items.length) return shuffle(base).slice(0, Math.min(limit, base.length));
    const due = base.filter(item => !completed.has(item.id));
    const valid = new Set(due.map(item => item.id));
    const current = savedIds.filter(id => valid.has(id));
    const selectedIds = forceNew || !current.length ? shuffle(due).slice(0, Math.min(limit, due.length)).map(item => item.id) : current.slice(0, limit);
    const byId = new Map(items.map(item => [item.id, item]));
    return selectedIds.map(id => byId.get(id)).filter(Boolean);
  }

  function applyQuestionSet(forceNew = false) {
    const section = activeSection();
    const limit = normalizeLimit(state.questionLimit, section.questions.length);
    questionSet = makeDueSet(section.questions, state.completedQuestions, state.questionTopic, limit, state.questionSetIds, forceNew);
    state.questionSetIds = questionSet.map(q => q.id);
    if (state.questionIndex >= questionSet.length) state.questionIndex = Math.max(0, questionSet.length - 1);
  }

  function applyCardSet(forceNew = false) {
    const section = activeSection();
    const limit = normalizeLimit(state.cardLimit, section.flashcards.length);
    cardSet = makeDueSet(section.flashcards, state.knownCards, state.cardTopic, limit, state.cardSetIds, forceNew);
    state.cardSetIds = cardSet.map(card => card.id);
    if (state.cardIndex >= cardSet.length) state.cardIndex = Math.max(0, cardSet.length - 1);
  }

  function currentQuestion() { return questionSet[state.questionIndex]; }
  function currentCard() { return cardSet[state.cardIndex]; }
  function renderStats() { el.answeredCount.textContent = Object.keys(state.answers).length; el.correctCount.textContent = new Set(state.completedQuestions).size; el.knownCount.textContent = new Set(state.knownCards).size; }

  function renderQuestion(forceNew = false) {
    applyQuestionSet(forceNew);
    const q = currentQuestion();
    if (!q) {
      el.questionMeta.textContent = "No questions"; el.questionTitle.textContent = activeSection().questions.length ? "No due questions in this topic" : "Upload a question file";
      el.scenarioText.textContent = activeSection().questions.length ? "All available questions in this topic are complete for the current cycle." : "Use Import to upload a TXT file.";
      el.questionText.textContent = activeSection().questions.length ? "Choose another topic or reset the cycle." : "No questions loaded yet.";
      el.answerChoices.innerHTML = ""; el.answerFeedback.hidden = true; el.questionPosition.textContent = "0 / 0"; el.markQuestion.hidden = true; renderStats(); return;
    }
    el.markQuestion.hidden = false;
    const answer = state.answers[q.id];
    el.questionMeta.textContent = `Question ${state.questionIndex + 1} of ${questionSet.length} - ${q.topic}`;
    el.questionTitle.textContent = q.title || "Imported Question";
    el.scenarioText.textContent = q.scenario || "";
    el.questionText.textContent = q.question || "Which action is BEST?";
    el.questionPosition.textContent = `${state.questionIndex + 1} / ${questionSet.length}`;
    el.markQuestion.setAttribute("aria-pressed", state.marked[q.id] ? "true" : "false");
    el.answerChoices.innerHTML = q.choices.map((choice, index) => {
      const selected = answer && answer.selectedIndex === index;
      const cls = ["choice"];
      if (answer) { if (index === q.correctIndex) cls.push("is-correct"); else if (index === q.closestIndex) cls.push("is-close"); else if (selected) cls.push("is-wrong"); }
      return `<button class="${cls.join(" ")}" data-choice="${index}"><span class="choice-letter">${letters[index]}</span><span>${esc(choice)}</span></button>`;
    }).join("");
    el.answerFeedback.hidden = !answer || state.mode === "exam";
    el.answerFeedback.innerHTML = answer && state.mode === "study" ? `<p><strong>${answer.correct ? "Correct" : "Review"}.</strong> Best answer: ${letters[q.correctIndex]}.</p><p>${esc(q.explanation || "")}</p><p><strong>Closest answer:</strong> ${letters[q.closestIndex] || "N/A"}. ${esc(q.closestExplanation || "")}</p>` : "";
    renderStats(); saveState();
  }

  function selectAnswer(index) {
    const q = currentQuestion(); if (!q) return;
    const correct = index === q.correctIndex;
    state.answers[q.id] = { selectedIndex: index, correct };
    if (correct && !state.completedQuestions.includes(q.id)) state.completedQuestions.push(q.id);
    saveState(); renderQuestion(); renderReview();
  }

  function moveQuestion(delta) {
    const q = currentQuestion();
    if (delta > 0 && q && state.completedQuestions.includes(q.id)) { state.questionSetIds = state.questionSetIds.filter(id => id !== q.id); state.questionIndex = Math.min(state.questionIndex, Math.max(0, state.questionSetIds.length - 1)); renderQuestion(!state.questionSetIds.length); return; }
    if (!questionSet.length) return;
    state.questionIndex = (state.questionIndex + delta + questionSet.length) % questionSet.length; saveState(); renderQuestion();
  }

  function renderCard(forceNew = false) {
    applyCardSet(forceNew);
    const card = currentCard();
    if (!card) {
      el.cardMeta.textContent = "No flashcards"; el.cardTitle.textContent = activeSection().flashcards.length ? "No due flashcards in this topic" : "Upload a flashcard file";
      el.flashcardFace.textContent = activeSection().flashcards.length ? "All flashcards in this topic are marked Know for the current cycle." : "Use Import to upload a TXT file.";
      el.cardStatus.textContent = "Empty"; el.cardStatus.className = "status-pill"; renderStats(); return;
    }
    const rating = state.cardRatings[card.id] || "new";
    el.cardMeta.textContent = `Flashcard ${state.cardIndex + 1} of ${cardSet.length} - ${card.topic}`;
    el.cardTitle.textContent = card.title || "Imported Flashcard";
    el.flashcardFace.textContent = state.flipped ? card.back : card.front;
    el.flashcardFace.classList.toggle("is-back", state.flipped);
    el.cardStatus.textContent = rating === "known" ? "Known" : rating === "review" ? "Review" : "New";
    el.cardStatus.className = `status-pill ${rating === "known" ? "known" : rating === "review" ? "review" : ""}`;
    renderStats(); saveState();
  }

  function rateCard(rating) {
    const card = currentCard(); if (!card) return;
    state.cardRatings[card.id] = rating;
    if (rating === "known" && !state.knownCards.includes(card.id)) state.knownCards.push(card.id);
    if (rating === "known") state.cardSetIds = state.cardSetIds.filter(id => id !== card.id);
    state.flipped = false; saveState(); renderCard(rating === "known" && !state.cardSetIds.length);
  }

  function moveCard(delta) { if (!cardSet.length) return; state.cardIndex = (state.cardIndex + delta + cardSet.length) % cardSet.length; state.flipped = false; saveState(); renderCard(); }

  function renderReview() {
    const section = activeSection();
    const answered = section.questions.filter(q => state.answers[q.id]);
    const missed = answered.filter(q => !state.answers[q.id].correct);
    const correct = answered.length - missed.length;
    el.practiceSummary.textContent = answered.length ? `${correct} correct from ${answered.length} answered` : "No answers yet";
    const byTopic = {};
    answered.forEach(q => { byTopic[q.topic] ||= { answered: 0, missed: 0 }; byTopic[q.topic].answered++; if (!state.answers[q.id].correct) byTopic[q.topic].missed++; });
    el.weakTopicList.innerHTML = Object.entries(byTopic).map(([topic, stats]) => `<div class="topic-row"><strong>${esc(topic)}</strong><span class="muted">${stats.answered - stats.missed}/${stats.answered} correct</span></div>`).join("") || '<p class="muted">Answer questions to see topic trends.</p>';
    const review = section.questions.filter(q => state.marked[q.id] || (state.answers[q.id] && !state.answers[q.id].correct));
    el.reviewSummary.textContent = review.length ? `${review.length} item${review.length === 1 ? "" : "s"} to review` : "Nothing marked";
    el.reviewList.innerHTML = review.map(q => `<div class="review-row"><strong>${esc(q.title || q.id)}</strong><span class="muted">${esc(q.topic || "Imported")}</span></div>`).join("") || '<p class="muted">Marked and missed questions will appear here.</p>';
  }

  function renderLibrary() {
    const section = activeSection();
    const term = el.librarySearch.value.trim().toLowerCase();
    const questionRows = section.questions.filter(q => !term || JSON.stringify(q).toLowerCase().includes(term)).map(q => `<article class="library-row"><strong>${esc(q.title || "Question")}</strong><span class="muted">Question - ${esc(q.topic)}</span><p>${esc(q.question)}</p></article>`);
    const cardRows = section.flashcards.filter(card => !term || JSON.stringify(card).toLowerCase().includes(term)).map(card => `<article class="library-row"><strong>${esc(card.title || "Flashcard")}</strong><span class="muted">Flashcard - ${esc(card.topic)}</span><p>${esc(card.front)}</p></article>`);
    el.libraryList.innerHTML = questionRows.concat(cardRows).join("") || '<p class="muted">No items in this section yet.</p>';
  }

  function switchView(viewId, persist = true) { el.tabs.forEach(tab => tab.classList.toggle("is-active", tab.dataset.view === viewId)); el.views.forEach(view => view.classList.toggle("is-active", view.id === viewId)); state.activeView = viewId; if (persist) saveState(); renderReview(); renderLibrary(); }
  function resetQuestions() { state.answers = {}; state.marked = {}; state.completedQuestions = []; state.questionIndex = 0; state.questionSetIds = []; saveState(); renderQuestion(true); renderReview(); }
  function resetCards() { state.cardRatings = {}; state.knownCards = []; state.cardIndex = 0; state.flipped = false; state.cardSetIds = []; saveState(); renderCard(true); }
  function saveSession() { localStorage.setItem(sessionKey(), JSON.stringify(state)); flash(el.saveSession, "Saved"); }
  function resumeSession() { const saved = localStorage.getItem(sessionKey()); if (!saved) { flash(el.resumeSession, "No Session"); return; } state = Object.assign(loadState(), JSON.parse(saved)); saveState(); syncControls(); switchView(state.activeView, false); renderQuestion(); renderCard(); }

  function parseBlocks(text) {
    return text.replace(/\r/g, "").split(/\n\s*\n+/).map(block => block.trim()).filter(Boolean).map(block => {
      const values = {}; let key = "";
      block.split("\n").forEach(line => {
        const trimmed = line.trim(); if (!trimmed) return;
        const choice = trimmed.match(/^([ABCD])[\):.\-]\s*(.+)$/i);
        const pair = trimmed.match(/^([A-Za-z ]+):\s*(.*)$/);
        if (choice) { key = choice[1].toLowerCase(); values[key] = choice[2].trim(); return; }
        if (pair) { key = pair[1].toLowerCase().replace(/\s+/g, ""); values[key] = pair[2].trim(); return; }
        if (key) values[key] = `${values[key] || ""}\n${trimmed}`.trim();
      });
      return values;
    });
  }

  function parseQuestions(text, prefix) {
    return parseBlocks(text).map((b, i) => {
      const choices = [b.a, b.b, b.c, b.d];
      const correctIndex = letters.indexOf(String(b.answer || b.correct || "").trim().toUpperCase());
      const closestIndex = letters.indexOf(String(b.closest || "").trim().toUpperCase());
      if (choices.some(choice => !choice) || correctIndex < 0) return null;
      return { id: `${prefix}-Q${i + 1}`, title: b.title || b.topic || "Imported Question", topic: b.topic || "Imported", scenario: b.scenario || b.case || "", question: b.question || b.q || "Which action is BEST?", choices, correctIndex, closestIndex: closestIndex < 0 ? choices.findIndex((_, idx) => idx !== correctIndex) : closestIndex, explanation: b.explanation || "", closestExplanation: b.closestexplanation || "This answer is close, but not the best option." };
    }).filter(Boolean);
  }
  function parseFlashcards(text, prefix) {
    return parseBlocks(text).map((b, i) => {
      const front = b.front || b.q || b.question; const back = b.back || b.a || b.answer;
      if (!front || !back) return null;
      return { id: `${prefix}-F${i + 1}`, title: b.title || b.topic || "Imported Flashcard", topic: b.topic || "Imported", front, back };
    }).filter(Boolean);
  }
  function fileTitle(file) { return (file.name || "Imported Section").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Imported Section"; }
  async function importFile(file, type) {
    if (!file) return;
    const title = fileTitle(file); const id = `custom-${Date.now()}`; const text = await file.text();
    const questions = type === "questions" ? parseQuestions(text, id) : [];
    const flashcards = type === "flashcards" ? parseFlashcards(text, id) : [];
    if (!questions.length && !flashcards.length) { showImport(`No valid ${type} found. Check the TXT format.`, true); return; }
    const section = { id, label: title, title, custom: true, questions, flashcards, createdAt: new Date().toISOString() };
    sections.push(section); saveCustomSections(); activeId = id; localStorage.setItem(activeKey, activeId); state = loadState(); state.activeView = questions.length ? "practiceView" : "flashcardView"; state.questionLimit = String(Math.max(1, questions.length)); state.cardLimit = String(Math.max(1, flashcards.length)); saveState(); renderAll(); showImport(`Created section "${title}".`, false);
  }
  function showImport(message, error) { el.importStatus.textContent = message; el.importStatus.classList.toggle("is-error", Boolean(error)); }
  function deleteSection() {
    const section = activeSection(); if (!section.custom) { showImport("Built-in section cannot be deleted.", true); return; }
    sections = sections.filter(item => item.id !== section.id); saveCustomSections(); localStorage.removeItem(stateKey(section.id)); localStorage.removeItem(sessionKey(section.id)); activeId = sections[0].id; localStorage.setItem(activeKey, activeId); state = loadState(); renderAll(); showImport("Deleted imported section.", false);
  }

  function wireEvents() {
    el.sectionSelect.addEventListener("change", () => { activeId = el.sectionSelect.value; localStorage.setItem(activeKey, activeId); state = loadState(); renderAll(); });
    el.tabs.forEach(tab => tab.addEventListener("click", () => switchView(tab.dataset.view)));
    el.saveSession.addEventListener("click", saveSession); el.resumeSession.addEventListener("click", resumeSession);
    el.answerChoices.addEventListener("click", event => { const button = event.target.closest("[data-choice]"); if (button) selectAnswer(Number(button.dataset.choice)); });
    el.previousQuestion.addEventListener("click", () => moveQuestion(-1)); el.nextQuestion.addEventListener("click", () => moveQuestion(1));
    el.markQuestion.addEventListener("click", () => { const q = currentQuestion(); if (!q) return; state.marked[q.id] = !state.marked[q.id]; if (!state.marked[q.id]) delete state.marked[q.id]; saveState(); renderQuestion(); renderReview(); });
    el.questionTopic.addEventListener("change", () => { state.questionTopic = el.questionTopic.value; state.questionIndex = 0; state.questionSetIds = []; saveState(); renderQuestion(true); });
    el.studyMode.addEventListener("change", () => { state.mode = el.studyMode.value; saveState(); renderQuestion(); });
    el.questionLimit.addEventListener("change", () => { state.questionLimit = String(normalizeLimit(el.questionLimit.value, activeSection().questions.length)); state.questionIndex = 0; state.questionSetIds = []; saveState(); renderQuestion(true); });
    el.shuffleQuestions.addEventListener("click", () => { state.questionSetIds = []; state.questionIndex = 0; renderQuestion(true); }); el.resetQuestions.addEventListener("click", resetQuestions);
    el.cardTopic.addEventListener("change", () => { state.cardTopic = el.cardTopic.value; state.cardIndex = 0; state.cardSetIds = []; saveState(); renderCard(true); });
    el.cardLimit.addEventListener("change", () => { state.cardLimit = String(normalizeLimit(el.cardLimit.value, activeSection().flashcards.length)); state.cardIndex = 0; state.cardSetIds = []; saveState(); renderCard(true); });
    el.flashcardFace.addEventListener("click", () => { state.flipped = !state.flipped; saveState(); renderCard(); }); el.flipCard.addEventListener("click", () => { state.flipped = !state.flipped; saveState(); renderCard(); });
    el.previousCard.addEventListener("click", () => moveCard(-1)); el.nextCard.addEventListener("click", () => moveCard(1)); el.reviewCard.addEventListener("click", () => rateCard("review")); el.knowCard.addEventListener("click", () => rateCard("known"));
    el.shuffleCards.addEventListener("click", () => { state.cardSetIds = []; state.cardIndex = 0; renderCard(true); }); el.resetCards.addEventListener("click", resetCards);
    el.librarySearch.addEventListener("input", renderLibrary);
    el.questionFileInput.addEventListener("change", () => importFile(el.questionFileInput.files[0], "questions")); el.flashcardFileInput.addEventListener("change", () => importFile(el.flashcardFileInput.files[0], "flashcards")); el.deleteSection.addEventListener("click", deleteSection);
  }
  function renderAll() { renderSectionSelect(); syncControls(); switchView(state.activeView || "practiceView", false); renderQuestion(); renderCard(); renderReview(); renderLibrary(); }
  wireEvents(); renderAll();
})();
