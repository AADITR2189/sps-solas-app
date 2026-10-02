import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MagnifyingGlass, CaretDown, Plus, Trophy } from '@phosphor-icons/react';
import { useData } from '../hooks/useData';
import { Card, Tag, inputCls } from '../components/ui';
import { FavStar, FilterRow, useExerciseSearch, type ExerciseFilter } from '../components/ExercisePicker';
import { groupName } from '../data/exercises';
import { fmtNum } from '../lib/stats';
import { formatShort, todayKey } from '../lib/date';

/** Searchable, filterable exercise library with per-exercise history and records. */
export default function ExercisesPage() {
  const nav = useNavigate();
  const { sessions, records, settings } = useData();
  const { search, usage } = useExerciseSearch();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<ExerciseFilter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const items = search(q, filter);
  const usageBy = useMemo(() => new Map(usage.map((u) => [u.exercise, u])), [usage]);
  const prBy = useMemo(() => new Map(records.map((r) => [r.exercise, r])), [records]);

  const history = (name: string) =>
    sessions
      .flatMap((s) => s.strength.filter((e) => e.exercise === name).map((e) => ({ date: s.date, sets: e.sets })))
      .slice(0, 5);

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 pt-6">
        <button
          onClick={() => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/'))}
          className="grid h-11 w-11 place-items-center rounded-btn border border-line bg-surface"
          aria-label="Back"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>
        <h1 className="h-display text-[34px]">Exercises</h1>
      </div>
      <p className="mt-1 text-sm text-muted">
        {items.length} of {search('', 'all').length} exercises. Star the ones you use most.
      </p>

      <div className="relative mt-5">
        <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises" className={`${inputCls} pl-10`} aria-label="Search exercises" />
      </div>
      <div className="mt-3 [&>div]:-mx-4 [&>div]:px-4">
        <FilterRow value={filter} onChange={setFilter} />
      </div>

      <Card className="mt-4 p-0">
        <ul className="divide-y divide-line">
          {items.map((it) => {
            const u = usageBy.get(it.name);
            const pr = prBy.get(it.name);
            const key = it.group + it.name;
            const isOpen = open === key;
            return (
              <li key={key}>
                <div className="flex items-center gap-2 pl-4">
                  <button className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 py-2 text-left" onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{it.name}</div>
                      <div className="num text-xs text-muted">
                        {u ? `${u.count} sessions · last ${formatShort(u.last)}` : 'Not logged yet'}
                        {pr && pr.maxWeight > 0 && ` · best ${fmtNum(pr.maxWeight, 1)} ${settings.weightUnit}`}
                      </div>
                    </div>
                    <Tag>{groupName(it.group)}</Tag>
                    <CaretDown size={14} weight="bold" className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <FavStar name={it.name} />
                </div>
                {isOpen && (
                  <div className="border-t border-line bg-bg px-4 py-3">
                    {pr && (
                      <div className="mb-2 flex items-center gap-2 text-sm">
                        <Trophy size={14} weight="fill" className="text-gold" />
                        <span className="num">
                          Best {fmtNum(pr.maxWeight, 1)} {settings.weightUnit} × {pr.maxWeightReps} · e1RM {fmtNum(pr.best1rm, 1)}
                        </span>
                      </div>
                    )}
                    {history(it.name).length ? (
                      <ul className="num space-y-1 font-mono text-xs text-muted">
                        {history(it.name).map((h, i) => (
                          <li key={i}>
                            {formatShort(h.date)} — {h.sets.map((x) => `${x.weight}×${x.reps}`).join(', ')}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted">No history yet.</p>
                    )}
                    <Link
                      to={`/log/edit?${new URLSearchParams({ kind: 'strength', date: todayKey(), exercise: it.name, group: it.group })}`}
                      className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-btn bg-primary px-3 text-sm font-medium text-primary-ink"
                    >
                      <Plus size={14} weight="bold" /> Log today
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!items.length && <p className="px-4 py-10 text-center text-sm text-muted">No exercises match. You can add custom ones while logging a workout.</p>}
      </Card>
    </div>
  );
}
