import React, { useMemo } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/ProfessorPanel.css";
import logo from "../assets/logo.png";

/** Dados de exemplo: projetos em que o professor atua como avaliador/membro. */
const PROJETOS_MOCK = [
  {
    id: "1",
    titulo: "IA aplicada ao diagnóstico precoce de doenças raras",
    aluno: "Ana Beatriz Silva",
    curso: "Medicina",
    status: "Em avaliação",
    statusKey: "review",
    papel: "Avaliador principal",
  },
  {
    id: "2",
    titulo: "Energia solar comunitária no sertão paraibano",
    aluno: "Carlos Eduardo Santos",
    curso: "Engenharia Elétrica",
    status: "Aguardando segunda rodada",
    statusKey: "active",
    papel: "Membro do comitê",
  },
  {
    id: "3",
    titulo: "Gamificação no ensino de algoritmos",
    aluno: "Mariana Costa",
    curso: "Ciência da Computação",
    status: "Avaliação concluída",
    statusKey: "done",
    papel: "Avaliador principal",
  },
  {
    id: "4",
    titulo: "App de acessibilidade para transporte público",
    aluno: "João Pedro Lima",
    curso: "Design",
    status: "Em avaliação",
    statusKey: "review",
    papel: "Membro do comitê",
  },
  {
    id: "5",
    titulo: "Reuso de água cinza em edifícios acadêmicos",
    aluno: "Fernanda Oliveira",
    curso: "Engenharia Civil",
    status: "Submissão incompleta",
    statusKey: "pending",
    papel: "Orientador convidado",
  },
];

const badgeClass = (key) => {
  const map = {
    review: "professor-badge professor-badge--review",
    done: "professor-badge professor-badge--done",
    active: "professor-badge professor-badge--active",
    pending: "professor-badge professor-badge--pending",
  };
  return map[key] || map.pending;
};

const ProfessorPanel = () => {
  const navigate = useNavigate();
  const isAuth = localStorage.getItem("isAdmin") === "true";
  const email = localStorage.getItem("professorEmail") || "";

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
          Acompanhe seu perfil na plataforma e os projetos acadêmicos em que
          você participa como avaliador ou membro do comitê.
        </p>

        <div className="professor-grid">
          <section
            className="professor-card"
            aria-labelledby="professor-perfil-heading"
          >
            <h2 id="professor-perfil-heading">Meu perfil</h2>
            <div className="professor-profile-header">
              <div className="professor-avatar" aria-hidden="true">
                {iniciais}
              </div>
              <p className="professor-profile-name">{nomeExibicao}</p>
              <p className="professor-profile-role">
                Professor avaliador · Comitê Impulso
              </p>
            </div>
            <ul className="professor-profile-list">
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
                  Centro de Ensino Superior e Desenvolvimento — Unifacisa - 
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
          </section>

          <section
            className="professor-card"
            aria-labelledby="professor-projetos-heading"
          >
            <h2 id="professor-projetos-heading">Projetos em que participo</h2>
            <p className="professor-projects-count">
              {PROJETOS_MOCK.length} projeto
              {PROJETOS_MOCK.length !== 1 ? "s" : ""} na sua lista
            </p>
            <div className="professor-projects-table-wrap">
              <table className="professor-projects-table">
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Papel</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PROJETOS_MOCK.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="professor-project-title">
                          {p.titulo}
                        </div>
                        <div className="professor-project-meta">
                          {p.aluno} · {p.curso}
                        </div>
                      </td>
                      <td>{p.papel}</td>
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

export default ProfessorPanel;
