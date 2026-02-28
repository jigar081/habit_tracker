import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createHabit } from '../utils/habitUtils';
import { useUser } from './UserContext';

const HabitContext = createContext(null);

export const HabitProvider = ({ children }) => {
    const { activeUser } = useUser();

    // Per-user storage keys
    const storageKey = activeUser ? `habitflow_habits_${activeUser.id}` : null;
    const themeKey = activeUser ? `habitflow_theme_${activeUser.id}` : 'habitflow_theme';

    const [habits, setHabits] = useState(() => {
        if (!storageKey) return [];
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Clean up entries older than 5 years
                const fiveYearsAgo = new Date();
                fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
                const cutoff = fiveYearsAgo.toISOString().split('T')[0];
                return parsed.map(h => {
                    const completions = { ...h.completions };
                    Object.keys(completions).forEach(dateKey => {
                        if (dateKey < cutoff) delete completions[dateKey];
                    });
                    return { ...h, completions };
                });
            }
            return [];
        } catch {
            return [];
        }
    });

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem(themeKey) || 'dark';
    });

    const [activeView, setActiveView] = useState('dashboard');
    const [selectedHabitId, setSelectedHabitId] = useState(null);

    // Reload habits when user changes
    useEffect(() => {
        if (!storageKey) {
            setHabits([]);
            return;
        }
        try {
            const stored = localStorage.getItem(storageKey);
            setHabits(stored ? JSON.parse(stored) : []);
        } catch {
            setHabits([]);
        }
        // Reset view when switching users
        setActiveView('dashboard');
        setSelectedHabitId(null);
    }, [storageKey]);

    // Reload theme when user changes
    useEffect(() => {
        const savedTheme = localStorage.getItem(themeKey) || 'dark';
        setTheme(savedTheme);
    }, [themeKey]);

    // Save habits whenever they change
    useEffect(() => {
        if (!storageKey) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(habits));
        } catch (e) {
            console.error('Failed to save habits:', e);
        }
    }, [habits, storageKey]);

    // Save and apply theme
    useEffect(() => {
        localStorage.setItem(themeKey, theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme, themeKey]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const addHabit = useCallback((habitData) => {
        const habit = createHabit(habitData);
        setHabits(prev => [...prev, habit]);
        return habit.id;
    }, []);

    const updateHabit = useCallback((id, updates) => {
        setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    }, []);

    const deleteHabit = useCallback((id) => {
        setHabits(prev => prev.filter(h => h.id !== id));
    }, []);

    const toggleCompletion = useCallback((habitId, dateKey, status) => {
        setHabits(prev => prev.map(h => {
            if (h.id !== habitId) return h;
            const completions = { ...h.completions };
            if (completions[dateKey] === status) {
                delete completions[dateKey];
            } else {
                completions[dateKey] = status;
            }
            return { ...h, completions };
        }));
    }, []);

    const markDone = useCallback((habitId, dateKey) => {
        toggleCompletion(habitId, dateKey, 'done');
    }, [toggleCompletion]);

    const markMissed = useCallback((habitId, dateKey) => {
        toggleCompletion(habitId, dateKey, 'missed');
    }, [toggleCompletion]);

    const getHabit = useCallback((id) => habits.find(h => h.id === id), [habits]);

    const selectedHabit = selectedHabitId ? getHabit(selectedHabitId) : null;

    return (
        <HabitContext.Provider value={{
            habits,
            theme,
            toggleTheme,
            addHabit,
            updateHabit,
            deleteHabit,
            markDone,
            markMissed,
            toggleCompletion,
            getHabit,
            activeView,
            setActiveView,
            selectedHabitId,
            setSelectedHabitId,
            selectedHabit,
        }}>
            {children}
        </HabitContext.Provider>
    );
};

export const useHabits = () => {
    const ctx = useContext(HabitContext);
    if (!ctx) throw new Error('useHabits must be used within HabitProvider');
    return ctx;
};
