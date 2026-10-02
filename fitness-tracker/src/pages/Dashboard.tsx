import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GearSix, UserCircle, CheckCircle, Circle, Barbell, Heartbeat, Plus, Trophy, Target } from '@phosphor-icons/react';
import { useData } from '../hooks/useData';
import { Card, Chip, Empty, IconButton, PageHeader, Progress, SectionTitle, Stat } from '../components/ui';
import SessionCard from '../components/SessionCard';
import { ChartCard, RankBars, TrendBars, TrendLine } from '../components/charts';
import {
  annualSummary,
  cardioByCategory,
  cardioUsage,
  dailyVolume,
  exerciseProgression,
  exerciseUsage,
  fmtMinutes,
  fmtNum,
  inRange,
  monthlyTrend,
  streaks,
  summarize,
  volumeByMuscle,
  weeklyTrend,
} from '../lib/stats';
import { formatLong, formatShort, startOfMonth, startOfWeek, todayKey } from '../lib/date';
import { currentWeight, weightChange } from '../lib/body';
import { goalProgress, overallGoalCompletion } from '../lib/goals';
import { groupName } from '../data/exercises';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const signed = (n: number, digits = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmtNum(Math.abs(n), digits)}`;

export default function Dashboard() {
  const { ready, sessions, settings, profile, measurements, goals, records, categoryOf } = useData();
  const [trend, setTrend] = useState<'week' | 'month'>('week');
  const today = todayKey();
  const wu = settings.weightUnit;
  const du = settings.distanceUnit;

  const d = useMemo(() => {
    const todays = sessions.filter((s) => s.date === today);
    const week = summarize(sessions.filter((s) => inRange(s.date, startOfWeek(today, settings.weekStartsOn), today)));
    const month = summarize(sessions.filter((s) => inRange(s.date, startOfMonth(today), today)));
    const all = summarize(sessions);
    const usage = exerciseUsage(sessions).sort((a, b) => b.count - a.count);
    const topExercise = usage[0]?.exercise;
    const active = goals.filter((g) => !g.archived);
    return {
      todays,
      week,
      month,
      all,
      streak: streaks(sessions),
      muscles: volumeByMuscle(sessions),
      topEx: usage.slice(0, 5),
      topExercise,
      topProg: topExercise ? exerciseProgression(sessions, topExercise).map((r) => ({ ...r, label: formatShort(r.date) })) : [],
      prs: [...records].sort((a, b) => (a.maxWeightDate < b.maxWeightDate ? 1 : -1)).slice(0, 4),
      weekly: weeklyTrend(sessions, 12, settings.weekStartsOn),
      monthly: monthlyTrend(sessions, 12),
      daily: dailyVolume(sessions, 30),
      annual: annualSummary(sessions),
      cardio: cardioUsage(sessions),
      cardioTypes: cardioByCategory(sessions, categoryOf),
      goalPct: overallGoalCompletion(active.map((g) => goalProgress(g, sessions, measurements, profile, settings))),
      goalCount: active.length,
    };
  }, [sessions, today, settings, records, goals, measurements, profile, categoryOf]);

  if (!ready) return <div className="p-8 text-center text-muted">Loading…</div>;

  const trendData = trend === 'week' ? d.weekly : d.monthly;
  const trendLabel = trend === 'week' ? 'Last 12 weeks' : 'Last 12 months';
  const cw = currentWeight(measurements, profile);
  const wc = weightChange(measurements, profile);

  const TrendToggle = (
    <div className="flex gap-1">
      <Chip active={trend === 'week'} onClick={() => setTrend('week')}>
        Weekly
      </Chip>
      <Chip active={trend === 'month'} onClick={() => setTrend('month')}>
        Monthly
      </Chip>
    </div>
  );

  return (
    <div>
      <PageHeader
        sub={formatLong(today)}
        title={profile?.name ? `${greeting()}, ${profile.name.split(' ')[0]}` : 'Gym Diary'}
        right={
          <>
            <IconButton label="Profile" to="/profile">
              <UserCircle size={20} weight="bold" />
            </IconButton>
            <IconButton label="Settings and data" to="/settings">
              <GearSix size={20} weight="bold" />
            </IconButton>
          </>
        }
      />

      {/* Today */}
      <Card className={d.todays.length ? 'border-str/25 bg-str-soft' : ''}>
        <div className="flex items-center gap-3">
          {d.todays.length ? (
            <CheckCircle className="text-str" size={28} weight="fill" />
          ) : (
            <Circle className="text-muted" size={28} weight="bold" />
          )}
          <div className="flex-1">
            <div className="font-medium">{d.todays.length ? 'Trained today' : 'No workout logged today'}</div>
            <div className="text-sm text-muted">
              {d.todays.length
                ? `${d.todays.length} session${d.todays.length > 1 ? 's' : ''} logged`
                : d.streak.current
                  ? `Keep your ${d.streak.current}-day streak going`
                  : 'Rest day, or time to move?'}
            </div>
          </div>
          <Link to="/log" className="grid h-11 w-11 place-items-center rounded-btn bg-primary text-primary-ink" aria-label="Log workout">
            <Plus size={20} weight="bold" />
          </Link>
        </div>
        {d.todays.length > 0 && (
          <div className="mt-4 space-y-2">
            {d.todays.map((s) => (
              <SessionCard key={s.id} s={s} showDate={false} />
            ))}
          </div>
        )}
      </Card>

      {/* Overview */}
      <SectionTitle>Overview</SectionTitle>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat index={0} label="Total workouts" value={d.all.sessions} sub={`${d.all.strength} strength · ${d.all.cardio} cardio`} />
        <Stat index={1} label="Streak" tone="gold" value={`${d.streak.current}d`} sub={`Longest ${d.streak.longest} days`} />
        <Stat index={2} label="Days this month" value={d.month.days} sub={`${d.month.sessions} sessions`} />
        <Stat index={3} label="Avg duration" value={d.all.avgDuration ? fmtMinutes(d.all.avgDuration) : '—'} sub="per workout" />
        <Stat index={4} label="Total volume" tone="str" value={fmtNum(d.all.volume)} sub={`${wu} lifted`} />
        <Stat
          index={5}
          label="Current weight"
          value={cw !== undefined ? fmtNum(cw, 1) : '—'}
          sub={cw !== undefined ? wu : <Link to="/profile" className="underline">Add weight</Link>}
        />
        <Stat
          index={6}
          label="Weight change"
          tone={wc === undefined || wc === 0 ? 'default' : 'gold'}
          value={wc !== undefined ? signed(wc) : '—'}
          sub={wc !== undefined ? `${wu} since start` : 'Log two weigh-ins'}
        />
        <Link to="/goals" className="contents">
          <Stat index={7} label="Goals" tone="str" value={d.goalPct !== undefined ? `${d.goalPct}%` : '—'} sub={d.goalCount ? `${d.goalCount} active goals` : 'Set a goal'} />
        </Link>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <Card index={1}>
          <div className="eyebrow">This week</div>
          <div className="num mt-3 grid grid-cols-3 gap-3">
            <Mini label="Sessions" value={d.week.sessions} sub={`${d.week.days} days`} />
            <Mini label="Volume" value={fmtNum(d.week.volume)} sub={wu} tone="text-str" />
            <Mini label="Cardio" value={fmtMinutes(d.week.cardioMin)} sub={d.week.distance ? `${fmtNum(d.week.distance, 1)} ${du}` : 'time'} tone="text-car" />
          </div>
        </Card>
        <Card index={2}>
          <div className="eyebrow">This month</div>
          <div className="num mt-3 grid grid-cols-3 gap-3">
            <Mini label="Sessions" value={d.month.sessions} sub={`${d.month.strength} str · ${d.month.cardio} car`} />
            <Mini label="Volume" value={fmtNum(d.month.volume)} sub={wu} tone="text-str" />
            <Mini label="Cardio" value={fmtMinutes(d.month.cardioMin)} sub={d.month.calories ? `${fmtNum(d.month.calories)} kcal` : 'time'} tone="text-car" />
          </div>
        </Card>
      </div>

      {sessions.length === 0 ? (
        <div className="mt-8">
          <Empty icon={<Barbell size={36} weight="bold" />} title="Your diary is empty">
            Tap the plus button to log your first workout. Forgot a day? You can pick any past date. Or load sample data from Settings to look around.
          </Empty>
        </div>
      ) : (
        <>
          {/* Strength */}
          <SectionTitle action={TrendToggle}>
            <span className="inline-flex items-center gap-1.5 text-str">
              <Barbell size={12} weight="bold" /> Strength
            </span>
          </SectionTitle>
          <div className="grid gap-2 md:grid-cols-2">
            <ChartCard index={0} title={trend === 'week' ? 'Weekly volume' : 'Monthly volume'} sub={`${trendLabel}, ${wu}`}>
              <TrendBars data={trendData} dataKey="volume" series="strength" unit={wu} />
            </ChartCard>
            <ChartCard index={1} title="Volume lifted by day" sub={`Last 30 days, ${wu}`}>
              <TrendBars data={d.daily} dataKey="volume" series="strength" unit={wu} />
            </ChartCard>
            {d.muscles.length > 0 && (
              <ChartCard index={2} title="Volume by muscle group" sub={`All time, ${wu}`}>
                <RankBars data={d.muscles.map((m) => ({ name: groupName(m.group), value: m.volume }))} series="strength" unit={wu} />
              </ChartCard>
            )}
            {d.topProg.length > 0 && (
              <ChartCard
                index={3}
                title="Weight progression"
                sub={`${d.topExercise}, top set per session`}
                right={
                  <Link to="/progress" className="text-sm text-muted underline-offset-4 hover:underline">
                    All exercises
                  </Link>
                }
              >
                <TrendLine data={d.topProg} dataKey="maxWeight" series="strength" unit={wu} />
              </ChartCard>
            )}
            {d.topEx.length > 0 && (
              <ChartCard index={4} title="Most performed exercises">
                <ol className="divide-y divide-line">
                  {d.topEx.map((e, i) => (
                    <li key={e.exercise} className="flex items-center gap-3 py-2.5">
                      <span className="num w-5 text-right font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                      <span className="flex-1 truncate">{e.exercise}</span>
                      <span className="num text-sm text-muted">
                        {e.count}x · {e.sets} sets
                      </span>
                    </li>
                  ))}
                </ol>
              </ChartCard>
            )}
            {d.prs.length > 0 && (
              <ChartCard
                index={5}
                title="Personal records"
                sub="Most recent"
                right={
                  <Link to="/progress" className="text-sm text-muted underline-offset-4 hover:underline">
                    All records
                  </Link>
                }
              >
                <ul className="divide-y divide-line">
                  {d.prs.map((p) => (
                    <li key={p.exercise} className="flex items-center gap-3 py-2.5">
                      <Trophy size={16} weight="fill" className="text-gold" />
                      <span className="flex-1 truncate">{p.exercise}</span>
                      <span className="num font-medium">
                        {fmtNum(p.maxWeight, 1)} {wu} <span className="text-muted">× {p.maxWeightReps}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </ChartCard>
            )}
          </div>

          {d.annual.length > 0 && (
            <div className="mt-2">
              <ChartCard title="Annual progress" sub="Totals per calendar year">
                <div className="-mx-1 overflow-x-auto">
                  <table className="num w-full text-sm">
                    <thead>
                      <tr className="eyebrow text-left">
                        <th className="px-1 py-2 font-normal">Year</th>
                        <th className="px-1 py-2 text-right font-normal">Workouts</th>
                        <th className="px-1 py-2 text-right font-normal">Days</th>
                        <th className="px-1 py-2 text-right font-normal">Volume</th>
                        <th className="px-1 py-2 text-right font-normal">Cardio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.annual.map((y) => (
                        <tr key={y.year} className="border-t border-line">
                          <td className="px-1 py-2.5 font-medium">{y.year}</td>
                          <td className="px-1 py-2.5 text-right">{y.sessions}</td>
                          <td className="px-1 py-2.5 text-right">{y.days}</td>
                          <td className="px-1 py-2.5 text-right">
                            {fmtNum(y.volume)}
                            {y.volumeChange !== null && (
                              <span className={`ml-1 text-xs ${y.volumeChange >= 0 ? 'text-str' : 'text-danger'}`}>{signed(y.volumeChange, 0)}%</span>
                            )}
                          </td>
                          <td className="px-1 py-2.5 text-right">{fmtMinutes(y.cardioMin)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          )}

          {/* Cardio */}
          <SectionTitle action={TrendToggle}>
            <span className="inline-flex items-center gap-1.5 text-car">
              <Heartbeat size={12} weight="bold" /> Cardio
            </span>
          </SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            <Stat index={0} label="Total" tone="car" value={fmtMinutes(d.all.cardioMin)} sub={`${d.all.cardio} sessions`} />
            <Stat index={1} label="This week" value={fmtMinutes(d.week.cardioMin)} />
            <Stat index={2} label="This month" value={fmtMinutes(d.month.cardioMin)} />
          </div>
          {d.cardio.length > 0 ? (
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <ChartCard index={0} title={trend === 'week' ? 'Weekly cardio' : 'Monthly cardio'} sub={`${trendLabel}, minutes`}>
                <TrendBars data={trendData} dataKey="cardioMin" series="cardio" unit="min" />
              </ChartCard>
              <ChartCard index={1} title="Cardio by type" sub="All time, minutes">
                <RankBars data={d.cardioTypes.map((c) => ({ name: c.category, value: c.minutes }))} series="cardio" unit="min" />
              </ChartCard>
              <ChartCard index={2} title="Activity breakdown" sub="Top activities, minutes">
                <RankBars data={d.cardio.slice(0, 8).map((c) => ({ name: c.activity, value: c.minutes }))} series="cardio" unit="min" />
              </ChartCard>
              {d.all.distance > 0 && (
                <ChartCard index={3} title="Distance trend" sub={`${du} per ${trend}`}>
                  <TrendLine data={trendData} dataKey="distance" series="cardio" unit={du} />
                </ChartCard>
              )}
              {d.all.calories > 0 && (
                <ChartCard index={4} title="Calories burned" sub={`kcal per ${trend}`}>
                  <TrendBars data={trendData} dataKey="calories" series="rose" unit="kcal" />
                </ChartCard>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No cardio logged yet.</p>
          )}

          <SectionTitle
            action={
              <Link to="/history" className="text-sm text-muted underline-offset-4 hover:underline">
                See all
              </Link>
            }
          >
            Recent workouts
          </SectionTitle>
          <div className="grid gap-2 md:grid-cols-2">
            {sessions.slice(0, 6).map((s) => (
              <SessionCard key={s.id} s={s} />
            ))}
          </div>
          {d.goalCount > 0 && d.goalPct !== undefined && (
            <Link to="/goals" className="mt-6 block">
              <Card>
                <div className="flex items-center gap-3">
                  <Target size={20} weight="bold" className="text-str" />
                  <span className="flex-1 font-medium">Goal completion</span>
                  <span className="num font-medium">{d.goalPct}%</span>
                </div>
                <div className="mt-3">
                  <Progress pct={d.goalPct} />
                </div>
              </Card>
            </Link>
          )}
        </>
      )}
    </div>
  );
}

function Mini({ label, value, sub, tone = 'text-ink' }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted">{label}</div>
      <div className={`h-display truncate text-2xl ${tone}`}>{value}</div>
      {sub && <div className="truncate text-xs text-muted">{sub}</div>}
    </div>
  );
}
