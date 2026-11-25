// MIE KILAT — Lightning Noodles. Shared constants: board size, palette, toppings,
// recipes, timers and the clickable layout. Every other module reads from here so the
// kitchen, the input zones and the renderer always agree on where things are.

export const W = 1280;
export const H = 800;

// Warm night-market palette: dark wood, amber lamps, chalk-white ticket paper.
export const COLORS = {
  bg: '#221610',
  bg2: '#2e1d13',
  counter: '#7a4a26',
  counterTop: '#a06a38',
  board: '#f6ead0',
  boardInk: '#2b1c10',
  amber: '#ffb020',
  amberDark: '#c47f00',
  red: '#e23b2e',
  green: '#57b25e',
  cream: '#fff3d6',
  steel: '#3d3a44',
  pot: '#4a4a55',
  steam: 'rgba(255,255,255,0.55)',
};

// Toppings live in bins on the counter. Each has a draw colour and a short label;
// render.js draws each one as its own little vector shape (no emoji, no images).
export const TOPPINGS = [
  { id: 'ayam', name: 'Ayam', color: '#e8a34c', dark: '#a86a1e', key: '1' },
  { id: 'bakso', name: 'Bakso', color: '#c98d5f', dark: '#7d4f28', key: '2' },
  { id: 'telur', name: 'Telur', color: '#ffd94d', dark: '#c99a12', key: '3' },
  { id: 'sawi', name: 'Sawi', color: '#57b25e', dark: '#2c6b31', key: '4' },
  { id: 'cabai', name: 'Cabai', color: '#e23b2e', dark: '#8f1d14', key: '5' },
  { id: 'bawang', name: 'Bawang', color: '#f2e3c2', dark: '#b39a6a', key: '6' },
  { id: 'kerupuk', name: 'Kerupuk', color: '#f7c873', dark: '#c98f2e', key: '7' },
];

export const toppingById = (id) => TOPPINGS.find((t) => t.id === id);

// Recipes: what a ticket asks for. noodles are always the base; the list is the
// toppings the bowl must carry. price is the base payout in coins.
export const RECIPES = [
  { id: 'ayam-kilat', name: 'Mie Ayam Kilat', toppings: ['ayam', 'sawi', 'bawang'], price: 1400 },
  { id: 'bakso-lava', name: 'Mie Bakso Lava', toppings: ['bakso', 'cabai', 'bawang'], price: 1600 },
  { id: 'telur-matahari', name: 'Mie Telur Matahari', toppings: ['telur', 'sawi', 'kerupuk'], price: 1500 },
  { id: 'komplit-raja', name: 'Mie Komplit Raja', toppings: ['ayam', 'bakso', 'telur', 'cabai'], price: 2200 },
  { id: 'sawi-segar', name: 'Mie Sawi Segar', toppings: ['sawi', 'bawang', 'kerupuk'], price: 1200 },
  { id: 'pedas-nampol', name: 'Mie Pedas Nampol', toppings: ['cabai', 'ayam', 'telur'], price: 1800 },
];

export const recipeById = (id) => RECIPES.find((r) => r.id === id);

// Pot: a nest is perfect between PERFECT_FROM and PERFECT_TO seconds, burnt after BURN_AT.
export const POT_PERFECT_FROM = 5;
export const POT_PERFECT_TO = 7;
export const POT_BURN_AT = 9;
export const POT_MAX_NESTS = 3;

export const SHIFT_SECONDS = 150;
export const TICKET_PATIENCE = 45;
export const MAX_TICKETS = 4;

// Spawn schedule: [shiftSecond, gapSeconds] — the rush waves tighten the gap.
export const SPAWN_PLAN = [
  { at: 0, gap: 13 },
  { at: 55, gap: 9 }, // lunch rush
  { at: 105, gap: 7 }, // dinner rush
];

// Clickable layout, in canvas pixels. render.js draws to these rects; input.js
// hit-tests against them, so a button never drifts from its drawing.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  tickets: { x: 24, y: 76, w: 1232, h: 96, cardW: 296, gap: 16 },
  // The chef stands in the x 48–180 column; the pot shifts right to make room.
  pot: { x: 180, y: 216, w: 300, h: 260 },
  potNest: { x: 210, y: 300, w: 240, h: 120 },
  bowl: { x: 480, y: 216, w: 320, h: 260 },
  bins: { x: 852, y: 216, w: 380, h: 260 },
  pass: { x: 48, y: 500, w: 752, h: 140 },
  bell: { x: 1064, y: 500, w: 168, h: 140 },
  bottomBar: { x: 0, y: 664, w: 1280, h: 136 },
  startButton: { x: 490, y: 520, w: 300, h: 72 },
  restartButton: { x: 490, y: 560, w: 300, h: 72 },
  dumpButton: { x: 704, y: 224, w: 88, h: 24 },
};

// Centre of pot nest i (radius 40). render.js draws here; input.js hit-tests here.
export function nestCenter(i) {
  return { x: LAYOUT.potNest.x + 40 + i * 78, y: LAYOUT.potNest.y + 52 };
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtCoins(n) {
  return n.toLocaleString('en-US');
}
