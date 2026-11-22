// render.js — turns duel state into DOM: cards that slide, flip and snap,
// life bars, lane results, combo banners and the end screens.
import { SUITS } from './suits.js';
import { MAX_LIFE, MAX_ROUNDS } from './engine.js';

export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function cardNode(card, opts = {}) {
  const node = el('div', `card ${card.suit}`);
  if (opts.facedown) {
    node.classList.add('facedown');
    node.appendChild(el('div', 'pip', '✦'));
    return node;
  }
  const suit = SUITS[card.suit];
  const corner = el('div', 'corner', String(card.value));
  corner.appendChild(el('small', null, suit.glyph));
  node.appendChild(corner);
  node.appendChild(el('div', 'pip', suit.glyph));
  node.appendChild(el('div', 'suitName', suit.name));
  node.appendChild(el('div', 'cost', `PWR ${card.value}`));
  if (opts.power !== undefined) {
    node.appendChild(el('div', 'powerTag', `⚡ ${opts.power}`));
  }
  if (opts.selected) node.classList.add('selected');
  if (opts.played) node.classList.add('played');
  if (opts.flip) node.classList.add('flip');
  if (opts.dealt) node.classList.add('dealt');
  node.dataset.cardId = String(card.id);
  return node;
}

export function renderAll(state, ui) {
  document.getElementById('roundBadge').textContent = `ROUND ${state.round} / ${MAX_ROUNDS}`;
  document.getElementById('log').textContent = state.lastLog;

  // Life bars
  const ownLife = document.getElementById('ownLife');
  const rivalLife = document.getElementById('rivalLife');
  ownLife.textContent = String(state.ownLife);
  rivalLife.textContent = String(state.rivalLife);
  document.getElementById('ownLifeFill').style.width = `${(state.ownLife / MAX_LIFE) * 100}%`;
  document.getElementById('rivalLifeFill').style.width = `${(state.rivalLife / MAX_LIFE) * 100}%`;

  // Scores
  document.getElementById('lanesWon').textContent = String(state.lanesWon);
  document.getElementById('dmgDealt').textContent = String(state.damageDealt);
  document.getElementById('combosMade').textContent = String(state.combosMade);

  // Vex tell + hidden hand
  document.getElementById('rivalTell').textContent = state.tell
    || 'Vex is watching… place your cards, then reveal.';
  const rivalHand = document.getElementById('rivalHand');
  rivalHand.innerHTML = '';
  for (let i = 0; i < state.rivalHand.length; i += 1) {
    rivalHand.appendChild(el('div', 'miniCard', '✦'));
  }

  // Lanes
  document.querySelectorAll('.lane').forEach((laneEl) => {
    const lane = Number(laneEl.dataset.lane);
    laneEl.classList.toggle('hot', state.favouredLane === lane && state.phase === 'placing');
    const ownSlot = laneEl.querySelector('.ownSlot');
    const rivalSlot = laneEl.querySelector('.rivalSlot');
    ownSlot.innerHTML = '';
    rivalSlot.innerHTML = '';
    const own = state.ownPlays[lane];
    const rival = state.rivalPlays[lane];
    if (own) {
      ownSlot.appendChild(cardNode(own));
    }
    if (rival) {
      if (state.phase === 'revealed' || state.phase === 'over') {
        rivalSlot.appendChild(cardNode(rival, { flip: true }));
      } else {
        rivalSlot.appendChild(cardNode(rival, { facedown: true }));
      }
    } else if (state.phase === 'placing' && own) {
      // Vex answers your placement with a face-down card of his own.
      const back = el('div', 'card facedown');
      back.appendChild(el('div', 'pip', '✦'));
      rivalSlot.appendChild(back);
    }
    const result = laneEl.querySelector('.laneResult');
    result.textContent = '';
    result.classList.remove('lose');
  });

  // Player hand
  const hand = document.getElementById('hand');
  hand.innerHTML = '';
  for (const card of state.ownHand) {
    const node = cardNode(card, { selected: ui.selectedId === card.id, dealt: ui.justDealt });
    node.addEventListener('click', () => ui.onCardClick(card.id));
    hand.appendChild(node);
  }

  // Combo banner
  const banner = document.getElementById('comboBanner');
  banner.textContent = state.combo.name || '';
  banner.classList.remove('pop');
  if (state.combo.name) {
    void banner.offsetWidth;
    banner.classList.add('pop');
  }

  // Reveal button
  const revealBtn = document.getElementById('revealBtn');
  if (state.phase === 'placing') {
    revealBtn.disabled = !state.ownPlays.every(Boolean);
    revealBtn.textContent = state.ownPlays.every(Boolean)
      ? '⚔ REVEAL THE LANES' : 'PLACE A CARD IN EACH LANE';
  } else if (state.phase === 'revealed') {
    revealBtn.disabled = false;
    revealBtn.textContent = state.round >= MAX_ROUNDS || state.ownLife <= 0 || state.rivalLife <= 0
      ? '🏆 SEE THE RESULT' : '➜ NEXT ROUND';
  } else {
    revealBtn.disabled = true;
    revealBtn.textContent = '⚔ REVEAL THE LANES';
  }
}

export function showLaneResults(state, results) {
  for (const r of results) {
    const laneEl = document.querySelector(`.lane[data-lane="${r.lane}"]`);
    const result = laneEl.querySelector('.laneResult');
    const ownSlot = laneEl.querySelector('.ownSlot .card');
    const rivalSlot = laneEl.querySelector('.rivalSlot .card');
    if (ownSlot) ownSlot.appendChild(el('div', 'powerTag', `⚡ ${r.ownPower}`));
    if (rivalSlot) rivalSlot.appendChild(el('div', 'powerTag', `⚡ ${r.rivalPower}`));
    if (r.winner === 'you') {
      result.textContent = `YOU WIN THE LANE −${r.damage} ❤`;
    } else if (r.winner === 'vex') {
      result.textContent = `VEX TAKES THE LANE −${r.damage} ❤`;
      result.classList.add('lose');
    } else {
      result.textContent = 'TIE — NO DAMAGE';
    }
  }
}

export function showEnd(state) {
  const screen = document.getElementById('endScreen');
  const title = document.getElementById('endTitle');
  const kicker = document.getElementById('endKicker');
  const sub = document.getElementById('endSub');
  const stats = document.getElementById('endStats');
  const lines = `Final life — You ${state.ownLife} ❤ · Vex ${state.rivalLife} ❤ · `
    + `Lanes won ${state.lanesWon} · Damage dealt ${state.damageDealt} · Damage taken ${state.damageTaken} · Combos ${state.combosMade}`;
  if (state.winner === 'you') {
    title.textContent = 'VICTORY';
    title.classList.remove('lose');
    kicker.textContent = 'THE SPIRE IS YOURS';
    sub.textContent = 'Vex folds his hand. The three lanes bow to the Warden.';
    stats.textContent = lines;
  } else if (state.winner === 'vex') {
    title.textContent = 'DEFEAT';
    title.classList.add('lose');
    kicker.textContent = 'THE HOLLOW DEALER PREVAILS';
    sub.textContent = 'Vex sweeps the sigils off the table. Study his tells — and duel again.';
    stats.textContent = lines;
  } else {
    title.textContent = 'A DRAW';
    title.classList.remove('lose');
    kicker.textContent = 'NEITHER SIGIL YIELDS';
    sub.textContent = 'Six rounds, and the Spire cannot choose. One more duel will settle it.';
    stats.textContent = lines;
  }
  screen.classList.remove('hidden');
}
