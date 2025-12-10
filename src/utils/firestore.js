// src/utils/firestore.js
// Firebase Firestore utilities with multi-user support
// New schema: users/{userId}/journalEntries, users/{userId}/habitTracker, etc.
// With cross-device sync via lastModified timestamps

import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import {
  getCachedJournalEntries,
  setCachedJournalEntries,
  addJournalEntryToCache,
  updateJournalEntryInCache,
  deleteJournalEntryFromCache,
  isInitialLoadDone,
  updateLastSync
} from './localCache';

// ============ USER SYNC METADATA ============

// Get user's lastModified timestamp from Firebase
export const getFirebaseLastModified = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'syncMeta');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.lastModified ? new Date(data.lastModified) : null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching lastModified:', error);
    return null;
  }
};

// Update user's lastModified timestamp in Firebase
export const updateFirebaseLastModified = async (userId) => {
  try {
    const timestamp = new Date().toISOString();
    const docRef = doc(db, 'users', userId, 'settings', 'syncMeta');
    await setDoc(docRef, { lastModified: timestamp }, { merge: true });
    // console.log('Updated Firebase lastModified:', timestamp);
    return timestamp;
  } catch (error) {
    console.error('Error updating lastModified:', error);
    throw error;
  }
};

// ============ JOURNAL ENTRIES ============

// Add journal entry with cache support
export const addJournalEntry = async (userId, entry) => {
  try {
    const userJournalRef = collection(db, 'users', userId, 'journalEntries');
    const docRef = await addDoc(userJournalRef, entry);
    const newEntry = { id: docRef.id, ...entry };
    // Update local cache
    addJournalEntryToCache(newEntry, userId);
    updateLastSync(userId);
    // Update Firebase lastModified for cross-device sync
    await updateFirebaseLastModified(userId);
    return docRef.id;
  } catch (error) {
    console.error('Error adding journal entry:', error.message);
    throw error;
  }
};

// Fetch journal entries with cache support
export const fetchJournalEntries = async (userId, forceRefresh = false) => {
  try {
    // Check cache first if initial load is done and not forcing refresh
    if (!forceRefresh && isInitialLoadDone(userId)) {
      const cachedEntries = getCachedJournalEntries(userId);
      if (cachedEntries && cachedEntries.length > 0) {
        // console.log('Returning journal entries from cache');
        return cachedEntries;
      }
    }

    // Fetch from Firebase
    // console.log('Fetching journal entries from Firebase');
    const userJournalRef = collection(db, 'users', userId, 'journalEntries');
    const querySnapshot = await getDocs(userJournalRef);
    const entries = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    // Update cache
    setCachedJournalEntries(entries, userId);
    updateLastSync(userId);
    
    return entries;
  } catch (error) {
    console.error('Error fetching journal entries:', error.message);
    // If error, try to return cached data
    const cachedEntries = getCachedJournalEntries(userId);
      if (cachedEntries) {
      // console.log('Returning cached journal entries due to error');
      return cachedEntries;
    }
    throw error;
  }
};

// Update journal entry with cache support
export const updateJournalEntry = async (userId, id, updates) => {
  try {
    const docRef = doc(db, 'users', userId, 'journalEntries', id);
    await updateDoc(docRef, updates);
    // Update local cache
    updateJournalEntryInCache(id, updates, userId);
    updateLastSync(userId);
    // Update Firebase lastModified for cross-device sync
    await updateFirebaseLastModified(userId);
  } catch (error) {
    console.error('Error updating journal entry:', error.message);
    throw error;
  }
};

// Delete journal entry with cache support
export const deleteJournalEntry = async (userId, id) => {
  try {
    const docRef = doc(db, 'users', userId, 'journalEntries', id);
    await deleteDoc(docRef);
    // Update local cache
    deleteJournalEntryFromCache(id, userId);
    updateLastSync(userId);
    // Update Firebase lastModified for cross-device sync
    await updateFirebaseLastModified(userId);
  } catch (error) {
    console.error('Error deleting journal entry:', error.message);
    throw error;
  }
};

// ============ HABIT TRACKER ============

