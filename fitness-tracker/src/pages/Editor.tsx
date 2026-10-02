import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash, CopySimple, NotePencil, Barbell, Heartbeat, BookmarkSimple, ClockCounterClockwise } from '@phosphor-icons/react';
import { useData } from '../hooks/useData';
import { Button, Card, Field, IconBadge, NumberInput, Tag, inputCls } from '../components/ui';
import { ExercisePicker, CardioPicker, ExerciseAutocomplete } from '../components/ExercisePicker';
import type { CardioEntry, MuscleGroup, Session, SessionKind, StrengthEntry } from '../types';
import { deleteSession, saveSession, saveTemplate, uid } from '../db/db';
import { formatLong, isValidKey, todayKey } from '../lib/date';
import { entryVolume, fmtNum, lastSetsFor, sessionCardioMin, sessionVolume } from '../lib/stats';
import { groupName } from '../data/exercises';

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
  const { ready, sessions, templates, settings, categoryOf } = useData();
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
      ns.cardio = tpl.cardio.map((c) => ({ id: uid(), activity: c.activity, category: categoryOf(c.activity), durationMin: c.durationMin }));
    }
    const ex = params.get('exercise');
    const grp = params.get('group') as MuscleGroup | null;
    if (ex && grp) ns.strength.push(makeEntry(ex, grp));
    const act = params.get('activity');
    if (act) ns.cardio.push({ id: uid(), activity: act, category: categoryOf(act), durationMin: 30 });
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
  const addExercise = (ex: string, g: MuscleGroup) => {
    update({ strength: [...s.strength, makeEntry(ex, g)] });
    setError('');
  };

  const isCardio = s.kind === 'cardio';

  async function onSave() {
    if (!s) return;
    if (!isValidKey(s.date)) return setError('Pick a valid date.');
    if (s.date > todayKey()) return setError('Workouts can’t be logged in the future.');
    if (isCardio) {
      if (!s.cardio.length) return setError('Add at least one cardio activity.');
      if (s.cardio.some((c) => !c.durationMin || c.durationMin <= 0)) return setError('Duration is required for every activity.');
    } else if (!s.strength.length) return setError('Add at least one exercise.');
    const clean: Session = {
      ...s,
      name: s.name?.trim() || undefined,
      notes: s.notes?.trim() || undefined,
      durationMin: s.durationMin && s.durationMin > 0 ? s.durationMin : undefined,
      strength: isCardio ? [] : s.strength.map((e) => ({ ...e, sets: e.sets.map((x) => ({ reps: x.reps || 0, weight: x.weight || 0 })) })),
      cardio: isCardio ? s.cardio.map((c) => ({ ...c, category: c.category ?? categoryOf(c.activity) })) : [],
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
    if (!name?.trim()) return;
    await saveTemplate({
      id: uid(),
      name: name.trim(),
      kind: s.kind,
      strength: s.strength.map((e) => ({ exercise: e.exercise, muscleGroup: e.muscleGroup, sets: Math.max(1, e.sets.length) })),
      cardio: s.cardio.map((c) => ({ activity: c.activity, durationMin: c.durationMin || 30 })),
    });
    alert(`Saved template “${name.trim()}”. You'll find it on the Log screen.`);
  }

  return (
    <div className="pb-44">
      <div className="sticky top-0 z-30 -mx-4 flex items-center gap-1 border-b border-line bg-bg/85 px-2 pt-safe backdrop-blur-md">
        <button onClick={isNew ? onDiscard : goBack} className="grid h-12 w-12 place-items-center" aria-label="Back">
          <ArrowLeft size={20} weight="bold" />
        </button>
        <div className="h-title flex-1 truncate text-xl">{isNew ? 'New workout' : 'Edit workout'}</div>
        <button onClick={onSaveTemplate} className="grid h-12 w-12 place-items-center text-muted" aria-label="Save as template" title="Save as template">
          <BookmarkSimple size={20} weight="bold" />
        </button>
        {!isNew && (
          <button onClick={onDelete} className="grid h-12 w-12 place-items-center text-danger" aria-label="Delete workout">
            <Trash size={20} weight="bold" />
          </button>
        )}
      </div>

      {/* Session meta */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {(['strength', 'cardio'] as const).map((k) => {
          const active = s.kind === k;
          return (
            <button
              key={k}
              onClick={() => update({ kind: k })}
              disabled={!isNew && !active}
              className={`flex h-12 items-center justify-center gap-2 rounded-btn border font-medium transition-colors disabled:opacity-40 ${
                active ? (k === 'strength' ? 'border-str/30 bg-str-soft text-str' : 'border-car/30 bg-car-soft text-car') : 'border-line bg-surface text-muted'
              }`}
            >
              {k === 'strength' ? <Barbell size={18} weight="bold" /> : <Heartbeat size={18} weight="bold" />}
              {k === 'strength' ? 'Strength' : 'Cardio'}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <Field label="Workout date">
          <input type="date" value={s.date} max={todayKey()} onChange={(e) => update({ date: e.target.value })} className={inputCls} />
        </Field>
        {!isCardio && (
          <Field label="Duration (min)">
            <NumberInput value={s.durationMin} onChange={(v) => update({ durationMin: v })} placeholder="—" label="Workout duration in minutes" className="w-28" />
          </Field>
        )}
      </div>
      {isValidKey(s.date) && s.date !== todayKey() && (
        <div className="mt-2">
          <Tag tone="gold">Back-dated · {formatLong(s.date)}</Tag>
        </div>
      )}
      <input
        value={s.name ?? ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Session name (optional, e.g. Push Day)"
        className={`${inputCls} mt-3`}
      />

      {/* Strength */}
      {!isCardio && (
        <div className="mt-6 space-y-3">
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
          <ExerciseAutocomplete onPick={addExercise} />
          <Button variant="secondary" size="lg" className="w-full border-dashed" onClick={() => setPicker(true)}>
            <Plus size={18} weight="bold" /> Browse exercises
          </Button>
        </div>
      )}

      {/* Cardio */}
      {isCardio && (
        <div className="mt-6 space-y-3">
          {s.cardio.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="h-title truncate text-xl">{c.activity}</div>
                  <Tag tone="car">{c.category ?? categoryOf(c.activity)}</Tag>
                </div>
                <button
                  onClick={() => update({ cardio: s.cardio.filter((x) => x.id !== c.id) })}
                  className="grid h-10 w-10 place-items-center text-muted"
                  aria-label="Remove activity"
                >
                  <Trash size={18} weight="bold" />
                </button>
              </div>
              <div className="eyebrow mt-4">Duration (minutes) · required</div>
              <div className="mt-1.5 flex gap-2">
                <NumberInput value={c.durationMin} onChange={(v) => updCardio(c.id, { durationMin: v ?? 0 })} label="Duration minutes" />
                {[5, 10].map((n) => (
                  <Button key={n} className="shrink-0" onClick={() => updCardio(c.id, { durationMin: (c.durationMin || 0) + n })}>
                    +{n}
                  </Button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Field label={`Distance ${settings.distanceUnit}`}>
                  <NumberInput value={c.distance} step={0.1} onChange={(v) => updCardio(c.id, { distance: v })} placeholder="—" label="Distance" />
                </Field>
                <Field label="Calories">
                  <NumberInput value={c.calories} onChange={(v) => updCardio(c.id, { calories: v })} placeholder="—" label="Calories burned" />
                </Field>
                <Field label="Avg HR">
                  <NumberInput value={c.avgHeartRate} onChange={(v) => updCardio(c.id, { avgHeartRate: v })} placeholder="bpm" label="Average heart rate" />
                </Field>
              </div>
              <textarea
                value={c.notes ?? ''}
                onChange={(ev) => updCardio(c.id, { notes: ev.target.value })}
                placeholder="Notes (pace, incline, how it felt)"
                rows={2}
                className={`${inputCls} mt-3 h-auto py-2`}
              />
            </Card>
          ))}
          <Button variant="secondary" size="lg" className="w-full border-dashed" onClick={() => setCardioPicker(true)}>
            <Plus size={18} weight="bold" /> Add cardio activity
          </Button>
        </div>
      )}

      <textarea
        value={s.notes ?? ''}
        onChange={(e) => update({ notes: e.target.value })}
        placeholder="Session notes (energy, sleep, PR attempts)"
        rows={3}
        className={`${inputCls} mt-5 h-auto py-2`}
      />

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          {error && <div className="mb-2 text-sm text-danger">{error}</div>}
          <div className="flex items-center gap-3">
            <div className="num min-w-0 flex-1 text-sm text-muted">
              {isCardio ? (
                <>
                  <span className="font-medium text-ink">{stats.minutes}</span> min total
                </>
              ) : (
                <>
                  <span className="font-medium text-ink">{stats.sets}</span> sets · <span className="font-medium text-ink">{fmtNum(stats.volume)}</span>{' '}
                  {settings.weightUnit}
                </>
              )}
            </div>
            <Button variant="primary" size="lg" className="min-w-[140px]" onClick={onSave}>
              Save workout
            </Button>
          </div>
        </div>
      </div>

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(ex, g) => {
          addExercise(ex, g);
          setPicker(false);
        }}
      />
      <CardioPicker
        open={cardioPicker}
        onClose={() => setCardioPicker(false)}
        onPick={(a, category) => {
          update({ cardio: [...s.cardio, { id: uid(), activity: a, category, durationMin: 30 }] });
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
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <IconBadge tone="str" size="sm">
          <span className="num text-sm font-semibold">{idx + 1}</span>
        </IconBadge>
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-tight">{e.exercise}</div>
          <div className="num text-xs text-muted">
            {groupName(e.muscleGroup)} · volume {fmtNum(entryVolume(e))} {unit}
          </div>
        </div>
        <button onClick={() => setShowNotes(!showNotes)} className="grid h-9 w-9 place-items-center text-muted" aria-label="Exercise notes">
          <NotePencil size={18} weight="bold" />
        </button>
        <button onClick={onRemove} className="grid h-9 w-9 place-items-center text-muted" aria-label="Remove exercise">
          <Trash size={18} weight="bold" />
        </button>
      </div>
      {lastSets && (
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-muted">
          <ClockCounterClockwise size={12} weight="bold" /> Last time: {lastSets.map((x) => `${x.weight}×${x.reps}`).join(', ')}
        </div>
      )}
      <div className="eyebrow mt-4 grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 text-center">
        <span>Set</span>
        <span>Weight {unit}</span>
        <span>Reps</span>
        <span />
      </div>
      <div className="mt-1.5 space-y-2">
        {e.sets.map((st, i) => (
          <div key={i} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2">
            <span className="num text-center font-medium text-muted">{i + 1}</span>
            <NumberInput value={st.weight} step={0.5} onChange={(v) => setSet(i, { weight: v ?? 0 })} label={`Set ${i + 1} weight`} />
            <NumberInput value={st.reps} onChange={(v) => setSet(i, { reps: v ?? 0 })} label={`Set ${i + 1} reps`} />
            <button
              onClick={() => onChange((x) => ({ ...x, sets: x.sets.filter((_, j) => j !== i) }))}
              className="grid h-10 w-10 place-items-center text-muted"
              aria-label={`Remove set ${i + 1}`}
            >
              <Trash size={16} weight="bold" />
            </button>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-3 w-full"
        onClick={() => onChange((x) => ({ ...x, sets: [...x.sets, last ? { ...last } : { reps: 10, weight: 0 }] }))}
      >
        {last ? <CopySimple size={16} weight="bold" /> : <Plus size={16} weight="bold" />} Add set{' '}
        {last && (
          <span className="num text-muted">
            ({last.weight}×{last.reps})
          </span>
        )}
      </Button>
      {showNotes && (
        <textarea
          value={e.notes ?? ''}
          onChange={(ev) => onChange((x) => ({ ...x, notes: ev.target.value }))}
          placeholder="Exercise notes (tempo, form cues, RPE)"
          rows={2}
          className={`${inputCls} mt-2 h-auto py-2`}
        />
      )}
    </Card>
  );
}
