import React from "react";
import { Link } from "react-router-dom";


const TeamSlidePanel = ({ team, onClose, isVisible }) => {
    const backgroundStyle = {
      background: team.colors
        ? `linear-gradient(to bottom, ${team.colors.join(", ")})`
        : "#1f2937",
    };
  
    return (
      <div
        className={`slide-panel ${isVisible ? "slide-in" : "slide-out"}`}
        style={backgroundStyle}
      >
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "black",
            color: "white",
            fontSize: "2rem",
            position: "absolute",
            top: "1rem",
            right: "1rem",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        <h2>{team.name}</h2>
        <p>{team.history}</p>
        <Link to={`/teams/${team.id}`} style={{ color: "white", textDecoration: "underline" }}>
          View Full History
        </Link>
      </div>
    );
  };
  
  export default TeamSlidePanel;
  