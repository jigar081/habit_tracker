import { useState, useCallback } from 'react';
import { HabitProvider, useHabits } from './context/HabitContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import HabitsList from './components/HabitsList';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import HabitModal from './components/HabitModal';
import ToastContainer from './components/ToastContainer';

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', subtitle: "Track today's habits" },
  habits: { title: 'My Habits', subtitle: 'Manage & view all habits' },
  calendar: { title: 'Calendar', subtitle: 'View & edit your history' },
  stats: { title: 'Statistics', subtitle: 'Visualize your progress' },
};

function AppInner() {
  const { activeView, setActiveView, theme, toggleTheme, habits } = useHabits();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editHabitId, setEditHabitId] = useState(null);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openAddHabit = useCallback(() => { setEditHabitId(null); setModalOpen(true); }, []);
  const openEditHabit = useCallback((id) => { setEditHabitId(id); setModalOpen(true); }, []);
  const closeModal = useCallback(() => { setModalOpen(false); setEditHabitId(null); }, []);

  /* clicking a habit card from My Habits → jumps to Calendar with that habit tab pre-selected */
  const handleViewHabit = useCallback((_id) => {
    setActiveView('calendar');
  }, [setActiveView]);

  const { title, subtitle } = PAGE_TITLES[activeView] || PAGE_TITLES.dashboard;

  return (
    <div className="app-layout">
      {/* Sidebar overlay (mobile) */}
      <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={closeSidebar} />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <Sidebar onClose={closeSidebar} />
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* ── Header ── */}
        <header className="header">
          <div className="header-left">
            <button
              className="icon-btn mobile-menu-btn"
              onClick={() => setSidebarOpen(v => !v)}
              id="mobile-menu-btn"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <div className="header-title">{title}</div>
              <div className="header-subtitle">{subtitle}</div>
            </div>
          </div>

          <div className="header-right">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              id="header-theme-toggle"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <button
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: 13 }}
              onClick={openAddHabit}
              id="header-add-habit-btn"
            >
              + Add Habit
            </button>
          </div>
        </header>

        {/* ── Page ── */}
        <main className="page-content">
          {activeView === 'dashboard' && <Dashboard onAddHabit={openAddHabit} />}
          {activeView === 'habits' && (
            <HabitsList
              onAddHabit={openAddHabit}
              onEditHabit={openEditHabit}
              onViewHabit={handleViewHabit}
            />
          )}
          {activeView === 'calendar' && <CalendarView />}
          {activeView === 'stats' && <StatsView />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* FAB */}
      <button
        className="fab"
        onClick={openAddHabit}
        id="add-habit-fab"
        aria-label="Add new habit"
        title="Add new habit"
      >
        +
      </button>

      {/* Modal */}
      {modalOpen && <HabitModal habitId={editHabitId} onClose={closeModal} />}

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <HabitProvider>
      <AppInner />
    </HabitProvider>
  );
}
