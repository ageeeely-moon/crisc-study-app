(() => {
  const letters = ["A", "B", "C", "D"];
  const customKey = "crisc-custom-sections";
  const activeKey = "crisc-active-section";
  const sessionMetaKey = "crisc-exam-last-session";

  const app = {
    section: document.getElementById("sectionSelect"),
    topic: document.getElementById("questionTopic"),
    mode: document.getElementById("studyMode"),
    limit: document.getElementById("questionLimit"),
    save: document.getElementById("saveSession"),
    resume: document.getElementById("resumeSession"),
    practiceTab: document.querySelector('[data-view="practiceView"]'),
    shuffle: document.getElementById("shuffleQuestions")
  };

  if (!app.section || !app.topic || !app.mode || !app.limit) return;

  const startScreen = document.createElement("section");
  startScreen.id = "examStartScreen";
  startScreen.className = "exam-start-screen";
  startScreen.setAttribute("aria-label", "Test setup");
  startScreen.innerHTML = `
    <article class="exam-start-card">
      <p class="eyebrow">CRISC Practice</p>
      <h1 class="exam-start-title">Test Setup</h1>
      <p class="exam-start-subtitle">Choose the section, topic, mode, and number of questions before starting.</p>
      <div class="exam-start-grid">
        <label>Section <select id="examStartSection"></select></label>
        <label>Topic <select id="examStartTopic"></select></label>
        <label>Mode <select id="examStartMode"><option value="study">Study</option><option value="exam">Exam</option></select></label>
        <label>Questions <input id="examStartLimit" type="number" min="1" value="50"></label>
      </div>
      <div class="exam-start-actions">
        <button id="examStartButton" type="button">Start New Test</button>
        <button id="examResumeButton" class="ghost" type="button">Resume Last Session</button>
        <label class="file-picker">Upload Questions TXT <input id="examQuestionFile" type="file" accept=".txt,text/plain"></label>
        <label class="file-picker">Upload Flashcards TXT <input id="examFlashcardFile" type="file" accept=".txt,text/plain"></label>
      </div>
      <div id="examStartStatus" class="exam-start-status"></div>
    </article>
  `;

  const main = document.querySelector("main");
  document.body.insertBefore(startScreen, main || document.body.firstChild);

  const settingsButton = document.createElement("button");
  settingsButton.id = "examSettingsButton";
  settingsButton.className = "exam-settings-button";
  settingsButton.type = "button";
  settingsButton.textContent = "Settings";
  document.body.append(settingsButton);

  const saveButton = document.createElement("button");
  saveButton.id = "examSaveButton";
  saveButton.className = "exam-save-button";
  saveButton.type = "button";
  saveButton.textContent = "Save Session";
  document.body.append(saveButton);

  const start = {
    section: document.getElementById("examStartSection"),
    topic: document.getElementById("examStartTopic"),
    mode: document.getElementById("examStartMode"),
    limit: document.getElementById("examStartLimit"),
    button: document.getElementById("examStartButton"),
    resume: document.getElementById("examResumeButton"),
    questionFile: document.getElementById("examQuestionFile"),
    flashcardFile: document.getElementById("examFlashcardFile"),
    status: document.getElementById("examStartStatus")
  };

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clamp(value, min, max) {
    const number = Number(value);
    const safeMax = Math.max(min, Number(max) || min);
    if (!Number.isFinite(number)) return Math.min(50, safeMax);
    return Math.max(min, Math.min(safeMax, Math.floor(number)));
  }

  function hasOption(select, value) {
    return [...select.options].some(option => option.value === value);
  }

  function copyOptions(source, target) {
    const options = [...source.options];
    target.innerHTML = options.length
      ? options.map(option => `<option value="${esc(option.value)}">${esc(option.textContent || option.value)}</option>`).join("")
      : '<option value="">No sections</option>';
  }

  function change(control) {
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setControl(control, value, alwaysDispatch = true) {
    const changed = String(control.value) !== String(value);
    control.value = value;
    if (alwaysDispatch || changed) change(control);
  }

  function syncStartScreen() {
    copyOptions(app.section, start.section);
    start.section.value = hasOption(start.section, app.section.value) ? app.section.value : (start.section.options[0]?.value || "");

    copyOptions(app.topic, start.topic);
    start.topic.value = hasOption(start.topic, app.topic.value) ? app.topic.value : (start.topic.options[0]?.value || "All");

    start.mode.value = app.mode.value || "study";

    const max = Number(app.limit.max || 1) || 1;
    start.limit.max = String(max);
    start.limit.value = String(clamp(app.limit.value || start.limit.value, 1, max));
  }

  function showStatus(message, isError = false) {
    start.status.textContent = message;
    start.status.classList.toggle("is-error", Boolean(isError));
  }

  function startExam() {
    if (!start.section.value) {
      showStatus("Upload a question file or select a section first.", true);
      return;
    }

    setControl(app.section, start.section.value, false);
    const selectedTopic = hasOption(app.topic, start.topic.value) ? start.topic.value : (app.topic.options[0]?.value || "All");
    setControl(app.topic, selectedTopic);
    setControl(app.mode, start.mode.value || "study");

    const max = Number(app.limit.max || 1) || 1;
    const questionCount = clamp(start.limit.value, 1, max);
    start.limit.value = String(questionCount);
    setControl(app.limit, String(questionCount));

    app.practiceTab?.click();
    app.shuffle?.click();
    document.body.classList.add("exam-active");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function saveExamSession() {
    localStorage.setItem(sessionMetaKey, JSON.stringify({
      section: app.section.value,
      topic: app.topic.value,
      mode: app.mode.value,
      limit: app.limit.value,
      savedAt: new Date().toISOString()
    }));
    app.save?.click();

    const oldText = saveButton.textContent;
    saveButton.textContent = "Saved";
    window.setTimeout(() => {
      saveButton.textContent = oldText;
    }, 1200);
  }

  function resumeLastSession() {
    let meta = null;
    try {
      meta = JSON.parse(localStorage.getItem(sessionMetaKey) || "null");
    } catch {
      meta = null;
    }

    if (meta?.section && hasOption(app.section, meta.section)) {
      setControl(app.section, meta.section, false);
    }

    app.resume?.click();

    if (meta?.topic && hasOption(app.topic, meta.topic)) setControl(app.topic, meta.topic);
    if (meta?.mode) setControl(app.mode, meta.mode);
    if (meta?.limit) setControl(app.limit, String(clamp(meta.limit, 1, app.limit.max)));

    app.practiceTab?.click();
    document.body.classList.add("exam-active");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showSettings() {
    document.body.classList.remove("exam-active");
    syncStartScreen();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function parseBlocks(text) {
    return text.replace(/\r/g, "").split(/\n\s*\n+/).map(block => block.trim()).filter(Boolean).map(block => {
      const values = {};
      let key = "";
      block.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const choice = trimmed.match(/^([ABCD])[\):.\-]\s*(.+)$/i);
        const pair = trimmed.match(/^([A-Za-z ]+):\s*(.*)$/);
        if (choice) {
          key = choice[1].toLowerCase();
          values[key] = choice[2].trim();
          return;
        }
        if (pair) {
          key = pair[1].toLowerCase().replace(/\s+/g, "");
          values[key] = pair[2].trim();
          return;
        }
        if (key) values[key] = `${values[key] || ""}\n${trimmed}`.trim();
      });
      return values;
    });
  }

  function parseQuestions(text, prefix) {
    return parseBlocks(text).map((block, index) => {
      const choices = [block.a, block.b, block.c, block.d];
      const correctIndex = letters.indexOf(String(block.answer || block.correct || "").trim().toUpperCase());
      const closestIndex = letters.indexOf(String(block.closest || "").trim().toUpperCase());
      if (choices.some(choice => !choice) || correctIndex < 0) return null;
      return {
        id: `${prefix}-Q${index + 1}`,
        title: block.title || block.topic || "Imported Question",
        topic: block.topic || "Imported",
        scenario: block.scenario || block.case || "",
        question: block.question || block.q || "Which action is BEST?",
        choices,
        correctIndex,
        closestIndex: closestIndex < 0 ? choices.findIndex((_, choiceIndex) => choiceIndex !== correctIndex) : closestIndex,
        explanation: block.explanation || "",
        closestExplanation: block.closestexplanation || "This answer is close, but not the best option."
      };
    }).filter(Boolean);
  }

  function parseFlashcards(text, prefix) {
    return parseBlocks(text).map((block, index) => {
      const front = block.front || block.q || block.question;
      const back = block.back || block.a || block.answer;
      if (!front || !back) return null;
      return {
        id: `${prefix}-F${index + 1}`,
        title: block.title || block.topic || "Imported Flashcard",
        topic: block.topic || "Imported",
        front,
        back
      };
    }).filter(Boolean);
  }

  function fileTitle(file) {
    return (file.name || "Imported Section")
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Imported Section";
  }

  function loadCustomSections() {
    try {
      const sections = JSON.parse(localStorage.getItem(customKey) || "[]");
      return Array.isArray(sections) ? sections : [];
    } catch {
      return [];
    }
  }

  async function importFile(file, type) {
    if (!file) return;
    showStatus(`Importing ${file.name}...`);

    try {
      const title = fileTitle(file);
      const id = `custom-${Date.now()}`;
      const text = await file.text();
      const questions = type === "questions" ? parseQuestions(text, id) : [];
      const flashcards = type === "flashcards" ? parseFlashcards(text, id) : [];

      if (!questions.length && !flashcards.length) {
        showStatus(`No valid ${type} found. Check the TXT format.`, true);
        return;
      }

      const sections = loadCustomSections();
      sections.push({ id, label: title, title, custom: true, questions, flashcards, createdAt: new Date().toISOString() });
      localStorage.setItem(customKey, JSON.stringify(sections));
      localStorage.setItem(activeKey, id);
      localStorage.setItem(`crisc-state-${id}`, JSON.stringify({
        questionLimit: String(Math.max(1, questions.length)),
        cardLimit: String(Math.max(1, flashcards.length)),
        activeView: questions.length ? "practiceView" : "flashcardView",
        mode: "study"
      }));

      showStatus(`Created section "${title}". Reloading...`);
      window.setTimeout(() => window.location.reload(), 500);
    } catch {
      showStatus("The file could not be imported. Please try another TXT file.", true);
    }
  }

  start.section.addEventListener("change", () => {
    setControl(app.section, start.section.value, false);
    window.setTimeout(syncStartScreen, 0);
  });
  start.limit.addEventListener("change", () => {
    start.limit.value = String(clamp(start.limit.value, 1, start.limit.max));
  });
  start.button.addEventListener("click", startExam);
  start.resume.addEventListener("click", resumeLastSession);
  start.questionFile.addEventListener("change", () => importFile(start.questionFile.files[0], "questions"));
  start.flashcardFile.addEventListener("change", () => importFile(start.flashcardFile.files[0], "flashcards"));
  saveButton.addEventListener("click", saveExamSession);
  settingsButton.addEventListener("click", showSettings);

  new MutationObserver(syncStartScreen).observe(app.section, { childList: true, subtree: true, attributes: true });
  new MutationObserver(syncStartScreen).observe(app.topic, { childList: true, subtree: true, attributes: true });

  syncStartScreen();
})();
