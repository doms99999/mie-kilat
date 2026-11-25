// MIE KILAT renderer: every pixel of the kitchen, drawn on one canvas with plain
// vector shapes — no images, no fonts to load, so the game looks identical in any
// browser and in the headless screenshots. Layout comes from config.js; state
// comes from world.js; nothing here mutates the world.

import {
  COLORS, H, LAYOUT, POT_BURN_AT, POT_PERFECT_FROM, POT_PERFECT_TO, RECIPES,
  TOPPINGS, W, fmtCoins, fmtTime, nestCenter, recipeById, toppingById,
} from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// One topping's little vector icon, drawn at (cx, cy) with radius r.
export function drawToppingIcon(ctx, id, cx, cy, r) {
  const t = toppingById(id);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = t.color;
  ctx.strokeStyle = t.dark;
  ctx.lineWidth = 2;
  if (id === 'ayam') {
    ctx.beginPath(); ctx.ellipse(0, 2, r, r * 0.72, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.35, r * 0.45, r * 0.3, 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'bakso') {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.3, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'telur') {
    ctx.fillStyle = '#fff8e8';
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.85, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = t.color;
    ctx.beginPath(); ctx.arc(r * 0.15, 0, r * 0.5, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sawi') {
    ctx.fillStyle = t.color;
    for (const a of [-0.5, 0.1, 0.7]) {
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, r * 0.55, r * 0.28, a, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'cabai') {
    ctx.strokeStyle = t.color; ctx.lineWidth = r * 0.55; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.8, 0.35, Math.PI * 0.85); ctx.stroke();
    ctx.strokeStyle = '#2c6b31'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.75); ctx.lineTo(r * 0.95, -r * 1.05); ctx.stroke();
  } else if (id === 'bawang') {
    ctx.fillStyle = t.color;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.ellipse(-r * 0.5 + i * r * 0.25, (i % 2 ? -1 : 1) * r * 0.25, r * 0.22, r * 0.12, i, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'kerupuk') {
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rad = r * (i % 2 === 0 ? 0.95 : 0.7);
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = t.dark;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawTicket(ctx, t, x, y, w, h, active, now) {
  const recipe = recipeById(t.recipeId);
  ctx.save();
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = COLORS.board;
  ctx.fill();
  if (active) {
    ctx.lineWidth = 4; ctx.strokeStyle = COLORS.amber; ctx.stroke();
    rr(ctx, x + w - 66, y + 8, 56, 20, 6);
    ctx.fillStyle = COLORS.amber; ctx.fill();
    text(ctx, 'AKTIF', x + w - 38, y + 18, 11, COLORS.boardInk, 'bold', 'center');
  } else {
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(43,28,16,0.25)'; ctx.stroke();
  }
  text(ctx, `#${t.id} ${recipe.name}`, x + 12, y + 20, 17, COLORS.boardInk);
  text(ctx, `${fmtCoins(recipe.price)} koin`, x + 12, y + 42, 13, '#7a5a2e');
  // Topping dots the ticket asks for.
  recipe.toppings.forEach((id, i) => {
    drawToppingIcon(ctx, id, x + 26 + i * 34, y + 68, 12);
  });
  // Patience bar.
  const frac = Math.max(0, t.patience / t.maxPatience);
  const bw = w - 24;
  ctx.fillStyle = 'rgba(43,28,16,0.2)';
  rr(ctx, x + 12, y + h - 16, bw, 8, 4); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? COLORS.green : frac > 0.25 ? COLORS.amber : COLORS.red;
  if (frac > 0) { rr(ctx, x + 12, y + h - 16, bw * frac, 8, 4); ctx.fill(); }
  if (frac <= 0.25) {
    // Urgent tickets shout: solid red label on a dark pill so it never
    // vanishes at capture time (was a pulsing alpha before).
    ctx.font = 'bold 12px system-ui, sans-serif';
    const label = 'CEPAT!';
    const lw = ctx.measureText(label).width + 12;
    rr(ctx, x + w - 14 - lw, y + h - 15, lw, 13, 4);
    ctx.fillStyle = 'rgba(20,8,6,0.85)'; ctx.fill();
    text(ctx, label, x + w - 14 - 6, y + h - 8, 12, '#ff6a5a', 'bold', 'right');
  }
  ctx.restore();
}

function drawPot(ctx, w, now) {
  const p = LAYOUT.pot;
  ctx.save();
  text(ctx, 'PANCI MIE  —  klik untuk masak (N)', p.x + 8, p.y + 18, 14, COLORS.cream);
  // Pot body.
  rr(ctx, p.x + 24, p.y + 44, p.w - 48, 150, 18);
  ctx.fillStyle = COLORS.pot; ctx.fill();
  ctx.strokeStyle = '#2a2a33'; ctx.lineWidth = 3; ctx.stroke();
  // Water surface.
  ctx.fillStyle = '#7fb3c8';
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 62, (p.w - 64) / 2, 16, 0, 0, Math.PI * 2); ctx.fill();
  // Steam wisps.
  ctx.fillStyle = COLORS.steam;
  for (let i = 0; i < 3; i++) {
    const sx = p.x + 90 + i * 60 + Math.sin(now * 1.5 + i * 2) * 8;
    const sy = p.y + 40 - ((now * 22 + i * 26) % 34);
    ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.arc(sx, sy, 9 + (i % 2) * 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Nests with cook rings.
  const nest = LAYOUT.potNest;
  if (w.pot.length === 0) {
    text(ctx, 'Panci kosong — klik untuk masukkan mie', p.x + p.w / 2, nest.y + nest.h / 2, 14, '#cbb9a3', 'bold', 'center');
  }
  w.pot.forEach((n, i) => {
    const c = nestCenter(i);
    const cx = c.x;
    const cy = c.y;
    const col = n.status === 'ready' ? COLORS.green : n.status === 'burnt' ? '#3a2a22' : COLORS.amber;
    // Noodle nest: wavy strokes.
    ctx.strokeStyle = n.status === 'burnt' ? '#241812' : '#f2c14e';
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy + k * 12);
      ctx.bezierCurveTo(cx - 10, cy + k * 12 - 8, cx + 10, cy + k * 12 + 8, cx + 26, cy + k * 12);
      ctx.stroke();
    }
    // Progress ring.
    const frac = Math.min(1, n.t / POT_BURN_AT);
    ctx.strokeStyle = col; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, cy, 40, -Math.PI / 2 + frac * Math.PI * 2, Math.PI * 1.5); ctx.stroke();
    const label = n.status === 'ready' ? 'SIAP!' : n.status === 'burnt' ? 'GOSONG' : `${Math.ceil(POT_PERFECT_FROM - n.t)}s`;
    text(ctx, label, cx, cy + 56, 12, n.status === 'burnt' ? '#ff9a8a' : COLORS.cream, 'bold', 'center');
  });
  // One shared hint when any nest is ready, under the nests — never per-nest.
  if (w.pot.some((n) => n.status === 'ready')) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 5);
    text(ctx, 'SIAP! Klik mangkuk untuk angkat', p.x + p.w / 2, nest.y + nest.h + 6, 13, COLORS.green, 'bold', 'center');
    ctx.globalAlpha = 1;
  }
  // Perfect window hint.
  text(ctx, `Jendela sempurna ${POT_PERFECT_FROM}–${POT_PERFECT_TO} dtk • gosong ${POT_BURN_AT} dtk`, p.x + 8, p.y + p.h - 14, 12, '#cbb9a3');
  ctx.restore();
}

