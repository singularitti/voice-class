(() => {
  const SIZE_CHOICES = [25, 50, 100];
  const BEST_KEY = "voice-quiz-best";
  const LETTERS = ["A", "B", "C", "D"];

  const UNITS = [
    "Unit 1 · Alignment",
    "Unit 2 · Breath Control",
    "Unit 3 · Initiation, Creation & Release of Sound",
    "Unit 4 · Resonance",
    "Unit 5 · Consonants",
    "Unit 6 · Vowels",
    "Unit 7 · Vibrato",
    "Unit 8 · Registers",
  ];

  const DIFFICULTIES = {
    easy: "Short, direct questions in the style of the study guide.",
    hard: "Longer, more detailed questions that draw on the textbook.",
    mixed: "A blend of easy and hard questions.",
  };
  const DIFFICULTY_LABELS = { easy: "Easy", hard: "Hard", mixed: "Mixed" };

  let bank = [];
  const $ = (id) => document.getElementById(id);
  const screens = { start: $("screen-start"), quiz: $("screen-quiz"), result: $("screen-result") };

  let quizSize = 50;
  let difficulty = "mixed";
  let quiz = [];
  let index = 0;
  let correctCount = 0;
  let answered = false;
  let missed = [];
  let unitStats = {};

  function rand(n) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % n;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Correct-answer slots are dealt from a balanced, shuffled pool so A–D appear
  // about equally often and streaks like "D, D, D, D" are unlikely.
  function balancedSlots(count, slots) {
    const pool = [];
    for (let i = 0; i < count; i++) pool.push(i % slots);
    return shuffle(pool);
  }

  function pool() {
    return difficulty === "mixed" ? bank : bank.filter((q) => q.difficulty === difficulty);
  }

  function buildQuiz() {
    const items = pool();
    const picked = shuffle(items).slice(0, Math.min(quizSize, items.length));
    const slots = balancedSlots(picked.length, 4);
    return picked.map((item, i) => {
      const wrong = shuffle(item.distractors).slice(0, 3);
      const options = wrong.slice();
      options.splice(slots[i], 0, item.correct);
      return { ...item, options, answerIndex: slots[i] };
    });
  }

  function show(name) {
    Object.entries(screens).forEach(([k, el]) => (el.hidden = k !== name));
    window.scrollTo({ top: 0 });
  }

  function bestKey(level, size) {
    return `${BEST_KEY}-${level}-${size}`;
  }

  function loadBest(level, size) {
    try { return JSON.parse(localStorage.getItem(bestKey(level, size))); } catch { return null; }
  }

  function renderBest() {
    const best = loadBest(difficulty, quizSize);
    const line = $("best-line");
    line.hidden = !best;
    if (best) line.textContent = `Best ${DIFFICULTY_LABELS[difficulty].toLowerCase()} score on ${best.total} questions: ${best.score}/${best.total} (${Math.round((100 * best.score) / best.total)}%)`;
  }

  function renderSizes() {
    const total = pool().length;
    const choices = SIZE_CHOICES.filter((n) => n < total).concat(total);
    if (!choices.includes(quizSize)) quizSize = choices.includes(50) ? 50 : total;
    $("size-options").innerHTML = choices
      .map((n) => `<label class="size"><input type="radio" name="size" value="${n}"${n === quizSize ? " checked" : ""}><span>${n === total ? `All ${n}` : n}</span></label>`)
      .join("");
  }

  function renderPool() {
    $("bank-size").textContent = pool().length;
    $("difficulty-note").textContent = DIFFICULTIES[difficulty];
    renderSizes();
    renderBest();
  }

  function renderStart() {
    const units = [...new Set(bank.map((q) => q.unit))];
    $("unit-list").innerHTML = units.map((u) => `<li>${esc(u)}</li>`).join("");
    renderPool();
    show("start");
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function start() {
    quiz = buildQuiz();
    index = 0;
    correctCount = 0;
    missed = [];
    unitStats = {};
    show("quiz");
    renderQuestion();
  }

  function renderQuestion() {
    const item = quiz[index];
    answered = false;
    $("progress-text").textContent = `Question ${index + 1} of ${quiz.length}`;
    $("score-text").textContent = `${correctCount} correct`;
    const bar = $("bar");
    bar.setAttribute("aria-valuenow", index);
    bar.setAttribute("aria-valuemax", quiz.length);
    $("bar-fill").style.width = `${(index / quiz.length) * 100}%`;
    $("unit-tag").textContent = difficulty === "mixed" ? `${item.unit} · ${DIFFICULTY_LABELS[item.difficulty]}` : item.unit;
    $("question").textContent = item.q;
    $("options").innerHTML = item.options
      .map((o, i) => `<button class="opt" data-i="${i}"><span class="key">${LETTERS[i]}</span><span>${esc(o)}</span></button>`)
      .join("");
    $("feedback").hidden = true;
    $("btn-next").hidden = true;
    $("btn-next").textContent = index === quiz.length - 1 ? "See results" : "Next";
  }

  function choose(i) {
    if (answered) return;
    answered = true;
    const item = quiz[index];
    const ok = i === item.answerIndex;
    const stat = (unitStats[item.unit] ||= { right: 0, total: 0 });
    stat.total++;
    if (ok) { correctCount++; stat.right++; } else { missed.push({ item, chosen: i }); }

    document.querySelectorAll(".opt").forEach((btn, k) => {
      btn.disabled = true;
      if (k === item.answerIndex) btn.classList.add("correct");
      else if (k === i) btn.classList.add("wrong");
      else btn.classList.add("dim");
    });

    const fb = $("feedback");
    fb.className = "feedback " + (ok ? "good" : "bad");
    $("feedback-title").textContent = ok ? "Correct" : `Not quite — the answer is ${LETTERS[item.answerIndex]}`;
    $("feedback-text").textContent = item.explain || "";
    fb.hidden = false;
    $("score-text").textContent = `${correctCount} correct`;
    $("btn-next").hidden = false;
    $("btn-next").focus({ preventScroll: true });
  }

  function next() {
    if (!answered) return;
    if (index === quiz.length - 1) return finish();
    index++;
    renderQuestion();
  }

  function finish() {
    const total = quiz.length;
    const pct = Math.round((100 * correctCount) / total);
    const best = loadBest(difficulty, total);
    let bestNote = "";
    if (!best || correctCount > best.score) {
      try { localStorage.setItem(bestKey(difficulty, total), JSON.stringify({ score: correctCount, total })); } catch {}
      bestNote = best ? " New personal best." : "";
    }

    $("ring").style.setProperty("--p", pct);
    $("result-pct").textContent = `${pct}%`;
    $("result-headline").textContent =
      pct >= 90 ? "Superb work" : pct >= 75 ? "Well done" : pct >= 60 ? "Getting there" : "Keep practicing";
    $("result-sub").textContent = `You answered ${correctCount} of ${total} correctly (${DIFFICULTY_LABELS[difficulty].toLowerCase()}).${bestNote}`;

    $("breakdown").innerHTML = Object.entries(unitStats)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([u, s]) => {
        const w = Math.round((100 * s.right) / s.total);
        return `<li><span>${esc(u)}</span><span class="n">${s.right}/${s.total}</span><span class="track"><i style="width:${w}%"></i></span></li>`;
      })
      .join("");

    $("missed-count").textContent = missed.length;
    $("review").hidden = missed.length === 0;
    $("missed-list").innerHTML = missed
      .map(({ item, chosen }) => `
        <div class="missed">
          <p>${esc(item.q)}</p>
          <div class="yours">Your answer: ${esc(item.options[chosen])}</div>
          <div class="right">Correct: ${esc(item.correct)}</div>
          <div class="why">${esc(item.explain || "")}</div>
        </div>`)
      .join("");

    show("result");
  }

  $("difficulty-options").addEventListener("change", (e) => {
    difficulty = e.target.value;
    renderPool();
  });
  $("size-options").addEventListener("change", (e) => {
    quizSize = Number(e.target.value);
    renderBest();
  });
  $("btn-start").addEventListener("click", start);
  $("btn-again").addEventListener("click", start);
  $("btn-home").addEventListener("click", renderStart);
  $("btn-next").addEventListener("click", next);
  $("options").addEventListener("click", (e) => {
    const btn = e.target.closest(".opt");
    if (btn) choose(Number(btn.dataset.i));
  });

  document.addEventListener("keydown", (e) => {
    if (screens.quiz.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key >= "1" && e.key <= "4") choose(Number(e.key) - 1);
    else if (e.key === "Enter" && answered) { e.preventDefault(); next(); }
  });

  async function loadBank() {
    const files = await Promise.all(
      UNITS.map((_, i) =>
        fetch(`data/unit${i + 1}.json`).then((r) => {
          if (!r.ok) throw new Error(`data/unit${i + 1}.json: HTTP ${r.status}`);
          return r.json();
        })
      )
    );
    return files.flatMap((items, i) => items.map((item) => ({ ...item, unit: UNITS[i] })));
  }

  $("btn-start").disabled = true;
  loadBank()
    .then((items) => {
      bank = items;
      $("btn-start").disabled = false;
      renderStart();
    })
    .catch((err) => {
      console.error(err);
      $("load-error").hidden = false;
      show("start");
    });
})();
