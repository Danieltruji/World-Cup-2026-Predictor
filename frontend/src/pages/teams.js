import React, { useState, useMemo, useEffect } from 'react';
import './stylesheets/teams.css';
import TeamSlidePanel from '../components/teamSlidePanel';
import teamsByContinent from '../data/teamInfo';
import ContinentDropdown from '../components/ContinentDropdown';

export default function Teams() {
  // Original state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [viewMode, setViewMode] = useState('dropdown'); // 'dropdown' or 'grid'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'continent', 'appearances'
  const [favoriteTeams, setFavoriteTeams] = useState(() => {
    const saved = localStorage.getItem('favoriteTeams');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = localStorage.getItem('recentlyViewed');
    return saved ? JSON.parse(saved) : [];
  });
  const [hoveredTeam, setHoveredTeam] = useState(null);
  const [selectedTeamsForComparison, setSelectedTeamsForComparison] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Get all teams with continent info
  const allTeams = useMemo(() => {
    const teams = [];
    Object.entries(teamsByContinent).forEach(([continent, continentTeams]) => {
      continentTeams.forEach(team => {
        teams.push({ ...team, continent });
      });
    });
    return teams;
  }, []);

  // Filter and sort teams
  const filteredAndSortedTeams = useMemo(() => {
    let filtered = allTeams;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.continent.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by continent
    if (selectedContinent !== 'all') {
      filtered = filtered.filter(team => team.continent === selectedContinent);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(team => 
        favoriteTeams.some(fav => fav.id === team.id)
      );
    }

    // Sort teams
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'continent':
          return a.continent.localeCompare(b.continent) || a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [allTeams, searchTerm, selectedContinent, sortBy, showFavoritesOnly, favoriteTeams]);

  // Handle team selection
  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
    setIsPanelVisible(true);
    addToRecentlyViewed(team);
  };

  // Handle panel close
  const handleClosePanel = () => {
    setIsPanelVisible(false);
    setTimeout(() => setSelectedTeam(null), 300);
  };

  // Add to recently viewed
  const addToRecentlyViewed = (team) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(t => t.id !== team.id);
      const updated = [team, ...filtered].slice(0, 5);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      return updated;
    });
  };

  // Toggle favorite
  const toggleFavorite = (team, e) => {
    e.stopPropagation();
    setFavoriteTeams(prev => {
      const isFavorite = prev.some(fav => fav.id === team.id);
      const updated = isFavorite
        ? prev.filter(fav => fav.id !== team.id)
        : [...prev, team];
      localStorage.setItem('favoriteTeams', JSON.stringify(updated));
      return updated;
    });
  };

  // Toggle team comparison
  const toggleTeamComparison = (team, e) => {
    e.stopPropagation();
    setSelectedTeamsForComparison(prev => {
      if (prev.find(t => t.id === team.id)) {
        return prev.filter(t => t.id !== team.id);
      } else if (prev.length < 3) {
        return [...prev, team];
      }
      return prev;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isPanelVisible) {
        handleClosePanel();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPanelVisible]);

  // Team card component
  const TeamCard = ({ team }) => {
    const isFavorite = favoriteTeams.some(fav => fav.id === team.id);
    const isSelected = selectedTeamsForComparison.some(t => t.id === team.id);
    
    return (
      <div 
        className={`team-card ${isSelected ? 'selected-for-comparison' : ''}`}
        onClick={() => handleSelectTeam(team)}
        onMouseEnter={() => setHoveredTeam(team)}
        onMouseLeave={() => setHoveredTeam(null)}
        style={{
          background: team.colors 
            ? `linear-gradient(135deg, ${team.colors[0]}, ${team.colors[1] || team.colors[0]})`
            : '#374151',
        }}
      >
        <div className="team-card-header">
          <h3>{team.name}</h3>
          <div className="team-card-actions">
            <button
              className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
              onClick={(e) => toggleFavorite(team, e)}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '★' : '☆'}
            </button>
            <button
              className={`compare-btn ${isSelected ? 'selected' : ''}`}
              onClick={(e) => toggleTeamComparison(team, e)}
              title="Add to comparison"
              disabled={!isSelected && selectedTeamsForComparison.length >= 3}
            >
              {isSelected ? '✓' : '+'}
            </button>
          </div>
        </div>
        <p className="team-continent">{team.continent}</p>
        <p className="team-history-preview">
          {team.history.substring(0, 80)}...
        </p>
      </div>
    );
  };

  // Quick stats tooltip
  const QuickStatsTooltip = ({ team }) => {
    if (!team) return null;
    
    return (
      <div className="quick-stats-tooltip">
        <h4>{team.name}</h4>
        <p><strong>Continent:</strong> {team.continent}</p>
        <p><strong>History:</strong> {team.history}</p>
      </div>
    );
  };

  return (
    <div className="teams-page">
      <header className="teams-header">
        <h1>Explore Teams</h1>
        
        {/* Search and filters */}
        <div className="teams-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search teams or continents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <select
              value={selectedContinent}
              onChange={(e) => setSelectedContinent(e.target.value)}
              className="continent-filter"
            >
              <option value="all">All Continents</option>
              {Object.keys(teamsByContinent).map(continent => (
                <option key={continent} value={continent}>{continent}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="continent">Sort by Continent</option>
            </select>
            
            <button
              className={`favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div className="view-toggle">
          <button
            className={viewMode === 'dropdown' ? 'active' : ''}
            onClick={() => setViewMode('dropdown')}
          >
            Dropdown View
          </button>
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
          >
            Grid View
          </button>
        </div>
      </header>

      {/* Recently viewed */}
      {recentlyViewed.length > 0 && (
        <div className="recently-viewed">
          <h3>Recently Viewed</h3>
          <div className="recent-teams">
            {recentlyViewed.map(team => (
              <button
                key={team.id}
                className="recent-team-btn"
                onClick={() => handleSelectTeam(team)}
                style={{
                  background: team.colors?.[0] || '#374151',
                  color: 'white'
                }}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison bar */}
      {selectedTeamsForComparison.length > 0 && (
        <div className="comparison-bar">
          <div className="comparison-teams">
            <span>Compare: </span>
            {selectedTeamsForComparison.map(team => (
              <span key={team.id} className="comparison-team">
                {team.name}
                <button onClick={(e) => toggleTeamComparison(team, e)}>×</button>
              </span>
            ))}
          </div>
          {selectedTeamsForComparison.length >= 2 && (
            <button className="compare-btn-action">
              Compare Teams
            </button>
          )}
        </div>
      )}

      <div className="teams-content">
        {viewMode === 'dropdown' ? (
          // Original dropdown view
          <div className="teams-dropdowns">
            {Object.entries(teamsByContinent)
              .filter(([continent]) => 
                selectedContinent === 'all' || selectedContinent === continent
              )
              .map(([continent, teams]) => (
                <ContinentDropdown
                  key={continent}
                  continent={continent}
                  teams={teams.filter(team =>
                    !searchTerm || 
                    team.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )}
                  onSelectTeam={handleSelectTeam}
                />
              ))}
          </div>
        ) : (
          // Grid view
          <div className="teams-grid">
            {filteredAndSortedTeams.length > 0 ? (
              filteredAndSortedTeams.map(team => (
                <TeamCard key={team.id} team={team} />
              ))
            ) : (
              <div className="no-teams-found">
                <p>No teams found matching your criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Quick stats tooltip */}
        {hoveredTeam && viewMode === 'grid' && (
          <QuickStatsTooltip team={hoveredTeam} />
        )}

        {/* Team slide panel */}
        {selectedTeam && (
          <TeamSlidePanel
            team={selectedTeam}
            onClose={handleClosePanel}
            isVisible={isPanelVisible}
          />
        )}
      </div>

      {/* Results count */}
      <div className="results-info">
        {viewMode === 'grid' && (
          <p>{filteredAndSortedTeams.length} teams found</p>
        )}
      </div>
    </div>
  );
}