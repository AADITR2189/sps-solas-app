import { useEffect, useState } from 'react';
import type { ThemePref } from '../types';

export type ResolvedTheme = 'light' | 'dark';

const mq = () => (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null);

export function resolveTheme(pref: ThemePref): ResolvedTheme {
  if (pref === 'system') return mq()?.matches ? 'dark' : 'light';
  return pref;
}

/** Sets <html data-theme> + browser chrome colour, and follows the OS when pref is "system". */
export function applyTheme(pref: ThemePref) {
  try {
    localStorage.setItem('gym-diary-theme', pref);
  } catch {
    /* ignore */
  }
  const set = () => {
    const t = resolveTheme(pref);
    document.documentElement.dataset.theme = t;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', PALETTE[t].bg);
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  };
  set();
  if (pref !== 'system') return;
  const m = mq();
  m?.addEventListener('change', set);
  return () => m?.removeEventListener('change', set);
}

/** Chart/JS-side palette. Mirrors the CSS variables in index.css. */
export const PALETTE = {
  light: {
    bg: '#F7F6F3',
    surface: '#FFFFFF',
    ink: '#2F3437',
    muted: '#787774',
    line: '#EAEAEA',
    strength: '#346538',
    cardio: '#1F6C9F',
    gold: '#956400',
    rose: '#9F2F2D',
  },
  dark: {
    bg: '#191919',
    surface: '#202020',
    ink: '#EDECE8',
    muted: '#9B9A97',
    line: '#2F2F2D',
    strength: '#8FC495',
    cardio: '#7BB8E0',
    gold: '#E0B55C',
    rose: '#E58A87',
  },
} as const;

export type Palette = (typeof PALETTE)[ResolvedTheme];

/** Current resolved palette; re-renders when the theme changes. */
export function usePalette(): Palette {
  const read = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark') as ResolvedTheme;
  const [t, setT] = useState<ResolvedTheme>(read);
  useEffect(() => {
    const on = () => setT(read());
    window.addEventListener('themechange', on);
    return () => window.removeEventListener('themechange', on);
  }, []);
  return PALETTE[t];
}
