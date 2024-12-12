import React from 'react';
import '../styles/HowItWorks.css';
import heroImage from '../assets/HowItWorks.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="how-it-works">
      <div className="how-it-works-content">
        <div className="how-it-works-image">
          <img src={heroImage} alt="Imagem ilustrativa" />
        </div>
        <div className="how-it-works-text">
          <h2 className="section-title">Como Funciona a Plataforma</h2>
          <p className="section-description">
          O Impulso Unifacisa simplifica o processo de submissão e avaliação de projetos acadêmicos.
           Siga os passos abaixo para participar:
          </p>
          <div className="steps">
            <div className="step">
            <FontAwesomeIcon icon={faPen} size="2x" color="#06377b" />
              <p className="step-description">
              <strong>Inscrição:</strong> Crie sua conta e submeta seu projeto.
              </p>
            </div>
            <div className="step">
            <FontAwesomeIcon icon={faBookOpen} size="2x" color="#06377b" />
              <p className="step-description">
              <strong>Avaliação:</strong> Seu projeto será analisado por um comitê especializado, que levará em conta os critérios de originalidade, impacto e viabilidade.
              </p>
            </div>
            <div className="step">
            <FontAwesomeIcon icon={faCircleCheck} size="2x" color="#06377b" />
              <p className="step-description">
              <strong>Resultado:</strong> Receba feedback detalhado e acompanhe o progresso da sua submissão diretamente pela plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
