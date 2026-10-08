import { useEffect, useRef } from 'react';

// One shared IntersectionObserver: elements fade/rise in once as they enter the viewport.
let io: IntersectionObserver | null = null;
function observer() {
  if (!io && typeof IntersectionObserver !== 'undefined')
    io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io?.unobserve(e.target);
          }
        }),
      // Extended upwards so content skipped by a fast scroll is revealed too.
      { rootMargin: '100000px 0px -24px 0px', threshold: 0 },
    );
  return io;
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    const o = observer();
    if (!el) return;
    if (!o) {
      el.classList.add('is-in');
      return;
    }
    o.observe(el);
    return () => o.unobserve(el);
  }, []);
  return ref;
}
