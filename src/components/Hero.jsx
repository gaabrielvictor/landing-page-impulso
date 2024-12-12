import React from 'react';
import '../styles/Hero.css';
import heroImage from '../assets/impulso.png';

const Hero = () => {
  return (
    <section id="hero" className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Todo projeto conta, <br /> e toda chance é aceita.
        </h1>
        <p className="hero-subtitle">
          O Impulso Unifacisa é uma plataforma inovadora para submissão e avaliação de projetos acadêmicos, 
          garantindo mais transparência, agilidade e oportunidades iguais a todos os participantes. 
          Facilitamos o processo seletivo de bolsas de estudo para que cada projeto tenha a chance de
          ser reconhecido pelo seu verdadeiro valor.
        </p>
        <div className="hero-buttons">
          <button className="hero-btn">Submeter seu projeto!</button>
          <button className="hero-button">Saiba Mais</button>
        </div>
      </div>
      <div className="hero-image">
        <img src={heroImage} alt="Ilustração do Hero" />
      </div>
    </section>
  );
};

export default Hero;
