// Lightweight motion helpers — scroll reveal, parallax, count-up.
// All respect prefers-reduced-motion.
import { useEffect, useRef } from 'react';

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Global reveal: watches every .reveal element and adds .is-visible when it
 * scrolls into view. Call once on app mount. Re-scans on DOM changes so
 * async-rendered sections (Firestore data) get observed too.
 */
export function initReveal() {
  if (typeof window === 'undefined') return;
  if (prefersReduced()) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  const scan = () => document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
  scan();
  const mo = new MutationObserver(scan);
  mo.observe(document.body, { childList: true, subtree: true });
  return () => {
    io.disconnect();
    mo.disconnect();
  };
}

/** Parallax: translate an element on scroll. speed ~0.1–0.4 (fraction of scroll). */
export function useParallax(speed = 0.25) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);
  return ref;
}

/**
 * Horizontal pin: turns a tall section into a "scroll-jack" where vertical
 * scroll drives horizontal movement of an inner track. Desktop only
 * (>=992px) and disabled under reduced-motion — otherwise the section is a
 * normal-height vertical block (CSS handles the grid fallback).
 * Pass a stable dependency key (for example filteredCount) to recompute when content changes.
 */
export function useHorizontalPin(dependencyKey = null) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const active = () =>
      window.matchMedia('(min-width: 992px)').matches && !prefersReduced();

    let raf = 0;
    const render = () => {
      raf = 0;
      if (!active()) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const progress = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
      const dist = Math.max(0, track.scrollWidth - window.innerWidth);
      track.style.transform = `translate3d(${(-progress * dist).toFixed(1)}px,0,0)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(render); };
    const layout = () => {
      if (!active()) { section.style.height = ''; track.style.transform = ''; return; }
      const dist = Math.max(0, track.scrollWidth - window.innerWidth);
      section.style.height = `${dist + window.innerHeight}px`;
      render();
    };

    layout();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', layout);
    // images change track width as they load
    track.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', layout, { once: true });
    });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', layout);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [dependencyKey]);

  return { sectionRef, trackRef };
}

/** Count-up: animates an element's text from 0 → target when scrolled into view. */
export function useCountUp(target, { duration = 1600, suffix = '' } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const end = parseFloat(target) || 0;
    if (!el) return;
    if (prefersReduced()) { el.textContent = `${end}${suffix}`; return; }
    let started = false;
    const run = () => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = `${Math.round(end * eased)}${suffix}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started) { started = true; run(); io.disconnect(); }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration, suffix]);
  return ref;
}
