(() => {
  const feedback = document.getElementById("answerFeedback");
  if (!feedback) return;

  function patchFeedback() {
    if (feedback.hidden || !feedback.innerHTML.trim()) return;

    const firstParagraph = feedback.querySelector("p:first-child");
    const firstStrong = firstParagraph && firstParagraph.querySelector("strong");
    if (!firstParagraph || !firstStrong) return;

    const label = firstStrong.textContent.trim().replace(/\.$/, "");
    if (label === "Correct") {
      firstParagraph.innerHTML = "<strong>Yes, the answer is correct.</strong>";
    }
  }

  const observer = new MutationObserver(patchFeedback);
  observer.observe(feedback, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-choice]")) {
      window.setTimeout(patchFeedback, 0);
    }
  });

  patchFeedback();
})();
