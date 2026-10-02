import { useMemo, useState } from 'react';
import { Search, Star, Plus } from 'lucide-react';
import { Sheet, Chip, Button, inputCls } from './ui';
import { useData } from '../hooks/useData';
import { MUSCLE_GROUPS, type MuscleGroup } from '../types';
import { exerciseUsage, cardioUsage } from '../lib/stats';
import { addCustomCardio, addCustomExercise, toggleFavorite, uid } from '../db/db';

type Tab = 'favorites' | 'recent' | 'frequent' | MuscleGroup;

const cap = (g: string) => g[0] + g.slice(1).toLowerCase();

export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: string, group: MuscleGroup) => void;
}) {
  const { library, sessions, favoriteSet } = useData();
  const [tab, setTab] = useState<Tab>('CHEST');
  const [q, setQ] = useState('');
  const [customGroup, setCustomGroup] = useState<MuscleGroup>('CHEST');

  const usage = useMemo(() => exerciseUsage(sessions), [sessions]);
  const groupOf = useMemo(() => {
    const m = new Map<string, MuscleGroup>();
    for (const g of MUSCLE_GROUPS) for (const e of library[g]) if (!m.has(e)) m.set(e, g);
    for (const u of usage) m.set(u.exercise, u.muscleGroup);
    return m;
  }, [library, usage]);

  const items: { name: string; group: MuscleGroup }[] = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query) {
      const out: { name: string; group: MuscleGroup }[] = [];
      for (const g of MUSCLE_GROUPS)
        for (const e of library[g]) if (e.toLowerCase().includes(query)) out.push({ name: e, group: g });
      return out;
    }
    if (tab === 'favorites')
      return [...favoriteSet]
        .filter((k) => k.startsWith('strength:'))
        .map((k) => k.slice(9))
        .map((n) => ({ name: n, group: groupOf.get(n) ?? 'FULL BODY' }));
    if (tab === 'recent')
      return [...usage]
        .sort((a, b) => (a.last < b.last ? 1 : -1))
        .slice(0, 15)
        .map((u) => ({ name: u.exercise, group: u.muscleGroup }));
    if (tab === 'frequent')
      return [...usage]
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)
        .map((u) => ({ name: u.exercise, group: u.muscleGroup }));
    return library[tab].map((n) => ({ name: n, group: tab }));
  }, [q, tab, library, favoriteSet, usage, groupOf]);

  const addCustom = async () => {
    const name = q.trim();
    if (!name) return;
    await addCustomExercise({ id: uid(), name, muscleGroup: customGroup });
    onPick(name, customGroup);
    setQ('');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'favorites', label: '★ Favorites' },
    { id: 'recent', label: 'Recent' },
    { id: 'frequent', label: 'Frequent' },
    ...MUSCLE_GROUPS.map((g) => ({ id: g as Tab, label: cap(g) })),
  ];

  const exact = q.trim() && items.some((i) => i.name.toLowerCase() === q.trim().toLowerCase());

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search or type a new exercise"
          className={`${inputCls} pl-10`}
        />
      </div>
      {!q && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {tabs.map((t) => (
            <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </Chip>
          ))}
        </div>
      )}
      <ul className="mt-3 divide-y divide-line">
        {items.map((it) => {
          const fav = favoriteSet.has(`strength:${it.name}`);
          return (
            <li key={it.group + it.name} className="flex items-center gap-2">
              <button className="flex min-h-[52px] flex-1 flex-col items-start justify-center py-2 text-left" onClick={() => onPick(it.name, it.group)}>
                <span className="font-medium">{it.name}</span>
                {(q || tab === 'favorites' || tab === 'recent' || tab === 'frequent') && (
                  <span className="text-xs text-muted">{cap(it.group)}</span>
                )}
              </button>
              <button
                aria-label={fav ? 'Remove favorite' : 'Add favorite'}
                onClick={() => toggleFavorite(`strength:${it.name}`)}
                className="grid h-11 w-11 place-items-center"
              >
                <Star size={20} className={fav ? 'fill-gold text-gold' : 'text-muted'} />
              </button>
            </li>
          );
        })}
      </ul>
      {!items.length && !q && (
        <p className="py-6 text-center text-sm text-muted">
          {tab === 'favorites' ? 'Tap ★ next to any exercise to make it a favorite.' : 'Nothing logged yet.'}
        </p>
      )}
      {q.trim() && !exact && (
        <div className="mt-4 rounded-2xl border border-line bg-raised p-3">
          <div className="mb-2 text-sm text-muted">Create custom exercise “{q.trim()}”</div>
          <select
            value={customGroup}
            onChange={(e) => setCustomGroup(e.target.value as MuscleGroup)}
            className={inputCls}
          >
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {cap(g)}
              </option>
            ))}
          </select>
          <Button variant="primary" className="mt-2 w-full" onClick={addCustom}>
            <Plus size={18} /> Add “{q.trim()}”
          </Button>
        </div>
      )}
    </Sheet>
  );
}

export function CardioPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (activity: string) => void;
}) {
  const { cardioActivities, sessions, favoriteSet } = useData();
  const [q, setQ] = useState('');
  const recent = useMemo(
    () =>
      cardioUsage(sessions)
        .sort((a, b) => (a.last < b.last ? 1 : -1))
        .slice(0, 6)
        .map((c) => c.activity),
    [sessions],
  );
  const favs = [...favoriteSet].filter((k) => k.startsWith('cardio:')).map((k) => k.slice(7));
  const list = cardioActivities.filter((a) => a.toLowerCase().includes(q.trim().toLowerCase()));
  const exact = cardioActivities.some((a) => a.toLowerCase() === q.trim().toLowerCase());

  const addCustom = async () => {
    const name = q.trim();
    if (!name) return;
    await addCustomCardio({ id: uid(), name });
    onPick(name);
    setQ('');
  };

  const Grid = ({ names }: { names: string[] }) => (
    <div className="grid grid-cols-2 gap-2">
      {names.map((a) => {
        const fav = favoriteSet.has(`cardio:${a}`);
        return (
          <div key={a} className="flex items-center rounded-xl border border-line bg-raised">
            <button className="min-h-[52px] flex-1 px-3 py-2 text-left text-sm font-medium" onClick={() => onPick(a)}>
              {a}
            </button>
            <button
              aria-label={fav ? 'Remove favorite' : 'Add favorite'}
              onClick={() => toggleFavorite(`cardio:${a}`)}
              className="grid h-11 w-9 place-items-center"
            >
              <Star size={16} className={fav ? 'fill-gold text-gold' : 'text-muted/60'} />
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Cardio activity">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or add custom activity" className={`${inputCls} pl-10`} />
      </div>
      {!q && favs.length > 0 && (
        <>
          <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Favorites</div>
          <Grid names={favs} />
        </>
      )}
      {!q && recent.length > 0 && (
        <>
          <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Recent</div>
          <Grid names={recent} />
        </>
      )}
      <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">All activities</div>
      <Grid names={list} />
      {q.trim() && !exact && (
        <Button variant="cardio" className="mt-4 w-full" onClick={addCustom}>
          <Plus size={18} /> Add custom “{q.trim()}”
        </Button>
      )}
    </Sheet>
  );
}
