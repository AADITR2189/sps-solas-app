import { NavLink } from 'react-router-dom';
import { House, CalendarBlank, Plus, ChartLineUp, ListBullets } from '@phosphor-icons/react';

const item = 'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors';

export default function BottomNav() {
  const cls = ({ isActive }: { isActive: boolean }) => `${item} ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 pb-safe backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
        <NavLink to="/" end className={cls}>
          {({ isActive }) => (
            <>
              <House size={22} weight={isActive ? 'fill' : 'bold'} />
              Home
            </>
          )}
        </NavLink>
        <NavLink to="/calendar" className={cls}>
          {({ isActive }) => (
            <>
              <CalendarBlank size={22} weight={isActive ? 'fill' : 'bold'} />
              Calendar
            </>
          )}
        </NavLink>
        <NavLink to="/log" className={`${item}`} aria-label="Log workout">
          {({ isActive }) => (
            <>
              <span className={`grid h-11 w-11 place-items-center rounded-btn bg-primary text-primary-ink transition-transform active:scale-[0.96] ${isActive ? 'ring-2 ring-offset-2 ring-offset-bg ring-primary' : ''}`}>
                <Plus size={24} weight="bold" />
              </span>
            </>
          )}
        </NavLink>
        <NavLink to="/history" className={cls}>
          {({ isActive }) => (
            <>
              <ListBullets size={22} weight={isActive ? 'fill' : 'bold'} />
              History
            </>
          )}
        </NavLink>
        <NavLink to="/progress" className={cls}>
          {({ isActive }) => (
            <>
              <ChartLineUp size={22} weight={isActive ? 'fill' : 'bold'} />
              Progress
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
