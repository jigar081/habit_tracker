import { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { computeStreak, computeCompletionRate } from '../utils/habitUtils';
import { getTodayKey, getWeekDates, DAYS_OF_WEEK } from '../utils/dateUtils';
import { getStreakQuote } from '../utils/quoteUtils';
import { showToast } from './ToastContainer';

// Circular progress ring
function ProgressRing({ percent, size = 80, stroke = 7, color = '#6C63FF' }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} className="progress-ring">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-pending)" strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
        </svg>
    );
}

export default function Dashboard({ onAddHabit }) {
    const { habits, markDone, markMissed } = useHabits();
    const today = getTodayKey();
    const weekDates = getWeekDates();

    const todayDone = useMemo(() => habits.filter(h => h.completions[today] === 'done').length, [habits, today]);
    const todayMissed = useMemo(() => habits.filter(h => h.completions[today] === 'missed').length, [habits, today]);
    const todayPending = habits.length - todayDone - todayMissed;

    const totalPercent = habits.length === 0 ? 0 : Math.round((todayDone / habits.length) * 100);

    const bestStreak = useMemo(() => {
        if (!habits.length) return 0;
        return Math.max(...habits.map(h => computeStreak(h.completions).current));
    }, [habits]);

    const overallRate = useMemo(() => {
        if (!habits.length) return 0;
        const rates = habits.map(h => computeCompletionRate(h.completions, h.createdAt));
        return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    }, [habits]);

    const quote = useMemo(() => getStreakQuote(bestStreak), [bestStreak]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const handleDone = (habitId, e) => {
        e.stopPropagation();
        const h = habits.find(x => x.id === habitId);
        if (h?.completions[today] === 'done') {
            markDone(habitId, today); // untoggle
            showToast('Habit unmarked', 'info');
        } else {
            markDone(habitId, today);
            showToast('Great job! Habit completed! 🎉', 'done');
        }
    };

    const handleMissed = (habitId, e) => {
        e.stopPropagation();
        const h = habits.find(x => x.id === habitId);
        if (h?.completions[today] === 'missed') {
            markMissed(habitId, today); // untoggle
            showToast('Habit status cleared', 'info');
        } else {
            markMissed(habitId, today);
            showToast('Logged as missed', 'missed');
        }
    };

    const statCards = [
        {
            icon: '🎯',
            value: `${totalPercent}%`,
            label: "Today's Progress",
            accent: '#6C63FF',
            iconBg: 'rgba(108,99,255,0.12)',
        },
        {
            icon: '🔥',
            value: bestStreak,
            label: 'Best Active Streak',
            accent: '#FF6B35',
            iconBg: 'rgba(255,107,53,0.12)',
        },
        {
            icon: '✅',
            value: todayDone,
            label: 'Done Today',
            accent: '#20C997',
            iconBg: 'rgba(32,201,151,0.12)',
        },
        {
            icon: '📈',
            value: `${overallRate}%`,
            label: 'Overall Rate',
            accent: '#38BDF8',
            iconBg: 'rgba(56,189,248,0.12)',
        },
    ];

    return (
        <div>
            {/* Greeting */}
            <div className="dashboard-greeting">
                <div className="greeting-text">
                    {greeting} 👋
                    <span style={{ display: 'block', background: 'linear-gradient(135deg, #6C63FF, #9C4FE4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        Let's build great habits!
                    </span>
                </div>
                <div className="greeting-date">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((s, i) => (
                    <div
                        key={i}
                        className="stat-card"
                        style={{ '--card-accent': s.accent, '--icon-bg': s.iconBg }}
                    >
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Quote */}
            <div className="quote-card">
                <div className="quote-text">"{quote.quote}"</div>
                <div className="quote-author">— {quote.author}</div>
            </div>

            {/* Dashboard Grid */}
            <div className="dashboard-grid">
                {/* Today's Habits */}
                <div>
                    <div className="section-header">
                        <div className="section-title">
                            Today's Habits
                            <span className="section-badge">{habits.length}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {habits.length > 0 && (
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                    {todayDone}/{habits.length} done
                                </span>
                            )}
                        </div>
                    </div>

                    {habits.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🌱</div>
                            <div className="empty-title">No habits yet</div>
                            <div className="empty-desc">Start your journey by adding your first habit. Small steps lead to big changes!</div>
                            <button className="btn btn-primary" onClick={onAddHabit} id="empty-add-habit-btn">
                                ✨ Add Your First Habit
                            </button>
                        </div>
                    ) : (
                        <div className="today-habits-list">
                            {habits.map(habit => {
                                const status = habit.completions[today];
                                const { current } = computeStreak(habit.completions);
                                const rate = computeCompletionRate(habit.completions, habit.createdAt);
                                return (
                                    <div
                                        key={habit.id}
                                        className={`habit-today-card${status ? ` ${status}` : ''}`}
                                        style={{ '--habit-color': habit.color }}
                                    >
                                        <div
                                            className="habit-icon-circle"
                                            style={{ background: `${habit.color}18`, '--icon-bg': `${habit.color}18` }}
                                        >
                                            {habit.icon}
                                        </div>

                                        <div className="habit-today-info">
                                            <div className="habit-today-name">{habit.name}</div>
                                            <div className="habit-today-meta">
                                                {current > 0 && (
                                                    <span className="habit-streak-badge">
                                                        <span className="streak-fire">🔥</span>
                                                        {current} day{current !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                <span className="habit-rate-badge">{rate}% rate</span>
                                            </div>
                                        </div>

                                        <div className="habit-action-btns">
                                            <button
                                                className={`action-btn done-btn${status === 'done' ? ' active' : ''}`}
                                                onClick={(e) => handleDone(habit.id, e)}
                                                title={status === 'done' ? 'Unmark done' : 'Mark done'}
                                                id={`done-btn-${habit.id}`}
                                            >
                                                ✓
                                            </button>
                                            <button
                                                className={`action-btn missed-btn${status === 'missed' ? ' active' : ''}`}
                                                onClick={(e) => handleMissed(habit.id, e)}
                                                title={status === 'missed' ? 'Unmark missed' : 'Mark missed'}
                                                id={`missed-btn-${habit.id}`}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Weekly Summary Panel */}
                <div>
                    {/* Progress Circle Card */}
                    <div className="weekly-card" style={{ marginBottom: 16 }}>
                        <div className="section-title" style={{ fontSize: 15, marginBottom: 16 }}>📊 Today's Overview</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                                <ProgressRing percent={totalPercent} size={80} stroke={7} />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column',
                                }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                                        {totalPercent}%
                                    </div>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                        { label: 'Done', count: todayDone, color: 'var(--color-done)' },
                                        { label: 'Missed', count: todayMissed, color: 'var(--color-missed)' },
                                        { label: 'Pending', count: todayPending, color: 'var(--text-muted)' },
                                    ].map(({ label, count, color }) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weekly View */}
                    <div className="weekly-card">
                        <div className="section-title" style={{ fontSize: 15 }}>📆 This Week</div>
                        <div className="weekly-days">
                            {weekDates.map((dateKey, i) => {
                                const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i];
                                const isToday = dateKey === today;
                                const isFuture = dateKey > today;
                                return (
                                    <div key={dateKey} className="weekly-day-col">
                                        <span
                                            className="weekly-day-label"
                                            style={{ color: isToday ? 'var(--accent)' : undefined }}
                                        >
                                            {dayLabel}
                                        </span>
                                        <div className="weekly-day-dots">
                                            {habits.slice(0, 5).map(h => {
                                                const status = h.completions[dateKey];
                                                return (
                                                    <div
                                                        key={h.id}
                                                        className={`weekly-dot${status === 'done' ? ' done' : status === 'missed' ? ' missed' : ''}${isToday ? ' today' : ''}`}
                                                        style={!status && !isFuture ? { background: `${h.color}50` } : {}}
                                                        title={`${h.name}: ${status || (isFuture ? 'upcoming' : 'pending')}`}
                                                    />
                                                );
                                            })}
                                            {habits.length === 0 && (
                                                <div className="weekly-dot" style={{ opacity: 0.3 }} />
                                            )}
                                        </div>
                                        {isToday && (
                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: 2 }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
