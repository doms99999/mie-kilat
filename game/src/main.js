// MIE KILAT — entry point. Boots the canvas, owns the game loop and turns raw
// input events into world actions. The world stays pure logic; the renderer stays
// pure drawing; this file is the only place the two meet.

import { H, W } from './config.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { sfx } from './audio.js';
import { applyShot, shotFromUrl } from './shots.js';
import {
  activeTicket, addTopping, cookNoodles, createWorld, restart, scoopNoodles,
  serveActive, setActiveTicket, startShift, updateWorld,
} from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const shot = shotFromUrl();
const world = shot ? applyShot(shot.shot, shot.seed) : createWorld(1);

const input = createInput(canvas, null);
window.__game = { world };

function popup(text, color, x = 1148, y = 470) {
  world.popups.push({ x, y, text, color, t: 0, life: 1.4 });
  if (world.popups.length > 8) world.popups.shift();
}

function handleAction(a) {
  if (world.state === 'title') {
    if (a.type === 'confirm') {
      sfx('ding');
      startShift(world);
    }
    return;
  }
  if (world.state === 'end') {
    if (a.type === 'restart' || a.type === 'confirm') {
      sfx('ding');
      restart(world);
    }
    return;
  }
  // Playing.
  if (a.type === 'pause') {
    world.paused = !world.paused;
    sfx('click');
    return;
  }
  if (a.type === 'restart') {
    sfx('ding');
    restart(world);
    return;
  }
  if (world.paused) return;
  if (a.type === 'ticket') {
    if (setActiveTicket(world, a.index)) sfx('click');
    return;
  }
  if (a.type === 'cook') {
    const r = cookNoodles(world);
    if (r === 'ok') sfx('sizzle');
    else sfx('bad');
    return;
  }
  if (a.type === 'scoop') {
    const r = scoopNoodles(world);
    if (r === 'ok') sfx('pop');
    else sfx('bad');
    return;
  }
  if (a.type === 'topping') {
    const r = addTopping(world, a.id);
    if (r === 'ok') sfx('click');
    else sfx('bad');
    return;
  }
  if (a.type === 'serve') {
    const out = serveActive(world);
    if (out.result === 'perfect') {
      sfx('ding');
      sfx('coin');
      popup(`PERFECT! +${out.coins.toLocaleString('en-US')}`, '#ffb020');
    } else if (out.result === 'ok') {
      sfx('coin');
      popup(`Tersaji +${out.coins.toLocaleString('en-US')}`, '#57b25e');
    } else if (out.result === 'no-noodles') {
      world.shake = 1;
      sfx('bad');
      popup('Mangkuk masih kosong!', '#e23b2e', 610, 300);
    } else if (out.result === 'no-ticket') {
      sfx('bad');
    }
    return;
  }
}

let last = performance.now();
function frame(nowMs) {
  const now = nowMs / 1000;
  let dt = Math.min(0.05, (nowMs - last) / 1000);
  last = nowMs;
  if (Number.isNaN(dt) || dt < 0) dt = 0;
  for (const a of input.drain(world.tickets.length)) handleAction(a);
  updateWorld(world, dt);
  render(ctx, world, now);
  requestAnimationFrame(frame);
}

canvas.width = W;
canvas.height = H;
requestAnimationFrame(frame);
