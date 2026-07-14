import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ApplicationDevelopment from './pages/ApplicationDevelopment';
import AIEcommerceSolution from './pages/AIEcommerceSolution';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/application-development" element={<ApplicationDevelopment />} />
        <Route path="/ai-ecommerce-solution" element={<AIEcommerceSolution />} />
      </Routes>
    </Router>
  );
}

export default App;
