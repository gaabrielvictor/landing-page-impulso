import React from 'react';
import '../styles/Benefits.css';
import BenefitsImg from '../assets/benefits.png'

const Benefits = () => {
    return (
        <section className="benefits-section">
            <div className="benefits-image">
                <img src={BenefitsImg} />
            </div>
            <div className="benefits-content">
                <h2 className="benefits-title">Benefícios da Plataforma</h2>
                <p className="benefits-text">
                    Com o Impulso Unifacisa, você aproveita uma plataforma projetada para tornar
                    o processo de submissão de projetos mais simples e eficiente. Oferecemos
                    transparência total em cada etapa da avaliação, garantindo agilidade na entrega
                    de resultados e igualdade de oportunidades para todos os participantes.
                    Aqui, cada projeto tem a chance de ser reconhecido pelo seu verdadeiro valor,
                    com um sistema acessível e intuitivo que facilita sua jornada acadêmica.
                </p>
            </div>
        </section>
    );
};

export default Benefits;
