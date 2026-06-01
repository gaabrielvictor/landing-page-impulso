const API_BASE_URL = "http://localhost:5000";

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { error: text || `HTTP ${response.status}` };
}

/**
 * Registra um novo usuário
 * @param {object} userData - Dados do usuário (name, email, password, birthDate, sexo, instituicao, role)
 * @returns {Promise<{ok: boolean, error?: string, user?: object}>}
 */
export async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "Erro ao registrar usuário.",
      };
    }

    return {
      ok: true,
      user: data.user,
    };
  } catch (error) {
    console.error("Erro na requisição de registro:", error);
    return {
      ok: false,
      error: "Erro de conexão. Certifique-se que o servidor está rodando.",
    };
  }
}

/**
 * Faz login de um usuário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<{ok: boolean, error?: string, user?: object}>}
 */
export async function findUserByEmailAndPassword(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "Erro ao fazer login.",
        user: null,
      };
    }

    return {
      ok: true,
      user: data.user,
    };
  } catch (error) {
    console.error("Erro na requisição de login:", error);
    return {
      ok: false,
      error: "Erro de conexão. Certifique-se que o servidor está rodando.",
      user: null,
    };
  }
  
}
// api.js - Adicione estas funções no final do arquivo

/**
 * Lista todos os professores cadastrados no sistema
 * @returns {Promise<{ok: boolean, error?: string, professores?: Array}>}
 */
export async function listarProfessores() {
  try {
    const response = await fetch(`${API_BASE_URL}/professores`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "Erro ao carregar professores.",
        professores: [],
      };
    }

    // Ajusta o formato da resposta
    const professores = Array.isArray(data) ? data : (data.professores || data.data || []);
    
    return {
      ok: true,
      professores: professores,
    };
  } catch (error) {
    console.error("Erro ao listar professores:", error);
    return {
      ok: false,
      error: "Erro de conexão. Certifique-se que o servidor está rodando.",
      professores: [],
    };
  }
}

/**
 * Lista professores por curso
 * @param {string} curso - Nome do curso
 * @returns {Promise<{ok: boolean, error?: string, professores?: Array}>}
 */
export async function listarProfessoresPorCurso(curso) {
  try {
    const response = await fetch(`${API_BASE_URL}/professores/curso/${encodeURIComponent(curso)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "Erro ao carregar professores do curso.",
        professores: [],
      };
    }

    const professores = Array.isArray(data) ? data : (data.professores || data.data || []);
    
    return {
      ok: true,
      professores: professores,
    };
  } catch (error) {
    console.error("Erro ao listar professores por curso:", error);
    return {
      ok: false,
      error: "Erro de conexão. Certifique-se que o servidor está rodando.",
      professores: [],
    };
  }
}

/**
 * Salva avaliadores para um projeto
 * @param {string} projetoId - ID do projeto
 * @param {Array} avaliadoresIds - Array com IDs dos professores avaliadores
 * @returns {Promise<{ok: boolean, error?: string, projeto?: object}>}
 */
export async function salvarAvaliadoresProjeto(projetoId, avaliadoresIds) {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliadores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ avaliadores: avaliadoresIds }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "Erro ao salvar avaliadores.",
      };
    }

    return {
      ok: true,
      projeto: data.projeto,
    };
  } catch (error) {
    console.error("Erro ao salvar avaliadores:", error);
    return {
      ok: false,
      error: "Erro de conexão. Certifique-se que o servidor está rodando.",
    };
  }
}

/**
 * Busca avaliadores de um projeto
 * @param {string} projetoId - ID do projeto
 * @returns {Promise<{ok: boolean, error?: string, avaliadores?: Array}>}
 */
export async function listarAvaliadoresProjeto(projetoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliadores`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "Erro ao buscar avaliadores do projeto.",
        avaliadores: [],
      };
    }

    const avaliadores = Array.isArray(data) ? data : (data.avaliadores || data.data || []);
    
    return {
      ok: true,
      avaliadores: avaliadores,
    };
  } catch (error) {
    console.error("Erro ao listar avaliadores do projeto:", error);
    return {
      ok: false,
      error: "Erro de conexão. Certifique-se que o servidor está rodando.",
      avaliadores: [],
    };
  }
}

/**
 * Busca avaliações (notas e comentários) de um projeto
 * @param {string} projetoId - ID do projeto
 * @returns {Promise<{ok: boolean, error?: string, avaliacoes?: Array}>}
 */
export async function buscarAvaliacoesProjeto(projetoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliacoes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "Erro ao buscar avaliações.",
        avaliacoes: [],
      };
    }

    const avaliacoes = Array.isArray(data) ? data : (data.avaliacoes || data.data || []);
    
    return {
      ok: true,
      avaliacoes: avaliacoes,
    };
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error);
    return {
      ok: false,
      error: "Erro de conexão. Certifique-se que o servidor está rodando.",
      avaliacoes: [],
    };
  }
}

/**
 * Salva uma avaliação (nota e comentário) de um professor para um projeto
 * @param {string} projetoId - ID do projeto
 * @param {number} nota - Nota de 0 a 10
 * @param {string} comentario - Comentário da avaliação
 * @returns {Promise<{ok: boolean, error?: string, avaliacao?: object}>}
 */
export async function salvarAvaliacaoProjeto(projetoId, nota, comentario) {
  try {
    const professorEmail = localStorage.getItem("professorEmail");
    
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliacoes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        professorEmail,
        nota,
        comentario,
      }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "Erro ao salvar avaliação.",
      };
    }

    return {
      ok: true,
      avaliacao: data.avaliacao,
    };
  } catch (error) {
    console.error("Erro ao salvar avaliação:", error);
    return {
      ok: false,
      error: "Erro de conexão. Certifique-se que o servidor está rodando.",
    };
  }
}

/**
 * Busca todos os avaliadores e suas notas para um projeto
 * @param {string} projetoId - ID do projeto
 * @returns {Promise<{ok: boolean, error?: string, avaliadores?: Array}>}
 */
export async function listarAvaliadoresENotas(projetoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/avaliadores-notas`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || "Erro ao buscar avaliadores e notas.",
        avaliadores: [],
      };
    }

    const avaliadores = Array.isArray(data) ? data : (data.avaliadores || data.data || []);
    
    return {
      ok: true,
      avaliadores: avaliadores,
    };
  } catch (error) {
    console.error("Erro ao listar avaliadores e notas:", error);
    return {
      ok: false,
      error: "Erro de conexão. Certifique-se que o servidor está rodando.",
      avaliadores: [],
    };
  }
}