function drawBowl(ctx, w) {
  const b = LAYOUT.bowl;
  ctx.save();
  text(ctx, 'MEJA RACIK', b.x + 8, b.y + 18, 14, COLORS.cream);
  // Counter slab.
  rr(ctx, b.x, b.y + 40, b.w, 170, 14);
  ctx.fillStyle = COLORS.counterTop; ctx.fill();
  ctx.strokeStyle = '#5d3418'; ctx.lineWidth = 3; ctx.stroke();
  const cx = b.x + b.w / 2;
  const cy = b.y + 128;
  if (!w.bowl.noodles) {
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = 'rgba(255,243,214,0.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'Mangkuk kosong', cx, cy + 24, 14, '#cbb9a3', 'bold', 'center');
  } else {
    // Bowl.
    ctx.fillStyle = '#f6ead0';
    ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b7a8c'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#e8a34c';
    ctx.beginPath(); ctx.ellipse(cx, cy - 4, 54, 12, 0, 0, Math.PI * 2); ctx.fill();
    // Noodle swirls.
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(cx - 38, cy - 6 + k * 8);
      ctx.bezierCurveTo(cx - 12, cy - 14 + k * 8, cx + 12, cy + 2 + k * 8, cx + 38, cy - 6 + k * 8);
      ctx.stroke();
    }
    // Toppings on top, centred on the bowl so the 5th never hangs off the rim.
    const nTop = w.bowl.toppings.length;
    w.bowl.toppings.forEach((id, i) => {
      drawToppingIcon(ctx, id, cx + (i - (nTop - 1) / 2) * 26, cy - 22, 13);
    });
    if (w.bowl.perfectNoodles) {
      text(ctx, 'MIE SEMPURNA', cx, cy - 78, 12, COLORS.green, 'bold', 'center');
    }
  }
  // Dump button (top-right of the panel): clears the bowl for a fresh start.
  const db = LAYOUT.dumpButton;
  rr(ctx, db.x, db.y, db.w, db.h, 6);
  ctx.fillStyle = w.bowl.noodles || w.bowl.toppings.length ? '#5a2d1a' : '#3a2a20';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,243,214,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  text(ctx, 'BUANG (X)', db.x + db.w / 2, db.y + 13, 12, COLORS.cream, 'bold', 'center');
  // Recipe checklist for the active ticket.
  const t = w.tickets[w.activeTicket];
  if (t) {
    const recipe = recipeById(t.recipeId);
    text(ctx, `Target: ${recipe.name}`, b.x + 8, b.y + 226, 13, COLORS.cream);
    // Checklist as icons only (the narrow panel has no room for names):
    // a green ring + tick marks a topping already in the bowl.
    recipe.toppings.forEach((id, i) => {
      const done = w.bowl.toppings.includes(id);
      const x = b.x + 30 + i * 40;
      const y = b.y + 226 + 22;
      drawToppingIcon(ctx, id, x, y, 12);
      ctx.lineWidth = done ? 2.5 : 1.5;
      ctx.strokeStyle = done ? COLORS.green : 'rgba(255,243,214,0.35)';
      ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.stroke();
      if (done) text(ctx, '✓', x + 14, y - 12, 12, COLORS.green, 'bold', 'center');
    });
  }
  ctx.restore();
}

