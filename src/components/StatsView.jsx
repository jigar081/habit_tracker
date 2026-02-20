import { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { computeStreak, computeCompletionRate } from '../utils/habitUtils';
import { getTodayKey, getDaysInMonth, MONTHS, MONTHS_SHORT } from '../utils/dateUtils';

/* ─── Stat Chip ─── */
function StatChip({ icon, value, label, color }) {
    return (
        <div className="detail-stat-chip">
            <div style={{ fontSize: 20 }}>{icon}</div>
            <div className="detail-stat-value" style={{ color }}>{value}</div>
            <div className="detail-stat-label">{label}</div>
        </div>
    );
}

/* ─── Monthly Progress Grid (12 pills) ─── */
function MonthPillGrid({ habit }) {
    const today = getTodayKey();
    const year = new Date().getFullYear();
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {Array.from({ length: 12 }, (_, m) => {
                const numDays = getDaysInMonth(year, m);
                let done = 0, total = 0;
                for (let d = 1; d <= numDays; d++) {
                    const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (key > today || key < habit.createdAt) continue;
                    total++;
                    if (habit.completions[key] === 'done') done++;
                }
                const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                const isCurrentMonth = m === new Date().getMonth();
                return (
                    <div key={m} style={{
                        background: isCurrentMonth ? `${habit.color}0D` : 'var(--bg-glass)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        border: `1px solid ${isCurrentMonth ? `${habit.color}30` : 'var(--border-color)'}`,
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: isCurrentMonth ? habit.color : 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>
                            {MONTHS_SHORT[m]}
                        </div>
                        <div style={{ height: 4, background: 'var(--color-pending)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: habit.color, borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease' }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: pct > 0 ? habit.color : 'var(--text-muted)' }}>{pct}%</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{done}/{total}</div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Year Heatmap (column = month, row = day) ─── */
function YearHeatmap({ habit, year }) {
    const today = getTodayKey();
    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 500 }}>
                {Array.from({ length: 12 }, (_, m) => {
                    const numDays = getDaysInMonth(year, m);
                    return (
                        <div key={m} style={{ flex: 1, minWidth: 32 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 5, textAlign: 'center' }}>
                                {MONTHS_SHORT[m].charAt(0)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {Array.from({ length: numDays }, (_, d) => {
                                    const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
                                    const s = habit.completions[key];
                                    const isFuture = key > today;
                                    const isBefore = key >= habit.createdAt;
                                    let bg = 'var(--color-pending)';
                                    if (isFuture || !isBefore) bg = 'transparent';
                                    else if (s === 'done') bg = habit.color;
                                    else if (s === 'missed') bg = 'var(--color-missed)';
                                    return (
                                        <div
                                            key={key}
                                            style={{ width: '100%', height: 8, borderRadius: 2, background: bg, opacity: isFuture ? 0.15 : 1 }}
                                            title={key}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Main Stats View ─── */
export default function StatsView() {
    const { habits } = useHabits();
    const today = getTodayKey();
    const year = new Date().getFullYear();

    const globalStats = useMemo(() => {
        if (!habits.length) return null;
        const totalDone = habits.reduce((a, h) => a + Object.values(h.completions).filter(v => v === 'done').length, 0);
        const topStreak = Math.max(...habits.map(h => computeStreak(h.completions).longest));
        const todayDone = habits.filter(h => h.completions[today] === 'done').length;
        const overallRate = Math.round(habits.map(h => computeCompletionRate(h.completions, h.createdAt)).reduce((a, b) => a + b, 0) / habits.length);
        return { totalDone, topStreak, todayDone, overallRate };
    }, [habits, today]);

    if (!habits.length) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📊</div>
                <div className="empty-title">No stats yet</div>
                <div className="empty-desc">Add habits and start tracking to see beautiful statistics here.</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Global Overview */}
            <div>
                <div className="section-title" style={{ marginBottom: 16 }}>🌟 Overall Performance</div>
                <div className="detail-stats-row">
                    <StatChip icon="✅" value={globalStats.totalDone} label="Total Completions" color="var(--color-done)" />
                    <StatChip icon="🔥" value={globalStats.topStreak} label="All-time Streak" color="#FF6B35" />
                    <StatChip icon="📈" value={`${globalStats.overallRate}%`} label="Avg Completion" color="var(--accent)" />
                    <StatChip icon="🎯" value={`${globalStats.todayDone}/${habits.length}`} label="Done Today" color="var(--color-done)" />
                </div>
            </div>

            {/* Per-habit breakdown */}
            {habits.map(habit => {
                const { current, longest } = computeStreak(habit.completions);
                const rate = computeCompletionRate(habit.completions, habit.createdAt);
                const totalDone = Object.values(habit.completions).filter(v => v === 'done').length;

                return (
                    <div key={habit.id} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Subtle accent bar */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                            background: `linear-gradient(90deg, ${habit.color}, ${habit.color}55)`,
                        }} />

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
                                background: `${habit.color}18`, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 24, border: `2px solid ${habit.color}30`,
                            }}>
                                {habit.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{habit.name}</div>
                                {habit.description && (
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{habit.description}</div>
                                )}
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    📅 Since {new Date(habit.createdAt + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                {current >= 7 ? <span className="streak-badge hot">🔥 {current}d streak</span>
                                    : current >= 3 ? <span className="streak-badge warm">⚡ {current}d streak</span>
                                        : current > 0 ? <span className="streak-badge cool">✨ {current}d streak</span>
                                            : null}
                            </div>
                        </div>

                        {/* Mini stat row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                            {[
                                { icon: '🔥', val: current, label: 'Current', color: '#FF6B35' },
                                { icon: '🏆', val: longest, label: 'Longest', color: '#FFC107' },
                                { icon: '✅', val: totalDone, label: 'Done', color: 'var(--color-done)' },
                                { icon: '📈', val: `${rate}%`, label: 'Rate', color: habit.color },
                            ].map(s => (
                                <div key={s.label} style={{
                                    background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
                                    padding: '10px 12px', border: '1px solid var(--border-color)', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.icon} {s.val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Completion</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: habit.color }}>{rate}%</span>
                            </div>
                            <div className="progress-bar-container" style={{ height: 8 }}>
                                <div className="progress-bar-fill" style={{ width: `${rate}%`, background: `linear-gradient(90deg, ${habit.color}, ${habit.color}99)` }} />
                            </div>
                        </div>

                        {/* Monthly progress */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Monthly Progress {year}
                            </div>
                            <MonthPillGrid habit={habit} />
                        </div>

                        {/* Year heatmap */}
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Year at a Glance
                            </div>
                            <div style={{
                                background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '14px 12px', border: '1px solid var(--border-color)',
                            }}>
                                <YearHeatmap habit={habit} year={year} />
                                <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'Done', color: habit.color },
                                        { label: 'Missed', color: 'var(--color-missed)' },
                                        { label: 'Pending', color: 'var(--color-pending)' },
                                    ].map(({ label, color }) => (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
