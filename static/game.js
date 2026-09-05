(() => {
  const MAX_WRONG = 6;
  const BODY_PART_IDS = [
    "part-head",
    "part-body",
    "part-arm-l",
    "part-arm-r",
    "part-leg-l",
    "part-leg-r",
  ];

  const setupScreen = document.getElementById("setup-screen");
  const gameScreen = document.getElementById("game-screen");
  const phraseInput = document.getElementById("phrase-input");
  const revealToggle = document.getElementById("reveal-toggle");
  const startBtn = document.getElementById("start-btn");
  const setupError = document.getElementById("setup-error");

  const statusPill = document.getElementById("status-pill");
  const wordBoard = document.getElementById("word-board");
  const wordGuessInput = document.getElementById("word-guess-input");
  const wordGuessBtn = document.getElementById("word-guess-btn");
  const guessedLettersEl = document.getElementById("guessed-letters");
  const revealBtn = document.getElementById("reveal-btn");
  const newGameBtn = document.getElementById("new-game-btn");
  const wrongCountEl = document.getElementById("wrong-count");
  const gallows = document.getElementById("gallows");
  const face = document.getElementById("face");

  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayAnswer = document.getElementById("overlay-answer");
  const overlayNewGame = document.getElementById("overlay-new-game");

  let state = null;

  function isLetter(ch) {
    return /[a-zA-Z]/.test(ch);
  }

  function buildBoard(phrase) {
    wordBoard.innerHTML = "";
    const chars = phrase.split("");
    let currentGroup = null;
    for (let idx = 0; idx < chars.length; idx++) {
      const ch = chars[idx];
      if (ch === " ") {
        currentGroup = null;
        const slot = document.createElement("div");
        slot.classList.add("char-slot", "space");
        slot.dataset.index = String(idx);
        slot.textContent = " ";
        wordBoard.appendChild(slot);
        continue;
      }
      if (!currentGroup) {
        currentGroup = document.createElement("div");
        currentGroup.className = "word-group";
        wordBoard.appendChild(currentGroup);
      }
      const slot = document.createElement("div");
      slot.classList.add("char-slot");
      slot.dataset.index = String(idx);
      if (!isLetter(ch)) {
        slot.classList.add("punct");
        slot.textContent = ch;
      } else {
        slot.classList.add("letter");
        slot.textContent = "_";
        slot.dataset.letter = ch.toUpperCase();
      }
      currentGroup.appendChild(slot);
    }
  }

  function refreshBoard() {
    const slots = wordBoard.querySelectorAll(".char-slot.letter");
    slots.forEach((slot) => {
      const letter = slot.dataset.letter;
      const actualChar = state.phrase[Number(slot.dataset.index)];
      const isGuessed = state.guessed.has(letter);
      slot.classList.remove("filled", "revealed");
      if (isGuessed) {
        slot.textContent = actualChar;
        slot.classList.add("filled");
      } else if (state.finished) {
        slot.textContent = actualChar;
        slot.classList.add("revealed");
      } else {
        slot.textContent = "_";
      }
    });
  }

  function refreshGuessedLetters() {
    guessedLettersEl.innerHTML = "";
    [...state.guessed]
      .sort()
      .forEach((letter) => {
        const chip = document.createElement("span");
        chip.className = "guessed-chip " + (state.phraseLetters.has(letter) ? "correct" : "incorrect");
        chip.textContent = letter;
        guessedLettersEl.appendChild(chip);
      });
  }

  function updateGallows() {
    BODY_PART_IDS.forEach((id, idx) => {
      const el = document.getElementById(id);
      el.classList.toggle("shown", idx < state.wrong);
    });
    gallows.classList.toggle("lost", state.result === "lose");
    face.classList.toggle("hidden", state.result !== "lose");
    wrongCountEl.textContent = String(state.wrong);
  }

  function updateStatusPill() {
    statusPill.classList.remove("win", "lose");
    if (state.result === "win") {
      statusPill.classList.add("win");
      statusPill.textContent = "You got it!";
    } else if (state.result === "lose") {
      statusPill.classList.add("lose");
      statusPill.textContent = "Out of guesses!";
    } else {
      const remaining = MAX_WRONG - state.wrong;
      statusPill.textContent =
        "Guess the phrase! " + remaining + " wrong guess" + (remaining === 1 ? "" : "es") + " left";
    }
  }

  function checkWin() {
    for (const letter of state.phraseLetters) {
      if (!state.guessed.has(letter)) return false;
    }
    return true;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function finishGame(result) {
    state.finished = true;
    state.result = result;
    updateGallows();
    updateStatusPill();
    refreshBoard();
    refreshGuessedLetters();
    wordGuessInput.disabled = true;
    wordGuessBtn.disabled = true;
    revealBtn.disabled = true;

    overlayTitle.textContent = result === "win" ? "Solved it!" : "Game Over";
    overlayTitle.className = result === "win" ? "win-title" : "lose-title";
    overlayAnswer.innerHTML = "The answer was:<br><strong>" + escapeHtml(state.phrase) + "</strong>";
    overlay.classList.remove("hidden");
  }

  function guessLetter(letter) {
    if (!state || state.finished || state.guessed.has(letter)) return;
    state.guessed.add(letter);
    if (!state.phraseLetters.has(letter)) {
      state.wrong += 1;
    }
    refreshBoard();
    refreshGuessedLetters();
    updateGallows();
    updateStatusPill();

    if (state.wrong >= MAX_WRONG) {
      finishGame("lose");
    } else if (checkWin()) {
      finishGame("win");
    }
  }

  function normalizeWord(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function guessWord(guess) {
    if (!state || state.finished || !guess.trim()) return;
    const normalizedGuess = normalizeWord(guess);
    const phraseWords = state.phrase.split(" ").map(normalizeWord);

    if (normalizedGuess && phraseWords.includes(normalizedGuess)) {
      normalizedGuess.split("").forEach((ch) => {
        if (isLetter(ch)) state.guessed.add(ch.toUpperCase());
      });
      refreshBoard();
      refreshGuessedLetters();
      updateStatusPill();
      if (checkWin()) {
        finishGame("win");
      }
    } else {
      state.wrong += 1;
      updateGallows();
      updateStatusPill();
      if (state.wrong >= MAX_WRONG) {
        finishGame("lose");
      }
    }
    wordGuessInput.value = "";
  }

  function startGame(phrase) {
    const phraseLetters = new Set(
      phrase
        .split("")
        .filter(isLetter)
        .map((c) => c.toUpperCase())
    );

    state = {
      phrase,
      phraseLetters,
      guessed: new Set(),
      wrong: 0,
      finished: false,
      result: null,
    };

    buildBoard(phrase);
    wordGuessInput.disabled = false;
    wordGuessBtn.disabled = false;
    revealBtn.disabled = false;
    wordGuessInput.value = "";
    overlay.classList.add("hidden");

    updateGallows();
    updateStatusPill();
    refreshBoard();
    refreshGuessedLetters();

    setupScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
  }

  function resetToSetup() {
    setupScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
    overlay.classList.add("hidden");
    phraseInput.value = "";
    phraseInput.type = "password";
    revealToggle.textContent = "show text";
    startBtn.disabled = true;
    setupError.textContent = "";
    phraseInput.focus();
  }

  // ---- Setup screen wiring ----

  phraseInput.addEventListener("input", () => {
    const hasLetter = /[a-zA-Z]/.test(phraseInput.value);
    startBtn.disabled = !hasLetter;
    setupError.textContent = "";
  });

  revealToggle.addEventListener("click", () => {
    const showing = phraseInput.type === "text";
    phraseInput.type = showing ? "password" : "text";
    revealToggle.textContent = showing ? "show text" : "hide text";
  });

  function tryStart() {
    const phrase = phraseInput.value;
    if (!/[a-zA-Z]/.test(phrase)) {
      setupError.textContent = "Please enter a word or sentence with at least one letter.";
      return;
    }
    startGame(phrase);
  }

  startBtn.addEventListener("click", tryStart);
  phraseInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !startBtn.disabled) tryStart();
  });

  // ---- Game screen wiring ----

  wordGuessBtn.addEventListener("click", () => guessWord(wordGuessInput.value));
  wordGuessInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") guessWord(wordGuessInput.value);
  });

  revealBtn.addEventListener("click", () => {
    if (!state || state.finished) return;
    state.guessed = new Set(state.phraseLetters);
    finishGame("win");
    overlayTitle.textContent = "Answer Revealed";
    overlayTitle.className = "";
    statusPill.classList.remove("win", "lose");
    statusPill.textContent = "Answer revealed";
  });

  newGameBtn.addEventListener("click", resetToSetup);
  overlayNewGame.addEventListener("click", resetToSetup);

  document.addEventListener("keydown", (e) => {
    if (gameScreen.classList.contains("hidden")) return;
    if (document.activeElement === wordGuessInput) return;
    if (/^[a-zA-Z]$/.test(e.key)) {
      guessLetter(e.key.toUpperCase());
    }
  });

  resetToSetup();
})();
