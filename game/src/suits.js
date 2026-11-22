// suits.js — the four sigil suits, their advantage cycle and combo rules.
// Suits are told apart by colour AND shape, never by text alone.
export const SUITS = {
  ember: { key: 'ember', name: 'EMBER', glyph: '🔥', color: '#c22e2e', beats: 'gale', weakTo: 'tide' },
  gale: { key: 'gale', name: 'GALE', glyph: '🍃', color: '#1e7a34', beats: 'tide', weakTo: 'ember' },
  tide: { key: 'tide', name: 'TIDE', glyph: '💧', color: '#1d5fa8', beats: 'ember', weakTo: 'gale' },
  stone: { key: 'stone', name: 'STONE', glyph: '🪨', color: '#8a6d1f', beats: null, weakTo: null },
};

export const SUIT_KEYS = ['ember', 'gale', 'tide', 'stone'];

// Advantage bonus: +3 when your suit beats the rival suit in the same lane.
// Stone beats nothing and nothing beats Stone; Stone always adds +1 instead.
export function advantageBonus(ownSuit, rivalSuit) {
  if (ownSuit === 'stone') return 1;
  if (rivalSuit === 'stone') return 0;
  return SUITS[ownSuit].beats === rivalSuit ? 3 : 0;
}

// Combos across the three cards you played this round.
// surge: all three the same suit -> +3 each. run: values consecutive -> +2 each.
// pair: two share a value -> +1 each. Only the best combo applies.
export function comboBonus(cards) {
  if (cards.length !== 3) return { bonus: 0, name: '' };
  const suits = cards.map((c) => c.suit);
  const values = cards.map((c) => c.value).sort((a, b) => a - b);
  if (suits[0] === suits[1] && suits[1] === suits[2]) {
    return { bonus: 3, name: '✦ SIGIL SURGE — same suit, +3 each ✦' };
  }
  if (values[1] === values[0] + 1 && values[2] === values[1] + 1) {
    return { bonus: 2, name: '✦ HARMONY — run of three, +2 each ✦' };
  }
  if (values[0] === values[1] || values[1] === values[2]) {
    return { bonus: 1, name: '✦ PAIR — matched values, +1 each ✦' };
  }
  return { bonus: 0, name: '' };
}

// Final lane power of one card: value + suit advantage + combo bonus.
export function lanePower(card, rivalCard, combo) {
  return card.value + advantageBonus(card.suit, rivalCard.suit) + combo.bonus;
}
