import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/ProfessorPanel.css";
import logo from "../assets/logo.png";
import {
  getProjetoArquivoUrl,
  listarProjetosProfessor,
  salvarFeedbackProjeto,
} from "../utils/projetosApi";

const badgeClass = (key) => {
  const map = {
    review: "professor-badge professor-badge--review",
    done: "professor-badge professor-badge--done",
    active: "professor-badge professor-badge--active",
    pending: "professor-badge professor-badge--pending",
  };
  return map[key] || map.pending;
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ProfessorPanel = () => {
  const navigate = useNavigate();
  const isAuth = localStorage.getItem("isAdmin") === "true";
  const email = localStorage.getItem("professorEmail") || "";
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [projetos, setProjetos] = useState([]);
  const [isLoadingProjetos, setIsLoadingProjetos] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState("");
  const [feedbackById, setFeedbackById] = useState({});
  const [savingFeedbackId, setSavingFeedbackId] = useState(null);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  const iniciais = useMemo(() => {
    const local = email.split("@")[0] || "AD";
    const parts = local
      .replace(/[^a-zA-Z0-9]/g, " ")
      .trim()
      .split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase() || "AD";
  }, [email]);

  const nomeExibicao = useMemo(() => {
    if (email === "admin@unifacisa.com") return "Administrador Unifacisa";
    const user = email.split("@")[0];
    return user ? user.charAt(0).toUpperCase() + user.slice(1) : "Professor";
  }, [email]);

  const instituicao = "Centro de Ensino Superior e Desenvolvimento — Unifacisa";

  const carregarProjetos = useCallback(async () => {
    setIsLoadingProjetos(true);
    setLoadError("");
    setFeedbackError("");
    setFeedbackSuccess("");

    const res = await listarProjetosProfessor();
    setIsLoadingProjetos(false);

    if (!res.ok) {
      setLoadError(res.error || "Erro ao carregar projetos.");
      return;
    }

    setProjetos(res.projetos);
    setFeedbackById(
      res.projetos.reduce((accumulator, projeto) => {
        accumulator[projeto.id] = projeto.professorFeedback || "";
        return accumulator;
      }, {}),
    );
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    carregarProjetos();
  }, [carregarProjetos, isAuth]);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const onClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  const openViewPdf = (projeto) => {
    const arquivo = projeto.arquivos?.[0];
    if (!arquivo) {
      setFeedbackError("Este projeto não possui PDF anexado.");
      return;
    }

    setViewUrl(getProjetoArquivoUrl(projeto.id, arquivo.id));
    setShowViewModal(true);
  };

  const saveFeedback = async (projeto) => {
    const feedback = (feedbackById[projeto.id] || "").trim();

    if (!feedback) {
      setFeedbackError("Digite um feedback para o aluno.");
      return;
    }

    setSavingFeedbackId(projeto.id);
    setFeedbackError("");
    setFeedbackSuccess("");

    const res = await salvarFeedbackProjeto(projeto.id, feedback);
    setSavingFeedbackId(null);

    if (!res.ok) {
      setFeedbackError(res.error || "Erro ao salvar feedback.");
      return;
    }

    setProjetos((lista) =>
      lista.map((item) => (item.id === projeto.id ? res.projeto : item)),
    );
    setFeedbackById((current) => ({
      ...current,
      [projeto.id]: res.projeto.professorFeedback || "",
    }));
    setFeedbackSuccess("Feedback salvo com sucesso.");
  };

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("professorEmail");
    navigate("/login");
  };

  return (
    <div className="professor-page">
      <header className="professor-topbar">
        <div className="professor-topbar-brand">
          <img src={logo} alt="Impulso Unifacisa" />
          <div>
            <h1>Impulso Unifacisa</h1>
            <span>Área do professor — avaliação de projetos</span>
          </div>
        </div>

        <div className="professor-topbar-actions">
          <Link to="/">Início</Link>

          <div className="professor-topbar-profile" ref={profileRef}>
            <button
              type="button"
              className="professor-topbar-profile-trigger"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-controls="professor-profile-menu"
              id="professor-profile-trigger"
            >
              <span className="professor-topbar-avatar" aria-hidden="true">
                {iniciais}
              </span>
              <span className="professor-topbar-profile-text">
                <span className="professor-topbar-profile-label">
                  Meu perfil
                </span>
                <span className="professor-topbar-profile-name">
                  {nomeExibicao}
                </span>
              </span>
              <i
                className={`fas fa-chevron-down professor-topbar-profile-chevron${profileOpen ? " professor-topbar-profile-chevron--open" : ""}`}
                aria-hidden="true"
              />
            </button>

            {profileOpen && (
              <div
                id="professor-profile-menu"
                className="professor-topbar-profile-menu"
                role="menu"
                aria-labelledby="professor-profile-trigger"
              >
                <div className="professor-topbar-profile-menu-head">
                  <span
                    className="professor-topbar-avatar professor-topbar-avatar--lg"
                    aria-hidden="true"
                  >
                    {iniciais}
                  </span>
                  <div>
                    <p className="professor-topbar-profile-menu-name">
                      {nomeExibicao}
                    </p>
                    <p className="professor-topbar-profile-menu-role">
                      Professor avaliador · Comitê Impulso
                    </p>
                  </div>
                </div>
                <ul className="professor-topbar-profile-list">
                  <li>
                    <i className="fas fa-envelope" aria-hidden="true" />
                    <div>
                      <strong>E-mail institucional</strong>
                      {email || "—"}
                    </div>
                  </li>
                  <li>
                    <i className="fas fa-building-columns" aria-hidden="true" />
                    <div>
                      <strong>Instituição</strong>
                      {instituicao}
                    </div>
                  </li>
                  <li>
                    <i className="fas fa-user-check" aria-hidden="true" />
                    <div>
                      <strong>Acesso</strong>
                      {email === "admin@unifacisa.com"
                        ? "Conta administrativa (demonstração)"
                        : "Conta de professor (cadastro na plataforma)"}
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            className="professor-btn-logout"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </header>

      <main className="professor-main">
        <h1 className="professor-main-title">Painel do professor</h1>
        <p className="professor-main-subtitle">
          Acompanhe os projetos acadêmicos em avaliação e veja quem submeteu
          cada PDF para facilitar a análise.
        </p>

        <section
          className="professor-card professor-card--full"
          aria-labelledby="professor-projetos-heading"
        >
          <h2 id="professor-projetos-heading">Projetos em avaliação</h2>
          <p className="professor-projects-count">
            {isLoadingProjetos
              ? "Carregando..."
              : `${projetos.length} projeto${projetos.length !== 1 ? "s" : ""} na sua lista`}
          </p>

          {loadError && (
            <p className="professor-field professor-field--error" role="alert">
              {loadError}{" "}
              <button
                type="button"
                className="professor-link-btn"
                onClick={carregarProjetos}
              >
                Tentar novamente
              </button>
            </p>
          )}

          {feedbackError && (
            <p className="professor-field professor-field--error" role="alert">
              {feedbackError}
            </p>
          )}

          {feedbackSuccess && (
            <p
              className="professor-field professor-field--success"
              role="status"
            >
              {feedbackSuccess}
            </p>
          )}

          {isLoadingProjetos ? (
            <p className="professor-loading">
              <i className="fas fa-spinner fa-spin" aria-hidden="true" />
              Carregando projetos...
            </p>
          ) : projetos.length === 0 && !loadError ? (
            <div className="professor-empty">
              <i className="fas fa-folder-open" aria-hidden="true" />
              <p>Nenhum projeto disponível para avaliação no momento.</p>
            </div>
          ) : (
            <div className="professor-projects-table-wrap">
              <table className="professor-projects-table">
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Submetido por</th>
                    <th>Orientador</th>
                    <th>Status</th>
                    <th>Ações</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="professor-project-title">
                          {p.titulo}
                        </div>
                        <div className="professor-project-meta">
                          {p.curso || "—"}
                        </div>
                      </td>
                      <td>
                        <div className="professor-project-submitter">
                          {p.alunoName}
                        </div>
                        <div className="professor-project-meta">
                          {p.alunoEmail || "—"}
                        </div>
                      </td>
                      <td>{p.orientador}</td>
                      <td>
                        <span className={badgeClass(p.statusKey)}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div className="professor-project-actions">
                          {p.arquivos?.length > 0 ? (
                            <button
                              type="button"
                              className="professor-btn professor-btn--ghost professor-btn--sm"
                              onClick={() => openViewPdf(p)}
                              title="Visualizar PDF"
                            >
                              <i
                                className="fas fa-file-pdf"
                                aria-hidden="true"
                              />
                              Visualizar PDF
                            </button>
                          ) : (
                            <span className="professor-project-meta">
                              Nenhum PDF anexado
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="professor-feedback-card">
                          <div className="professor-feedback-top">
                            <div>
                              <p className="professor-feedback-heading">
                                Feedback do professor
                              </p>
                              <p className="professor-feedback-subtitle">
                                {p.professorFeedback
                                  ? "Acompanhe a última observação registrada"
                                  : "Organize uma avaliação objetiva para o aluno"}
                              </p>
                            </div>
                            <span
                              className={`professor-feedback-status ${
                                p.professorFeedback
                                  ? "professor-feedback-status--sent"
                                  : "professor-feedback-status--draft"
                              }`}
                            >
                              {p.professorFeedback
                                ? "Feedback enviado"
                                : "Em edição"}
                            </span>
                          </div>

                          <div className="professor-feedback-summary">
                            <div className="professor-feedback-summary-label">
                              Último feedback enviado
                            </div>
                            {p.professorFeedback ? (
                              <div className="professor-feedback-summary-body">
                                <p>{p.professorFeedback}</p>
                                <span className="professor-feedback-date">
                                  {p.professorFeedbackEm
                                    ? `Registrado em ${formatDateTime(
                                        p.professorFeedbackEm,
                                      )}`
                                    : "Data de envio não informada"}
                                </span>
                              </div>
                            ) : (
                              <p className="professor-feedback-empty">
                                Nenhum feedback foi enviado até o momento.
                              </p>
                            )}
                          </div>

                          <label
                            className="professor-feedback-label"
                            htmlFor={`feedback-${p.id}`}
                          >
                            Escrever nova avaliação
                          </label>
                          <textarea
                            id={`feedback-${p.id}`}
                            className="professor-feedback-textarea"
                            value={feedbackById[p.id] ?? ""}
                            onChange={(event) => {
                              setFeedbackById((current) => ({
                                ...current,
                                [p.id]: event.target.value,
                              }));
                              setFeedbackError("");
                              setFeedbackSuccess("");
                            }}
                            placeholder="Ex.: destaque os pontos fortes, descreva os ajustes necessários e o próximo passo esperado"
                          />

                          <div className="professor-feedback-actions">
                            <button
                              type="button"
                              className="professor-btn professor-btn--primary professor-btn--sm"
                              onClick={() => saveFeedback(p)}
                              disabled={savingFeedbackId === p.id}
                            >
                              {savingFeedbackId === p.id
                                ? "Salvando..."
                                : "Salvar feedback"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showViewModal && (
        <div
          className="professor-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="professor-modal professor-modal--large">
            <div className="professor-modal-header">
              <h3>Visualizar documento</h3>
              <button
                type="button"
                className="professor-modal-close"
                onClick={() => setShowViewModal(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="professor-modal-body professor-modal-body--full">
              <iframe
                title="Visualizar PDF"
                src={viewUrl}
                className="professor-pdf-iframe"
              />
            </div>
            <div className="professor-modal-footer">
              <button
                type="button"
                className="professor-btn professor-btn--ghost"
                onClick={() => setShowViewModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorPanel;
