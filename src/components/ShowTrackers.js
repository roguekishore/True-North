import { useState, useEffect } from 'react';
import '../css/ShowTrackers.css';
import UnifiedTracker from '../trackers/UnifiedTracker';
import { trackerConfigs } from '../trackers/trackerConfig';
import SasMeds from './SasMeds';
import TrackerGraphs from './TrackerGraphs';

function ShowTrackers({ userId }) {
  const [showButton, setShowButton] = useState(false);
  const [activeTrackerId, setActiveTrackerId] = useState(trackerConfigs[0].id);
  const [activeView, setActiveView] = useState('tracker'); // 'tracker', 'graphs', 'charts'

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="show-trackers__container">
      {/* View Switcher - Minimal Tab Navigation */}
      <div className="show-trackers__view-switcher">
        <button
          className={`show-trackers__view-btn ${activeView === 'tracker' ? 'is-active' : ''}`}
          onClick={() => setActiveView('tracker')}
        >
          Input
        </button>
        <button
          className={`show-trackers__view-btn ${activeView === 'graphs' ? 'is-active' : ''}`}
          onClick={() => setActiveView('graphs')}
        >
          Graphs
        </button>
        <button
          className={`show-trackers__view-btn ${activeView === 'charts' ? 'is-active' : ''}`}
          onClick={() => setActiveView('charts')}
        >
          SAS / MEDS
        </button>
      </div>

      {/* Conditional View Rendering */}
      {activeView === 'tracker' && (
        <UnifiedTracker trackerId={activeTrackerId} onTrackerChange={setActiveTrackerId} userId={userId} />
      )}
      
      {activeView === 'graphs' && (
        <TrackerGraphs userId={userId} />
      )}
      
      {activeView === 'charts' && (
        <SasMeds userId={userId} />
      )}

      {showButton && (
        <button
          onClick={scrollToTop}
          className="back-to-top-button"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default ShowTrackers;
