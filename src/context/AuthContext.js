// src/context/AuthContext.js
// Context for sharing authenticated user across the application

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { checkAndSyncData } from '../utils/dataSync';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Sync data when user logs in
        setSyncStatus('Syncing data...');
        
        try {
          const result = await checkAndSyncData(firebaseUser.uid);
          if (result.success) {
            if (result.cached) {
              // console.log('Using cached data');
            } else {
              // console.log('Initial data load complete:', result.stats);
            }
          } else {
            console.error('Sync failed:', result.error);
          }
        } catch (error) {
          console.error('Error during sync:', error);
        }
        
        setSyncStatus(null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userId: user?.uid || null,
    loading,
    syncStatus,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
