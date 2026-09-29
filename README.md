# Voice Class Quiz

A static practice-quiz site for *Vocal Technique* (Davids & LaTour, 2nd ed.), Chapters 1–8.

- 300-question bank: 200 longer **hard** questions (25 per unit, from the study guide and the textbook) and 100 short **easy** questions (one per study-guide item in `Quiz1.md`).
- Choose a difficulty (Easy, Hard, or Mixed) and a length (25, 50, 100, or all); questions are drawn at random, option order is reshuffled, and correct answers are spread evenly across A–D.
- Instant feedback with an explanation, per-unit breakdown, and a review of missed questions. Best score (per difficulty and quiz length) is stored in `localStorage`.

## Local preview

Questions are loaded with `fetch()`, so serve the folder (opening `index.html` directly won't work): run `python3 -m http.server` and visit http://localhost:8000.

## Editing questions

Edit `data/unit1.json` … `data/unit8.json` directly; the page reads them at load time. Each question has `"difficulty": "easy"` or `"hard"`. Unit titles are listed in `app.js`.

## Deploying on GitHub Pages

Pushing to `main` runs `.github/workflows/deploy.yml`, which publishes `index.html`, `style.css`, `app.js` and `data/` to the `gh-pages` branch.

One-time setup: **Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / `(root)`** (the branch appears after the first workflow run).
