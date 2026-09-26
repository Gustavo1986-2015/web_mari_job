// Campanilla de llegada del ascensor, sintetizada con Web Audio (sin archivos de sonido).
// Los navegadores solo permiten audio después de una interacción (clic, toque o tecla),
// así que el contexto se crea recién entonces.

const KEY = 'soregaroli:sonido';
let ctx: AudioContext | null = null;
let enabled = true;
try {
  enabled = localStorage.getItem(KEY) !== 'off';
} catch {
  /* sin almacenamiento: queda activado */
}

function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
}
['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock, { passive: true }));

// Campana: fundamental + parciales inarmónicos con caída exponencial.
function strike(at: number, freq: number, gain: number) {
  if (!ctx) return;
  const out = ctx.createGain();
  out.gain.value = gain;
  out.connect(ctx.destination);
  const partials: [number, number, number][] = [
    [1, 1, 1.8],
    [2.0, 0.28, 1.1],
    [2.76, 0.2, 0.8],
    [5.4, 0.07, 0.4],
  ];
  for (const [ratio, amp, decay] of partials) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(amp, at + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    osc.connect(env).connect(out);
    osc.start(at);
    osc.stop(at + decay + 0.05);
  }
}

// Una campanada al llegar subiendo, dos al llegar bajando.
export function ding(direction: 'up' | 'down') {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime + 0.02;
  if (direction === 'up') strike(t, 1046.5, 0.16);
  else {
    strike(t, 1046.5, 0.15);
    strike(t + 0.32, 880, 0.15);
  }
}

export function isSoundOn() {
  return enabled;
}

export function setSound(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* ignorar */
  }
  if (on) {
    unlock();
    ding('up'); // confirmación audible al activarlo
  }
}

window.addEventListener('elevator:arrive', (e) => {
  ding((e as CustomEvent<{ direction: 'up' | 'down' }>).detail.direction);
});
