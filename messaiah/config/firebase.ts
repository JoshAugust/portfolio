import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Helper to check if we have a config
export const getFirebaseConfig = () => {
    // 1. Try Environment Variables (Preferred)
    if (import.meta.env.VITE_FIREBASE_API_KEY) {
        return {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
            // measurementId is optional and often not needed for auth
        };
    }

    // 2. Try Local Storage (Fallback for UI-based setup)
    const stored = localStorage.getItem('FIREBASE_CONFIG');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Invalid Firebase Config JSON", e);
            return null;
        }
    }
    return null;
};

export const saveFirebaseConfig = (configStr: string) => {
    try {
        const config = JSON.parse(configStr);
        localStorage.setItem('FIREBASE_CONFIG', JSON.stringify(config));
        window.location.reload(); // Force reload to re-init
        return true;
    } catch (e) {
        return false;
    }
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;

const config = getFirebaseConfig();

if (config) {
    try {
        if (!getApps().length) {
            app = initializeApp(config);
        } else {
            app = getApp();
        }
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        db = getFirestore(app);
    } catch (e) {
        console.error("Failed to initialize Firebase", e);
        // If config is bad, maybe clear it or let the UI handle the "auth null" state
    }
}

export { auth, googleProvider, db };
