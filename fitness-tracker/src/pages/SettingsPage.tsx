import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, FileSpreadsheet, ShieldCheck, Smartphone, Trash2, Database, Sparkles } from 'lucide-react';
import { useData } from '../hooks/useData';
import { Button, Card, Chip, SectionTitle } from '../components/ui';
import {
  deleteCustomCardio,
  deleteCustomExercise,
  exportBackup,
  importBackup,
  putSessions,
  requestPersistentStorage,
  saveSettings,
  wipeAll,
} from '../db/db';
import { csvToSessions, downloadText, sessionsToCsv } from '../lib/csv';
import { todayKey } from '../lib/date';
import { makeDemoSessions } from '../lib/demo';
import type { BackupFile } from '../types';

export default function SettingsPage() {
  const nav = useNavigate();
  const { settings, sessions, customExercises, customCardio } = useData();
  const [msg, setMsg] = useState('');
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState('');
  const csvRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
    navigator.storage?.estimate?.().then((e) => {
      if (e.usage !== undefined) setUsage(`${(e.usage / 1024).toFixed(0)} KB used`);
    });
  }, [sessions.length]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 5000);
  };

  async function onImportCsv(file: File) {
    const { sessions: list, errors } = csvToSessions(await file.text());
    if (!list.length) return flash(errors[0] ?? 'No workouts found in that file.');
    const existing = new Set(sessions.map((s) => s.id));
    const dupes = list.filter((s) => existing.has(s.id)).length;
    if (!confirm(`Import ${list.length} workouts?${dupes ? ` ${dupes} already exist and will be updated.` : ''}${errors.length ? `\n\n${errors.length} warning(s):\n${errors.slice(0, 5).join('\n')}` : ''}`)) return;
    await putSessions(list);
    flash(`Imported ${list.length} workouts.`);
  }

  async function onRestore(file: File) {
    try {
      const data = JSON.parse(await file.text()) as BackupFile;
      if (data.app !== 'gym-diary' || !Array.isArray(data.sessions)) return flash('That is not a Gym Diary backup file.');
      const replace = confirm(
        `Backup from ${new Date(data.exportedAt).toLocaleString()} with ${data.sessions.length} workouts.\n\nOK = REPLACE all current data\nCancel = MERGE into current data`,
      );
      await importBackup(data, replace ? 'replace' : 'merge');
      flash(`Restored ${data.sessions.length} workouts (${replace ? 'replaced' : 'merged'}).`);
    } catch {
      flash('Could not read that backup file.');
    }
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 pt-3">
        <button onClick={() => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/'))} className="grid h-11 w-11 place-items-center rounded-full bg-raised" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Settings & data</h1>
      </div>

      {msg && <div className="mt-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">{msg}</div>}

      <SectionTitle>Units</SectionTitle>
      <Card className="space-y-3">
        <Row label="Weight">
          {(['kg', 'lb'] as const).map((u) => (
            <Chip key={u} active={settings.weightUnit === u} onClick={() => saveSettings({ ...settings, weightUnit: u })}>{u}</Chip>
          ))}
        </Row>
        <Row label="Distance">
          {(['km', 'mi'] as const).map((u) => (
            <Chip key={u} active={settings.distanceUnit === u} onClick={() => saveSettings({ ...settings, distanceUnit: u })}>{u}</Chip>
          ))}
        </Row>
        <Row label="Week starts">
          <Chip active={settings.weekStartsOn === 1} onClick={() => saveSettings({ ...settings, weekStartsOn: 1 })}>Mon</Chip>
          <Chip active={settings.weekStartsOn === 0} onClick={() => saveSettings({ ...settings, weekStartsOn: 0 })}>Sun</Chip>
        </Row>
        <p className="text-xs text-muted">Units are labels only — numbers are stored exactly as you type them.</p>
      </Card>

      <SectionTitle>Export & backup</SectionTitle>
      <div className="space-y-2">
        <Button className="w-full justify-start" onClick={() => downloadText(`gym-diary-${todayKey()}.csv`, sessionsToCsv(sessions), 'text/csv;charset=utf-8')}>
          <FileSpreadsheet size={20} className="text-accent" /> Export to Excel (CSV)
        </Button>
        <Button className="w-full justify-start" onClick={() => csvRef.current?.click()}>
          <Upload size={20} className="text-accent" /> Import from CSV
        </Button>
        <Button
          className="w-full justify-start"
          onClick={async () => downloadText(`gym-diary-backup-${todayKey()}.json`, JSON.stringify(await exportBackup(), null, 2), 'application/json')}
        >
          <Download size={20} className="text-cardio" /> Full backup (JSON)
        </Button>
        <Button className="w-full justify-start" onClick={() => jsonRef.current?.click()}>
          <Database size={20} className="text-cardio" /> Restore from backup
        </Button>
        <p className="px-1 text-xs text-muted">
          Tip: save a backup to Google Drive / iCloud Files every few weeks. Your data lives only on this device.
        </p>
      </div>
      <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportCsv(f); e.target.value = ''; }} />
      <input ref={jsonRef} type="file" accept=".json,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onRestore(f); e.target.value = ''; }} />

      <SectionTitle>Storage</SectionTitle>
      <Card className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className={persisted ? 'text-accent' : 'text-muted'} />
          <span className="flex-1">{persisted ? 'Protected storage is on' : 'Storage may be cleared by the browser if space runs low'}</span>
        </div>
        {!persisted && (
          <Button size="sm" onClick={async () => setPersisted(await requestPersistentStorage())}>Request protected storage</Button>
        )}
        <div className="text-muted">{sessions.length} workouts · {usage}</div>
      </Card>

      <SectionTitle>Install as an app</SectionTitle>
      <Card className="space-y-2 text-sm">
        <div className="flex items-center gap-2 font-semibold"><Smartphone size={18} /> {standalone ? 'Installed ✓' : 'Add to your home screen'}</div>
        {isIOS ? (
          <p className="text-muted">In Safari tap the <b>Share</b> button, then <b>Add to Home Screen</b>.</p>
        ) : (
          <p className="text-muted">In Chrome tap the <b>⋮ menu</b>, then <b>Install app</b> (or <b>Add to Home screen</b>).</p>
        )}
        <p className="text-muted">Once installed it opens full-screen and works with no internet.</p>
      </Card>

      {(customExercises.length > 0 || customCardio.length > 0) && (
        <>
          <SectionTitle>Custom exercises</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {customExercises.map((e) => (
              <div key={e.id} className="flex items-center px-3 py-2">
                <span className="flex-1">{e.name} <span className="text-xs text-muted">· {e.muscleGroup.toLowerCase()}</span></span>
                <button className="grid h-10 w-10 place-items-center text-muted" onClick={() => deleteCustomExercise(e.id)} aria-label={`Delete ${e.name}`}><Trash2 size={16} /></button>
              </div>
            ))}
            {customCardio.map((c) => (
              <div key={c.id} className="flex items-center px-3 py-2">
                <span className="flex-1">{c.name} <span className="text-xs text-muted">· cardio</span></span>
                <button className="grid h-10 w-10 place-items-center text-muted" onClick={() => deleteCustomCardio(c.id)} aria-label={`Delete ${c.name}`}><Trash2 size={16} /></button>
              </div>
            ))}
          </Card>
          <p className="mt-1 px-1 text-xs text-muted">Removing a custom exercise keeps it in past workouts.</p>
        </>
      )}

      <SectionTitle>Danger zone</SectionTitle>
      <div className="space-y-2">
        {sessions.length === 0 && (
          <Button className="w-full justify-start" onClick={async () => { await putSessions(makeDemoSessions()); flash('Sample data loaded — explore the dashboard, then erase it when ready.'); }}>
            <Sparkles size={20} className="text-gold" /> Load sample data (to try the app)
          </Button>
        )}
        <Button
          variant="danger"
          className="w-full justify-start"
          onClick={async () => {
            if (!confirm('Erase ALL workouts, templates and settings from this device?')) return;
            if (!confirm('Really erase everything? Make a backup first if unsure.')) return;
            await wipeAll();
            flash('All data erased.');
          }}
        >
          <Trash2 size={20} /> Erase all data
        </Button>
      </div>
      <p className="mt-6 text-center text-xs text-muted">Gym Diary · v1.0 · No account, no cloud, no tracking.</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}
