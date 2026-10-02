import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Dumbbell, HeartPulse } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Card, Empty, PageHeader, Stat } from '../components/ui';
import SessionCard, { sessionTitle } from '../components/SessionCard';
import { daysInMonth, formatLong, formatMonth, toKey, todayKey } from '../lib/date';
import { fmtMinutes, fmtNum, sessionCardioMin, sessionVolume, summarize } from '../lib/stats';
import type { Session } from '../types';

export default function CalendarPage() {
  const { sessions, settings } = useData();
  const [params, setParams] = useSearchParams();
  const today = todayKey();
  const selected = params.get('d') ?? today;
  const [cursor, setCursor] = useState(() => {
    const [y, m] = selected.split('-').map(Number);
    return { y, m: m - 1 };
  });

  const byDate = useMemo(() => {
    const m = new Map<string, Session[]>();
    for (const s of sessions) m.set(s.date, [...(m.get(s.date) ?? []), s]);
    return m;
  }, [sessions]);

  const ws = settings.weekStartsOn;
  const first = new Date(cursor.y, cursor.m, 1);
  const lead = (first.getDay() - ws + 7) % 7;
  const total = daysInMonth(cursor.y, cursor.m);
  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: total }, (_, i) => toKey(new Date(cursor.y, cursor.m, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heads = [...dow.slice(ws), ...dow.slice(0, ws)];

  const monthPrefix = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;
  const monthSummary = summarize(sessions.filter((s) => s.date.startsWith(monthPrefix)));
  const pastDays = cells.filter((c): c is string => !!c && c <= today).length;

  const move = (n: number) => {
    const d = new Date(cursor.y, cursor.m + n, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const daySessions = byDate.get(selected) ?? [];

  const tip = (k: string) =>
    (byDate.get(k) ?? [])
      .map((s) =>
        s.kind === 'cardio'
          ? `${sessionTitle(s)} — ${fmtMinutes(sessionCardioMin(s))}`
          : `${sessionTitle(s)} — ${fmtNum(sessionVolume(s))} ${settings.weightUnit}`,
      )
      .join('\n');

  return (
    <div>
      <PageHeader title="Calendar" sub="Tap a day to view or backfill" />

      <Card className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => move(-1)} className="grid h-11 w-11 place-items-center rounded-xl bg-raised" aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <div className="text-lg font-semibold">{formatMonth(`${monthPrefix}-01`)}</div>
          <button onClick={() => move(1)} className="grid h-11 w-11 place-items-center rounded-xl bg-raised" aria-label="Next month">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted">
          {heads.map((h) => (
            <div key={h} className="py-1">
              {h}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((k, i) => {
            if (!k) return <div key={i} />;
            const list = byDate.get(k) ?? [];
            const hasS = list.some((s) => s.kind === 'strength');
            const hasC = list.some((s) => s.kind === 'cardio');
            const isSel = k === selected;
            const isToday = k === today;
            const future = k > today;
            return (
              <button
                key={k}
                title={tip(k) || undefined}
                onClick={() => setParams({ d: k }, { replace: true })}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                  isSel
                    ? 'bg-white text-bg font-bold'
                    : list.length
                      ? hasS
                        ? 'bg-accent/20 text-white font-semibold'
                        : 'bg-cardio/20 text-white font-semibold'
                      : future
                        ? 'text-white/25'
                        : 'text-white/80 active:bg-raised'
                } ${isToday && !isSel ? 'ring-2 ring-accent' : ''}`}
              >
                {Number(k.slice(8))}
                {list.length > 0 && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {hasS && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    {hasC && <span className="h-1.5 w-1.5 rounded-full bg-cardio" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Strength</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cardio" /> Cardio</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full ring-2 ring-accent" /> Today</span>
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Days trained" value={`${monthSummary.days}`} sub={pastDays ? `of ${pastDays} so far` : undefined} />
        <Stat label="Strength" tone="accent" value={monthSummary.strength} sub="sessions" />
        <Stat label="Cardio" tone="cardio" value={monthSummary.cardio} sub={fmtMinutes(monthSummary.cardioMin)} />
      </div>

      <div className="mb-2 mt-6 flex items-center justify-between px-1">
        <h2 className="font-semibold">{formatLong(selected)}</h2>
      </div>
      {daySessions.length ? (
        <div className="space-y-2">
          {daySessions.map((s) => (
            <SessionCard key={s.id} s={s} showDate={false} />
          ))}
        </div>
      ) : (
        <Empty title={selected > today ? 'This day is in the future' : 'Nothing logged'}>
          {selected <= today && 'Missed logging this day? Add it now.'}
        </Empty>
      )}
      {selected <= today && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to={`/log/edit?kind=strength&date=${selected}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 font-semibold text-accent">
            <Plus size={18} /> <Dumbbell size={18} /> Strength
          </Link>
          <Link to={`/log/edit?kind=cardio&date=${selected}`} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-cardio/40 bg-cardio/10 font-semibold text-cardio">
            <Plus size={18} /> <HeartPulse size={18} /> Cardio
          </Link>
        </div>
      )}
    </div>
  );
}
