import { useMemo, useRef, useState } from 'react';
import { MagnifyingGlass, Star, Plus } from '@phosphor-icons/react';
import { Sheet, Chip, Button, Tag, inputCls } from './ui';
import { useData } from '../hooks/useData';
import { MUSCLE_GROUPS, type MuscleGroup } from '../types';
import { exerciseUsage, cardioUsage } from '../lib/stats';
import { addCustomCardio, addCustomExercise, toggleFavorite, uid } from '../db/db';
import { MUSCLE_GROUP_INFO, groupName } from '../data/exercises';
import { CARDIO_CATEGORIES } from '../data/cardio';

export type ExerciseFilter = 'all' | 'favorites' | 'recent' | 'frequent' | 'custom' | 'LEGS' | MuscleGroup;
type Item = { name: string; group: MuscleGroup };

/** Shared search + filter logic for the picker sheet, the inline autocomplete and the library page. */
export function useExerciseSearch() {
  const { library, sessions, favoriteSet, customExercises } = useData();
  const usage = useMemo(() => exerciseUsage(sessions), [sessions]);

  const all: Item[] = useMemo(() => {
    const seen = new Set<string>();
    const out: Item[] = [];
    for (const g of MUSCLE_GROUPS)
      for (const name of library[g]) {
        const k = g + name;
        if (!seen.has(k)) {
          seen.add(k);
          out.push({ name, group: g });
        }
      }
    return out;
  }, [library]);

  const groupOf = useMemo(() => {
    const m = new Map<string, MuscleGroup>();
    for (const it of all) if (!m.has(it.name)) m.set(it.name, it.group);
    for (const u of usage) m.set(u.exercise, u.muscleGroup);
    return m;
  }, [all, usage]);

  function search(q: string, filter: ExerciseFilter): Item[] {
    const query = q.trim().toLowerCase();
    let base: Item[];
    switch (filter) {
      case 'favorites':
        base = [...favoriteSet].filter((k) => k.startsWith('strength:')).map((k) => ({ name: k.slice(9), group: groupOf.get(k.slice(9)) ?? 'FULL BODY' }));
        break;
      case 'recent':
        base = [...usage].sort((a, b) => (a.last < b.last ? 1 : -1)).slice(0, 20).map((u) => ({ name: u.exercise, group: u.muscleGroup }));
        break;
      case 'frequent':
        base = [...usage].sort((a, b) => b.count - a.count).slice(0, 20).map((u) => ({ name: u.exercise, group: u.muscleGroup }));
        break;
      case 'custom':
        base = customExercises.map((e) => ({ name: e.name, group: e.muscleGroup }));
        break;
      case 'LEGS':
        base = all.filter((i) => MUSCLE_GROUP_INFO.find((m) => m.id === i.group)?.region === 'Legs');
        break;
      case 'all':
        base = all;
        break;
      default:
        base = all.filter((i) => i.group === filter);
    }
    if (!query) return base;
    // Rank: starts-with, then word-starts-with, then contains.
    const scored = base
      .map((i) => {
        const n = i.name.toLowerCase();
        const score = n.startsWith(query) ? 0 : n.split(/[\s-]+/).some((w) => w.startsWith(query)) ? 1 : n.includes(query) ? 2 : 9;
        return { i, score };
      })
      .filter((x) => x.score < 9)
      .sort((a, b) => a.score - b.score || a.i.name.localeCompare(b.i.name));
    return scored.map((x) => x.i);
  }

  return { search, all, usage, favoriteSet };
}

export const FILTERS: { id: ExerciseFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'recent', label: 'Recent' },
  { id: 'frequent', label: 'Frequent' },
  { id: 'custom', label: 'Custom' },
  { id: 'CHEST', label: 'Chest' },
  { id: 'BACK', label: 'Back' },
  { id: 'SHOULDERS', label: 'Shoulders' },
  { id: 'BICEPS', label: 'Biceps' },
  { id: 'TRICEPS', label: 'Triceps' },
  { id: 'FOREARMS', label: 'Forearms' },
  { id: 'LEGS', label: 'Legs (all)' },
  { id: 'QUADS', label: 'Quads' },
  { id: 'HAMSTRINGS', label: 'Hamstrings' },
  { id: 'GLUTES', label: 'Glutes' },
  { id: 'CALVES', label: 'Calves' },
  { id: 'ABS', label: 'Core / Abs' },
  { id: 'FULL BODY', label: 'Full Body' },
];

