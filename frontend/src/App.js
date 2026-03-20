import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider }    from './context/AuthContext';
import { TeamProvider }    from './context/TeamContext';

import Header              from './components/header';
import Welcome             from './pages/home';
import Teams               from './pages/teams';
import TeamDetailPage      from './pages/teamDetailPages';
import ClubWorldCup        from './pages/clubWorldCup';
import ClubWorldCupPredict from './pages/clubWorldCupPredict';
import Stickerbook         from './pages/stickerbook';
import WorldCup2026        from './pages/worldCup2026';
import WorldCup2026Predict from './pages/WorldCup2026Predict';
import OpenPacksGame       from './pages/OpenPacksGame';
import SelectedMatchDrawer from './components/selectedMatchDrawer';
import Login               from './pages/Login';
import Register            from './pages/Register';

function App() {
  return (
    // AuthProvider (outer) — manages user, token, login, logout, updateUser
    // TeamProvider (inner) — reads user.favorite_team and keeps selectedTeam in sync
    // Router is inside both so all pages and Header can consume both contexts
    <AuthProvider>
      <TeamProvider>
        <div className="App">
          <Router>
            <Header />
            <Routes>
              {/* Onboarding / landing — redirects away once user has a team */}
              <Route path="/"         element={<Welcome />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Main app routes */}
              <Route path="/teams"                    element={<Teams />} />
              <Route path="/teams/:teamId"            element={<TeamDetailPage />} />
              <Route path="/club-world-cup"           element={<ClubWorldCup />} />
              <Route path="/club-world-cup/predict"   element={<ClubWorldCupPredict />} />
              <Route path="/world-cup-2026"           element={<WorldCup2026 />} />
              <Route path="/world-cup-2026/predict"  element={<WorldCup2026Predict />} />
              <Route path="/stickerbook"              element={<Stickerbook />} />
              <Route path="/open-packs"               element={<OpenPacksGame />} />
              <Route path="/club-world-cup/match/:id" element={<SelectedMatchDrawer />} />
            </Routes>
          </Router>
        </div>
      </TeamProvider>
    </AuthProvider>
  );
}

export default App;
