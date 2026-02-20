import { useState, useEffect, useCallback, useRef } from 'react';
import { useHabits } from '../context/HabitContext';
import { HABIT_COLORS, HABIT_ICONS, DEFAULT_HABIT_COLOR, DEFAULT_HABIT_ICON } from '../utils/habitUtils';

export default function HabitModal({ habitId = null, onClose }) {
    const { addHabit, updateHabit, getHabit } = useHabits();
    const existing = habitId ? getHabit(habitId) : null;

    const [name, setName] = useState(existing?.name || '');
    const [description, setDescription] = useState(existing?.description || '');
    const [icon, setIcon] = useState(existing?.icon || DEFAULT_HABIT_ICON);
    const [color, setColor] = useState(existing?.color || DEFAULT_HABIT_COLOR);
    const [reminder, setReminder] = useState(existing?.reminder || null);
    const [reminderOn, setReminderOn] = useState(!!existing?.reminder);
    const [reminderTime, setReminderTime] = useState(existing?.reminder || '08:00');
    const [nameError, setNameError] = useState('');
    const nameRef = useRef(null);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const handleSubmit = useCallback(() => {
        if (!name.trim()) {
            setNameError('Habit name is required');
            nameRef.current?.focus();
            return;
        }
        const data = {
            name: name.trim(),
            description: description.trim(),
            icon,
            color,
            reminder: reminderOn ? reminderTime : null,
        };
        if (existing) {
            updateHabit(habitId, data);
        } else {
            addHabit(data);
        }
        onClose();
    }, [name, description, icon, color, reminderOn, reminderTime, existing, habitId, addHabit, updateHabit, onClose]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) handleSubmit();
        if (e.key === 'Escape') onClose();
    }, [handleSubmit, onClose]);

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal" onKeyDown={handleKeyDown}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {existing ? '✏️ Edit Habit' : '✨ New Habit'}
                    </h2>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="modal-body">
                    {/* Name */}
                    <div className="form-group">
                        <label className="form-label">Habit Name *</label>
                        <input
                            ref={nameRef}
                            className={`form-input${nameError ? ' error' : ''}`}
                            style={nameError ? { borderColor: 'var(--color-missed)' } : {}}
                            value={name}
                            onChange={e => { setName(e.target.value); setNameError(''); }}
                            placeholder="e.g. Morning run, Read 20 pages..."
                            maxLength={50}
                        />
                        {nameError && <span style={{ fontSize: '12px', color: 'var(--color-missed)' }}>{nameError}</span>}
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Why does this habit matter to you?"
                            maxLength={200}
                            rows={2}
                        />
                    </div>

                    {/* Icon */}
                    <div className="form-group">
                        <label className="form-label">Icon</label>
                        <div className="icon-picker">
                            {HABIT_ICONS.map(ic => (
                                <button
                                    key={ic}
                                    className={`icon-option${icon === ic ? ' selected' : ''}`}
                                    onClick={() => setIcon(ic)}
                                    title={ic}
                                    type="button"
                                >
                                    {ic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-picker">
                            {HABIT_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    className={`color-option${color === c.value ? ' selected' : ''}`}
                                    style={{
                                        background: c.value,
                                        '--color': c.value,
                                        borderColor: color === c.value ? 'white' : 'transparent',
                                        boxShadow: color === c.value ? `0 0 0 3px ${c.value}` : 'none',
                                    }}
                                    onClick={() => setColor(c.value)}
                                    title={c.name}
                                    type="button"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Reminder */}
                    <div className="form-group">
                        <label className="form-label">Daily Reminder</label>
                        <div className="reminder-row">
                            <button
                                className={`reminder-toggle${reminderOn ? ' on' : ''}`}
                                onClick={() => setReminderOn(v => !v)}
                                type="button"
                                aria-label="Toggle reminder"
                            />
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                {reminderOn ? 'Enabled' : 'Disabled'}
                            </span>
                            {reminderOn && (
                                <input
                                    type="time"
                                    className="form-input"
                                    style={{ width: 'auto', flex: 1 }}
                                    value={reminderTime}
                                    onChange={e => setReminderTime(e.target.value)}
                                />
                            )}
                        </div>
                        {reminderOn && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                🔔 UI reminder indicator only – browser notifications require additional setup
                            </span>
                        )}
                    </div>

                    {/* Preview */}
                    <div style={{
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: '1px solid var(--border-color)',
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 'var(--radius-md)',
                            background: `${color}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, border: `2px solid ${color}44`,
                        }}>
                            {icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {name || 'Habit name preview'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                {description || 'Your habit description'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>
                        {existing ? 'Save Changes' : '✨ Create Habit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
