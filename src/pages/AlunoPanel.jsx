// AlunoPanel.jsx
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
import "../styles/Footer.css";
import logo from "../assets/logo.png";
import {
  criarProjetoComPDF,
  atualizarProjeto,
  listarProjetosAluno,
  excluirProjeto,
  getProjetoArquivoUrl,
  listarProfessores,
  buscarAvaliacoesProjeto,
  salvarAvaliadoresProjeto,
  listarAvaliadoresProjeto,
  buscarFeedbacksProjeto,
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
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoCurso, setNovoCurso] = useState("");
  const [pdfNome, setPdfNome] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectError, setProjectError] = useState("");
  const fileInputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editOrientador, setEditOrientador] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editCurso, setEditCurso] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingTitulo, setDeletingTitulo] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState(null);
  
  // States para seleção de avaliadores
  const [professoresList, setProfessoresList] = useState([]);
  const [isLoadingProfessores, setIsLoadingProfessores] = useState(true);
  const [selectedAvaliadores, setSelectedAvaliadores] = useState({});
  const [savingAvaliadorId, setSavingAvaliadorId] = useState(null);
  const [avaliacoesProjetos, setAvaliacoesProjetos] = useState({});
  const [showAvaliacoesModal, setShowAvaliacoesModal] = useState(false);
  const [avaliacoesDetalhadas, setAvaliacoesDetalhadas] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);
  
  // States para feedbacks
  const [showFeedbacksModal, setShowFeedbacksModal] = useState(false);
  const [feedbacksList, setFeedbacksList] = useState([]);
  
  // States para edição de avaliadores no modal
  const [editSelectedAvaliadores, setEditSelectedAvaliadores] = useState([]);

  const resetFormNovoProjeto = useCallback(() => {
    setNovoTitulo("");
    setNovoProfessor("");
    setNovaDescricao("");
    setNovoCurso("");
    setPdfNome("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const fecharDrawer = useCallback(() => {
    setDrawerOpen(false);
    resetFormNovoProjeto();
  }, [resetFormNovoProjeto]);

  // Carregar lista de professores
  const carregarProfessores = useCallback(async () => {
    setIsLoadingProfessores(true);
    console.log("🔄 Carregando professores...");
    const res = await listarProfessores();
    
    setIsLoadingProfessores(false);
    
    if (res.ok && res.professores) {
      const professoresFormatados = res.professores.map(prof => ({
        id: prof.id || prof._id,
        nome: prof.name || prof.nome,
        email: prof.email,
        instituicao: prof.instituicao || prof.curso || "",
      }));
      setProfessoresList(professoresFormatados);
      console.log(`✅ ${professoresFormatados.length} professores carregados`);
    } else {
      console.error("❌ Erro ao carregar professores:", res.error);
    }
  }, []);

  // Carregar avaliadores de cada projeto
  const carregarAvaliadoresProjeto = useCallback(async (projetoId) => {
    const res = await listarAvaliadoresProjeto(projetoId);
    if (res.ok && res.avaliadores) {
      setSelectedAvaliadores(prev => ({
        ...prev,
        [projetoId]: res.avaliadores.map(a => a.id || a._id)
      }));
    }
  }, []);

  // Carregar avaliações de um projeto
  const carregarAvaliacoesProjeto = useCallback(async (projetoId) => {
    const res = await buscarAvaliacoesProjeto(projetoId);
    if (res.ok && res.avaliacoes) {
      setAvaliacoesProjetos(prev => ({
        ...prev,
        [projetoId]: res.avaliacoes
      }));
    }
  }, []);

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
    
    // Carregar avaliadores e avaliações para cada projeto
    if (res.projetos && res.projetos.length > 0) {
      for (const projeto of res.projetos) {
        await carregarAvaliadoresProjeto(projeto.id);
        await carregarAvaliacoesProjeto(projeto.id);
      }
    }
  }, [email, carregarAvaliadoresProjeto, carregarAvaliacoesProjeto]);

  useEffect(() => {
    carregarProjetos();
    carregarProfessores();
  }, [carregarProjetos, carregarProfessores]);

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
    drawerOpen || showEditModal || showViewModal || showDeleteModal || showAvaliacoesModal || showFeedbacksModal;

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
        setEditDescricao("");
        setEditCurso("");
        setEditSelectedAvaliadores([]);
        setShowEditModal(false);
      } else if (showAvaliacoesModal) {
        setShowAvaliacoesModal(false);
      } else if (showFeedbacksModal) {
        setShowFeedbacksModal(false);
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
    showAvaliacoesModal,
    showFeedbacksModal,
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

  const calcularMedia = (projetoId) => {
    const avaliacoes = avaliacoesProjetos[projetoId] || [];
    if (avaliacoes.length === 0) return null;
    
    const soma = avaliacoes.reduce((acc, av) => acc + (av.nota || 0), 0);
    const media = soma / avaliacoes.length;
    return media.toFixed(1);
  };

  const temAvaliacoes = (projetoId) => {
    const avaliacoes = avaliacoesProjetos[projetoId] || [];
    return avaliacoes.length > 0;
  };

  const temFeedbacks = (projeto) => {
    return projeto.professorFeedback && projeto.professorFeedback.trim() !== "";
  };

  const verDetalhesAvaliacoes = (projeto) => {
    const avaliacoes = avaliacoesProjetos[projeto.id] || [];
    setProjetoSelecionado(projeto);
    setAvaliacoesDetalhadas(avaliacoes);
    setShowAvaliacoesModal(true);
  };

  // Função atualizada para buscar feedbacks com nome dos professores
  const verDetalhesFeedbacks = async (projeto) => {
    setProjetoSelecionado(projeto);
    setShowFeedbacksModal(true);
    
    const feedbacks = [];
    
    // Adicionar feedback do orientador (se existir)
    if (projeto.professorFeedback && projeto.professorFeedback.trim() !== "") {
      feedbacks.push({
        professor: projeto.professorNome || "Professor Orientador",
        professorEmail: projeto.professorEmail,
        feedback: projeto.professorFeedback,
        data: projeto.professorFeedbackEm,
        tipo: "orientador",
        nota: null,
      });
    }
    
    // Adicionar feedbacks das avaliações
    const avaliacoes = avaliacoesProjetos[projeto.id] || [];
    avaliacoes.forEach(av => {
      if (av.comentario && av.comentario.trim() !== "") {
        feedbacks.push({
          professor: av.professorNome || av.professorEmail || "Professor Avaliador",
          professorEmail: av.professorEmail,
          feedback: av.comentario,
          data: av.dataCriacao,
          tipo: "avaliador",
          nota: av.nota,
        });
      }
    });
    
    // Buscar feedbacks adicionais da API
    try {
      const res = await buscarFeedbacksProjeto(projeto.id);
      if (res.ok && res.feedbacks) {
        for (const fb of res.feedbacks) {
          const existe = feedbacks.some(f => 
            f.feedback === fb.feedback && f.data === fb.data
          );
          if (!existe) {
            feedbacks.push({
              professor: fb.professorNome || "Professor",
              professorEmail: fb.professorEmail,
              feedback: fb.feedback,
              data: fb.data,
              tipo: fb.tipo || "feedback",
              nota: fb.nota,
            });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar feedbacks da API:", error);
    }
    
    // Ordenar por data (mais recente primeiro)
    feedbacks.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    setFeedbacksList(feedbacks);
  };

  // Função para adicionar avaliador
  const adicionarAvaliador = async (projetoId, professorId) => {
    const currentSelected = selectedAvaliadores[projetoId] || [];
    
    if (currentSelected.length >= 3) {
      setProjectError("Você pode selecionar no máximo 3 professores avaliadores por projeto.");
      setTimeout(() => setProjectError(""), 3000);
      return;
    }
    
    if (currentSelected.includes(professorId)) {
      return;
    }
    
    const newSelected = [...currentSelected, professorId];
    
    setSelectedAvaliadores(prev => ({
      ...prev,
      [projetoId]: newSelected
    }));
    
    setSavingAvaliadorId(projetoId);
    const res = await salvarAvaliadoresProjeto(projetoId, newSelected);
    setSavingAvaliadorId(null);
    
    if (!res.ok) {
      setProjectError(res.error || "Erro ao salvar avaliadores.");
      setSelectedAvaliadores(prev => ({
        ...prev,
        [projetoId]: currentSelected
      }));
      setTimeout(() => setProjectError(""), 3000);
    }
  };

  // Função para remover avaliador
  const removerAvaliador = async (projetoId, professorId) => {
    const currentSelected = selectedAvaliadores[projetoId] || [];
    const newSelected = currentSelected.filter(id => id !== professorId);
    
    setSelectedAvaliadores(prev => ({
      ...prev,
      [projetoId]: newSelected
    }));
    
    setSavingAvaliadorId(projetoId);
    const res = await salvarAvaliadoresProjeto(projetoId, newSelected);
    setSavingAvaliadorId(null);
    
    if (!res.ok) {
      setProjectError(res.error || "Erro ao remover avaliador.");
      setSelectedAvaliadores(prev => ({
        ...prev,
        [projetoId]: currentSelected
      }));
      setTimeout(() => setProjectError(""), 3000);
    }
  };

  // Função para editar avaliadores no modal
  const toggleEditAvaliador = (professorId) => {
    setEditSelectedAvaliadores(prev => {
      if (prev.includes(professorId)) {
        return prev.filter(id => id !== professorId);
      } else {
        if (prev.length >= 3) {
          setProjectError("Você pode selecionar no máximo 3 professores avaliadores.");
          setTimeout(() => setProjectError(""), 3000);
          return prev;
        }
        return [...prev, professorId];
      }
    });
  };

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
      curso: novoCurso || instituicao,
      titulo,
      orientador,
      descricao: novaDescricao,
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
    setEditDescricao(p.descricao || "");
    setEditCurso(p.curso || "");
    setEditSelectedAvaliadores([...(selectedAvaliadores[p.id] || [])]);
    setProjectError("");
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitulo("");
    setEditOrientador("");
    setEditDescricao("");
    setEditCurso("");
    setEditSelectedAvaliadores([]);
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
      curso: editCurso.trim(),
      descricao: editDescricao.trim(),
      alunoEmail: email,
    });

    if (!res.ok) {
      setProjectError(res.error || "Erro ao atualizar projeto.");
      return;
    }

    const avaliadoresRes = await salvarAvaliadoresProjeto(id, editSelectedAvaliadores);
    
    if (!avaliadoresRes.ok) {
      setProjectError(avaliadoresRes.error || "Erro ao salvar avaliadores.");
      return;
    }

    setProjetos((lista) => lista.map((p) => (p.id === id ? res.projeto : p)));
    setSelectedAvaliadores(prev => ({
      ...prev,
      [id]: editSelectedAvaliadores
    }));
    
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

  const AvaliacoesModal = () => (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal modal--large">
        <div className="modal-header">
          <h3>Avaliações do Projeto</h3>
          <h4>{projetoSelecionado?.titulo}</h4>
          <button
            type="button"
            className="modal-close"
            onClick={() => setShowAvaliacoesModal(false)}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {avaliacoesDetalhadas.length === 0 ? (
            <p>Nenhuma avaliação recebida ainda.</p>
          ) : (
            <>
              <div className="avaliacoes-lista">
                {avaliacoesDetalhadas.map((avaliacao, index) => (
                  <div key={index} className="avaliacao-card">
                    <div className="avaliacao-header">
                      <strong>{avaliacao.professorNome || avaliacao.professorEmail}</strong>
                      <span className="avaliacao-nota">Nota: {avaliacao.nota}/10</span>
                    </div>
                    <div className="avaliacao-comentario">
                      <p>{avaliacao.comentario}</p>
                    </div>
                    <div className="avaliacao-data">
                      {formatDateTime(avaliacao.dataCriacao)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="avaliacao-media-final">
                <strong>Média Final: {calcularMedia(projetoSelecionado?.id)}/10</strong>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="aluno-btn aluno-btn--ghost"
            onClick={() => setShowAvaliacoesModal(false)}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  const FeedbacksModal = () => (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal modal--large">
        <div className="modal-header">
          <h3>Feedbacks e Avaliações</h3>
          <h4>{projetoSelecionado?.titulo}</h4>
          <button
            type="button"
            className="modal-close"
            onClick={() => setShowFeedbacksModal(false)}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {feedbacksList.length === 0 ? (
            <div className="empty-feedbacks">
              <i className="fas fa-comment-slash"></i>
              <p>Nenhum feedback ou avaliação recebida ainda.</p>
              <small>Quando um professor enviar feedback, aparecerá aqui.</small>
            </div>
          ) : (
            <div className="feedbacks-lista">
              {feedbacksList.map((feedback, index) => (
                <div 
                  key={index} 
                  className={`feedback-card ${feedback.tipo === 'avaliador' ? 'avaliacao-feedback' : 'orientador-feedback'}`}
                >
                  <div className="feedback-header">
                    <div className="feedback-professor">
                      <i className="fas fa-user-tie"></i>
                      <strong>{feedback.professor}</strong>
                      {feedback.professorEmail && (
                        <span className="feedback-email">{feedback.professorEmail}</span>
                      )}
                      <span className={`feedback-tipo ${feedback.tipo === 'avaliador' ? 'tipo-avaliacao' : 'tipo-orientador'}`}>
                        {feedback.tipo === 'avaliador' ? 'Avaliador' : 'Orientador'}
                      </span>
                    </div>
                    <span className="feedback-date">
                      <i className="far fa-calendar-alt"></i>
                      {formatDateTime(feedback.data)}
                    </span>
                  </div>
                  {feedback.nota && (
                    <div className="feedback-nota">
                      <i className="fas fa-star"></i>
                      Nota: <strong>{feedback.nota}/10</strong>
                    </div>
                  )}
                  <div className="feedback-message">
                    <p>{feedback.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="aluno-btn aluno-btn--ghost"
            onClick={() => setShowFeedbacksModal(false)}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

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
                  Preencha os dados e anexe o PDF do seu projeto para salvar como rascunho.
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
                Título do projeto *
              </label>
              <input
                id="aluno-novo-titulo"
                className="aluno-input"
                type="text"
                placeholder="Ex.: Plataforma de mentoria entre pares"
                value={novoTitulo}
                onChange={(ev) => setNovoTitulo(ev.target.value)}
                required
              />

              <label className="aluno-field" htmlFor="aluno-novo-curso">
                Curso
              </label>
              <input
                id="aluno-novo-curso"
                className="aluno-input"
                type="text"
                placeholder="Ex.: Sistemas de Informação"
                value={novoCurso}
                onChange={(ev) => setNovoCurso(ev.target.value)}
              />

              <label className="aluno-field" htmlFor="aluno-novo-descricao">
                Descrição do projeto
              </label>
              <textarea
                id="aluno-novo-descricao"
                className="aluno-input"
                rows="4"
                placeholder="Descreva seu projeto..."
                value={novaDescricao}
                onChange={(ev) => setNovaDescricao(ev.target.value)}
              />

              <label className="aluno-field" htmlFor="aluno-novo-professor">
                Professor orientador *
              </label>
              <input
                id="aluno-novo-professor"
                className="aluno-input"
                type="text"
                placeholder="Nome completo do docente orientador"
                value={novoProfessor}
                onChange={(ev) => setNovoProfessor(ev.target.value)}
                required
              />

              <span className="aluno-field">Documento (PDF) *</span>
              <p className="aluno-upload-hint">
                Arraste ou clique para anexar o PDF do seu projeto.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="aluno-file-input"
                onChange={handlePdfChange}
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

            {projectError && (
              <p className="aluno-field aluno-field--error" role="alert">
                {projectError}
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
                      <th>Avaliadores</th>
                      <th>Notas</th>
                      <th>Feedbacks</th>
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
                          {p.descricao && (
                            <div className="aluno-descricao-preview">
                              {p.descricao.length > 100 
                                ? p.descricao.substring(0, 100) + "..." 
                                : p.descricao}
                            </div>
                          )}
                        </td>
                        <td>{p.orientador}</td>
                        <td>
                          <span className={badgeClass(p.statusKey)}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div className="aluno-avaliadores-select">
                            {isLoadingProfessores ? (
                              <div className="loading-small">
                                <i className="fas fa-spinner fa-spin" />
                              </div>
                            ) : professoresList.length === 0 ? (
                              <p className="aluno-sem-avaliadores">
                                Nenhum professor cadastrado
                              </p>
                            ) : (
                              <>
                                <select
                                  className="aluno-multi-select"
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      adicionarAvaliador(p.id, e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  disabled={savingAvaliadorId === p.id || (selectedAvaliadores[p.id] || []).length >= 3}
                                >
                                  <option value="">Selecionar professor...</option>
                                  {professoresList
                                    .filter(prof => !(selectedAvaliadores[p.id] || []).includes(prof.id))
                                    .map(prof => (
                                      <option key={prof.id} value={prof.id}>
                                        {prof.nome}
                                      </option>
                                    ))}
                                </select>
                                
                                <div className="selected-avaliadores">
                                  {(selectedAvaliadores[p.id] || []).map(profId => {
                                    const prof = professoresList.find(prof => prof.id === profId);
                                    return prof ? (
                                      <div key={profId} className="avaliador-tag">
                                        <span className="avaliador-nome">{prof.nome}</span>
                                        <button
                                          type="button"
                                          onClick={() => removerAvaliador(p.id, profId)}
                                          className="remove-avaliador"
                                          disabled={savingAvaliadorId === p.id}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                                
                                {savingAvaliadorId === p.id && (
                                  <div className="saving-indicator">
                                    <i className="fas fa-spinner fa-spin" />
                                    <span>Salvando...</span>
                                  </div>
                                )}
                                
                                <div className="avaliadores-counter">
                                  {(selectedAvaliadores[p.id] || []).length} de 3 professores
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="aluno-notas-cell">
                          {temAvaliacoes(p.id) ? (
                            <button
                              type="button"
                              className="aluno-btn-notas"
                              onClick={() => verDetalhesAvaliacoes(p)}
                            >
                              <span className="media-nota">{calcularMedia(p.id)}</span>
                              <span className="qtd-avaliacoes">
                                {avaliacoesProjetos[p.id]?.length || 0} avaliação(ões)
                              </span>
                            </button>
                          ) : (
                            <span className="aluno-sem-avaliacao">
                              Sem avaliações
                            </span>
                          )}
                        </td>
                        <td className="aluno-feedbacks-cell">
                          {temFeedbacks(p) || avaliacoesProjetos[p.id]?.some(av => av.comentario) ? (
                            <button
                              type="button"
                              className="aluno-btn-feedback"
                              onClick={() => verDetalhesFeedbacks(p)}
                            >
                              <i className="fas fa-comment-dots" />
                              <span>Ver feedbacks</span>
                            </button>
                          ) : (
                            <span className="aluno-sem-feedback">
                              Sem feedbacks
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="aluno-project-actions">
                            <button
                              type="button"
                              className="aluno-btn aluno-btn--ghost aluno-btn--sm"
                              onClick={() => startEdit(p)}
                              title="Editar projeto"
                            >
                              <i className="fas fa-pen" />
                              Editar
                            </button>
                            {p.arquivos?.length > 0 && (
                              <button
                                type="button"
                                className="aluno-btn aluno-btn--sm"
                                onClick={() => openViewPdf(p)}
                                title="Visualizar PDF"
                              >
                                <i className="fas fa-file-pdf" />
                                PDF
                              </button>
                            )}
                            <button
                              type="button"
                              className="aluno-btn aluno-btn--danger aluno-btn--sm"
                              onClick={() => startDelete(p)}
                              title="Excluir projeto"
                            >
                              <i className="fas fa-trash" />
                              Excluir
                            </button>

                            {isDraftProject(p) && (
                              <button
                                type="button"
                                className="aluno-btn aluno-btn--primary aluno-btn--sm"
                                onClick={() => updateStatusProjeto(p)}
                                disabled={isUpdatingStatusId === p.id}
                              >
                                {isUpdatingStatusId === p.id
                                  ? "Enviando..."
                                  : "Enviar"}
                              </button>
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

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal modal--large">
            <div className="modal-header">
              <h3>Editar Projeto</h3>
              <button
                type="button"
                className="modal-close"
                onClick={cancelEdit}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <label className="aluno-field">Título do projeto *</label>
              <input
                className="aluno-input"
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                placeholder="Título do projeto"
              />

              <label className="aluno-field">Curso</label>
              <input
                className="aluno-input"
                value={editCurso}
                onChange={(e) => setEditCurso(e.target.value)}
                placeholder="Curso"
              />

              <label className="aluno-field">Descrição</label>
              <textarea
                className="aluno-input"
                rows="5"
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                placeholder="Descreva seu projeto..."
              />

              <label className="aluno-field">Professor orientador *</label>
              <input
                className="aluno-input"
                value={editOrientador}
                onChange={(e) => setEditOrientador(e.target.value)}
                placeholder="Nome do orientador"
              />

              <label className="aluno-field">Professores Avaliadores (máx. 3)</label>
              <div className="edit-avaliadores-container">
                {isLoadingProfessores ? (
                  <div className="loading-small">
                    <i className="fas fa-spinner fa-spin" />
                    Carregando...
                  </div>
                ) : (
                  <>
                    <select
                      className="aluno-multi-select"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          toggleEditAvaliador(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      disabled={editSelectedAvaliadores.length >= 3}
                    >
                      <option value="">Adicionar avaliador...</option>
                      {professoresList
                        .filter(prof => !editSelectedAvaliadores.includes(prof.id))
                        .map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.nome}
                          </option>
                        ))}
                    </select>
                    
                    <div className="selected-avaliadores">
                      {editSelectedAvaliadores.map(profId => {
                        const prof = professoresList.find(p => p.id === profId);
                        return prof ? (
                          <div key={profId} className="avaliador-tag">
                            <span className="avaliador-nome">{prof.nome}</span>
                            <button
                              type="button"
                              onClick={() => toggleEditAvaliador(profId)}
                              className="remove-avaliador"
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                    
                    <div className="avaliadores-counter">
                      {editSelectedAvaliadores.length} de 3 professores selecionados
                    </div>
                  </>
                )}
              </div>

              {projectError && (
                <p className="aluno-field aluno-field--error">{projectError}</p>
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
                Salvar alterações
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
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Tem certeza que deseja excluir <strong>{deletingTitulo}</strong>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="aluno-btn aluno-btn--ghost"
                onClick={cancelDelete}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="aluno-btn aluno-btn--danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal modal--large">
            <div className="modal-header">
              <h3>Visualizar PDF</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowViewModal(false)}
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

      {showAvaliacoesModal && <AvaliacoesModal />}
      {showFeedbacksModal && <FeedbacksModal />}
    </div>
  );
};

export default AlunoPanel;