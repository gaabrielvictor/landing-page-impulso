import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/AlunoPanel.css";
import logo from "../assets/logo.png";
import {
  criarProjetoComPDF,
  atualizarProjeto,
  listarProjetosAluno,
  excluirProjeto,
  getProjetoArquivoUrl,
} from "../utils/projetosApi";

const badgeClass = (key) => {
  const map = {
    review: "aluno-badge aluno-badge--review",
    done: "aluno-badge aluno-badge--done",
    active: "aluno-badge aluno-badge--active",
    pending: "aluno-badge aluno-badge--pending",
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

const readLoggedStudent = () => {
  try {
    const raw = localStorage.getItem("impulso_usuario_logado");
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.email !== "string" || !data.email.trim()) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const AlunoPanel = () => {
  const navigate = useNavigate();
  const student = readLoggedStudent();
  const isAdminSession = localStorage.getItem("isAdmin") === "true";
  const email = student?.email || "";
  const displayName = student?.name || "";
  const instituicao = student?.instituicao || "";

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [projetos, setProjetos] = useState([]);
  const [isLoadingProjetos, setIsLoadingProjetos] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoProfessor, setNovoProfessor] = useState("");
  const [pdfNome, setPdfNome] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectError, setProjectError] = useState("");
  const fileInputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editOrientador, setEditOrientador] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingTitulo, setDeletingTitulo] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState(null);

  const resetFormNovoProjeto = useCallback(() => {
    setNovoTitulo("");
    setNovoProfessor("");
    setPdfNome("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const fecharDrawer = useCallback(() => {
    setDrawerOpen(false);
    resetFormNovoProjeto();
  }, [resetFormNovoProjeto]);

  const carregarProjetos = useCallback(async () => {
    if (!email) return;
    setIsLoadingProjetos(true);
    setLoadError("");
    const res = await listarProjetosAluno(email);
    setIsLoadingProjetos(false);
    if (!res.ok) {
      setLoadError(res.error || "Erro ao carregar projetos.");
      return;
    }
    setProjetos(res.projetos);
  }, [email]);

  useEffect(() => {
    carregarProjetos();
  }, [carregarProjetos]);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  const modalAberto =
    drawerOpen || showEditModal || showViewModal || showDeleteModal;

  useEffect(() => {
    if (!modalAberto) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (profileOpen) {
        setProfileOpen(false);
      } else if (showDeleteModal) {
        setShowDeleteModal(false);
        setDeletingId(null);
      } else if (showViewModal) {
        setShowViewModal(false);
      } else if (showEditModal) {
        setEditingId(null);
        setEditTitulo("");
        setEditOrientador("");
        setShowEditModal(false);
      } else if (drawerOpen) {
        fecharDrawer();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [
    modalAberto,
    drawerOpen,
    showEditModal,
    showViewModal,
    showDeleteModal,
    profileOpen,
    fecharDrawer,
  ]);

  const iniciais = useMemo(() => {
    const fromName = displayName.trim().split(/\s+/).filter(Boolean);
    if (fromName.length >= 2) {
      return (fromName[0][0] + fromName[fromName.length - 1][0]).toUpperCase();
    }
    if (fromName.length === 1 && fromName[0].length >= 2) {
      return fromName[0].slice(0, 2).toUpperCase();
    }
    const local = email.split("@")[0] || "AL";
    const parts = local
      .replace(/[^a-zA-Z0-9]/g, " ")
      .trim()
      .split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase() || "AL";
  }, [email, displayName]);

  const nomeExibicao = useMemo(() => {
    if (displayName.trim()) return displayName.trim();
    const user = email.split("@")[0];
    return user ? user.charAt(0).toUpperCase() + user.slice(1) : "Aluno";
  }, [email, displayName]);

  const handlePdfChange = (e) => {
    const f = e.target.files?.[0];
    setPdfNome(f ? f.name : "");
  };

  const handlePdfDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (
      f &&
      (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
    ) {
      setPdfNome(f.name);
    }
  };

  const handleSalvarRascunho = async (e) => {
    e.preventDefault();
    setProjectError("");

    const titulo = novoTitulo.trim();
    const orientador = novoProfessor.trim();
    const arquivo = fileInputRef.current?.files?.[0];

    if (!titulo) {
      setProjectError("Informe o título do projeto.");
      return;
    }

    if (!orientador) {
      setProjectError("Informe o nome do orientador.");
      return;
    }

    if (!arquivo) {
      setProjectError("Selecione um arquivo PDF.");
      return;
    }

    setIsSavingProject(true);

    const result = await criarProjetoComPDF({
      alunoEmail: email,
      alunoName: nomeExibicao,
      curso: instituicao,
      titulo,
      orientador,
      arquivo,
    });

    setIsSavingProject(false);

    if (!result.ok) {
      setProjectError(result.error || "Erro ao enviar o projeto.");
      return;
    }

    setProjetos((lista) => [result.projeto, ...lista]);
    fecharDrawer();
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditTitulo(p.titulo || "");
    setEditOrientador(p.orientador || "");
    setProjectError("");
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitulo("");
    setEditOrientador("");
    setShowEditModal(false);
    setProjectError("");
  };

  const saveEdit = async (id) => {
    if (!editTitulo.trim()) {
      setProjectError("Título não pode ficar vazio.");
      return;
    }
    if (!editOrientador.trim()) {
      setProjectError("Informe o orientador.");
      return;
    }

    setProjectError("");

    const res = await atualizarProjeto(id, {
      titulo: editTitulo.trim(),
      orientador: editOrientador.trim(),
      alunoEmail: email,
    });

    if (!res.ok) {
      setProjectError(res.error || "Erro ao atualizar projeto.");
      return;
    }

    setProjetos((lista) => lista.map((p) => (p.id === id ? res.projeto : p)));
    cancelEdit();
  };

  const startDelete = (p) => {
    setDeletingId(p.id);
    setDeletingTitulo(p.titulo || "este projeto");
    setProjectError("");
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingId(null);
    setDeletingTitulo("");
    setProjectError("");
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    setProjectError("");

    const res = await excluirProjeto(deletingId, email);
    setIsDeleting(false);

    if (!res.ok) {
      setProjectError(res.error || "Erro ao excluir projeto.");
      return;
    }

    setProjetos((lista) => lista.filter((p) => p.id !== deletingId));
    cancelDelete();
  };

  const updateStatusProjeto = async (projeto) => {
    if (projeto.statusKey !== "pending") return;

    setIsUpdatingStatusId(projeto.id);
    setProjectError("");

    const res = await atualizarProjeto(projeto.id, {
      alunoEmail: email,
      status: "em_avaliacao",
    });

    setIsUpdatingStatusId(null);

    if (!res.ok) {
      setProjectError(res.error || "Erro ao atualizar o status do projeto.");
      return;
    }

    setProjetos((lista) =>
      lista.map((item) => (item.id === projeto.id ? res.projeto : item)),
    );
  };

  const isDraftProject = (projeto) =>
    projeto.statusKey === "pending" &&
    projeto.status === "Rascunho — não enviado";

  const openViewPdf = (p) => {
    if (!p.arquivos?.length) return;
    setViewUrl(getProjetoArquivoUrl(p.id, p.arquivos[0].id));
    setShowViewModal(true);
  };

  if (isAdminSession) {
    return <Navigate to="/admin" replace />;
  }

  if (!student) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("impulso_usuario_logado");
    navigate("/login");
  };

  return (
    <div className="aluno-page">
      <button
        type="button"
        className="aluno-drawer-tab"
        onClick={() => setDrawerOpen(true)}
        aria-expanded={drawerOpen}
        aria-controls="aluno-drawer-panel"
      >
        <i className="fas fa-plus" aria-hidden="true" />
        <span className="aluno-drawer-tab-text">Adicionar projeto!</span>
      </button>

      {drawerOpen && (
        <>
          <button
            type="button"
            className="aluno-drawer-backdrop"
            aria-label="Fechar painel"
            onClick={fecharDrawer}
          />
          <aside
            id="aluno-drawer-panel"
            className="aluno-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="aluno-drawer-title"
          >
            <div className="aluno-drawer-head">
              <div>
                <h2 id="aluno-drawer-title">Novo projeto</h2>
                <p className="aluno-drawer-lead">
                  Preencha os dados e anexe o PDF do seu projeto para salvar
                  como rascunho.
                </p>
              </div>
              <button
                type="button"
                className="aluno-drawer-close"
                onClick={fecharDrawer}
                aria-label="Fechar"
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </div>

            <form className="aluno-drawer-form" onSubmit={handleSalvarRascunho}>
              <label className="aluno-field" htmlFor="aluno-novo-titulo">
                Título do projeto
              </label>
              <input
                id="aluno-novo-titulo"
                className="aluno-input"
                type="text"
                placeholder="Ex.: Plataforma de mentoria entre pares"
                value={novoTitulo}
                onChange={(ev) => setNovoTitulo(ev.target.value)}
                autoComplete="off"
              />

              <label className="aluno-field" htmlFor="aluno-novo-professor">
                Professor responsável
              </label>
              <input
                id="aluno-novo-professor"
                className="aluno-input"
                type="text"
                placeholder="Nome completo do docente"
                value={novoProfessor}
                onChange={(ev) => setNovoProfessor(ev.target.value)}
                autoComplete="name"
              />

              <span className="aluno-field">Documento (PDF)</span>
              <p className="aluno-upload-hint">
                Arraste ou clique para anexar o PDF do seu projeto.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="aluno-file-input"
                onChange={handlePdfChange}
                aria-label="Selecionar arquivo PDF"
              />
              <button
                type="button"
                className="aluno-upload-zone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                }}
                onDrop={handlePdfDrop}
              >
                <i className="fas fa-file-pdf" aria-hidden="true" />
                <span>
                  {pdfNome ? (
                    <>
                      <strong>{pdfNome}</strong>
                      <small>Clique para trocar o arquivo</small>
                    </>
                  ) : (
                    <>
                      <strong>Arraste ou clique para anexar PDF</strong>
                      <small>Apenas .pdf · máx. sugerido 10 MB</small>
                    </>
                  )}
                </span>
              </button>

              {projectError && !showEditModal && !showDeleteModal && (
                <p className="aluno-field aluno-field--error" role="alert">
                  {projectError}
                </p>
              )}

              <div className="aluno-drawer-actions">
                <button
                  type="button"
                  className="aluno-btn aluno-btn--ghost"
                  onClick={fecharDrawer}
                  disabled={isSavingProject}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="aluno-btn aluno-btn--primary"
                  disabled={isSavingProject}
                >
                  {isSavingProject ? "SALVANDO..." : "Salvar rascunho"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      <header className="aluno-topbar">
        <div className="aluno-topbar-brand">
          <img src={logo} alt="Impulso Unifacisa" />
          <div>
            <h1>Impulso Unifacisa</h1>
            <span>Área do aluno — submissão e acompanhamento de projetos</span>
          </div>
        </div>
        <div className="aluno-topbar-actions">
          <Link to="/">Início</Link>

          <div className="aluno-topbar-profile" ref={profileRef}>
            <button
              type="button"
              className="aluno-topbar-profile-trigger"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-controls="aluno-profile-menu"
              id="aluno-profile-trigger"
            >
              <span className="aluno-topbar-avatar" aria-hidden="true">
                {iniciais}
              </span>
              <span className="aluno-topbar-profile-text">
                <span className="aluno-topbar-profile-label">Meu perfil</span>
                <span className="aluno-topbar-profile-name">
                  {nomeExibicao}
                </span>
              </span>
              <i
                className={`fas fa-chevron-down aluno-topbar-profile-chevron${profileOpen ? " aluno-topbar-profile-chevron--open" : ""}`}
                aria-hidden="true"
              />
            </button>

            {profileOpen && (
              <div
                id="aluno-profile-menu"
                className="aluno-topbar-profile-menu"
                role="menu"
                aria-labelledby="aluno-profile-trigger"
              >
                <div className="aluno-topbar-profile-menu-head">
                  <span
                    className="aluno-topbar-avatar aluno-topbar-avatar--lg"
                    aria-hidden="true"
                  >
                    {iniciais}
                  </span>
                  <div>
                    <p className="aluno-topbar-profile-menu-name">
                      {nomeExibicao}
                    </p>
                    <p className="aluno-topbar-profile-menu-role">
                      Aluno · Programa Impulso
                    </p>
                  </div>
                </div>
                <ul className="aluno-topbar-profile-list">
                  <li>
                    <i className="fas fa-envelope" aria-hidden="true" />
                    <div>
                      <strong>E-mail</strong>
                      {email || "—"}
                    </div>
                  </li>
                  <li>
                    <i className="fas fa-building-columns" aria-hidden="true" />
                    <div>
                      <strong>Curso</strong>
                      {instituicao || "—"}
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            className="aluno-btn-logout"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </header>

      <main className="aluno-main">
        <h1 className="aluno-main-title">Painel do aluno</h1>
        <p className="aluno-main-subtitle">
          Gerencie e acompanhe seus projetos acadêmicos no Programa Impulso.
        </p>

        <section
          className="aluno-tab-panel"
          aria-labelledby="aluno-projetos-heading"
        >
          <div className="aluno-card aluno-card--full">
            <h2 id="aluno-projetos-heading">Meus projetos</h2>
            <p className="aluno-projects-count">
              {isLoadingProjetos
                ? "Carregando..."
                : `${projetos.length} projeto${projetos.length !== 1 ? "s" : ""} na sua lista`}
            </p>

            {loadError && (
              <p className="aluno-field aluno-field--error" role="alert">
                {loadError}{" "}
                <button
                  type="button"
                  className="aluno-link-btn"
                  onClick={carregarProjetos}
                >
                  Tentar novamente
                </button>
              </p>
            )}

            {isLoadingProjetos ? (
              <p className="aluno-loading">
                <i className="fas fa-spinner fa-spin" aria-hidden="true" />
                Carregando seus projetos...
              </p>
            ) : projetos.length === 0 && !loadError ? (
              <div className="aluno-empty">
                <i className="fas fa-folder-open" aria-hidden="true" />
                <p>Você ainda não tem projetos cadastrados.</p>
                <button
                  type="button"
                  className="aluno-btn aluno-btn--primary"
                  onClick={() => setDrawerOpen(true)}
                >
                  Adicionar primeiro projeto
                </button>
              </div>
            ) : (
              <div className="aluno-projects-table-wrap">
                <table className="aluno-projects-table">
                  <thead>
                    <tr>
                      <th>Projeto</th>
                      <th>Orientador</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetos.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="aluno-project-title">{p.titulo}</div>
                          <div className="aluno-project-meta">
                            {p.curso || "—"}
                          </div>
                          <div className="aluno-feedback-block">
                            <div className="aluno-feedback-block-label">
                              Feedback do professor
                            </div>
                            {p.professorFeedback ? (
                              <>
                                <p className="aluno-feedback-block-message">
                                  {p.professorFeedback}
                                </p>
                                <span className="aluno-feedback-block-date">
                                  {p.professorFeedbackEm
                                    ? `Registrado em ${formatDateTime(
                                        p.professorFeedbackEm,
                                      )}`
                                    : "Data de envio não informada"}
                                </span>
                              </>
                            ) : (
                              <p className="aluno-feedback-block-empty">
                                Nenhum feedback foi enviado para este projeto
                                ainda.
                              </p>
                            )}
                          </div>
                        </td>
                        <td>{p.orientador}</td>
                        <td>
                          <span className={badgeClass(p.statusKey)}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div className="aluno-project-actions">
                            <button
                              type="button"
                              className="aluno-btn aluno-btn--ghost aluno-btn--sm"
                              onClick={() => startEdit(p)}
                              title="Editar projeto"
                            >
                              <i className="fas fa-pen" aria-hidden="true" />
                              Editar
                            </button>
                            {p.arquivos?.length > 0 && (
                              <button
                                type="button"
                                className="aluno-btn aluno-btn--sm"
                                onClick={() => openViewPdf(p)}
                                title="Visualizar PDF"
                              >
                                <i
                                  className="fas fa-file-pdf"
                                  aria-hidden="true"
                                />
                                PDF
                              </button>
                            )}
                            <button
                              type="button"
                              className="aluno-btn aluno-btn--danger aluno-btn--sm"
                              onClick={() => startDelete(p)}
                              title="Excluir projeto"
                            >
                              <i className="fas fa-trash" aria-hidden="true" />
                              Excluir
                            </button>

                            {isDraftProject(p) && (
                              <div className="aluno-status-update">
                                <button
                                  type="button"
                                  className="aluno-btn aluno-btn--primary aluno-btn--sm"
                                  onClick={() => updateStatusProjeto(p)}
                                  disabled={isUpdatingStatusId === p.id}
                                >
                                  {isUpdatingStatusId === p.id
                                    ? "Enviando..."
                                    : "Enviar para análise"}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {showEditModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <h3>Editar projeto</h3>
              <button
                type="button"
                className="modal-close"
                onClick={cancelEdit}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <label className="aluno-field" htmlFor="edit-titulo">
                Título
              </label>
              <input
                id="edit-titulo"
                className="aluno-input"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
              />
              <label className="aluno-field" htmlFor="edit-orientador">
                Orientador
              </label>
              <input
                id="edit-orientador"
                className="aluno-input"
                value={editOrientador}
                onChange={(e) => setEditOrientador(e.target.value)}
              />
              {projectError && (
                <p className="aluno-field aluno-field--error" role="alert">
                  {projectError}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="aluno-btn aluno-btn--ghost"
                onClick={cancelEdit}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="aluno-btn aluno-btn--primary"
                onClick={() => saveEdit(editingId)}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <h3>Excluir projeto</h3>
              <button
                type="button"
                className="modal-close"
                onClick={cancelDelete}
                aria-label="Fechar"
                disabled={isDeleting}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Tem certeza que deseja excluir <strong>{deletingTitulo}</strong>
                ? Esta ação não pode ser desfeita e o PDF será removido.
              </p>
              {projectError && (
                <p className="aluno-field aluno-field--error" role="alert">
                  {projectError}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="aluno-btn aluno-btn--ghost"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="aluno-btn aluno-btn--danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir projeto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal modal--large">
            <div className="modal-header">
              <h3>Visualizar documento</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowViewModal(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="modal-body modal-body--full">
              <iframe
                title="Visualizar PDF"
                src={viewUrl}
                className="aluno-pdf-iframe"
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="aluno-btn aluno-btn--ghost"
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

export default AlunoPanel;
