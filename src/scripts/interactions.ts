import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HEADER_OFFSET = -72;

// Scroll suave sincronizado con GSAP.
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Enlaces internos: viajar con el scroll suave.
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!;
    const target = id === '#inicio' ? document.body : document.querySelector<HTMLElement>(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: id === '#inicio' ? 0 : HEADER_OFFSET, duration: 1.8 });
    else target.scrollIntoView();
    history.replaceState(null, '', id);
  });
});

if (!reduced) {
  // Entrada del hero.
  const title = document.querySelector<HTMLElement>('[data-hero-title]');
  if (title) {
    const words = title.innerHTML.split(/(<span[^>]*>.*?<\/span>|\s+)/).filter((w) => w.trim());
    title.innerHTML = words
      .map((w) => `<span class="inline-block overflow-hidden pb-[0.08em] align-bottom"><span class="hero-word inline-block">${w}</span></span>`)
      .join(' ');
    gsap.set(title, { opacity: 1, y: 0 });
    gsap.from('.hero-word', { yPercent: 110, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.25 });
  }
  gsap.to('[data-hero]', { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out', delay: 0.5 });

  // Revelado al hacer scroll.
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const group = el.parentElement?.hasAttribute('data-reveal-group');
    const index = group ? Array.from(el.parentElement!.children).indexOf(el) : 0;
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'expo.out',
      delay: (index % 4) * 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // Contadores.
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 1.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => (el.textContent = String(Math.round(obj.v))),
    });
  });
}

// Brillo de las tarjetas siguiendo el puntero.
document.querySelectorAll<HTMLElement>('.card-glow').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// Recalcular posiciones cuando cargan las fuentes.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
