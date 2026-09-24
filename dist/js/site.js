// 702 · site choreography (GSAP + ScrollTrigger + Lenis, Three.js hero)
import { createHero } from './hero3d.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const root = document.documentElement;
const pad = n => String(n).padStart(2, '0');
const fine = matchMedia('(pointer: fine) and (hover: hover)').matches;
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
let calm = reduceQuery.matches;
root.classList.add('js');
root.classList.toggle('calm', calm);

/* ------------------------------------------------------------------ data */
const photos = [
  ['01', 'Stairwell', 'Access', 'Stairs descending from the property'],
  ['02', 'Entrance corridor', 'Access', 'Patterned doors and entrance corridor'],
  ['03', 'Security gate', 'Access', 'Metal security gate at the entrance'],
  ['04', 'Wash area', 'Wash areas', 'Tiled wash area with taps and blue floor tiles'],
  ['05', 'Interior door', 'Access', 'Patterned interior door'],
  ['06', 'Connecting passage', 'Access', 'Tiled passage beside the stairs'],
  ['07', 'Wash station', 'Wash areas', 'Washbasin, utility door and window'],
  ['08', 'Indoor staircase', 'Access', 'Permanent staircase and metal railing'],
  ['09', 'Wash area, upper view', 'Wash areas', 'Upper wash-area view with towel rail and light'],
  ['10', 'Utility door', 'Wash areas', 'Utility door and surrounding wall tiles'],
  ['11', 'Kitchen, wide view', 'Kitchen', 'Kitchen counter, wall shelf and tiled walls'],
  ['12', 'Room, corner view', 'Rooms', 'Tiled room corner with a fixed pink shelf'],
  ['13', 'Room, recessed shelves', 'Rooms', 'Turquoise room and built-in wall niches'],
  ['14', 'Room, blue cupboard', 'Rooms', 'Room view showing a blue metal cupboard'],
  ['15', 'Alcove, view one', 'Rooms', 'Tiled alcove with a green wall shelf'],
  ['16', 'Alcove, view two', 'Rooms', 'Another angle of the tiled alcove'],
  ['17', 'Alcove, view three', 'Rooms', 'Wider upper view of the same tiled alcove'],
  ['18', 'Kitchen sink', 'Kitchen', 'Stainless-steel sink and green stone counter'],
  ['19', 'Interior connections', 'Access', 'Interior doorways looking towards the gate'],
  ['20', 'Kitchen counter', 'Kitchen', 'Green counter, backsplash and fixed gas meter']
].map(([id, title, category, alt]) => ({ id, title, category, alt }));
const photoById = id => photos.find(p => p.id === id);

const chapters = [
  { id: '02', name: 'Entrance', tint: '233,201,90', title: 'A welcome <em>of your own.</em>', text: 'The entrance, patterned doors and metal security gate. Your first look inside.' },
  { id: '13', name: 'The room', tint: '94,211,198', title: 'Room for <em>your everyday.</em>', text: 'Turquoise walls, floral border tiles and recessed shelves built into the wall.' },
  { id: '11', name: 'Kitchen', tint: '120,190,140', title: 'Small rituals. <em>Every day.</em>', text: 'A green stone counter and a wall shelf. The sink and worktop are in the gallery.' },
  { id: '07', name: 'Wash station', tint: '150,190,230', title: 'The practical <em>little details.</em>', text: 'A compact washbasin beside the utility door, right where you need it.' },
  { id: '04', name: 'Wash area', tint: '110,160,225', title: 'A closer look <em>at the essentials.</em>', text: 'A tiled wash area with wall taps, a towel rail and blue floor tiles.' },
  { id: '08', name: 'Staircase', tint: '242,160,123', title: 'Up to your <em>first floor.</em>', text: 'Your own staircase up to the flat. Come and see it in person.' }
];

/* ---------------------------------------------------------- smooth scroll */
let lenis = null;
function startLenis() {
  if (lenis || calm || !window.Lenis) return;
  lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  lenis.on('scroll', ({ velocity }) => { heroApi && heroApi.setVelocity(velocity); tickerVelocity(velocity); });
  if (document.body.classList.contains('is-loading')) lenis.stop();
}
function stopLenis() { if (lenis) { lenis.destroy(); lenis = null; } }
gsap.ticker.add(time => lenis && lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
startLenis();

function scrollToTarget(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4), ...opts });
  else {
    const y = typeof target === 'number' ? target : (target.getBoundingClientRect().top + scrollY + (opts.offset || 0));
    scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' });
  }
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const el = id === '#home' || id === '#' ? null : $(id);
  if (id !== '#home' && !el) return;
  e.preventDefault();
  closeMenu();
  scrollToTarget(el || 0, { offset: 0 });
  if (el && el.tabIndex < 0 && !/^(A|BUTTON|INPUT)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
  if (el) setTimeout(() => el.focus({ preventScroll: true }), 900);
});

