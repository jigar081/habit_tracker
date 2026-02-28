import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';

const AVATARS = ['👤', '🧑‍💻', '👩‍💼', '🧑‍🎓', '👨‍🚀', '🦸', '🧑‍🏫', '🧑‍🔬', '🦊', '🐱', '🦁', '🐸', '🌟', '🔥', '💎', '🎯'];

const COUNTRY_CODES = [
    { code: '+91', label: 'IN', name: 'India' },
    { code: '+1', label: 'US', name: 'United States' },
    { code: '+44', label: 'GB', name: 'United Kingdom' },
    { code: '+61', label: 'AU', name: 'Australia' },
    { code: '+81', label: 'JP', name: 'Japan' },
    { code: '+86', label: 'CN', name: 'China' },
    { code: '+49', label: 'DE', name: 'Germany' },
    { code: '+33', label: 'FR', name: 'France' },
    { code: '+971', label: 'AE', name: 'UAE' },
    { code: '+65', label: 'SG', name: 'Singapore' },
];

// Steps: 'phone' → 'otp' → 'profile' (new users only)
export default function LoginScreen() {
    const {
        createUser, loginUser, findUserByPhone,
        sendOTP, verifyOTP, otpError, setOtpError,
        isSending, useFirebase, demoOTP,
    } = useUser();

    const [step, setStep] = useState('phone');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState('👤');
    const [generatedOTP, setGeneratedOTP] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const otpInputRefs = useRef([]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    /** Handle phone input */
    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/[^\d]/g, '');
        if (val.length <= 10) setPhone(val);
    };

    /** Send OTP */
    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (phone.length < 10) return;

        const result = await sendOTP(phone, countryCode);

        if (result.success) {
            if (!result.isFirebase && result.otp) {
                setGeneratedOTP(result.otp);
            } else {
                setGeneratedOTP('');
            }
            setOtp(['', '', '', '', '', '']);
            setStep('otp');
            setResendCooldown(30);
            setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        }
    };

    /** Handle OTP digit input */
    const handleOtpDigit = (index, value) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpError('');

        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }

        // Auto-verify when all 6 digits entered
        if (value && index === 5) {
            const fullOtp = newOtp.join('');
            if (fullOtp.length === 6) {
                setTimeout(() => verifyAndProceed(fullOtp), 200);
            }
        }
    };

    /** Handle backspace */
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    /** Handle paste */
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const digits = pasted.split('');
            setOtp(digits);
            otpInputRefs.current[5]?.focus();
            setTimeout(() => verifyAndProceed(pasted), 200);
        }
    };

    /** Verify OTP and proceed */
    const verifyAndProceed = async (otpString) => {
        setIsVerifying(true);
        const valid = await verifyOTP(otpString);
        setIsVerifying(false);

        if (!valid) return;

        const existingUser = findUserByPhone(phone);
        if (existingUser) {
            loginUser(existingUser.id);
        } else {
            setStep('profile');
        }
    };

    /** Create profile */
    const handleCreateProfile = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        createUser(name.trim(), avatar, phone);
    };

    /** Resend OTP */
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        const result = await sendOTP(phone, countryCode);
        if (result.success) {
            if (!result.isFirebase && result.otp) {
                setGeneratedOTP(result.otp);
            }
            setOtp(['', '', '', '', '', '']);
            setResendCooldown(30);
            otpInputRefs.current[0]?.focus();
        }
    };

    const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

    return (
        <div className="login-screen">
            <div className="login-container">
                {/* Logo Header */}
                <div className="login-header">
                    <div className="login-logo">
                        <div className="login-logo-icon">🔥</div>
                        <h1 className="login-logo-text">HabitFlow</h1>
                    </div>
                    <p className="login-subtitle">Build habits. Track progress. Stay consistent.</p>
                </div>

                {/* ───── Step 1: Phone Number ───── */}
                {step === 'phone' && (
                    <form className="login-form" onSubmit={handleSendOTP}>
                        <h2 className="login-section-title">Sign in with Phone</h2>
                        <p className="login-desc">
                            Enter your phone number to get started.
                            {useFirebase
                                ? " We'll send you a real SMS verification code."
                                : " (Demo mode — OTP will be shown on screen)"}
                        </p>

                        <div className="login-field">
                            <label className="login-label" htmlFor="phone-input">Phone Number</label>
                            <div className="phone-input-wrapper">
                                {/* Country code picker */}
                                <button
                                    type="button"
                                    className="country-code-btn"
                                    onClick={() => setShowCountryPicker(v => !v)}
                                    id="country-code-btn"
                                >
                                    <span className="country-label">{selectedCountry.label}</span>
                                    <span className="country-code-text">{selectedCountry.code}</span>
                                    <span className="country-code-arrow">▾</span>
                                </button>

                                {showCountryPicker && (
                                    <>
                                        <div className="country-picker-overlay" onClick={() => setShowCountryPicker(false)} />
                                        <div className="country-picker-dropdown" id="country-picker">
                                            {COUNTRY_CODES.map(c => (
                                                <button
                                                    key={c.code}
                                                    type="button"
                                                    className={`country-picker-item${c.code === countryCode ? ' active' : ''}`}
                                                    onClick={() => { setCountryCode(c.code); setShowCountryPicker(false); }}
                                                >
                                                    <span className="country-label">{c.label}</span>
                                                    <span>{c.name}</span>
                                                    <span className="country-picker-code">{c.code}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <input
                                    id="phone-input"
                                    type="tel"
                                    className="login-input phone-input"
                                    placeholder="Enter your phone number"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    autoFocus
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        {/* Visible reCAPTCHA container */}
                        {useFirebase && (
                            <div id="recaptcha-container" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}></div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary login-submit"
                            disabled={phone.length < 10 || isSending}
                            id="send-otp-btn"
                        >
                            {isSending ? (
                                <span className="btn-loading">
                                    <span className="spinner" /> Sending...
                                </span>
                            ) : (
                                '📩 Send Verification Code'
                            )}
                        </button>

                        {otpError && <div className="otp-error">{otpError}</div>}

                        <div className="login-secure-note">
                            🔒 Your data is private and secured on this device
                        </div>



                    </form>
                )}

                {/* ───── Step 2: OTP Verification ───── */}
                {step === 'otp' && (
                    <div className="login-form">
                        <h2 className="login-section-title">Verify Your Number</h2>
                        <p className="login-desc">
                            Enter the 6-digit code {useFirebase ? 'sent' : 'shown below'} for <strong>{countryCode} {phone}</strong>
                        </p>

                        {/* Demo OTP banner (only when Firebase is NOT configured) */}
                        {!useFirebase && generatedOTP && (
                            <div className="otp-demo-banner" id="otp-demo-banner">
                                <span className="otp-demo-label">🔑 Your OTP:</span>
                                <span className="otp-demo-code">{generatedOTP}</span>
                                <span className="otp-demo-note">(Demo mode — no real SMS)</span>
                            </div>
                        )}

                        {/* Firebase SMS sent confirmation */}
                        {useFirebase && (
                            <div className="otp-sms-sent">
                                📱 SMS sent to {countryCode} {phone}. Check your messages!
                            </div>
                        )}

                        {/* 6-digit OTP inputs */}
                        <div className="otp-input-grid" onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => otpInputRefs.current[i] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`otp-digit${digit ? ' filled' : ''}${otpError ? ' error' : ''}${isVerifying ? ' verifying' : ''}`}
                                    value={digit}
                                    onChange={(e) => handleOtpDigit(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    disabled={isVerifying}
                                    id={`otp-digit-${i}`}
                                />
                            ))}
                        </div>

                        {isVerifying && (
                            <div className="otp-verifying">
                                <span className="spinner" /> Verifying...
                            </div>
                        )}

                        {otpError && <div className="otp-error">{otpError}</div>}

                        <div className="otp-actions">
                            <button
                                className="btn btn-ghost"
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || isSending}
                                id="resend-otp-btn"
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : '🔄 Resend Code'}
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setOtpError(''); }}
                                id="change-phone-btn"
                            >
                                ← Change Number
                            </button>
                        </div>
                    </div>
                )}

                {/* ───── Step 3: Profile Setup (new users only) ───── */}
                {step === 'profile' && (
                    <form className="login-form" onSubmit={handleCreateProfile}>
                        <div className="login-verified-badge">✅ Phone verified!</div>
                        <h2 className="login-section-title">Set Up Your Profile</h2>
                        <p className="login-desc">Just one more step — tell us about yourself.</p>

                        <div className="avatar-picker">
                            <label className="login-label">Pick an avatar</label>
                            <div className="avatar-grid">
                                {AVATARS.map(a => (
                                    <button
                                        key={a}
                                        type="button"
                                        className={`avatar-option${avatar === a ? ' selected' : ''}`}
                                        onClick={() => setAvatar(a)}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="login-field">
                            <label className="login-label" htmlFor="profile-name">Your Name</label>
                            <input
                                id="profile-name"
                                type="text"
                                className="login-input"
                                placeholder="What should we call you?"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                maxLength={30}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary login-submit"
                            disabled={!name.trim()}
                            id="create-profile-btn"
                        >
                            🚀 Start Tracking
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
