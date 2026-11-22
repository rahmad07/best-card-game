// ai.js — Vex, the Hollow Dealer. A readable opponent: every round he
// declares a mood and a favoured lane (his "tell") BEFORE you commit, then
// plays to it. Counter him by dodging his strong lane and stacking yours.
import { advantageBonus } from './suits.js';

export const MOODS = {
  bold: { label: 'BOLD', hint: 'plays his highest cards, suit advantage be damned' },
  patient: { label: 'PATIENT', hint: 'saves his best cards and plays low into your weak lanes' },
  cunning: { label: 'CUNNING', hint: 'hunts suit advantage — his strong suit meets your weak one' },
};

export function pickMood(round, random) {
  const moods = ['bold', 'patient', 'cunning'];
  // Early rounds lean bold, later rounds lean cunning — Vex learns.
  const weights = round <= 2 ? [0.5, 0.3, 0.2] : round <= 4 ? [0.3, 0.3, 0.4] : [0.2, 0.3, 0.5];
  const roll = random();
  let acc = 0;
  for (let i = 0; i < moods.length; i += 1) {
    acc += weights[i];
    if (roll <= acc) return moods[i];
  }
  return 'cunning';
}

export function pickFavouredLane(random) {
  return Math.floor(random() * 3);
}

// Choose 3 cards from Vex's hand and assign them to lanes 0..2.
// Returns { plays: [card, card, card], tell: string }.
export function choosePlays(hand, mood, favouredLane, ownPlays, random) {
  const pool = hand.slice();
  const byValue = (a, b) => b.value - a.value;
  const sorted = pool.slice().sort(byValue);
  const plays = [null, null, null];

  if (mood === 'bold') {
    // Highest cards first, strongest into the favoured lane.
    plays[favouredLane] = sorted[0];
    const rest = sorted.slice(1);
    let k = 0;
    for (let lane = 0; lane < 3; lane += 1) {
      if (!plays[lane]) plays[lane] = rest[k++];
    }
  } else if (mood === 'patient') {
    // Lowest cards into the favoured lane (a trap), best card held for a lane
    // the player left weak — approximated by the lane the player loaded least.
    const ascending = pool.slice().sort((a, b) => a.value - b.value);
    plays[favouredLane] = ascending[0];
    const rest = ascending.slice(1).sort(byValue);
    let k = 0;
    for (let lane = 0; lane < 3; lane += 1) {
      if (!plays[lane]) plays[lane] = rest[k++];
    }
  } else {
    // Cunning: for each lane, pick the card whose suit beats the player's
    // card there, if any; the strongest such card goes to the favoured lane.
    const remaining = pool.slice();
    const order = [favouredLane, ...[0, 1, 2].filter((l) => l !== favouredLane)];
    for (const lane of order) {
      const target = ownPlays[lane];
      let best = null;
      let bestScore = -1;
      for (const card of remaining) {
        const score = card.value + advantageBonus(card.suit, target.suit);
        if (score > bestScore) { bestScore = score; best = card; }
      }
      plays[lane] = best;
      remaining.splice(remaining.indexOf(best), 1);
    }
  }

  const moodText = MOODS[mood];
  const laneNames = ['Ember Gate', 'Tide Gate', 'Gale Gate'];
  const tell = `Vex is ${moodText.label} — ${moodText.hint}. He strengthens the ${laneNames[favouredLane]}.`;
  return { plays, tell };
}