/* ------------------------------------------------------------- split text */
function splitWords(el) {
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
          w.append(i); frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    });
  };
  walk(el);
  return $$('.wi', el);
}

/* --------------------------------------------------------------- hero 3D */
const heroSection = $('.hero');
const loadState = { hero: 0 };
let heroApi = null;
try { heroApi = createHero($('.hero-canvas'), { onProgress: p => (loadState.hero = p), onChapter: heroChapter }); }
catch (err) { console.warn('3D hero unavailable', err); heroApi = null; }
if (!heroApi) { root.classList.add('no-webgl'); loadState.hero = 1; }
const chapterNum = $('.hero-chapter-num'), chapterName = $('.hero-chapter-name');
function heroChapter(i, name) {
  if (!chapterNum) return;
  if (calm) { chapterNum.textContent = pad(i + 1); chapterName.textContent = name; return; }
  gsap.timeline()
    .to([chapterNum, chapterName], { yPercent: -60, opacity: 0, duration: 0.25, ease: 'power2.in', stagger: 0.04 })
    .add(() => { chapterNum.textContent = pad(i + 1); chapterName.textContent = name; })
    .fromTo([chapterNum, chapterName], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.05 });
}

/* ------------------------------------------------------------- preloader */
const preloader = $('.preloader');
function runPreloader() {
  const count = $('.preloader-count'), bar = $('.preloader-bar span');
  const shown = { v: 0 };
  const minTime = calm ? 0 : 1.1;
  const start = performance.now();
  gsap.to('.preloader-mark span', { yPercent: -105, duration: calm ? 0.01 : 1, ease: 'expo.out', stagger: 0.08 });
  const fontsReady = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
  const assetsReady = Promise.all([fontsReady, heroApi ? heroApi.ready : Promise.resolve()]);
  const safety = new Promise(res => setTimeout(res, 7000));
  let done = false;
  Promise.race([assetsReady, safety]).then(() => (done = true));

  return new Promise(resolve => {
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const real = done ? 1 : Math.min(0.95, loadState.hero * 0.9 + 0.05);
      const timeCap = minTime ? Math.min(1, elapsed / minTime) : 1;
      const target = Math.min(real, timeCap);
      const now = performance.now(), dt = (now - (tick.last || now)) / 1000; tick.last = now;
      shown.v += (target - shown.v) * (1 - Math.exp(-dt * 9));
      if (target === 1 && shown.v > 0.995) shown.v = 1;
      count.textContent = String(Math.round(shown.v * 100)).padStart(3, '0');
      bar.style.transform = `scaleX(${shown.v})`;
      if (shown.v >= 1) { gsap.ticker.remove(tick); resolve(); }
    };
    gsap.ticker.add(tick);
  });
}

function revealSite() {
  const unlock = () => {
    if (!document.body.classList.contains('is-loading')) return;
    document.body.classList.remove('is-loading');
    preloader.style.pointerEvents = 'none';
    lenis && lenis.start();
    ScrollTrigger.refresh();
  };
  const tl = gsap.timeline({ onComplete: () => { unlock(); preloader.remove(); } });
  if (calm) {
    tl.to(preloader, { opacity: 0, duration: 0.3 });
    gsap.set('.hero-title .line > span', { yPercent: 0, y: 0, rotate: 0 });
    heroApi && heroApi.intro();
    return tl;
  }
  tl.to('.preloader-mark span', { yPercent: -210, duration: 0.7, ease: 'expo.in', stagger: 0.06 })
    .to('.preloader-bar, .preloader-meta', { opacity: 0, duration: 0.3 }, '<')
    .to('.preloader-curtain', { scaleY: 1, duration: 0.6, ease: 'expo.inOut' }, '-=0.25')
    .set('.preloader-inner', { display: 'none' })
    .set(preloader, { background: 'transparent' })
    .to('.preloader-curtain', { scaleY: 0, transformOrigin: 'top', duration: 0.8, ease: 'expo.inOut' })
    .add(unlock, '-=0.3')
    .add(() => heroApi && heroApi.intro(), '-=0.7')
    .fromTo('.hero-title .line > span', { yPercent: 110, y: 0, rotate: 4 }, { yPercent: 0, y: 0, rotate: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12 }, '-=0.45')
    .from('[data-hero-fade]', { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.08 }, '-=1')
    .from('.header', { yPercent: -100, duration: 1, ease: 'expo.out' }, '-=1.1')
    .from('.hero-chapter', { opacity: 0, x: 30, duration: 1, ease: 'expo.out' }, '-=0.9');
  return tl;
}

