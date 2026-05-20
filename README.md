# CRISC Study App

A browser-based CRISC study app for uploaded question and flashcard TXT files.

## Features

- Upload question TXT files.
- Upload flashcard TXT files.
- Each uploaded file becomes a separate selectable section.
- Practice mode and exam mode.
- Best-answer multiple-choice question flow.
- Flashcards with Know and Review actions.
- Spaced repetition: correctly answered questions and flashcards marked Know stay out of future sets until the section cycle is complete.
- Save and resume study sessions locally.
- Progress is stored in the browser using local storage.

## Question TXT Format

Separate each question with a blank line.

```txt
Title: Risk ownership
Topic: Governance
Scenario: A business unit assigns a risk to IT even though the process owner controls funding.
Question: Which action is BEST?
A: Keep ownership with IT because the risk is technical.
B: Assign ownership to the accountable business process owner.
C: Ask internal audit to own the risk.
D: Accept the risk until budget is available.
Answer: B
Closest: A
Explanation: Risk ownership belongs with the person accountable for the affected objective.
```

## Flashcard TXT Format

Separate each flashcard with a blank line.

```txt
Title: Risk appetite
Topic: Appetite
Front: What is risk appetite?
Back: The amount and type of risk an enterprise is willing to pursue or retain.
```

## GitHub Pages

To publish as a website:

1. Open the repository settings.
2. Go to Pages.
3. Set source to Deploy from a branch.
4. Choose `main` and `/root`.
5. Save.

The app will be available at:

```txt
https://ageeeely-moon.github.io/crisc-study-app/
```
