// Deterministic screenshot staging: ?shot=start | play | rush | serve (with
// &seed=N) builds a fixed world state so every screenshot is a real render of
// the game's own code, reproducible byte for byte. Time is frozen in shot mode.

import { RECIPES, SHIFT_SECONDS } from './config.js';
import { createWorld, spawnTicket } from './world.js';

function ticket(w, recipeId, patience) {
  const r = RECIPES.find((x) => x.id === recipeId);
  w.tickets.push({ id: 100 + w.tickets.length, recipeId: r.id, patience, maxPatience: 45, born: 0, state: 'waiting' });
}

export function applyShot(name, seed = 1) {
  const w = createWorld(seed);
  w.frozen = true;
  w.state = 'play';
  w.time = 42;
  w.shiftLeft = SHIFT_SECONDS - 42;
  if (name === 'start') {
    w.state = 'title';
    w.frozen = false;
    return w;
  }
  if (name === 'play') {
    // Mid-assembly: three tickets, pot with two nests (one ready), a bowl with
    // noodles and two toppings in, one finished bowl on the pass.
    ticket(w, 'ayam-kilat', 31);
    ticket(w, 'bakso-lava', 22);
    ticket(w, 'telur-matahari', 38);
    w.activeTicket = 0;
    w.pot = [{ t: 5.6, status: 'ready' }, { t: 2.1, status: 'cooking' }];
    w.bowl = { noodles: true, perfectNoodles: true, toppings: ['ayam', 'sawi'] };
    w.pass = [{ recipeName: 'Mie Sawi Segar', perfect: true }];
    w.coins = 8400;
    w.combo = 3;
    w.bestCombo = 5;
    w.served = 6;
    w.perfect = 4;
    return w;
  }
  if (name === 'rush') {
    // Dinner rush: four tickets, one nearly out of patience, pot full, combo hot.
    ticket(w, 'komplit-raja', 9);
    ticket(w, 'pedas-nampol', 17);
    ticket(w, 'ayam-kilat', 26);
    ticket(w, 'bakso-lava', 33);
    w.activeTicket = 0;
    w.wave = 2;
    w.time = 118;
    w.shiftLeft = SHIFT_SECONDS - 118;
    w.pot = [
      { t: 6.2, status: 'ready' },
      { t: 4.4, status: 'cooking' },
      { t: 8.6, status: 'ready' },
    ];
    w.bowl = { noodles: true, perfectNoodles: false, toppings: ['cabai', 'ayam'] };
    w.coins = 12600;
    w.combo = 5;
    w.bestCombo = 7;
    w.served = 11;
    w.perfect = 7;
    w.banner = { text: 'DINNER RUSH! Tahan sampai tutup!', t: 0.6, life: 2.4 };
    return w;
  }
  if (name === 'serve') {
    // The serve moment: a perfect bowl on the pass, bell rung, coins popping.
    ticket(w, 'telur-matahari', 28);
    ticket(w, 'sawi-segar', 36);
    w.activeTicket = 0;
    w.pot = [{ t: 3.0, status: 'cooking' }];
    w.bowl = { noodles: false, perfectNoodles: false, toppings: [] };
    w.pass = [
      { recipeName: 'Mie Ayam Kilat', perfect: true },
      { recipeName: 'Mie Bakso Lava', perfect: true },
    ];
    w.coins = 15250;
    w.combo = 6;
    w.bestCombo = 6;
    w.served = 13;
    w.perfect = 9;
    w.popups = [{ x: 1130, y: 490, text: 'PERFECT! +2.250', color: '#ffb020', t: 0.3, life: 1.4 }];
    return w;
  }
  return w;
}

export function shotFromUrl() {
  try {
    const q = new URLSearchParams(window.location.search);
    const shot = q.get('shot');
    if (!shot) return null;
    const seed = Number.parseInt(q.get('seed') || '1', 10) || 1;
    return { shot, seed };
  } catch {
    return null;
  }
}

// Keep spawnTicket referenced so tree-shaken builds do not drop it; the live
// game uses it, screenshots stage tickets directly.
export const _liveSpawn = spawnTicket;
