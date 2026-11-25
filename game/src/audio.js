// Tiny synthesized sound effects (WebAudio, no audio files): a click, a service
// bell, a coin chime, a sizzle burst, a bad buzz and a win arpeggio. The context
// is created lazily on the first user gesture so autoplay rules never block play.

let ctx = null;

function ac() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur, vol = 0.08, when = 0) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(g).connect(c.destination);
  src.start(t0);
}

export function sfx(name) {
  try {
    if (name === 'click') tone(660, 0.06, 'triangle', 0.08);
    else if (name === 'ding') { tone(1318, 0.25, 'sine', 0.14); tone(1760, 0.3, 'sine', 0.1, 0.05); }
    else if (name === 'coin') { tone(988, 0.09, 'square', 0.06); tone(1318, 0.16, 'square', 0.06, 0.07); }
    else if (name === 'sizzle') noise(0.35, 0.07);
    else if (name === 'bad') tone(160, 0.25, 'sawtooth', 0.1);
    else if (name === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, i * 0.09)); }
    else if (name === 'pop') tone(440, 0.05, 'sine', 0.09);
  } catch {
    // Sound is garnish; a blocked context must never break the game.
  }
}
