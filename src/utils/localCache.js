// src/utils/localCache.js
// Local Storage Caching Utility for Firebase Data Optimization - Multi-User Support
// With Cross-Device Sync Support via lastModified timestamps

const CACHE_PREFIX = 'journalcom_';
const CACHE_VERSION_KEY = `${CACHE_PREFIX}version`;
const CACHE_VERSION = '2.1'; // Bumped for cross-device sync support
const LAST_SYNC_KEY_SUFFIX = '_lastSync';
const LAST_MODIFIED_KEY_SUFFIX = '_lastModified'; // Tracks Firebase's lastModified
const USER_DATA_KEY = `${CACHE_PREFIX}currentUser`;
const INITIAL_LOAD_SUFFIX = '_initialLoadDone';

// Cache key suffixes for each data type
const CACHE_SUFFIXES = {
  JOURNAL_ENTRIES: '_journalEntries',
  HABIT_TRACKER: '_habitTracker',
  DAILY_MOMENTS: '_dailyMoments',
  TRACKERS: '_trackers',
};

// Get user-specific cache key
const getUserCacheKey = (userId, suffix) => `${CACHE_PREFIX}${userId}${suffix}`;

// Get the current user ID from cache
export const getCachedUserId = () => {
  return localStorage.getItem(USER_DATA_KEY);
};

// Helper to get today's date key
export const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Helper to get current month key
export const getCurrentMonthKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
};

// Helper to get current year key
export const getCurrentYearKey = () => {
  return new Date().getFullYear().toString();
};

// Initialize cache for a user
export const initializeCache = (userId) => {
  const currentVersion = localStorage.getItem(CACHE_VERSION_KEY);
  const currentUser = localStorage.getItem(USER_DATA_KEY);
  
  // Version mismatch - clear everything
  if (currentVersion !== CACHE_VERSION) {
    clearAllCache();
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
    localStorage.setItem(USER_DATA_KEY, userId);
    return { needsFullLoad: true, reason: 'version' };
  }
  
  // Different user logging in - clear old user's cache and set new user
  if (currentUser && currentUser !== userId) {
    clearUserCache(currentUser);
    localStorage.setItem(USER_DATA_KEY, userId);
    return { needsFullLoad: true, reason: 'newUser' };
  }
  
  // First time setup
  if (!currentUser) {
    localStorage.setItem(USER_DATA_KEY, userId);
    return { needsFullLoad: true, reason: 'firstTime' };
  }
  
  // Same user - keep existing cache
  return { needsFullLoad: false, reason: 'cached' };
};

// Check if initial load has been done for current user
export const isInitialLoadDone = (userId) => {
  const uid = userId || getCachedUserId();
  if (!uid) return false;
  return localStorage.getItem(getUserCacheKey(uid, INITIAL_LOAD_SUFFIX)) === 'true';
};

// Mark initial load as done for current user
export const setInitialLoadDone = (userId) => {
  const uid = userId || getCachedUserId();
  if (!uid) return;
  localStorage.setItem(getUserCacheKey(uid, INITIAL_LOAD_SUFFIX), 'true');
  localStorage.setItem(getUserCacheKey(uid, LAST_SYNC_KEY_SUFFIX), new Date().toISOString());
};

// Get last sync time for current user
export const getLastSyncTime = (userId) => {
  const uid = userId || getCachedUserId();
  if (!uid) return null;
  const lastSync = localStorage.getItem(getUserCacheKey(uid, LAST_SYNC_KEY_SUFFIX));
  return lastSync ? new Date(lastSync) : null;
};

// Get the stored lastModified timestamp from Firebase
export const getCachedLastModified = (userId) => {
  const uid = userId || getCachedUserId();
  if (!uid) return null;
  const lastModified = localStorage.getItem(getUserCacheKey(uid, LAST_MODIFIED_KEY_SUFFIX));
  return lastModified ? new Date(lastModified) : null;
};

// Set the lastModified timestamp from Firebase
export const setCachedLastModified = (timestamp, userId) => {
  const uid = userId || getCachedUserId();
  if (!uid) return;
  const ts = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
  localStorage.setItem(getUserCacheKey(uid, LAST_MODIFIED_KEY_SUFFIX), ts);
};

// Check if cache needs refresh based on Firebase lastModified
export const cacheNeedsRefresh = (firebaseLastModified, userId) => {
  const cachedLastModified = getCachedLastModified(userId);
  
  // If no cached timestamp, needs refresh
  if (!cachedLastModified) return true;
  
  // If Firebase has no timestamp (new sync system), 
  // we need to create it - don't force refresh just for this
  if (!firebaseLastModified) return false;
  
  const fbTime = firebaseLastModified instanceof Date ? firebaseLastModified : new Date(firebaseLastModified);
  const cacheTime = cachedLastModified instanceof Date ? cachedLastModified : new Date(cachedLastModified);
  
  // Add 1 second buffer to avoid millisecond comparison issues
  // If Firebase timestamp is newer than cached, needs refresh
  return fbTime.getTime() > cacheTime.getTime() + 1000;
};

