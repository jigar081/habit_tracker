import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createHabit } from '../utils/habitUtils';

const HabitContext = createContext(null);

const STORAGE_KEY = 'habitflow_habits';
const THEME_KEY = 'habitflow_theme';

export const HabitProvider = ({ children }) => {
    const [habits, setHabits] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem(THEME_KEY) || 'dark';
    });

    const [activeView, setActiveView] = useState('dashboard');
    const [selectedHabitId, setSelectedHabitId] = useState(null);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
        } catch (e) {
            console.error('Failed to save habits:', e);
        }
    }, [habits]);

    useEffect(() => {
        localStorage.setItem(THEME_KEY, theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

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