// The chef who prepares the food: toque, face, apron, and a stirring arm
// whose ladle dips into the pot (bob follows `now`, frozen in ?shot= mode).
// (cx, top) is the centre of the hat; s scales the whole figure.
function drawChef(ctx, cx, top, s, now) {
  const bob = Math.sin(now * 2) * 4 * s;
  ctx.save();
  // Toque.
  ctx.fillStyle = '#fff8e8';
  ctx.beginPath(); ctx.arc(cx - 14 * s, top + 14 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 14 * s, top + 14 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, top + 8 * s, 16 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - 22 * s, top + 20 * s, 44 * s, 10 * s);
  // Head.
  ctx.fillStyle = '#f2c184';
  ctx.beginPath(); ctx.arc(cx, top + 56 * s, 22 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b1c10';
  ctx.beginPath(); ctx.arc(cx - 8 * s, top + 52 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8 * s, top + 52 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
  // Smile + moustache.
  ctx.strokeStyle = '#2b1c10'; ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, top + 60 * s, 8 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.strokeStyle = '#5a2d1a'; ctx.lineWidth = 3 * s;
  ctx.beginPath(); ctx.moveTo(cx - 9 * s, top + 62 * s); ctx.quadraticCurveTo(cx, top + 58 * s, cx + 9 * s, top + 62 * s); ctx.stroke();
  // Body: dark shirt, white apron with a name tag.
  ctx.fillStyle = '#7a2d22';
  rr(ctx, cx - 34 * s, top + 78 * s, 68 * s, 176 * s, 12 * s); ctx.fill();
  ctx.fillStyle = '#fff8e8';
  rr(ctx, cx - 24 * s, top + 78 * s, 48 * s, 176 * s, 10 * s); ctx.fill();
  // The uniform carries the make.fun logo: name patch, ghost mark, wordmark.
  ctx.fillStyle = '#2b7a8c';
  text(ctx, 'KOKI', cx, top + 94 * s, 9 * s, '#2b7a8c', 'bold', 'center');
  ctx.fillStyle = '#2b1c10';
  ctx.beginPath();
  ctx.moveTo(cx - 10 * s, top + 122 * s);
  ctx.lineTo(cx - 10 * s, top + 108 * s);
  ctx.arc(cx, top + 108 * s, 10 * s, Math.PI, 0);
  ctx.lineTo(cx + 10 * s, top + 122 * s);
  ctx.quadraticCurveTo(cx + 5 * s, top + 118 * s, cx, top + 122 * s);
  ctx.quadraticCurveTo(cx - 5 * s, top + 118 * s, cx - 10 * s, top + 122 * s);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff8e8';
  ctx.beginPath(); ctx.arc(cx - 4 * s, top + 107 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4 * s, top + 107 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'make.fun', cx, top + 140 * s, 10 * s, '#2b1c10', 'bold', 'center');
  // Left arm resting on the counter.
  ctx.strokeStyle = '#7a2d22'; ctx.lineWidth = 10 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 30 * s, top + 92 * s); ctx.lineTo(cx - 44 * s, top + 170 * s); ctx.stroke();
  // Right arm stirring: shoulder to ladle over the pot.
  ctx.strokeStyle = '#f2c184'; ctx.lineWidth = 9 * s;
  ctx.beginPath(); ctx.moveTo(cx + 28 * s, top + 94 * s); ctx.lineTo(cx + 82 * s, top + 138 * s + bob); ctx.stroke();
  // Ladle: handle + little bowl.
  ctx.strokeStyle = '#3d3a44'; ctx.lineWidth = 4 * s;
  ctx.beginPath(); ctx.moveTo(cx + 82 * s, top + 138 * s + bob); ctx.lineTo(cx + 100 * s, top + 158 * s + bob); ctx.stroke();
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath(); ctx.arc(cx + 102 * s, top + 162 * s + bob, 7 * s, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBins(ctx, w) {
  const b = LAYOUT.bins;
  ctx.save();
  text(ctx, 'BAHAN  —  klik / tombol 1–7', b.x + 8, b.y + 18, 14, COLORS.cream);
  TOPPINGS.forEach((t, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cw = (b.w - 32) / 4;
    const ch = (b.h - 56) / 2;
    const x = b.x + 16 + col * cw + 4;
    const y = b.y + 40 + row * ch + 4;
    const bw = cw - 8;
    const bh = ch - 8;
    const inBowl = w.bowl.toppings.includes(t.id);
    rr(ctx, x, y, bw, bh, 10);
    ctx.fillStyle = inBowl ? '#3d5a2e' : '#4a3220';
    ctx.fill();
    ctx.strokeStyle = inBowl ? COLORS.green : 'rgba(255,243,214,0.25)';
    ctx.lineWidth = 2; ctx.stroke();
    drawToppingIcon(ctx, t.id, x + bw / 2, y + bh / 2 - 12, 20);
    text(ctx, t.name, x + bw / 2, y + bh - 26, 13, COLORS.cream, 'bold', 'center');
    text(ctx, `[${t.key}]`, x + bw / 2, y + bh - 10, 11, '#cbb9a3', 'bold', 'center');
    if (inBowl) text(ctx, '✓', x + bw - 12, y + 12, 14, COLORS.green, 'bold', 'center');
  });
  ctx.restore();
}

function drawPass(ctx, w, now) {
  const p = LAYOUT.pass;
  ctx.save();
  text(ctx, 'PASS  —  mangkuk siap saji', p.x + 8, p.y + 18, 14, COLORS.cream);
  rr(ctx, p.x, p.y + 40, p.w, 84, 12);
  ctx.fillStyle = COLORS.counterTop; ctx.fill();
  ctx.strokeStyle = '#5d3418'; ctx.lineWidth = 3; ctx.stroke();
  if (w.pass.length === 0) {
    text(ctx, 'Belum ada mangkuk disajikan', p.x + p.w / 2, p.y + 82, 14, '#cbb9a3', 'bold', 'center');
  }
  w.pass.forEach((b, i) => {
    const cx = p.x + 80 + i * 220;
    const cy = p.y + 74;
    ctx.fillStyle = '#f6ead0';
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2b7a8c'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 20, cy - 4); ctx.bezierCurveTo(cx - 6, cy - 12, cx + 6, cy + 4, cx + 20, cy - 4); ctx.stroke();
    text(ctx, b.recipeName, cx + 44, cy - 8, 13, COLORS.cream, 'bold');
    if (b.perfect) text(ctx, '★ PERFECT', cx + 44, cy + 12, 12, COLORS.amber, 'bold');
  });
  // Bell.
  const bell = LAYOUT.bell;
  rr(ctx, bell.x, bell.y, bell.w, bell.h, 14);
  ctx.fillStyle = '#3d2a18'; ctx.fill();
  ctx.strokeStyle = COLORS.amber; ctx.lineWidth = 3; ctx.stroke();
  const bcx = bell.x + bell.w / 2;
  const bcy = bell.y + 62;
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(bcx, bcy, 34, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = COLORS.amberDark;
  ctx.fillRect(bcx - 38, bcy - 2, 76, 8);
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath(); ctx.arc(bcx, bcy - 40, 7, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'BEL (Spasi)', bcx, bell.y + bell.h - 18, 14, COLORS.cream, 'bold', 'center');
  ctx.restore();
}

function drawTopBar(ctx, w) {
  const t = LAYOUT.topBar;
  ctx.save();
  ctx.fillStyle = '#170e09';
  ctx.fillRect(t.x, t.y, t.w, t.h);
  text(ctx, 'MIE KILAT', 24, 34, 30, COLORS.amber);
  text(ctx, 'Gerobak mie tercepat di kota', 250, 36, 14, '#cbb9a3');
  // Shift timer — big and central.
  const low = w.shiftLeft <= 30 && w.state === 'play';
  rr(ctx, 560, 10, 160, 44, 10);
  ctx.fillStyle = low ? COLORS.red : '#2e1d13'; ctx.fill();
  ctx.strokeStyle = low ? '#ff9a8a' : COLORS.amber; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, fmtTime(w.shiftLeft), 640, 33, 24, low ? '#fff' : COLORS.cream, 'bold', 'center');
  text(ctx, `KOIN  ${fmtCoins(w.coins)}`, 780, 33, 20, COLORS.amber, 'bold');
  if (w.combo >= 2) {
    rr(ctx, 940, 10, 150, 44, 10);
    ctx.fillStyle = '#5a2d00'; ctx.fill();
    text(ctx, `KOMBO x${w.combo}`, 1015, 33, 18, COLORS.amber, 'bold', 'center');
  }
  const waveName = w.wave === 2 ? 'DINNER RUSH' : w.wave === 1 ? 'LUNCH RUSH' : 'SHIFT PAGI';
  text(ctx, waveName, 1240, 33, 14, '#cbb9a3', 'bold', 'right');
  ctx.restore();
}

function drawBottomBar(ctx, w) {
  const b = LAYOUT.bottomBar;
  ctx.save();
  ctx.fillStyle = '#170e09';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, 'Cara main:  klik tiket → masak mie di panci (N) → angkat ke mangkuk (klik mangkuk / S) → tambah bahan (klik / 1–7) → bunyikan bel (Spasi) untuk sajikan.', 24, b.y + 26, 15, COLORS.cream);
  text(ctx, 'Mie sempurna 5–7 detik = harga x1.5 • Sajikan tepat = kombo naik • Tiket yang kehabisan waktu bikin kombo putus • Klik mie gosong untuk buang • X = buang mangkuk.', 24, b.y + 52, 14, '#cbb9a3');
  text(ctx, `Disajikan ${w.served}   •   Perfect ${w.perfect}   •   Hangus ${w.missed}   •   Kombo terbaik x${w.bestCombo}`, 24, b.y + 84, 14, COLORS.amber, 'bold');
  text(ctx, 'P = jeda   •   R = mulai ulang', 1240, b.y + 84, 14, '#cbb9a3', 'bold', 'right');
  ctx.restore();
}

function drawBanner(ctx, w) {
  if (!w.banner) return;
  const a = 1 - w.banner.t / w.banner.life;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, a * 1.6));
  const txt = w.banner.text;
  ctx.font = 'bold 26px system-ui, sans-serif';
  const tw = ctx.measureText(txt).width;
  rr(ctx, 640 - tw / 2 - 24, 172, tw + 48, 44, 12);
  ctx.fillStyle = COLORS.red; ctx.fill();
  text(ctx, txt, 640, 194, 26, '#fff', 'bold', 'center');
  ctx.restore();
}

