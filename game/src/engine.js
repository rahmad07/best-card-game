// engine.js — the duel state machine: rounds, draws, lane resolution,
// damage, combos and the win/loss conditions. Pure logic, no DOM.
import { buildDeck, shuffleDeck, drawUpTo, HAND_SIZE } from './deck.js';
import { comboBonus, lanePower } from './suits.js';
import { pickMood, pickFavouredLane, choosePlays } from './ai.js';

export const MAX_LIFE = 20;
export const MAX_ROUNDS = 6;
export const LANES = 3;

export function newDuel(random) {
  return {
    random,
    round: 1,
    phase: 'title', // title | placing | revealed | over
    ownLife: MAX_LIFE,
    rivalLife: MAX_LIFE,
    ownDeck: shuffleDeck(buildDeck(), random),
    rivalDeck: shuffleDeck(buildDeck(), random),
    ownHand: [],
    rivalHand: [],
    ownPlays: [null, null, null],
    rivalPlays: [null, null, null],
    mood: 'bold',
    favouredLane: 0,
    tell: '',
    combo: { bonus: 0, name: '' },
    rivalCombo: { bonus: 0, name: '' },
    lanesWon: 0,
    damageDealt: 0,
    damageTaken: 0,
    combosMade: 0,
    winner: null, // 'you' | 'vex' | 'draw'
    lastLog: '',
  };
}

export function startRound(state) {
  drawUpTo(state.ownDeck, state.ownHand, HAND_SIZE);
  drawUpTo(state.rivalDeck, state.rivalHand, HAND_SIZE);
  state.ownPlays = [null, null, null];
  state.rivalPlays = [null, null, null];
  state.mood = pickMood(state.round, state.random);
  state.favouredLane = pickFavouredLane(state.random);
  state.phase = 'placing';
  state.lastLog = `Round ${state.round} — place one card in each lane.`;
}

export function placeCard(state, cardId, lane) {
  if (state.phase !== 'placing') return false;
  const idx = state.ownHand.findIndex((c) => c.id === cardId);
  if (idx < 0) return false;
  if (state.ownPlays[lane]) return false;
  state.ownPlays[lane] = state.ownHand.splice(idx, 1)[0];
  return true;
}

export function unplaceCard(state, lane) {
  if (state.phase !== 'placing') return false;
  const card = state.ownPlays[lane];
  if (!card) return false;
  state.ownPlays[lane] = null;
  state.ownHand.push(card);
  return true;
}

export function allPlaced(state) {
  return state.ownPlays.every(Boolean);
}

// Reveal: Vex commits (his tell was shown before), lanes resolve one by one.
export function revealLanes(state) {
  if (state.phase !== 'placing' || !allPlaced(state)) return null;
  const ai = choosePlays(state.rivalHand, state.mood, state.favouredLane, state.ownPlays, state.random);
  state.rivalPlays = ai.plays;
  state.tell = ai.tell;
  for (const card of ai.plays) {
    const i = state.rivalHand.findIndex((c) => c.id === card.id);
    if (i >= 0) state.rivalHand.splice(i, 1);
  }
  state.combo = comboBonus(state.ownPlays);
  state.rivalCombo = comboBonus(state.rivalPlays);
  if (state.combo.bonus > 0) state.combosMade += 1;

  const results = [];
  for (let lane = 0; lane < LANES; lane += 1) {
    const own = state.ownPlays[lane];
    const rival = state.rivalPlays[lane];
    const ownPower = lanePower(own, rival, state.combo);
    const rivalPower = lanePower(rival, own, state.rivalCombo);
    let damage = 0;
    let winner = 'tie';
    if (ownPower > rivalPower) {
      winner = 'you';
      damage = Math.max(1, ownPower - rivalPower);
      state.rivalLife = Math.max(0, state.rivalLife - damage);
      state.damageDealt += damage;
      state.lanesWon += 1;
    } else if (rivalPower > ownPower) {
      winner = 'vex';
      damage = Math.max(1, rivalPower - ownPower);
      state.ownLife = Math.max(0, state.ownLife - damage);
      state.damageTaken += damage;
    }
    results.push({ lane, ownPower, rivalPower, winner, damage });
  }
  state.phase = 'revealed';
  state.lastLog = `Round ${state.round} resolved — you dealt ${results.filter((r) => r.winner === 'you').reduce((s, r) => s + r.damage, 0)}, took ${results.filter((r) => r.winner === 'vex').reduce((s, r) => s + r.damage, 0)}.`;
  return results;
}

export function nextRound(state) {
  if (state.ownLife <= 0 || state.rivalLife <= 0) {
    state.phase = 'over';
    state.winner = state.ownLife <= 0 && state.rivalLife <= 0 ? 'draw'
      : state.rivalLife <= 0 ? 'you' : 'vex';
    return false;
  }
  if (state.round >= MAX_ROUNDS) {
    state.phase = 'over';
    state.winner = state.ownLife === state.rivalLife ? 'draw'
      : state.ownLife > state.rivalLife ? 'you' : 'vex';
    return false;
  }
  state.round += 1;
  startRound(state);
  return true;
}
