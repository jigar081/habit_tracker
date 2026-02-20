import { getTodayKey, formatDateKey } from '../utils/dateUtils';

export const HABIT_COLORS = [
    { name: 'Violet', value: '#6C63FF' },
    { name: 'Coral', value: '#FF6B6B' },
    { name: 'Teal', value: '#20C997' },
    { name: 'Amber', value: '#FFC107' },
    { name: 'Sky', value: '#38BDF8' },
    { name: 'Rose', value: '#F472B6' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Orange', value: '#FB923C' },
];

export const HABIT_ICONS = [
    '🏃', '💧', '📚', '🧘', '💪', '🥗', '😴', '✍️',
    '🎯', '🎨', '🎵', '🧠', '💊', '🚴', '🌿', '⭐',
];

export const DEFAULT_HABIT_COLOR = '#6C63FF';
export const DEFAULT_HABIT_ICON = '⭐';

export const createHabit = ({ name, icon = DEFAULT_HABIT_ICON, color = DEFAULT_HABIT_COLOR, description = '', reminder = null }) => ({
    id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    icon,
    color,
    description,
    reminder,
    createdAt: getTodayKey(),
    completions: {}, // dateKey -> 'done' | 'missed'
});

export const computeStreak = (completions) => {
    let current = 0;
    let longest = 0;
    let temp = 0;

    const today = new Date();
    const sortedKeys = Object.entries(completions)
        .filter(([, v]) => v === 'done')
        .map(([k]) => k)
        .sort();

    if (sortedKeys.length === 0) return { current: 0, longest: 0 };

    // compute longest streak
    for (let i = 0; i < sortedKeys.length; i++) {
        if (i === 0) {
            temp = 1;
        } else {
            const prev = new Date(sortedKeys[i - 1]);
            const curr = new Date(sortedKeys[i]);
            const diff = (curr - prev) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                temp++;
            } else {
                temp = 1;
            }
        }
        longest = Math.max(longest, temp);
    }

    // compute current streak (backwards from today)
    let checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);
    current = 0;

    while (true) {
        const key = formatDateKey(checkDate);
        if (completions[key] === 'done') {
            current++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (completions[key] === 'missed') {
            break;
        } else {
            // pending - if it's today, check yesterday
            if (key === getTodayKey()) {
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    }

    return { current, longest };
};

export const computeCompletionRate = (completions, createdAt) => {
    const today = getTodayKey();
    const start = new Date(createdAt);
    const end = new Date(today);
    let total = 0;
    let done = 0;

    const cursor = new Date(start);
    while (cursor <= end) {
        const key = formatDateKey(cursor);
        total++;
        if (completions[key] === 'done') done++;
        cursor.setDate(cursor.getDate() + 1);
    }

    return total === 0 ? 0 : Math.round((done / total) * 100);
};

export const computeMonthlyStats = (completions, year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let done = 0, missed = 0, pending = 0;

    for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const today = getTodayKey();
        if (key > today) {
            pending++;
        } else if (completions[key] === 'done') {
            done++;
        } else if (completions[key] === 'missed') {
            missed++;
        } else {
            missed++;
        }
    }

    return { done, missed, pending, total: daysInMonth };
};
