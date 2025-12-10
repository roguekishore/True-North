import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { trackerConfigMap, trackerConfigs, defaultTrackerId } from "./trackerConfig";
import "./UnifiedTracker.css";
import {
  getCachedTrackerData,
  setCachedTrackerData,
  updateCachedTrackerCell,
  isInitialLoadDone,
  updateLastSync
} from "../utils/localCache";

const buildEmptyYear = (config, yearKey) => {
  const yearData = {};
  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(yearKey, month, 0).getDate();
    yearData[month] = Array.from({ length: daysInMonth }, () => ({ [config.valueKey]: null }));
  }
  return yearData;
};

const normalizeYearData = (data, config, yearKey) => {
  const normalized = {};

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(yearKey, month, 0).getDate();
    const rawMonth = data?.[month];

    if (Array.isArray(rawMonth)) {
      normalized[month] = Array.from({ length: daysInMonth }, (_, idx) => rawMonth[idx] ?? { [config.valueKey]: null });
      continue;
    }

    if (rawMonth && typeof rawMonth === "object") {
      normalized[month] = Array.from(
        { length: daysInMonth },
        (_, idx) => rawMonth[idx] ?? rawMonth[String(idx)] ?? { [config.valueKey]: null }
      );
      continue;
    }

    normalized[month] = Array.from({ length: daysInMonth }, () => ({ [config.valueKey]: null }));
  }

  return normalized;
};

const getPaletteColor = (palette, value) => palette.find((option) => option.value === value)?.color;

