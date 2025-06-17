import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header';
import Welcome from './pages/home';
import Teams from './pages/teams';
import TeamDetailPage from './pages/teamDetailPages';



function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/teams" element={<Teams/>} />
        <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        {/* <Route path="/predict" element={<Predict />} /> */}
        {/* You can add more routes later */}
      </Routes>
    </Router>
  );
}
export default App;