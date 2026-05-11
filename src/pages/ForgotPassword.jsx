import React from 'react';
import { useNavigate } from 'react-router-dom';
import impulsoImage from '../assets/logo.png';
import '../styles/Login.css';

const ForgotPassword = () => {
    const navigate = useNavigate();

    return (
        <div className="login-page">
            <div className="container-forgot">
                <div className="container-image">
                    <h1>Seja bem-vindo de volta ao</h1>
                    <img src={impulsoImage} alt="Impulso" />
                </div>
                <div className="container-form-forgot">
                    <div className="header-title">
                        <h1>Esqueceu a senha?</h1>
                        <span className="underline"></span>
                        <p className="desc">Não se preocupe, iremos te ajudar</p>
                        <p className="desc">Digite seu email acadêmico para realizar a alteração de senha:</p>

                        <form onSubmit={(e) => { e.preventDefault(); navigate('/login'); }}>
                            <div className="input-container">
                                <i className="fas fa-envelope icon"></i>
                                <input
                                    type="email"
                                    placeholder="emailusuariounifacisa.com"
                                    name="email"
                                    required
                                />
                            </div>
                            <button type="submit">Enviar</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;