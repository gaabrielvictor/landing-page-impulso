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
import Register from './pages/Register';
import ProfessorPanel from './pages/ProfessorPanel';
import AlunoPanel from './pages/AlunoPanel';
import ComoFunciona from './pages/ComoFunciona';
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
//CRIADO UMA ROTA PARA A PÁGINA DE LOGIN E ESQUECI MINHA SENHA DENTRO DO APP.JS, 
// BASTA CLICAR NO BOTÃO "ENTRAR" PARA SER REDIRECIONADO PARA A PÁGINA DE LOGIN, E NA PÁGINA DE LOGIN TEM UM LINK "ESQUECI MINHA SENHA" 
// PARA SER REDIRECIONADO PARA A PÁGINA DE ESQUECI MINHA SENHA (FEITO POR BRUNO)
function App() {
  return (
    <BrowserRouter basename="/landing-page-impulso">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registrar" element={<Register />} />
        <Route path="/esqueceu-senha" element={<ForgotPassword />} />
        <Route path="/admin" element={<ProfessorPanel />} />
        <Route path="/aluno" element={<AlunoPanel />} />
        <Route path="/como-funciona" element={<ComoFunciona />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;