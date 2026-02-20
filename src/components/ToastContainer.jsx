import { useState, useEffect } from 'react';

let toastId = 0;
let addToastFn = null;

export const showToast = (message, type = 'info') => {
    addToastFn?.({ id: ++toastId, message, type });
};

export default function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        addToastFn = ({ id, message, type }) => {
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };
        return () => { addToastFn = null; };
    }, []);

    const icons = { done: '✅', missed: '😬', info: 'ℹ️', deleted: '🗑️', added: '✨', updated: '✏️' };

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type}`}>
                    <span>{icons[t.type] || '📌'}</span>
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    );
}