heroApi && heroApi.start();
runPreloader().then(revealSite);

/* ------------------------------------------------------ hero scroll story */
if (heroApi) {
  ScrollTrigger.create({
    trigger: heroSection, start: 'top top', end: 'bottom bottom',
    onUpdate: self => heroApi.setProgress(self.progress)
  });
  ScrollTrigger.create({ trigger: heroSection, start: 'top bottom', end: 'bottom top', onToggle: self => heroApi.setVisible(self.isActive) });
}
function buildHeroTimeline() {
  return gsap.timeline({ scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
    .to('.hero-content', { yPercent: -18, opacity: 0, ease: 'power1.in', duration: 0.16 }, 0)
    .to('.hero-scroll', { opacity: 0, duration: 0.05 }, 0)
    .to('.hero-vignette', { opacity: 0.55, duration: 0.3 }, 0)
    .fromTo('.hero-outro', { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.86)
    .fromTo('.hero-outro p', { yPercent: 60, scale: 0.92 }, { yPercent: 0, scale: 1, duration: 0.12, stagger: 0.02, ease: 'power3.out' }, 0.86)
    .to('.hero-chapter', { opacity: 0, duration: 0.06 }, 0.84)
    .to({}, { duration: 0.02 }, 0.98);
}

/* ------------------------------------------------------------- header */
const header = $('.header');
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: self => {
    const y = self.scroll();
    header.classList.toggle('is-solid', y > 40);
    const menuOpen = $('.mobile-menu').classList.contains('is-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;
    $('.scroll-meter span').style.transform = `scaleX(${self.progress})`;
    $('.dock').classList.toggle('is-visible', y > innerHeight * 0.5);
  }
});
$$('.nav a').forEach(a => {
  const target = $(a.getAttribute('href'));
  if (!target) return;
  ScrollTrigger.create({ trigger: target, start: 'top 55%', end: 'bottom 55%', onToggle: self => a.classList.toggle('is-active', self.isActive) });
});

/* ------------------------------------------------------------ mobile menu */
const menu = $('#mobile-menu'), menuBtn = $('.menu-toggle');
function closeMenu() {
  if (!menu.classList.contains('is-open')) return;
  menu.classList.remove('is-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Open menu');
  lenis && lenis.start();
  setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 700);
}
menuBtn.addEventListener('click', () => {
  if (menu.classList.contains('is-open')) return closeMenu();
  menu.hidden = false;
  requestAnimationFrame(() => menu.classList.add('is-open'));
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBtn.setAttribute('aria-label', 'Close menu');
  lenis && lenis.stop();
});
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

/* ---------------------------------------------------------------- ticker */
const tickerTrack = $('.ticker-track');
tickerTrack.innerHTML += tickerTrack.innerHTML;
$$('span, i', tickerTrack).slice(tickerTrack.children.length / 2).forEach(n => n.setAttribute('aria-hidden', 'true'));
const tickerTween = gsap.to(tickerTrack, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
let tickerDir = 1;
function tickerVelocity(v) {
  if (calm) return;
  if (Math.abs(v) > 0.5) tickerDir = v > 0 ? 1 : -1;
  gsap.to(tickerTween, { timeScale: tickerDir * (1 + Math.min(6, Math.abs(v) / 6)), duration: 0.3, overwrite: true });
  gsap.to(tickerTween, { timeScale: tickerDir, duration: 1.2, delay: 0.3 });
}

/* --------------------------------------------------- reveals + headlines */
function setupReveals() {
  $$('[data-split]').forEach(el => {
    const words = splitWords(el);
    gsap.fromTo(words, { yPercent: 115, rotate: 5 }, {
      yPercent: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%', once: true,
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true })
  });
  // counters
  $$('.facts [data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'expo.out', onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString('en-IN')) })
    });
  });
  // fact cards flip up in 3D
  gsap.from('.fact', {
    y: 120, rotateX: -35, opacity: 0, transformOrigin: '50% 100%', duration: 1.3, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.facts', start: 'top 85%', once: true }
  });
  gsap.from('.fact-icon', {
    scale: 0.4, rotate: -40, opacity: 0, duration: 1.2, ease: 'back.out(2)', stagger: 0.1, delay: 0.4,
    scrollTrigger: { trigger: '.facts', start: 'top 80%', once: true }
  });
}
function setupReducedReveals() {
  $$('[data-split]').forEach(splitWords);
}

