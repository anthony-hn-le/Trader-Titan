# Trader Titan

A market-making trivia game: bid a spread, win the right to quote a market, trade against it before and after a clue, then settle against the true answer. 5 rounds, 1 human vs. 3 algorithmic bots (aggressive / conservative / random).

**Live**: [anthony-trader-titan.vercel.app](https://anthony-trader-titan.vercel.app/)

## Status

| Component | Status |
|---|---|
| CLI prototype (`trader_titan.py`, stdlib-only Python) | Done |
| Web port (Next.js/Zustand, same game logic) | Done |
| Configurable 5-30s per-decision answer timer | Done |
| Multi-size contract trading (lift/hit any size up to market depth) | Done |
| Site chrome (header/footer, light/dark mode) | Done |
| Deploy | Done — [live on Vercel](https://anthony-trader-titan.vercel.app/) |

## How it plays

Each round opens on a trivia question with a numeric answer (a year, a count, a physical measurement).

1. **Bid a spread.** All 4 players (you + 3 bots) blind-bid how tight a spread they're willing to quote. Lowest spread wins the right to make the market.
2. **Make or take the market.** The winner quotes a bid/ask and sizes on each side (e.g. `10 at 12 | 100 by 100`). Everyone else can lift the ask, hit the bid, or pass — for any size up to what's posted — twice per round: once before a clue narrows the true value, once after, with the market maker free to re-quote in between.
3. **Settle up.** The true answer is revealed. Each player's round P&L is `cash + inventory × true answer`. Over 5 rounds, whoever has the highest total P&L wins.

## Design notes

- **Three distinct bot strategies, not one shared "AI".** Aggressive and conservative bots both estimate the true answer from a random noise band (tighter for aggressive, wider for conservative) and trade whenever the market's bid/ask strays past their estimate by a profile-specific margin — aggressive bots size up to the full depth on offer, conservative bots take a small clip. The random-profile bot deliberately ignores price and estimate entirely, trading a random size on a pure coin-flip — a noise trader mixed in on purpose, not a placeholder. See `web/src/lib/game/botLogic.ts` (ported from the `Player` class in `trader_titan.py`).
- **Timed decisions.** Every human decision point (spread bid, market quote, trade, re-quote) runs on a configurable 5-30s countdown; a timeout auto-submits a safe default (forfeit the spread bid, a minimal-exposure quote, pass, decline to re-quote) rather than blocking the game.
- **CLI and web share the same rules, not a redesign.** The web app is a faithful port of `trader_titan.py`'s game logic and trivia bank (`questions.py` → `web/src/data/triviaQuestions.ts`), phase-for-phase, with the timer and multi-size trading layered on top.

## Repo layout

```
trader_titan.py    original terminal prototype (stdlib-only Python)
questions.py       trivia question bank used by the CLI
web/               Next.js/React port (deployed)
```

## Run it

### CLI prototype

```bash
python3 trader_titan.py
```

No dependencies beyond the Python standard library.

### Web app

```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest suite: bot logic, settlement, game store
npm run build
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Zustand · Vitest