// Create habit month document for a user
export const createHabitMonthDocument = async (userId, monthKey, habits) => {
  try {
    const monthDocRef = doc(db, 'users', userId, 'habitTracker', monthKey);
    const monthData = {};
    const [year, month] = monthKey.split("-");
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dailyHabits = {};
      habits.forEach((habit) => {
        dailyHabits[habit] = false;
      });
      monthData[day] = dailyHabits;
    }

    await setDoc(monthDocRef, monthData);
    // console.log(`Created habit document for ${monthKey}`);
    // Update Firebase lastModified for cross-device sync
    await updateFirebaseLastModified(userId);
    return monthData;
  } catch (error) {
    console.error("Error creating habit month document:", error);
    throw error;
  }
};

// Fetch habit month data for a user
export const fetchHabitMonthData = async (userId, monthKey) => {
  try {
    const monthDocRef = doc(db, 'users', userId, 'habitTracker', monthKey);
    const docSnap = await getDoc(monthDocRef);

    if (docSnap.exists()) {
      // console.log(`Fetched habit data for month: ${monthKey}`);
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching habit month data:", error);
    return null;
  }
};

// Update habit data for a user
export const updateHabitData = async (userId, monthKey, day, habit, isCompleted) => {
  try {
    const monthDocRef = doc(db, 'users', userId, 'habitTracker', monthKey);
    await updateDoc(monthDocRef, {
      [`${day}.${habit}`]: isCompleted,
    });
    // console.log(`Updated habit: ${habit}, day: ${day}, month: ${monthKey}`);
    // Update Firebase lastModified for cross-device sync
    await updateFirebaseLastModified(userId);
  } catch (error) {
    console.error("Error updating habit data:", error);
    throw error;
  }
};

// ============ DAILY MOMENTS ============

// Fetch daily moments for a user's month
export const fetchDailyMoments = async (userId, monthKey) => {
  try {
    const daysRef = collection(db, 'users', userId, 'dailyMoments', monthKey, 'days');
    const querySnapshot = await getDocs(daysRef);
    const moments = {};

    querySnapshot.forEach((doc) => {
      const dayMatch = doc.id.match(/day-(\d+)/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1]);
        moments[day] = doc.data().moment;
      }
    });

    return moments;
  } catch (error) {
    console.error("Error fetching daily moments:", error);
    return {};
  }
};

// Save daily moment for a user
export const saveDailyMoment = async (userId, monthKey, day, moment, date) => {
  try {
    const docRef = doc(db, 'users', userId, 'dailyMoments', monthKey, 'days', `day-${day}`);
    await setDoc(docRef, {
      moment: moment,
      date: date
    });
    // console.log(`Saved daily moment for day ${day}`);
    // Update Firebase lastModified for cross-device sync
    await updateFirebaseLastModified(userId);
  } catch (error) {
    console.error("Error saving daily moment:", error);
    throw error;
  }
};

// ============ UNIFIED TRACKERS ============

// Helper to create tracker document ID (combines trackerId and yearKey)
const getTrackerDocId = (trackerId, yearKey) => `${trackerId}_${yearKey}`;

