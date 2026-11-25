// MIE KILAT game state: tickets on the order rail, the noodle pot, the assembly
// bowl, the pass, coins and the shift clock. Pure logic — no drawing here, so the
// rules can be reasoned about (and screenshot-staged) without a canvas.

import {
  MAX_TICKETS, POT_BURN_AT, POT_MAX_NESTS, POT_PERFECT_FROM, POT_PERFECT_TO,
  RECIPES, SHIFT_SECONDS, SPAWN_PLAN, TICKET_PATIENCE,
} from './config.js';
import { mulberry32, pick } from './random.js';

let ticketSeq = 0;

export function createWorld(seed = 1) {
  return {
    seed,
    rng: mulberry32(seed),
    state: 'title', // title | play | end
    paused: false,
    frozen: false, // screenshot mode: time never advances
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    perfect: 0,
    missed: 0,
    tickets: [],
    activeTicket: -1,
    pot: [], // nests: { t, status: 'cooking' | 'ready' | 'burnt' }
    bowl: { noodles: false, perfectNoodles: false, toppings: [] },
    pass: [], // finished bowls waiting on the pass: { recipeName, perfect }
    popups: [], // { x, y, text, color, t, life }
    banner: null, // { text, t, life }
    spawnIn: 4,
    spawnGap: SPAWN_PLAN[0].gap,
    wave: 0, // 0 normal, 1 lunch rush, 2 dinner rush
    shake: 0,
    servedLog: [],
  };
}

export function spawnTicket(w) {
  if (w.tickets.length >= MAX_TICKETS) return false;
  const recipe = pick(w.rng, RECIPES);
  const id = ++ticketSeq;
  w.tickets.push({
    id,
    recipeId: recipe.id,
    patience: TICKET_PATIENCE,
    maxPatience: TICKET_PATIENCE,
    born: w.time,
    state: 'waiting',
  });
  if (w.activeTicket === -1) w.activeTicket = w.tickets.length - 1;
  return true;
}

export function setActiveTicket(w, idx) {
  if (idx >= 0 && idx < w.tickets.length) {
    w.activeTicket = idx;
    return true;
  }
  return false;
}

export function activeTicket(w) {
  return w.tickets[w.activeTicket] ?? null;
}

// Drop a noodle nest into the pot. Returns 'ok' | 'full' | 'no-state'.
export function cookNoodles(w) {
  if (w.state !== 'play') return 'no-state';
  if (w.pot.length >= POT_MAX_NESTS) return 'full';
  w.pot.push({ t: 0, status: 'cooking' });
  return 'ok';
}

function nestStatus(t) {
  if (t >= POT_BURN_AT) return 'burnt';
  if (t >= POT_PERFECT_FROM) return 'ready';
  return 'cooking';
}

// Scoop the best ready nest into the bowl. Returns 'ok' | 'not-ready' | 'bowl-full'.
export function scoopNoodles(w) {
  if (w.state !== 'play') return 'no-state';
  if (w.bowl.noodles) return 'bowl-full';
  const idx = w.pot.findIndex((n) => n.status === 'ready');
  if (idx === -1) return 'not-ready';
  const nest = w.pot.splice(idx, 1)[0];
  w.bowl.noodles = true;
  w.bowl.perfectNoodles = nest.t <= POT_PERFECT_TO;
  return 'ok';
}

// Add one topping to the bowl. Returns 'ok' | 'dup' | 'no-noodles' | 'full'.
export function addTopping(w, id) {
  if (w.state !== 'play') return 'no-state';
  if (!w.bowl.noodles) return 'no-noodles';
  if (w.bowl.toppings.includes(id)) return 'dup';
  const ticket = activeTicket(w);
  const want = ticket ? RECIPES.find((r) => r.id === ticket.recipeId).toppings.length : 4;
  if (w.bowl.toppings.length >= want + 1) return 'full';
  w.bowl.toppings.push(id);
  return 'ok';
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  return a.every((x) => b.includes(x));
}

