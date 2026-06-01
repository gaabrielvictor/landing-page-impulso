// utils/projetosApi.js
export const API_BASE_URL = "http://localhost:5000";

const STATUS_MAP = {
  rascunho: { status: "Rascunho — não enviado", statusKey: "pending" },
  enviado: { status: "Enviado", statusKey: "active" },
  em_avaliacao: { status: "Em avaliação", statusKey: "review" },
  aprovado: { status: "Aprovado", statusKey: "done" },
  rejeitado: { status: "Rejeitado", statusKey: "pending" },
};

export function mapProjetoFromApi(projeto = {}) {
  const s = STATUS_MAP[projeto.status] || STATUS_MAP.rascunho;
  return {
    ...projeto,
    alunoName: projeto.alunoName || projeto.alunoEmail || "Aluno",
    curso: projeto.curso || "",
    status: s.status,
    statusKey: s.statusKey,
  };
}

export function getProjetoArquivoUrl(projetoId, fileId) {
  return `${API_BASE_URL}/projetos/${projetoId}/arquivo/${fileId}`;
}

export async function listarProjetosProfessor() {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/avaliacao`);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao carregar projetos.",
      };
    }

    return {
      ok: true,
      projetos: (data.projetos || []).map(mapProjetoFromApi),
    };
  } catch (error) {
    console.error("Erro ao listar projetos do professor:", error);
    return { ok: false, error: "Erro de conexão. Verifique o servidor." };
  }
}

export async function listarProjetosAluno(alunoEmail) {
  try {
    const email = encodeURIComponent(alunoEmail.trim().toLowerCase());
    const response = await fetch(`${API_BASE_URL}/projetos/aluno/${email}`);
    const data = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao carregar projetos.",
      };
    }
    return {
      ok: true,
      projetos: (data.projetos || []).map(mapProjetoFromApi),
    };
  } catch (error) {
    console.error("Erro ao listar projetos:", error);
    return { ok: false, error: "Erro de conexão. Verifique o servidor." };
  }
}

export async function criarProjetoComPDF({
  alunoEmail,
  alunoName,
  titulo,
  orientador,
  curso,
  arquivo,
  professorAvaliador = null,
}) {
  try {
    const formData = new FormData();
    formData.append("alunoEmail", alunoEmail);
    formData.append("alunoName", alunoName);
    formData.append("titulo", titulo);
    formData.append("orientador", orientador);
    if (curso) formData.append("curso", curso);
    if (professorAvaliador) formData.append("professorAvaliador", professorAvaliador);
    formData.append("pdf", arquivo);

    const response = await fetch(`${API_BASE_URL}/projetos/novo`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || "Erro ao enviar o projeto." };
    }

    return { ok: true, projeto: mapProjetoFromApi(data.projeto) };
  } catch (error) {
    console.error("Erro ao criar projeto com PDF:", error);
    return { ok: false, error: "Erro de conexão. Verifique o servidor." };
  }
}

export async function atualizarProjeto(
  id,
  { titulo, orientador, status, alunoEmail },
) {
  try {
    const body = {};
    if (titulo !== undefined) body.titulo = titulo;
    if (orientador !== undefined) body.orientador = orientador;
    if (status !== undefined) body.status = status;

    const params = new URLSearchParams();
    if (alunoEmail) params.set("alunoEmail", alunoEmail);

    const response = await fetch(
      `${API_BASE_URL}/projetos/${id}?${params.toString()}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    if (!response.ok)
      return { ok: false, error: data.error || "Erro ao atualizar projeto." };
    return { ok: true, projeto: mapProjetoFromApi(data.projeto) };
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    return { ok: false, error: "Erro de conexão. Verifique o servidor." };
  }
}

export async function salvarFeedbackProjeto(id, feedback) {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/${id}/feedback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao salvar o feedback.",
      };
    }

    return { ok: true, projeto: mapProjetoFromApi(data.projeto) };
  } catch (error) {
    console.error("Erro ao salvar feedback do professor:", error);
    return { ok: false, error: "Erro de conexão. Verifique o servidor." };
  }
}

export async function excluirProjeto(id, alunoEmail) {
  try {
    const params = new URLSearchParams();
    if (alunoEmail) params.set("alunoEmail", alunoEmail);

    const response = await fetch(
      `${API_BASE_URL}/projetos/${id}?${params.toString()}`,
      { method: "DELETE" },
    );

    const data = await response.json();
    if (!response.ok)
      return { ok: false, error: data.error || "Erro ao excluir projeto." };
    return { ok: true };
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
    return { ok: false, error: "Erro de conexão. Verifique o servidor." };
  }
}

// ========== FUNÇÕES PARA PROFESSORES E AVALIAÇÕES ==========

// Buscar todos os professores cadastrados no banco (CORRIGIDO - rota /professores)
export async function listarProfessores() {
  try {
    console.log("Buscando professores em:", `${API_BASE_URL}/professores`);
    const response = await fetch(`${API_BASE_URL}/professores`);
    console.log("Resposta status:", response.status);
    
    if (!response.ok) {
      console.error("Erro na resposta:", response.status);
      return {
        ok: false,
        error: `Erro ${response.status}: Rota /professores não encontrada. Verifique se o backend está rodando.`,
        professores: [],
      };
    }
    
    const data = await response.json();
    console.log("Dados recebidos:", data);

    let professores = [];
    if (Array.isArray(data)) {
      professores = data;
    } else if (data.professores && Array.isArray(data.professores)) {
      professores = data.professores;
    } else if (data.data && Array.isArray(data.data)) {
      professores = data.data;
    }

    const professoresFormatados = professores.map(prof => ({
      id: prof.id || prof._id,
      nome: prof.name || prof.nome,
      email: prof.email,
      instituicao: prof.instituicao || prof.curso || "",
    }));

    console.log(`${professoresFormatados.length} professores carregados`);
    
    return {
      ok: true,
      professores: professoresFormatados,
    };
  } catch (error) {
    console.error("Erro ao listar professores:", error);
    return { 
      ok: false, 
      error: "Erro de conexão. Verifique se o servidor está rodando em " + API_BASE_URL, 
      professores: [] 
    };
  }
}

