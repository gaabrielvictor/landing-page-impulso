import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import logo from '../assets/logo.png';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="logo">
        <img src={logo} alt="Impulso Unifacisa" />
      </div>
      <button className="entrar-button" onClick={() => navigate('/login')}>
        Entrar
      </button>
    </header>
  );
};

export default Header;