import { useState, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { computeStreak, computeCompletionRate } from '../utils/habitUtils';
import { getTodayKey, getMonthDays } from '../utils/dateUtils';
import { showToast } from './ToastContainer';

function MiniDots({ completions, createdAt }) {
    const today = getTodayKey();
    // Show last 30 days
    const dots = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const status = completions[key];
        const isToday = key === today;
        const isBefore = key >= createdAt;
        dots.push({ key, status, isToday, isBefore });
    }
    return (
        <div className="habit-card-mini-strip">
            {dots.map(({ key, status, isToday, isBefore }) => (
                <div
                    key={key}
                    className={`mini-dot${status === 'done' ? ' done' : status === 'missed' ? ' missed' : ''}${isToday ? ' today' : ''}`}
                    style={!isBefore ? { opacity: 0.2 } : {}}
                    title={key}
                />
            ))}
        </div>
    );
}

export default function HabitsList({ onAddHabit, onEditHabit, onViewHabit }) {
    const { habits, deleteHabit, markDone, markMissed } = useHabits();
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const today = getTodayKey();

    const handleDelete = (id) => {
        if (deleteConfirm === id) {
            deleteHabit(id);
            setDeleteConfirm(null);
            showToast('Habit deleted', 'deleted');
        } else {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    const handleDone = (e, habitId) => {
        e.stopPropagation();
        const h = habits.find(x => x.id === habitId);
        if (h?.completions[today] === 'done') {
            markDone(habitId, today);
            showToast('Habit unmarked', 'info');
        } else {
            markDone(habitId, today);
            showToast('Habit completed! 🎉', 'done');
        }
    };

    if (habits.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">No habits tracked yet</div>
                <div className="empty-desc">
                    Create your first habit and start building momentum. Even one habit a day can transform your life!
                </div>
                <button className="btn btn-primary" onClick={onAddHabit} id="empty-habits-btn">
                    ✨ Create First Habit
                </button>
            </div>
        );
    }

    return (
        <div className="habits-grid">
            {habits.map(habit => {
                const { current, longest } = computeStreak(habit.completions);
                const rate = computeCompletionRate(habit.completions, habit.createdAt);
                const todayStatus = habit.completions[today];
                const isDeleting = deleteConfirm === habit.id;

                return (
                    <div
                        key={habit.id}
                        className="habit-card"
                        style={{
                            '--habit-color': habit.color,
                            '--habit-color-alpha': `${habit.color}0D`,
                        }}
                        onClick={() => onViewHabit(habit.id)}
                    >
                        <div className="habit-card-header">
                            <div
                                className="habit-card-icon"
                                style={{ background: `${habit.color}18`, border: `2px solid ${habit.color}30` }}
                            >
                                {habit.icon}
                            </div>
                            <div className="habit-card-actions">
                                <button
                                    className="habit-card-action-btn"
                                    onClick={e => { e.stopPropagation(); onEditHabit(habit.id); }}
                                    title="Edit"
                                    id={`edit-btn-${habit.id}`}
                                >
                                    ✏️
                                </button>
                                <button
                                    className={`habit-card-action-btn delete${isDeleting ? '' : ''}`}
                                    onClick={e => { e.stopPropagation(); handleDelete(habit.id); }}
                                    title={isDeleting ? 'Click again to confirm' : 'Delete'}
                                    id={`delete-btn-${habit.id}`}
                                    style={isDeleting ? { background: 'var(--color-missed-soft)', borderColor: 'var(--color-missed)', color: 'var(--color-missed)' } : {}}
                                >
                                    {isDeleting ? '⚠️' : '🗑️'}
                                </button>
                            </div>
                        </div>

                        <div className="habit-card-name">{habit.icon} {habit.name}</div>
                        {habit.description && (
                            <div className="habit-card-desc">{habit.description}</div>
                        )}
                        {habit.reminder && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                                🔔 {habit.reminder}
                            </div>
                        )}

                        {isDeleting && (
                            <div className="delete-confirm-row" onClick={e => e.stopPropagation()}>
                                ⚠️ Click delete again to confirm
                            </div>
                        )}

                        <div className="habit-card-stats">
                            <div className="habit-stat">
                                <span className="habit-stat-value" style={{ color: current > 0 ? '#FF6B35' : undefined }}>
                                    {current > 0 ? '🔥' : ''}{current}
                                </span>
                                <span className="habit-stat-label">Current</span>
                            </div>
                            <div className="habit-stat">
                                <span className="habit-stat-value">{longest}</span>
                                <span className="habit-stat-label">Longest</span>
                            </div>
                            <div className="habit-stat">
                                <span className="habit-stat-value">{rate}%</span>
                                <span className="habit-stat-label">Rate</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${rate}%`, background: habit.color }}
                            />
                        </div>

                        {/* Mini dots */}
                        <MiniDots completions={habit.completions} createdAt={habit.createdAt} />

                        {/* Today quick action */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                marginTop: 12,
                                paddingTop: 12,
                                borderTop: '1px solid var(--border-color)',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                className={`action-btn done-btn${todayStatus === 'done' ? ' active' : ''}`}
                                style={{ flex: 1, width: 'auto', height: 34, borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 600 }}
                                onClick={(e) => handleDone(e, habit.id)}
                                id={`habit-done-${habit.id}`}
                            >
                                {todayStatus === 'done' ? '✓ Done' : '✓ Mark Done'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
