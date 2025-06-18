import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header';
import Welcome from './pages/home';
import Teams from './pages/teams';
import TeamDetailPage from './pages/teamDetailPages';
import ClubWorldCup from './pages/clubWorldCup';
import ClubWorldCupPredict from './pages/clubWorldCupPredict';


function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/teams" element={<Teams/>} />
        <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        <Route path="/club-world-cup" element={<ClubWorldCup />} />
        <Route path="/club-world-cup/predict" element={<ClubWorldCupPredict />} />
        {/* <Route path="/predict" element={<Predict />} /> */}
        {/* You can add more routes later */}
      </Routes>
    </Router>
  );
}
export default App;