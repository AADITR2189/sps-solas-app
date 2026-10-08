import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, MagnifyingGlass, Star } from '@phosphor-icons/react';
import { useData } from '../hooks/useData';
import { Chip, Empty, IconButton, PageHeader, inputCls } from '../components/ui';
import { TemplateCard, TemplateSheet } from '../components/TemplateViews';
import { CATEGORY_LABEL, EQUIPMENT_CHOICES, LEVELS, POOLS, TEMPLATE_DEFS, type TemplateCategory } from '../data/templateCatalog';
import { buildTemplate, favoriteKey, prefsFrom, type CatalogTemplate } from '../lib/templates';
import type { EquipmentChoice, Level } from '../types';

type Tab = TemplateCategory | 'fav';
const TABS: { id: Tab; label: string }[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'single', label: 'Single' },
  { id: 'two', label: 'Two muscles' },
  { id: 'three', label: 'Three muscles' },
  { id: 'fav', label: 'Favourites' },
];

export default function TemplatesPage() {
  const { profile, favoriteSet } = useData();
  const [params] = useSearchParams();
  const date = params.get('date') ?? undefined;
  const prefs = prefsFrom(profile);
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'classic');
  const [equipment, setEquipment] = useState<EquipmentChoice>(prefs.equipment);
  const [level, setLevel] = useState<Level>(prefs.level);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<CatalogTemplate | null>(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return TEMPLATE_DEFS.filter((d) => {
      if (term) return true; // search covers every tab
      if (tab === 'fav') return favoriteSet.has(favoriteKey(d.id));
      return d.category === tab;
    })
      .map((d) => buildTemplate(d, equipment, level, prefs.goal))
      .filter((t) => {
        if (!term) return true;
        const def = TEMPLATE_DEFS.find((d) => d.id === t.defId)!;
        const hay = [t.name, ...t.strength.map((e) => e.exercise), ...t.cardio.map((c) => c.activity), ...def.parts.map(([p]) => POOLS[p].label)]
          .join(' ')
          .toLowerCase();
        return term.split(/\s+/).every((w) => hay.includes(w));
      });
  }, [q, tab, equipment, level, prefs.goal, favoriteSet]);

  return (
    <div>
      <PageHeader
        title="Templates"
        sub={`${TEMPLATE_DEFS.length * 3} one-tap workouts`}
        right={
          <IconButton label="Back to Log" to={date ? `/log?date=${date}` : '/log'}>
            <ArrowLeft size={20} weight="bold" />
          </IconButton>
        }
      />

      <label className="relative block">
        <span className="sr-only">Search templates</span>
        <MagnifyingGlass size={18} weight="bold" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: chest, squat, cardio…" className={`${inputCls} pl-10`} type="search" />
      </label>

      {!q.trim() && (
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Template category">
          {TABS.map((t) => (
            <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.id === 'fav' && <Star size={13} weight="fill" className="-mt-0.5 mr-1 inline" />}
              {t.label}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div role="group" aria-label="Equipment">
          <div className="eyebrow mb-1.5">Equipment</div>
          <div className="grid grid-cols-3 gap-1.5">
            {EQUIPMENT_CHOICES.map((e) => (
              <Chip key={e.id} active={equipment === e.id} onClick={() => setEquipment(e.id)} className="px-2">
                {e.label}
              </Chip>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Difficulty">
          <div className="eyebrow mb-1.5">Difficulty</div>
          <div className="grid grid-cols-3 gap-1.5">
            {LEVELS.map((l) => (
              <Chip key={l.id} active={level === l.id} onClick={() => setLevel(l.id)} className="px-2">
                {l.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">{EQUIPMENT_CHOICES.find((e) => e.id === equipment)!.hint}</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <TemplateCard key={t.id} t={t} onOpen={() => setOpen(t)} />
        ))}
      </div>
      {list.length === 0 && (
        <div className="mt-5">
          {tab === 'fav' && !q.trim() ? (
            <Empty icon={<Star size={28} weight="bold" />} title="No favourites yet">
              Tap the star on any template to pin it here and on the Log screen.
            </Empty>
          ) : (
            <Empty icon={<MagnifyingGlass size={28} weight="bold" />} title="Nothing found">
              Try a muscle (“back”) or an exercise (“deadlift”).
            </Empty>
          )}
        </div>
      )}
      {q.trim() && list.length > 0 && <p className="mt-3 text-center text-xs text-muted">Searching all {Object.keys(CATEGORY_LABEL).length} categories</p>}

      <TemplateSheet t={open} onClose={() => setOpen(null)} date={date} />
    </div>
  );
}