/* ------------------------------------------------------------- tilt + magnet */
function setupPointerFx() {
  if (!fine) return;
  $$('[data-tilt]').forEach(card => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('pointermove', e => {
      if (calm) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      rx((0.5 - y) * 12); ry((x - 0.5) * 14);
      card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
  $$('[data-magnetic]').forEach(el => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', e => {
      if (calm) return;
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------------------------------------------------------------- cursor */
function setupCursor() {
  if (!fine) return;
  document.body.classList.add('has-cursor');
  const cursor = $('.cursor'), label = $('.cursor-label');
  const dot = $('.cursor-dot'), ring = $('.cursor-ring');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.1 }), dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  gsap.set(cursor, { opacity: 0 });
  let seen = false;
  addEventListener('pointermove', e => {
    if (!seen) { seen = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); gsap.to(cursor, { opacity: 1, duration: 0.3 }); }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  }, { passive: true });
  document.addEventListener('pointerover', e => {
    const labelled = e.target.closest('[data-cursor], .tile, .strip-card, .tour-panel, .compare-range');
    const hover = e.target.closest('a, button, label, summary');
    cursor.classList.toggle('is-label', !!labelled);
    cursor.classList.toggle('is-hover', !labelled && !!hover);
    if (labelled) label.textContent = labelled.dataset.cursor || (labelled.classList.contains('compare-range') ? 'Drag' : 'View');
  });
  document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: 0.2 }));
  document.addEventListener('pointerenter', () => gsap.to(cursor, { opacity: 1, duration: 0.2 }));
}

/* ----------------------------------------------------------- walkthrough */
const tour = $('#tour'), world = $('#tour-world'), nav = $('#tour-nav');
world.innerHTML = chapters.map((c, i) => `
  <button class="tour-panel" data-index="${i}" aria-label="Open the ${c.name} photograph" tabindex="${i ? -1 : 0}">
    <img src="assets/${c.id}.webp" alt="${photoById(c.id).alt}" width="750" height="1000" ${i > 1 ? 'loading="lazy"' : ''}>
    <span class="tour-panel-label"><span>${pad(i + 1)} · ${c.name}</span><span>↗</span></span>
  </button>`).join('');
nav.innerHTML = chapters.map((c, i) => `<button data-index="${i}" ${i ? '' : 'aria-current="step"'}><span>${pad(i + 1)}</span>${c.name}</button>`).join('');
const tourPanels = $$('.tour-panel', world);
const last = chapters.length - 1;
let tourTarget = 0, tourCurrent = 0, tourActive = 0, tourPX = 0, tourPY = 0, tourPXs = 0, tourPYs = 0;

