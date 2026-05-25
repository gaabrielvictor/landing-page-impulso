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
}) {
  try {
    const formData = new FormData();
    formData.append("alunoEmail", alunoEmail);
    formData.append("alunoName", alunoName);
    formData.append("titulo", titulo);
    formData.append("orientador", orientador);
    if (curso) formData.append("curso", curso);
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
