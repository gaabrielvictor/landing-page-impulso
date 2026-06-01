import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import impulsoImage from "../assets/logo-branca.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/Login.css";
import { findUserByEmailAndPassword } from "../utils/api";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  //É uma expressão regular (regex) que valida o formato do e-mail,
  // garantindo que ele contenha um nome de usuário, seguido por um símbolo "@" e um domínio válido. (FEITA POR GABRIEL (COM AUXILIO DO CLAUDE CODE))
  const validate = () => {
    const errs = {};
    if (!email) errs.email = "Informe o e-mail";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "E-mail inválido";
    if (!password) errs.password = "Informe a senha";
    else if (password.length < 6) errs.password = "Mínimo 6 caracteres";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const result = await findUserByEmailAndPassword(email, password);
    setLoading(false);
    if (!result.ok) {
      setLoginError(result.error || "E-mail ou senha incorretos.");
      return;
    }
    const user = result.user;
    if (user.role === "admin" || user.role === "professor") {
      localStorage.removeItem("impulso_usuario_logado");
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("professorEmail", user.email);
      navigate("/admin");
    } else {
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("professorEmail");
      localStorage.setItem(
        "impulso_usuario_logado",
        JSON.stringify({
          email: user.email,
          name: user.name,
          instituicao: user.instituicao || "",
        }),
      );
      navigate("/aluno");
    }
  };

  return (
    <div className="login-page">
      <div className="container-forgot">
        <div className="container-image">
          <h1>Seja bem-vindo de volta ao</h1>
          <img src={impulsoImage} alt="Impulso" />
        </div>

        <div className="container-form-forgot">
          <div className="header-title">
            <h1>Realize seu login:</h1>
            <span className="underline"></span>

            {loginError && (
              <p
                style={{ color: "red", fontSize: "13px", marginBottom: "8px" }}
              >
                <i
                  className="fas fa-exclamation-circle"
                  style={{ marginRight: "6px" }}
                ></i>
                {loginError}
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <h1 className="title-form">Email</h1>
              <div className="input-container">
                <i className="fas fa-envelope icon"></i>
                <input
                  type="email"
                  placeholder="emailusuariounifacisa.com"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && (
                <p style={{ color: "red", fontSize: "12px" }}>{errors.email}</p>
              )}

              <h1 className="title-form">Senha</h1>
              <div className="input-container">
                <i className="fas fa-lock icon"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="..........."
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} toggle-password-icon`}
                  onClick={togglePasswordVisibility}
                ></i>
              </div>
              {errors.password && (
                <p style={{ color: "red", fontSize: "12px" }}>
                  {errors.password}
                </p>
              )}

              <a
                onClick={() => navigate("/esqueceu-senha")}
                style={{ cursor: "pointer" }}
              >
                <p className="desc">Esqueceu a senha?</p>
              </a>

              <div className="btn-container">
                <button type="submit" disabled={loading}>
                  {loading ? "VERIFICANDO..." : "LOGIN"}
                </button>
                <button
                  type="button"
                  className="btn-registrar"
                  onClick={() => navigate("/registrar")}
                >
                  REGISTRAR-SE
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