// Ring the bell: serve the active bowl to the active ticket.
// Returns { result, coins } where result is 'perfect' | 'ok' | 'no-noodles' | 'no-ticket'.
export function serveActive(w) {
  if (w.state !== 'play') return { result: 'no-state', coins: 0 };
  const ticket = activeTicket(w);
  if (!ticket) return { result: 'no-ticket', coins: 0 };
  if (!w.bowl.noodles) return { result: 'no-noodles', coins: 0 };
  const recipe = RECIPES.find((r) => r.id === ticket.recipeId);
  const exact = sameSet(w.bowl.toppings, recipe.toppings) && w.bowl.perfectNoodles;
  const patienceFrac = Math.max(0, ticket.patience / ticket.maxPatience);
  let earned;
  let result;
  if (exact) {
    w.combo += 1;
    w.bestCombo = Math.max(w.bestCombo, w.combo);
    w.perfect += 1;
    earned = Math.round(recipe.price * 1.5 * (1 + 0.1 * Math.min(w.combo - 1, 5)) + 500 * patienceFrac);
    result = 'perfect';
  } else {
    w.combo = 0;
    earned = Math.round(recipe.price * 0.6 + 200 * patienceFrac);
    result = 'ok';
  }
  w.coins += earned;
  w.served += 1;
  w.pass.push({ recipeName: recipe.name, perfect: exact });
  if (w.pass.length > 3) w.pass.shift();
  w.servedLog.push({ recipe: recipe.name, result, coins: earned });
  w.tickets.splice(w.activeTicket, 1);
  w.activeTicket = w.tickets.length ? 0 : -1;
  w.bowl = { noodles: false, perfectNoodles: false, toppings: [] };
  return { result, coins: earned };
}

export function startShift(w) {
  w.state = 'play';
  w.time = 0;
  w.shiftLeft = SHIFT_SECONDS;
  w.spawnIn = 3;
  spawnTicket(w);
  spawnTicket(w);
}

export function restart(w) {
  const seed = w.seed;
  const fresh = createWorld(seed);
  Object.keys(fresh).forEach((k) => { w[k] = fresh[k]; });
  startShift(w);
}

function addPopup(w, x, y, text, color) {
  w.popups.push({ x, y, text, color, t: 0, life: 1.4 });
  if (w.popups.length > 8) w.popups.shift();
}

export function updateWorld(w, dt) {
  if (w.state !== 'play' || w.paused || w.frozen) return;
  w.time += dt;
  w.shiftLeft = Math.max(0, SHIFT_SECONDS - w.time);
  if (w.shake > 0) w.shake = Math.max(0, w.shake - dt * 3);

  // Rush waves tighten spawns and flash a banner once.
  const plan = SPAWN_PLAN.filter((p) => w.time >= p.at).pop();
  w.spawnGap = plan.gap;
  const wave = w.time >= 105 ? 2 : w.time >= 55 ? 1 : 0;
  if (wave !== w.wave) {
    w.wave = wave;
    w.banner = {
      text: wave === 1 ? 'LUNCH RUSH! Pesanan makin cepat!' : 'DINNER RUSH! Tahan sampai tutup!',
      t: 0, life: 2.4,
    };
  }

  // Spawn tickets on schedule.
  w.spawnIn -= dt;
  if (w.spawnIn <= 0) {
    if (spawnTicket(w)) w.spawnIn = w.spawnGap;
    else w.spawnIn = 2;
  }

  // Patience drains; an expired ticket is lost and breaks the combo.
  for (let i = w.tickets.length - 1; i >= 0; i--) {
    const t = w.tickets[i];
    t.patience -= dt;
    if (t.patience <= 0) {
      const recipe = RECIPES.find((r) => r.id === t.recipeId);
      addPopup(w, 640, 150, `Hangus! ${recipe.name} kabur`, '#e23b2e');
      w.tickets.splice(i, 1);
      w.missed += 1;
      w.combo = 0;
      if (w.activeTicket >= w.tickets.length) w.activeTicket = w.tickets.length - 1;
    }
  }
  if (w.activeTicket === -1 && w.tickets.length) w.activeTicket = 0;

  // Pot nests cook and burn.
  for (const nest of w.pot) {
    nest.t += dt;
    const s = nestStatus(nest.t);
    if (s !== nest.status) {
      nest.status = s;
      if (s === 'burnt') addPopup(w, 198, 300, 'Mie gosong!', '#e23b2e');
    }
  }

  // Popups and banners age out.
  for (const p of w.popups) p.t += dt;
  w.popups = w.popups.filter((p) => p.t < p.life);
  if (w.banner) {
    w.banner.t += dt;
    if (w.banner.t >= w.banner.life) w.banner = null;
  }

  // Shift over: end of day.
  if (w.shiftLeft <= 0) {
    w.state = 'end';
    w.banner = null;
  }
}
