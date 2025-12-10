import React from "react";
import { useNavigate } from "react-router-dom";
import FloatingNavbar from "./FloatingNavbar";
import '../css/TrackerTemplate.css';

const TrackerTemplate = ({ trackerComponent: TrackerComponent, userId }) => {
  const navigate = useNavigate();

  return (
    <div>
    <div className="tracker-template-container">
      <button 
        className="back-button" 
        onClick={() => navigate(-1)} 
      >
        ← Back
      </button></div>
      <div className="tracker-content">
        <TrackerComponent userId={userId} />
      </div>
      <FloatingNavbar></FloatingNavbar>
    </div>
  );
};

export default TrackerTemplate;