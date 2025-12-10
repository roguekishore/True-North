import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { forceRefreshAllData } from "../utils/dataSync";
import "../css/Navbar.css";
import WhiteLogo from './white.svg';
import BlackLogo from './black.svg';

// Sun and Moon SVG icons as components
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SyncIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const navItems = [
  { to: "/", label: "Home", key: 'home' },
  { to: "/habit-tracker", label: "Habit", key: 'habit' },
  { to: "/journal", label: "Journal", key: 'journal' },
  { to: "/entries", label: "Entries", key: 'entries' },
  { to: "/tracker", label: "Trackers", key: 'trackers' },
];

// Nav item icons
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/></svg>
);

const HabitIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4"/><polyline points="7 10 12 15 17 10"/></svg>
);

const JournalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h14v14H3z"/><path d="M7 3v4"/></svg>
);

const EntriesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);

const TrackersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/></svg>
);

const Navbar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('site-theme') || document.documentElement.dataset.theme || 'dark';
    } catch (e) {
      return document.documentElement.dataset.theme || 'dark';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('site-theme', theme);
    } catch (e) {
      console.error('Could not persist theme', e);
    }
  }, [theme]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out: ", error.message);
      alert("Logout failed.");
    }
  };

  const handleSync = async () => {
    const user = auth.currentUser;
    if (!user || syncing) return;
    
    setSyncing(true);
    try {
      await forceRefreshAllData(user.uid);
      // Reload the page to reflect new data
      window.location.reload();
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const linkClass = ({ isActive }) => `nav-link${isActive ? " is-active" : ""}`;

  const handleLinkClick = () => setOpen(false);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <button className="navbar__brand" onClick={() => { setOpen(false); navigate("/"); }}>
          <img
            src={theme === 'dark' ? WhiteLogo : BlackLogo}
            alt="Journalcom"
            className="brand-mark"
            style={{ width: 28, height: 28 }}
          />
          <span className="brand-word">True North</span>
        </button>

        {/* Mobile controls: theme toggle + sync + hamburger */}
        <div className="navbar__mobile-controls">
          <button
            type="button"
            className="sync-button sync-button__mobile"
            onClick={handleSync}
            disabled={syncing}
            aria-label="Sync data from cloud"
            title="Sync data from cloud"
          >
            <SyncIcon />
          </button>
          
          <button
            type="button"
            className="theme-toggle__button theme-toggle__mobile"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          
          <button
            className={`navbar__toggle${open ? " is-open" : ""}`}
            aria-label="Toggle navigation"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <ul className={`nav-list${open ? " is-open" : ""}`}>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClass} onClick={handleLinkClick}>
                <span className="nav-icon">
                  {item.key === 'home' && <HomeIcon />}
                  {item.key === 'habit' && <HabitIcon />}
                  {item.key === 'journal' && <JournalIcon />}
                  {item.key === 'entries' && <EntriesIcon />}
                  {item.key === 'trackers' && <TrackersIcon />}
                </span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
          <li className="sync-toggle sync-toggle__desktop">
            <button
              type="button"
              className="sync-button"
              onClick={handleSync}
              disabled={syncing}
              title="Sync data from cloud"
            >
              <SyncIcon />
              <span className="sync-button__label">{syncing ? 'Syncing' : 'Sync'}</span>
            </button>
          </li>
          <li className="theme-toggle theme-toggle__desktop">
            <button
              type="button"
              className="theme-toggle__button"
              onClick={toggleTheme}
              aria-pressed={theme === 'light'}
              title="Toggle light / dark theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              <span className="theme-toggle__label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </li>
          <li className="logout">
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
