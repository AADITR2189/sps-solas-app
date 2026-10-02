import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { DataProvider } from './hooks/useData';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import LogHub from './pages/LogHub';
import Editor from './pages/Editor';
import CalendarPage from './pages/CalendarPage';
import History from './pages/History';
import Progress from './pages/Progress';
import SettingsPage from './pages/SettingsPage';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

// HashRouter keeps routing working on any static host (GitHub Pages etc.) and offline.
export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <ScrollTop />
        <main className="mx-auto min-h-screen max-w-lg px-4 pb-28 pt-safe">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log" element={<LogHub />} />
            <Route path="/log/edit" element={<Editor />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
        <BottomNav />
      </HashRouter>
    </DataProvider>
  );
}
