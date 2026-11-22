// shots.js — deterministic screenshot states, driven by ?shot= in the URL.
// The game itself is unchanged: these presets only set up a fixed table so
// the maker can capture real renders of the game's own code.
import { newDuel, startRound, placeCard, revealLanes } from './engine.js';

// A fixed shuffle so every screenshot run looks the same.
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Apply a ?shot= preset to a fresh duel. Returns the state, or null.
export function applyShot(shot, random) {
  if (!shot) return null;
  const state = newDuel(random);
  if (shot === 'title') {
    state.phase = 'title';
    state.lastLog = 'Three lanes. Five cards. One rival who telegraphs every move.';
    return state;
  }
  startRound(state);
  // Fixed opening plays: a surge-ready hand for the table shot.
  if (shot === 'table') {
    state.tell = 'Vex is CUNNING — hunts suit advantage. He strengthens the Tide Gate.';
    // Place three cards, one per lane, leaving two in hand.
    const picks = [state.ownHand[0], state.ownHand[1], state.ownHand[2]];
    picks.forEach((card, lane) => placeCard(state, card.id, lane));
    return state;
  }
  if (shot === 'win' || shot === 'loss') {
    const picks = [state.ownHand[0], state.ownHand[1], state.ownHand[2]];
    picks.forEach((card, lane) => placeCard(state, card.id, lane));
    state.lastResults = revealLanes(state);
    if (shot === 'win') {
      state.rivalLife = 0;
      state.ownLife = 14;
      state.winner = 'you';
    } else {
      state.ownLife = 0;
      state.rivalLife = 9;
      state.winner = 'vex';
    }
    state.phase = 'over';
    state.lanesWon = shot === 'win' ? 7 : 2;
    state.damageDealt = shot === 'win' ? 23 : 8;
    state.damageTaken = shot === 'win' ? 6 : 21;
    state.combosMade = 2;
    return state;
  }
  return null;
}
