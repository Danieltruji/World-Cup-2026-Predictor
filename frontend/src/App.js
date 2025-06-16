import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header';
import Welcome from './pages/home';


function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Welcome />} />
        {/* You can add more routes later */}
      </Routes>
    </Router>
  );
}

export default App;