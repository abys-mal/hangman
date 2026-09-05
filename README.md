# Hangman

A single-page Hangman game built with Flask, designed to be projected for a group.

## Run it

```bash
pip install -r requirements.txt
python app.py
```

Then open http://localhost:5000

## How it works

1. **Setup screen** — the host types the secret word or sentence. The text is masked (password-style, with a show/hide toggle) so it isn't accidentally shown to players. Punctuation, digits, and spaces are auto-revealed on the board; only letters need to be guessed.
2. **Game screen** — players guess one letter at a time by typing on a physical keyboard, or guess a single word from within the sentence via the word-guess box (matched whole-word, ignoring punctuation/case). A correct letter or word fills in every occurrence in green. A wrong letter or a wrong word guess draws one more part of the hangman (head, body, left arm, right arm, left leg, right leg — 6 wrong guesses before the game ends).
3. **Reveal Answer** button instantly ends the round and shows the answer.
4. Winning, losing (6 wrong guesses), or revealing all show an overlay with the full answer and a "Play Again" button that returns to setup for the next round.

All game logic runs client-side in `static/game.js`, so there's no lag guessing letters — good for a live/projected setting.
