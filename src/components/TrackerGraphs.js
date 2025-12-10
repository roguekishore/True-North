import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { trackerConfigs } from '../trackers/trackerConfig';
import { getCachedTrackerData } from '../utils/localCache';
import '../css/TrackerGraphs.css';

// Helper to get CSS variable value
const getCSSVar = (varName) => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

const TrackerGraphs = ({ userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTrackerIndex, setActiveTrackerIndex] = useState(0);
  const [trackerData, setTrackerData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [chartColors, setChartColors] = useState({
    grid: 'rgba(255, 255, 255, 0.06)',
    axis: 'rgba(255, 255, 255, 0.5)',
    tooltipBg: 'rgba(0, 0, 0, 0.8)'
  });

  // Update chart colors when theme changes
  useEffect(() => {
    const updateColors = () => {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      setChartColors({
        grid: getCSSVar('--chart-grid') || (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'),
        axis: getCSSVar('--chart-axis-text') || (isDark ? '#c9ced6' : '#444444'),
        tooltipBg: getCSSVar('--chart-tooltip-bg') || (isDark ? '#1a1a1a' : '#ffffff')
      });
    };
    
    updateColors();
    
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  const activeTracker = trackerConfigs[activeTrackerIndex];
  const year = currentDate.getFullYear().toString();
  const month = currentDate.getMonth() + 1;
  const daysInMonth = new Date(currentDate.getFullYear(), month, 0).getDate();

  // Get visible trackers (3 at a time, centered on active)
  const getVisibleTrackers = useCallback(() => {
    const total = trackerConfigs.length;
    const prevIndex = (activeTrackerIndex - 1 + total) % total;
    const nextIndex = (activeTrackerIndex + 1) % total;
    return [
      { ...trackerConfigs[prevIndex], position: 'prev', index: prevIndex },
      { ...trackerConfigs[activeTrackerIndex], position: 'active', index: activeTrackerIndex },
      { ...trackerConfigs[nextIndex], position: 'next', index: nextIndex },
    ];
  }, [activeTrackerIndex]);

  const visibleTrackers = getVisibleTrackers();

  // Cycle through trackers
  const cycleTracker = (direction) => {
    const total = trackerConfigs.length;
    setActiveTrackerIndex((prev) => (prev + direction + total) % total);
  };

  // Load tracker data from cache
  const loadTrackerData = useCallback(() => {
    if (!userId) return;
    
    const data = {};
    trackerConfigs.forEach((tracker) => {
      const cachedData = getCachedTrackerData(tracker.collection, year, userId);
      if (cachedData) {
        data[tracker.id] = cachedData;
      }
    });
    setTrackerData(data);
    setIsLoading(false);
  }, [userId, year]);

  useEffect(() => {
    setIsLoading(true);
    loadTrackerData();
    const interval = setInterval(loadTrackerData, 2000);
    return () => clearInterval(interval);
  }, [loadTrackerData]);

  // Extract month data for the active tracker
  const monthData = useMemo(() => {
    const data = trackerData[activeTracker.id];
    if (!data || !data[month]) return [];

    return Array.from({ length: daysInMonth }, (_, idx) => {
      const dayData = data[month][idx];
      if (!dayData) return null;
      
      const rawValue = dayData[activeTracker.valueKey];
      if (rawValue === null || rawValue === undefined) return null;
      
      if (typeof rawValue === 'number') return rawValue;
      if (typeof rawValue === 'object' && rawValue?.rating !== undefined) return rawValue.rating;
      return null;
    });
  }, [trackerData, activeTracker, month, daysInMonth]);

  // Calculate stats
  const stats = useMemo(() => {
    const validValues = monthData.filter(v => v !== null);
    if (validValues.length === 0) return { avg: 0, max: 0, min: 0, filled: 0 };
    
    return {
      avg: (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(1),
      max: Math.max(...validValues),
      min: Math.min(...validValues),
      filled: validValues.length
    };
  }, [monthData]);

  // Chart data
  const chartData = useMemo(() => ({
    labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
    datasets: [
      {
        label: activeTracker.title,
        data: monthData,
        borderColor: activeTracker.palette[0]?.color || '#00FF9A',
        backgroundColor: `${activeTracker.palette[0]?.color || '#00FF9A'}33`,
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: true,
      },
    ],
  }), [daysInMonth, monthData, activeTracker]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartColors.tooltipBg,
        titleColor: chartColors.axis,
        bodyColor: chartColors.axis,
        borderColor: chartColors.grid,
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (items) => `Day ${items[0].label}`,
          label: (item) => `${activeTracker.title}: ${item.raw ?? 'No data'}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: chartColors.grid },
        ticks: { color: chartColors.axis, font: { size: 10 } },
      },
      y: {
        min: 0,
        max: activeTracker.type === 'hours' ? 12 : 10,
        grid: { color: chartColors.grid },
        ticks: { color: chartColors.axis, stepSize: activeTracker.type === 'hours' ? 2 : 1 },
      },
    },
  }), [chartColors, activeTracker]);

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="tracker-graphs">
      {/* Compact Header with Month Nav */}
      <div className="tracker-graphs__toolbar">
        <div className="tracker-graphs__title-row">
          <h2>Tracker Analytics</h2>
          <div className="tracker-graphs__month-nav month-nav">
            <button className="month-nav__btn" onClick={() => changeMonth(-1)}>←</button>
            <span className="tracker-graphs__month-label">{formatMonthYear()}</span>
            <button className="month-nav__btn" onClick={() => changeMonth(1)}>→</button>
          </div>
        </div>

        {/* Quick Switch - 3 visible trackers */}
        <div className="tracker-graphs__quicknav">
          <button
            className="tracker-graphs__quicknav-arrow"
            onClick={() => cycleTracker(-1)}
            aria-label="Previous tracker"
          >←</button>
          
          <div className="tracker-graphs__quicknav-items">
            {visibleTrackers.map((tracker) => {
              const Icon = tracker.icon;
              return (
                <button
                  key={tracker.id}
                  className={`tracker-graphs__quicknav-item ${tracker.position}`}
                  onClick={() => setActiveTrackerIndex(tracker.index)}
                  title={tracker.description}
                >
                  <Icon className="tracker-graphs__quicknav-icon" />
                  <span className="tracker-graphs__quicknav-label">{tracker.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          <button
            className="tracker-graphs__quicknav-arrow"
            onClick={() => cycleTracker(1)}
            aria-label="Next tracker"
          >→</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="tracker-graphs__stats-row">
        <div className="tracker-graphs__stat">
          <span className="tracker-graphs__stat-value">{stats.avg}</span>
          <span className="tracker-graphs__stat-label">Average</span>
        </div>
        <div className="tracker-graphs__stat">
          <span className="tracker-graphs__stat-value">{stats.max}</span>
          <span className="tracker-graphs__stat-label">Highest</span>
        </div>
        <div className="tracker-graphs__stat">
          <span className="tracker-graphs__stat-value">{stats.min}</span>
          <span className="tracker-graphs__stat-label">Lowest</span>
        </div>
        <div className="tracker-graphs__stat">
          <span className="tracker-graphs__stat-value">{stats.filled}/{daysInMonth}</span>
          <span className="tracker-graphs__stat-label">Days</span>
        </div>
      </div>

      {/* Graph */}
      <div className="tracker-graphs__chart-card">
        <div className="tracker-graphs__chart">
          {isLoading ? (
            <div className="tracker-graphs__loading">
              <div className="loading-spinner"></div>
              <span>Loading tracker data...</span>
            </div>
          ) : monthData.some(v => v !== null) ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="tracker-graphs__empty">
              <p>No data for {formatMonthYear()}</p>
              <span className="subtext">Start tracking to see trends!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackerGraphs;
