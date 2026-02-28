import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';

const UserContext = createContext(null);

const USERS_KEY = 'habitflow_users';
const ACTIVE_USER_KEY = 'habitflow_active_user';

/** Read the saved users list */
const getUsers = () => {
    try {
        const stored = localStorage.getItem(USERS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/** Save the users list */
const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/** Create a unique user id */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Check if Firebase is properly configured */
const isFirebaseConfigured = () => {
    try {
        return auth && auth.app && auth.app.options.apiKey !== 'YOUR_API_KEY';
    } catch {
        return false;
    }
};

export const UserProvider = ({ children }) => {
    const [users, setUsers] = useState(getUsers);
    const [activeUser, setActiveUser] = useState(() => {
        const id = localStorage.getItem(ACTIVE_USER_KEY);
        if (id) {
            const u = getUsers().find(u => u.id === id);
            if (u) return u;
        }
        return null;
    });

    // Auth state
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [otpError, setOtpError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [useFirebase, setUseFirebase] = useState(isFirebaseConfigured());

    // Demo OTP fallback (when Firebase is not configured)
    const [demoOTP, setDemoOTP] = useState(null);

    /** Find user by phone number */
    const findUserByPhone = useCallback((phone) => {
        return getUsers().find(u => u.phone === phone);
    }, []);

    /** Clear reCAPTCHA completely - verifier AND replace the DOM node */
    const clearRecaptcha = useCallback(() => {
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch (e) { /* ignore */ }
            window.recaptchaVerifier = null;
        }
        // Replace the container with a fresh element — reCAPTCHA binds to the
        // actual DOM node, so innerHTML='' is not enough. We need a brand new node.
        const old = document.getElementById('recaptcha-container');
        if (old && old.parentNode) {
            const fresh = document.createElement('div');
            fresh.id = 'recaptcha-container';
            old.parentNode.replaceChild(fresh, old);
        }
    }, []);

    /** Set up visible reCAPTCHA verifier */
    const setupRecaptcha = useCallback(() => {
        if (!useFirebase) return null;

        // Always replace the DOM node before creating a new verifier
        clearRecaptcha();

        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'normal', // Changed to normal so the user can easily see and solve the challenge
                callback: (response) => {
                    // reCAPTCHA solved automatically, the sendOTP will use this.
                    console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                    clearRecaptcha();
                    setOtpError('reCAPTCHA expired. Please verify again.');
                }
            });
            return window.recaptchaVerifier;
        } catch (e) {
            console.error('reCAPTCHA setup error:', e);
            clearRecaptcha();
            return null;
        }
    }, [useFirebase, clearRecaptcha]);

    /** Send OTP via Firebase or fallback to demo */
    const sendOTP = useCallback(async (phoneNumber, countryCode = '+91') => {
        setOtpError('');
        setIsSending(true);

        // Format phone number with the selected country code
        let formattedPhone = phoneNumber;
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = countryCode + formattedPhone;
        }

        if (useFirebase) {
            try {
                const appVerifier = setupRecaptcha();
                if (!appVerifier) {
                    throw new Error('Could not initialize reCAPTCHA. Please refresh the page.');
                }
                const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
                setConfirmationResult(result);
                setIsSending(false);
                return { success: true, isFirebase: true };
            } catch (error) {
                console.error('Firebase OTP Error:', error);
                setIsSending(false);

                // Reset reCAPTCHA on error
                clearRecaptcha();

                // Always show the raw error code so user can see what's happening
                const code = error.code || 'unknown';
                if (code === 'auth/invalid-phone-number') {
                    setOtpError('❌ Invalid phone number. Please check the number.');
                } else if (code === 'auth/too-many-requests') {
                    setOtpError('⏳ Rate limited: Too many attempts. Wait 1–2 hours before trying this number again.');
                } else if (code === 'auth/quota-exceeded') {
                    setOtpError('❌ SMS quota exceeded for today. Try tomorrow.');
                } else if (code === 'auth/invalid-app-credential') {
                    setOtpError('❌ App credential error: Make sure localhost/127.0.0.1 is in Firebase Authorized Domains.');
                } else if (code === 'auth/billing-not-enabled') {
                    setOtpError('❌ Firebase billing not enabled. Upgrade to Blaze plan.');
                } else if (code?.includes('api-key')) {
                    setUseFirebase(false);
                    return sendDemoOTP(phoneNumber);
                } else {
                    setOtpError(`❌ Error (${code}): ${error.message}`);
                }
                return { success: false };
            }
        } else {
            return sendDemoOTP(phoneNumber);
        }
    }, [useFirebase, setupRecaptcha, clearRecaptcha]);

    /** Fallback demo OTP when Firebase is not configured */
    const sendDemoOTP = useCallback((phoneNumber) => {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        setDemoOTP(otp);
        setConfirmationResult(null);
        setIsSending(false);
        console.log(`[HabitFlow Demo] OTP for ${phoneNumber}: ${otp}`);
        return { success: true, isFirebase: false, otp };
    }, []);

    /** Verify OTP */
    const verifyOTP = useCallback(async (inputOtp) => {
        setOtpError('');

        if (useFirebase && confirmationResult) {
            // Firebase verification
            try {
                await confirmationResult.confirm(inputOtp);
                return true;
            } catch (error) {
                console.error('OTP Verification Error:', error);
                if (error.code === 'auth/invalid-verification-code') {
                    setOtpError('Invalid OTP. Please check and try again.');
                } else if (error.code === 'auth/code-expired') {
                    setOtpError('OTP has expired. Please request a new one.');
                } else {
                    setOtpError('Verification failed. Please try again.');
                }
                return false;
            }
        } else if (demoOTP) {
            // Demo mode verification
            if (inputOtp === demoOTP) {
                return true;
            } else {
                setOtpError('Invalid OTP. Please try again.');
                return false;
            }
        } else {
            setOtpError('No OTP was sent. Please request a new one.');
            return false;
        }
    }, [useFirebase, confirmationResult, demoOTP]);

    /** Create a new user after OTP verification */
    const createUser = useCallback((name, avatar, phone) => {
        const user = {
            id: uid(),
            name: name.trim(),
            avatar: avatar || '👤',
            phone: phone,
            createdAt: new Date().toISOString(),
        };
        const updated = [...getUsers(), user];
        saveUsers(updated);
        setUsers(updated);
        localStorage.setItem(ACTIVE_USER_KEY, user.id);
        setActiveUser(user);
        setConfirmationResult(null);
        setDemoOTP(null);
        return user;
    }, []);

    /** Log in as an existing user */
    const loginUser = useCallback((userId) => {
        const user = getUsers().find(u => u.id === userId);
        if (user) {
            localStorage.setItem(ACTIVE_USER_KEY, user.id);
            setActiveUser(user);
            setConfirmationResult(null);
            setDemoOTP(null);
        }
    }, []);

    /** Log out */
    const logoutUser = useCallback(() => {
        localStorage.removeItem(ACTIVE_USER_KEY);
        setActiveUser(null);
        setConfirmationResult(null);
        setDemoOTP(null);
        setOtpError('');
    }, []);

    /** Delete a user profile and all their data */
    const deleteUser = useCallback((userId) => {
        localStorage.removeItem(`habitflow_habits_${userId}`);
        localStorage.removeItem(`habitflow_theme_${userId}`);
        const updated = getUsers().filter(u => u.id !== userId);
        saveUsers(updated);
        setUsers(updated);
        if (activeUser?.id === userId) {
            localStorage.removeItem(ACTIVE_USER_KEY);
            setActiveUser(null);
        }
    }, [activeUser]);

    return (
        <UserContext.Provider value={{
            users,
            activeUser,
            createUser,
            loginUser,
            logoutUser,
            deleteUser,
            findUserByPhone,
            sendOTP,
            verifyOTP,
            otpError,
            setOtpError,
            isSending,
            useFirebase,
            demoOTP,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used within UserProvider');
    return ctx;
};