function drawPopups(ctx, w) {
  for (const p of w.popups) {
    const a = 1 - p.t / p.life;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    // Dark pill behind the text so a popup never swallows the tile under it.
    ctx.font = 'bold 22px system-ui, sans-serif';
    const tw = ctx.measureText(p.text).width;
    const py = p.y - p.t * 40;
    rr(ctx, p.x - tw / 2 - 14, py - 18, tw + 28, 36, 10);
    ctx.fillStyle = 'rgba(20,10,6,0.88)'; ctx.fill();
    text(ctx, p.text, p.x, py, 22, p.color, 'bold', 'center');
    ctx.restore();
  }
}

function drawTitle(ctx, w, now) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,7,0.82)';
  ctx.fillRect(0, 0, W, H);
  drawChef(ctx, 1100, 200, 1.6, now);
  text(ctx, 'MIE KILAT', 640, 250, 84, COLORS.amber, 'bold', 'center');
  text(ctx, 'Gerobak mie tercepat di kota — masak, racik, sajikan!', 640, 312, 22, COLORS.cream, 'bold', 'center');
  text(ctx, '1. Klik tiket di papan pesanan   •   2. Masak mie 5–7 detik sampai SIAP', 640, 372, 18, COLORS.cream, 'bold', 'center');
  text(ctx, '3. Racik topping sesuai resep   •   4. Bunyikan bel untuk sajikan — kombo menanti!', 640, 402, 18, COLORS.cream, 'bold', 'center');
  const b = LAYOUT.startButton;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = COLORS.amber; ctx.fill();
  text(ctx, 'MULAI SHIFT  ▶', 640, b.y + 38, 26, '#2b1c10', 'bold', 'center');
  text(ctx, 'Mouse + keyboard  •  150 detik per shift  •  6 resep  •  2 rush wave', 640, 630, 15, '#cbb9a3', 'bold', 'center');
  ctx.restore();
}