export function FilterRow({ value, onChange }: { value: ExerciseFilter; onChange: (f: ExerciseFilter) => void }) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
      {FILTERS.map((t) => (
        <Chip key={t.id} active={value === t.id} onClick={() => onChange(t.id)}>
          {t.label}
        </Chip>
      ))}
    </div>
  );
}

export function FavStar({ name, kind = 'strength' }: { name: string; kind?: 'strength' | 'cardio' }) {
  const { favoriteSet } = useData();
  const fav = favoriteSet.has(`${kind}:${name}`);
  return (
    <button
      aria-label={fav ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(`${kind}:${name}`);
      }}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-btn hover:bg-raised"
    >
      <Star size={18} weight={fav ? 'fill' : 'bold'} className={fav ? 'text-gold' : 'text-muted/70'} />
    </button>
  );
}

/**
 * Always-visible "+ Add custom ..." control. Tapping opens a small form (name + type).
 * If the search box has text with no exact match, that text pre-fills the name.
 */
function CustomAdd({
  noun,
  query,
  options,
  defaultOption,
  existing,
  onAdd,
}: {
  noun: string;
  query: string;
  options: { value: string; label: string }[];
  defaultOption: string;
  existing: string[];
  onAdd: (name: string, option: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [opt, setOpt] = useState(defaultOption);
  const q = query.trim();
  const qIsNew = !!q && !existing.some((e) => e.toLowerCase() === q.toLowerCase());
  const clean = name.trim();
  const dupe = !!clean && existing.some((e) => e.toLowerCase() === clean.toLowerCase());

  if (!open)
    return (
      <Button
        className="mt-3 w-full border-dashed"
        onClick={() => {
          setName(qIsNew ? q : '');
          setOpt(defaultOption);
          setOpen(true);
        }}
      >
        <Plus size={16} weight="bold" /> {qIsNew ? `Add “${q}” as custom ${noun}` : `Add custom ${noun}`}
      </Button>
    );

  return (
    <div className="mt-3 rounded-card border border-line bg-bg p-4">
      <div className="eyebrow mb-2">New custom {noun}</div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`${noun[0].toUpperCase() + noun.slice(1)} name`}
        aria-label={`Custom ${noun} name`}
        className={inputCls}
      />
      <select value={opt} onChange={(e) => setOpt(e.target.value)} className={`${inputCls} mt-2`} aria-label={`Custom ${noun} type`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {dupe && <p className="mt-2 text-sm text-danger">That {noun} already exists. Pick it from the list instead.</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          variant="primary"
          disabled={!clean || dupe}
          onClick={async () => {
            await onAdd(clean, opt);
            setOpen(false);
            setName('');
          }}
        >
          <Plus size={16} weight="bold" /> Save
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">Saved permanently on this phone and included in backups.</p>
    </div>
  );
}

export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: string, group: MuscleGroup) => void;
}) {
  const { search } = useExerciseSearch();
  const [filter, setFilter] = useState<ExerciseFilter>('all');
  const [q, setQ] = useState('');
  const items = search(q, filter);
  const allNames = search('', 'all').map((i) => i.name);

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="relative">
        <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises" className={`${inputCls} pl-10`} />
      </div>
      <CustomAdd
        noun="exercise"
        query={q}
        existing={allNames}
        options={MUSCLE_GROUP_INFO.map((g) => ({ value: g.id, label: g.name }))}
        defaultOption={filter in { CHEST: 1, BACK: 1, SHOULDERS: 1, BICEPS: 1, TRICEPS: 1, FOREARMS: 1, QUADS: 1, HAMSTRINGS: 1, GLUTES: 1, CALVES: 1, ABS: 1, 'FULL BODY': 1 } ? filter : 'CHEST'}
        onAdd={async (name, g) => {
          await addCustomExercise(name, g as MuscleGroup);
          onPick(name, g as MuscleGroup);
          setQ('');
        }}
      />
      <div className="mt-3">
        <FilterRow value={filter} onChange={setFilter} />
      </div>
      <ul className="mt-2 divide-y divide-line">
        {items.map((it) => (
          <li key={it.group + it.name} className="flex items-center gap-2">
            <button className="flex min-h-[52px] flex-1 items-center justify-between gap-2 py-2 text-left" onClick={() => onPick(it.name, it.group)}>
              <span className="font-medium">{it.name}</span>
              <Tag>{groupName(it.group)}</Tag>
            </button>
            <FavStar name={it.name} />
          </li>
        ))}
      </ul>
      {!items.length && !q && (
        <p className="py-8 text-center text-sm text-muted">
          {filter === 'favorites' ? 'Tap the star next to any exercise to keep it here.' : 'Nothing here yet.'}
        </p>
      )}
    </Sheet>
  );
}

