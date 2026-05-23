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
