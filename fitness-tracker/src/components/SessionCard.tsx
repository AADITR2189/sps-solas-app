import { Link } from 'react-router-dom';
import { Dumbbell, HeartPulse, ChevronRight } from 'lucide-react';
import type { Session } from '../types';
import { useData } from '../hooks/useData';
import { fmtMinutes, fmtNum, sessionCardioMin, sessionDistance, sessionVolume } from '../lib/stats';
import { relativeLabel } from '../lib/date';

export function sessionTitle(s: Session) {
  if (s.name) return s.name;
  if (s.kind === 'cardio') return s.cardio.map((c) => c.activity).join(', ') || 'Cardio';
  const groups = [...new Set(s.strength.map((e) => e.muscleGroup))];
  return groups.length ? groups.map((g) => g[0] + g.slice(1).toLowerCase()).join(' · ') : 'Strength';
}

export default function SessionCard({ s, showDate = true }: { s: Session; showDate?: boolean }) {
  const { settings } = useData();
  const isCardio = s.kind === 'cardio';
  const sets = s.strength.reduce((a, e) => a + e.sets.length, 0);
  const dist = sessionDistance(s);
  return (
    <Link
      to={`/log/edit?id=${s.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 active:bg-raised"
    >
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          isCardio ? 'bg-cardio/15 text-cardio' : 'bg-accent/15 text-accent'
        }`}
      >
        {isCardio ? <HeartPulse size={22} /> : <Dumbbell size={22} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{sessionTitle(s)}</div>
        <div className="truncate text-sm text-muted">
          {showDate && <>{relativeLabel(s.date)} · </>}
          {isCardio ? (
            <>
              {fmtMinutes(sessionCardioMin(s))}
              {dist > 0 && ` · ${fmtNum(dist, 1)} ${settings.distanceUnit}`}
            </>
          ) : (
            <>
              {s.strength.length} exercises · {sets} sets · {fmtNum(sessionVolume(s))} {settings.weightUnit}
            </>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}
