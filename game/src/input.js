// Pointer + keyboard input: converts canvas clicks and key presses into game
// actions. Hit-testing uses the same LAYOUT rects render.js draws, so a button
// never drifts from its drawing. The main loop pulls events from the queue.

import { LAYOUT, TOPPINGS, pointInRect } from './config.js';

export function createInput(canvas, onAction) {
  const queue = [];

  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }

  function ticketRect(i) {
    const t = LAYOUT.tickets;
    return { x: t.x + i * (t.cardW + t.gap), y: t.y, w: t.cardW, h: t.h };
  }

  function binRect(i) {
    // Bins are a 4 x 2 grid inside the bins panel.
    const b = LAYOUT.bins;
    const cw = (b.w - 32) / 4;
    const ch = (b.h - 56) / 2;
    const col = i % 4;
    const row = Math.floor(i / 4);
    return { x: b.x + 16 + col * cw + 4, y: b.y + 40 + row * ch + 4, w: cw - 8, h: ch - 8 };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPos(e);
    queue.push({ type: 'click', x: p.x, y: p.y });
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); queue.push({ type: 'serve' }); }
    else if (k === 'n') queue.push({ type: 'cook' });
    else if (k === 's') queue.push({ type: 'scoop' });
    else if (k === 'r') queue.push({ type: 'restart' });
    else if (k === 'p' || k === 'escape') queue.push({ type: 'pause' });
    else if (k === 'enter') queue.push({ type: 'confirm' });
    else {
      const t = TOPPINGS.find((x) => x.key === k);
      if (t) queue.push({ type: 'topping', id: t.id });
    }
  });

  // Resolve one raw click into a named action using the shared layout.
  function resolveClick(x, y, ticketCount) {
    for (let i = 0; i < ticketCount; i++) {
      if (pointInRect(x, y, ticketRect(i))) return { type: 'ticket', index: i };
    }
    if (pointInRect(x, y, LAYOUT.pot)) return { type: 'cook' };
    if (pointInRect(x, y, LAYOUT.bowl)) return { type: 'scoop' };
    if (pointInRect(x, y, LAYOUT.bell)) return { type: 'serve' };
    for (let i = 0; i < TOPPINGS.length; i++) {
      if (pointInRect(x, y, binRect(i))) return { type: 'topping', id: TOPPINGS[i].id };
    }
    if (pointInRect(x, y, LAYOUT.startButton)) return { type: 'confirm' };
    if (pointInRect(x, y, LAYOUT.restartButton)) return { type: 'restart' };
    return { type: 'noop' };
  }

  return {
    // Drain the queue, resolving clicks against the current ticket count.
    drain(ticketCount) {
      const out = [];
      while (queue.length) {
        const ev = queue.shift();
        if (ev.type === 'click') out.push(resolveClick(ev.x, ev.y, ticketCount));
        else out.push(ev);
      }
      return out;
    },
    binRect,
    ticketRect,
  };
}
