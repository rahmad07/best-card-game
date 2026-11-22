# Sigil Clash — Duel of the Three Lanes

[![Best Card Game](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/rahmad07/best-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/rahmad07/best-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original lane-based card duel, built for the [make.fun Best Card Game bounty](https://make.fun/bounty/best-card-game-20261122-1826). You are the Warden of the Spire, duelling Vex, the Hollow Dealer, across three gates. Every round you place one card in each lane; suits beat suits, combos multiply power, and the lane winner strikes life straight from the loser.

## How to play

- Each round you draw up to **5 cards**. Play **one card into each of the 3 lanes**.
- A card's **power = its value**. **+3** when its suit beats the rival suit in that lane.
- **Ember > Gale > Tide > Ember.** Stone beats nothing — but no suit beats Stone, and Stone always adds **+1**.
- Combos across your 3 lanes: **same suit (Sigil Surge) +3** each · **run of 3 values (Harmony) +2** each · **a pair +1** each.
- Win a lane: deal damage equal to the power gap (min 1). Lose a lane: take it instead. Tie: nothing.
- Read Vex: his **tell** names the lane he strengthens and his mood (**Bold / Patient / Cunning**) before you commit — dodge his strong lane, stack yours.
- Life hits 0 and the duel ends. After round 6, the higher life wins.

## Controls

Mouse: click a card, then click a lane (click a placed card to take it back).
Keyboard: **1–5** pick a card, **1–3** drop it in a lane, **Enter** reveals.

## Run it

Static files, no build step, no network request:

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static HTTP server and open `game/index.html`.

## Layout

- `game/index.html` — page shell, HUD, table layout
- `game/css/table.css` — all styling
- `game/src/suits.js` — the four suits, advantage cycle, combo rules
- `game/src/deck.js` — deck building, shuffling, drawing
- `game/src/ai.js` — Vex: moods, favoured lane, tells, lane picks
- `game/src/engine.js` — duel state machine: rounds, scoring, damage
- `game/src/render.js` — DOM rendering, flip/slide animations, end screens
- `game/src/shots.js` — deterministic `?shot=` states for screenshots
- `game/src/main.js` — bootstrap and input wiring
- `main.ts` — hands the game in: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — 4 real renders of the game's own code: title, table, victory, defeat
