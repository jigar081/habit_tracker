export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getTodayKey = () => formatDateKey(new Date());

export const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

export const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

export const generateYearDays = (year) => {
    const days = [];
    for (let month = 0; month < 12; month++) {
        const numDays = getDaysInMonth(year, month);
        for (let day = 1; day <= numDays; day++) {
            days.push(formatDateKey(new Date(year, month, day)));
        }
    }
    return days;
};

export const isPastDate = (dateKey) => {
    const today = getTodayKey();
    return dateKey < today;
};

export const isTodayDate = (dateKey) => {
    return dateKey === getTodayKey();
};

export const isFutureDate = (dateKey) => {
    return dateKey > getTodayKey();
};

export const getWeekDates = (referenceDate = new Date()) => {
    const startOfWeek = new Date(referenceDate);
    startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        week.push(formatDateKey(d));
    }
    return week;
};

export const formatDisplayDate = (dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const getDaysBetween = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
};

export const getMonthDays = (year, month) => {
    const days = [];
    const numDays = getDaysInMonth(year, month);
    for (let day = 1; day <= numDays; day++) {
        days.push(formatDateKey(new Date(year, month, day)));
    }
    return days;
};
