import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/MEDS.css';

// Helper to get CSS variable value
const getCSSVar = (varName) => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

const MEDS = ({ userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState([]);
  const [chartColors, setChartColors] = useState({
    grid: 'rgba(255, 255, 255, 0.15)',
    axis: '#c9ced6'
  });

  // Update chart colors when theme changes
  useEffect(() => {
    const updateColors = () => {
      setChartColors({
        grid: getCSSVar('--chart-grid') || 'rgba(255, 255, 255, 0.15)',
        axis: getCSSVar('--chart-axis-text') || '#c9ced6'
      });
    };
    
    updateColors();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  const buildTrackerMonthData = useCallback((docPayload, tracker, month, days) => {
    const monthlyData = [];
    for (let day = 1; day <= days; day++) {
      const dayData = { day };
      const monthSlot = docPayload?.[month];
      const raw = monthSlot?.[day - 1]?.[tracker.field];
      const value = tracker.name === 'ScreenTime' ? raw ?? null : raw ? raw.rating ?? raw : null;
      dayData[tracker.name] = value ?? null;
      monthlyData.push(dayData);
    }
    return monthlyData;
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    const trackerCollections = [
      { name: 'Mood', collection: 'moodTracker', field: 'rating' },
      { name: 'Energy', collection: 'trackMyEnergy', field: 'rating' },
      { name: 'Discipline', collection: 'trackMyDiscipline', field: 'rating' },
      { name: 'ScreenTime', collection: 'screenTimeTracker', field: 'screenTime' },
    ];
    
    const year = currentDate.getFullYear().toString();
    const month = currentDate.getMonth() + 1;
    const days = new Date(currentDate.getFullYear(), month, 0).getDate();
    const cacheKey = `meds-month-${userId}-${year}-${month}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setMonthData(JSON.parse(cached));
    }

    const unsubscribes = trackerCollections.map((tracker) => {
      // Multi-user path: users/{userId}/trackers/{collection}_{year}
      const docId = `${tracker.collection}_${year}`;
      const ref = doc(db, 'users', userId, 'trackers', docId);
      return onSnapshot(
        ref,
        (snap) => {
          const data = snap.exists() ? snap.data() : null;
          const base = buildTrackerMonthData(data, tracker, month, days);
          setMonthData((prev) => {
            const merged = base.map((row, idx) => ({ ...prev?.[idx], ...row }));
            localStorage.setItem(cacheKey, JSON.stringify(merged));
            return merged;
          });
        },
        (error) => {
          console.error('Error subscribing to MEDS tracker', tracker.collection, error);
        }
      );
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub && unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, userId, buildTrackerMonthData]);

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="meds-monthly-health-tracker">
      <div className="meds-month-navigation month-nav">
        <button className="month-nav__btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2>{formatMonthYear()}</h2>
        <button className="month-nav__btn" onClick={() => changeMonth(1)} aria-label="Next month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="meds-legend-grid">
        {[
          { label: 'Mood', color: '#ff9500ff', hint: 'Daily mood check' },
          { label: 'Energy', color: '#1DBC60', hint: 'How energized you felt' },
          { label: 'Discipline', color: '#00a1feff', hint: 'Habits and focus' },
          { label: 'Screen Time', color: '#ff0000ff', hint: 'Hours of screen use' },
        ].map((item) => (
          <div key={item.label} className="meds-legend-card">
            <div className="meds-legend-swatch" style={{ backgroundColor: item.color }} />
            <div className="meds-legend-meta">
              <span className="meds-legend-label">{item.label}</span>
              {/* <span className="meds-legend-hint">{item.hint}</span> */}
            </div>
          </div>
        ))}
      </div>
      <div className="meds-chart-container">
        {monthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="day" stroke={chartColors.axis} tick={{ fill: chartColors.axis }} />
              <YAxis domain={[0, 10]} stroke={chartColors.axis} tick={{ fill: chartColors.axis }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: getCSSVar('--chart-tooltip-bg') || '#1a1a1a',
                  border: `1px solid ${getCSSVar('--border') || 'rgba(255,255,255,0.1)'}`,
                  color: getCSSVar('--text') || '#fff'
                }}
              />
              {/* <Legend /> */}
              <Line type="monotone" dataKey="Mood" stroke="#ff9500ff" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="Energy" stroke="#1DBC60" />
              <Line type="monotone" dataKey="Discipline" stroke="#00a1feff" />
              <Line type="monotone" dataKey="ScreenTime" stroke="#ff0000ff" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>No data available for this month</p>
        )}
      </div>
    </div>
  );
};

export default MEDS;
