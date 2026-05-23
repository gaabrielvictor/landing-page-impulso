const API_BASE_URL = "http://localhost:5000";

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

    return { ok: true, projeto: data.projeto };
  } catch (error) {
    console.error("Erro ao criar projeto com PDF:", error);
    return { ok: false, error: "Erro de conexão. Verifique o servidor." };
  }
}
