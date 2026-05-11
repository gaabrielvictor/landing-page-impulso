import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import EvaluationCriteria from './components/EvaluationCriteria';
import Benefits from './components/Benefits';
import Footer from './components/Footer';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';

function HomePage() {
  return (
    <div>
      <Header />
      <Hero />
      <HowItWorks />
      <EvaluationCriteria />
      <Benefits />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/landing-page-impulso">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueceu-senha" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;