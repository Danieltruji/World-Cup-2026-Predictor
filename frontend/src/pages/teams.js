import React from 'react';
import { useState } from 'react';
import './stylesheets/teams.css'; // reuse global styles if needed
import TeamSlidePanel from '../components/teamSlidePanel';
import teamsByContinent from '../data/teamInfo';
import ContinentDropdown from '../components/ContinentDropdown';


export default function Teams() {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isPanelVisible, setIsPanelVisible] = useState(false);
  
    const handleSelectTeam = (team) => {
      setSelectedTeam(team);
      setIsPanelVisible(true);
    };
  
    const handleClosePanel = () => {
      setIsPanelVisible(false);
      // Wait for animation to finish before clearing the selected team
      setTimeout(() => setSelectedTeam(null), 300); // match animation duration
    };
  
    return (
      <div className="teams-page">
        <h1>Explore Teams</h1>
  
        <div className="teams-content">
          <div className="teams-dropdowns">
            {Object.entries(teamsByContinent).map(([continent, teams]) => (
              <ContinentDropdown
                key={continent}
                continent={continent}
                teams={teams}
                onSelectTeam={handleSelectTeam}
              />
            ))}
          </div>
  
          {selectedTeam && (
            <TeamSlidePanel
              team={selectedTeam}
              onClose={handleClosePanel}
              isVisible={isPanelVisible}
            />
          )}
        </div>
      </div>
    );
  }
  