function drawEnd(ctx, w) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,7,0.88)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'TUTUP! Shift selesai.', 640, 130, 52, COLORS.amber, 'bold', 'center');
  const acc = w.served + w.missed > 0 ? Math.round((w.served / (w.served + w.missed)) * 100) : 100;
  const stars = w.coins >= 20000 ? '★★★ KOKI BINTANG 3' : w.coins >= 12000 ? '★★ KOKI BINTANG 2' : '★ KOKI BINTANG 1';
  text(ctx, stars, 640, 190, 26, '#ffd94d', 'bold', 'center');
  const rows = [
    ['Koin dikumpul', fmtCoins(w.coins)],
    ['Mangkuk disajikan', String(w.served)],
    ['Perfect', String(w.perfect)],
    ['Tiket hangus', String(w.missed)],
    ['Kombo terbaik', `x${w.bestCombo}`],
    ['Akurasi pesanan', `${acc}%`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 250 + i * 44;
    text(ctx, k, 440, y, 20, COLORS.cream, 'bold', 'left');
    text(ctx, v, 840, y, 20, COLORS.amber, 'bold', 'right');
  });
  const b = LAYOUT.restartButton;
  rr(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fillStyle = COLORS.amber; ctx.fill();
  text(ctx, 'MAIN LAGI  (R)', 640, b.y + 38, 24, '#2b1c10', 'bold', 'center');
  ctx.restore();
}

