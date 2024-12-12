import React from 'react';
import '../styles/Footer.css';
import ImpulsoLogo from '../assets/logo.png';
import UnifacisaLogo from '../assets/unifacisa.png';
import AppleLogo from '../assets/apple.png';
import GooglePlayLogo from '../assets/google-play-badge.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
    return (
        <footer className="footer">
          
            <div className="footer-images-section">
                <div className="image-container left-image">
                    <img src={ImpulsoLogo} alt="Impulso Logo" />
                </div>

                <div className="image-container right-image">
                    <img src={UnifacisaLogo} alt="Unifacisa Logo" />
                </div>
            </div>

            <span className="underline"></span>

          
            <div className="footer-columns">
             
                <div className="footer-column">
                    <h4>Contato</h4>
                    <p>Email: contato@exemplo.com</p>
                    <p>Telefone: (83) 99999-9999</p>
                </div>

               
                <div className="footer-column">
                    <h4>Sobre Nós</h4>
                    <p>
                        Somos uma plataforma que visa a inovação acadêmica,
                        promovendo igualdade e oportunidades para todos os projetos.
                    </p>
                </div>

              
                <div className="footer-column">
                    <h4>Política de Privacidade</h4>
                    <p>
                        Confira nossos termos de uso e política de privacidade
                        <strong><a> +</a></strong>
                    </p>

                </div>

                
                <div className="footer-column">
                    <h4>Baixe agora o App!</h4>
                    <div className="partner-images">
                        <img src={AppleLogo} alt="Parceiro 1" />
                        <img src={GooglePlayLogo} alt="Parceiro 2" />
                    </div>
                    <h4>Redes Sociais</h4>
                    <div className="social-icons">
                        <FontAwesomeIcon icon={faYoutube} />
                        <FontAwesomeIcon icon={faFacebook} />
                        <FontAwesomeIcon icon={faTwitter} />
                        <FontAwesomeIcon icon={faInstagram} />
                        <FontAwesomeIcon icon={faLinkedin} />
                    </div>
                </div>
            </div>
            <span className="underline2"></span>
            <div className="footer-bottom">
                <p>Impulso Unifacisa | &copy; 2024 - Todos os direitos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;
