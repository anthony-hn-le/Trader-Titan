# Trader Titan

A market-making trivia game: bid a spread, win the right to quote a market, trade against it before and after a clue, then settle against the true answer. 5 rounds, 1 human vs. 3 bots (aggressive / conservative / random).

- **`trader_titan.py` + `questions.py`** — the original terminal prototype (stdlib-only Python). Run with `python3 trader_titan.py`.
- **`web/`** — a full Next.js/React port of the same game, with a configurable 5–30s per-decision answer timer. See `web/README.md` for local dev; not yet deployed.

Both share the same underlying rules and trivia question bank — the web app is a faithful port of `trader_titan.py`'s game logic, not a redesign.
