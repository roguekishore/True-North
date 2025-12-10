import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Login from "./components/Login";
import HabitTracker from "./components/HabitTracker";
import JournalComponent from "./components/JournalComponent";
import Entries from "./components/Entries";
import TrackerTemplate from "./components/TrackerTemplate";

import UnifiedTracker from "./trackers/UnifiedTracker";

import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import ShowTrackers from "./components/ShowTrackers";
import { checkAndSyncData } from "./utils/dataSync";
import { AuthProvider } from "./context/AuthContext";

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Check and sync data when user logs in
        setIsLoading(true);
        setSyncStatus('Syncing data...');
        
        try {
          const result = await checkAndSyncData(user.uid);
          if (result.success) {
            if (result.cached) {
              // console.log('Using cached data');
              setSyncStatus(null);
            } else {
              // console.log('Initial data load complete:', result.stats);
              setSyncStatus(null);
            }
          } else {
            console.error('Sync failed:', result.error);
            setSyncStatus('Sync failed - using cached data');
            setTimeout(() => setSyncStatus(null), 3000);
          }
        } catch (error) {
          console.error('Error during sync:', error);
          setSyncStatus(null);
        }
        
        setIsLoading(false);
      } else {
        // User logged out - keep cache for when they log back in
        setUser(null);
        setIsLoading(false);
        setSyncStatus(null);
      }
    });
    return unsubscribe;
  }, []);

  // Show loading screen during initial auth check
  if (isLoading && !user) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}
      {syncStatus && (
        <div className="sync-status-bar">
          <span>{syncStatus}</span>
        </div>
      )}
      <div className="app-content">
        <Routes>
          <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
          <Route
            path="/trackers/:trackerId"
            element={user ? <TrackerTemplate trackerComponent={UnifiedTracker} userId={user.uid} /> : <Navigate to="/login" />}
          />
          <Route
            path="/trackers"
            element={user ? <TrackerTemplate trackerComponent={UnifiedTracker} userId={user.uid} /> : <Navigate to="/login" />}
          />

          <Route path="/habit-tracker" element={user ? <HabitTracker userId={user.uid} /> : <Navigate to="/login" />} />
          <Route path="/tracker" element={user ? <ShowTrackers userId={user.uid} /> : <Navigate to="/login" />} />
          <Route path="/journal/*" element={user ? <JournalComponent userId={user.uid} /> : <Navigate to="/login" />} />
          <Route path="/entries" element={user ? <Entries userId={user.uid} /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
