// main.js — bootstrap and input wiring for Sigil Clash.
// Mouse: click a card, then click a lane (or click a placed card to take it
// back). Keyboard: 1–5 pick a card, 1–3 drop it in a lane, Enter reveals.
import { newDuel, startRound, placeCard, unplaceCard, revealLanes, nextRound } from './engine.js';
import { renderAll, showLaneResults, showEnd } from './render.js';
import { applyShot, seededRandom } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7);
const random = shot ? seededRandom(seed) : Math.random;

let state;
let selectedId = null;
let justDealt = false;

function ui() {
  return {
    selectedId,
    justDealt,
    onCardClick: (cardId) => {
      if (state.phase !== 'placing') return;
      selectedId = selectedId === cardId ? null : cardId;
      renderAll(state, ui());
    },
  };
}

function refresh() {
  renderAll(state, ui());
}

function beginDuel() {
  state = newDuel(random);
  state.phase = 'placing';
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('endScreen').classList.add('hidden');
  selectedId = null;
  justDealt = true;
  startRound(state);
  state.tell = 'Vex is sizing you up… his tell appears once you place your cards.';
  refresh();
  window.setTimeout(() => { justDealt = false; refresh(); }, 400);
}

function onRevealOrNext() {
  if (state.phase === 'placing') {
    const results = revealLanes(state);
    if (!results) return;
    selectedId = null;
    refresh();
    showLaneResults(state, results);
  } else if (state.phase === 'revealed') {
    const continues = nextRound(state);
    if (!continues) {
      showEnd(state);
      refresh();
      return;
    }
    selectedId = null;
    justDealt = true;
    state.tell = 'Vex is sizing you up… his tell appears once you place your cards.';
    refresh();
    window.setTimeout(() => { justDealt = false; refresh(); }, 400);
  }
}

function laneClick(lane) {
  if (state.phase !== 'placing') return;
  if (state.ownPlays[lane]) {
    unplaceCard(state, lane);
    refresh();
    return;
  }
  if (selectedId === null) {
    state.lastLog = 'Pick a card from your hand first, then a lane.';
    refresh();
    return;
  }
  if (placeCard(state, selectedId, lane)) selectedId = null;
  refresh();
}

document.querySelectorAll('.lane').forEach((laneEl) => {
  laneEl.addEventListener('click', () => laneClick(Number(laneEl.dataset.lane)));
});

document.getElementById('revealBtn').addEventListener('click', onRevealOrNext);
document.getElementById('resetBtn').addEventListener('click', beginDuel);
document.getElementById('againBtn').addEventListener('click', beginDuel);
document.getElementById('startBtn').addEventListener('click', beginDuel);
document.getElementById('helpBtn').addEventListener('click', () => {
  document.getElementById('helpScreen').classList.remove('hidden');
});
document.getElementById('closeHelpBtn').addEventListener('click', () => {
  document.getElementById('helpScreen').classList.add('hidden');
});

document.addEventListener('keydown', (event) => {
  if (state.phase !== 'placing') {
    if (event.key === 'Enter') onRevealOrNext();
    return;
  }
  const n = Number(event.key);
  if (n >= 1 && n <= 3 && selectedId !== null) {
    // With a card selected, keys 1–3 drop it into that lane.
    laneClick(n - 1);
  } else if (n >= 1 && n <= 5 && state.ownHand[n - 1]) {
    selectedId = state.ownHand[n - 1].id;
    refresh();
  }
  if (event.key === 'Enter') onRevealOrNext();
});

// Screenshot presets (?shot=title|table|win|loss) render fixed states.
if (shot) {
  const shotState = applyShot(shot, seededRandom(seed));
  if (shotState) {
    state = shotState;
    if (shot === 'title') {
      document.getElementById('titleScreen').classList.remove('hidden');
    } else {
      document.getElementById('titleScreen').classList.add('hidden');
    }
    if (shot === 'win' || shot === 'loss') {
      if (state.lastResults) showLaneResults(state, state.lastResults);
      showEnd(state);
    }
    refresh();
  } else {
    beginDuel();
  }
} else {
  state = newDuel(random);
  state.lastLog = 'Three lanes. Five cards. One rival who telegraphs every move.';
  refresh();
}
