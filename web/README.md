# Trader Titan — web

The Next.js/React port of the game. For rules, design notes, and the CLI prototype, see the [root README](../README.md).

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest suite: bot logic, settlement, game store
npm run lint
npm run build
```

No environment variables or backend services required — the game runs entirely client-side.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Zustand · Vitest

## Structure

```
src/app/                 lobby ("/") and the game screen ("/play")
src/components/game/     in-round UI: question card, spread bidding, market quoting, trade panel, leaderboard
src/components/lobby/    lobby-only UI: rules blurb, answer-timer slider, recent games
src/components/shared/   site chrome: header, footer, theme toggle
src/lib/game/            pure game logic: types, bot strategy, settlement math, trivia question bank
src/stores/              Zustand stores: gameStore (phase machine + all round state), configStore (persisted settings)
```

## Deploy

Connected to Vercel via the `anthony-hn-le/Trader-Titan` GitHub repo, with this directory (`web`) set as the project's Root Directory — every push to `main` deploys automatically.
