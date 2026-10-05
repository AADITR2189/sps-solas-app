import type { ReactNode } from 'react';
import { BACK_REGIONS, FRONT_REGIONS, regionInfo, type Region } from '../data/muscles';
import { heatColor } from '../lib/heatmap';

/*
 * Stylised front/back body drawn on a 160 x 340 grid. Muscle shapes are defined for the LEFT side of
 * the figure and mirrored for the right; a few central shapes (traps, lower back) are drawn once.
 */

const W = 160;
const H = 340;

type Shapes = Partial<Record<Region, { side?: string[]; center?: string[] }>>;

const FRONT: Shapes = {
  traps: { side: ['M73 45 Q65 47 59 51.5 L72 52 Z'] },
  sideDelts: { side: ['M50.5 54 Q42.5 57.5 41.5 69.5 Q43 76 46 74.5 Q46.5 62.5 53 56 Z'] },
  frontDelts: { side: ['M58.5 52.5 Q49.5 54.5 47.5 66 Q49 74.5 55 74.5 Q58.5 64.5 63 56 Z'] },
  chest: { side: ['M79 55 L63.5 56 Q55.5 63.5 56.5 76 Q62 86.5 72 86.5 Q78 84.5 79 80 Z'] },
  biceps: { side: ['M46.5 78.5 Q41 91 42 104.5 Q46 109 50 104.5 Q53.5 92 52.5 80 Q49.5 76 46.5 78.5 Z'] },
  forearms: { side: ['M42.5 110.5 Q36.5 126 35 150 Q38 156.5 42 152.5 Q46.5 134.5 50.5 112.5 Q46.5 106.5 42.5 110.5 Z'] },
  abs: {
    side: [
      'M72 90 h7 v10.5 h-7 Z',
      'M72 102.5 h7 v10.5 h-7 Z',
      'M72 115 h7 v10.5 h-7 Z',
      'M72 127.5 h7 v14.5 Q75 140.5 72 134.5 Z',
    ],
  },
  obliques: { side: ['M70 90 Q62.5 98 61.5 116 Q62.5 130 70 138 Z'] },
  abductors: { side: ['M60.5 140.5 Q56.5 148.5 57.5 160 L62 160 Q63 150 66.5 142.5 Z'] },
  quads: { side: ['M62.5 156.5 Q56 181 60 222 Q66 228.5 74 226.5 Q78.5 200 77 172 Q74 160 68.5 154 Z'] },
  adductors: { side: ['M77.5 160 Q80.5 175 79.5 197 Q76 192.5 74.5 178 Q73.5 168 77.5 160 Z'] },
  calves: { side: ['M61.5 244 Q57 270 62.5 302 L68 302 Q67 270 68.5 246 Z', 'M70.5 246 Q75 270 72.5 300 L76 300 Q79.5 270 75.5 245 Z'] },
};

const BACK: Shapes = {
  traps: { center: ['M80 40 L68 46 L58.5 52 L70 60 L76 84 L80 92 L84 84 L90 60 L101.5 52 L92 46 Z'] },
  sideDelts: { side: ['M50.5 54 Q42.5 57.5 41.5 69.5 Q43 76 46 74.5 Q46.5 62.5 53 56 Z'] },
  rearDelts: { side: ['M58 53 Q48.5 55 46.5 66 Q49 74 55 72.5 Q58.5 62.5 63.5 57 Z'] },
  triceps: { side: ['M46.5 77 Q41 90 42 106 Q47 110.5 51 104.5 Q53.5 90 51.5 78 Z'] },
  forearms: { side: ['M42.5 111 Q36.5 126 35 150 Q38 156.5 42 152.5 Q46.5 134.5 50.5 113 Q46.5 107 42.5 111 Z'] },
  lats: { side: ['M69 62 Q59.5 66.5 58 80 Q60 104 72 124 L78 112 L78 92 Q73.5 80 69 62 Z'] },
  lowerBack: { center: ['M72.5 118 L87.5 118 L90 140 Q80 146 70 140 Z'] },
  abductors: { side: ['M60.5 136 Q56 142 58 150.5 L66 146.5 L66 136.5 Z'] },
  glutes: { side: ['M79 142.5 Q66.5 138 60.5 148.5 Q58 164 66 170 Q76 172.5 79.5 162 Z'] },
  hamstrings: { side: ['M61 173 Q57 197 62 224.5 L70 226 Q72 200 70.5 174 Z', 'M72.5 174 Q76.5 197 74.5 224 L78 222.5 Q79.5 196 77.5 174 Z'] },
  adductors: { side: ['M77.5 167 Q80.5 176 79.5 191 Q77 187 76.5 176 Z'] },
  calves: { side: ['M62.5 240 Q57 258 62 282 Q66 290.5 70 284 Q70 262 68.5 240 Z', 'M70.5 240 Q76.5 258 74.5 282 Q72.5 290.5 70 284 Q71 262 70.5 240 Z'] },
};