// Fetch tracker year data for a user
// Path: users/{userId}/trackers/{trackerId_yearKey}
export const fetchTrackerYearData = async (userId, trackerId, yearKey) => {
  try {
    const docId = getTrackerDocId(trackerId, yearKey);
    const docRef = doc(db, 'users', userId, 'trackers', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // console.log(`Fetched ${trackerId} data for year: ${yearKey}`);
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ${trackerId} data:`, error);
    return null;
  }
};

// Create tracker year document for a user
export const createTrackerYearDocument = async (userId, trackerId, yearKey, yearData) => {
  try {
    const docId = getTrackerDocId(trackerId, yearKey);
    const docRef = doc(db, 'users', userId, 'trackers', docId);
    await setDoc(docRef, yearData);
    // console.log(`Created ${trackerId} document for year ${yearKey}`);
    // Update Firebase lastModified for cross-device sync
    await updateFirebaseLastModified(userId);
    return yearData;
  } catch (error) {
    console.error(`Error creating ${trackerId} year document:`, error);
    throw error;
  }
};

// Update tracker cell for a user
export const updateTrackerCell = async (userId, trackerId, yearKey, month, dayIndex, valueKey, value) => {
  try {
    const docId = getTrackerDocId(trackerId, yearKey);
    const docRef = doc(db, 'users', userId, 'trackers', docId);
    await updateDoc(docRef, {
      [`${month}.${dayIndex}.${valueKey}`]: value
    });
    // console.log(`Updated ${trackerId} cell: month ${month}, day ${dayIndex}`);
    // Update Firebase lastModified for cross-device sync
    await updateFirebaseLastModified(userId);
  } catch (error) {
    console.error(`Error updating ${trackerId} cell:`, error);
    throw error;
  }
};

// ============ BULK FETCH FOR INITIAL LOAD ============

// Fetch all habit tracker months for a user
export const fetchAllHabitTrackerMonths = async (userId, monthKeys) => {
  const data = {};
  for (const monthKey of monthKeys) {
    const monthData = await fetchHabitMonthData(userId, monthKey);
    if (monthData) {
      data[monthKey] = monthData;
    }
  }
  return data;
};

// Fetch all daily moments months for a user
export const fetchAllDailyMomentsMonths = async (userId, monthKeys) => {
  const data = {};
  for (const monthKey of monthKeys) {
    const moments = await fetchDailyMoments(userId, monthKey);
    if (Object.keys(moments).length > 0) {
      data[monthKey] = moments;
    }
  }
  return data;
};

// Fetch all tracker data for a user
export const fetchAllTrackerData = async (userId, trackerIds, yearKey) => {
  const data = {};
  for (const trackerId of trackerIds) {
    const trackerData = await fetchTrackerYearData(userId, trackerId, yearKey);
    if (trackerData) {
      data[trackerId] = { [yearKey]: trackerData };
    }
  }
  return data;
};

// ============ USER HABIT SETTINGS ============

// Default habit template - users can customize the names
const DEFAULT_HABITS = [
  { id: 'habit1', name: 'Habit 1', enabled: true },
  { id: 'habit2', name: 'Habit 2', enabled: true },
  { id: 'habit3', name: 'Habit 3', enabled: true },
  { id: 'habit4', name: 'Habit 4', enabled: true },
  { id: 'habit5', name: 'Habit 5', enabled: true },
  { id: 'habit6', name: 'Habit 6', enabled: false },
  { id: 'habit7', name: 'Habit 7', enabled: false },
  { id: 'habit8', name: 'Habit 8', enabled: false },
  { id: 'habit9', name: 'Habit 9', enabled: false },
  { id: 'habit10', name: 'Habit 10', enabled: false },
];

// Fetch user's habit settings
export const fetchUserHabitSettings = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'habits');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().habits;
    } else {
      // Create default settings for new user
      await setDoc(docRef, { habits: DEFAULT_HABITS });
      return DEFAULT_HABITS;
    }
  } catch (error) {
    console.error('Error fetching habit settings:', error);
    return DEFAULT_HABITS;
  }
};

// Update user's habit settings (name changes, enable/disable)
export const updateUserHabitSettings = async (userId, habits) => {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'habits');
    await setDoc(docRef, { habits });
    // console.log('Updated habit settings');
    // Update Firebase lastModified for cross-device sync
    await updateFirebaseLastModified(userId);
  } catch (error) {
    console.error('Error updating habit settings:', error);
    throw error;
  }
};

// Update a single habit's name
export const updateHabitName = async (userId, habitId, newName) => {
  try {
    const habits = await fetchUserHabitSettings(userId);
    const updatedHabits = habits.map(h => 
      h.id === habitId ? { ...h, name: newName } : h
    );
    await updateUserHabitSettings(userId, updatedHabits);
    return updatedHabits;
  } catch (error) {
    console.error('Error updating habit name:', error);
    throw error;
  }
};

// Toggle habit enabled/disabled
export const toggleHabitEnabled = async (userId, habitId) => {
  try {
    const habits = await fetchUserHabitSettings(userId);
    const updatedHabits = habits.map(h => 
      h.id === habitId ? { ...h, enabled: !h.enabled } : h
    );
    await updateUserHabitSettings(userId, updatedHabits);
    return updatedHabits;
  } catch (error) {
    console.error('Error toggling habit:', error);
    throw error;
  }
};
