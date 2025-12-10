import React, { useState, useEffect, useCallback } from "react";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../css/HabitTracker.css";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import {
  getCachedHabitData,
  setCachedHabitData,
  updateCachedHabitData,
  isInitialLoadDone,
  updateLastSync
} from "../utils/localCache";
import { fetchUserHabitSettings, updateUserHabitSettings } from "../utils/firestore";

// Helper to get CSS variable value
const getCSSVar = (varName) => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

const HabitTracker = ({ userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [graphData, setGraphData] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chartColors, setChartColors] = useState({
    grid: 'rgba(255, 255, 255, 0.15)',
    axis: '#c9ced6',
    tooltipBg: '#1a1a1a',
    line: '#a268ffff',
    point: '#b168ffff'
  });

  // Update chart colors when theme changes
  useEffect(() => {
    const updateColors = () => {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      setChartColors({
        grid: getCSSVar('--chart-grid') || (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'),
        axis: getCSSVar('--chart-axis-text') || (isDark ? '#c9ced6' : '#444444'),
        tooltipBg: getCSSVar('--chart-tooltip-bg') || (isDark ? '#1a1a1a' : '#ffffff'),
        line: getCSSVar('--habit-chart-line'),
        point: getCSSVar('--habit-chart-point')
      });
    };
    
    updateColors();
    
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const monthKey = currentDate.toISOString().slice(0, 7);

  // Get enabled habits for display
  const enabledHabits = habits.filter(h => h.enabled);

  // Fetch user's habit settings
  useEffect(() => {
    if (!userId) return;
    
    const loadHabitSettings = async () => {
      const userHabits = await fetchUserHabitSettings(userId);
      setHabits(userHabits);
    };
    
    loadHabitSettings();
  }, [userId]);

  // Create month document for a user using habit IDs
  const createMonthDocument = useCallback(async (monthKey) => {
    try {
      const monthDocRef = doc(db, 'users', userId, 'habitTracker', monthKey);
      const monthData = {};
      const [year, month] = monthKey.split("-");
      const daysInMonth = new Date(year, month, 0).getDate();

      // Use all habit IDs (not just enabled) to keep data structure consistent
      for (let day = 1; day <= daysInMonth; day++) {
        const dailyHabits = {};
        habits.forEach((habit) => {
          dailyHabits[habit.id] = false;
        });
        monthData[day] = dailyHabits;
      }

      await setDoc(monthDocRef, monthData);
      setCachedHabitData(monthKey, monthData, userId);
      updateLastSync(userId);
      // console.log(`Created document for ${monthKey}`);
      return monthData;
    } catch (error) {
      console.error("Error creating month document:", error);
    }
  }, [userId, habits]);

  // Fetch month data for a user
  const fetchMonthData = useCallback(async (monthKey, forceRefresh = false) => {
    try {
      if (!forceRefresh && isInitialLoadDone(userId)) {
        const cachedData = getCachedHabitData(monthKey, userId);
        if (cachedData) {
          // console.log(`Returning habit data for ${monthKey} from cache`);
          return cachedData;
        }
      }

      // console.log(`Fetching habit data for ${monthKey} from Firebase`);
      const monthDocRef = doc(db, 'users', userId, 'habitTracker', monthKey);
      const docSnap = await getDoc(monthDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCachedHabitData(monthKey, data, userId);
        updateLastSync(userId);
        // console.log(`Fetched data for month: ${monthKey}`);
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching month data:", error);
      const cachedData = getCachedHabitData(monthKey, userId);
      if (cachedData) {
        // console.log(`Returning cached habit data due to error`);
        return cachedData;
      }
      return null;
    }
  }, [userId]);

  // Update habit data for a user
  const updateHabitDataFn = async (monthKey, day, habitId, isCompleted) => {
    try {
      const monthDocRef = doc(db, 'users', userId, 'habitTracker', monthKey);
      await updateDoc(monthDocRef, {
        [`${day}.${habitId}`]: isCompleted,
      });
      updateCachedHabitData(monthKey, day, habitId, isCompleted, userId);
      updateLastSync(userId);
      // console.log(`Updated habit: ${habitId}, day: ${day}, month: ${monthKey}`);
    } catch (error) {
      console.error("Error updating habit data:", error);
    }
  };

  // Update graph data
  const updateGraphData = useCallback((data) => {
    const graph = Array.from({ length: daysInMonth }, (_, day) => {
      const dayData = data[day + 1] || {};
      // Only count enabled habits
      const enabledHabitIds = habits.filter(h => h.enabled).map(h => h.id);
      return enabledHabitIds.filter(id => dayData[id]).length;
    });
    setGraphData(graph);
  }, [daysInMonth, habits]);

  useEffect(() => {
    if (!userId || habits.length === 0) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      let data = await fetchMonthData(monthKey);
      if (!data) {
        await createMonthDocument(monthKey);
        data = await fetchMonthData(monthKey);
      }
      setCalendarData(data || {});
      updateGraphData(data || {});
      setIsLoading(false);
    };

    fetchData();
  }, [currentDate, userId, habits, monthKey, fetchMonthData, createMonthDocument, updateGraphData]);

  const handleCheckboxChange = async (day, habitId) => {
    const updatedData = { ...calendarData };
    if (!updatedData[day]) updatedData[day] = {};
    updatedData[day][habitId] = !updatedData[day][habitId];
    setCalendarData(updatedData);
    await updateHabitDataFn(monthKey, day, habitId, updatedData[day][habitId]);
    updateGraphData(updatedData);
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + direction));
    setCurrentDate(newDate);
  };

  // Habit name editing handlers
  const startEditing = (habit) => {
    setEditingHabit(habit.id);
    setEditValue(habit.name);
  };

  const saveHabitName = async () => {
    if (!editingHabit || !editValue.trim()) return;
    
    const updatedHabits = habits.map(h => 
      h.id === editingHabit ? { ...h, name: editValue.trim() } : h
    );
    
    await updateUserHabitSettings(userId, updatedHabits);
    setHabits(updatedHabits);
    setEditingHabit(null);
    setEditValue('');
  };

  const cancelEditing = () => {
    setEditingHabit(null);
    setEditValue('');
  };

  const toggleHabitEnabled = async (habitId) => {
    const updatedHabits = habits.map(h => 
      h.id === habitId ? { ...h, enabled: !h.enabled } : h
    );
    
    await updateUserHabitSettings(userId, updatedHabits);
    setHabits(updatedHabits);
  };

  return (
    <div className="habit-tracker">
      <div className="habit-head">
        <div>
          <p className="eyebrow">Habits</p>
          <h1>Monthly tracker</h1>
          <p className="subtext">Tick habits daily, skim completion counts below.</p>
        </div>
        <div className="habit-controls">
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? '✕ Close' : '⚙ Edit Habits'}
          </button>
          <div className="habit-month month-nav">
            <button className="month-nav__btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="pill">
              {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
            <button className="month-nav__btn" onClick={() => changeMonth(1)} aria-label="Next month">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="habit-settings-panel">
          <div className="habit-settings-header">
            <h3>Customize Your Habits</h3>
            <p className="subtext">Click a habit name to edit. Toggle visibility with the checkbox.</p>
          </div>
          <div className="habit-settings-list">
            {habits.map((habit) => (
              <div key={habit.id} className="habit-setting-item">
                <input
                  type="checkbox"
                  checked={habit.enabled}
                  onChange={() => toggleHabitEnabled(habit.id)}
                  title={habit.enabled ? 'Disable habit' : 'Enable habit'}
                />
                {editingHabit === habit.id ? (
                  <div className="habit-edit-row">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveHabitName();
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      autoFocus
                      maxLength={20}
                    />
                    <button onClick={saveHabitName} className="save-btn">✓</button>
                    <button onClick={cancelEditing} className="cancel-btn">✕</button>
                  </div>
                ) : (
                  <span 
                    className={`habit-name ${!habit.enabled ? 'disabled' : ''}`}
                    onClick={() => startEditing(habit)}
                    title="Click to edit"
                  >
                    {habit.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="habit-layout">
        <div className="habit-card">
          <div className="card-head">
            <p className="section-label">Table</p>
            <span className="pill subtle">Scroll sideways for all days</span>
          </div>
          <div className="habit-tracker__table-wrapper">
            {isLoading && (
              <div className="habit-tracker__loading">
                <div className="loading-spinner"></div>
                <span>Loading habit data...</span>
              </div>
            )}
            <table className="habit-tracker-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {Array.from({ length: daysInMonth }, (_, day) => (
                    <th key={day}>{day + 1}</th>
                  ))}
                </tr>
                <tr>
                  <th>Day</th>
                  {Array.from({ length: daysInMonth }, (_, day) => {
                    const weekDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1).toLocaleString("default", {
                      weekday: "short",
                    });
                    const initials = weekDay === "Thur" ? "Th" : weekDay[0];
                    return <th key={day}>{initials}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {enabledHabits.map((habit) => (
                  <tr key={habit.id}>
                    <th scope="row" className="habitname">{habit.name}</th>
                    {Array.from({ length: daysInMonth }, (_, day) => (
                      <td key={day}>
                        <div className="checkbox-wrapper-30">
                          <span className="checkbox">
                            <input
                              type="checkbox"
                              checked={calendarData[day + 1]?.[habit.id] || false}
                              onChange={() => handleCheckboxChange(day + 1, habit.id)}
                            />
                            <svg>
                              <use xlinkHref="#checkbox-30" />
                            </svg>
                          </span>
                          <svg xmlns="http://www.w3.org/2000/svg" style={{ display: "none" }}>
                            <symbol id="checkbox-30" viewBox="0 0 22 22">
                              <path
                                fill="none"
                                stroke="currentColor"
                                d="M5.5,11.3L9,14.8L20.2,3.3l0,0c-0.5-1-1.5-1.8-2.7-1.8h-13c-1.7,0-3,1.3-3,3v13c0,1.7,1.3,3,3,3h13 c1.7,0,3-1.3,3-3v-13c0-0.4-0.1-0.8-0.3-1.2"
                              />
                            </symbol>
                          </svg>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="habit-card graph-card">
          <div className="card-head">
            <p className="section-label">Completion chart</p>
            <span className="pill subtle">Shows habits done per day</span>
          </div>
          <div className="graph">
            <Line
              data={{
                labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
                datasets: [
                  {
                    data: graphData,
                    fill: chartColors.fill || false,
                    borderColor: chartColors.line,
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2.5,
                    pointBackgroundColor: chartColors.point,
                  },
                ],
              }}
              options={{
                scales: {
                  x: {
                    grid: { color: chartColors.grid },
                    ticks: { color: chartColors.axis },
                  },
                  y: { 
                    beginAtZero: true, 
                    max: enabledHabits.length, 
                    ticks: { stepSize: 1, color: chartColors.axis },
                    grid: { color: chartColors.grid },
                  },
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: chartColors.tooltipBg,
                    titleColor: chartColors.axis,
                    bodyColor: chartColors.axis,
                    borderColor: chartColors.grid,
                    borderWidth: 1,
                  },
                },
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;
