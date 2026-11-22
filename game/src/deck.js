// deck.js — builds, shuffles and deals the 24-card sigil decks.
// Each deck: four suits, values 1–9, with the weakest two cards of each suit
// trimmed so every draw matters. One deck per duelist, same composition.
import { SUIT_KEYS } from './suits.js';

export const DECK_SIZE = 24;
export const HAND_SIZE = 5;

export function buildDeck() {
  const deck = [];
  let id = 0;
  for (const suit of SUIT_KEYS) {
    // Values 4–9 for every suit: 6 cards x 4 suits = 24.
    for (let value = 4; value <= 9; value += 1) {
      deck.push({ id: id++, suit, value });
    }
  }
  return deck;
}

export function shuffleDeck(deck, random) {
  const shuffled = deck.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawUpTo(deck, hand, count) {
  while (hand.length < count && deck.length > 0) hand.push(deck.pop());
  return hand;
}
