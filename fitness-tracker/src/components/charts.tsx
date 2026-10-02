import type { ReactNode } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import { fmtNum } from '../lib/stats';

// Single-series charts use the app's two identity colors; multi-category bars use one hue + labels
// (identity is carried by the axis label, never by color alone).
export const C = {
  strength: '#a3e635',
  cardio: '#38bdf8',
  grid: '#262b34',
  axis: '#8b93a1',
  surface: '#14171c',
  gold: '#facc15',
};

const tooltipStyle = {
  contentStyle: { background: '#1c2027', border: '1px solid #262b34', borderRadius: 12, color: '#fff', fontSize: 13 },
  labelStyle: { color: '#8b93a1', marginBottom: 2 },
  itemStyle: { color: '#fff', padding: 0 },
  cursor: { fill: 'rgba(255,255,255,0.05)', stroke: '#8b93a1', strokeDasharray: '3 3' },
};

export function ChartCard({ title, sub, children, right }: { title: string; sub?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{title}</div>
          {sub && <div className="text-xs text-muted">{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function TrendBars({
  data,
  dataKey,
  color,
  unit,
  height = 180,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color: string;
  unit: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke={C.grid} />
        <XAxis dataKey="label" tick={{ fill: C.axis, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: C.axis, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v)} width={44} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${fmtNum(Number(v), 1)} ${unit}`, '']} separator="" />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({
  data,
  dataKey,
  color,
  unit,
  xKey = 'label',
  height = 200,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color: string;
  unit: string;
  xKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={C.grid} />
        <XAxis dataKey={xKey} tick={{ fill: C.axis, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
        <YAxis tick={{ fill: C.axis, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v)} width={44} domain={['auto', 'auto']} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${fmtNum(Number(v), 1)} ${unit}`, '']} separator="" />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 4, fill: color, stroke: C.surface, strokeWidth: 2 }}
          activeDot={{ r: 6, stroke: C.surface, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Horizontal ranked bars with the category name on the axis — readable for 10+ categories on a phone. */
export function RankBars({
  data,
  color,
  unit,
  highlight,
}: {
  data: { name: string; value: number }[];
  color: string;
  unit: string;
  highlight?: string;
}) {
  const height = Math.max(120, data.length * 34);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap={6}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={104} tick={{ fill: '#d4d8de', fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${fmtNum(Number(v), 1)} ${unit}`, '']} separator="" />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          label={{ position: 'right', fill: '#8b93a1', fontSize: 11, formatter: (v: unknown) => fmtNum(Number(v)) }}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={color} fillOpacity={highlight && d.name !== highlight ? 0.45 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
