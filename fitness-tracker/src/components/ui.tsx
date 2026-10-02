import { useEffect, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'accent' | 'cardio' | 'gold';
}) {
  const color = { default: 'text-white', accent: 'text-accent', cardio: 'text-cardio', gold: 'text-gold' }[tone];
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'cardio';
  size?: 'md' | 'lg' | 'sm';
};

export function Button({ variant = 'secondary', size = 'md', className = '', ...p }: BtnProps) {
  const v = {
    primary: 'bg-accent text-accent-ink font-semibold active:bg-lime-300',
    cardio: 'bg-cardio text-bg font-semibold active:bg-sky-300',
    secondary: 'bg-raised text-white border border-line active:bg-line',
    ghost: 'text-muted active:bg-raised',
    danger: 'bg-danger/10 text-danger border border-danger/30 active:bg-danger/20',
  }[variant];
  const s = { sm: 'h-9 px-3 text-sm', md: 'h-12 px-4', lg: 'h-14 px-5 text-lg' }[size];
  return (
    <button
      {...p}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-xl transition-colors disabled:opacity-40 ${v} ${s} ${className}`}
    />
  );
}

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
      className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-3 text-sm transition-colors ${
        active ? 'border-accent bg-accent text-accent-ink font-semibold' : 'border-line bg-raised text-white/90'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Bottom sheet modal — thumb-friendly on phones. */
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
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl border border-line bg-surface pb-safe sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-raised" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <div className="font-semibold">{title}</div>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 pb-2 pt-4">
      <div className="min-w-0">
        {sub && <div className="text-sm text-muted">{sub}</div>}
        <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {right}
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
      className={`h-12 w-full rounded-xl border border-line bg-raised px-3 text-center text-lg font-semibold tabular-nums outline-none focus:border-accent ${className}`}
    />
  );
}

export const inputCls =
  'h-12 w-full rounded-xl border border-line bg-raised px-3 text-base outline-none focus:border-accent placeholder:text-muted/70';