/** Inline type-ahead: type a few letters, tap a suggestion, done. */
export function ExerciseAutocomplete({ onPick }: { onPick: (exercise: string, group: MuscleGroup) => void }) {
  const { search } = useExerciseSearch();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const items = q.trim() ? search(q, 'all').slice(0, 6) : [];
  const pick = (name: string, g: MuscleGroup) => {
    onPick(name, g);
    setQ('');
    inputRef.current?.blur();
  };
  return (
    <div className="relative">
      <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-[14px] text-muted" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        onKeyDown={(e) => e.key === 'Enter' && items[0] && pick(items[0].name, items[0].group)}
        placeholder="Quick add: type an exercise"
        className={`${inputCls} pl-10`}
        role="combobox"
        aria-expanded={focus && items.length > 0}
        aria-label="Quick add exercise"
      />
      {focus && items.length > 0 && (
        <ul role="listbox" className="absolute inset-x-0 top-[52px] z-20 overflow-hidden rounded-card border border-line bg-surface shadow-lift">
          {items.map((it) => (
            <li key={it.group + it.name}>
              <button
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(it.name, it.group)}
                className="flex min-h-[48px] w-full items-center justify-between gap-2 px-4 text-left hover:bg-raised"
              >
                <span>{it.name}</span>
                <Tag>{groupName(it.group)}</Tag>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CardioPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (activity: string, category: string) => void;
}) {
  const { cardioGroups, sessions, favoriteSet, categoryOf } = useData();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const recent = useMemo(
    () => cardioUsage(sessions).sort((a, b) => (a.last < b.last ? 1 : -1)).slice(0, 6).map((c) => c.activity),
    [sessions],
  );
  const favs = [...favoriteSet].filter((k) => k.startsWith('cardio:')).map((k) => k.slice(7));
  const query = q.trim().toLowerCase();
  const groups = cardioGroups
    .filter((g) => cat === 'All' || g.category === cat)
    .map((g) => ({ ...g, activities: g.activities.filter((a) => a.toLowerCase().includes(query) || g.category.toLowerCase().includes(query)) }))
    .filter((g) => g.activities.length);
  const allActivities = cardioGroups.flatMap((g) => g.activities);

  const Grid = ({ names }: { names: string[] }) => (
    <div className="grid grid-cols-2 gap-2">
      {names.map((a) => (
        <div key={a} className="flex items-center rounded-btn border border-line bg-bg">
          <button className="min-h-[52px] flex-1 px-3 py-2 text-left text-sm font-medium" onClick={() => onPick(a, categoryOf(a))}>
            {a}
          </button>
          <FavStar name={a} kind="cardio" />
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Cardio activity">
      <div className="relative">
        <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activities" className={`${inputCls} pl-10`} />
      </div>
      <CustomAdd
        noun="activity"
        query={q}
        existing={allActivities}
        options={CARDIO_CATEGORIES.map((c) => ({ value: c.category, label: c.category }))}
        defaultOption={cat !== 'All' ? cat : 'Other Cardio'}
        onAdd={async (name, category) => {
          await addCustomCardio({ id: uid(), name, category });
          onPick(name, category);
          setQ('');
        }}
      />
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {['All', ...CARDIO_CATEGORIES.map((c) => c.category)].map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </Chip>
        ))}
      </div>
      {!q && cat === 'All' && favs.length > 0 && (
        <>
          <div className="eyebrow mb-2 mt-5">Favorites</div>
          <Grid names={favs} />
        </>
      )}
      {!q && cat === 'All' && recent.length > 0 && (
        <>
          <div className="eyebrow mb-2 mt-5">Recent</div>
          <Grid names={recent} />
        </>
      )}
      {groups.map((g) => (
        <div key={g.category}>
          <div className="eyebrow mb-2 mt-5">{g.category}</div>
          <Grid names={g.activities} />
        </div>
      ))}
    </Sheet>
  );
}
