import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Fire } from '@phosphor-icons/react';
import BodyMap, { type BodyMapMode } from './BodyMap';
import { Card, Chip } from './ui';
import { useData } from '../hooks/useData';
import { regionInfo, type Region } from '../data/muscles';
import { groupName } from '../data/exercises';
import { fmtNum } from '../lib/stats';
import {
  HEAT_GRADIENT_CSS,
  HEAT_RANGES,
  bodyWeightFor,
  heatColor,
  intensities,
  regionStats,
  sessionsInRange,
  sessionsLoads,
  sessionsSetLoads,
  type HeatRange,
  type RegionStat,
} from '../lib/heatmap';
import { formatShort } from '../lib/date';

/** Colour scale legend: grey = not trained, then the load gradient. */
export function HeatLegend({ mode = 'heat' }: { mode?: BodyMapMode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted">
      <span className="inline-flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm bg-line" /> None
      </span>
      <span>Less</span>
      <span
        className="h-2 flex-1 rounded-full"
        style={{ background: mode === 'heat' ? HEAT_GRADIENT_CSS : 'linear-gradient(90deg, rgb(var(--str) / 0.18), rgb(var(--str)))' }}
      />
      <span>More</span>
    </div>
  );
}

/** Ranked muscle list: name · weight moved · share of total. */
export function MuscleList({
  stats,
  mode = 'heat',
  unit,
  selected,
  onSelect,
  limit,
  format,
}: {
  stats: RegionStat[];
  /** How to show a muscle's load (default: weight in the user's unit). */
  format?: (load: number) => string;
  mode?: BodyMapMode;
  unit: string;
  selected?: Region | null;
  onSelect?: (r: Region) => void;
  limit?: number;
}) {
  const trained = stats.filter((s) => s.load > 0);
  const shown = limit ? trained.slice(0, limit) : trained;
  return (
    <ol className="space-y-1">
      {shown.map((s, i) => (
        <li key={s.region}>
          <button
            onClick={onSelect ? () => onSelect(s.region) : undefined}
            className={`flex w-full items-center gap-2.5 rounded-btn px-2 py-1.5 text-left text-sm ${selected === s.region ? 'bg-raised' : ''} ${onSelect ? 'hover:bg-raised' : 'cursor-default'}`}
          >
            <span className="num w-4 text-right text-xs text-muted">{i + 1}</span>
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ background: mode === 'heat' ? heatColor(s.intensity) : `rgb(var(--str) / ${(0.18 + 0.82 * s.intensity).toFixed(3)})` }}
            />
            <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
            <span className="num shrink-0 text-muted">
              {format ? format(s.load) : `${fmtNum(Math.round(s.load))} ${unit}`}
            </span>
            <span className="num w-11 shrink-0 text-right font-medium">{s.pct.toFixed(s.pct < 10 ? 1 : 0)}%</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Info line for the tapped muscle. */
export function RegionInfo({ stat, unit, format }: { stat?: RegionStat; unit: string; format?: (load: number) => string }) {
  if (!stat) return <div className="text-sm text-muted">Tap a muscle to see its load.</div>;
  const info = regionInfo(stat.region);
  return (
    <div className="text-sm">
      <div className="font-medium">
        {info.name}
        {groupName(info.group) !== info.name && <span className="font-normal text-muted"> · {groupName(info.group)}</span>}
      </div>
      <div className="num text-muted">
        {stat.load > 0 ? (
          <>
            {format ? format(stat.load) : `${fmtNum(Math.round(stat.load))} ${unit}`} · {stat.pct.toFixed(1)}% of volume
          </>
        ) : (
          'Not trained in this period'
        )}
      </div>
    </div>
  );
}

/** Home-screen heat map with range filter, legend and ranked list. */
export function MuscleHeatCard({ index = 0 }: { index?: number }) {
  const { sessions, measurements, profile, settings } = useData();
  const [range, setRange] = useState<HeatRange>('7');
  const [selected, setSelected] = useState<Region | null>(null);
  const [all, setAll] = useState(false);
  const bw = bodyWeightFor(measurements, profile, settings);
  const list = useMemo(() => sessionsInRange(sessions, range), [sessions, range]);
  const weighted = useMemo(() => sessionsLoads(list, bw), [list, bw]);
  // Nothing has a weight yet (all 0 kg): count sets instead so the map still lights up.
  const bySets = !Object.values(weighted).some((v) => v > 0);
  const loads = useMemo(() => (bySets ? sessionsSetLoads(list) : weighted), [bySets, list, weighted]);
  const fmtSets = bySets ? (n: number) => `${fmtNum(n, 1)} sets` : undefined;
  const stats = useMemo(() => regionStats(loads), [loads]);
  const values = useMemo(() => intensities(loads), [loads]);
  const empty = !stats.some((s) => s.load > 0);
  const unit = settings.weightUnit;

  return (
    <Card index={index}>
      <div className="flex items-center justify-between gap-3">
        <div className="eyebrow inline-flex items-center gap-1.5">
          <Fire size={12} weight="fill" /> Muscle heat map
        </div>
        {range === 'last' && list[0] && (
          <Link to={`/session?id=${list[0].id}`} className="text-xs font-medium text-str">
            {formatShort(list[0].date)} · details
          </Link>
        )}
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5" role="group" aria-label="Heat map period">
        {HEAT_RANGES.map((r) => (
          <Chip key={r.id} active={range === r.id} onClick={() => setRange(r.id)}>
            {r.label}
          </Chip>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-5 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center">
          <BodyMap values={values} mode="heat" view="both" width={118} selected={selected} onSelect={(r) => setSelected((x) => (x === r ? null : r))} />
          <div className="mt-3 w-full max-w-[260px]">
            <HeatLegend />
          </div>
        </div>
        <div className="min-w-0">
          {empty ? (
            <div className="rounded-btn bg-raised p-4 text-sm text-muted">
              No strength workouts {range === 'all' ? 'yet' : 'in this period'}. Log one and your muscles light up here.
            </div>
          ) : (
            <>
              <div className="mb-3 rounded-btn bg-raised px-3 py-2">
                <RegionInfo stat={stats.find((s) => s.region === selected)} unit={unit} format={fmtSets} />
              </div>
              <MuscleList stats={stats} unit={unit} format={fmtSets} selected={selected} onSelect={(r) => setSelected((x) => (x === r ? null : r))} limit={all ? undefined : 6} />
              {stats.filter((s) => s.load > 0).length > 6 && (
                <button onClick={() => setAll(!all)} className="mt-1 px-2 text-sm font-medium text-str">
                  {all ? 'Show less' : 'Show all muscles'}
                </button>
              )}
              <p className="mt-2 px-2 text-[11px] leading-snug text-muted">
                Weight × reps. Main muscles get the full load, helpers half. Bodyweight moves count part of your body weight.
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