const UnifiedTracker = ({ trackerId: propTrackerId, onTrackerChange, userId }) => {
  const params = useParams();
  const navigate = useNavigate();

  const activeTrackerId = propTrackerId || params.trackerId || defaultTrackerId;
  const tracker = trackerConfigMap[activeTrackerId] || trackerConfigMap[defaultTrackerId];

  const [yearKey, setYearKey] = useState(new Date().getFullYear().toString());
  const [yearData, setYearData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(tracker.palette[0]);
  const [loading, setLoading] = useState(false);
  const quickNavRef = useRef(null);

  useEffect(() => {
    setSelectedOption(tracker.palette[0]);
  }, [tracker]);

  const monthLabels = useMemo(
    () => Array.from({ length: 12 }, (_, index) => new Date(yearKey, index).toLocaleString("default", { month: "short" })),
    [yearKey]
  );

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      if (!userId) {
        // console.log('No userId, skipping tracker data load');
        return;
      }
      
      setLoading(true);
      
      // Check cache first if initial load is done
      if (isInitialLoadDone(userId)) {
        const cachedData = getCachedTrackerData(tracker.collection, yearKey, userId);
        if (cachedData) {
          // console.log(`Returning ${tracker.collection} data for ${yearKey} from cache`);
          if (!isActive) return;
          setYearData(normalizeYearData(cachedData, tracker, yearKey));
          setLoading(false);
          return;
        }
      }

      // Fetch from Firebase - path: users/{userId}/trackers/{trackerId_yearKey}
      // console.log(`Fetching ${tracker.collection} data for ${yearKey} from Firebase`);
      try {
        const docId = `${tracker.collection}_${yearKey}`;
        const docRef = doc(db, 'users', userId, 'trackers', docId);
        const snapshot = await getDoc(docRef);

        if (!isActive) return;

        if (snapshot.exists()) {
          const data = snapshot.data();
          // Cache the data
          setCachedTrackerData(tracker.collection, yearKey, data, userId);
          updateLastSync(userId);
          setYearData(normalizeYearData(data, tracker, yearKey));
        } else {
          const emptyYear = buildEmptyYear(tracker, yearKey);
          await setDoc(docRef, emptyYear);
          // Cache the new data
          setCachedTrackerData(tracker.collection, yearKey, emptyYear, userId);
          updateLastSync(userId);
          setYearData(emptyYear);
        }
      } catch (error) {
        console.error("Error loading tracker data:", error);
        // Try to use cached data on error
        const cachedData = getCachedTrackerData(tracker.collection, yearKey, userId);
        if (cachedData) {
          // console.log(`Returning cached ${tracker.collection} data due to error`);
          if (!isActive) return;
          setYearData(normalizeYearData(cachedData, tracker, yearKey));
        }
      }
      setLoading(false);
    };

    loadData();
    return () => {
      isActive = false;
    };
  }, [tracker, yearKey, userId]);

  const serializeSelection = (option) => {
    if (!option) return null;
    if (tracker.type === "hours") {
      return option.value;
    }
    return { rating: option.value, hex: option.color };
  };

  const normalizeCell = (cell) => {
    const rawValue = cell?.[tracker.valueKey];

    if (tracker.type === "hours") {
      const value = typeof rawValue === "number" ? rawValue : null;
      const color = value ? getPaletteColor(tracker.palette, value) || "transparent" : "transparent";
      const display = value !== null ? (tracker.formatValue ? tracker.formatValue(value) : String(value)) : "";
      return { value, color, display };
    }

    const value = typeof rawValue === "number" ? rawValue : rawValue?.rating ?? null;
    const color = rawValue?.hex || (value !== null ? getPaletteColor(tracker.palette, value) : null) || "transparent";
    const display = value ?? "";
    return { value, color, display };
  };

  const handleCellClick = async (month, day) => {
    if (!yearData || !selectedOption || !userId) return;

    const rawMonth = yearData[month];
    const daysInMonth = new Date(yearKey, month, 0).getDate();
    let monthData;

    if (Array.isArray(rawMonth)) {
      monthData = [...rawMonth];
    } else if (rawMonth && typeof rawMonth === "object") {
      monthData = Array.from(
        { length: daysInMonth },
        (_, idx) => rawMonth[idx] ?? rawMonth[String(idx)] ?? { [tracker.valueKey]: null }
      );
    } else {
      monthData = Array.from({ length: daysInMonth }, () => ({ [tracker.valueKey]: null }));
    }
    const currentCell = monthData[day - 1] || {};
    const { value: currentValue } = normalizeCell(currentCell);

    const nextValue = currentValue === selectedOption.value ? null : serializeSelection(selectedOption);
    const updatedCell = { ...currentCell, [tracker.valueKey]: nextValue };
    monthData[day - 1] = updatedCell;

    const nextYearData = { ...yearData, [month]: monthData };
    setYearData(nextYearData);

    // Update Firebase - path: users/{userId}/trackers/{trackerId_yearKey}
    const docId = `${tracker.collection}_${yearKey}`;
    const docRef = doc(db, 'users', userId, 'trackers', docId);
    await updateDoc(docRef, { [`${month}.${day - 1}.${tracker.valueKey}`]: nextValue });
    
    // Update local cache
    updateCachedTrackerCell(tracker.collection, yearKey, month, day - 1, tracker.valueKey, nextValue, userId);
    updateLastSync(userId);
  };

  const handleYearChange = (direction) => {
    const newYear = parseInt(yearKey, 10) + direction;
    setYearKey(newYear.toString());
  };

  const handleTrackerChange = (newTrackerId) => {
    if (onTrackerChange) {
      onTrackerChange(newTrackerId);
    } else {
      navigate(`/trackers/${newTrackerId}`);
    }
  };

  // Cycle through trackers with arrow buttons
  const cycleTracker = (direction) => {
    const currentIndex = trackerConfigs.findIndex(t => t.id === activeTrackerId);
    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) newIndex = trackerConfigs.length - 1;
    if (newIndex >= trackerConfigs.length) newIndex = 0;
    
    handleTrackerChange(trackerConfigs[newIndex].id);
  };

  const renderTableRows = () => {
    return monthLabels.map((monthLabel, index) => {
      const month = index + 1;
      const daysInMonth = new Date(yearKey, month, 0).getDate();
      const cells = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const cell = yearData?.[month]?.[day - 1];
        const { color, display } = normalizeCell(cell || { [tracker.valueKey]: null });
        cells.push(
          <td
            key={day}
            className="unified-tracker__cell"
            onClick={() => handleCellClick(month, day)}
            style={{ backgroundColor: color }}
          >
            {display}
          </td>
        );
      }

      return (
        <tr key={monthLabel}>
          <th scope="row" className="unified-tracker__month-label">{monthLabel}</th>
          {cells}
        </tr>
      );
    });
  };

  return (
    <div className="unified-tracker__shell">
      <div className="unified-tracker__head">
        <div>
          <p className="eyebrow">Trackers</p>
          <h1>Yearly Overview</h1>
          <p className="subtext">Track your daily progress across different categories.</p>
        </div>
        {/* <div className="unified-tracker__year year-nav">
          <button className="year-nav__btn" onClick={() => handleYearChange(-1)} aria-label="Previous year">
            ←
          </button>
          <span>{yearKey}</span>
          <button className="year-nav__btn" onClick={() => handleYearChange(1)} aria-label="Next year">
            →
          </button>
        </div> */}
      </div>

      <div className="unified-tracker__container">
      <div className="unified-tracker__toolbar">
        <div className="unified-tracker__toolbar-top">
          <div className="unified-tracker__select">
            <label htmlFor="tracker-select">Tracker</label>
            <select
              id="tracker-select"
              value={activeTrackerId}
              onChange={(event) => handleTrackerChange(event.target.value)}
            >
              {trackerConfigs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
          <div className="unified-tracker__year-inner year-nav">
            <button className="year-nav__btn" onClick={() => handleYearChange(-1)} aria-label="Previous year">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span>{yearKey}</span>
            <button className="year-nav__btn" onClick={() => handleYearChange(1)} aria-label="Next year">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="unified-tracker__quicknav">
          <p className="unified-tracker__quicknav-label">Quick switch</p>
          <div className="unified-tracker__quicknav-rail">
            <button
              type="button"
              className="unified-tracker__quicknav-arrow"
              onClick={() => cycleTracker(-1)}
              aria-label="Previous tracker"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              className="unified-tracker__quicknav-list"
              role="tablist"
              aria-label="Switch tracker"
              ref={quickNavRef}
            >
              {trackerConfigs.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`unified-tracker__quicknav-button${activeTrackerId === item.id ? " is-active" : ""}`}
                    onClick={() => handleTrackerChange(item.id)}
                    aria-pressed={activeTrackerId === item.id}
                  >
                    {Icon ? <Icon className="unified-tracker__quicknav-icon" /> : null}
                    <span className="unified-tracker__quicknav-text">{item.title}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="unified-tracker__quicknav-arrow"
              onClick={() => cycleTracker(1)}
              aria-label="Next tracker"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="unified-tracker__header">
        <h1>{tracker.title}</h1>
        <p>{tracker.description}</p>
      </div>

      {/* <p className="unified-tracker__hint">Tap a day to toggle. Swipe the grid horizontally on phones.</p> */}

      <div className="unified-tracker__palette-card">
        <div className="unified-tracker__palette-header">
          {/* <strong>Grading scale</strong> */}
          <span>Selected: {selectedOption?.label ?? '-'}</span>
        </div>
        <div className="unified-tracker__palette">
          {tracker.palette.map((option) => (
            <button
              key={option.value}
              className={`unified-tracker__palette-button${selectedOption?.value === option.value ? " is-active" : ""}`}
              style={{ backgroundColor: option.color }}
              onClick={() => setSelectedOption(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="unified-tracker__table-wrapper">
        {loading && (
          <div className="unified-tracker__loading">
            <div className="loading-spinner"></div>
            <span>Loading tracker data...</span>
          </div>
        )}
        <div className="unified-tracker__table-hint">Days spill off smaller screens — drag sideways to explore.</div>
        <table className="unified-tracker__table">
          <thead>
            <tr>
              <th className="unified-tracker__month-label">Month</th>
              {Array.from({ length: 31 }, (_, index) => (
                <th key={index}>{index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>{renderTableRows()}</tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default UnifiedTracker;
