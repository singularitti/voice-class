# Voice Class Quiz

A static practice-quiz site for *Vocal Technique* (Davids & LaTour, 2nd ed.), Chapters 1–8.

- 200-question bank (25 per unit), built from the class study guide (`Quiz1.md`) and the textbook.
- Choose 25, 50, 100, or all 200 questions per quiz; questions are drawn at random, option order is reshuffled, and correct answers are spread evenly across A–D.
- Instant feedback with an explanation, per-unit breakdown, and a review of missed questions. Best score (per quiz length) is stored in `localStorage`.

## Local preview

Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.

## Editing questions

Edit `data/unit1.json` … `data/unit8.json`, then regenerate the bundle:

```sh
python3 scripts/build_questions.py
```

## Deploying on GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`, which rebuilds `questions.js` from `data/` and publishes the site files to the `gh-pages` branch.

One-time setup: **Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / `(root)`** (the branch appears after the first workflow run).
