// Firebase Configuration for HabitFlow
// ──────────────────────────────────────
// To set up Firebase Phone Authentication:
//
// 1. Go to https://console.firebase.google.com/
// 2. Click "Create a project" (or "Add project")
// 3. Give it a name like "HabitFlow"
// 4. Disable Google Analytics (optional) → Click "Create project"
// 5. Once created, click the Web icon (</>) to add a web app
// 6. Register your app with a nickname like "habitflow-web"
// 7. Copy the firebaseConfig object below and replace the placeholder values
// 8. Go to Authentication → Sign-in method → Enable "Phone"
// 9. Add your domain to Authorized domains (for production)
//
// ──────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// 🔧 Environment variables replace hardcoded values for security on public repos.
// To use locally, create a `.env.local` file with these VITE_ prefixed keys.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Allow testing with localhost
auth.useDeviceLanguage();

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export default app;