// Buscar professores por curso
export async function listarProfessoresPorCurso(curso) {
  try {
    console.log(`Buscando professores do curso: ${curso}`);
    const response = await fetch(`${API_BASE_URL}/professores/curso/${encodeURIComponent(curso)}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao carregar professores do curso.",
        professores: [],
      };
    }

    let professores = [];
    if (Array.isArray(data)) {
      professores = data;
    } else if (data.professores && Array.isArray(data.professores)) {
      professores = data.professores;
    } else if (data.data && Array.isArray(data.data)) {
      professores = data.data;
    }

    const professoresFormatados = professores.map(prof => ({
      id: prof.id || prof._id,
      nome: prof.name || prof.nome,
      email: prof.email,
      instituicao: prof.instituicao || prof.curso || "",
    }));

    return {
      ok: true,
      professores: professoresFormatados,
    };
  } catch (error) {
    console.error("Erro ao listar professores por curso:", error);
    return { ok: false, error: "Erro de conexão.", professores: [] };
  }
}

// Salvar múltiplos avaliadores para um projeto
export async function salvarAvaliadoresProjeto(projetoId, avaliadoresIds) {
  try {
    console.log(`Salvando avaliadores para projeto ${projetoId}:`, avaliadoresIds);
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliadores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        avaliadores: avaliadoresIds,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao salvar avaliadores.",
      };
    }

    return {
      ok: true,
      projeto: data.projeto ? mapProjetoFromApi(data.projeto) : null,
    };
  } catch (error) {
    console.error("Erro ao salvar avaliadores:", error);
    return { ok: false, error: "Erro de conexão." };
  }
}

// Buscar avaliações de um projeto específico
export async function buscarAvaliacoesProjeto(projetoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliacoes`);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao buscar avaliações.",
        avaliacoes: [],
      };
    }

    let avaliacoes = [];
    if (Array.isArray(data)) {
      avaliacoes = data;
    } else if (data.avaliacoes && Array.isArray(data.avaliacoes)) {
      avaliacoes = data.avaliacoes;
    }

    return {
      ok: true,
      avaliacoes: avaliacoes,
    };
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error);
    return { ok: false, error: "Erro de conexão.", avaliacoes: [] };
  }
}

// Salvar avaliação de um projeto (para professores)
export async function salvarAvaliacaoProjeto(projetoId, nota, comentario) {
  try {
    const professorEmail = localStorage.getItem("professorEmail");
    
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        professorEmail,
        nota,
        comentario,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao salvar avaliação.",
      };
    }

    return {
      ok: true,
      avaliacao: data.avaliacao,
    };
  } catch (error) {
    console.error("Erro ao salvar avaliação:", error);
    return { ok: false, error: "Erro de conexão." };
  }
}

// Buscar todos os avaliadores e notas de um projeto
export async function listarAvaliadoresENotas(projetoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliadores-notas`);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao buscar avaliadores.",
        avaliadores: [],
      };
    }

    let avaliadores = [];
    if (Array.isArray(data)) {
      avaliadores = data;
    } else if (data.avaliadores && Array.isArray(data.avaliadores)) {
      avaliadores = data.avaliadores;
    }

    return {
      ok: true,
      avaliadores: avaliadores,
    };
  } catch (error) {
    console.error("Erro ao listar avaliadores:", error);
    return { ok: false, error: "Erro de conexão.", avaliadores: [] };
  }
}

// Buscar avaliadores de um projeto (apenas os IDs e nomes)
export async function listarAvaliadoresProjeto(projetoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliadores`);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao buscar avaliadores do projeto.",
        avaliadores: [],
      };
    }

    let avaliadores = [];
    if (Array.isArray(data)) {
      avaliadores = data;
    } else if (data.avaliadores && Array.isArray(data.avaliadores)) {
      avaliadores = data.avaliadores;
    }

    const avaliadoresFormatados = avaliadores.map(av => ({
      id: av.id || av._id,
      nome: av.name || av.nome,
      email: av.email,
    }));

    return {
      ok: true,
      avaliadores: avaliadoresFormatados,
    };
  } catch (error) {
    console.error("Erro ao listar avaliadores do projeto:", error);
    return { ok: false, error: "Erro de conexão.", avaliadores: [] };
  }
}

// ========== NOVA FUNÇÃO PARA BUSCAR FEEDBACKS COMPLETOS ==========

/**
 * Busca todos os feedbacks de um projeto (orientador + avaliadores)
 * @param {string} projetoId - ID do projeto
 * @returns {Promise<{ok: boolean, error?: string, feedbacks?: Array}>}
 */
export async function buscarFeedbacksProjeto(projetoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/feedbacks-completos`);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || "Erro ao buscar feedbacks.",
        feedbacks: [],
      };
    }

    let feedbacks = [];
    if (Array.isArray(data)) {
      feedbacks = data;
    } else if (data.feedbacks && Array.isArray(data.feedbacks)) {
      feedbacks = data.feedbacks;
    }

    return {
      ok: true,
      feedbacks: feedbacks,
    };
  } catch (error) {
    console.error("Erro ao buscar feedbacks:", error);
    return { ok: false, error: "Erro de conexão.", feedbacks: [] };
  }
}