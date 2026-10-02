import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Copy, StickyNote, Dumbbell, HeartPulse, BookmarkPlus, History } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Button, Card, NumberInput, inputCls } from '../components/ui';
import { ExercisePicker, CardioPicker } from '../components/ExercisePicker';
import type { CardioEntry, MuscleGroup, Session, SessionKind, StrengthEntry } from '../types';
import { deleteSession, saveSession, saveTemplate, uid } from '../db/db';
import { formatLong, isValidKey, todayKey } from '../lib/date';
import { entryVolume, fmtNum, lastSetsFor, sessionCardioMin, sessionVolume } from '../lib/stats';

export const DRAFT_KEY = 'gym-diary-draft';

export function readDraft(): Session | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function newSession(date: string, kind: SessionKind): Session {
  const now = Date.now();
  return { id: uid(), date, kind, strength: [], cardio: [], createdAt: now, updatedAt: now };
}

export default function Editor() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { ready, sessions, templates, settings } = useData();
  const [s, setS] = useState<Session | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [picker, setPicker] = useState(false);
  const [cardioPicker, setCardioPicker] = useState(false);
  const [error, setError] = useState('');
  const initialised = useRef(false);

  // Build the session being edited once data is loaded.
  useEffect(() => {
    if (!ready || initialised.current) return;
    initialised.current = true;
    const id = params.get('id');
    if (id) {
      const found = sessions.find((x) => x.id === id);
      if (found) {
        setS(structuredClone(found));
        setIsNew(false);
        return;
      }
    }
    if (params.get('resume')) {
      const d = readDraft();
      if (d) {
        setS(d);
        return;
      }
    }
    const dateParam = params.get('date') ?? '';
    const date = isValidKey(dateParam) ? dateParam : todayKey();
    const tpl = templates.find((t) => t.id === params.get('template'));
    const kind: SessionKind = tpl?.kind ?? (params.get('kind') === 'cardio' ? 'cardio' : 'strength');
    const ns = newSession(date, kind);
    if (tpl) {
      ns.name = tpl.name;
      ns.strength = tpl.strength.map((t) => {
        const prev = lastSetsFor(sessions, t.exercise) ?? [];
        return {
          id: uid(),
          exercise: t.exercise,
          muscleGroup: t.muscleGroup,
          sets: Array.from({ length: t.sets }, (_, i) => ({ ...(prev[i] ?? prev[prev.length - 1] ?? { reps: 10, weight: 0 }) })),
        };
      });
      ns.cardio = tpl.cardio.map((c) => ({ id: uid(), activity: c.activity, durationMin: c.durationMin }));
    }
    const ex = params.get('exercise');
    const grp = params.get('group') as MuscleGroup | null;
    if (ex && grp) ns.strength.push(makeEntry(ex, grp));
    const act = params.get('activity');
    if (act) ns.cardio.push({ id: uid(), activity: act, durationMin: 30 });
    setS(ns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Autosave unsaved new sessions so nothing is lost if the app is closed mid-workout.
  useEffect(() => {
    if (!s || !isNew) return;
    const hasContent = s.strength.length || s.cardio.length || s.notes;
    try {
      if (hasContent) localStorage.setItem(DRAFT_KEY, JSON.stringify(s));
    } catch {
      /* storage unavailable */
    }
  }, [s, isNew]);

  function makeEntry(exercise: string, muscleGroup: MuscleGroup): StrengthEntry {
    const last = lastSetsFor(sessions, exercise);
    return { id: uid(), exercise, muscleGroup, sets: last ?? [{ reps: 10, weight: 0 }] };
  }

  const stats = useMemo(
    () => (s ? { volume: sessionVolume(s), minutes: sessionCardioMin(s), sets: s.strength.reduce((a, e) => a + e.sets.length, 0) } : null),
    [s],
  );

  if (!s || !stats) return <div className="p-8 text-center text-muted">Loading…</div>;

  const goBack = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/'));
  const update = (patch: Partial<Session>) => setS({ ...s, ...patch });
  const updEntry = (id: string, fn: (e: StrengthEntry) => StrengthEntry) =>
    update({ strength: s.strength.map((e) => (e.id === id ? fn(e) : e)) });
  const updCardio = (id: string, patch: Partial<CardioEntry>) =>
    update({ cardio: s.cardio.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  const isCardio = s.kind === 'cardio';
  const accentBtn = isCardio ? 'cardio' : 'primary';

  async function onSave() {
    if (!s) return;
    if (!isValidKey(s.date)) return setError('Pick a valid date.');
    if (isCardio) {
      if (!s.cardio.length) return setError('Add at least one cardio activity.');
      if (s.cardio.some((c) => !c.durationMin || c.durationMin <= 0)) return setError('Duration is required for every activity.');
    } else {
      if (!s.strength.length) return setError('Add at least one exercise.');
    }
    const clean: Session = {
      ...s,
      name: s.name?.trim() || undefined,
      notes: s.notes?.trim() || undefined,
      strength: isCardio ? [] : s.strength.map((e) => ({ ...e, sets: e.sets.map((x) => ({ reps: x.reps || 0, weight: x.weight || 0 })) })),
      cardio: isCardio ? s.cardio : [],
    };
    await saveSession(clean);
    if (isNew) clearDraft();
    goBack();
  }

  async function onDelete() {
    if (!s) return;
    if (!confirm('Delete this workout? This cannot be undone.')) return;
    await deleteSession(s.id);
    goBack();
  }

  function onDiscard() {
    if ((s?.strength.length || s?.cardio.length) && !confirm('Discard this unsaved workout?')) return;
    clearDraft();
    goBack();
  }

  async function onSaveTemplate() {
    if (!s) return;
    const name = prompt('Template name', s.name || (isCardio ? 'My Cardio' : 'My Workout'));
    if (!name) return;
    await saveTemplate({
      id: uid(),
      name: name.trim(),
      kind: s.kind,
      strength: s.strength.map((e) => ({ exercise: e.exercise, muscleGroup: e.muscleGroup, sets: Math.max(1, e.sets.length) })),
      cardio: s.cardio.map((c) => ({ activity: c.activity, durationMin: c.durationMin || 30 })),
    });
    alert(`Saved template “${name.trim()}”. Find it on the Log screen.`);
  }

  return (
    <div className="pb-40">
      <div className="sticky top-0 z-30 -mx-4 flex items-center gap-2 border-b border-line bg-bg/95 px-2 pt-safe backdrop-blur">
        <button onClick={isNew ? onDiscard : goBack} className="grid h-12 w-12 place-items-center" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 truncate font-semibold">{isNew ? 'New workout' : 'Edit workout'}</div>
        <button onClick={onSaveTemplate} className="grid h-12 w-12 place-items-center text-muted" aria-label="Save as template" title="Save as template">
          <BookmarkPlus size={20} />
        </button>
        {!isNew && (
          <button onClick={onDelete} className="grid h-12 w-12 place-items-center text-danger" aria-label="Delete workout">
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Session meta */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => update({ kind: 'strength' })}
          disabled={!isNew && s.kind !== 'strength'}
          className={`flex h-12 items-center justify-center gap-2 rounded-xl border font-semibold ${
            !isCardio ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-raised text-muted'
          }`}
        >
          <Dumbbell size={18} /> Strength
        </button>
        <button
          onClick={() => update({ kind: 'cardio' })}
          disabled={!isNew && s.kind !== 'cardio'}
          className={`flex h-12 items-center justify-center gap-2 rounded-xl border font-semibold ${
            isCardio ? 'border-cardio bg-cardio/15 text-cardio' : 'border-line bg-raised text-muted'
          }`}
        >
          <HeartPulse size={18} /> Cardio
        </button>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Workout date</span>
        <input
          type="date"
          value={s.date}
          max={todayKey()}
          onChange={(e) => update({ date: e.target.value })}
          className={`${inputCls} [color-scheme:dark]`}
        />
        {isValidKey(s.date) && s.date !== todayKey() && (
          <span className="mt-1 block text-xs text-gold">Back-dated entry · {formatLong(s.date)}</span>
        )}
      </label>
      <input
        value={s.name ?? ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Session name (optional, e.g. Push Day)"
        className={`${inputCls} mt-2`}
      />

      {/* Strength */}
      {!isCardio && (
        <div className="mt-4 space-y-3">
          {s.strength.map((e, idx) => (
            <StrengthCard
              key={e.id}
              e={e}
              idx={idx}
              unit={settings.weightUnit}
              lastSets={lastSetsFor(sessions.filter((x) => x.id !== s.id), e.exercise)}
              onChange={(fn) => updEntry(e.id, fn)}
              onRemove={() => update({ strength: s.strength.filter((x) => x.id !== e.id) })}
            />
          ))}
          <Button variant="secondary" size="lg" className="w-full border-dashed" onClick={() => setPicker(true)}>
            <Plus size={20} /> Add exercise
          </Button>
        </div>
      )}

      {/* Cardio */}
      {isCardio && (
        <div className="mt-4 space-y-3">
          {s.cardio.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-cardio">{c.activity}</div>
                <button
                  onClick={() => update({ cardio: s.cardio.filter((x) => x.id !== c.id) })}
                  className="grid h-10 w-10 place-items-center text-muted"
                  aria-label="Remove activity"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">Duration (min) *</div>
              <div className="mt-1 flex gap-2">
                <NumberInput value={c.durationMin} onChange={(v) => updCardio(c.id, { durationMin: v ?? 0 })} label="Duration minutes" />
                {[5, 10].map((n) => (
                  <Button key={n} size="md" className="shrink-0" onClick={() => updCardio(c.id, { durationMin: (c.durationMin || 0) + n })}>
                    +{n}
                  </Button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">Distance ({settings.distanceUnit})</span>
                  <NumberInput value={c.distance} step={0.1} onChange={(v) => updCardio(c.id, { distance: v })} placeholder="—" label="Distance" />
                </label>
                <label>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">Calories</span>
                  <NumberInput value={c.calories} onChange={(v) => updCardio(c.id, { calories: v })} placeholder="—" label="Calories" />
                </label>
              </div>
              <textarea
                value={c.notes ?? ''}
                onChange={(ev) => updCardio(c.id, { notes: ev.target.value })}
                placeholder="Notes (pace, incline, how it felt…)"
                rows={2}
                className={`${inputCls} mt-2 h-auto py-2`}
              />
            </Card>
          ))}
          <Button variant="secondary" size="lg" className="w-full border-dashed" onClick={() => setCardioPicker(true)}>
            <Plus size={20} /> Add cardio activity
          </Button>
        </div>
      )}

      <textarea
        value={s.notes ?? ''}
        onChange={(e) => update({ notes: e.target.value })}
        placeholder="Session notes (energy, sleep, PR attempts…)"
        rows={3}
        className={`${inputCls} mt-4 h-auto py-2`}
      />

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          {error && <div className="mb-2 text-sm text-danger">{error}</div>}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 text-sm text-muted">
              {isCardio ? (
                <>
                  <span className="font-semibold text-white">{stats.minutes}</span> min total
                </>
              ) : (
                <>
                  <span className="font-semibold text-white">{stats.sets}</span> sets ·{' '}
                  <span className="font-semibold text-white">{fmtNum(stats.volume)}</span> {settings.weightUnit}
                </>
              )}
            </div>
            <Button variant={accentBtn} size="lg" className="min-w-[140px]" onClick={onSave}>
              Save
            </Button>
          </div>
        </div>
      </div>

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(ex, g) => {
          update({ strength: [...s.strength, makeEntry(ex, g)] });
          setPicker(false);
          setError('');
        }}
      />
      <CardioPicker
        open={cardioPicker}
        onClose={() => setCardioPicker(false)}
        onPick={(a) => {
          update({ cardio: [...s.cardio, { id: uid(), activity: a, durationMin: 30 }] });
          setCardioPicker(false);
          setError('');
        }}
      />
    </div>
  );
}

function StrengthCard({
  e,
  idx,
  unit,
  lastSets,
  onChange,
  onRemove,
}: {
  e: StrengthEntry;
  idx: number;
  unit: string;
  lastSets: StrengthEntry['sets'] | null;
  onChange: (fn: (e: StrengthEntry) => StrengthEntry) => void;
  onRemove: () => void;
}) {
  const [showNotes, setShowNotes] = useState(!!e.notes);
  const setSet = (i: number, patch: Partial<{ reps: number; weight: number }>) =>
    onChange((x) => ({ ...x, sets: x.sets.map((st, j) => (j === i ? { ...st, ...patch } : st)) }));
  const last = e.sets[e.sets.length - 1];
  return (
    <Card className="p-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent/15 text-sm font-bold text-accent">{idx + 1}</div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight">{e.exercise}</div>
          <div className="text-xs text-muted">
            {e.muscleGroup[0] + e.muscleGroup.slice(1).toLowerCase()} · Volume {fmtNum(entryVolume(e))} {unit}
          </div>
        </div>
        <button onClick={() => setShowNotes(!showNotes)} className="grid h-9 w-9 place-items-center text-muted" aria-label="Notes">
          <StickyNote size={18} />
        </button>
        <button onClick={onRemove} className="grid h-9 w-9 place-items-center text-muted" aria-label="Remove exercise">
          <Trash2 size={18} />
        </button>
      </div>
      {lastSets && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted">
          <History size={12} /> Last time: {lastSets.map((x) => `${x.weight}×${x.reps}`).join(', ')}
        </div>
      )}
      <div className="mt-3 grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
        <span>Set</span>
        <span>Weight ({unit})</span>
        <span>Reps</span>
        <span />
      </div>
      <div className="mt-1 space-y-2">
        {e.sets.map((st, i) => (
          <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2">
            <span className="text-center font-semibold text-muted">{i + 1}</span>
            <NumberInput value={st.weight} step={0.5} onChange={(v) => setSet(i, { weight: v ?? 0 })} label={`Set ${i + 1} weight`} />
            <NumberInput value={st.reps} onChange={(v) => setSet(i, { reps: v ?? 0 })} label={`Set ${i + 1} reps`} />
            <button
              onClick={() => onChange((x) => ({ ...x, sets: x.sets.filter((_, j) => j !== i) }))}
              className="grid h-10 w-10 place-items-center text-muted"
              aria-label={`Remove set ${i + 1}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-3 w-full"
        onClick={() => onChange((x) => ({ ...x, sets: [...x.sets, last ? { ...last } : { reps: 10, weight: 0 }] }))}
      >
        {last ? <Copy size={16} /> : <Plus size={16} />} Add set {last && <span className="text-muted">({last.weight}×{last.reps})</span>}
      </Button>
      {showNotes && (
        <textarea
          value={e.notes ?? ''}
          onChange={(ev) => onChange((x) => ({ ...x, notes: ev.target.value }))}
          placeholder="Exercise notes (tempo, form cues, RPE…)"
          rows={2}
          className={`${inputCls} mt-2 h-auto py-2`}
        />
      )}
    </Card>
  );
}
