import React from 'react';

export default function ContinentDropdown({ continent, teams, onSelectTeam }) {
  const handleSelect = (e) => {
    const teamId = e.target.value;
    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      if (team) onSelectTeam(team);
    }
  };

  return (
    <div className="continent-dropdown">
      <label>{continent}</label>
      <select onChange={handleSelect} defaultValue="">
        <option value="" disabled>Select a team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}