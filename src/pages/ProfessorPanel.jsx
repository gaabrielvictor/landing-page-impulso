// ProfessorPanel.jsx
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
  listarAvaliadoresENotas,
  salvarAvaliacaoProjeto,
  buscarAvaliacoesProjeto,
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
  
  // States para feedback (orientador)
  const [feedbackById, setFeedbackById] = useState({});
  const [savingFeedbackId, setSavingFeedbackId] = useState(null);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  
  // States para avaliação com nota (podendo editar)
  const [notaById, setNotaById] = useState({});
  const [comentarioById, setComentarioById] = useState({});
  const [savingAvaliacaoId, setSavingAvaliacaoId] = useState(null);
  const [showAvaliadoresModal, setShowAvaliadoresModal] = useState(false);
  const [avaliadoresList, setAvaliadoresList] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);
  
  // State para edição de nota
  const [editandoNotaId, setEditandoNotaId] = useState(null);

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
    
    // Inicializar states
    const feedbackInicial = {};
    const notaInicial = {};
    const comentarioInicial = {};
    
    for (const projeto of res.projetos) {
      feedbackInicial[projeto.id] = projeto.professorFeedback || "";
      notaInicial[projeto.id] = "";
      comentarioInicial[projeto.id] = "";
      
      // Buscar avaliação existente deste professor para este projeto
      const avaliacoesRes = await buscarAvaliacoesProjeto(projeto.id);
      if (avaliacoesRes.ok && avaliacoesRes.avaliacoes) {
        const minhaAvaliacao = avaliacoesRes.avaliacoes.find(
          av => av.professorEmail === email
        );
        if (minhaAvaliacao) {
          notaInicial[projeto.id] = minhaAvaliacao.nota.toString();
          comentarioInicial[projeto.id] = minhaAvaliacao.comentario || "";
        }
      }
    }
    
    setFeedbackById(feedbackInicial);
    setNotaById(notaInicial);
    setComentarioById(comentarioInicial);
  }, [email]);

  // Função para salvar feedback (orientador)
  const salvarFeedback = async (projetoId) => {
    const feedback = feedbackById[projetoId];
    
    if (!feedback || feedback.trim() === "") {
      setFeedbackError("Digite um feedback antes de salvar.");
      setTimeout(() => setFeedbackError(""), 3000);
      return;
    }
    
    setSavingFeedbackId(projetoId);
    setFeedbackError("");
    setFeedbackSuccess("");
    
    const res = await salvarFeedbackProjeto(projetoId, feedback);
    setSavingFeedbackId(null);
    
    if (!res.ok) {
      setFeedbackError(res.error || "Erro ao salvar feedback.");
      setTimeout(() => setFeedbackError(""), 3000);
      return;
    }
    
    setProjetos(prev => prev.map(p => 
      p.id === projetoId 
        ? { ...p, professorFeedback: feedback, professorFeedbackEm: new Date() } 
        : p
    ));
    
    setFeedbackSuccess("Feedback salvo com sucesso!");
    setTimeout(() => setFeedbackSuccess(""), 3000);
  };

  // Função para salvar/editar avaliação com nota
  const salvarAvaliacao = async (projetoId) => {
    const nota = notaById[projetoId];
    const comentario = comentarioById[projetoId] || "";
    
    if (!nota || nota === "") {
      setFeedbackError("Por favor, insira uma nota (0-10).");
      setTimeout(() => setFeedbackError(""), 3000);
      return;
    }
    
    const notaNum = parseFloat(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
      setFeedbackError("Por favor, insira uma nota válida entre 0 e 10.");
      setTimeout(() => setFeedbackError(""), 3000);
      return;
    }
    
    if (!comentario) {
      setFeedbackError("Por favor, escreva um comentário para a avaliação.");
      setTimeout(() => setFeedbackError(""), 3000);
      return;
    }
    
    setSavingAvaliacaoId(projetoId);
    setFeedbackError("");
    setFeedbackSuccess("");
    
    const res = await salvarAvaliacaoProjeto(projetoId, notaNum, comentario);
    setSavingAvaliacaoId(null);
    
    if (!res.ok) {
      setFeedbackError(res.error || "Erro ao salvar avaliação.");
      setTimeout(() => setFeedbackError(""), 3000);
      return;
    }
    
    setFeedbackSuccess(`Avaliação salva/atualizada! Nota: ${notaNum}/10`);
    setTimeout(() => setFeedbackSuccess(""), 3000);
    
    // Sair do modo de edição
    setEditandoNotaId(null);
  };

  // Função para iniciar edição da nota
  const iniciarEdicao = (projetoId) => {
    setEditandoNotaId(projetoId);
  };

  // Função para cancelar edição
  const cancelarEdicao = () => {
    setEditandoNotaId(null);
  };

  // Buscar lista de avaliadores e notas de um projeto
  const verAvaliadoresENotas = useCallback(async (projeto) => {
    setProjetoSelecionado(projeto);
    const res = await listarAvaliadoresENotas(projeto.id);
    
    if (res.ok && res.avaliadores) {
      setAvaliadoresList(res.avaliadores);
      setShowAvaliadoresModal(true);
    } else {
      setFeedbackError("Erro ao carregar lista de avaliadores");
      setTimeout(() => setFeedbackError(""), 3000);
    }
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
      setTimeout(() => setFeedbackError(""), 3000);
      return;
    }
    setViewUrl(getProjetoArquivoUrl(projeto.id, arquivo.id));
    setShowViewModal(true);
  };

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("professorEmail");
    navigate("/login");
  };

  const AvaliadoresModal = () => {
    const calcularMedia = () => {
      if (avaliadoresList.length === 0) return 0;
      const soma = avaliadoresList.reduce((acc, av) => acc + (av.nota || 0), 0);
      return (soma / avaliadoresList.length).toFixed(1);
    };

    return (
      <div className="professor-modal-backdrop" role="dialog" aria-modal="true">
        <div className="professor-modal professor-modal--large">
          <div className="professor-modal-header">
            <h3>Avaliadores do Projeto</h3>
            <h4>{projetoSelecionado?.titulo}</h4>
            <button
              type="button"
              className="professor-modal-close"
              onClick={() => setShowAvaliadoresModal(false)}
            >
              ×
            </button>
          </div>
          <div className="professor-modal-body">
            {avaliadoresList.length === 0 ? (
              <p>Nenhum avaliador registrado para este projeto.</p>
            ) : (
              <>
                <table className="professor-avaliadores-table">
                  <thead>
                    <tr>
                      <th>Professor Avaliador</th>
                      <th>Nota</th>
                      <th>Comentário</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {avaliadoresList.map((avaliador, index) => (
                      <tr key={index}>
                        <td>{avaliador.nome || avaliador.professorEmail || avaliador.email}</td>
                        <td className="nota-cell">{avaliador.nota || "—"}/10</td>
                        <td>{avaliador.comentario || "—"}</td>
                        <td>{formatDateTime(avaliador.dataCriacao || avaliador.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {avaliadoresList.length > 0 && (
                  <div className="avaliacao-media">
                    <strong>Média das notas: {calcularMedia()}/10</strong>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="professor-modal-footer">
            <button
              type="button"
              className="professor-btn professor-btn--ghost"
              onClick={() => setShowAvaliadoresModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Verificar se já existe nota salva para um projeto
  const temNotaSalva = (projetoId) => {
    return notaById[projetoId] && notaById[projetoId] !== "";
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
              >
                <div className="professor-topbar-profile-menu-head">
                  <span className="professor-topbar-avatar professor-topbar-avatar--lg">
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
                    <i className="fas fa-envelope" />
                    <div>
                      <strong>E-mail institucional</strong>
                      {email || "—"}
                    </div>
                  </li>
                  <li>
                    <i className="fas fa-building-columns" />
                    <div>
                      <strong>Instituição</strong>
                      {instituicao}
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
          Acompanhe os projetos acadêmicos em avaliação, atribua notas, dê feedback e veja quem já avaliou cada projeto.
        </p>

        <section className="professor-card professor-card--full">
          <h2>Projetos em avaliação</h2>
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
            <p className="professor-field professor-field--success" role="status">
              {feedbackSuccess}
            </p>
          )}

          {isLoadingProjetos ? (
            <p className="professor-loading">
              <i className="fas fa-spinner fa-spin" />
              Carregando projetos...
            </p>
          ) : projetos.length === 0 && !loadError ? (
            <div className="professor-empty">
              <i className="fas fa-folder-open" />
              <p>Nenhum projeto disponível para avaliação no momento.</p>
            </div>
          ) : (
            <div className="professor-projects-table-wrap">
              <table className="professor-projects-table">
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Aluno</th>
                    <th>Orientador</th>
                    <th>Status</th>
                    <th>Feedback</th>
                    <th>Minha Avaliação</th>
                    <th>Avaliadores</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="professor-project-title">{p.titulo}</div>
                        <div className="professor-project-meta">{p.curso || "—"}</div>
                      </td>
                      <td>
                        <div className="professor-project-submitter">{p.alunoName}</div>
                        <div className="professor-project-meta">{p.alunoEmail || "—"}</div>
                      </td>
                      <td>{p.orientador}</td>
                      <td>
                        <span className={badgeClass(p.statusKey)}>{p.status}</span>
                      </td>
                      
                      {/* Coluna de Feedback do Orientador */}
                      <td className="professor-feedback-cell">
                        <div className="professor-feedback-form">
                          <textarea
                            className="professor-feedback-textarea-sm"
                            placeholder="Digite seu feedback para o aluno..."
                            value={feedbackById[p.id] ?? ""}
                            onChange={(e) => {
                              setFeedbackById(prev => ({ ...prev, [p.id]: e.target.value }));
                              setFeedbackError("");
                            }}
                            rows="3"
                          />
                          <button
                            type="button"
                            className="professor-btn professor-btn--primary professor-btn--sm"
                            onClick={() => salvarFeedback(p.id)}
                            disabled={savingFeedbackId === p.id}
                          >
                            {savingFeedbackId === p.id ? "Salvando..." : "Enviar Feedback"}
                          </button>
                          {p.professorFeedback && (
                            <div className="feedback-enviado">
                              <i className="fas fa-check-circle" />
                              <small>Último: {formatDateTime(p.professorFeedbackEm)}</small>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Coluna de Minha Avaliação (Nota + Comentário - Editável) */}
                      <td className="professor-avaliacao-cell">
                        {editandoNotaId === p.id ? (
                          // Modo de edição
                          <div className="professor-avaliacao-edicao">
                            <input
                              type="number"
                              className="professor-nota-input"
                              placeholder="Nota (0-10)"
                              value={notaById[p.id] || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "" || (Number(value) >= 0 && Number(value) <= 10)) {
                                  setNotaById(prev => ({ ...prev, [p.id]: value }));
                                }
                              }}
                              step="0.5"
                              min="0"
                              max="10"
                              autoFocus
                            />
                            <textarea
                              className="professor-comentario-input"
                              placeholder="Comentário da avaliação..."
                              value={comentarioById[p.id] || ""}
                              onChange={(e) => {
                                setComentarioById(prev => ({ ...prev, [p.id]: e.target.value }));
                              }}
                              rows="2"
                            />
                            <div className="professor-avaliacao-actions">
                              <button
                                type="button"
                                className="professor-btn professor-btn--primary professor-btn--sm"
                                onClick={() => salvarAvaliacao(p.id)}
                                disabled={savingAvaliacaoId === p.id}
                              >
                                {savingAvaliacaoId === p.id ? "Salvando..." : "Salvar"}
                              </button>
                              <button
                                type="button"
                                className="professor-btn professor-btn--ghost professor-btn--sm"
                                onClick={cancelarEdicao}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Modo de visualização
                          <div className="professor-avaliacao-view">
                            {temNotaSalva(p.id) ? (
                              <>
                                <div className="avaliacao-nota-exibida">
                                  <span className="nota-valor">{notaById[p.id]}/10</span>
                                  <button
                                    type="button"
                                    className="professor-btn-editar"
                                    onClick={() => iniciarEdicao(p.id)}
                                    title="Editar avaliação"
                                  >
                                    <i className="fas fa-pen" />
                                  </button>
                                </div>
                                {comentarioById[p.id] && (
                                  <div className="avaliacao-comentario-exibido">
                                    <small>{comentarioById[p.id]}</small>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="avaliacao-sem-nota">
                                <span>Nenhuma avaliação</span>
                                <button
                                  type="button"
                                  className="professor-btn professor-btn--primary professor-btn--sm"
                                  onClick={() => iniciarEdicao(p.id)}
                                >
                                  <i className="fas fa-plus" />
                                  Avaliar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      
                      <td>
                        <button
                          type="button"
                          className="professor-btn professor-btn--ghost professor-btn--sm"
                          onClick={() => verAvaliadoresENotas(p)}
                        >
                          <i className="fas fa-users" />
                          Ver avaliadores
                        </button>
                      </td>
                      
                      <td>
                        {p.arquivos?.length > 0 ? (
                          <button
                            type="button"
                            className="professor-btn professor-btn--ghost professor-btn--sm"
                            onClick={() => openViewPdf(p)}
                          >
                            <i className="fas fa-file-pdf" />
                            Ver PDF
                          </button>
                        ) : (
                          <span className="professor-project-meta">Sem PDF</span>
                        )}
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
        <div className="professor-modal-backdrop" role="dialog">
          <div className="professor-modal professor-modal--large">
            <div className="professor-modal-header">
              <h3>Visualizar documento</h3>
              <button
                type="button"
                className="professor-modal-close"
                onClick={() => setShowViewModal(false)}
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

      {showAvaliadoresModal && <AvaliadoresModal />}
    </div>
  );
};

export default ProfessorPanel;