// Check if we need to fetch today's data (for new day)
export const needsTodayFetch = (userId) => {
  const lastSync = getLastSyncTime(userId);
  if (!lastSync) return true;
  
  const today = new Date();
  const lastSyncDate = new Date(lastSync);
  
  return today.toDateString() !== lastSyncDate.toDateString();
};

// Clear all cache (all users)
export const clearAllCache = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};

// Clear cache for a specific user
export const clearUserCache = (userId) => {
  const prefix = `${CACHE_PREFIX}${userId}`;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  });
};

// ============ JOURNAL ENTRIES CACHE ============

export const getCachedJournalEntries = (userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return null;
    const cached = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.JOURNAL_ENTRIES));
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error reading journal entries from cache:', error);
    return null;
  }
};

export const setCachedJournalEntries = (entries, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return;
    localStorage.setItem(getUserCacheKey(uid, CACHE_SUFFIXES.JOURNAL_ENTRIES), JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving journal entries to cache:', error);
  }
};

export const addJournalEntryToCache = (entry, userId) => {
  try {
    const entries = getCachedJournalEntries(userId) || [];
    entries.unshift(entry);
    setCachedJournalEntries(entries, userId);
  } catch (error) {
    console.error('Error adding journal entry to cache:', error);
  }
};

export const updateJournalEntryInCache = (id, updates, userId) => {
  try {
    const entries = getCachedJournalEntries(userId) || [];
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates };
      setCachedJournalEntries(entries, userId);
    }
  } catch (error) {
    console.error('Error updating journal entry in cache:', error);
  }
};

export const deleteJournalEntryFromCache = (id, userId) => {
  try {
    const entries = getCachedJournalEntries(userId) || [];
    const filtered = entries.filter(e => e.id !== id);
    setCachedJournalEntries(filtered, userId);
  } catch (error) {
    console.error('Error deleting journal entry from cache:', error);
  }
};

// ============ HABIT TRACKER CACHE ============

export const getCachedHabitData = (monthKey, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return null;
    const allHabits = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.HABIT_TRACKER));
    const parsed = allHabits ? JSON.parse(allHabits) : {};
    return parsed[monthKey] || null;
  } catch (error) {
    console.error('Error reading habit data from cache:', error);
    return null;
  }
};

export const setCachedHabitData = (monthKey, data, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return;
    const allHabits = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.HABIT_TRACKER));
    const parsed = allHabits ? JSON.parse(allHabits) : {};
    parsed[monthKey] = data;
    localStorage.setItem(getUserCacheKey(uid, CACHE_SUFFIXES.HABIT_TRACKER), JSON.stringify(parsed));
  } catch (error) {
    console.error('Error saving habit data to cache:', error);
  }
};

export const updateCachedHabitData = (monthKey, day, habit, isCompleted, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return;
    const allHabits = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.HABIT_TRACKER));
    const parsed = allHabits ? JSON.parse(allHabits) : {};
    if (parsed[monthKey]) {
      if (!parsed[monthKey][day]) {
        parsed[monthKey][day] = {};
      }
      parsed[monthKey][day][habit] = isCompleted;
      localStorage.setItem(getUserCacheKey(uid, CACHE_SUFFIXES.HABIT_TRACKER), JSON.stringify(parsed));
    }
  } catch (error) {
    console.error('Error updating habit data in cache:', error);
  }
};

// ============ DAILY MOMENTS CACHE ============

export const getCachedDailyMoments = (monthKey, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return null;
    const allMoments = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.DAILY_MOMENTS));
    const parsed = allMoments ? JSON.parse(allMoments) : {};
    return parsed[monthKey] || null;
  } catch (error) {
    console.error('Error reading daily moments from cache:', error);
    return null;
  }
};

export const setCachedDailyMoments = (monthKey, data, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return;
    const allMoments = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.DAILY_MOMENTS));
    const parsed = allMoments ? JSON.parse(allMoments) : {};
    parsed[monthKey] = data;
    localStorage.setItem(getUserCacheKey(uid, CACHE_SUFFIXES.DAILY_MOMENTS), JSON.stringify(parsed));
  } catch (error) {
    console.error('Error saving daily moments to cache:', error);
  }
};

