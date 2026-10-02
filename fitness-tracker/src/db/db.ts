import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  BackupFile,
  CustomCardio,
  CustomExercise,
  Favorite,
  Session,
  Settings,
  Template,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';

/**
 * IndexedDB schema (database "gym-diary", version 1)
 *
 *  sessions         keyPath id    indexes: by-date (date), by-kind (kind)
 *  customExercises  keyPath id
 *  customCardio     keyPath id
 *  favorites        keyPath key
 *  templates        keyPath id    (user-saved templates; built-ins live in code)
 *  kv               out-of-line keys (e.g. "settings")
 */
interface GymDB extends DBSchema {
  sessions: { key: string; value: Session; indexes: { 'by-date': string; 'by-kind': string } };
  customExercises: { key: string; value: CustomExercise };
  customCardio: { key: string; value: CustomCardio };
  favorites: { key: string; value: Favorite };
  templates: { key: string; value: Template };
  kv: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<GymDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<GymDB>('gym-diary', 1, {
      upgrade(d) {
        const s = d.createObjectStore('sessions', { keyPath: 'id' });
        s.createIndex('by-date', 'date');
        s.createIndex('by-kind', 'kind');
        d.createObjectStore('customExercises', { keyPath: 'id' });
        d.createObjectStore('customCardio', { keyPath: 'id' });
        d.createObjectStore('favorites', { keyPath: 'key' });
        d.createObjectStore('templates', { keyPath: 'id' });
        d.createObjectStore('kv');
      },
    });
  }
  return dbPromise;
}

// ---- change notification so React hooks can re-query after writes ----
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function notify() {
  listeners.forEach((fn) => fn());
}

export function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ---- sessions ----
export async function getAllSessions(): Promise<Session[]> {
  const all = await (await db()).getAll('sessions');
  return all.sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
}

export async function getSession(id: string) {
  return (await db()).get('sessions', id);
}

export async function saveSession(s: Session) {
  await (await db()).put('sessions', { ...s, updatedAt: Date.now() });
  notify();
}

export async function deleteSession(id: string) {
  await (await db()).delete('sessions', id);
  notify();
}

// ---- custom exercises / cardio ----
export async function getCustomExercises() {
  return (await db()).getAll('customExercises');
}
export async function addCustomExercise(e: CustomExercise) {
  await (await db()).put('customExercises', e);
  notify();
}
export async function deleteCustomExercise(id: string) {
  await (await db()).delete('customExercises', id);
  notify();
}
export async function getCustomCardio() {
  return (await db()).getAll('customCardio');
}
export async function addCustomCardio(c: CustomCardio) {
  await (await db()).put('customCardio', c);
  notify();
}
export async function deleteCustomCardio(id: string) {
  await (await db()).delete('customCardio', id);
  notify();
}

// ---- favorites ----
export async function getFavorites() {
  return (await db()).getAll('favorites');
}
export async function toggleFavorite(key: string) {
  const d = await db();
  if (await d.get('favorites', key)) await d.delete('favorites', key);
  else await d.put('favorites', { key, addedAt: Date.now() });
  notify();
}

// ---- templates ----
export async function getUserTemplates() {
  return (await db()).getAll('templates');
}
export async function saveTemplate(t: Template) {
  await (await db()).put('templates', t);
  notify();
}
export async function deleteTemplate(id: string) {
  await (await db()).delete('templates', id);
  notify();
}

// ---- settings ----
export async function getSettings(): Promise<Settings> {
  const s = (await (await db()).get('kv', 'settings')) as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}
export async function saveSettings(s: Settings) {
  await (await db()).put('kv', s, 'settings');
  notify();
}

// ---- backup / restore ----
export async function exportBackup(): Promise<BackupFile> {
  const d = await db();
  return {
    app: 'gym-diary',
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: await d.getAll('sessions'),
    customExercises: await d.getAll('customExercises'),
    customCardio: await d.getAll('customCardio'),
    favorites: await d.getAll('favorites'),
    templates: await d.getAll('templates'),
    settings: await getSettings(),
  };
}

/** mode "replace" wipes existing data first; "merge" upserts by id. */
export async function importBackup(b: BackupFile, mode: 'replace' | 'merge') {
  const d = await db();
  const tx = d.transaction(
    ['sessions', 'customExercises', 'customCardio', 'favorites', 'templates', 'kv'],
    'readwrite',
  );
  if (mode === 'replace') {
    await Promise.all([
      tx.objectStore('sessions').clear(),
      tx.objectStore('customExercises').clear(),
      tx.objectStore('customCardio').clear(),
      tx.objectStore('favorites').clear(),
      tx.objectStore('templates').clear(),
    ]);
  }
  for (const s of b.sessions ?? []) await tx.objectStore('sessions').put(s);
  for (const e of b.customExercises ?? []) await tx.objectStore('customExercises').put(e);
  for (const c of b.customCardio ?? []) await tx.objectStore('customCardio').put(c);
  for (const f of b.favorites ?? []) await tx.objectStore('favorites').put(f);
  for (const t of b.templates ?? []) await tx.objectStore('templates').put(t);
  if (b.settings) await tx.objectStore('kv').put({ ...DEFAULT_SETTINGS, ...b.settings }, 'settings');
  await tx.done;
  notify();
}

export async function putSessions(list: Session[]) {
  const d = await db();
  const tx = d.transaction('sessions', 'readwrite');
  for (const s of list) await tx.store.put(s);
  await tx.done;
  notify();
}

export async function wipeAll() {
  const d = await db();
  await Promise.all([
    d.clear('sessions'),
    d.clear('customExercises'),
    d.clear('customCardio'),
    d.clear('favorites'),
    d.clear('templates'),
    d.clear('kv'),
  ]);
  notify();
}

/** Ask the browser not to evict our data under storage pressure (important on iOS). */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      return await navigator.storage.persist();
    }
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}
