import { useCountUp, useInView } from '../lib/anim';

/**
 * Number that counts up to its value once it scrolls into view;
 * `format` turns the in-between number into text.
 */
export default function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const n = useCountUp(inView ? value : 0, duration);
  return (
    <span ref={ref} className="num">
      {format(n)}
    </span>
  );
}
