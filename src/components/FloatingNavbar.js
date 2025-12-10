import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBook } from "react-icons/fa";
import "../css/FloatingNavbar.css";
import { trackerConfigs } from "../trackers/trackerConfig";

function FloatingNavbar() {
  const navigate = useNavigate();

  const entries = [
    { id: "journal", title: "Journal", icon: FaBook, route: "/journal" },
    ...trackerConfigs.map((tracker) => ({
      id: tracker.id,
      title: tracker.title.replace(" Tracker", ""),
      icon: tracker.icon,
      route: `/trackers/${tracker.id}`,
    })),
  ];

  return (
    <div>
      <nav className="floating-navbar">
        <div className="floating-navbar-container">
          {/* Dynamic rendering of tracker buttons */}
          {entries.map((entry) => (
            <button
              key={entry.id}
              className="floating-nav-button"
              onClick={() => navigate(entry.route)}
            >
              {entry.icon ? <entry.icon /> : null}
              <span className="floating-nav-label">{entry.title}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default FloatingNavbar;
