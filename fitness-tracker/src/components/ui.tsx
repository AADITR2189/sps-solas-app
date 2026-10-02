import { useEffect, type ReactNode, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { useReveal } from '../lib/reveal';

export type Tone = 'default' | 'str' | 'car' | 'gold' | 'danger';

export function Card({
  children,
  className = '',
  index = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger position for the entry animation. */
  index?: number;
  style?: CSSProperties;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${Math.min(index, 8) * 80}ms`, ...style }}
      className={`reveal rounded-card border border-line bg-surface p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-10 flex items-end justify-between gap-3 px-0.5">
      <h2 className="eyebrow">{children}</h2>
      {action}
    </div>
  );
}

const toneText: Record<Tone, string> = {
  default: 'text-ink',
  str: 'text-str',
  car: 'text-car',
  gold: 'text-gold',
  danger: 'text-danger',
};

export function Stat({
  label,
  value,
  sub,
  tone = 'default',
  index,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  index?: number;
}) {
  return (
    <Card index={index} className="p-4">
      <div className="eyebrow leading-tight">{label}</div>
      <div className={`h-display num mt-2 text-[28px] ${toneText[tone]}`}>{value}</div>
      {sub !== undefined && <div className="mt-1 text-xs leading-snug text-muted">{sub}</div>}
    </Card>
  );
}

/** Small uppercase pill for statuses and categories. */
export function Tag({ tone = 'default', children }: { tone?: Tone; children: ReactNode }) {
  const t = {
    default: 'bg-raised text-muted',
    str: 'bg-str-soft text-str',
    car: 'bg-car-soft text-car',
    gold: 'bg-gold-soft text-gold',
    danger: 'bg-danger-soft text-danger',
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em] ${t}`}>{children}</span>;
}

/** Soft square icon badge. */
export function IconBadge({ tone = 'default', children, size = 'md' }: { tone?: Tone; children: ReactNode; size?: 'sm' | 'md' }) {
  const t = {
    default: 'bg-raised text-ink',
    str: 'bg-str-soft text-str',
    car: 'bg-car-soft text-car',
    gold: 'bg-gold-soft text-gold',
    danger: 'bg-danger-soft text-danger',
  }[tone];
  return <span className={`grid shrink-0 place-items-center rounded-lg ${size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'} ${t}`}>{children}</span>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg' | 'sm';
};

export function Button({ variant = 'secondary', size = 'md', className = '', ...p }: BtnProps) {
  const v = {
    primary: 'bg-primary text-primary-ink hover:bg-primary-hover font-medium',
    secondary: 'bg-surface text-ink border border-line hover:bg-raised',
    ghost: 'text-muted hover:bg-raised',
    danger: 'bg-danger-soft text-danger border border-danger/20',
  }[variant];
  const s = { sm: 'h-9 px-3 text-sm', md: 'h-12 px-4', lg: 'h-14 px-5 text-base' }[size];
  return (
    <button
      {...p}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-btn transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-40 ${v} ${s} ${className}`}
    />
  );
}

/** Segmented filter button. */
export function Chip({
  active,
  children,
  onClick,
  className = '',
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 shrink-0 whitespace-nowrap rounded-btn border px-3 text-sm transition-colors active:scale-[0.98] ${
        active ? 'border-primary bg-primary font-medium text-primary-ink' : 'border-line bg-surface text-ink hover:bg-raised'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Bottom sheet modal — thumb-friendly on phones, centred dialog on desktop. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-card border border-line bg-surface pb-safe sm:rounded-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="h-display text-xl">{title}</h3>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-btn hover:bg-raised" aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <div className="h-display text-xl">{title}</div>
      {children && <div className="mt-1 max-w-xs text-sm text-muted">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 pb-6 pt-8">
      <div className="min-w-0">
        {sub && <div className="eyebrow mb-1">{sub}</div>}
        <h1 className="h-display truncate text-[28px] sm:text-[34px]">{title}</h1>
      </div>
      {right && <div className="flex shrink-0 gap-2">{right}</div>}
    </header>
  );
}

export function NumberInput({
  value,
  onChange,
  label,
  step = 1,
  min = 0,
  className = '',
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  label?: string;
  step?: number;
  min?: number;
  className?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      aria-label={label}
      placeholder={placeholder}
      min={min}
      step={step}
      value={value === undefined || Number.isNaN(value) ? '' : value}
      onFocus={(e) => e.target.select()}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      className={`num h-12 w-full rounded-btn border border-line bg-bg px-3 text-center text-lg font-medium outline-none transition-colors placeholder:text-muted/60 focus:border-ink/40 ${className}`}
    />
  );
}

export const inputCls =
  'h-12 w-full rounded-btn border border-line bg-bg px-3 text-base text-ink outline-none transition-colors focus:border-ink/40 placeholder:text-muted/70';

export function Field({ label, children, hint, group }: { label: string; children: ReactNode; hint?: ReactNode; group?: boolean }) {
  // A <label> may only wrap one control; groups of buttons get role="group" instead.
  const inner = (
    <>
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </>
  );
  return group ? (
    <div role="group" aria-label={label}>
      {inner}
    </div>
  ) : (
    <label className="block">{inner}</label>
  );
}

/** Thin horizontal progress bar. */
export function Progress({ pct, tone = 'str' }: { pct: number; tone?: Tone }) {
  const fill = { default: 'bg-ink', str: 'bg-str', car: 'bg-car', gold: 'bg-gold', danger: 'bg-danger' }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised">
      <div className={`h-full rounded-full ${fill} transition-[width] duration-700`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function IconButton({ label, onClick, children, to }: { label: string; onClick?: () => void; children: ReactNode; to?: string }) {
  const cls = 'grid h-11 w-11 place-items-center rounded-btn border border-line bg-surface text-ink hover:bg-raised';
  if (to)
    return (
      <Link to={to} className={cls} aria-label={label}>
        {children}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls} aria-label={label}>
      {children}
    </button>
  );
}
