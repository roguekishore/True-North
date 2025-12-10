// src/utils/auth.js
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const registerUser = async (email, password) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};

// Sign in with Google (popup)
export const signInWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
};

// Map common Firebase auth errors to friendlier messages
export const mapAuthError = (err) => {
    if (!err) return 'An unknown error occurred.';
    const code = err.code || '';

    switch (code) {
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try signing in.';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in popup closed before completing. Try again.';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled. Check configuration.';
        // Some Firebase projects / policies may surface compromised-password style errors
        case 'auth/compromised-password':
        case 'auth/pwned-password':
        case 'auth/pwned_password':
            return 'This password is not allowed. Choose a different password.';
        default:
            // Fallback: prefer the error.message if present but sanitize any
            // mentions of breaches or pwned-password vocabulary so we don't
            // surface alarming text directly to users.
            if (err.message) {
                const msg = err.message.replace(/^Firebase:\s*/i, '');
                const lowered = msg.toLowerCase();
                if (lowered.includes('breach') || lowered.includes('breached') || lowered.includes('pwned') || lowered.includes('compromis')) {
                    return 'This password is not allowed. Choose a different password.';
                }
                return msg;
            }
            return 'Authentication failed. Please try again.';
    }
};
