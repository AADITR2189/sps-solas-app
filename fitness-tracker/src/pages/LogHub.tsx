import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, HeartPulse, Zap, Star, Clock, Flame, Trash2, RotateCcw } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Card, PageHeader, SectionTitle, inputCls } from '../components/ui';
import { cardioUsage, exerciseUsage } from '../lib/stats';
import { formatLong, todayKey } from '../lib/date';
import { deleteTemplate } from '../db/db';
import { readDraft, clearDraft } from './Editor';
import type { MuscleGroup } from '../types';
import { MUSCLE_GROUPS } from '../types';

export default function LogHub() {
  const { sessions, templates, favoriteSet, library } = useData();
  const nav = useNavigate();
  const [date, setDate] = useState(todayKey());
  const [draft, setDraft] = useState(readDraft);

  const usage = useMemo(() => exerciseUsage(sessions), [sessions]);
  const frequent = [...usage].sort((a, b) => b.count - a.count).slice(0, 8);
  const recent = [...usage].sort((a, b) => (a.last < b.last ? 1 : -1)).slice(0, 8);
  const recentCardio = useMemo(() => cardioUsage(sessions).sort((a, b) => (a.last < b.last ? 1 : -1)).slice(0, 4), [sessions]);

  const groupOf = (name: string): MuscleGroup =>
    usage.find((u) => u.exercise === name)?.muscleGroup ?? MUSCLE_GROUPS.find((g) => library[g].includes(name)) ?? 'FULL BODY';
  const favs = [...favoriteSet].filter((k) => k.startsWith('strength:')).map((k) => k.slice(9));
  const favCardio = [...favoriteSet].filter((k) => k.startsWith('cardio:')).map((k) => k.slice(7));

  const q = (extra: Record<string, string>) => `/log/edit?${new URLSearchParams({ date, ...extra })}`;

  const QuickChip = ({ to, label, tone = 'accent' }: { to: string; label: string; tone?: 'accent' | 'cardio' }) => (
    <Link
      to={to}
      className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${
        tone === 'cardio' ? 'border-cardio/40 bg-cardio/10 text-cardio' : 'border-line bg-raised'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <PageHeader title="Log workout" sub={date === todayKey() ? 'Today' : 'Back-dating to'} />

      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Date</span>
        <input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value || todayKey())} className={`${inputCls} [color-scheme:dark]`} />
        {date !== todayKey() && <span className="mt-1 block text-xs text-gold">Logging a missed day: {formatLong(date)}</span>}
      </label>

      {draft && (
        <Card className="mt-4 border-gold/40 bg-gold/5">
          <div className="flex items-center gap-3">
            <RotateCcw className="text-gold" size={20} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Unsaved workout</div>
              <div className="truncate text-sm text-muted">
                {draft.name || (draft.kind === 'cardio' ? 'Cardio' : 'Strength')} · {formatLong(draft.date)}
              </div>
            </div>
            <button onClick={() => { clearDraft(); setDraft(null); }} className="grid h-10 w-10 place-items-center text-muted" aria-label="Discard draft">
              <Trash2 size={18} />
            </button>
            <Link to="/log/edit?resume=1" className="rounded-xl bg-gold px-4 py-2.5 font-semibold text-bg">
              Resume
            </Link>
          </div>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => nav(q({ kind: 'strength' }))}
          className="flex h-28 flex-col items-start justify-between rounded-2xl bg-accent p-4 text-left text-accent-ink active:opacity-80"
        >
          <Dumbbell size={28} />
          <span className="text-lg font-bold leading-tight">Strength<br />session</span>
        </button>
        <button
          onClick={() => nav(q({ kind: 'cardio' }))}
          className="flex h-28 flex-col items-start justify-between rounded-2xl bg-cardio p-4 text-left text-bg active:opacity-80"
        >
          <HeartPulse size={28} />
          <span className="text-lg font-bold leading-tight">Cardio<br />session</span>
        </button>
      </div>

      <SectionTitle>
        <span className="inline-flex items-center gap-1"><Zap size={13} /> One-tap templates</span>
      </SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((t) => (
          <div key={t.id} className="relative">
            <Link
              to={q({ template: t.id })}
              className={`flex min-h-[64px] flex-col justify-center rounded-2xl border px-3 py-2 active:bg-raised ${
                t.kind === 'cardio' ? 'border-cardio/30 bg-cardio/5' : 'border-line bg-surface'
              }`}
            >
              <span className="font-semibold">{t.name}</span>
              <span className="truncate text-xs text-muted">
                {t.kind === 'cardio' ? t.cardio.map((c) => c.activity).join(', ') : `${t.strength.length} exercises`}
              </span>
            </Link>
            {!t.builtIn && (
              <button
                onClick={() => confirm(`Delete template “${t.name}”?`) && deleteTemplate(t.id)}
                className="absolute right-1 top-1 grid h-8 w-8 place-items-center text-muted"
                aria-label="Delete template"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {(favs.length > 0 || favCardio.length > 0) && (
        <>
          <SectionTitle>
            <span className="inline-flex items-center gap-1"><Star size={13} /> Favorites</span>
          </SectionTitle>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {favs.map((f) => <QuickChip key={f} to={q({ kind: 'strength', exercise: f, group: groupOf(f) })} label={f} />)}
            {favCardio.map((f) => <QuickChip key={f} tone="cardio" to={q({ kind: 'cardio', activity: f })} label={f} />)}
          </div>
        </>
      )}

      {frequent.length > 0 && (
        <>
          <SectionTitle>
            <span className="inline-flex items-center gap-1"><Flame size={13} /> Frequently used</span>
          </SectionTitle>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {frequent.map((u) => (
              <QuickChip key={u.exercise} to={q({ kind: 'strength', exercise: u.exercise, group: u.muscleGroup })} label={`${u.exercise} · ${u.count}×`} />
            ))}
          </div>
        </>
      )}

      {(recent.length > 0 || recentCardio.length > 0) && (
        <>
          <SectionTitle>
            <span className="inline-flex items-center gap-1"><Clock size={13} /> Recently used</span>
          </SectionTitle>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {recent.map((u) => (
              <QuickChip key={u.exercise} to={q({ kind: 'strength', exercise: u.exercise, group: u.muscleGroup })} label={u.exercise} />
            ))}
            {recentCardio.map((c) => (
              <QuickChip key={c.activity} tone="cardio" to={q({ kind: 'cardio', activity: c.activity })} label={c.activity} />
            ))}
          </div>
        </>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        Tip: tap ★ next to any exercise when adding it to pin it here. Save any workout as a template from the editor.
      </p>
    </div>
  );
}
