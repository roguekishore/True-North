// src/utils/dataSync.js
// Service for initial data synchronization and cache management - Multi-User Support
// With cross-device sync via lastModified timestamp checking

import {
  fetchJournalEntries,
  fetchAllHabitTrackerMonths,
  fetchAllDailyMomentsMonths,
  fetchAllTrackerData,
  getFirebaseLastModified
} from './firestore';
import {
  initializeCache,
  isInitialLoadDone,
  setInitialLoadDone,
  setCachedHabitData,
  setCachedDailyMoments,
  setCachedTrackerData,
  getCurrentYearKey,
  needsTodayFetch,
  updateLastSync,
  getCachedLastModified,
  setCachedLastModified,
  cacheNeedsRefresh
} from './localCache';
import { trackerConfigs } from '../trackers/trackerConfig';

// Generate month keys for the past N months
const getRecentMonthKeys = (numMonths = 12) => {
  const keys = [];
  const today = new Date();
  
  for (let i = 0; i < numMonths; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    keys.push(monthKey);
  }
  
  return keys;
};

// Get all tracker IDs from config
const getTrackerIds = () => {
  return trackerConfigs.map(t => t.id);
};

// Main function to perform initial data load
export const performInitialDataLoad = async (userId, onProgress) => {
  // console.log('Starting initial data load for user:', userId);
  
  try {
    const currentYear = getCurrentYearKey();
    const recentMonths = getRecentMonthKeys(12); // Last 12 months
    const trackerIds = getTrackerIds();
    
    // Report progress
    onProgress?.({ step: 'journal', status: 'loading' });
    
    // Fetch all data
    // console.log('Fetching journal entries...');
    const journalEntries = await fetchJournalEntries(userId, true); // Force refresh
    
    onProgress?.({ step: 'habits', status: 'loading' });
    // console.log('Fetching habit tracker data...');
    const habitData = await fetchAllHabitTrackerMonths(userId, recentMonths);
    
    onProgress?.({ step: 'moments', status: 'loading' });
    // console.log('Fetching daily moments...');
    const momentsData = await fetchAllDailyMomentsMonths(userId, recentMonths);
    
    onProgress?.({ step: 'trackers', status: 'loading' });
    // console.log('Fetching tracker data...');
    const trackerData = await fetchAllTrackerData(userId, trackerIds, currentYear);
    
    onProgress?.({ step: 'caching', status: 'saving' });
    
    // Cache journal entries (already cached in fetchJournalEntries)
    // console.log(`Cached ${journalEntries.length} journal entries`);
    
    // Cache habit data
    Object.entries(habitData).forEach(([monthKey, data]) => {
      setCachedHabitData(monthKey, data, userId);
    });
    // console.log(`Cached habit data for ${Object.keys(habitData).length} months`);
    
    // Cache daily moments
    Object.entries(momentsData).forEach(([monthKey, data]) => {
      setCachedDailyMoments(monthKey, data, userId);
    });
    // console.log(`Cached daily moments for ${Object.keys(momentsData).length} months`);
    
    // Cache tracker data
    Object.entries(trackerData).forEach(([trackerId, yearData]) => {
      Object.entries(yearData).forEach(([yearKey, data]) => {
        setCachedTrackerData(trackerId, yearKey, data, userId);
      });
    });
    // console.log(`Cached data for ${Object.keys(trackerData).length} trackers`);
    
    // Mark initial load as complete and store Firebase's lastModified
    setInitialLoadDone(userId);
    updateLastSync(userId);
    
    // Fetch and store the current Firebase lastModified timestamp
    const firebaseLastModified = await getFirebaseLastModified(userId);
    if (firebaseLastModified) {
      setCachedLastModified(firebaseLastModified, userId);
    } else {
      // If no lastModified exists, set current time
      setCachedLastModified(new Date().toISOString(), userId);
    }
    
    onProgress?.({ step: 'complete', status: 'done' });
    
    // console.log('Initial data load complete!');
    
    return {
      success: true,
      stats: {
        journalEntries: journalEntries.length,
        habitMonths: Object.keys(habitData).length,
        momentMonths: Object.keys(momentsData).length,
        trackers: Object.keys(trackerData).length,
      }
    };
  } catch (error) {
    console.error('Error during initial data load:', error);
    onProgress?.({ step: 'error', status: 'failed', error: error.message });
    return { success: false, error: error.message };
  }
};

// Check if sync is needed and perform it (with cross-device sync support)
export const checkAndSyncData = async (userId) => {
  // Initialize cache for user (handles version/user changes)
  const cacheStatus = initializeCache(userId);
  
  // If initial load not done or new user, perform full load
  if (cacheStatus.needsFullLoad || !isInitialLoadDone(userId)) {
    // console.log(`Performing full data load. Reason: ${cacheStatus.reason}`);
    return performInitialDataLoad(userId);
  }
  
  // ALWAYS check Firebase for cross-device sync on each app load
  try {
    // console.log('Checking Firebase for cross-device sync...');
    const firebaseLastModified = await getFirebaseLastModified(userId);
    const cachedLastModified = getCachedLastModified(userId);
    
    // console.log('Firebase lastModified:', firebaseLastModified);
    // console.log('Cached lastModified:', cachedLastModified);
    
    const needsRefresh = cacheNeedsRefresh(firebaseLastModified, userId);
    
    if (needsRefresh) {
      // console.log('Cross-device sync: Firebase has newer data, refreshing cache...');
      return performInitialDataLoad(userId);
    }
    
    // If no cached lastModified timestamp exists yet but initial load is done,
    // fetch current Firebase timestamp and store it (migration for existing users)
    if (!cachedLastModified && firebaseLastModified) {
      // console.log('Migrating: storing Firebase lastModified to local cache');
      setCachedLastModified(firebaseLastModified, userId);
    }
  } catch (error) {
    console.error('Error checking Firebase lastModified:', error);
    // Continue with cached data if check fails
  }
  
  // Data is cached and up-to-date
  // console.log('Using cached data for user:', userId);
  return { success: true, cached: true };
};

// Force refresh all data
export const forceRefreshAllData = async (userId) => {
  initializeCache(userId);
  return performInitialDataLoad(userId);
};

// Get sync status
export const getSyncStatus = (userId) => {
  return {
    initialLoadDone: isInitialLoadDone(userId),
    needsTodayFetch: needsTodayFetch(userId),
    cachedLastModified: getCachedLastModified(userId),
  };
};

const dataSyncUtils = {
  performInitialDataLoad,
  checkAndSyncData,
  forceRefreshAllData,
  getSyncStatus,
};

export default dataSyncUtils;
