import { useState, useCallback } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { HabitProvider, useHabits } from './context/HabitContext';
import LoginScreen from './components/LoginScreen';
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
  const { activeUser, logoutUser } = useUser();
  const { activeView, setActiveView, theme, toggleTheme, habits } = useHabits();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editHabitId, setEditHabitId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openAddHabit = useCallback(() => { setEditHabitId(null); setModalOpen(true); }, []);
  const openEditHabit = useCallback((id) => { setEditHabitId(id); setModalOpen(true); }, []);
  const closeModal = useCallback(() => { setModalOpen(false); setEditHabitId(null); }, []);

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

            {/* User profile button */}
            <div className="user-menu-wrapper">
              <button
                className="user-avatar-btn"
                onClick={() => setShowUserMenu(v => !v)}
                id="user-profile-btn"
                title={activeUser?.name}
              >
                {activeUser?.avatar || '👤'}
              </button>

              {showUserMenu && (
                <>
                  <div className="user-menu-overlay" onClick={() => setShowUserMenu(false)} />
                  <div className="user-menu-dropdown" id="user-menu-dropdown">
                    <div className="user-menu-header">
                      <span className="user-menu-avatar">{activeUser?.avatar}</span>
                      <div>
                        <div className="user-menu-name">{activeUser?.name}</div>
                        <div className="user-menu-since">
                          Since {new Date(activeUser?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="user-menu-divider" />
                    <button
                      className="user-menu-item"
                      onClick={() => { setShowUserMenu(false); logoutUser(); }}
                      id="switch-profile-btn"
                    >
                      🔄 Switch Profile
                    </button>
                    <button
                      className="user-menu-item logout"
                      onClick={() => { setShowUserMenu(false); logoutUser(); }}
                      id="logout-btn"
                    >
                      🚪 Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
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

function AuthenticatedApp() {
  return (
    <HabitProvider>
      <AppInner />
    </HabitProvider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

function AppContent() {
  const { activeUser } = useUser();

  if (!activeUser) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
}