export const updateCachedDailyMoment = (monthKey, day, moment, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return;
    const allMoments = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.DAILY_MOMENTS));
    const parsed = allMoments ? JSON.parse(allMoments) : {};
    if (!parsed[monthKey]) {
      parsed[monthKey] = {};
    }
    parsed[monthKey][day] = moment;
    localStorage.setItem(getUserCacheKey(uid, CACHE_SUFFIXES.DAILY_MOMENTS), JSON.stringify(parsed));
  } catch (error) {
    console.error('Error updating daily moment in cache:', error);
  }
};

// ============ UNIFIED TRACKER CACHE ============

export const getCachedTrackerData = (trackerId, yearKey, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return null;
    const allTrackers = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.TRACKERS));
    const parsed = allTrackers ? JSON.parse(allTrackers) : {};
    return parsed[trackerId]?.[yearKey] || null;
  } catch (error) {
    console.error('Error reading tracker data from cache:', error);
    return null;
  }
};

export const setCachedTrackerData = (trackerId, yearKey, data, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return;
    const allTrackers = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.TRACKERS));
    const parsed = allTrackers ? JSON.parse(allTrackers) : {};
    if (!parsed[trackerId]) {
      parsed[trackerId] = {};
    }
    parsed[trackerId][yearKey] = data;
    localStorage.setItem(getUserCacheKey(uid, CACHE_SUFFIXES.TRACKERS), JSON.stringify(parsed));
  } catch (error) {
    console.error('Error saving tracker data to cache:', error);
  }
};

export const updateCachedTrackerCell = (trackerId, yearKey, month, dayIndex, valueKey, value, userId) => {
  try {
    const uid = userId || getCachedUserId();
    if (!uid) return;
    const allTrackers = localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.TRACKERS));
    const parsed = allTrackers ? JSON.parse(allTrackers) : {};
    
    if (parsed[trackerId]?.[yearKey]?.[month]) {
      if (!parsed[trackerId][yearKey][month][dayIndex]) {
        parsed[trackerId][yearKey][month][dayIndex] = {};
      }
      parsed[trackerId][yearKey][month][dayIndex][valueKey] = value;
      localStorage.setItem(getUserCacheKey(uid, CACHE_SUFFIXES.TRACKERS), JSON.stringify(parsed));
    }
  } catch (error) {
    console.error('Error updating tracker cell in cache:', error);
  }
};

// ============ BULK DATA OPERATIONS ============

// Get all cached data for a user (for debugging or export)
export const getAllCachedData = (userId) => {
  const uid = userId || getCachedUserId();
  if (!uid) return null;
  
  return {
    journalEntries: getCachedJournalEntries(uid),
    habitTracker: JSON.parse(localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.HABIT_TRACKER)) || '{}'),
    dailyMoments: JSON.parse(localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.DAILY_MOMENTS)) || '{}'),
    trackers: JSON.parse(localStorage.getItem(getUserCacheKey(uid, CACHE_SUFFIXES.TRACKERS)) || '{}'),
  };
};

// Update last sync time (call after any Firebase write)
export const updateLastSync = (userId) => {
  const uid = userId || getCachedUserId();
  if (!uid) return;
  localStorage.setItem(getUserCacheKey(uid, LAST_SYNC_KEY_SUFFIX), new Date().toISOString());
};

// Check storage usage
export const getCacheSize = () => {
  let total = 0;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      total += (localStorage.getItem(key) || '').length * 2; // UTF-16 chars
    }
  });
  return {
    bytes: total,
    kb: (total / 1024).toFixed(2),
    mb: (total / (1024 * 1024)).toFixed(4)
  };
};

const localCacheUtils = {
  getCachedUserId,
  getTodayKey,
  getCurrentMonthKey,
  getCurrentYearKey,
  initializeCache,
  isInitialLoadDone,
  setInitialLoadDone,
  getLastSyncTime,
  getCachedLastModified,
  setCachedLastModified,
  cacheNeedsRefresh,
  needsTodayFetch,
  clearAllCache,
  clearUserCache,
  // Journal
  getCachedJournalEntries,
  setCachedJournalEntries,
  addJournalEntryToCache,
  updateJournalEntryInCache,
  deleteJournalEntryFromCache,
  // Habits
  getCachedHabitData,
  setCachedHabitData,
  updateCachedHabitData,
  // Daily Moments
  getCachedDailyMoments,
  setCachedDailyMoments,
  updateCachedDailyMoment,
  // Trackers
  getCachedTrackerData,
  setCachedTrackerData,
  updateCachedTrackerCell,
  // Utilities
  getAllCachedData,
  updateLastSync,
  getCacheSize,
};

export default localCacheUtils;
