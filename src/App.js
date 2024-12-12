import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import EvaluationCriteria from './components/EvaluationCriteria';
import Benefits from './components/Benefits';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div>
      <Header />
      <Hero />
      <HowItWorks />
      <EvaluationCriteria/>
      <Benefits/>
      <Footer/>
    </div>
  );
}

export default App;
