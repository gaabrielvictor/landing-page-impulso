import React from 'react';
import '../styles/EvaluationCriteria.css';
import EvalutionImg from '../assets/evaluation.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-regular-svg-icons';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { faEarthAmericas } from '@fortawesome/free-solid-svg-icons';
import { faBullseye } from '@fortawesome/free-solid-svg-icons';

const EvaluationCriteria = () => {
    return (
        <section className="evaluation-criteria">
            <div className="criteria-content">
                <h2 className="criteria-title">Critérios de Avaliação</h2>
                <p className="criteria-description">
                    Estes critérios serão avaliados para determinar a estratégia de pesquisa e desenvolvimento do novo produto.
                </p>
                <div className="criteria-steps">
                    <div className="step-row">
                        <div className="step-criteria">
                            <span className="step-number"><FontAwesomeIcon icon={faLightbulb} size="3x" color="#06377b" /></span>

                            <p className="step-description">Projetos inovadores que trazem novas ideias.</p>
                        </div>
                        <div className="step-criteria">
                            <span className="step-number"><FontAwesomeIcon icon={faGear} size="3x" color="#06377b" /></span>
                            <p className="step-description">A execução prática e a capacidade de implementação são fatores importantes.</p>
                        </div>
                    </div>
                    <div className="step-row">
                        <div className="step-criteria">
                            <span className="step-number"><FontAwesomeIcon icon={faEarthAmericas} size="3x" color="#06377b" /></span>
                            <p className="step-description">Consideramos o potencial de impacto positivo na sociedade e na comunidade acadêmica.</p>
                        </div>
                        <div className="step-criteria">
                            <span className="step-number"><FontAwesomeIcon icon={faBullseye} size="3x" color="#06377b" /></span>
                            <p className="step-description">Projetos alinhados com as necessidades atuais e futuras das áreas de estudo são priorizados</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="criteria-image">
                <img
                    src={EvalutionImg}
                    alt="Critérios de Avaliação"
                />
            </div>
        </section>
    );
};

export default EvaluationCriteria;
