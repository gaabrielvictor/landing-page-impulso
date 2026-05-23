import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import impulsoImage from "../assets/logo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/Login.css";
import { registerUser } from "../utils/api";
import BirthDatePicker from "../components/BirthDatePicker";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sexo, setSexo] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  /** @type {'' | 'aluno' | 'professor'} */
  const [tipoCadastro, setTipoCadastro] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Informe seu nome completo";
    else if (name.trim().length < 3) errs.name = "Mínimo 3 caracteres";

    if (!birthDate) errs.birthDate = "Informe a data de nascimento";
    else {
      const d = new Date(`${birthDate}T12:00:00`);
      const today = new Date();
      if (Number.isNaN(d.getTime())) errs.birthDate = "Data inválida";
      else if (d > today) errs.birthDate = "A data não pode ser no futuro";
      else {
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
        if (age < 14) errs.birthDate = "É necessário ter pelo menos 14 anos";
        if (age > 110) errs.birthDate = "Verifique a data informada";
      }
    }

    if (!sexo) errs.sexo = "Selecione o sexo";
    if (!tipoCadastro)
      errs.tipoCadastro = "Selecione se você é aluno ou professor";
    if (!instituicao.trim()) errs.instituicao = "Informe seu curso ";
    else if (instituicao.trim().length < 3)
      errs.instituicao = "Mínimo 3 caracteres";

    if (!email) errs.email = "Informe o e-mail";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "E-mail inválido";
    if (!password) errs.password = "Informe a senha";
    else if (password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (!confirmPassword) errs.confirmPassword = "Confirme a senha";
    else if (confirmPassword !== password)
      errs.confirmPassword = "As senhas não coincidem";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const result = await registerUser({
      name: name.trim(),
      birthDate,
      sexo,
      instituicao: instituicao.trim(),
      email: email.trim(),
      password,
      role: tipoCadastro,
    });
    setLoading(false);
    if (!result.ok) {
      if (result.error === "duplicate_email") {
        setErrors({ email: "Este e-mail já está cadastrado." });
      } else {
        setErrors({
          email: result.error || "Não foi possível concluir o cadastro.",
        });
      }
      return;
    }
    navigate("/login");
  };

  return (
    <div className="login-page register-page">
      <div className="container-forgot">
        <div className="container-image">
          <h1>Faça parte do</h1>
          <img src={impulsoImage} alt="Impulso" />
        </div>

        <div className="container-form-forgot">
          <div className="header-title">
            <h1>Crie sua conta:</h1>
            <span className="underline"></span>
            <p className="desc">
              Escolha o tipo de cadastro, preencha seus dados pessoais,
              instituição de ensino e e-mail acadêmico para criar sua conta na
              plataforma.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="register-perfil-block">
                <h1 className="title-form">Tipo de cadastro</h1>
                <p className="register-perfil-hint">
                  Escolha como você vai usar o Impulso Unifacisa.
                </p>
                <div
                  className="register-perfil-options"
                  role="radiogroup"
                  aria-label="Tipo de cadastro na plataforma"
                >
                  <label
                    className={`register-perfil-option${tipoCadastro === "aluno" ? " register-perfil-option--selected" : ""}`}
                  >
                    <input
                      type="radio"
                      className="register-perfil-radio"
                      name="tipoCadastro"
                      value="aluno"
                      checked={tipoCadastro === "aluno"}
                      onChange={() => setTipoCadastro("aluno")}
                    />
                    <span className="register-perfil-option-inner">
                      <span
                        className="register-perfil-icon-wrap"
                        aria-hidden="true"
                      >
                        <i className="fas fa-user-graduate" />
                      </span>
                      <span className="register-perfil-copy">
                        <strong>Aluno</strong>
                        <small>Envie e acompanhe seus projetos</small>
                      </span>
                    </span>
                  </label>
                  <label
                    className={`register-perfil-option${tipoCadastro === "professor" ? " register-perfil-option--selected" : ""}`}
                  >
                    <input
                      type="radio"
                      className="register-perfil-radio"
                      name="tipoCadastro"
                      value="professor"
                      checked={tipoCadastro === "professor"}
                      onChange={() => setTipoCadastro("professor")}
                    />
                    <span className="register-perfil-option-inner">
                      <span
                        className="register-perfil-icon-wrap"
                        aria-hidden="true"
                      >
                        <i className="fas fa-chalkboard-teacher" />
                      </span>
                      <span className="register-perfil-copy">
                        <strong>Professor</strong>
                        <small>Avalie e integre o comitê do programa</small>
                      </span>
                    </span>
                  </label>
                </div>
                {errors.tipoCadastro && (
                  <p className="register-field-error" role="alert">
                    <i
                      className="fas fa-exclamation-circle"
                      aria-hidden="true"
                    />
                    {errors.tipoCadastro}
                  </p>
                )}
              </div>

              <h1 className="title-form">Nome completo</h1>
              <div className="input-container">
                <i className="fas fa-user icon"></i>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {errors.name && (
                <p style={{ color: "red", fontSize: "12px" }}>{errors.name}</p>
              )}

              <h1 className="title-form">Data de nascimento</h1>
              <div className="input-container">
                <i className="fas fa-calendar-days icon"></i>
                <BirthDatePicker
                  name="birthDate"
                  value={birthDate}
                  onChange={setBirthDate}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
              {errors.birthDate && (
                <p style={{ color: "red", fontSize: "12px" }}>
                  {errors.birthDate}
                </p>
              )}

              <h1 className="title-form">Sexo</h1>
              <div className="input-container input-container--select">
                <i className="fas fa-venus-mars icon"></i>
                <select
                  name="sexo"
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione uma opção
                  </option>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="outro">Outro</option>
                  <option value="prefiro_nao_informar">
                    Prefiro não informar
                  </option>
                </select>
              </div>
              {errors.sexo && (
                <p style={{ color: "red", fontSize: "12px" }}>{errors.sexo}</p>
              )}

              <h1 className="title-form">Selecione seu curso</h1>
              <div className="input-container input-container--select">
                <i className="fas fa-school icon"></i>
                <select
                  name="instituicao"
                  value={instituicao}
                  onChange={(e) => setInstituicao(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione seu curso
                  </option>
                  <option value="Administração">Administração</option>
                  <option value="Arquitetura e Urbanismo">
                    Arquitetura e Urbanismo
                  </option>
                  <option value="Design Gráfico Digital">
                    Design Gráfico Digital
                  </option>
                  <option value="Direito">Direito</option>
                  <option value="Educação Física">Educação Física</option>
                  <option value="Enfermagem">Enfermagem</option>
                  <option value="Engenharia Civil">Engenharia Civil</option>
                  <option value="Fisioterapia">Fisioterapia</option>
                  <option value="Farmácia">Farmácia</option>
                  <option value="Medicina">Medicina</option>
                  <option value="Jogos Digitais">Jogos Digitais</option>
                  <option value="Medicina Veterinaria">
                    Medicina Veterinaria
                  </option>
                  <option value="Nutrição">Nutrição</option>
                  <option value="Odontologia">Odontologia</option>
                  <option value="Psicologia">Psicologia</option>
                  <option value="Sistemas de Informação">
                    Sistemas de Informação
                  </option>
                </select>
              </div>
              {errors.instituicao && (
                <p style={{ color: "red", fontSize: "12px" }}>
                  {errors.instituicao}
                </p>
              )}

              <h1 className="title-form">E-mail</h1>
              <div className="input-container">
                <i className="fas fa-envelope icon"></i>
                <input
                  type="email"
                  placeholder="emailusuariounifacisa.com"
                  name="email"
                  autoComplete="email"
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
                  autoComplete="new-password"
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

              <h1 className="title-form">Confirmar senha</h1>
              <div className="input-container">
                <i className="fas fa-lock icon"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="..........."
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} toggle-password-icon`}
                  onClick={togglePasswordVisibility}
                ></i>
              </div>
              {errors.confirmPassword && (
                <p style={{ color: "red", fontSize: "12px" }}>
                  {errors.confirmPassword}
                </p>
              )}

              <a
                onClick={() => navigate("/login")}
                style={{ cursor: "pointer" }}
              >
                <p className="desc">Já possui uma conta? Faça login</p>
              </a>

              <div className="btn-container">
                <button type="submit" disabled={loading}>
                  {loading ? "CADASTRANDO..." : "CRIAR CONTA"}
                </button>
                <button
                  type="button"
                  className="btn-registrar"
                  onClick={() => navigate("/login")}
                >
                  JÁ TENHO CONTA
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
