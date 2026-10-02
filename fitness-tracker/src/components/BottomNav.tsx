import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Plus, TrendingUp, ListChecks } from 'lucide-react';

const item = 'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium';

export default function BottomNav() {
  const cls = ({ isActive }: { isActive: boolean }) => `${item} ${isActive ? 'text-accent' : 'text-muted'}`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-safe backdrop-blur">
      <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
        <NavLink to="/" end className={cls}>
          <Home size={22} />
          Home
        </NavLink>
        <NavLink to="/calendar" className={cls}>
          <CalendarDays size={22} />
          Calendar
        </NavLink>
        <NavLink to="/log" className={`${item} -mt-5`} aria-label="Log workout">
          {({ isActive }) => (
            <>
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl shadow-lg shadow-black/50 ${
                  isActive ? 'bg-lime-300' : 'bg-accent'
                } text-accent-ink`}
              >
                <Plus size={30} strokeWidth={2.5} />
              </span>
              <span className={isActive ? 'text-accent' : 'text-muted'}>Log</span>
            </>
          )}
        </NavLink>
        <NavLink to="/history" className={cls}>
          <ListChecks size={22} />
          History
        </NavLink>
        <NavLink to="/progress" className={cls}>
          <TrendingUp size={22} />
          Progress
        </NavLink>
      </div>
    </nav>
  );
}
