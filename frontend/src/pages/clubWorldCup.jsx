import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Calendar, Users, Play, Clock, ChevronRight, Star } from "lucide-react";
import SelectedMatchDrawer from '../components/selectedMatchDrawer';
import '../pages/stylesheets/clubWorldCup.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

const groupedTeams = {
  "Group A": ["SE Palmeiras (BRA)", "FC Porto (POR)", "Al Ahly FC (EGY)", "Inter Miami CF (USA)"],
  "Group B": ["Paris St. Germain (FRA)", "Atlético Madrid (ESP)", "Botafogo (BRA)", "Seattle Sounders (USA)"],
  "Group C": ["Bayern München (GER)", "Auckland City FC (NZL)", "CA Boca Juniors (ARG)", "SL Benfica (POR)"],
  "Group D": ["CR Flamengo (BRA)", "Espérance Tunis (TUN)", "Chelsea FC (ENG)", "Club León (MEX)"],
  "Group E": ["CA River Plate (ARG)", "Urawa Reds D. (JPN)", "CF Monterrey (MEX)", "FC Inter Milan (ITA)"],
  "Group F": ["Fluminense FC (BRA)", "Borussia Dortmund (GER)", "Ulsan HD FC (KOR)", "Mamelodi Sundowns (RSA)"],
  "Group G": ["Manchester City (ENG)", "Wydad AC (MAR)", "Al Ain FC (UAE)", "Juventus FC (ITA)"],
  "Group H": ["Real Madrid CF (ESP)", "Al Hilal SFC (KSA)", "CF Pachuca (MEX)", "FC Salzburg (AUT)"]
};

const getCountryFlag = (code) => {
  const flags = {
    'BRA': '🇧🇷', 'POR': '🇵🇹', 'EGY': '🇪🇬', 'USA': '🇺🇸',
    'FRA': '🇫🇷', 'ESP': '🇪🇸', 'GER': '🇩🇪', 'NZL': '🇳🇿',
    'ARG': '🇦🇷', 'TUN': '🇹🇳', 'ENG': '🏴', 'MEX': '🇲🇽',
    'JPN': '🇯🇵', 'ITA': '🇮🇹', 'KOR': '🇰🇷', 'RSA': '🇿🇦',
    'MAR': '🇲🇦', 'UAE': '🇦🇪', 'KSA': '🇸🇦', 'AUT': '🇦🇹'
  };
  return flags[code] || '🏳️';
};

const extractCountryCode = (teamName) => {
  const match = teamName.match(/\(([^)]+)\)$/);
  return match ? match[1] : '';
};

export default function ClubWorldCup() {
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('live');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const upcomingRes = await fetch(`${backendUrl}/upcoming_matches`);
        const upcomingData = await upcomingRes.json();
        if (upcomingData.matches) {
          setUpcomingMatches(upcomingData.matches.slice(0, 5));
        }

        const liveRes = await fetch(`${backendUrl}/live_scores`);
        const liveData = await liveRes.json();
        if (liveData.events) {
          setLiveMatches(liveData.events.slice(0, 5));
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMatchClick = async (match) => {

    setIsLoading(true);

    const eventId = match.idEvent;


    
    try {
      const detailedRes = await fetch(`${backendUrl}/match/${eventId}`);
      const detailedData = await detailedRes.json();
      const fullMatch = detailedData.events?.[0];

      if (fullMatch) {
        setSelectedMatch(fullMatch);
        setIsDrawerOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch match details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedMatch(null);
  };

  const MatchCard = ({ match, isLive }) => (
    <div className={`match-card ${isLive ? 'live' : 'upcoming'}`} onClick={() => handleMatchClick(match)}>
      <div className="match-header">
        <div className={`match-status ${isLive ? 'live' : 'upcoming'}`}>
          {isLive ? <Play className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          {isLive ? 'LIVE' : 'UPCOMING'}
        </div>
        <span className="match-date">{match.dateEvent}</span>
      </div>
      <h3 className="match-title">{match.strEvent}</h3>
      {isLive ? (
        <div className="score-display">
          <span className="score-number">{match.intHomeScore ?? 0}</span>
          <span className="score-separator">-</span>
          <span className="score-number">{match.intAwayScore ?? 0}</span>
        </div>
      ) : (
        match.strTime && (
          <div className="match-time">
            <Clock className="w-4 h-4" />
            <span>{match.strTime}</span>
          </div>
        )
      )}
    </div>
  );

  const GroupCard = ({ groupName, teams, isSelected, onClick }) => (
    <div className={`group-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
      <div className="group-header">
        <h3 className="group-title"><Trophy className="w-5 h-5 text-yellow-600" />{groupName}</h3>
        <ChevronRight className={`group-chevron ${isSelected ? 'rotated' : ''}`} />
      </div>
      <div className={`teams-container ${isSelected ? 'expanded' : 'collapsed'}`}>
        <div className="teams-list">
          {teams.map((team, idx) => {
            const code = extractCountryCode(team);
            const name = team.replace(/\s*\([^)]*\)$/, '');
            return (
              <div key={idx} className="team-item">
                <span className="team-flag">{getCountryFlag(code)}</span>
                <span className="team-name">{name}</span>
                <span className="team-country">({code})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading Club World Cup data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dynamic-club-world-cup-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-title"><h1>FIFA Club World Cup 2025</h1></div>
          <div className="stats-bar">
            <div className="stat-item"><div className="stat-number">32</div><div className="ClubStat-label">Teams</div></div>
            <div className="stat-item"><div className="stat-number">8</div><div className="ClubStat-label">Groups</div></div>
            <div className="stat-item"><div className="stat-number">6</div><div className="ClubStat-label">Continents</div></div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="main-content">
          <section className="section">
            <div className="section-header"><Calendar className="w-8 h-8 text-blue-600" /><h2>Matches</h2></div>
            <div className="tab-navigation">
              <button onClick={() => setActiveTab('live')} className={`tab-button ${activeTab === 'live' ? 'active-live' : 'inactive'}`}><Play className="w-4 h-4" />Live/Recent</button>
              <button onClick={() => setActiveTab('upcoming')} className={`tab-button ${activeTab === 'upcoming' ? 'active-upcoming' : 'inactive'}`}><Clock className="w-4 h-4" />Upcoming</button>
            </div>
            <div className="matches-grid">
              {(activeTab === 'live' ? liveMatches : upcomingMatches).map((match, i) => (
                <MatchCard key={i} match={match} isLive={activeTab === 'live'} />
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-header"><Users className="w-8 h-8 text-green-600" /><h2>Participating Teams</h2></div>
            <div className="groups-grid">
              {Object.entries(groupedTeams).map(([group, teams]) => (
                <GroupCard
                  key={group}
                  groupName={group}
                  teams={teams}
                  isSelected={selectedGroup === group}
                  onClick={() => setSelectedGroup(selectedGroup === group ? null : group)}
                />
              ))}
            </div>
          </section>

          <section className="section">
            <div className="prediction-section">
              <Star className="prediction-icon" />
              <h2>Make Your Predictions</h2>
              <p>Think you know who will lift the trophy? Create your bracket and compete with friends!</p>
              <Link to="/club-world-cup/predict" className="prediction-button">Start Predicting<ChevronRight className="w-5 h-5" /></Link>
            </div>
          </section>
        </div>
      </div>

      {isDrawerOpen && selectedMatch && (
        <SelectedMatchDrawer match={selectedMatch} onClose={handleDrawerClose} />
      )}
    </div>
  );
}
