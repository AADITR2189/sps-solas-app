import type { ReactNode } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Cell } from 'recharts';
import { fmtNum } from '../lib/stats';
import { usePalette, type Palette } from '../lib/theme';
import { Card } from './ui';

// Each chart is single-series in one hue (strength = green, cardio = blue, ...), so identity
// never depends on colour alone: the chart title names the series and the axis names categories.
export type Series = 'strength' | 'cardio' | 'gold' | 'rose' | 'ink';
const color = (p: Palette, s: Series) => (s === 'ink' ? p.ink : p[s]);

function useTooltip() {
  const p = usePalette();
  return {
    contentStyle: {
      background: p.surface,
      border: `1px solid ${p.line}`,
      borderRadius: 8,
      color: p.ink,
      fontSize: 13,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    labelStyle: { color: p.muted, marginBottom: 2 },
    itemStyle: { color: p.ink, padding: 0 },
    cursor: { fill: p.line, fillOpacity: 0.4, stroke: p.muted, strokeDasharray: '3 3' },
  };
}

export function ChartCard({
  title,
  sub,
  children,
  right,
  index,
}: {
  title: string;
  sub?: ReactNode;
  children: ReactNode;
  right?: ReactNode;
  index?: number;
}) {
  return (
    <Card index={index}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="h-title text-xl">{title}</div>
          {sub && <div className="text-xs text-muted">{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

export function TrendBars({
  data,
  dataKey,
  series,
  unit,
  height = 180,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  series: Series;
  unit: string;
  height?: number;
}) {
  const p = usePalette();
  const tip = useTooltip();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke={p.line} />
        <XAxis dataKey="label" tick={{ fill: p.muted, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
        <YAxis tick={{ fill: p.muted, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v)} width={44} />
        <Tooltip {...tip} formatter={(v) => [`${fmtNum(Number(v), 1)} ${unit}`, '']} separator="" />
        <Bar dataKey={dataKey} fill={color(p, series)} radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({
  data,
  dataKey,
  series,
  unit,
  xKey = 'label',
  height = 200,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  series: Series;
  unit: string;
  xKey?: string;
  height?: number;
}) {
  const p = usePalette();
  const tip = useTooltip();
  const c = color(p, series);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={p.line} />
        <XAxis dataKey={xKey} tick={{ fill: p.muted, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
        <YAxis tick={{ fill: p.muted, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v)} width={44} domain={['auto', 'auto']} />
        <Tooltip {...tip} formatter={(v) => [`${fmtNum(Number(v), 1)} ${unit}`, '']} separator="" />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={c}
          strokeWidth={2}
          dot={{ r: 4, fill: c, stroke: p.surface, strokeWidth: 2 }}
          activeDot={{ r: 6, stroke: p.surface, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Horizontal ranked bars with the category name on the axis — readable for 10+ categories on a phone. */
export function RankBars({ data, series, unit }: { data: { name: string; value: number }[]; series: Series; unit: string }) {
  const p = usePalette();
  const tip = useTooltip();
  const height = Math.max(120, data.length * 34);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 52, left: 0, bottom: 0 }} barCategoryGap={7}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={112} tick={{ fill: p.ink, fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip {...tip} formatter={(v) => [`${fmtNum(Number(v), 1)} ${unit}`, '']} separator="" />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: p.muted, fontSize: 11, formatter: (v: unknown) => fmtNum(Number(v)) }}>
          {data.map((d) => (
            <Cell key={d.name} fill={color(p, series)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