let tourTl = null;
function tourCopy(index, instant) {
  const c = chapters[index];
  const apply = () => {
    $('#tour-num').textContent = pad(index + 1);
    $('#tour-title').innerHTML = c.title;
    $('#tour-desc').textContent = c.text;
    $('#tour-bigword').textContent = c.name;
  };
  tour.style.setProperty('--tour-tint', c.tint);
  $$('button', nav).forEach((b, i) => (i === index ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  tourPanels.forEach((p, i) => { p.tabIndex = i === index ? 0 : -1; p.setAttribute('aria-hidden', String(i !== index)); });
  if (tourTl) tourTl.kill();
  if (instant || calm) { gsap.set(['#tour-num', '#tour-title', '#tour-desc', '#tour-bigword'], { clearProps: 'opacity,transform' }); return apply(); }
  const parts = ['#tour-num', '#tour-title', '#tour-desc'];
  tourTl = gsap.timeline()
    .to(parts, { y: -18, opacity: 0, duration: 0.22, ease: 'power2.in', stagger: 0.03 })
    .to('#tour-bigword', { opacity: 0, duration: 0.2 }, 0)
    .add(apply)
    .fromTo(parts, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05 })
    .fromTo('#tour-bigword', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out' }, '<');
}
function paintTour() {
  const k = 1 - Math.pow(0.9, Math.min(6, gsap.ticker.deltaRatio(60) || 1));
  if (!Number.isFinite(tourCurrent)) tourCurrent = tourTarget;
  tourCurrent = calm ? tourTarget : tourCurrent + (tourTarget - tourCurrent) * k;
  if (Math.abs(tourTarget - tourCurrent) < 0.0005) tourCurrent = tourTarget;
  tourPXs += (tourPX - tourPXs) * k * 0.6; tourPYs += (tourPY - tourPYs) * k * 0.6;
  const idx = Math.max(0, Math.min(last, Math.round(tourCurrent)));
  if (idx !== tourActive) { tourActive = idx; tourCopy(idx); }
  const mobile = innerWidth <= 820;
  tourPanels.forEach((p, i) => {
    const d = i - tourCurrent;
    if (calm) {
      p.style.transform = 'none';
      p.style.opacity = i === tourActive ? '1' : '0';
      p.style.visibility = i === tourActive ? 'visible' : 'hidden';
      return;
    }
    const opacity = d < 0 ? gsap.utils.clamp(0, 1, 1 + (d + 0.12) * 2.6) : Math.max(0, 1 - Math.max(0, d - 0.15) * 0.42);
    const x = d < 0 ? d * (mobile ? 260 : 460) : d * (mobile ? 120 : 270);
    const y = d * (mobile ? -26 : -34) + tourPYs * 16;
    const z = -d * (mobile ? 560 : 780);
    const ry = -14 - d * (mobile ? 12 : 16) + tourPXs * 8;
    const rz = d < 0 ? d * -6 : d * 1.5;
    p.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg) rotateX(${-tourPYs * 5}deg) rotateZ(${rz}deg)`;
    p.style.opacity = opacity;
    p.style.visibility = opacity <= 0.01 || d > 4 ? 'hidden' : 'visible';
    p.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
    p.style.pointerEvents = i === tourActive ? 'auto' : 'none';
  });
  $('#tour-progress').style.transform = `scaleX(${tourTarget / last})`;
  $('#tour-bigword').parentElement.style.transform = `translateX(${(0.5 - tourCurrent / last) * 12}%)`;
}
const easeSeg = f => { const x = gsap.utils.clamp(0, 1, (f - 0.28) / 0.44); return x * x * (3 - 2 * x); };
let tourVisible = false;
ScrollTrigger.create({
  trigger: tour, start: 'top top', end: 'bottom bottom',
  onUpdate: self => {
    const t = self.progress * last, k = Math.floor(t), f = t - k;
    tourTarget = k >= last ? last : k + easeSeg(f);
  }
});
ScrollTrigger.create({ trigger: tour, start: 'top bottom', end: 'bottom top', onToggle: self => (tourVisible = self.isActive) });
gsap.ticker.add(() => { if (tourVisible) paintTour(); });
function goChapter(i) {
  i = Math.max(0, Math.min(last, i));
  const top = tour.getBoundingClientRect().top + scrollY;
  scrollToTarget(top + (i / last) * (tour.offsetHeight - innerHeight) + 2);
}
nav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) goChapter(+b.dataset.index); });
world.addEventListener('click', e => { const b = e.target.closest('.tour-panel'); if (b) openViewer(chapters[+b.dataset.index].id); });
$('#tour-open').addEventListener('click', () => openViewer(chapters[tourActive].id));
$('#tour-stage').addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' || calm) return;
  tourPX = e.clientX / innerWidth - 0.5; tourPY = e.clientY / innerHeight - 0.5;
});
$('#tour-stage').addEventListener('pointerleave', () => { tourPX = tourPY = 0; });
tourCopy(0, true);

/* ---------------------------------------------------- horizontal strip */
const strip = $('.strip'), stripTrack = $('.strip-track'), stripCards = $$('.strip-card, .strip-end', stripTrack);
const stripDistance = () => Math.max(0, stripTrack.scrollWidth - innerWidth);
function sizeStrip() { strip.style.height = `${stripDistance() + innerHeight}px`; }
sizeStrip();
ScrollTrigger.addEventListener('refreshInit', sizeStrip);
let stripVel = 0;
ScrollTrigger.create({
  trigger: strip, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true,
  onUpdate: self => {
    const x = -stripDistance() * self.progress;
    stripVel = self.getVelocity();
    gsap.set(stripTrack, { x, skewX: calm ? 0 : gsap.utils.clamp(-6, 6, -stripVel / 400) });
    paintStrip();
  },
  onLeave: () => gsap.to(stripTrack, { skewX: 0, duration: 0.4 }),
  onLeaveBack: () => gsap.to(stripTrack, { skewX: 0, duration: 0.4 })
});
function paintStrip() {
  const vw = innerWidth;
  stripCards.forEach(card => {
    const r = card.getBoundingClientRect();
    const off = (r.left + r.width / 2 - vw / 2) / vw;
    if (calm) { card.style.transform = ''; return; }
    card.style.transform = `perspective(1400px) rotateY(${gsap.utils.clamp(-28, 28, off * -24)}deg) translateZ(${-Math.abs(off) * 120}px)`;
    const img = $('img', card);
    if (img) img.style.transform = `scale(1.2) translateX(${gsap.utils.clamp(-10, 10, off * -10)}%)`;
  });
}
paintStrip();
gsap.from('.strip-card', {
  y: 120, opacity: 0, rotate: 3, duration: 1.2, ease: 'expo.out', stagger: 0.08,
  scrollTrigger: { trigger: strip, start: 'top 75%', once: true }
});
stripTrack.addEventListener('click', e => { const c = e.target.closest('.strip-card'); if (c) openViewer(c.dataset.photo); });
stripTrack.addEventListener('keydown', e => { const c = e.target.closest('.strip-card'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openViewer(c.dataset.photo); } });
$$('.strip-card').forEach(c => { c.tabIndex = 0; c.setAttribute('role', 'button'); c.setAttribute('aria-label', `Open photo: ${c.querySelector('figcaption').textContent.replace(/^\d+/, '').trim()}`); });

/* --------------------------------------------------------------- gallery */
const filterNames = ['All', 'Rooms', 'Kitchen', 'Wash areas', 'Access'];
let filter = 'All', originals = false;
const grid = $('#grid'), filtersEl = $('#filters');
filtersEl.innerHTML = filterNames.map((f, i) => {
  const n = f === 'All' ? photos.length : photos.filter(p => p.category === f).length;
  return `<button aria-pressed="${i === 0}" data-filter="${f}">${f}<sup>${n}</sup></button>`;
}).join('');
const visiblePhotos = () => photos.filter(p => filter === 'All' || p.category === filter);
const WIDE = new Set(['13', '11', '19']);
function renderGrid() {
  const list = visiblePhotos();
  grid.innerHTML = list.map(p => `
    <button class="tile${filter === 'All' && WIDE.has(p.id) ? ' wide' : ''}" data-photo="${p.id}" aria-label="View photo: ${p.title}">
      <img src="assets/${p.id}${originals ? '-original' : '-thumb'}.webp" alt="${p.alt}${originals ? ', original photo during paintwork' : ', cleaned preview'}" width="420" height="560" loading="lazy">
      <span class="tile-cat">${p.category}</span>
      <span class="tile-meta"><span class="tile-title">${p.title}</span><span class="tile-id">${p.id}</span></span>
    </button>`).join('');
}
function animateTilesIn(immediate) {
  const tiles = $$('.tile', grid);
  if (calm) return;
  if (immediate) {
    gsap.fromTo(tiles, { clipPath: 'inset(100% 0% 0% 0%)', y: 40 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1, ease: 'expo.out', stagger: 0.04 });
    tiles.forEach(t => gsap.fromTo($('img', t), { scale: 1.35 }, { scale: 1, duration: 1.4, ease: 'expo.out', clearProps: 'transform' }));
    return;
  }
  gsap.set(tiles, { clipPath: 'inset(100% 0% 0% 0%)' });
  ScrollTrigger.batch(tiles, {
    start: 'top 92%', once: true,
    onEnter: batch => {
      gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out', stagger: 0.07 });
      batch.forEach(t => gsap.fromTo($('img', t), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'expo.out', clearProps: 'transform' }));
    }
  });
}
renderGrid();
filtersEl.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.dataset.filter === filter) return;
  filter = b.dataset.filter;
  $$('button', filtersEl).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  const swap = () => { renderGrid(); animateTilesIn(true); ScrollTrigger.refresh(); };
  if (calm) return swap();
  gsap.to($$('.tile', grid), { opacity: 0, y: -20, scale: 0.96, duration: 0.3, ease: 'power2.in', stagger: 0.015, onComplete: swap });
});
$('#show-originals').addEventListener('change', e => {
  originals = e.target.checked;
  $$('.tile img', grid).forEach((img, i) => {
    const id = img.closest('.tile').dataset.photo, p = photoById(id);
    const apply = () => { img.src = `assets/${id}${originals ? '-original' : '-thumb'}.webp`; img.alt = `${p.alt}${originals ? ', original photo during paintwork' : ', cleaned preview'}`; };
    if (calm) return apply();
    gsap.timeline({ delay: i * 0.02 }).to(img, { opacity: 0, duration: 0.2 }).add(apply).to(img, { opacity: 1, duration: 0.4 });
  });
});
grid.addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) openViewer(t.dataset.photo, visiblePhotos()); });

/* ---------------------------------------------------------------- viewer */
const viewer = $('#viewer'), vImg = $('#viewer-img');
let vList = photos, vIndex = 0;
function updateViewer(dir = 0) {
  const p = vList[vIndex], orig = $('#viewer-original').checked;
  const apply = () => {
    vImg.src = `assets/${p.id}${orig ? '-original' : ''}.webp`;
    vImg.alt = p.alt + (orig ? ', original photo during paintwork' : ', AI-cleaned preview');
    $('#viewer-title').textContent = p.title;
    $('#viewer-count').textContent = `${pad(vIndex + 1)} / ${pad(vList.length)} · ${p.category}`;
    $('#viewer-note').textContent = orig ? 'Original photo, taken during paintwork' : 'AI-cleaned preview. Switch on "Original photo" to compare.';
  };
  if (!dir || calm) return apply();
  gsap.timeline()
    .to(vImg, { x: -dir * 40, opacity: 0, duration: 0.18, ease: 'power2.in' })
    .add(apply)
    .fromTo(vImg, { x: dir * 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'expo.out' });
}
function openViewer(id, list = photos) {
  vList = list; vIndex = Math.max(0, list.findIndex(p => p.id === id));
  $('#viewer-original').checked = originals;
  updateViewer();
  viewer.showModal();
  document.body.classList.add('viewer-open');
  lenis && lenis.stop();
  if (!calm) gsap.fromTo(vImg, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out' });
}
const step = d => { vIndex = (vIndex + d + vList.length) % vList.length; updateViewer(d); };
viewer.addEventListener('close', () => { document.body.classList.remove('viewer-open'); lenis && lenis.start(); });
$('#viewer-close').addEventListener('click', () => viewer.close());
$('#viewer-prev').addEventListener('click', () => step(-1));
$('#viewer-next').addEventListener('click', () => step(1));
$('#viewer-original').addEventListener('change', () => updateViewer());
viewer.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
});
viewer.addEventListener('click', e => { if (e.target === viewer || e.target.classList.contains('viewer-img-wrap')) viewer.close(); });
let touchX = null;
vImg.addEventListener('touchstart', e => (touchX = e.touches[0].clientX), { passive: true });
vImg.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  touchX = null;
}, { passive: true });

/* --------------------------------------------------------------- compare */
const compareIds = ['11', '13', '02', '04', '18', '20'];
const frame = $('#compare-frame'), range = $('#compare-range');
$('#compare-picks').innerHTML = compareIds.map((id, i) => `<button aria-pressed="${i === 0}" data-id="${id}" aria-label="Compare ${photoById(id).title}"><img src="assets/${id}-thumb.webp" alt="" width="420" height="560" loading="lazy"></button>`).join('');
const setPos = v => { frame.style.setProperty('--pos', `${v}%`); range.value = v; };
range.addEventListener('input', () => setPos(+range.value));
$('#compare-picks').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  $$('button', e.currentTarget).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  const id = b.dataset.id, p = photoById(id);
  const apply = () => {
    $('#compare-before').src = `assets/${id}-original.webp`;
    $('#compare-before').alt = `Original photo: ${p.alt}, taken during paintwork`;
    $('#compare-after-img').src = `assets/${id}.webp`;
    $('#compare-after-img').alt = `AI-cleaned preview: ${p.alt}`;
  };
  if (calm) return apply();
  gsap.timeline().to(frame, { opacity: 0.2, scale: 0.97, duration: 0.25 }).add(apply).to(frame, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' });
});
if (!calm) {
  const hint = { v: 50 };
  ScrollTrigger.create({
    trigger: frame, start: 'top 70%', once: true,
    onEnter: () => gsap.timeline({ delay: 0.6 })
      .to(hint, { v: 18, duration: 0.9, ease: 'power3.inOut', onUpdate: () => setPos(hint.v) })
      .to(hint, { v: 82, duration: 1.2, ease: 'power3.inOut', onUpdate: () => setPos(hint.v) })
      .to(hint, { v: 50, duration: 0.8, ease: 'power3.inOut', onUpdate: () => setPos(hint.v) })
  });
}

/* ------------------------------------------------------ location + enquire */
function setupSectionFx() {
  // map: roads draw in, blocks rise, pin drops
  const roads = $$('.map-roads path:not(.map-route)');
  roads.forEach(p => { const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
  const mapTl = gsap.timeline({ scrollTrigger: { trigger: '.location-map', start: 'top 75%', once: true } });
  mapTl.to(roads, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.08 })
    .from('.map-blocks rect', { scale: 0, transformOrigin: 'center', opacity: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.06 }, 0.4)
    .from('.map-route', { opacity: 0, duration: 0.6 }, 1)
    .from('.map-drop', { y: -160, opacity: 0, duration: 1, ease: 'bounce.out' }, 1.1)
    .from('.map-label', { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out' }, 1.8);
  gsap.to('.map-route', { strokeDashoffset: -180, duration: 6, ease: 'none', repeat: -1 });
  gsap.from('.pin-code span', {
    yPercent: 100, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06,
    scrollTrigger: { trigger: '.pin-code', start: 'top 90%', once: true }
  });
  ScrollTrigger.create({ trigger: '.pin-code', start: 'top 80%', once: true, onEnter: () => setTimeout(() => $('.pin-code').classList.add('is-lit'), 700) });
  // enquire background parallax + rent card entrance
  gsap.fromTo('.enquire-bg', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.enquire', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.rent-card', {
    y: 160, rotateY: -35, rotateX: 12, opacity: 0, transformPerspective: 1000, duration: 1.6, ease: 'expo.out',
    scrollTrigger: { trigger: '.rent-card', start: 'top 90%', once: true }
  });
  // compare frame 3D entrance
  gsap.from('.compare-frame', {
    rotateY: 18, rotateX: 6, scale: 0.9, transformPerspective: 1200, duration: 1.6, ease: 'expo.out',
    scrollTrigger: { trigger: '.compare-frame', start: 'top 85%', once: true }
  });
  // footer letters rise with scroll
  gsap.fromTo('.footer-mark span', { yPercent: 100 }, {
    yPercent: 0, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.8 }
  });
  // section index lines slide in
  gsap.utils.toArray('.ticker').forEach(t => gsap.fromTo(t, { rotate: -2.5, scale: 1.04 }, {
    rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: t, start: 'top bottom', end: 'bottom 40%', scrub: true }
  }));
}

/* ------------------------------------------------------------------ FAQ */
$$('.faq-list details').forEach(d => {
  const summary = $('summary', d), body = $('.faq-body', d);
  summary.addEventListener('click', e => {
    if (calm) return;
    e.preventDefault();
    if (d.open) {
      gsap.to(body, { height: 0, opacity: 0, duration: 0.5, ease: 'expo.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'all' }); ScrollTrigger.refresh(); } });
    } else {
      d.open = true;
      gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.7, ease: 'expo.out', onComplete: () => { gsap.set(body, { clearProps: 'all' }); ScrollTrigger.refresh(); } });
    }
  });
});

/* ---------------------------------------------------------- motion toggle */
const motionBtn = $('#motion-toggle');
function applyMotion() {
  root.classList.toggle('calm', calm);
  motionBtn.textContent = calm ? 'Motion off' : 'Motion on';
  motionBtn.setAttribute('aria-pressed', String(calm));
  heroApi && heroApi.setCalm(calm);
  if (calm) { stopLenis(); tickerTween.pause(); } else { startLenis(); lenis && lenis.start(); tickerTween.resume(); }
  if (calm) $$('[data-reveal]').forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
  paintTour(); paintStrip();
  ScrollTrigger.refresh();
}
motionBtn.addEventListener('click', () => { calm = !calm; applyMotion(); });
reduceQuery.addEventListener('change', e => { calm = e.matches; applyMotion(); });

/* ------------------------------------------------------------------ boot */
if (calm) {
  setupReducedReveals();
  tickerTween.pause();
} else {
  setupReveals();
  setupSectionFx();
}
buildHeroTimeline();
animateTilesIn(false);
setupPointerFx();
setupCursor();
paintTour();
addEventListener('load', () => ScrollTrigger.refresh());
if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
