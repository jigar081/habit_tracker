import { useHabits } from '../context/HabitContext';

const MOBILE_NAV = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'habits', icon: '📋', label: 'Habits' },
    { id: 'calendar', icon: '📅', label: 'Calendar' },
    { id: 'stats', icon: '📊', label: 'Stats' },
];

export default function MobileNav() {
    const { activeView, setActiveView } = useHabits();

    return (
        <nav className="mobile-nav">
            <div className="mobile-nav-items">
                {MOBILE_NAV.map(item => (
                    <button
                        key={item.id}
                        className={`mobile-nav-item${activeView === item.id ? ' active' : ''}`}
                        onClick={() => setActiveView(item.id)}
                        id={`mobile-nav-${item.id}`}
                    >
                        <span className="mobile-nav-icon">{item.icon}</span>
                        <span className="mobile-nav-label">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
