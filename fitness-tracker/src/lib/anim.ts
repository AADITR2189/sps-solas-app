import { useEffect, useRef, useState } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Animates a number from its previous value (0 on first mount) to `value`.
 * Ease-out cubic; returns the target immediately when the user prefers reduced motion.
 */
export function useCountUp(value: number, duration = 700) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  const from = useRef(prefersReducedMotion() ? value : 0);
  useEffect(() => {
    if (prefersReducedMotion() || !isFinite(value)) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);
  return shown;
}

/** True once the element has scrolled into view (stays true). */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      // Root extended far upwards: anything already scrolled past also counts as seen,
      // so fast flings/jumps never leave content unmounted.
      { rootMargin: '100000px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

/** Flips to true for `ms` whenever `trigger` turns from falsy to truthy (not on first render). */
export function useFlash(trigger: boolean, ms = 900) {
  const [on, setOn] = useState(false);
  const prev = useRef(trigger);
  useEffect(() => {
    if (trigger && !prev.current) {
      setOn(true);
      const t = window.setTimeout(() => setOn(false), ms);
      prev.current = trigger;
      return () => window.clearTimeout(t);
    }
    prev.current = trigger;
  }, [trigger, ms]);
  return on;
}
