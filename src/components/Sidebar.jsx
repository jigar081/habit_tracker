import { useHabits } from '../context/HabitContext';

const NAV_ITEMS = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'habits', icon: '📋', label: 'My Habits' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'stats', icon: '📊', label: 'Stats' },
];

export default function Sidebar({ onClose }) {
    const { activeView, setActiveView, habits, theme, toggleTheme } = useHabits();

    const handleNav = (id) => {
        setActiveView(id);
        onClose?.();
    };

    const todayKey = new Date().toISOString().split('T')[0];
    const todayDone = habits.filter(h => h.completions[todayKey] === 'done').length;

    return (
        <>
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">🔥</div>
                <span className="sidebar-logo-text">HabitFlow</span>
            </div>

            <nav className="sidebar-nav">
                <span className="sidebar-section-title">Navigation</span>

                {NAV_ITEMS.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item${activeView === item.id ? ' active' : ''}`}
                        onClick={() => handleNav(item.id)}
                        id={`nav-${item.id}`}
                    >
                        <span className="nav-item-icon">{item.icon}</span>
                        <span>{item.label}</span>
                        {item.id === 'dashboard' && habits.length > 0 && (
                            <span className="nav-item-badge">
                                {todayDone}/{habits.length}
                            </span>
                        )}
                    </button>
                ))}


            </nav>

            <div className="sidebar-footer">
                <button className="nav-item" onClick={toggleTheme} id="theme-toggle">
                    <span className="nav-item-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <div style={{
                    padding: '12px',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.5',
                    marginTop: 4,
                }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        📆 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div>{habits.length} habit{habits.length !== 1 ? 's' : ''} tracked</div>
                    <div>{todayDone} completed today</div>
                </div>
            </div>
        </>
    );
}
