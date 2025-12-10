import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, signInWithGoogle, mapAuthError } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';

// Simple inline spinner component
const Spinner = () => (
    <span className="unique-login-spinner" aria-hidden="true">
        <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="31.4 31.4" strokeDashoffset="0"></circle>
        </svg>
    </span>
);

const Login = () => {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('site-theme') || document.documentElement.dataset.theme || 'dark';
        } catch (e) {
            return document.documentElement.dataset.theme || 'dark';
        }
    });

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'site-theme') setTheme(e.newValue || document.documentElement.dataset.theme || 'dark');
        };
        const obs = new MutationObserver(() => {
            setTheme(document.documentElement.dataset.theme || 'dark');
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        window.addEventListener('storage', onStorage);
        return () => {
            obs.disconnect();
            window.removeEventListener('storage', onStorage);
        };
    }, []);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            await loginUser(email, password);
            navigate('/');
        } catch (err) {
            setError(mapAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            await registerUser(email, password);
            navigate('/');
        } catch (err) {
            setError(mapAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            navigate('/');
        } catch (err) {
            setError(mapAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            isSignUp ? handleSignUp() : handleLogin();
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="unique-login-container">
            <div className="unique-login-box">
                <div className="unique-login-brand">
                    <img
                        src={theme === 'dark' ? require('./white.svg').default : require('./black.svg').default}
                        alt="Journalcom"
                        className="unique-login-brand-mark"
                        style={{ width: 40, height: 40 }}
                    />
                    {/* <span className="unique-login-brand-word">Journalcom</span> */}
                </div>
                
                <h2 className="unique-login-title">
                    {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="unique-login-subtitle">
                    {isSignUp 
                        ? 'Start your journaling journey today' 
                        : 'Sign in to continue your journey'}
                </p>
                
                <div className="unique-login-field">
                    <FaEnvelope className="unique-login-icon" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="unique-login-input"
                        placeholder="Email address"
                        disabled={loading}
                        autoComplete="email"
                    />
                </div>
                
                <div className="unique-login-field">
                    <FaLock className="unique-login-icon" />
                    <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="unique-login-input unique-login-password-mask"
                        placeholder="Password"
                        disabled={loading}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        data-lpignore="true"
                    />
                </div>
                
                {isSignUp && (
                    <div className="unique-login-field">
                        <FaLock className="unique-login-icon" />
                        <input
                            type="text"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="unique-login-input unique-login-password-mask"
                            placeholder="Confirm password"
                            disabled={loading}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-form-type="other"
                            data-lpignore="true"
                        />
                    </div>
                )}
                
                <button
                    onClick={isSignUp ? handleSignUp : handleLogin}
                    className="unique-login-button"
                    disabled={loading}
                >
                    {loading ? <Spinner /> : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
                </button>

                <div className="unique-or">OR</div>

                <button
                    onClick={handleGoogleSignIn}
                    className="unique-login-google"
                    disabled={loading}
                >
                    {loading ? (
                        <Spinner />
                    ) : (
                        <>
                            <FaGoogle style={{ marginRight: 8 }} />
                            <span>Sign in with Google</span>
                        </>
                    )}
                </button>
                
                {error && <p className="unique-login-error">{error}</p>}
                
                <div className="unique-login-toggle">
                    <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
                    <button 
                        onClick={toggleMode} 
                        className="unique-login-toggle-btn"
                        disabled={loading}
                    >
                        {isSignUp ? 'Sign In' : 'Create Account'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
