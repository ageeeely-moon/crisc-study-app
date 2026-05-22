(() => {
  function placeExamActions() {
    const panelHead = document.querySelector(".question-panel .panel-head");
    const markButton = document.getElementById("markQuestion");
    const saveButton = document.getElementById("examSaveButton");
    const settingsButton = document.getElementById("examSettingsButton");

    if (!panelHead || !markButton || !saveButton || !settingsButton) return false;

    let actionBar = document.querySelector(".exam-session-actions");
    if (!actionBar) {
      actionBar = document.createElement("div");
      actionBar.className = "exam-session-actions";
    }

    saveButton.textContent = "Save";
    saveButton.setAttribute("aria-label", "Save session");
    actionBar.append(markButton, saveButton, settingsButton);
    panelHead.append(actionBar);
    return true;
  }

  if (!placeExamActions()) {
    window.setTimeout(placeExamActions, 0);
  }
})();