export function render(ctx, w, now) {
  ctx.save();
  if (w.shake > 0) {
    ctx.translate((Math.random() - 0.5) * w.shake * 8, (Math.random() - 0.5) * w.shake * 8);
  }
  // Background: warm kitchen wall + floor.
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(-20, -20, W + 40, H + 40);
  ctx.fillStyle = COLORS.bg2;
  ctx.fillRect(0, 176, W, 488);
  // Wall tiles.
  ctx.strokeStyle = 'rgba(255,243,214,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x, 176); ctx.stroke(); }
  for (let y = 64; y < 176; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  drawTopBar(ctx, w);
  // Ticket rail.
  const t = LAYOUT.tickets;
  ctx.fillStyle = '#3a2415';
  rr(ctx, t.x - 8, t.y - 8, t.w + 16, t.h + 16, 12); ctx.fill();
  text(ctx, 'PAPAN PESANAN', t.x + 2, t.y - 22 + 8, 13, '#cbb9a3');
  if (w.tickets.length === 0 && w.state === 'play') {
    text(ctx, 'Belum ada pesanan — sebentar lagi datang…', 640, t.y + 48, 16, '#cbb9a3', 'bold', 'center');
  }
  w.tickets.forEach((tk, i) => {
    drawTicket(ctx, tk, t.x + i * (t.cardW + t.gap), t.y, t.cardW, t.h, i === w.activeTicket, now);
  });

  drawPot(ctx, w, now);
  // The chef stands left of the pot, stirring — drawn after the pot so the
  // ladle arm rests over the pot rim.
  drawChef(ctx, 114, 216, 1, now);
  drawBowl(ctx, w);
  drawBins(ctx, w);
  drawPass(ctx, w, now);
  drawBottomBar(ctx, w);
  drawBanner(ctx, w);
  drawPopups(ctx, w);

  if (w.state === 'title') drawTitle(ctx, w, now);
  if (w.state === 'end') drawEnd(ctx, w);
  if (w.paused && w.state === 'play') {
    ctx.fillStyle = 'rgba(20,12,7,0.7)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'JEDA — tekan P untuk lanjut', 640, 400, 36, COLORS.cream, 'bold', 'center');
  }
  ctx.restore();
}
