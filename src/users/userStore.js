import seedData from "./Usuarios.json";

const STORAGE_KEY = "impulso_usuarios_registrados";

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const readStoredUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredUsers = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

const seedUsers = Array.isArray(seedData.usuarios) ? seedData.usuarios : [];

/** Usuários do JSON inicial + cadastrados em localStorage */
export function getAllUsers() {
  return [...seedUsers, ...readStoredUsers()];
}

export function findUserByEmailAndPassword(email, password) {
  const target = normalizeEmail(email);
  return (
    getAllUsers().find(
      (u) => normalizeEmail(u.email) === target && u.password === password,
    ) || null
  );
}

/**
 * @param {object} payload — campos do formulário de registro + password
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function registerUser(payload) {
  const emailNorm = normalizeEmail(payload.email);
  if (!emailNorm) {
    return { ok: false, error: "E-mail inválido." };
  }
  const exists = getAllUsers().some(
    (u) => normalizeEmail(u.email) === emailNorm,
  );
  if (exists) {
    return { ok: false, error: "duplicate_email" };
  }
  const allowedRoles = ["aluno", "professor"];
  const role = allowedRoles.includes(payload.role) ? payload.role : "aluno";

  const newUser = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `u-${Date.now()}`,
    name: payload.name,
    birthDate: payload.birthDate,
    sexo: payload.sexo,
    instituicao: payload.instituicao,
    email: String(payload.email).trim(),
    password: payload.password,
    role,
  };
  const stored = readStoredUsers();
  stored.push(newUser);
  writeStoredUsers(stored);
  return { ok: true };
}
