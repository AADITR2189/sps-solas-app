import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings as Cog, CheckCircle2, Circle, Flame, Trophy, Dumbbell, HeartPulse, Plus } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Card, Chip, Empty, PageHeader, SectionTitle, Stat } from '../components/ui';
import SessionCard from '../components/SessionCard';
import { ChartCard, RankBars, TrendBars, TrendLine, C } from '../components/charts';
import {
  cardioUsage,
  exerciseUsage,
  fmtMinutes,
  fmtNum,
  inRange,
  monthlyTrend,
  personalRecords,
  streaks,
  summarize,
  volumeByMuscle,
  weeklyTrend,
} from '../lib/stats';
import { formatLong, startOfMonth, startOfWeek, todayKey } from '../lib/date';

const cap = (g: string) => g[0] + g.slice(1).toLowerCase();

export default function Dashboard() {
  const { ready, sessions, settings } = useData();
  const [trend, setTrend] = useState<'week' | 'month'>('week');
  const today = todayKey();
  const wu = settings.weightUnit;
  const du = settings.distanceUnit;

  const d = useMemo(() => {
    const todays = sessions.filter((s) => s.date === today);
    const week = summarize(sessions.filter((s) => inRange(s.date, startOfWeek(today, settings.weekStartsOn), today)));
    const month = summarize(sessions.filter((s) => inRange(s.date, startOfMonth(today), today)));
    const all = summarize(sessions);
    return {
      todays,
      week,
      month,
      all,
      streak: streaks(sessions),
      muscles: volumeByMuscle(sessions),
      topEx: exerciseUsage(sessions).sort((a, b) => b.count - a.count).slice(0, 5),
      prs: personalRecords(sessions).sort((a, b) => (a.maxWeightDate < b.maxWeightDate ? 1 : -1)).slice(0, 4),
      weekly: weeklyTrend(sessions, 12, settings.weekStartsOn),
      monthly: monthlyTrend(sessions, 12),
      cardio: cardioUsage(sessions),
    };
  }, [sessions, today, settings.weekStartsOn]);

  if (!ready) return <div className="p-8 text-center text-muted">Loading…</div>;

  const trendData = trend === 'week' ? d.weekly : d.monthly;

  return (
    <div>
      <PageHeader
        sub={formatLong(today)}
        title="Gym Diary"
        right={
          <Link to="/settings" className="grid h-11 w-11 place-items-center rounded-full bg-raised" aria-label="Settings & data">
            <Cog size={20} />
          </Link>
        }
      />

      {/* Today */}
      <Card className={`mt-2 ${d.todays.length ? 'border-accent/40 bg-accent/5' : ''}`}>
        <div className="flex items-center gap-3">
          {d.todays.length ? <CheckCircle2 className="text-accent" size={28} /> : <Circle className="text-muted" size={28} />}
          <div className="flex-1">
            <div className="font-semibold">{d.todays.length ? 'Trained today 💪' : 'No workout logged today'}</div>
            <div className="text-sm text-muted">
              {d.todays.length
                ? `${d.todays.length} session${d.todays.length > 1 ? 's' : ''} logged`
                : d.streak.current
                  ? `Keep your ${d.streak.current}-day streak alive`
                  : 'Rest day, or time to move?'}
            </div>
          </div>
          <Link to="/log" className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-ink" aria-label="Log workout">
            <Plus size={22} />
          </Link>
        </div>
        {d.todays.length > 0 && (
          <div className="mt-3 space-y-2">
            {d.todays.map((s) => (
              <SessionCard key={s.id} s={s} showDate={false} />
            ))}
          </div>
        )}
      </Card>

      {/* Overview */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Current streak" tone="gold" value={<span className="inline-flex items-center gap-1"><Flame size={20} />{d.streak.current}d</span>} sub={`Best ${d.streak.longest} days`} />
        <Stat label="Total workouts" value={d.all.sessions} sub={`${d.all.strength} strength · ${d.all.cardio} cardio`} />
      </div>

      <SectionTitle>This week</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sessions" value={d.week.sessions} sub={`${d.week.days} days`} />
        <Stat label="Volume" tone="accent" value={fmtNum(d.week.volume)} sub={wu} />
        <Stat label="Cardio" tone="cardio" value={fmtMinutes(d.week.cardioMin)} sub={d.week.distance ? `${fmtNum(d.week.distance, 1)} ${du}` : 'time'} />
      </div>

      <SectionTitle>This month</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Days active" value={d.month.days} sub={`${d.month.strength} str · ${d.month.cardio} car`} />
        <Stat label="Volume" tone="accent" value={fmtNum(d.month.volume)} sub={wu} />
        <Stat label="Cardio" tone="cardio" value={fmtMinutes(d.month.cardioMin)} sub={d.month.distance ? `${fmtNum(d.month.distance, 1)} ${du}` : 'time'} />
      </div>

      {sessions.length === 0 ? (
        <div className="mt-6">
          <Empty icon={<Dumbbell size={36} />} title="Your diary is empty">
            Tap the <b className="text-accent">+</b> button to log your first workout. Forgot a day? You can pick any past date.
          </Empty>
        </div>
      ) : (
        <>
          {/* Strength */}
          <SectionTitle>
            <span className="inline-flex items-center gap-1 text-accent"><Dumbbell size={13} /> Strength</span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Total volume" tone="accent" value={fmtNum(d.all.volume)} sub={`${wu} lifted all-time`} />
            <Stat label="Strength sessions" value={d.all.strength} sub={`${d.muscles.length} muscle groups`} />
          </div>
          <div className="mt-2 space-y-2">
            <ChartCard
              title={trend === 'week' ? 'Weekly volume' : 'Monthly volume'}
              sub={trend === 'week' ? 'Last 12 weeks' : 'Last 12 months'}
              right={
                <div className="flex gap-1">
                  <Chip active={trend === 'week'} onClick={() => setTrend('week')}>Week</Chip>
                  <Chip active={trend === 'month'} onClick={() => setTrend('month')}>Month</Chip>
                </div>
              }
            >
              <TrendBars data={trendData} dataKey="volume" color={C.strength} unit={wu} />
            </ChartCard>
            {d.muscles.length > 0 && (
              <ChartCard title="Volume by muscle group" sub={`All-time, ${wu}`}>
                <RankBars data={d.muscles.map((m) => ({ name: cap(m.group), value: m.volume }))} color={C.strength} unit={wu} />
              </ChartCard>
            )}
            {d.topEx.length > 0 && (
              <ChartCard title="Most performed exercises">
                <ol className="space-y-2">
                  {d.topEx.map((e, i) => (
                    <li key={e.exercise} className="flex items-center gap-3">
                      <span className="w-5 text-right font-bold text-muted">{i + 1}</span>
                      <span className="flex-1 truncate">{e.exercise}</span>
                      <span className="text-sm tabular-nums text-muted">{e.count}× · {e.sets} sets</span>
                    </li>
                  ))}
                </ol>
              </ChartCard>
            )}
            {d.prs.length > 0 && (
              <ChartCard title="Recent personal records" right={<Link to="/progress" className="text-sm text-accent">All PRs</Link>}>
                <ul className="space-y-2">
                  {d.prs.map((p) => (
                    <li key={p.exercise} className="flex items-center gap-3">
                      <Trophy size={16} className="text-gold" />
                      <span className="flex-1 truncate">{p.exercise}</span>
                      <span className="font-semibold tabular-nums">
                        {fmtNum(p.maxWeight, 1)} {wu} <span className="text-muted">× {p.maxWeightReps}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </ChartCard>
            )}
          </div>

          {/* Cardio */}
          <SectionTitle>
            <span className="inline-flex items-center gap-1 text-cardio"><HeartPulse size={13} /> Cardio</span>
          </SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="All-time" tone="cardio" value={fmtMinutes(d.all.cardioMin)} />
            <Stat label="This week" value={fmtMinutes(d.week.cardioMin)} />
            <Stat label="This month" value={fmtMinutes(d.month.cardioMin)} />
          </div>
          {d.cardio.length > 0 ? (
            <div className="mt-2 space-y-2">
              <ChartCard title="Cardio minutes" sub={trend === 'week' ? 'Last 12 weeks' : 'Last 12 months'}>
                <TrendBars data={trendData} dataKey="cardioMin" color={C.cardio} unit="min" />
              </ChartCard>
              <ChartCard title="Activity breakdown" sub="All-time minutes">
                <RankBars data={d.cardio.slice(0, 8).map((c) => ({ name: c.activity, value: c.minutes }))} color={C.cardio} unit="min" />
              </ChartCard>
              {d.all.distance > 0 && (
                <ChartCard title="Distance trend" sub={`${du} per ${trend}`}>
                  <TrendLine data={trendData} dataKey="distance" color={C.cardio} unit={du} />
                </ChartCard>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No cardio logged yet.</p>
          )}

          <SectionTitle action={<Link to="/history" className="text-sm text-accent">See all</Link>}>Recent workouts</SectionTitle>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <SessionCard key={s.id} s={s} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
