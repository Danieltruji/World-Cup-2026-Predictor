import React from "react";
import { X, Clock, MapPin, Calendar, Play, Users, Target, AlertCircle, Trophy, Activity } from "lucide-react";
import '../pages/stylesheets/selectedMatchDrawer.css';

export default function SelectedMatchDrawer({ match, onClose }) {
  if (!match) return null;

  // Helper function to safely parse numbers
  const parseNum = (value) => parseInt(value) || 0;

  // Extract team names from the match event string
  const getTeamNames = (eventString) => {
    if (!eventString) return { homeTeam: 'Team A', awayTeam: 'Team B' };
    
    // Common patterns: "Team A vs Team B" or "Team A v Team B"
    const vsMatch = eventString.match(/^(.+?)\s+(?:vs?\.?|v)\s+(.+?)$/i);
    if (vsMatch) {
      return { 
        homeTeam: vsMatch[1].trim(), 
        awayTeam: vsMatch[2].trim() 
      };
    }
    
    // Fallback: split by common separators
    const parts = eventString.split(/\s*[-–—]\s*/);
    if (parts.length >= 2) {
      return { 
        homeTeam: parts[0].trim(), 
        awayTeam: parts[1].trim() 
      };
    }
    
    return { homeTeam: eventString, awayTeam: 'TBD' };
  };

  const { homeTeam, awayTeam } = getTeamNames(match.strEvent);
  
  // Check if match is live or finished
  const isLive = match.strStatus === 'Match Finished' || match.intHomeScore !== undefined || match.intAwayScore !== undefined;
  const homeScore = parseNum(match.intHomeScore);
  const awayScore = parseNum(match.intAwayScore);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div 
        className="drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawer-header">
          <div className="header-content">
            <div className="match-status-badge">
              <Play className="status-icon" />
              <span>{match.strStatus || 'Scheduled'}</span>
            </div>
            <h2 className="drawer-title">{match.strEvent}</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="drawer-body">
          {/* Score Section (for completed/live matches) */}
          {isLive && (
            <div className="score-section">
              <div className="team-score">
                <div className="team-name">{homeTeam}</div>
                <div className="score">{homeScore}</div>
              </div>
              <div className="score-divider">
                <div className="vs-text">VS</div>
              </div>
              <div className="team-score">
                <div className="team-name">{awayTeam}</div>
                <div className="score">{awayScore}</div>
              </div>
            </div>
          )}

          {/* Match Image */}
          {match.strThumb && (
            <div className="match-image-container">
              <img
                src={match.strThumb}
                alt={match.strEvent}
                className="drawer-image"
              />
            </div>
          )}

          {/* Basic Match Info */}
          <div className="match-info-grid">
            {match.dateEvent && (
              <div className="info-card">
                <Calendar className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Date</span>
                  <span className="info-value">{match.dateEvent}</span>
                </div>
              </div>
            )}

            {match.strTime && (
              <div className="info-card">
                <Clock className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Time</span>
                  <span className="info-value">{match.strTime}</span>
                </div>
              </div>
            )}

            {match.strVenue && (
              <div className="info-card">
                <MapPin className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Venue</span>
                  <span className="info-value">{match.strVenue}</span>
                </div>
              </div>
            )}

            {match.strLeague && (
              <div className="info-card">
                <Trophy className="info-icon" />
                <div className="info-content">
                  <span className="info-label">Competition</span>
                  <span className="info-value">{match.strLeague}</span>
                </div>
              </div>
            )}
          </div>

          {/* Match Statistics (for completed matches) */}
          {isLive && (
            <div className="stats-section">
              <h3 className="section-title">
                <Activity className="section-icon" />
                Match Statistics
              </h3>
              
              <div className="stats-grid">
                {/* Goals */}
                <div className="stat-row">
                  <div className="stat-home">{homeScore}</div>
                  <div className="stat-label">
                    <Target className="stat-icon" />
                    Goals
                  </div>
                  <div className="stat-away">{awayScore}</div>
                </div>

                {/* Additional stats if available */}
                {match.intHomeShots && match.intAwayShots && (
                  <div className="stat-row">
                    <div className="stat-home">{parseNum(match.intHomeShots)}</div>
                    <div className="stat-label">
                      <Target className="stat-icon" />
                      Shots
                    </div>
                    <div className="stat-away">{parseNum(match.intAwayShots)}</div>
                  </div>
                )}

                {match.intHomeShotsOnTarget && match.intAwayShotsOnTarget && (
                  <div className="stat-row">
                    <div className="stat-home">{parseNum(match.intHomeShotsOnTarget)}</div>
                    <div className="stat-label">
                      <Target className="stat-icon" />
                      Shots on Target
                    </div>
                    <div className="stat-away">{parseNum(match.intAwayShotsOnTarget)}</div>
                  </div>
                )}

                {match.intHomeCorners && match.intAwayCorners && (
                  <div className="stat-row">
                    <div className="stat-home">{parseNum(match.intHomeCorners)}</div>
                    <div className="stat-label">
                      <AlertCircle className="stat-icon" />
                      Corners
                    </div>
                    <div className="stat-away">{parseNum(match.intAwayCorners)}</div>
                  </div>
                )}

                {match.intHomeFouls && match.intAwayFouls && (
                  <div className="stat-row">
                    <div className="stat-home">{parseNum(match.intHomeFouls)}</div>
                    <div className="stat-label">
                      <AlertCircle className="stat-icon" />
                      Fouls
                    </div>
                    <div className="stat-away">{parseNum(match.intAwayFouls)}</div>
                  </div>
                )}

                {match.intHomeYellow && match.intAwayYellow && (
                  <div className="stat-row">
                    <div className="stat-home">{parseNum(match.intHomeYellow)}</div>
                    <div className="stat-label">
                      <div className="yellow-card"></div>
                      Yellow Cards
                    </div>
                    <div className="stat-away">{parseNum(match.intAwayYellow)}</div>
                  </div>
                )}

                {match.intHomeRed && match.intAwayRed && (
                  <div className="stat-row">
                    <div className="stat-home">{parseNum(match.intHomeRed)}</div>
                    <div className="stat-label">
                      <div className="red-card"></div>
                      Red Cards
                    </div>
                    <div className="stat-away">{parseNum(match.intAwayRed)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Goal Scorers Section */}
          {(match.strHomeGoalDetails || match.strAwayGoalDetails) && (
            <div className="goals-section">
              <h3 className="section-title">
                <Target className="section-icon" />
                Goal Scorers
              </h3>
              
              <div className="goals-grid">
                {match.strHomeGoalDetails && (
                  <div className="team-goals">
                    <h4 className="team-goals-title">{homeTeam}</h4>
                    <div className="goals-list">
                      {match.strHomeGoalDetails.split(';').map((goal, index) => (
                        <div key={index} className="goal-item">
                          {goal.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {match.strAwayGoalDetails && (
                  <div className="team-goals">
                    <h4 className="team-goals-title">{awayTeam}</h4>
                    <div className="goals-list">
                      {match.strAwayGoalDetails.split(';').map((goal, index) => (
                        <div key={index} className="goal-item">
                          {goal.trim()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team Lineups */}
          {(match.strHomeLineupGoalkeeper || match.strAwayLineupGoalkeeper) && (
            <div className="lineup-section">
              <h3 className="section-title">
                <Users className="section-icon" />
                Starting Lineups
              </h3>
              
              <div className="lineup-grid">
                {match.strHomeLineupGoalkeeper && (
                  <div className="team-lineup">
                    <h4 className="team-lineup-title">{homeTeam}</h4>
                    <div className="lineup-players">
                      {match.strHomeLineupGoalkeeper && (
                        <div className="player goalkeeper">GK: {match.strHomeLineupGoalkeeper}</div>
                      )}
                      {match.strHomeLineupDefense && 
                        match.strHomeLineupDefense.split(';').map((player, index) => (
                          <div key={index} className="player defender">DEF: {player.trim()}</div>
                        ))
                      }
                      {match.strHomeLineupMidfield && 
                        match.strHomeLineupMidfield.split(';').map((player, index) => (
                          <div key={index} className="player midfielder">MID: {player.trim()}</div>
                        ))
                      }
                      {match.strHomeLineupForward && 
                        match.strHomeLineupForward.split(';').map((player, index) => (
                          <div key={index} className="player forward">FWD: {player.trim()}</div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {match.strAwayLineupGoalkeeper && (
                  <div className="team-lineup">
                    <h4 className="team-lineup-title">{awayTeam}</h4>
                    <div className="lineup-players">
                      {match.strAwayLineupGoalkeeper && (
                        <div className="player goalkeeper">GK: {match.strAwayLineupGoalkeeper}</div>
                      )}
                      {match.strAwayLineupDefense && 
                        match.strAwayLineupDefense.split(';').map((player, index) => (
                          <div key={index} className="player defender">DEF: {player.trim()}</div>
                        ))
                      }
                      {match.strAwayLineupMidfield && 
                        match.strAwayLineupMidfield.split(';').map((player, index) => (
                          <div key={index} className="player midfielder">MID: {player.trim()}</div>
                        ))
                      }
                      {match.strAwayLineupForward && 
                        match.strAwayLineupForward.split(';').map((player, index) => (
                          <div key={index} className="player forward">FWD: {player.trim()}</div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

         {match.strVideo && (
  <div className="video-section">
    <h3 className="video-section-title">
      <Play className="section-icon" />
      Video Highlights
    </h3>
    <div className="video-wrapper">
      <iframe
        width="100%"
        height="315"
        src={match.strVideo.replace("watch?v=", "embed/")}
        title="Match Highlights"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  </div>
)}

     
          {/* Match Description */}
          {match.strDescriptionEN && (
            <div className="description-section">
              <h3 className="section-title">Match Report</h3>
              <div className="description-content">
                <p>{match.strDescriptionEN}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}