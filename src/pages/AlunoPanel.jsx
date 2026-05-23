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
import { criarProjetoComPDF } from "../utils/projetosApi";

/** Dados de exemplo: projetos do aluno na plataforma Impulso. */
const PROJETOS_MOCK = [
  {
    id: "1",
    titulo: "IA aplicada ao diagnóstico precoce de doenças raras",
    orientador: "Prof. Dr. Ricardo Mendes",
    curso: "Medicina",
    status: "Em avaliação",
    statusKey: "review",
  },
  {
    id: "2",
    titulo: "Energia solar comunitária no sertão paraibano",
    orientador: "Profa. Dra. Helena Araújo",
    curso: "Engenharia Elétrica",
    status: "Aguardando documentação",
    statusKey: "active",
  },
  {
    id: "3",
    titulo: "Gamificação no ensino de algoritmos",
    orientador: "Prof. Dr. Paulo Nunes",
    curso: "Ciência da Computação",
    status: "Aprovado na etapa regional",
    statusKey: "done",
  },
  {
    id: "5",
    titulo: "teste de criação de projeto",
    orientador: "bruno neto ",
    curso: "Design",
    status: "Rascunho — não enviado",
    statusKey: "pending",
  },
];

const badgeClass = (key) => {
  const map = {
    review: "aluno-badge aluno-badge--review",
    done: "aluno-badge aluno-badge--done",
    active: "aluno-badge aluno-badge--active",
    pending: "aluno-badge aluno-badge--pending",
  };
  return map[key] || map.pending;
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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [projetos, setProjetos] = useState(() => [...PROJETOS_MOCK]);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoProfessor, setNovoProfessor] = useState("");
  const [pdfNome, setPdfNome] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectError, setProjectError] = useState("");
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") fecharDrawer();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, fecharDrawer]);

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

    setProjetos((lista) => [
      {
        id: result.projeto.id,
        titulo: result.projeto.titulo,
        orientador: result.projeto.orientador,
        curso: result.projeto.curso || instituicao || "—",
        status: "Rascunho — não enviado",
        statusKey: "pending",
      },
      ...lista,
    ]);

    fecharDrawer();
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
                  Preencha os dados básicos. O envio do PDF é apenas visual
                  nesta versão de demonstração.
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

              {projectError && (
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
          Acompanhe seu perfil na plataforma e o andamento dos seus projetos
          acadêmicos no Programa Impulso.
        </p>

        <div className="aluno-grid">
          <section
            className="aluno-card"
            aria-labelledby="aluno-perfil-heading"
          >
            <h2 id="aluno-perfil-heading">Meu perfil</h2>
            <div className="aluno-profile-header">
              <div className="aluno-avatar" aria-hidden="true">
                {iniciais}
              </div>
              <p className="aluno-profile-name">{nomeExibicao}</p>
              <p className="aluno-profile-role">
                Aluno participante · Programa Impulso
              </p>
            </div>
            <ul className="aluno-profile-list">
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
                  <strong>Instituição de ensino</strong>
                  {instituicao || "—"}
                </div>
              </li>
              <li>
                <i className="fas fa-graduation-cap" aria-hidden="true" />
                <div>
                  <strong>Acesso</strong>
                  Conta de aluno (demonstração)
                </div>
              </li>
            </ul>
          </section>

          <section
            className="aluno-card"
            aria-labelledby="aluno-projetos-heading"
          >
            <h2 id="aluno-projetos-heading">Meus projetos</h2>
            <p className="aluno-projects-count">
              {projetos.length} projeto
              {projetos.length !== 1 ? "s" : ""} na sua lista
            </p>
            <div className="aluno-projects-table-wrap">
              <table className="aluno-projects-table">
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Orientador</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="aluno-project-title">{p.titulo}</div>
                        <div className="aluno-project-meta">{p.curso}</div>
                      </td>
                      <td>{p.orientador}</td>
                      <td>
                        <span className={badgeClass(p.statusKey)}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AlunoPanel;
