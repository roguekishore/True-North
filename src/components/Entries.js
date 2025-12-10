import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import "../css/Entries.css";
import {
  getCachedJournalEntries,
  setCachedJournalEntries,
  isInitialLoadDone,
  updateLastSync
} from "../utils/localCache";

const START_MONTH = new Date(2025, 11, 1); // November 2024
const MOBILE_MONTHS_LIMIT = 1;

const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

const Entries = ({ userId }) => {
  const [entries, setEntries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        // Check cache first if initial load is done
        if (isInitialLoadDone(userId)) {
          const cachedEntries = getCachedJournalEntries(userId);
          if (cachedEntries && cachedEntries.length > 0) {
            // console.log('Returning journal entries from cache');
            setEntries(cachedEntries);
            setIsLoading(false);
            return;
          }
        }

        // Fetch from Firebase - new path: users/{userId}/journalEntries
        // console.log('Fetching journal entries from Firebase');
        const q = query(collection(db, `users/${userId}/journalEntries`), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // Update cache
        setCachedJournalEntries(items, userId);
        updateLastSync(userId);
        
        setEntries(items);
      } catch (error) {
        console.error("Error fetching entries:", error);
        // Try to use cached data on error
        const cachedEntries = getCachedJournalEntries(userId);
        if (cachedEntries) {
          // console.log('Returning cached entries due to error');
          setEntries(cachedEntries);
        }
      }
      setIsLoading(false);
    };

    fetchEntries();
  }, [userId]);

  const months = useMemo(() => {
    const today = new Date();
    const cursor = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthsList = [];

    while (cursor >= START_MONTH) {
      const label = cursor.toLocaleString("default", { month: "long", year: "numeric" });
      monthsList.push({
        label,
        monthIndex: cursor.getMonth(),
        year: cursor.getFullYear(),
        key: getMonthKey(cursor),
        isCurrent: cursor.getMonth() === today.getMonth() && cursor.getFullYear() === today.getFullYear(),
      });
      cursor.setMonth(cursor.getMonth() - 1);
    }

    return monthsList;
  }, []);

  const monthCounts = useMemo(() => {
    return entries.reduce((acc, entry) => {
      const date = new Date(entry.timestamp?.seconds ? entry.timestamp.seconds * 1000 : entry.timestamp);
      if (Number.isNaN(date)) return acc;
      const key = getMonthKey(date);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [entries]);

  useEffect(() => {
    if (!months.length) return;

    const firstWithEntries = months.find((month) => monthCounts[month.key] > 0);
    setSelectedMonth(firstWithEntries || months[0]);
  }, [months, monthCounts]);

  const getSeconds = (entry) => {
    if (entry.timestamp?.seconds) return entry.timestamp.seconds;
    const millis = new Date(entry.timestamp).getTime();
    return Number.isFinite(millis) ? millis / 1000 : 0;
  };

  const displayedEntries = useMemo(() => {
    if (!selectedMonth) return [];
    return entries
      .filter((entry) => {
        const date = new Date(entry.timestamp?.seconds ? entry.timestamp.seconds * 1000 : entry.timestamp);
        return (
          date.getMonth() === selectedMonth.monthIndex && date.getFullYear() === selectedMonth.year
        );
      })
      .sort((a, b) => getSeconds(b) - getSeconds(a));
  }, [entries, selectedMonth]);

  const handleMonthClick = (month) => {
    setSelectedMonth(month);
    setSelectedEntry(null);
  };

  const formatEntryDate = (entry) => {
    const date = new Date(entry.timestamp?.seconds ? entry.timestamp.seconds * 1000 : entry.timestamp);
    return date.toLocaleString("default", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="entries-shell">
      <div className="entries-head">
        <div>
          <p className="eyebrow">Journal</p>
          <h1>Timeline</h1>
          <p className="subtext">Recent months first. Pick a month to skim entries, tap any card to read.</p>
        </div>
      </div>

      <div className="entries-panel">
        <div className="entries-months">
          <div className="entries-months-head">
            <p className="section-label">Months</p>
            {months.length > MOBILE_MONTHS_LIMIT && (
              <button 
                className="entries-toggle-btn"
                onClick={() => setShowAllMonths(!showAllMonths)}
              >
                {showAllMonths ? `Show Less` : `Show All (${months.length})`}
              </button>
            )}
          </div>
          <div className="entries-grid months">
            {months.map((month, index) => (
              <button
                key={month.key}
                className={`entry-card month${selectedMonth?.key === month.key ? " is-active" : ""}${!showAllMonths && index >= MOBILE_MONTHS_LIMIT ? " hidden-mobile" : ""}`}
                onClick={() => handleMonthClick(month)}
              >
                <div className="month-row">
                  <span className="pill small">{month.year}</span>
                  {month.isCurrent && <span className="pill accent">Current</span>}
                </div>
                <h4>{month.label}</h4>
                <p className="count">{monthCounts[month.key] || 0} entr{(monthCounts[month.key] || 0) === 1 ? "y" : "ies"}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="entries-list">
          <div className="entries-back-row">
            <span className="pill">
              {selectedMonth
                ? new Date(selectedMonth.year, selectedMonth.monthIndex).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })
                : "Month"}
            </span>
          </div>

          <div className="entries-grid entries">
            {isLoading ? (
              <div className="entries-loading">
                <div className="loading-spinner"></div>
                <span>Loading entries...</span>
              </div>
            ) : displayedEntries.length === 0 ? (
              <p className="empty">No entries yet for this month.</p>
            ) : (
              displayedEntries.map((entry) => (
                <button
                  key={entry.id}
                  className="entry-card entry"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="entry-top">
                    <span className="pill small">{formatEntryDate(entry)}</span>
                  </div>
                  <p className="preview">{entry.content || entry.text || "Open to read"}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedEntry && (
        <div className="entries-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="entries-overlay__content" onClick={(e) => e.stopPropagation()}>
            <div className="overlay-head">
              <span className="pill small">{formatEntryDate(selectedEntry)}</span>
              <h2>{selectedEntry.title || "Entry"}</h2>
            </div>
            <div className="entry-text">{selectedEntry.content || selectedEntry.text}</div>
            <button className="close-btn" onClick={() => setSelectedEntry(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entries;
