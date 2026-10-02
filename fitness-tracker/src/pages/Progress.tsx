import { useMemo, useState } from 'react';
import { Flame, Trophy, CalendarCheck, TrendingUp, Medal } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Card, Chip, Empty, PageHeader, SectionTitle, Stat, inputCls } from '../components/ui';
import { ChartCard, RankBars, TrendBars, TrendLine, C } from '../components/charts';
import {
  exerciseProgression,
  exerciseUsage,
  fmtNum,
  inRange,
  monthlyTrend,
  personalRecords,
  streaks,
  summarize,
  volumeByMuscle,
} from '../lib/stats';
import { addDays, formatShort, startOfMonth, todayKey, fromKey } from '../lib/date';

const cap = (g: string) => g[0] + g.slice(1).toLowerCase();
type Metric = 'maxWeight' | 'e1rm' | 'volume';

export default function Progress() {
  const { sessions, settings } = useData();
  const wu = settings.weightUnit;
  const today = todayKey();
  const [freqRange, setFreqRange] = useState<'30' | 'all'>('30');
  const [metric, setMetric] = useState<Metric>('maxWeight');
  const [prSort, setPrSort] = useState<'recent' | 'heaviest'>('heaviest');

  const usage = useMemo(() => exerciseUsage(sessions).sort((a, b) => b.count - a.count), [sessions]);
  const [exercise, setExercise] = useState<string>('');
  const ex = exercise || usage[0]?.exercise || '';

  const st = useMemo(() => streaks(sessions), [sessions]);
  const month = useMemo(() => summarize(sessions.filter((s) => inRange(s.date, startOfMonth(today), today))), [sessions, today]);
  const dayOfMonth = fromKey(today).getDate();
  const prs = useMemo(() => personalRecords(sessions), [sessions]);
  const strongest = [...prs].sort((a, b) => b.best1rm - a.best1rm).slice(0, 5);
  const prList = [...prs].sort((a, b) =>
    prSort === 'heaviest' ? b.maxWeight - a.maxWeight : a.maxWeightDate < b.maxWeightDate ? 1 : -1,
  );
  const freq = useMemo(
    () => volumeByMuscle(freqRange === '30' ? sessions.filter((s) => s.date >= addDays(today, -29)) : sessions),
    [sessions, freqRange, today],
  );
  const prog = useMemo(
    () => exerciseProgression(sessions, ex).map((r) => ({ ...r, label: formatShort(r.date) })),
    [sessions, ex],
  );
  const monthly = useMemo(() => monthlyTrend(sessions, 12), [sessions]);

  const first = prog[0]?.[metric] ?? 0;
  const last = prog[prog.length - 1]?.[metric] ?? 0;
  const change = first ? ((last - first) / first) * 100 : 0;

  if (!sessions.length)
    return (
      <div>
        <PageHeader title="Progress" />
        <Empty icon={<TrendingUp size={32} />} title="No data yet">Log a few workouts and your trends, streaks and PRs show up here.</Empty>
      </div>
    );

  return (
    <div>
      <PageHeader title="Progress" sub="Consistency, records and trends" />

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Current streak" tone="gold" value={<span className="inline-flex items-center gap-1"><Flame size={20} />{st.current} days</span>} sub={`Longest: ${st.longest} days`} />
        <Stat label="Days this month" value={<span className="inline-flex items-center gap-1"><CalendarCheck size={20} />{month.days}</span>} sub={`of ${dayOfMonth} days so far`} />
      </div>

      <div className="mt-2">
        <ChartCard title="Active days per month" sub="Last 12 months">
          <TrendBars data={monthly} dataKey="activeDays" color={C.gold} unit="days" height={160} />
        </ChartCard>
      </div>

      <SectionTitle>Weight progression</SectionTitle>
      {usage.length ? (
        <ChartCard
          title={ex}
          sub={
            prog.length > 1 ? (
              <span className={change >= 0 ? 'text-accent' : 'text-danger'}>
                {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}% since {formatShort(prog[0].date)}
              </span>
            ) : (
              'Log this exercise again to see a trend'
            )
          }
        >
          <select value={ex} onChange={(e) => setExercise(e.target.value)} className={`${inputCls} mb-2`}>
            {usage.map((u) => (
              <option key={u.exercise} value={u.exercise}>
                {u.exercise} ({u.count}×)
              </option>
            ))}
          </select>
          <div className="mb-2 flex gap-1">
            <Chip active={metric === 'maxWeight'} onClick={() => setMetric('maxWeight')}>Top weight</Chip>
            <Chip active={metric === 'e1rm'} onClick={() => setMetric('e1rm')}>Est. 1RM</Chip>
            <Chip active={metric === 'volume'} onClick={() => setMetric('volume')}>Volume</Chip>
          </div>
          <TrendLine data={prog} dataKey={metric} color={C.strength} unit={wu} />
        </ChartCard>
      ) : (
        <p className="text-sm text-muted">Log strength workouts to track progression.</p>
      )}

      {strongest.length > 0 && (
        <>
          <SectionTitle>
            <span className="inline-flex items-center gap-1"><Medal size={13} /> Strongest lifts (estimated 1RM)</span>
          </SectionTitle>
          <Card>
            <ol className="space-y-3">
              {strongest.map((p, i) => (
                <li key={p.exercise} className="flex items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-bold ${i === 0 ? 'bg-gold text-bg' : 'bg-raised text-muted'}`}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.exercise}</div>
                    <div className="text-xs text-muted">{cap(p.muscleGroup)} · {formatShort(p.best1rmDate)}</div>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{fmtNum(p.best1rm, 1)} <span className="text-sm text-muted">{wu}</span></span>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}

      <SectionTitle
        action={
          <div className="flex gap-1">
            <Chip active={freqRange === '30'} onClick={() => setFreqRange('30')}>30 days</Chip>
            <Chip active={freqRange === 'all'} onClick={() => setFreqRange('all')}>All</Chip>
          </div>
        }
      >
        Muscle group frequency
      </SectionTitle>
      <ChartCard title="Sessions per muscle group" sub="How often each group was trained">
        {freq.length ? (
          <RankBars data={[...freq].sort((a, b) => b.sessions - a.sessions).map((f) => ({ name: cap(f.group), value: f.sessions }))} color={C.strength} unit="sessions" />
        ) : (
          <p className="text-sm text-muted">No strength sessions in this range.</p>
        )}
      </ChartCard>

      {prList.length > 0 && (
        <>
          <SectionTitle
            action={
              <div className="flex gap-1">
                <Chip active={prSort === 'heaviest'} onClick={() => setPrSort('heaviest')}>Heaviest</Chip>
                <Chip active={prSort === 'recent'} onClick={() => setPrSort('recent')}>Recent</Chip>
              </div>
            }
          >
            <span className="inline-flex items-center gap-1"><Trophy size={13} /> Personal bests</span>
          </SectionTitle>
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Exercise</th>
                  <th className="px-2 py-2 text-right font-medium">Best set</th>
                  <th className="px-3 py-2 text-right font-medium">e1RM</th>
                </tr>
              </thead>
              <tbody>
                {prList.map((p) => (
                  <tr key={p.exercise} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{p.exercise}</div>
                      <div className="text-xs text-muted">{formatShort(p.maxWeightDate)}</div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">
                      {fmtNum(p.maxWeight, 1)} {wu} × {p.maxWeightReps}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-accent">{fmtNum(p.best1rm, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-2 px-1 text-xs text-muted">e1RM = estimated one-rep max (Epley formula: weight × (1 + reps ÷ 30)).</p>
        </>
      )}
    </div>
  );
}
