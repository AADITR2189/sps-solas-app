import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Fire, Trophy, CalendarCheck, ChartLineUp, Medal, Target, Scales, ArrowUpRight, ArrowDownRight } from '@phosphor-icons/react';
import { useData } from '../hooks/useData';
import { Card, Chip, Empty, PageHeader, Progress as Bar, SectionTitle, Stat, inputCls } from '../components/ui';
import { ChartCard, RankBars, TrendBars, TrendLine } from '../components/charts';
import { exerciseProgression, exerciseUsage, fmtNum, inRange, monthlyTrend, streaks, strengthImprovement, summarize, volumeByMuscle } from '../lib/stats';
import { addDays, formatShort, startOfMonth, todayKey, fromKey } from '../lib/date';
import { currentWeight, weightChange } from '../lib/body';
import { goalProgress, overallGoalCompletion } from '../lib/goals';
import { groupName } from '../data/exercises';

type Metric = 'maxWeight' | 'e1rm' | 'volume';

export default function Progress() {
  const { sessions, settings, records, measurements, profile, goals } = useData();
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
  const strongest = [...records].sort((a, b) => b.best1rm - a.best1rm).slice(0, 5);
  const prList = [...records].sort((a, b) => (prSort === 'heaviest' ? b.maxWeight - a.maxWeight : a.maxWeightDate < b.maxWeightDate ? 1 : -1));
  const freq = useMemo(
    () => volumeByMuscle(freqRange === '30' ? sessions.filter((s) => s.date >= addDays(today, -29)) : sessions),
    [sessions, freqRange, today],
  );
  const prog = useMemo(() => exerciseProgression(sessions, ex).map((r) => ({ ...r, label: formatShort(r.date) })), [sessions, ex]);
  const monthly = useMemo(() => monthlyTrend(sessions, 12), [sessions]);
  const improvement = useMemo(() => strengthImprovement(sessions).slice(0, 6), [sessions]);
  const bodyTrend = measurements.map((m) => ({ label: formatShort(m.date), weight: m.weight }));
  const cw = currentWeight(measurements, profile);
  const wc30 = weightChange(measurements, profile, 30);
  const active = goals.filter((g) => !g.archived);
  const goalRows = active.map((g) => ({ g, p: goalProgress(g, sessions, measurements, profile, settings) }));
  const goalPct = overallGoalCompletion(goalRows.map((r) => r.p));

  const first = prog[0]?.[metric] ?? 0;
  const last = prog[prog.length - 1]?.[metric] ?? 0;
  const change = first ? ((last - first) / first) * 100 : 0;

  if (!sessions.length && !measurements.length)
    return (
      <div>
        <PageHeader title="Progress" />
        <Empty icon={<ChartLineUp size={32} weight="bold" />} title="No data yet">
          Log a few workouts and your trends, streaks and records will show up here.
        </Empty>
      </div>
    );

  return (
    <div>
      <PageHeader title="Progress" sub="Consistency, records and trends" />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat
          index={0}
          label="Consistency streak"
          tone="gold"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Fire size={22} weight="fill" />
              {st.current}d
            </span>
          }
          sub={`Longest ${st.longest} days`}
        />
        <Stat
          index={1}
          label="Days this month"
          value={
            <span className="inline-flex items-center gap-1.5">
              <CalendarCheck size={22} weight="bold" />
              {month.days}
            </span>
          }
          sub={`of ${dayOfMonth} days so far`}
        />
        <Stat index={2} label="Body weight" value={cw !== undefined ? fmtNum(cw, 1) : '—'} sub={wc30 !== undefined ? `${wc30 >= 0 ? '+' : ''}${fmtNum(wc30, 1)} ${wu} in 30 days` : wu} />
        <Stat index={3} label="Goal completion" tone="str" value={goalPct !== undefined ? `${goalPct}%` : '—'} sub={`${active.length} active goals`} />
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <ChartCard index={0} title="Active days per month" sub="Last 12 months">
          <TrendBars data={monthly} dataKey="activeDays" series="gold" unit="days" height={170} />
        </ChartCard>
        <ChartCard
          index={1}
          title="Body weight trend"
          sub={bodyTrend.length ? `${bodyTrend.length} weigh-ins, ${wu}` : 'No weigh-ins yet'}
          right={
            <Link to="/profile" className="text-sm text-muted underline-offset-4 hover:underline">
              Log weight
            </Link>
          }
        >
          {bodyTrend.length > 1 ? (
            <TrendLine data={bodyTrend} dataKey="weight" series="ink" unit={wu} height={170} />
          ) : (
            <div className="flex h-[170px] flex-col items-center justify-center gap-2 text-center text-sm text-muted">
              <Scales size={28} weight="bold" />
              Log your weight on the Profile screen to see the trend.
            </div>
          )}
        </ChartCard>
      </div>

      {goalRows.length > 0 && (
        <>
          <SectionTitle
            action={
              <Link to="/goals" className="text-sm text-muted underline-offset-4 hover:underline">
                Manage
              </Link>
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <Target size={12} weight="bold" /> Goals
            </span>
          </SectionTitle>
          <Card>
            <ul className="space-y-4">
              {goalRows.map(({ g, p }) => (
                <li key={g.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{g.title}</span>
                    <span className="num text-sm text-muted">{p.pct}%</span>
                  </div>
                  <div className="num mb-1.5 text-xs text-muted">{p.label}</div>
                  <Bar pct={p.pct} tone={p.done ? 'str' : 'gold'} />
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <SectionTitle>Exercise progression</SectionTitle>
      {usage.length ? (
        <ChartCard
          title={ex}
          sub={
            prog.length > 1 ? (
              <span className={change >= 0 ? 'text-str' : 'text-danger'}>
                {change >= 0 ? '+' : ''}
                {change.toFixed(1)}% since {formatShort(prog[0].date)}
              </span>
            ) : (
              'Log this exercise again to see a trend'
            )
          }
        >
          <select value={ex} onChange={(e) => setExercise(e.target.value)} className={`${inputCls} mb-3`} aria-label="Exercise">
            {usage.map((u) => (
              <option key={u.exercise} value={u.exercise}>
                {u.exercise} ({u.count}x)
              </option>
            ))}
          </select>
          <div className="mb-3 flex gap-1">
            <Chip active={metric === 'maxWeight'} onClick={() => setMetric('maxWeight')}>
              Top weight
            </Chip>
            <Chip active={metric === 'e1rm'} onClick={() => setMetric('e1rm')}>
              Est. 1RM
            </Chip>
            <Chip active={metric === 'volume'} onClick={() => setMetric('volume')}>
              Volume
            </Chip>
          </div>
          <TrendLine data={prog} dataKey={metric} series="strength" unit={wu} />
        </ChartCard>
      ) : (
        <p className="text-sm text-muted">Log strength workouts to track progression.</p>
      )}

      {improvement.length > 0 && (
        <>
          <SectionTitle>Strength improvement</SectionTitle>
          <Card>
            <p className="mb-3 text-xs text-muted">Estimated 1RM: first session vs best of your last three.</p>
            <ul className="divide-y divide-line">
              {improvement.map((r) => (
                <li key={r.exercise} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate">{r.exercise}</span>
                  <span className="num text-sm text-muted">
                    {fmtNum(r.first, 1)} → {fmtNum(r.latest, 1)}
                  </span>
                  <span className={`num inline-flex w-20 items-center justify-end gap-0.5 font-medium ${r.change >= 0 ? 'text-str' : 'text-danger'}`}>
                    {r.change >= 0 ? <ArrowUpRight size={14} weight="bold" /> : <ArrowDownRight size={14} weight="bold" />}
                    {Math.abs(r.change).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {strongest.length > 0 && (
        <>
          <SectionTitle>
            <span className="inline-flex items-center gap-1.5">
              <Medal size={12} weight="bold" /> Strongest lifts · estimated 1RM
            </span>
          </SectionTitle>
          <Card>
            <ol className="space-y-3">
              {strongest.map((p, i) => (
                <li key={p.exercise} className="flex items-center gap-3">
                  <span className={`num grid h-8 w-8 place-items-center rounded-btn font-mono text-xs ${i === 0 ? 'bg-gold-soft text-gold' : 'bg-raised text-muted'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.exercise}</div>
                    <div className="text-xs text-muted">
                      {groupName(p.muscleGroup)} · {formatShort(p.best1rmDate)}
                    </div>
                  </div>
                  <span className="h-display num text-xl">
                    {fmtNum(p.best1rm, 1)} <span className="font-sans text-sm text-muted">{wu}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}

      <SectionTitle
        action={
          <div className="flex gap-1">
            <Chip active={freqRange === '30'} onClick={() => setFreqRange('30')}>
              30 days
            </Chip>
            <Chip active={freqRange === 'all'} onClick={() => setFreqRange('all')}>
              All
            </Chip>
          </div>
        }
      >
        Muscle group frequency
      </SectionTitle>
      <ChartCard title="Sessions per muscle group" sub="How often each group was trained">
        {freq.length ? (
          <RankBars data={[...freq].sort((a, b) => b.sessions - a.sessions).map((f) => ({ name: groupName(f.group), value: f.sessions }))} series="strength" unit="sessions" />
        ) : (
          <p className="text-sm text-muted">No strength sessions in this range.</p>
        )}
      </ChartCard>

      {prList.length > 0 && (
        <>
          <SectionTitle
            action={
              <div className="flex gap-1">
                <Chip active={prSort === 'heaviest'} onClick={() => setPrSort('heaviest')}>
                  Heaviest
                </Chip>
                <Chip active={prSort === 'recent'} onClick={() => setPrSort('recent')}>
                  Recent
                </Chip>
              </div>
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <Trophy size={12} weight="bold" /> Personal bests
            </span>
          </SectionTitle>
          <Card className="p-0">
            <table className="num w-full text-sm">
              <thead>
                <tr className="eyebrow border-b border-line text-left">
                  <th className="px-4 py-3 font-normal">Exercise</th>
                  <th className="px-2 py-3 text-right font-normal">Best set</th>
                  <th className="px-4 py-3 text-right font-normal">e1RM</th>
                </tr>
              </thead>
              <tbody>
                {prList.map((p) => (
                  <tr key={p.exercise} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.exercise}</div>
                      <div className="text-xs text-muted">{formatShort(p.maxWeightDate)}</div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-right">
                      {fmtNum(p.maxWeight, 1)} {wu} × {p.maxWeightReps}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-str">{fmtNum(p.best1rm, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-2 px-1 text-xs text-muted">e1RM is the estimated one-rep max: weight × (1 + reps ÷ 30), the Epley formula.</p>
        </>
      )}
    </div>
  );
}