/** Neutral body silhouette under the muscles (left side; mirrored). */
const BASE_SIDE = [
  'M60 47 Q72 42.5 80 42.5 L80 146 Q68 148 58 140 Q55 96 60 47 Z', // torso
  'M57.5 51 Q44 53 40.5 68 Q39.5 90 41 104 Q35 126 33.5 152 L42.5 154 Q47.5 133 51.5 112 Q55 94 58.5 72 Z', // arm
  'M57.5 138 Q54.5 180 59.5 228 Q60.5 236 61 242 Q56.5 272 62 312 L75.5 312 Q78.5 274 75.5 240 Q78 236 78.5 228 Q81 190 80 146 Z', // leg
];
const BASE_EXTRA = (
  <>
    <ellipse cx="80" cy="22" rx="13" ry="16" />
    <path d="M73.5 35 L86.5 35 L88 46 L72 46 Z" />
    <ellipse cx="34.5" cy="160" rx="5" ry="8" />
    <ellipse cx="125.5" cy="160" rx="5" ry="8" />
    <ellipse cx="68.5" cy="318" rx="8.5" ry="5" />
    <ellipse cx="91.5" cy="318" rx="8.5" ry="5" />
  </>
);

const mirror = `translate(${W} 0) scale(-1 1)`;

export type BodyMapMode = 'heat' | 'mono';

function fillFor(v: number | undefined, mode: BodyMapMode) {
  if (!v) return 'rgb(var(--line))';
  if (mode === 'heat') return heatColor(v);
  return `rgb(var(--str) / ${(0.18 + 0.82 * v).toFixed(3)})`;
}

function Figure({
  shapes,
  regions,
  values,
  mode,
  selected,
  onSelect,
  label,
  width,
  caption,
}: {
  shapes: Shapes;
  regions: Region[];
  values: Partial<Record<Region, number>>;
  mode: BodyMapMode;
  selected?: Region | null;
  onSelect?: (r: Region) => void;
  label: string;
  width: number;
  caption: boolean;
}) {
  const muscle = (r: Region, d: string, key: string, transform?: string) => {
    const v = values[r];
    const isSel = selected === r;
    return (
      <path
        key={key}
        d={d}
        transform={transform}
        fill={fillFor(v, mode)}
        stroke={isSel ? 'rgb(var(--ink))' : 'rgb(var(--surface))'}
        strokeWidth={isSel ? 1.8 : 1.1}
        strokeLinejoin="round"
        style={{ transition: 'fill 500ms ease', cursor: onSelect ? 'pointer' : undefined }}
        onClick={onSelect ? () => onSelect(r) : undefined}
      >
        <title>{regionInfo(r).name}</title>
      </path>
    );
  };
  // Draw the selected region last so its outline sits on top.
  const order = [...regions].sort((a, b) => (a === selected ? 1 : b === selected ? -1 : 0));
  return (
    <figure className="flex flex-col items-center">
      <svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} body muscle map`}>
        <g className="fill-raised">
          {BASE_SIDE.map((d, i) => (
            <path key={`b${i}`} d={d} />
          ))}
          {BASE_SIDE.map((d, i) => (
            <path key={`bm${i}`} d={d} transform={mirror} />
          ))}
          {BASE_EXTRA}
        </g>
        {order.map((r) => {
          const s = shapes[r];
          if (!s) return null;
          return [
            ...(s.side ?? []).flatMap((d, i) => [muscle(r, d, `${r}l${i}`), muscle(r, d, `${r}r${i}`, mirror)]),
            ...(s.center ?? []).map((d, i) => muscle(r, d, `${r}c${i}`)),
          ];
        })}
      </svg>
      {caption && <figcaption className="eyebrow mt-1">{label}</figcaption>}
    </figure>
  );
}

/**
 * Front/back muscle map. `values` are intensities 0–1 per region.
 * mode "heat" = blue→red load gradient; "mono" = single colour, darker = more involvement.
 * view "auto" shows only the side(s) that have any highlighted muscle.
 */
export default function BodyMap({
  values,
  mode = 'heat',
  view = 'both',
  selected,
  onSelect,
  width = 140,
  compact = false,
  children,
}: {
  values: Partial<Record<Region, number>>;
  mode?: BodyMapMode;
  view?: 'both' | 'front' | 'back' | 'auto';
  selected?: Region | null;
  onSelect?: (r: Region) => void;
  width?: number;
  /** Small thumbnail: no captions, tight spacing. */
  compact?: boolean;
  children?: ReactNode;
}) {
  let showFront = view !== 'back';
  let showBack = view !== 'front';
  if (view === 'auto') {
    const lit = (list: Region[]) => list.some((r) => (values[r] ?? 0) > 0 && !(r === 'sideDelts' || r === 'forearms' || r === 'traps' || r === 'abductors' || r === 'adductors' || r === 'calves'));
    showFront = lit(FRONT_REGIONS);
    showBack = lit(BACK_REGIONS);
    if (!showFront && !showBack) showFront = showBack = true;
  }
  return (
    <div className="flex flex-col items-center">
      <div className={`flex items-start justify-center ${compact ? 'gap-0.5' : 'gap-4'}`}>
        {showFront && (
          <Figure shapes={FRONT} regions={FRONT_REGIONS} values={values} mode={mode} selected={selected} onSelect={onSelect} label="Front" width={width} caption={!compact} />
        )}
        {showBack && (
          <Figure shapes={BACK} regions={BACK_REGIONS} values={values} mode={mode} selected={selected} onSelect={onSelect} label="Back" width={width} caption={!compact} />
        )}
      </div>
      {children}
    </div>
  );
}
