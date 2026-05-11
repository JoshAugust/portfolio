import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';

// --- AUTH LOGIC ---

export const signInWithGoogle = async () => {
    // 1. Try Firebase (Real Auth)
    if (auth && googleProvider) {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Firebase Auth failed", error);
            throw error;
        }
    }

    // 2. If no config, throw error to trigger UI config prompt
    throw new Error('Firebase not configured. Please add your configuration.');
};

export const signOut = async () => {
    if (auth) {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    if (auth) {
        return onAuthStateChanged(auth, callback);
    }
    // If no auth, we can't subscribe to real changes. Just return no-op or call with null.
    // Given we want real auth, we just return a no-op unsubscribe if auth isn't there.
    return () => { };
};

export const isAuthConfigured = () => {
    return !!auth;
};
