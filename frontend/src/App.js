import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header';
import Welcome from './pages/home';
import Teams from './pages/teams';
import TeamDetailPage from './pages/teamDetailPages';
import ClubWorldCup from './pages/clubWorldCup';
import ClubWorldCupPredict from './pages/clubWorldCupPredict';
import Stickerbook from './pages/stickerbook';
import WorldCup2026 from './pages/worldCup2026';
import OpenPacksGame from './pages/OpenPacksGame';
import SelectedMatchDrawer from './components/selectedMatchDrawer';



function App() {
  return (
  <div className="App">
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/teams" element={<Teams/>} />
        <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        <Route path="/club-world-cup" element={<ClubWorldCup />} />
        <Route path="/club-world-cup/predict" element={<ClubWorldCupPredict />} />
        <Route path="/world-cup-2026" element={<WorldCup2026 />}/>
        <Route path="/stickerbook" element={<Stickerbook/>} />
        <Route path="/open-packs" element={<OpenPacksGame />} />
        <Route path="/club-world-cup/match/:id" element={<SelectedMatchDrawer />} />
      </Routes>
    </Router>
    </div>
  );
}
export default App;