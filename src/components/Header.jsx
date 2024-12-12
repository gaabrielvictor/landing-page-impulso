import React from 'react';
import '../styles/Header.css';
import logo from '../assets/logo.png';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <img src={logo} alt="Impulso Unifacisa" />
      </div>
      <button className="entrar-button">Entrar</button>
    </header>
  );
};

export default Header;
