import { useState, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { getTodayKey, getDaysInMonth, getFirstDayOfMonth, formatDateKey, MONTHS, DAYS_OF_WEEK } from '../utils/dateUtils';
import { computeStreak, computeCompletionRate } from '../utils/habitUtils';
import { showToast } from './ToastContainer';

/* ─────────────────────────────────────────────
   Month Grid (full-size interactive)
───────────────────────────────────────────── */
function MonthGrid({ habit, year, month, onToggle }) {
    const today = getTodayKey();
    const numDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = Array(firstDay).fill(null);
    for (let d = 1; d <= numDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="full-month-grid">
            <div className="full-month-day-labels">
                {DAYS_OF_WEEK.map(d => <div key={d} className="full-month-day-label">{d}</div>)}
            </div>
            <div className="full-month-days">
                {cells.map((day, i) => {
                    if (!day) return <div key={`e${i}`} className="full-day-cell empty" />;
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isFuture = dateKey > today;
                    const isToday = dateKey === today;
                    const isBefore = habit ? dateKey >= habit.createdAt : true;
                    const status = habit?.completions[dateKey];

                    let cls = 'full-day-cell';
                    if (!isBefore || isFuture) cls += isFuture ? ' future' : ' future';
                    else if (status === 'done') cls += ' done';
                    else if (status === 'missed') cls += ' missed';
                    else cls += ' pending';
                    if (isToday) cls += ' today';

                    return (
                        <div
                            key={dateKey}
                            className={cls}
                            onClick={() => !isFuture && isBefore && onToggle(dateKey, status)}
                            title={`${MONTHS[month]} ${day}${status ? ` – ${status}` : ''}`}
                            style={status === 'done' && habit ? { background: habit.color, boxShadow: `0 2px 8px ${habit.color}66` } : {}}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Mini year-overview strip per habit
───────────────────────────────────────────── */
function YearStrip({ habit, year }) {
    const today = getTodayKey();
    return (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap', overflowX: 'auto' }}>
            {Array.from({ length: 12 }, (_, m) => {
                const numDays = getDaysInMonth(year, m);
                return (
                    <div key={m} style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                            {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][m]}
                        </div>
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
                                <div key={key} style={{ width: 8, height: 8, borderRadius: 2, background: bg, opacity: isFuture ? 0.15 : 1 }} title={key} />
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main Calendar View
───────────────────────────────────────────── */
export default function CalendarView() {
    const { habits, toggleCompletion } = useHabits();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [activeHabitId, setActiveHabitId] = useState(() => habits[0]?.id || null);
    const [calMode, setCalMode] = useState('month'); // 'month' | 'year'

    const activeHabit = useMemo(() => habits.find(h => h.id === activeHabitId), [habits, activeHabitId]);

    const handleToggle = (dateKey, currentStatus) => {
        if (!activeHabitId) return;
        if (currentStatus === 'done') {
            toggleCompletion(activeHabitId, dateKey, 'done'); // -> missed (toggle off done = set missed)
            showToast('Marked as missed', 'missed');
        } else if (currentStatus === 'missed') {
            toggleCompletion(activeHabitId, dateKey, 'missed'); // -> cleared
            showToast('Status cleared', 'info');
        } else {
            toggleCompletion(activeHabitId, dateKey, 'done'); // -> done
            showToast('Marked as done! ✅', 'done');
        }
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    /* Monthly stats chip row */
    const monthStats = useMemo(() => {
        if (!activeHabit) return { done: 0, missed: 0, pending: 0 };
        const today = getTodayKey();
        const numDays = getDaysInMonth(year, viewMonth);
        let done = 0, missed = 0, pending = 0;
        for (let d = 1; d <= numDays; d++) {
            const key = `${year}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (key > today || key < activeHabit.createdAt) { pending++; continue; }
            const s = activeHabit.completions[key];
            if (s === 'done') done++;
            else if (s === 'missed') missed++;
            else pending++;
        }
        return { done, missed, pending };
    }, [activeHabit, year, viewMonth]);

    const completionPct = useMemo(() => {
        const tracked = monthStats.done + monthStats.missed;
        return tracked === 0 ? 0 : Math.round((monthStats.done / tracked) * 100);
    }, [monthStats]);

    if (habits.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📅</div>
                <div className="empty-title">No habits yet</div>
                <div className="empty-desc">Add habits first to see your calendar view.</div>
            </div>
        );
    }

    return (
        <div>
            {/* ── Habit Tabs ── */}
            <div className="habit-tabs">
                {habits.map(h => (
                    <button
                        key={h.id}
                        className={`habit-tab${activeHabitId === h.id ? ' active' : ''}`}
                        style={activeHabitId === h.id ? { borderColor: h.color, color: h.color, background: `${h.color}15` } : {}}
                        onClick={() => setActiveHabitId(h.id)}
                        id={`tab-habit-${h.id}`}
                    >
                        <span>{h.icon}</span>
                        <span>{h.name}</span>
                    </button>
                ))}
            </div>

            {/* ── Top bar: mode toggle + nav ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Mode toggle */}
                    <div style={{
                        display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-full)', padding: 3, gap: 4,
                    }}>
                        {[{ id: 'month', label: '📅 Month' }, { id: 'year', label: '📆 Year' }].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setCalMode(m.id)}
                                style={{
                                    padding: '5px 14px', borderRadius: 'var(--radius-full)', border: 'none',
                                    background: calMode === m.id ? 'var(--accent)' : 'transparent',
                                    color: calMode === m.id ? 'white' : 'var(--text-secondary)',
                                    fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                                }}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Month nav (only in month mode) */}
                    {calMode === 'month' && (
                        <div className="month-selector">
                            <button className="month-selector-btn" onClick={prevMonth} id="cal-prev-month">‹</button>
                            <span className="month-selector-label">{MONTHS[viewMonth]} {year}</span>
                            <button className="month-selector-btn" onClick={nextMonth} id="cal-next-month">›</button>
                        </div>
                    )}

                    {/* Year nav (only in year mode) */}
                    {calMode === 'year' && (
                        <div className="month-selector">
                            <button className="month-selector-btn" onClick={() => setYear(y => y - 1)}>‹</button>
                            <span className="month-selector-label" style={{ minWidth: 80 }}>{year}</span>
                            <button className="month-selector-btn" onClick={() => setYear(y => y + 1)}>›</button>
                        </div>
                    )}
                </div>

                {/* Stats badges */}
                {calMode === 'month' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="chip" style={{ color: 'var(--color-done)', background: 'var(--color-done-soft)', borderColor: 'rgba(32,201,151,0.2)' }}>
                            ✓ {monthStats.done} done
                        </span>
                        <span className="chip" style={{ color: 'var(--color-missed)', background: 'var(--color-missed-soft)', borderColor: 'rgba(255,107,107,0.2)' }}>
                            ✕ {monthStats.missed} missed
                        </span>
                        <span className="chip">📈 {completionPct}%</span>
                    </div>
                )}
            </div>

            {/* ── Legend ── */}
            {calMode === 'month' && (
                <>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Done', color: activeHabit?.color || 'var(--color-done)' },
                            { label: 'Missed', color: 'var(--color-missed)' },
                            { label: 'Pending', color: 'var(--color-pending)' },
                            { label: 'Future / N/A', color: 'transparent', border: '1px solid var(--border-color)' },
                        ].map(({ label, color, border }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: border || 'none', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                        Click a day to cycle: pending → done → missed → clear
                    </p>

                    <MonthGrid habit={activeHabit} year={year} month={viewMonth} onToggle={handleToggle} />
                </>
            )}

            {/* ── Year View ── */}
            {calMode === 'year' && activeHabit && (
                <div>
                    {/* Habit summary */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)', padding: '14px 18px',
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 'var(--radius-md)',
                            background: `${activeHabit.color}20`, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 22, border: `2px solid ${activeHabit.color}30`,
                        }}>
                            {activeHabit.icon}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{activeHabit.name}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Year-at-a-glance view for {year}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            <span className="chip" style={{ color: 'var(--color-done)', background: 'var(--color-done-soft)' }}>
                                ✓ {Object.values(activeHabit.completions).filter(v => v === 'done').length} total done
                            </span>
                        </div>
                    </div>

                    {/* 12-month grid */}
                    <div className="year-grid">
                        {Array.from({ length: 12 }, (_, m) => {
                            const numDays = getDaysInMonth(year, m);
                            const firstDay = getFirstDayOfMonth(year, m);
                            const cells = Array(firstDay).fill(null);
                            for (let d = 1; d <= numDays; d++) cells.push(d);
                            while (cells.length % 7 !== 0) cells.push(null);

                            const today = getTodayKey();
                            let done = 0;
                            for (let d = 1; d <= numDays; d++) {
                                const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                if (activeHabit.completions[key] === 'done') done++;
                            }
                            const pct = Math.round((done / numDays) * 100);

                            return (
                                <div key={m} className="month-card" onClick={() => { setCalMode('month'); setViewMonth(m); setYear(year); }} style={{ cursor: 'pointer' }}>
                                    <div className="month-title">
                                        {MONTHS[m].slice(0, 3).toUpperCase()}
                                        <span className="month-completion" style={{ color: done > 0 ? activeHabit.color : undefined }}>
                                            {done > 0 ? `${pct}%` : '—'}
                                        </span>
                                    </div>
                                    <div className="month-day-labels">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => (
                                            <div key={i} className="month-day-label">{l}</div>
                                        ))}
                                    </div>
                                    <div className="month-days-grid">
                                        {cells.map((day, i) => {
                                            if (!day) return <div key={i} className="day-cell empty" />;
                                            const dateKey = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            const isFuture = dateKey > today;
                                            const isBefore = dateKey >= activeHabit.createdAt;
                                            const status = activeHabit.completions[dateKey];
                                            const isToday = dateKey === today;

                                            let cls = 'day-cell';
                                            if (!isBefore || isFuture) cls += ' future';
                                            else if (status === 'done') cls += ' done';
                                            else if (status === 'missed') cls += ' missed';
                                            else cls += ' pending';
                                            if (isToday) cls += ' today';

                                            return (
                                                <div
                                                    key={dateKey}
                                                    className={cls}
                                                    style={status === 'done' ? { background: activeHabit.color } : {}}
                                                    title={`${MONTHS[m]} ${day}`}
                                                >
                                                    {day}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
